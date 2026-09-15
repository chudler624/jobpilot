import { supabase } from "./supabase";

// Zero-click full-posting capture (DECISIONS.md ADR-020). When a tab is
// opened from a snippet-only JobPilot job page ("View original listing"),
// the posting is read from the user's own browser once it settles and
// saved over the job's 500-char Adzuna snippet. The server can't fetch
// these listings itself — Adzuna bot-blocks them (ADR-018/019).
const JOBPILOT_ORIGINS = [
  "https://jobpilot-sandy.vercel.app",
  "https://jobpilot-job-pilot4.vercel.app",
  "http://localhost:3000",
];
const JOB_PATH = /^\/jobs\/([0-9a-f-]{36})\/?$/i;
const PENDING_KEY = "pendingPostingCaptures";
const POLL_INTERVAL_MS = 2000;
const CAPTURE_DEADLINE_MS = 60_000;
// Adzuna's own redirect page is where the tab starts — give it time to
// hand off to the employer's site before settling for its text.
const ADZUNA_SETTLE_MS = 15_000;
const MIN_TEXT_LENGTH = 800;
const MAX_TEXT_LENGTH = 50_000;

interface PendingCapture {
  jobId: string;
  sourceTabId: number;
  sourceUrl: string;
}

function jobIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!JOBPILOT_ORIGINS.includes(parsed.origin)) return null;
    return JOB_PATH.exec(parsed.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function getPending(): Promise<Record<string, PendingCapture>> {
  const stored = await chrome.storage.session.get(PENDING_KEY);
  return (stored[PENDING_KEY] as Record<string, PendingCapture> | undefined) ?? {};
}

async function setPending(tabId: number, capture: PendingCapture | null) {
  const pending = await getPending();
  if (capture) pending[tabId] = capture;
  else delete pending[tabId];
  await chrome.storage.session.set({ [PENDING_KEY]: pending });
}

// Runs inside the posting page — must be self-contained.
function readPostingText(): { url: string; text: string } {
  const regions = Array.from(
    document.querySelectorAll<HTMLElement>("main, article, [role='main']")
  )
    .map((el) => el.innerText ?? "")
    .sort((a, b) => b.length - a.length);
  const main = regions[0] ?? "";
  return {
    url: location.href,
    text: main.length >= 800 ? main : (document.body?.innerText ?? ""),
  };
}

async function readTab(tabId: number): Promise<{ url: string; text: string } | null> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: readPostingText,
    });
    return (injection?.result as { url: string; text: string } | undefined) ?? null;
  } catch {
    return null;
  }
}

function isAdzuna(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("adzuna.com");
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls until the page text stops changing, since employer ATS pages
// (Workday etc.) render the description client-side after load.
async function waitForPostingText(tabId: number): Promise<string | null> {
  const started = Date.now();
  let lastUrl = "";
  let lastLength = -1;
  let stableSince = Date.now();

  while (Date.now() - started < CAPTURE_DEADLINE_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      await chrome.tabs.get(tabId);
    } catch {
      return null; // tab closed
    }

    const page = await readTab(tabId);
    if (!page) continue;

    if (page.url !== lastUrl || Math.abs(page.text.length - lastLength) > 50) {
      lastUrl = page.url;
      lastLength = page.text.length;
      stableSince = Date.now();
      continue;
    }

    const stableFor = Date.now() - stableSince;
    if (page.text.length < MIN_TEXT_LENGTH) continue;
    if (isAdzuna(page.url) && stableFor < ADZUNA_SETTLE_MS) continue;
    return page.text;
  }
  return null;
}

async function saveCapturedText(capture: PendingCapture, rawText: string) {
  const text = rawText.replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_TEXT_LENGTH);

  // Only ever replaces a snippet — a job that already has a full
  // description (pasted, Greenhouse, or captured before) is left alone.
  const { data, error } = await supabase
    .from("jobs")
    .update({
      raw_description: text,
      is_snippet_only: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", capture.jobId)
    .eq("is_snippet_only", true)
    .select("id");
  if (error || !data?.length) return;

  await supabase.from("job_requirements").delete().eq("job_id", capture.jobId);
  await supabase.from("job_scores").delete().eq("job_id", capture.jobId);

  const reloadUrl = new URL(capture.sourceUrl);
  reloadUrl.searchParams.set("captured", "1");
  await chrome.tabs.update(capture.sourceTabId, { url: reloadUrl.toString() }).catch(() => {});
}

async function armCapture(sourceTabId: number, targetTabId: number) {
  const existing = await getPending();
  if (existing[targetTabId]) return;

  let source: chrome.tabs.Tab;
  try {
    source = await chrome.tabs.get(sourceTabId);
  } catch {
    return;
  }
  const jobId = jobIdFromUrl(source.url);
  if (!jobId || !source.url) return;

  // RLS scopes this to the signed-in user; signed out means no row.
  const { data: job } = await supabase
    .from("jobs")
    .select("is_snippet_only")
    .eq("id", jobId)
    .maybeSingle();
  if (!job?.is_snippet_only) return;

  const capture = { jobId, sourceTabId, sourceUrl: source.url.split("?")[0] };
  await setPending(targetTabId, capture);
  try {
    const text = await waitForPostingText(targetTabId);
    if (text) await saveCapturedText(capture, text);
  } finally {
    await setPending(targetTabId, null);
  }
}

export function registerPostingCapture() {
  chrome.webNavigation.onCreatedNavigationTarget.addListener(({ sourceTabId, tabId }) => {
    void armCapture(sourceTabId, tabId);
  });
  // Fallback for link opens that don't report a navigation target.
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.openerTabId !== undefined && tab.id !== undefined) {
      void armCapture(tab.openerTabId, tab.id);
    }
  });
}
