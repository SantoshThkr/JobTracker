import { STALE_AFTER_DAYS, STATUSES, isClosedStatus, type Status } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export type MetricsApplication = {
  id: string;
  company: string;
  title: string;
  status: Status;
  appliedAt?: Date;
  nextFollowUpAt?: Date;
  statusChangedAt: Date;
  // Every status the application has ever had, from its history.
  reached: Status[];
};

export type FunnelStep = { count: number; rate: number | null };

export type DashboardMetrics = {
  total: number;
  byStatus: Record<Status, number>;
  // Submitted = has an applied date. Each later step counts submitted
  // applications that ever reached that stage or a later one, so moving an
  // application back (or closing it) does not erase progress it made.
  funnel: {
    submitted: number;
    screened: FunnelStep;
    interviewed: FunnelStep;
    offered: FunnelStep;
  };
  // Not rejected or withdrawn.
  open: number;
  followUpsDue: Array<{ id: string; company: string; title: string; dueAt: Date; overdue: boolean }>;
  // Still "applied" with no status change for STALE_AFTER_DAYS and no upcoming follow-up.
  awaitingResponse: Array<{ id: string; company: string; title: string; days: number }>;
};

const STAGE_RANK: Partial<Record<Status, number>> = { screening: 1, interviewing: 2, offer: 3 };

function furthestStage(app: MetricsApplication) {
  return Math.max(0, ...[app.status, ...app.reached].map((status) => STAGE_RANK[status] ?? 0));
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function step(count: number, submitted: number): FunnelStep {
  return { count, rate: submitted > 0 ? count / submitted : null };
}

export function computeDashboardMetrics(apps: MetricsApplication[], now: Date): DashboardMetrics {
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>;
  for (const app of apps) byStatus[app.status] += 1;

  const submittedApps = apps.filter((app) => app.appliedAt);
  const stages = submittedApps.map(furthestStage);
  const submitted = submittedApps.length;

  // Follow-up dates are calendar days stored at midnight UTC: a follow-up is
  // due once its day has started.
  const today = startOfUtcDay(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const staleBefore = now.getTime() - STALE_AFTER_DAYS * DAY_MS;

  const followUpsDue = apps
    .filter((app) => app.nextFollowUpAt && app.nextFollowUpAt < tomorrow && !isClosedStatus(app.status))
    .sort((a, b) => a.nextFollowUpAt!.getTime() - b.nextFollowUpAt!.getTime())
    .map((app) => ({
      id: app.id,
      company: app.company,
      title: app.title,
      dueAt: app.nextFollowUpAt!,
      overdue: app.nextFollowUpAt! < today,
    }));

  const awaitingResponse = apps
    .filter(
      (app) =>
        app.status === "applied" &&
        app.statusChangedAt.getTime() <= staleBefore &&
        !(app.nextFollowUpAt && app.nextFollowUpAt >= today)
    )
    .sort((a, b) => a.statusChangedAt.getTime() - b.statusChangedAt.getTime())
    .map((app) => ({
      id: app.id,
      company: app.company,
      title: app.title,
      days: Math.floor((now.getTime() - app.statusChangedAt.getTime()) / DAY_MS),
    }));

  return {
    total: apps.length,
    byStatus,
    funnel: {
      submitted,
      screened: step(stages.filter((rank) => rank >= 1).length, submitted),
      interviewed: step(stages.filter((rank) => rank >= 2).length, submitted),
      offered: step(stages.filter((rank) => rank >= 3).length, submitted),
    },
    open: apps.filter((app) => !isClosedStatus(app.status)).length,
    followUpsDue,
    awaitingResponse,
  };
}
