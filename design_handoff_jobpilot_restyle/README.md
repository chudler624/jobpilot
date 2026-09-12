# Handoff: jobpilot brand restyle (Tailwind v4 + shadcn/ui)

## Overview
Restyle the existing jobpilot Next.js app from the stock shadcn neutral-gray
theme to the jobpilot design system: graphite ink + one cobalt accent on a warm
Paper background, IBM Plex Sans / Mono, flat hairline panels with zero shadow,
pill-shaped status tags, and "verified vs. unverified" expressed by shape.
No new features. No layout restructuring. Same routes, same components, same
data — only the look changes.

## About the design files
Everything in this folder is a **design reference written in HTML** — mockups
of the intended look, not production code. The task is to **recreate this look
inside the existing codebase** (Next.js 15, TypeScript, Tailwind v4 with
`@theme inline`, shadcn/ui on `@base-ui/react`, `class-variance-authority`)
using its established patterns. Do not copy the HTML into the app.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and states are final. Recreate
pixel-faithfully, but through the codebase's own token layer (`globals.css`
CSS variables + Tailwind utilities + `cva` variants), not via inline styles.

## Where the mockups live
- `mocks/jobs.html` — Jobs list (`app/(dashboard)/jobs/page.tsx`)
- `mocks/resume.html` — Resume library (`app/(dashboard)/resume/page.tsx`)
- `mocks/index.html` + `mocks/app.jsx` — interactive kit: Dashboard, Job detail, Resume review (Truth Guard)
- `tokens/*.css`, `styles.css` — the design tokens (source of truth for values)
- `assets/logo.png` — the wordmark (cobalt airplane on the "i"), transparent
- `readme.md` — full brand guide (content rules, visual foundations)

All pixel values needed for implementation are specified in this README; the
HTML mocks are the visual ground truth.

---

## 1. Tokens — rewrite `app/globals.css` `:root`

Keep the existing `@theme inline` mapping block and shadcn variable NAMES so
every component keeps working; change only the VALUES. Delete the `.dark`
block (the product has no dark mode — the brief forbids the "dark SaaS" look).

```css
:root {
  --background: #F5F5F2;            /* Paper */
  --foreground: #1C1B19;            /* Graphite */
  --card: #FFFFFF;                  /* raised panel */
  --card-foreground: #1C1B19;
  --popover: #FFFFFF;
  --popover-foreground: #1C1B19;
  --primary: #23479E;               /* Cobalt — the ONE accent */
  --primary-foreground: #FFFFFF;
  --secondary: #F5F5F2;             /* Paper */
  --secondary-foreground: #1C1B19;
  --muted: #EDECE7;                 /* paper-hover */
  --muted-foreground: #8A8477;      /* Slate */
  --accent: #EDECE7;
  --accent-foreground: #1C1B19;
  --destructive: #8A2A22;           /* rare, quiet; never a fill */
  --border: #E1DFD9;                /* Hairline */
  --input: #E1DFD9;
  --ring: #23479E;                  /* cobalt focus ring */
  --radius: 0.375rem;               /* 6px — panels & controls */
  --sidebar: #F5F5F2;
  --sidebar-foreground: #1C1B19;
  --sidebar-primary: #1C1B19;       /* active nav = graphite fill */
  --sidebar-primary-foreground: #F5F5F2;
  --sidebar-accent: #EDECE7;
  --sidebar-accent-foreground: #1C1B19;
  --sidebar-border: #E1DFD9;
  --sidebar-ring: #23479E;
  --chart-1: #23479E; --chart-2: #1C1B19; --chart-3: #8A8477; --chart-4: #E1DFD9; --chart-5: #1C3A82;
}
```

Also add, and reference where needed:
```css
--cobalt-press: #1C3A82;   /* primary hover */
--paper-hover: #EDECE7;
```

Radius: with `--radius: 0.375rem` the existing `--radius-lg` = 6px. Buttons
currently use `rounded-lg` → 6px. Cards use `rounded-xl` → change to
`rounded-lg`. Badges use `rounded-4xl` → keep (pill).

## 2. Fonts — `app/layout.tsx`

Replace Geist with IBM Plex via `next/font/google`:
```ts
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
const plexSans = IBM_Plex_Sans({ subsets:["latin"], weight:["400","500","600"], variable:"--font-sans" });
const plexMono = IBM_Plex_Mono({ subsets:["latin"], weight:["400","500"], variable:"--font-geist-mono" }); // keep var name so @theme mapping works
```
Apply both `.variable` classes on `<html>` (or `<body>`). Body text 15px /
line-height 1.6. Weights: 400 body, 500 headings/emphasis. **Do not use 600/700
on UI text** — `font-semibold` on `h1`/`h2` → `font-medium`.

Mono is for **numbers only** (scores, percentages, salaries, dates in evidence
records). Add a utility: `.tabular { font-variant-numeric: tabular-nums }`.

## 3. Global rules (apply everywhere)

- **No shadows.** Remove every `shadow-*` class; `Card` gets `shadow-none`.
- **No gradients, no blur, no opacity-tinted backgrounds** (`bg-muted/50`,
  `bg-destructive/10` → solid tokens: `hover:bg-muted`, `text-destructive` on
  transparent).
- **Sentence case everywhere.** Remove `uppercase tracking-wide` (e.g. resume
  preview section headers → `text-xs font-medium text-muted-foreground`, sentence case).
- **Hairline borders only where a boundary is real**: `border border-border`. 6px radius.
- **Cobalt is earned.** Exactly one `variant="default"` (cobalt) button per screen — the screen's decisive action. Everything else is `outline`/`ghost`.
- **Never red for "missing"/"unverified".** Those states use graphite/slate + shape.

## 4. Component changes (`components/ui/*`)

### `button.tsx`
- `default`: `bg-primary text-primary-foreground hover:bg-[var(--cobalt-press)]` (cobalt → cobalt-press; drop `/80` opacity hover)
- `outline`: `border-border bg-secondary hover:bg-muted text-foreground` (Paper surface, hairline border)
- `secondary`: same as outline (Paper + hairline) — they collapse to one look
- `ghost`: `hover:bg-muted text-foreground`
- `destructive`: `bg-transparent text-destructive border-border hover:border-destructive` — outlined, never filled
- Sizes: `default` → `h-[34px] px-3.5 text-sm`; `sm` → `h-7 px-2.5 text-[13px]`; `lg` → `h-10 px-[18px] text-[15px]`
- Keep `active:translate-y-px`, `disabled:opacity-50`, focus ring (`ring-ring/50` is fine — it's the one allowed alpha).
- Radius: `rounded-lg` (= 6px after token change). Remove the odd `rounded-[min(var(--radius-md),10px)]` overrides → `rounded-lg`.

### `card.tsx`
- Surface: `bg-card border border-border rounded-lg shadow-none`.
- Remove any `hover:bg-muted/50` on Link-wrapped cards → `hover:bg-secondary` (Paper).
- Card padding: header `px-[18px] py-4` (16/18). `CardTitle`: `text-base font-medium`. `CardDescription`: `text-[13.5px] text-muted-foreground mt-[3px]`.

### `badge.tsx` → behaves as the **Pill**
- Base: `h-[22px] px-2.5 rounded-full text-[12.5px] font-medium gap-1.5`.
- `default` (cobalt fill): reserve for **"Apply"** recommendation and "strong" match status only.
- `outline`: `bg-card border-border text-foreground` — Apply — Stretch, Maybe, workplace type (Remote/Onsite/Hybrid), skills, Finalized.
- `secondary` → rename semantics to **muted**: `bg-secondary border border-border text-muted-foreground` — Skip, Draft, "missing".
- Add a new variant `ink`: `bg-foreground text-background` — for pipeline stage (e.g. "Applied").
- **Remove `destructive` usage** for `skip` (match-card.tsx `RECOMMENDATION_VARIANT.skip: "destructive"` → `"secondary"`/muted).
- Add optional leading **marker** (see §5): a prop `marker?: "verified" | "unverified"` rendering an 8px `rounded-full` span — `bg-current` (filled) or `border-[1.5px] border-current` (hollow).

### `input.tsx`, `textarea.tsx`, `select.tsx`
- `h-[34px] bg-card border border-input rounded-lg text-sm text-foreground`
- Focus: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15` (cobalt border + faint cobalt ring)
- Invalid: `aria-invalid:border-destructive` only (no red ring/fill)

### `checkbox.tsx`
- 18px square, `rounded` (4px), `border-border bg-card`; checked → `bg-primary border-primary text-white`. Used for "I've verified this claim is accurate".

### `label.tsx`
- `text-[13px] font-medium text-foreground mb-1.5` — sentence case.

## 5. New primitive: `components/ui/verified-marker.tsx`
Verified/unverified is communicated by **shape**, not color.
```tsx
export function VerifiedMarker({ verified, className }: { verified: boolean; className?: string }) {
  return verified
    ? <span className={cn("inline-block size-[9px] rounded-full bg-foreground shrink-0", className)} />
    : <span className={cn("inline-block size-[9px] rounded-full border-[1.5px] border-foreground shrink-0", className)} />;
}
```
Use it (a) as the leading marker on every resume bullet on
`/resume/[versionId]/review`, (b) inside Draft/Finalized badges (Draft =
hollow, Finalized = filled), (c) on "Backed by:" lines in match-card.tsx.

## 6. Layout shell — `app/(dashboard)/layout.tsx` + `components/nav/main-nav.tsx`
- `<aside>`: `w-56 bg-sidebar border-r border-sidebar-border`; brand block `px-5 pt-5 pb-4` renders **`<Image src="/logo.png" alt="jobpilot" height={24} />`** (copy `assets/logo.png` → `public/logo.png`) instead of the text "jobpilot".
- Nav item: `px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground`; **active** → `bg-foreground text-background` (graphite fill, not `bg-primary` — nav never takes cobalt).
- Sidebar footer: `border-t border-border p-4`; email `text-xs text-muted-foreground`; Sign out = `variant="outline" size="sm" className="w-full mt-2"`.
- `<main>`: `flex-1 px-12 py-10 max-w-[1000px]` (40px/48px).

## 7. Page-level changes

### Every page header
`h1`: `text-[26px] font-medium leading-tight`. Subtitle `<p>`: `text-[15px] text-muted-foreground mt-1`. Header + actions row: `flex items-start justify-between gap-6`; section gap below header `mt-7`.

### `jobs/page.tsx` (see `mocks/jobs.html`)
- Actions: "Discover jobs" → `variant="outline"`; "Analyze a job" → `variant="default"` (the one cobalt).
- Card row: `px-[18px] py-4 flex items-center justify-between gap-4`, list gap `gap-3`.
- Title: `{title}` `text-base font-medium` + company as a slate suffix: `<span class="text-muted-foreground font-normal"> · {company}</span>`.
- Meta line `text-[13.5px] text-muted-foreground mt-[3px]`; salary wrapped in `<span class="font-mono tabular">`.
- `workplace_type` badge → `variant="outline"`, **sentence case** (`Onsite`, `Remote`, `Hybrid`) — capitalize the stored lowercase value for display only.
- Right side: badge + the job's match score (`job_scores.overall_score`, if present) as `font-mono text-[28px] font-medium tabular min-w-10 text-right`. Requires joining `job_scores` in the page query (`select("*, job_scores(overall_score)")`). Render `Math.round(score*100)`. Omit the number when no score exists.

### `resume/page.tsx` (see `mocks/resume.html`)
- `max-w-[820px]`. Section `h2`: `text-base font-medium mt-9 mb-3`.
- Card title: `{label}` + `<span class="text-muted-foreground font-normal"> · v{n}</span>` (replace "(v2)").
- Status badge moves to the **right** of the row (`justify-between`), with marker: Draft → `variant="secondary"` (muted) + hollow marker; Finalized → `variant="outline"` + filled marker.
- "Generated {date}" → date in `font-mono tabular`, ISO format (`2026-09-11`).
- "Regenerate Master Resume" → `variant="outline"` (**not** cobalt — nothing on this screen is the decisive action).

### `dashboard/page.tsx`
- Count cards: `grid-cols-5 gap-3`, `px-4 py-[18px]`; number `font-mono text-[32px] font-medium leading-none tabular`; label `text-[13px] text-muted-foreground mt-2`. No hover tint.
- Below: "Top opportunities" (`text-base font-medium mt-10 mb-3.5`) — top 3 jobs by score as Jobs-style rows (title / company · location / recommendation badge / mono score).

### `jobs/[id]/page.tsx` + `components/jobs/match-card.tsx`
- Score block: `font-mono text-[40px] font-medium leading-none tabular` with `%` as `text-xl text-muted-foreground`; caption "overall (weighted)" `text-xs text-muted-foreground`.
- Recommendation badge per §4. One-line summary under "Match" `text-[14.5px] leading-[1.55] max-w-[60ch]`.
- **Breakdown is collapsed by default** behind a text disclosure "View breakdown" / "Hide breakdown" (`text-sm font-medium text-primary`, no underline). Move the six-dimension grid and the "Why you match" groups inside it. Dimension rows: `flex justify-between py-[9px] border-b border-border`, label `text-[13.5px] text-muted-foreground`, value `font-mono text-sm font-medium tabular`.
- `STATUS_VARIANT.missing` stays `outline`; `RECOMMENDATION_VARIANT.skip` → `"secondary"` (muted) — no destructive.
- "Backed by:" lines get a leading filled `VerifiedMarker` (7px).

### `resume/[versionId]/review/page.tsx` (Truth Guard)
- Sticky-ish status panel at top: "`{n}` of `{m}` claims verified" (numbers mono), right side: helper text "Finalize is blocked until every claim is checked." + `Finalize` (`variant="default"`, cobalt, `disabled` until all verified).
- Each claim row: `py-3 border-b border-border flex gap-3`; leading `VerifiedMarker verified={section.user_verified}` at `mt-1.5`; text `text-[14.5px] leading-normal`, unverified text in `text-muted-foreground`.
- Under each: text disclosure "Why is this here?" / "Hide evidence" (`text-[13px] text-primary`) revealing evidence in an inset panel `bg-secondary border border-border rounded-lg px-3.5 py-3 text-[13.5px]`; plus the existing `VerifyCheckbox`, label shortened to "I've verified this claim".
- `resume-preview.tsx`: section headers → `text-[13px] font-medium text-muted-foreground` sentence case; skills → `variant="outline"` badges; bullets lose `list-disc`, get the `VerifiedMarker` instead.

## 8. Copy rules to enforce while touching files
Sentence case for every label/button/badge. Buttons state what happens
("Analyze match", "Generate resume", "Save changes") — never "Submit". No
exclamation points. "Missing"/"Unverified" stated plainly, never as warnings.

## 9. Do NOT
Add dark mode; add shadows, gradients, blur; use cobalt on nav, backgrounds,
or more than one button per screen; use red for unverified/missing; use
`font-mono` on anything that isn't a number; introduce new dependencies or
icon libraries (the app is intentionally icon-free).

## 10. Verification
Run `npm run lint && npx tsc --noEmit && npm run build` after each file group.
Then compare `/jobs`, `/resume`, `/dashboard`, `/jobs/[id]`,
`/resume/[id]/review` against `mocks/jobs.html`, `mocks/resume.html`, and the
screens inside `mocks/index.html` (nav: Dashboard / Jobs / Resume).

## Design tokens (reference)
Graphite `#1C1B19` · Cobalt `#23479E` · Cobalt-press `#1C3A82` · Paper `#F5F5F2`
· White `#FFFFFF` · Hairline `#E1DFD9` · Slate `#8A8477` · Paper-hover `#EDECE7`
· Destructive (rare) `#8A2A22`. Radius 6px (panels/controls), 999px (pills).
Shadow: none. Type: IBM Plex Sans 400/500; IBM Plex Mono 400/500 (numbers).
Scale: 26 h1 · 16 h3/card title · 15 body · 13.5 meta · 12 xs · 40 / 32 / 28 mono readouts.
Spacing: 4px base; page padding 40/48; card padding 16/18; list gap 12.
Motion: 120–180ms, `cubic-bezier(0.2,0,0,1)`, only in response to user action.
