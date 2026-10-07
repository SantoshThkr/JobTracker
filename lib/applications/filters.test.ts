import { describe, expect, it } from "vitest";
import { escapeRegExp, hasFilters, parseFilters } from "./filters";

describe("parseFilters", () => {
  it("reads valid filters from the query string", () => {
    expect(parseFilters({ q: "  acme ", status: "applied", mode: "remote" })).toEqual({
      q: "acme",
      status: "applied",
      workMode: "remote",
    });
  });

  it("ignores unknown values instead of passing them to the database", () => {
    expect(parseFilters({ status: "hired", mode: "moon", q: "   " })).toEqual({});
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseFilters({ status: ["offer", "saved"] })).toEqual({ status: "offer" });
  });

  it("caps the search length", () => {
    expect(parseFilters({ q: "a".repeat(500) }).q).toHaveLength(100);
  });

  it("reports whether any filter is active", () => {
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ q: "x" })).toBe(true);
  });
});

describe("escapeRegExp", () => {
  it("makes user input match literally", () => {
    const pattern = new RegExp(escapeRegExp("C++ (Senior) $100k.*"), "i");
    expect(pattern.test("c++ (senior) $100k.*")).toBe(true);
    expect(pattern.test("C (Senior) $100k")).toBe(false);
  });
});
