import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// Deliberately minimal permission set (see DECISIONS.md ADR-015):
// - activeTab: act only on the tab the user explicitly invokes us on,
//   no broad host_permissions over arbitrary job sites
// - scripting: inject the content script on demand, not persistently
// - storage: persist the Supabase session (chrome.storage.local)
// Sign-in uses a 6-digit email OTP code typed into the popup (see
// src/lib/auth.ts) rather than a redirect-based flow, so no `identity`
// permission or Supabase redirect-URL configuration is needed at all.
// host_permissions is scoped to the Supabase project's own API only —
// the one network target the background worker actually needs.
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
  permissions: ["activeTab", "scripting", "storage"],
  host_permissions: ["https://trhnfarcchrykrfnhqdc.supabase.co/*"],
});
