import { describe, expect, it } from "vitest";
import { applicationInputSchema, newApplicationSchema, readApplicationForm, toFieldErrors } from "./schema";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.set(name, value);
  return data;
}

describe("newApplicationSchema", () => {
  it("trims text, drops blank optional fields and defaults the status", () => {
    const result = newApplicationSchema.safeParse(
      readApplicationForm(
        form({ company: "  Acme  ", title: " Engineer ", url: "", location: "  ", workMode: "", salary: "", notes: "" })
      )
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ company: "Acme", title: "Engineer", status: "saved" });
  });

  it("requires company and role", () => {
    const result = newApplicationSchema.safeParse(readApplicationForm(form({ company: "   " })));
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)).toEqual({ company: "Company is required.", title: "Role is required." });
  });

  it("only accepts http(s) job links", () => {
    const result = newApplicationSchema.safeParse({ company: "Acme", title: "Eng", url: "javascript:alert(1)" });
    expect(toFieldErrors(result.error!)).toEqual({ url: "Job link must start with http:// or https://." });
  });

  it("rejects unknown statuses and work arrangements", () => {
    const result = newApplicationSchema.safeParse({ company: "Acme", title: "Eng", status: "hired", workMode: "moon" });
    const errors = toFieldErrors(result.error!);
    expect(errors.status).toBe("Choose a valid status.");
    expect(errors.workMode).toBe("Choose a valid work arrangement.");
  });

  it("enforces length limits", () => {
    const result = newApplicationSchema.safeParse({ company: "x".repeat(121), title: "Eng", notes: "n".repeat(5001) });
    const errors = toFieldErrors(result.error!);
    expect(errors.company).toBe("Company must be 120 characters or fewer.");
    expect(errors.notes).toBe("Notes must be 5000 characters or fewer.");
  });

  it("parses date inputs as UTC calendar days", () => {
    const result = newApplicationSchema.safeParse({ company: "Acme", title: "Eng", nextFollowUpAt: "2030-01-31" });
    expect(result.data?.nextFollowUpAt?.toISOString()).toBe("2030-01-31T00:00:00.000Z");
  });

  it.each(["2026-02-30", "31/01/2026", "tomorrow"])("rejects the invalid date %j", (value) => {
    const result = newApplicationSchema.safeParse({ company: "Acme", title: "Eng", nextFollowUpAt: value });
    expect(toFieldErrors(result.error!)).toEqual({ nextFollowUpAt: "Follow-up date must be a valid date." });
  });

  it("rejects an applied date in the future", () => {
    const nextYear = new Date().getUTCFullYear() + 1;
    const result = newApplicationSchema.safeParse({ company: "Acme", title: "Eng", appliedAt: `${nextYear}-01-01` });
    expect(toFieldErrors(result.error!)).toEqual({ appliedAt: "Applied date can't be in the future." });
  });
});

describe("applicationInputSchema", () => {
  it("does not accept a status (status changes go through changeStatus)", () => {
    const result = applicationInputSchema.safeParse({ company: "Acme", title: "Eng", status: "offer" });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("status");
  });
});

describe("readApplicationForm", () => {
  it("ignores fields it doesn't know about, including ownership fields", () => {
    const values = readApplicationForm(form({ company: "Acme", userId: "someone-else", _id: "x", $where: "1" }));
    expect(values).toEqual({ company: "Acme" });
  });
});
