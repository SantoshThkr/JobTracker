import "server-only";
import mongoose, { type QueryFilter, type UpdateQuery } from "mongoose";
import connectDB from "@/lib/db";
import { isSubmittedStatus, type Status, type WorkMode } from "./constants";
import { escapeRegExp, type ApplicationFilters } from "./filters";
import type { MetricsApplication } from "./metrics";
import { Application, type ApplicationRecord, type StatusChange } from "./model";
import type { ApplicationInput, NewApplicationInput } from "./schema";
import { jobUrlKey } from "./url";

// Every function takes the signed-in user's id from the caller (resolved from
// the session, never from request input) and includes it in every query, so
// an id belonging to another user behaves exactly like an id that doesn't exist.

export class ApplicationNotFoundError extends Error {
  constructor() {
    super("Application not found");
    this.name = "ApplicationNotFoundError";
  }
}

export class DuplicateApplicationError extends Error {
  constructor(readonly existingId: string | undefined) {
    super("This job posting is already tracked");
    this.name = "DuplicateApplicationError";
  }
}

/** The application changed after the client loaded it. */
export class StaleApplicationError extends Error {
  constructor() {
    super("Application was changed elsewhere");
    this.name = "StaleApplicationError";
  }
}

export type ApplicationSummary = {
  id: string;
  company: string;
  title: string;
  status: Status;
  location?: string;
  workMode?: WorkMode;
  appliedAt?: Date;
  nextFollowUpAt?: Date;
  statusChangedAt: Date;
  updatedAt: Date;
};

export type ApplicationDetail = ApplicationSummary & {
  url?: string;
  salary?: string;
  notes?: string;
  createdAt: Date;
  history: StatusChange[];
};

export const LIST_LIMIT = 500;

const SUMMARY_FIELDS =
  "company title status location workMode appliedAt nextFollowUpAt statusChangedAt updatedAt";

// Fields the edit form owns. A blank optional field means "clear it".
const OPTIONAL_FIELDS = ["url", "location", "workMode", "salary", "appliedAt", "nextFollowUpAt", "notes"] as const;

type SummaryRecord = Pick<ApplicationRecord, "_id" | "company" | "title" | "status" | "statusChangedAt" | "updatedAt"> &
  Partial<Pick<ApplicationRecord, "location" | "workMode" | "appliedAt" | "nextFollowUpAt">>;

function toSummary(doc: SummaryRecord): ApplicationSummary {
  return {
    id: doc._id.toString(),
    company: doc.company,
    title: doc.title,
    status: doc.status,
    location: doc.location,
    workMode: doc.workMode,
    appliedAt: doc.appliedAt,
    nextFollowUpAt: doc.nextFollowUpAt,
    statusChangedAt: doc.statusChangedAt,
    updatedAt: doc.updatedAt,
  };
}

function toDetail(doc: ApplicationRecord): ApplicationDetail {
  return {
    ...toSummary(doc),
    url: doc.url,
    salary: doc.salary,
    notes: doc.notes,
    createdAt: doc.createdAt,
    history: doc.history.map(({ from, to, at }) => ({ from: from ?? null, to, at })),
  };
}

// Rejects malformed ids up front so they read as "not found" instead of
// surfacing a CastError from the driver.
function isApplicationId(id: string) {
  return /^[0-9a-f]{24}$/i.test(id);
}

function urlKeyFor(url: string | undefined) {
  return url ? jobUrlKey(new URL(url)) : undefined;
}

function isDuplicateKeyError(error: unknown) {
  return error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
}

async function findDuplicateId(userId: string, urlKey: string | undefined) {
  if (!urlKey) return undefined;
  const existing = await Application.findOne({ userId, urlKey }, { _id: 1 }).lean();
  return existing?._id.toString();
}

export async function createApplication(userId: string, input: NewApplicationInput, now = new Date()) {
  await connectDB();
  const { status, ...fields } = input;
  const urlKey = urlKeyFor(fields.url);
  try {
    const created = await Application.create({
      ...fields,
      userId,
      urlKey,
      status,
      appliedAt: fields.appliedAt ?? (isSubmittedStatus(status) ? now : undefined),
      statusChangedAt: now,
      history: [{ from: null, to: status, at: now }],
    });
    return created._id.toString();
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new DuplicateApplicationError(await findDuplicateId(userId, urlKey));
    throw error;
  }
}

/**
 * Replaces the editable fields. `expectedUpdatedAt` is the version the form
 * was rendered from; if the application changed since then (another tab, a
 * status change) the update is refused instead of silently overwriting it.
 */
export async function updateApplication(userId: string, id: string, input: ApplicationInput, expectedUpdatedAt: Date) {
  if (!isApplicationId(id)) throw new ApplicationNotFoundError();
  await connectDB();

  const urlKey = urlKeyFor(input.url);
  const $set: Record<string, unknown> = { company: input.company, title: input.title };
  const $unset: Record<string, 1> = {};
  for (const field of OPTIONAL_FIELDS) {
    if (input[field] === undefined) $unset[field] = 1;
    else $set[field] = input[field];
  }
  if (urlKey) $set.urlKey = urlKey;
  else $unset.urlKey = 1;

  let matched: number;
  try {
    const result = await Application.updateOne(
      { _id: id, userId, updatedAt: expectedUpdatedAt },
      { $set, $unset },
      { runValidators: true }
    );
    matched = result.matchedCount;
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new DuplicateApplicationError(await findDuplicateId(userId, urlKey));
    throw error;
  }

  if (matched === 0) {
    const exists = await Application.exists({ _id: id, userId });
    throw exists ? new StaleApplicationError() : new ApplicationNotFoundError();
  }
}

/**
 * Moves an application from `from` to `to` as a compare-and-set on the
 * current status, appending to the history in the same atomic update.
 *
 * Any status can move to any other: real searches skip stages (a recruiter
 * reaches out and you go straight to a screen) and people fix misclicks.
 * Integrity comes from the history log and the compare-and-set, not from
 * blocking moves.
 *
 * Returns "unchanged" when the application is already in `to`, which makes a
 * repeated submission (double click, retry) a no-op instead of a second
 * history entry.
 */
export async function changeStatus(userId: string, id: string, from: Status, to: Status, now = new Date()) {
  if (!isApplicationId(id)) throw new ApplicationNotFoundError();
  await connectDB();
  if (from === to) {
    if (!(await Application.exists({ _id: id, userId }))) throw new ApplicationNotFoundError();
    return "unchanged" as const;
  }

  const update: UpdateQuery<ApplicationRecord> = {
    $set: { status: to, statusChangedAt: now },
    $push: { history: { from, to, at: now } },
  };
  // $min sets the field when it is missing and otherwise keeps the earlier
  // date, so only the first move into a submitted stage stamps appliedAt.
  if (isSubmittedStatus(to)) update.$min = { appliedAt: now };

  const result = await Application.updateOne({ _id: id, userId, status: from }, update, { runValidators: true });
  if (result.matchedCount === 1) return "changed" as const;

  const current = await Application.findOne({ _id: id, userId }, { status: 1 }).lean();
  if (!current) throw new ApplicationNotFoundError();
  if (current.status === to) return "unchanged" as const;
  throw new StaleApplicationError();
}

/** Returns false when there was nothing to delete, so retries are harmless. */
export async function deleteApplication(userId: string, id: string) {
  if (!isApplicationId(id)) return false;
  await connectDB();
  const result = await Application.deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
}

export async function getApplication(userId: string, id: string): Promise<ApplicationDetail | null> {
  if (!isApplicationId(id)) return null;
  await connectDB();
  const doc = await Application.findOne({ _id: id, userId }).lean<ApplicationRecord>();
  return doc ? toDetail(doc) : null;
}

export async function listApplications(userId: string, filters: ApplicationFilters = {}) {
  await connectDB();
  const query: QueryFilter<ApplicationRecord> = { userId };
  if (filters.status) query.status = filters.status;
  if (filters.workMode) query.workMode = filters.workMode;
  if (filters.q) {
    // Escaped so user input is matched literally, never interpreted as a pattern.
    const pattern = new RegExp(escapeRegExp(filters.q), "i");
    query.$or = [{ company: pattern }, { title: pattern }, { location: pattern }];
  }

  const docs = await Application.find(query)
    .select(SUMMARY_FIELDS)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(LIST_LIMIT + 1)
    .lean<SummaryRecord[]>();

  return { items: docs.slice(0, LIST_LIMIT).map(toSummary), truncated: docs.length > LIST_LIMIT };
}

/** Loads the fields the dashboard metrics need for all of a user's applications. */
export async function getMetricsInput(userId: string): Promise<MetricsApplication[]> {
  await connectDB();
  const docs = await Application.find({ userId })
    .select("company title status appliedAt nextFollowUpAt statusChangedAt history.to")
    .lean<Array<SummaryRecord & { history: Array<Pick<StatusChange, "to">> }>>();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    company: doc.company,
    title: doc.title,
    status: doc.status,
    appliedAt: doc.appliedAt,
    nextFollowUpAt: doc.nextFollowUpAt,
    statusChangedAt: doc.statusChangedAt,
    reached: doc.history.map((change) => change.to),
  }));
}
