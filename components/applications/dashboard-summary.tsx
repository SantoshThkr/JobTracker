import Link from "next/link";
import { STALE_AFTER_DAYS } from "@/lib/applications/constants";
import { formatDate } from "@/lib/applications/format";
import type { DashboardMetrics, FunnelStep } from "@/lib/applications/metrics";

function percent(step: FunnelStep) {
  return step.rate === null ? "—" : `${Math.round(step.rate * 100)}%`;
}

export function DashboardSummary({ metrics }: { metrics: DashboardMetrics }) {
  const { funnel } = metrics;
  const tiles = [
    { label: "Tracking", value: String(metrics.total), detail: `${metrics.open} open` },
    { label: "Submitted", value: String(funnel.submitted), detail: "have an applied date" },
    { label: "Screened", value: String(funnel.screened.count), detail: `${percent(funnel.screened)} of submitted` },
    { label: "Interviewed", value: String(funnel.interviewed.count), detail: `${percent(funnel.interviewed)} of submitted` },
    { label: "Offers", value: String(funnel.offered.count), detail: `${percent(funnel.offered)} of submitted` },
  ];

  return (
    <div className="grid gap-6">
      <section aria-labelledby="summary-heading" className="grid gap-2">
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-xl border bg-card p-4">
              <dt className="text-sm text-muted-foreground">{tile.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</dd>
              <dd className="text-xs text-muted-foreground">{tile.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Each stage counts submitted applications that ever reached it or a later stage, including ones that were rejected
          afterwards.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <AttentionList
          title="Follow-ups due"
          empty="Nothing due. Set a follow-up date on an application to be reminded here."
          items={metrics.followUpsDue.map((item) => ({
            id: item.id,
            company: item.company,
            title: item.title,
            note: item.overdue ? `Overdue since ${formatDate(item.dueAt)}` : "Due today",
            urgent: item.overdue,
          }))}
        />
        <AttentionList
          title={`No response in ${STALE_AFTER_DAYS}+ days`}
          empty={`Nothing has been waiting in Applied for more than ${STALE_AFTER_DAYS} days.`}
          items={metrics.awaitingResponse.map((item) => ({
            id: item.id,
            company: item.company,
            title: item.title,
            note: `${item.days} days in Applied`,
            urgent: false,
          }))}
        />
      </div>
    </div>
  );
}

const ATTENTION_LIMIT = 5;

function AttentionList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; company: string; title: string; note: string; urgent: boolean }>;
}) {
  const shown = items.slice(0, ATTENTION_LIMIT);
  const headingId = `attention-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card p-4">
      <h2 id={headingId} className="flex items-center justify-between text-sm font-semibold">
        {title}
        {items.length > 0 && <span className="text-muted-foreground tabular-nums">{items.length}</span>}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y">
          {shown.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/applications/${item.id}`}
                className="flex items-baseline justify-between gap-3 py-2 text-sm hover:underline focus-visible:underline"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{item.company}</span>
                  <span className="text-muted-foreground"> · {item.title}</span>
                </span>
                <span className={item.urgent ? "shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400" : "shrink-0 text-xs text-muted-foreground"}>
                  {item.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {items.length > ATTENTION_LIMIT && (
        <p className="mt-2 text-xs text-muted-foreground">And {items.length - ATTENTION_LIMIT} more.</p>
      )}
    </section>
  );
}
