// Shared by server and client code: keep this module free of server-only imports.

export const STATUSES = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// Reaching any of these means an application was submitted (or the company
// reached out first). The first move into one of them stamps `appliedAt`.
export const SUBMITTED_STATUSES: readonly Status[] = [
  "applied",
  "screening",
  "interviewing",
  "offer",
];

export const CLOSED_STATUSES: readonly Status[] = ["rejected", "withdrawn"];

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

// An application sitting in "applied" this long without a status change is
// flagged on the dashboard as needing a follow-up or a decision.
export const STALE_AFTER_DAYS = 14;

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isWorkMode(value: unknown): value is WorkMode {
  return typeof value === "string" && (WORK_MODES as readonly string[]).includes(value);
}

export function isSubmittedStatus(status: Status) {
  return SUBMITTED_STATUSES.includes(status);
}

export function isClosedStatus(status: Status) {
  return CLOSED_STATUSES.includes(status);
}
