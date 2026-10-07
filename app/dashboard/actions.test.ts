import { beforeEach, describe, expect, it, vi } from "vitest";

// Server Actions are public POST endpoints. These tests pin down that each one
// authenticates on its own and acts only as the signed-in user.

const session = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("@/lib/auth/session", () => session);

vi.mock("@/lib/applications/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/applications/service")>();
  return {
    ...actual,
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    changeStatus: vi.fn(),
    deleteApplication: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const service = await import("@/lib/applications/service");
const actions = await import("./actions");

const ALICE = { id: "user-alice", name: "Alice", email: "alice@example.com" };

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  session.requireUser.mockResolvedValue(ALICE);
});

describe("authentication", () => {
  beforeEach(() => {
    session.requireUser.mockImplementation(() => {
      throw new RedirectError("/sign-in");
    });
  });

  it.each([
    ["create", () => actions.createApplicationAction({}, form({ company: "Acme", title: "Eng" }))],
    ["update", () => actions.updateApplicationAction("a".repeat(24), {}, form({ company: "Acme", title: "Eng" }))],
    ["change status", () => actions.changeStatusAction("a".repeat(24), {}, form({ from: "saved", to: "applied" }))],
    ["delete", () => actions.deleteApplicationAction("a".repeat(24))],
  ])("%s redirects to sign-in without touching data when signed out", async (_name, run) => {
    await expect(run()).rejects.toMatchObject({ url: "/sign-in" });
    expect(service.createApplication).not.toHaveBeenCalled();
    expect(service.updateApplication).not.toHaveBeenCalled();
    expect(service.changeStatus).not.toHaveBeenCalled();
    expect(service.deleteApplication).not.toHaveBeenCalled();
  });
});

describe("createApplicationAction", () => {
  it("creates the application for the session user, ignoring any userId in the form", async () => {
    vi.mocked(service.createApplication).mockResolvedValue("b".repeat(24));

    await expect(
      actions.createApplicationAction({}, form({ company: "Acme", title: "Eng", userId: "user-mallory" }))
    ).rejects.toMatchObject({ url: `/dashboard/applications/${"b".repeat(24)}` });

    expect(service.createApplication).toHaveBeenCalledWith(ALICE.id, { company: "Acme", title: "Eng", status: "saved" });
  });

  it("returns field errors and keeps the input when validation fails", async () => {
    const state = await actions.createApplicationAction({}, form({ company: "Acme", url: "javascript:alert(1)" }));
    expect(state.fieldErrors).toEqual({
      title: "Role is required.",
      url: "Job link must start with http:// or https://.",
    });
    expect(state.values).toMatchObject({ company: "Acme", url: "javascript:alert(1)" });
    expect(service.createApplication).not.toHaveBeenCalled();
  });

  it("explains a duplicate and links to the existing application", async () => {
    vi.mocked(service.createApplication).mockRejectedValue(new service.DuplicateApplicationError("c".repeat(24)));
    const state = await actions.createApplicationAction({}, form({ company: "Acme", title: "Eng", url: "https://x.dev/1" }));
    expect(state).toMatchObject({ duplicateId: "c".repeat(24), fieldErrors: { url: expect.any(String) } });
  });

  it("returns a generic message for unexpected failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(service.createApplication).mockRejectedValue(new Error("connection reset"));
    const state = await actions.createApplicationAction({}, form({ company: "Acme", title: "Eng" }));
    expect(state.message).toBe("Something went wrong while saving. Please try again.");
    expect(state.message).not.toContain("connection reset");
    consoleError.mockRestore();
  });
});

describe("updateApplicationAction", () => {
  it("refuses to save without the version the form was loaded from", async () => {
    const state = await actions.updateApplicationAction("a".repeat(24), {}, form({ company: "Acme", title: "Eng" }));
    expect(state.message).toBeDefined();
    expect(service.updateApplication).not.toHaveBeenCalled();
  });

  it("tells the user when the application changed in the meantime", async () => {
    vi.mocked(service.updateApplication).mockRejectedValue(new service.StaleApplicationError());
    const state = await actions.updateApplicationAction(
      "a".repeat(24),
      {},
      form({ company: "Acme", title: "Eng", notes: "my edits", version: "2026-10-01T10:00:00.000Z" })
    );
    expect(state.message).toMatch(/changed in another tab/);
    expect(state.values?.notes).toBe("my edits");
    expect(service.updateApplication).toHaveBeenCalledWith(
      ALICE.id,
      "a".repeat(24),
      { company: "Acme", title: "Eng", notes: "my edits" },
      new Date("2026-10-01T10:00:00.000Z")
    );
  });
});

describe("changeStatusAction", () => {
  it("rejects statuses that don't exist", async () => {
    const state = await actions.changeStatusAction("a".repeat(24), {}, form({ from: "saved", to: "hired" }));
    expect(state.message).toBe("Choose a valid status.");
    expect(service.changeStatus).not.toHaveBeenCalled();
  });

  it("passes the status the user saw so stale changes can be detected", async () => {
    vi.mocked(service.changeStatus).mockResolvedValue("changed");
    const state = await actions.changeStatusAction("a".repeat(24), {}, form({ from: "applied", to: "screening" }));
    expect(state).toEqual({});
    expect(service.changeStatus).toHaveBeenCalledWith(ALICE.id, "a".repeat(24), "applied", "screening");
  });

  it("reports a conflicting change instead of overwriting it", async () => {
    vi.mocked(service.changeStatus).mockRejectedValue(new service.StaleApplicationError());
    const state = await actions.changeStatusAction("a".repeat(24), {}, form({ from: "applied", to: "rejected" }));
    expect(state.message).toMatch(/changed somewhere else/);
  });
});
