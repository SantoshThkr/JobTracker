import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Board } from "@/components/applications/board";
import { DashboardSummary } from "@/components/applications/dashboard-summary";
import { Filters } from "@/components/applications/filters";
import { buttonVariants } from "@/components/ui/button";
import { hasFilters, parseFilters } from "@/lib/applications/filters";
import { computeDashboardMetrics } from "@/lib/applications/metrics";
import { LIST_LIMIT, getMetricsInput, listApplications } from "@/lib/applications/service";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard · JobTracker",
};

export default async function DashBoard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [list, metricsInput] = await Promise.all([listApplications(user.id, filters), getMetricsInput(user.id)]);
  const metrics = computeDashboardMetrics(metricsInput, now);
  const filtered = hasFilters(filters);

  return (
    <main className="container mx-auto grid gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your job search</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Link href="/dashboard/applications/new" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Add application
        </Link>
      </header>

      {metrics.total === 0 ? (
        <section className="grid justify-items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No applications yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Add a job you&apos;re interested in or have already applied to. Move it through the stages as you hear back,
            and JobTracker keeps the history and reminds you when to follow up.
          </p>
          <Link href="/dashboard/applications/new" className={buttonVariants({ size: "lg" })}>
            Add your first application
          </Link>
        </section>
      ) : (
        <>
          <DashboardSummary metrics={metrics} />

          <section aria-labelledby="board-heading" className="grid gap-4">
            <h2 id="board-heading" className="text-lg font-semibold">
              Pipeline
            </h2>
            <Filters filters={filters} />
            {filtered && (
              <p className="text-sm text-muted-foreground" role="status">
                {list.items.length === 0
                  ? "No applications match these filters."
                  : `Showing ${list.items.length} of ${metrics.total} applications.`}
              </p>
            )}
            {list.truncated && (
              <p className="text-sm text-muted-foreground" role="status">
                Showing the {LIST_LIMIT} most recently updated applications. Use search or filters to find older ones.
              </p>
            )}
            <Board applications={list.items} today={today} />
          </section>
        </>
      )}
    </main>
  );
}
