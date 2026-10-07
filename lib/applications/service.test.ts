import { describe, expect, it } from "vitest";
import { useTestDatabase } from "@/test/mongo";
import { Application } from "./model";
import type { NewApplicationInput } from "./schema";
import {
  ApplicationNotFoundError,
  DuplicateApplicationError,
  StaleApplicationError,
  changeStatus,
  createApplication,
  deleteApplication,
  getApplication,
  getMetricsInput,
  listApplications,
  updateApplication,
} from "./service";

useTestDatabase();

const ALICE = "user-alice";
const BOB = "user-bob";
const T0 = new Date("2026-10-01T10:00:00.000Z");
const T1 = new Date("2026-10-02T10:00:00.000Z");
const T2 = new Date("2026-10-03T10:00:00.000Z");

function input(overrides: Partial<NewApplicationInput> = {}): NewApplicationInput {
  return { company: "Acme", title: "Frontend Engineer", status: "saved", ...overrides };
}

async function mustGet(userId: string, id: string) {
  const application = await getApplication(userId, id);
  if (!application) throw new Error("expected application to exist");
  return application;
}

describe("createApplication", () => {
  it("records the initial status in the history", async () => {
    const id = await createApplication(ALICE, input(), T0);
    const application = await mustGet(ALICE, id);
    expect(application.status).toBe("saved");
    expect(application.appliedAt).toBeUndefined();
    expect(application.statusChangedAt).toEqual(T0);
    expect(application.history).toEqual([{ from: null, to: "saved", at: T0 }]);
  });

  it("stamps appliedAt when created at a submitted stage, unless a date was given", async () => {
    const stamped = await mustGet(ALICE, await createApplication(ALICE, input({ status: "interviewing" }), T1));
    expect(stamped.appliedAt).toEqual(T1);

    const backfilled = await mustGet(
      ALICE,
      await createApplication(ALICE, input({ status: "applied", url: "https://example.com/2", appliedAt: T0 }), T1)
    );
    expect(backfilled.appliedAt).toEqual(T0);
  });

  it("refuses a second application for the same posting and points to the first", async () => {
    const firstId = await createApplication(ALICE, input({ url: "https://jobs.example.com/acme/42" }));
    const attempt = createApplication(
      ALICE,
      input({ url: "http://www.jobs.example.com/acme/42/?utm_source=newsletter" })
    );
    await expect(attempt).rejects.toBeInstanceOf(DuplicateApplicationError);
    await expect(attempt).rejects.toMatchObject({ existingId: firstId });
  });

  it("lets two concurrent submissions of the same posting create only one application", async () => {
    const results = await Promise.allSettled([
      createApplication(ALICE, input({ url: "https://jobs.example.com/race" })),
      createApplication(ALICE, input({ url: "https://jobs.example.com/race" })),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")[0]).toMatchObject({
      reason: expect.any(DuplicateApplicationError),
    });
    expect(await Application.countDocuments({ userId: ALICE })).toBe(1);
  });

  it("allows different users to track the same posting", async () => {
    await createApplication(ALICE, input({ url: "https://jobs.example.com/shared" }));
    await expect(createApplication(BOB, input({ url: "https://jobs.example.com/shared" }))).resolves.toEqual(
      expect.any(String)
    );
  });

  it("allows several applications without a link", async () => {
    await createApplication(ALICE, input());
    await createApplication(ALICE, input());
    expect(await Application.countDocuments({ userId: ALICE })).toBe(2);
  });
});

describe("ownership", () => {
  it("treats another user's application exactly like a missing one", async () => {
    const id = await createApplication(ALICE, input({ notes: "salary expectations: private" }));
    const { updatedAt } = await mustGet(ALICE, id);

    expect(await getApplication(BOB, id)).toBeNull();
    await expect(updateApplication(BOB, id, { company: "Hijacked", title: "x" }, updatedAt)).rejects.toBeInstanceOf(
      ApplicationNotFoundError
    );
    await expect(changeStatus(BOB, id, "saved", "rejected")).rejects.toBeInstanceOf(ApplicationNotFoundError);
    expect(await deleteApplication(BOB, id)).toBe(false);
    expect((await listApplications(BOB)).items).toEqual([]);
    expect(await getMetricsInput(BOB)).toEqual([]);

    const untouched = await mustGet(ALICE, id);
    expect(untouched.company).toBe("Acme");
    expect(untouched.status).toBe("saved");
    expect(untouched.notes).toBe("salary expectations: private");
  });

  it("treats malformed ids as not found instead of throwing a cast error", async () => {
    expect(await getApplication(ALICE, "not-an-id")).toBeNull();
    expect(await getApplication(ALICE, '{"$ne":null}')).toBeNull();
    await expect(changeStatus(ALICE, "nope", "saved", "applied")).rejects.toBeInstanceOf(ApplicationNotFoundError);
    expect(await deleteApplication(ALICE, "nope")).toBe(false);
  });
});

describe("changeStatus", () => {
  it("moves the status, appends history and stamps appliedAt once", async () => {
    const id = await createApplication(ALICE, input(), T0);

    expect(await changeStatus(ALICE, id, "saved", "applied", T1)).toBe("changed");
    expect(await changeStatus(ALICE, id, "applied", "screening", T2)).toBe("changed");

    const application = await mustGet(ALICE, id);
    expect(application.status).toBe("screening");
    expect(application.statusChangedAt).toEqual(T2);
    expect(application.appliedAt).toEqual(T1);
    expect(application.history.map(({ from, to }) => [from, to])).toEqual([
      [null, "saved"],
      ["saved", "applied"],
      ["applied", "screening"],
    ]);
  });

  it("keeps the original appliedAt when an application is reopened", async () => {
    const id = await createApplication(ALICE, input({ status: "applied" }), T0);
    await changeStatus(ALICE, id, "applied", "rejected", T1);
    await changeStatus(ALICE, id, "rejected", "interviewing", T2);
    expect((await mustGet(ALICE, id)).appliedAt).toEqual(T0);
  });

  it("allows skipping stages, e.g. a recruiter reaching out before you apply", async () => {
    const id = await createApplication(ALICE, input(), T0);
    expect(await changeStatus(ALICE, id, "saved", "screening", T1)).toBe("changed");
    expect((await mustGet(ALICE, id)).appliedAt).toEqual(T1);
  });

  it("does not stamp appliedAt when a saved job is withdrawn", async () => {
    const id = await createApplication(ALICE, input(), T0);
    await changeStatus(ALICE, id, "saved", "withdrawn", T1);
    expect((await mustGet(ALICE, id)).appliedAt).toBeUndefined();
  });

  it("makes a repeated submission a no-op instead of a second history entry", async () => {
    const id = await createApplication(ALICE, input(), T0);
    expect(await changeStatus(ALICE, id, "saved", "applied", T1)).toBe("changed");
    expect(await changeStatus(ALICE, id, "saved", "applied", T2)).toBe("unchanged");
    expect((await mustGet(ALICE, id)).history).toHaveLength(2);
  });

  it("refuses a change based on a status that is no longer current", async () => {
    const id = await createApplication(ALICE, input({ status: "applied" }), T0);
    // Another tab moved it on.
    await changeStatus(ALICE, id, "applied", "interviewing", T1);
    // This tab still shows "applied" and tries to reject it.
    await expect(changeStatus(ALICE, id, "applied", "rejected", T2)).rejects.toBeInstanceOf(StaleApplicationError);
    expect((await mustGet(ALICE, id)).status).toBe("interviewing");
  });

  it("lets exactly one of two simultaneous conflicting changes win", async () => {
    const id = await createApplication(ALICE, input({ status: "interviewing" }), T0);
    const results = await Promise.allSettled([
      changeStatus(ALICE, id, "interviewing", "offer", T1),
      changeStatus(ALICE, id, "interviewing", "rejected", T1),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const application = await mustGet(ALICE, id);
    expect(application.history).toHaveLength(2);
    expect(application.history[1].to).toBe(application.status);
  });
});

describe("updateApplication", () => {
  it("replaces editable fields and clears blank optional ones", async () => {
    const id = await createApplication(
      ALICE,
      input({ location: "Berlin", salary: "€90k", url: "https://example.com/a", nextFollowUpAt: T2 })
    );
    const { updatedAt } = await mustGet(ALICE, id);

    await updateApplication(ALICE, id, { company: "Acme GmbH", title: "Staff Engineer", location: "Remote" }, updatedAt);

    const application = await mustGet(ALICE, id);
    expect(application).toMatchObject({ company: "Acme GmbH", title: "Staff Engineer", location: "Remote" });
    expect(application.salary).toBeUndefined();
    expect(application.url).toBeUndefined();
    expect(application.nextFollowUpAt).toBeUndefined();
    expect(application.status).toBe("saved");
    // The link was removed, so the posting can be added again.
    await expect(createApplication(ALICE, input({ url: "https://example.com/a" }))).resolves.toEqual(expect.any(String));
  });

  it("refuses to overwrite changes made after the form was loaded", async () => {
    const id = await createApplication(ALICE, input());
    const { updatedAt: loadedVersion } = await mustGet(ALICE, id);

    await updateApplication(ALICE, id, { company: "Acme", title: "Eng", notes: "written in tab A" }, loadedVersion);
    const staleSave = updateApplication(ALICE, id, { company: "Acme", title: "Eng", notes: "tab B" }, loadedVersion);

    await expect(staleSave).rejects.toBeInstanceOf(StaleApplicationError);
    expect((await mustGet(ALICE, id)).notes).toBe("written in tab A");
  });

  it("refuses a link that another of the user's applications already uses", async () => {
    const firstId = await createApplication(ALICE, input({ url: "https://example.com/taken" }));
    const id = await createApplication(ALICE, input({ url: "https://example.com/mine" }));
    const { updatedAt } = await mustGet(ALICE, id);

    const attempt = updateApplication(ALICE, id, { company: "Acme", title: "Eng", url: "https://example.com/taken/" }, updatedAt);
    await expect(attempt).rejects.toMatchObject({ existingId: firstId });
  });
});

describe("deleteApplication", () => {
  it("deletes once and treats a repeat as a no-op", async () => {
    const id = await createApplication(ALICE, input());
    expect(await deleteApplication(ALICE, id)).toBe(true);
    expect(await deleteApplication(ALICE, id)).toBe(false);
    expect(await getApplication(ALICE, id)).toBeNull();
  });
});

describe("listApplications", () => {
  it("filters by search text, status and work arrangement, newest first", async () => {
    const stripe = await createApplication(ALICE, input({ company: "Stripe", title: "Backend Engineer", workMode: "remote" }));
    await createApplication(ALICE, input({ company: "Shopify", title: "Frontend Engineer", location: "Toronto" }));
    const vercel = await createApplication(ALICE, input({ company: "Vercel", title: "Design Engineer", workMode: "remote" }));
    await changeStatus(ALICE, vercel, "saved", "applied");
    await createApplication(BOB, input({ company: "Stripe", title: "Backend Engineer" }));

    expect((await listApplications(ALICE)).items.map((app) => app.company)).toEqual(["Vercel", "Shopify", "Stripe"]);
    expect((await listApplications(ALICE, { q: "toronto" })).items.map((app) => app.company)).toEqual(["Shopify"]);
    expect((await listApplications(ALICE, { q: "ENGINEER", workMode: "remote" })).items.map((app) => app.id)).toEqual([
      vercel,
      stripe,
    ]);
    expect((await listApplications(ALICE, { status: "applied" })).items.map((app) => app.id)).toEqual([vercel]);
  });

  it("matches search text literally", async () => {
    await createApplication(ALICE, input({ company: "C++ Shop", title: "Engineer" }));
    await createApplication(ALICE, input({ company: "CCC", title: "Engineer" }));
    expect((await listApplications(ALICE, { q: "C++" })).items.map((app) => app.company)).toEqual(["C++ Shop"]);
    expect((await listApplications(ALICE, { q: ".*" })).items).toEqual([]);
  });
});

describe("getMetricsInput", () => {
  it("exposes every status an application has reached", async () => {
    const id = await createApplication(ALICE, input({ status: "applied" }), T0);
    await changeStatus(ALICE, id, "applied", "screening", T1);
    await changeStatus(ALICE, id, "screening", "rejected", T2);
    const [metrics] = await getMetricsInput(ALICE);
    expect(metrics).toMatchObject({ id, status: "rejected", appliedAt: T0, reached: ["applied", "screening", "rejected"] });
  });
});
