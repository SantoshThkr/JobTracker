import mongoose, { Schema, type Model, type Types } from "mongoose";
import { STATUSES, WORK_MODES, type Status, type WorkMode } from "./constants";

export interface StatusChange {
  from: Status | null;
  to: Status;
  at: Date;
}

export interface ApplicationRecord {
  _id: Types.ObjectId;
  // better-auth user id. Every query filters on it; it is never taken from client input.
  userId: string;
  company: string;
  title: string;
  url?: string;
  // Normalized form of `url`, unique per user, used to detect duplicate postings.
  urlKey?: string;
  location?: string;
  workMode?: WorkMode;
  salary?: string;
  notes?: string;
  status: Status;
  appliedAt?: Date;
  nextFollowUpAt?: Date;
  statusChangedAt: Date;
  // Append-only log of status changes, including the initial status.
  history: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

const statusChangeSchema = new Schema<StatusChange>(
  {
    from: { type: String, enum: STATUSES, default: null },
    to: { type: String, enum: STATUSES, required: true },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const applicationSchema = new Schema<ApplicationRecord>(
  {
    userId: { type: String, required: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, maxlength: 2048 },
    urlKey: { type: String },
    location: { type: String, trim: true, maxlength: 120 },
    workMode: { type: String, enum: WORK_MODES },
    salary: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, maxlength: 5000 },
    status: { type: String, enum: STATUSES, required: true, default: "saved" },
    appliedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    statusChangedAt: { type: Date, required: true },
    history: { type: [statusChangeSchema], default: [] },
  },
  { timestamps: true }
);

// Board and dashboard queries: one user's applications, most recently updated
// first (_id breaks ties so the order is stable).
applicationSchema.index({ userId: 1, updatedAt: -1, _id: -1 });
// One application per job posting per user. The unique index, not the
// application code, is what prevents duplicates when two requests race.
applicationSchema.index(
  { userId: 1, urlKey: 1 },
  { unique: true, partialFilterExpression: { urlKey: { $type: "string" } } }
);

// Reuse the compiled model across hot reloads in development.
export const Application: Model<ApplicationRecord> =
  (mongoose.models.Application as Model<ApplicationRecord> | undefined) ??
  mongoose.model<ApplicationRecord>("Application", applicationSchema);
