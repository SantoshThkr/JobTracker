import { describe, expect, it } from "vitest";
import type { Status } from "./constants";
import { computeDashboardMetrics, type MetricsApplication } from "./metrics";

const NOW = new Date("2026-10-07T15:00:00.000Z");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

let nextId = 0;
function app(status: Status, overrides: Partial<MetricsApplication> = {}): MetricsApplication {
  nextId += 1;
  return {
    id: `app-${nextId}`,
    company: `Company ${nextId}`,
    title: "Engineer",
    status,
    statusChangedAt: NOW,
    reached: [status],
    ...overrides,
  };
}

describe("computeDashboardMetrics", () => {
  it("handles an empty account without dividing by zero", () => {
    const metrics = computeDashboardMetrics([], NOW);
    expect(metrics.total).toBe(0);
    expect(metrics.funnel.submitted).toBe(0);
    expect(metrics.funnel.interviewed).toEqual({ count: 0, rate: null });
  });

  it("counts applications per status and open applications", () => {
    const metrics = computeDashboardMetrics(
      [app("saved"), app("applied"), app("applied"), app("rejected"), app("withdrawn")],
      NOW
    );
    expect(metrics.byStatus).toMatchObject({ saved: 1, applied: 2, rejected: 1, withdrawn: 1, offer: 0 });
    expect(metrics.total).toBe(5);
    expect(metrics.open).toBe(3);
  });

  it("builds the funnel from the furthest stage reached, not the current status", () => {
    const applied = day("2026-09-01");
    const metrics = computeDashboardMetrics(
      [
        app("saved"), // not submitted: excluded from every rate
        app("applied", { appliedAt: applied }),
        app("rejected", { appliedAt: applied, reached: ["applied", "rejected"] }),
        // Rejected after a screen still counts as screened.
        app("rejected", { appliedAt: applied, reached: ["applied", "screening", "rejected"] }),
        // Moved back from interviewing to screening: the interview still happened.
        app("screening", { appliedAt: applied, reached: ["applied", "screening", "interviewing", "screening"] }),
        // Added straight at the offer stage (backfilled) counts for every earlier stage.
        app("offer", { appliedAt: applied, reached: ["offer"] }),
      ],
      NOW
    );
    expect(metrics.funnel.submitted).toBe(5);
    expect(metrics.funnel.screened).toEqual({ count: 3, rate: 3 / 5 });
    expect(metrics.funnel.interviewed).toEqual({ count: 2, rate: 2 / 5 });
    expect(metrics.funnel.offered).toEqual({ count: 1, rate: 1 / 5 });
  });

  it("lists follow-ups due today or earlier, oldest first, skipping closed applications", () => {
    const metrics = computeDashboardMetrics(
      [
        app("applied", { company: "Today", nextFollowUpAt: day("2026-10-07") }),
        app("interviewing", { company: "Overdue", nextFollowUpAt: day("2026-10-01") }),
        app("applied", { company: "Tomorrow", nextFollowUpAt: day("2026-10-08") }),
        app("rejected", { company: "Closed", nextFollowUpAt: day("2026-10-01") }),
      ],
      NOW
    );
    expect(metrics.followUpsDue.map((item) => [item.company, item.overdue])).toEqual([
      ["Overdue", true],
      ["Today", false],
    ]);
  });

  it("flags applications waiting in Applied for 14+ days unless a follow-up is already planned", () => {
    const metrics = computeDashboardMetrics(
      [
        app("applied", { company: "Stale", statusChangedAt: new Date("2026-09-20T15:00:00.000Z") }),
        app("applied", { company: "Exactly14", statusChangedAt: new Date("2026-09-23T15:00:00.000Z") }),
        app("applied", { company: "Recent", statusChangedAt: new Date("2026-09-30T15:00:00.000Z") }),
        app("applied", {
          company: "Planned",
          statusChangedAt: new Date("2026-09-01T15:00:00.000Z"),
          nextFollowUpAt: day("2026-10-10"),
        }),
        app("screening", { company: "Moved on", statusChangedAt: new Date("2026-09-01T15:00:00.000Z") }),
      ],
      NOW
    );
    expect(metrics.awaitingResponse).toEqual([
      expect.objectContaining({ company: "Stale", days: 17 }),
      expect.objectContaining({ company: "Exactly14", days: 14 }),
    ]);
  });
});
