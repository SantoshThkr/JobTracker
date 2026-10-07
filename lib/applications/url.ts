// Query parameters that only identify where a click came from. Removing them
// lets the same posting shared through different channels dedupe to one key.
// Job boards often put the job id in the query string (gh_jid, currentJobId,
// jk), so only parameters known to be tracking-only are dropped.
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gh_src",
  "lipi",
  "msclkid",
  "ref",
  "refid",
  "trackingid",
  "trk",
]);

/**
 * Parses a user-supplied link and accepts only http(s) URLs. Anything else
 * (javascript:, data:, mailto:, relative paths) returns null, because the value
 * is later rendered as an <a href>.
 */
export function parseHttpUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname) return null;
  return url;
}

/**
 * Builds the key used to detect that a job posting is already tracked:
 * scheme, "www.", fragment, trailing slash and tracking parameters are
 * ignored; the remaining parameters are sorted.
 */
export function jobUrlKey(url: URL): string {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const port = url.port ? `:${url.port}` : "";
  const path = url.pathname.replace(/\/+$/, "");

  const params = [...url.searchParams.entries()]
    .filter(([name]) => {
      const lower = name.toLowerCase();
      return !lower.startsWith("utm_") && !TRACKING_PARAMS.has(lower);
    })
    .sort(([a, aValue], [b, bValue]) => a.localeCompare(b) || aValue.localeCompare(bValue));
  const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";

  return `${host}${port}${path}${query}`;
}
