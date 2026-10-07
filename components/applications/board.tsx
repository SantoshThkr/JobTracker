import Link from "next/link";
import { CLOSED_STATUSES, STATUS_LABELS, WORK_MODE_LABELS, type Status } from "@/lib/applications/constants";
import { formatDate } from "@/lib/applications/format";
import type { ApplicationSummary } from "@/lib/applications/service";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

type Column = { id: string; title: string; statuses: readonly Status[] };

// Rejected and withdrawn share one column: they're outcomes, not stages.
const COLUMNS: Column[] = [
  { id: "saved", title: STATUS_LABELS.saved, statuses: ["saved"] },
  { id: "applied", title: STATUS_LABELS.applied, statuses: ["applied"] },
  { id: "screening", title: STATUS_LABELS.screening, statuses: ["screening"] },
  { id: "interviewing", title: STATUS_LABELS.interviewing, statuses: ["interviewing"] },
  { id: "offer", title: STATUS_LABELS.offer, statuses: ["offer"] },
  { id: "closed", title: "Closed", statuses: CLOSED_STATUSES },
];

export function Board({ applications, today }: { applications: ApplicationSummary[]; today: Date }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {COLUMNS.map((column) => {
        const items = applications.filter((app) => column.statuses.includes(app.status));
        const headingId = `column-${column.id}`;
        return (
          <section key={column.id} aria-labelledby={headingId} className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3">
            <h3 id={headingId} className="flex items-center justify-between text-sm font-semibold">
              {column.title}
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <span className="sr-only">Count: </span>
                {items.length}
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">Nothing here.</p>
            ) : (
              <ul className="grid gap-2">
                {items.map((app) => (
                  <li key={app.id}>
                    <ApplicationCard app={app} today={today} showStatus={column.id === "closed"} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ApplicationCard({ app, today, showStatus }: { app: ApplicationSummary; today: Date; showStatus: boolean }) {
  const meta = [app.location, app.workMode && WORK_MODE_LABELS[app.workMode]].filter(Boolean).join(" · ");
  const followUpDue = app.nextFollowUpAt && app.nextFollowUpAt <= today && !CLOSED_STATUSES.includes(app.status);

  return (
    <Link
      href={`/dashboard/applications/${app.id}`}
      className="grid gap-1 rounded-lg border bg-card p-3 text-sm shadow-xs transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="font-medium">{app.company}</span>
      <span className="text-muted-foreground">{app.title}</span>
      {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {showStatus && <StatusBadge status={app.status} />}
        {app.appliedAt && <span>Applied {formatDate(app.appliedAt)}</span>}
        {app.nextFollowUpAt && !CLOSED_STATUSES.includes(app.status) && (
          <span className={cn(followUpDue && "font-medium text-amber-700 dark:text-amber-400")}>
            Follow up {formatDate(app.nextFollowUpAt)}
          </span>
        )}
      </span>
    </Link>
  );
}
