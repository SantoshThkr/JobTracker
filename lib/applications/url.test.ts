import { describe, expect, it } from "vitest";
import { jobUrlKey, parseHttpUrl } from "./url";

function key(raw: string) {
  const url = parseHttpUrl(raw);
  if (!url) throw new Error(`not a URL: ${raw}`);
  return jobUrlKey(url);
}

describe("parseHttpUrl", () => {
  it("accepts http and https links", () => {
    expect(parseHttpUrl("https://jobs.example.com/123")?.hostname).toBe("jobs.example.com");
    expect(parseHttpUrl("  http://example.com  ")?.protocol).toBe("http:");
  });

  it.each([
    "javascript:alert(document.cookie)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "mailto:hr@example.com",
    "ftp://example.com/file",
    "/relative/path",
    "example.com/jobs/1",
    "",
  ])("rejects %j", (raw) => {
    expect(parseHttpUrl(raw)).toBeNull();
  });
});

describe("jobUrlKey", () => {
  it("treats the same posting shared through different channels as one", () => {
    const canonical = key("https://boards.example.com/acme/jobs/42");
    expect(key("http://www.boards.example.com/acme/jobs/42/")).toBe(canonical);
    expect(key("https://BOARDS.example.com/acme/jobs/42#apply")).toBe(canonical);
    expect(key("https://boards.example.com/acme/jobs/42?utm_source=linkedin&utm_medium=social")).toBe(canonical);
    expect(key("https://boards.example.com/acme/jobs/42?gclid=abc&trk=feed&refId=xyz")).toBe(canonical);
  });

  it("keeps query parameters that identify the job", () => {
    const first = key("https://www.linkedin.com/jobs/view/?currentJobId=111");
    const second = key("https://www.linkedin.com/jobs/view/?currentJobId=222");
    expect(first).not.toBe(second);
    expect(key("https://boards.greenhouse.io/acme?gh_jid=9&gh_src=abc")).toBe("boards.greenhouse.io/acme?gh_jid=9");
  });

  it("ignores parameter order", () => {
    expect(key("https://example.com/job?b=2&a=1")).toBe(key("https://example.com/job?a=1&b=2"));
  });

  it("keeps different paths distinct, including case", () => {
    expect(key("https://example.com/jobs/ABC")).not.toBe(key("https://example.com/jobs/abc"));
  });
});
