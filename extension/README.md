# jobpilot Application Assistant (browser extension)

Phase 8 — detects application form fields on the page you're viewing and
suggests answers pulled from your verified jobpilot Career Profile. It
never submits anything; you always review and fill manually.

See `DECISIONS.md` ADR-015 in the repo root for the architecture this is
built on (Supabase auth directly in the extension, RLS as the only
security boundary, no new API surface on the main app).

## Build

```
cd extension
npm install
npm run build
```

Produces a loadable unpacked extension in `extension/dist/`.

## Load into Chrome

1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked", select `extension/dist/`
4. Pin the extension icon for easy access

## Sign in

Click the extension icon, enter the email address for your jobpilot
account, and check your email for a 6-digit code (Supabase's standard
email-OTP flow — the same underlying mechanism as the main app's
magic-link sign-in). Enter the code in the popup.

## Use it on a real application page

1. Navigate to a real job application form
2. Click the extension icon
3. Click "Detect fields on this page"
4. Review each suggested answer — click "Fill" per field you approve
5. Submit the application yourself, the normal way

## Known limitations (by design, not oversights)

- Only plain `<input>`, `<textarea>`, and `<select>` elements are
  detected — radio buttons and checkboxes are skipped entirely, since
  many yes/no questions (sponsorship, work authorization, skill checks)
  are implemented as radio groups or custom-styled toggles, and reliably
  picking the right option in a group is meaningfully harder than filling
  a single field.
- Field detection is pure keyword/regex matching against labels, `name`,
  `id`, `aria-label`, and placeholder text — it will miss custom-styled
  widgets and unusually-worded labels. It's built to say "detected N,
  review each," not to guarantee complete coverage.
- Only structured/factual answers (name, email, phone, years of
  experience, skill yes/no, work authorization) — no AI-generated prose
  answers in this phase.

## What I could not verify without a browser

I have no way to drive an actual Chrome window from here, so the
following need a manual pass on your end:

- Loading the unpacked extension and confirming it appears correctly
- The sign-in flow end-to-end (does the OTP email actually arrive with a
  usable 6-digit code?)
- Field detection and fill against a real application page
- That RLS correctly scopes the data the extension sees to your own
  Career Profile (it should, automatically, since it's the same
  mechanism as the main app — but worth a live glance)

Everything else (TypeScript compiles across the whole extension, the
build produces a structurally valid MV3 bundle, the field-categorization
and answer-derivation logic) was verified with throwaway test scripts
before being wired into the browser-only layers.
