import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 10_000;

export type FetchJobPageResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

// SSRF guard (ADR-008 territory: this is arbitrary user-supplied input
// driving a server-side fetch). Blocks private/reserved IP ranges,
// including the 169.254.169.254 cloud metadata address.
function isPrivateOrReservedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    return false;
  }
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const embedded = lower.split(":").pop() ?? "";
      if (embedded.includes(".")) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }
  return true; // not a recognizable IP literal — be conservative
}

export async function fetchJobPageText(
  rawUrl: string
): Promise<FetchJobPageResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http/https URLs are supported" };
  }

  let addresses;
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    return { ok: false, error: "Couldn't resolve that URL's hostname" };
  }

  if (addresses.some((a) => isPrivateOrReservedIp(a.address))) {
    return {
      ok: false,
      error:
        "That URL points to a private or reserved address and can't be fetched",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "jobpilot/1.0 (personal job-search tool)" },
    });
  } catch {
    return { ok: false, error: "Couldn't fetch that URL" };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status >= 300 && response.status < 400) {
    return {
      ok: false,
      error:
        "That URL redirects — please paste the final URL or the description text instead",
    };
  }

  if (!response.ok) {
    return { ok: false, error: `That URL returned an error (${response.status})` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    return { ok: false, error: "That URL didn't return a web page" };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return { ok: false, error: "Couldn't read that URL's response" };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      return { ok: false, error: "That page is too large to analyze" };
    }
    chunks.push(value);
  }

  const html = Buffer.concat(chunks).toString("utf-8");
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  if (!text) {
    return { ok: false, error: "Couldn't extract any text from that page" };
  }

  return { ok: true, text };
}
