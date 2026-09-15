import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// Permission set (see DECISIONS.md ADR-015, widened by ADR-020):
// - activeTab: act on the tab the user explicitly invokes the popup on
// - scripting: inject scripts on demand, never persistently
// - storage: persist the Supabase session (chrome.storage.local)
// - webNavigation + <all_urls>: zero-click posting capture needs to see
//   which tab a JobPilot job page opened and read that tab's text,
//   wherever the listing redirects to. Capture only ever arms for a tab
//   opened from a snippet-only job page (src/lib/capture-posting.ts).
// Sign-in uses a 6-digit email OTP code typed into the popup (see
// src/lib/auth.ts) rather than a redirect-based flow, so no `identity`
// permission or Supabase redirect-URL configuration is needed at all.
export default defineManifest({
  manifest_version: 3,
  name: "jobpilot Application Assistant",
  version: pkg.version,
  description:
    "Detects application form fields and suggests answers from your verified jobpilot Career Profile. Never submits anything for you.",
  action: {
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["activeTab", "scripting", "storage", "webNavigation"],
  host_permissions: ["<all_urls>"],
});
