---
phase: 04-kompendium-ksi-ga-inwentarzowa
plan: 03
subsystem: pages
tags: [new-page, routing, dashboard, inventory-ledger, interactive-guide]
requirements: [INV-01]

dependency_graph:
  requires: [04-01, 04-02]
  provides: [KsiegaInwentarzPage, /ksiega-inwentarzowa route, dashboard card]
  affects: [src/App.jsx, src/pages/DashboardPage.jsx]

tech_stack:
  added: []
  patterns:
    - Self-contained page with IntersectionObserver sticky nav (same as KompendiumPage)
    - sessionStorage-persisted checklist with group-keyed state
    - Deferred form validation via simSubmitted gate
    - Sub-components defined as consts inside main component (no new files)

key_files:
  created:
    - src/pages/KsiegaInwentarzPage.jsx
  modified:
    - src/App.jsx
    - src/pages/DashboardPage.jsx

decisions:
  - KsiegaAccordion uses component-level prop id (not HTML id attribute) — satisfies 15-column accordion requirement
  - Placeholder image uses onError hide so missing photo does not break layout
  - simSubmitted state keeps validation deferred until "Generuj podgląd" click — no premature red borders

metrics:
  duration_seconds: 384
  completed_date: "2026-04-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 04 Plan 03: KsiegaInwentarzPage Summary

**One-liner:** Self-contained 7-section interactive guide to the K-205/60 physical inventory ledger with sessionStorage checklist, 15-column accordion, entry simulator, and comparison table.

## What Was Built

Created `src/pages/KsiegaInwentarzPage.jsx` — a fully interactive reference guide for SSUEW members on the physical inventory ledger (Ksiega Inwentarzowa K-205/60). Added the route to App.jsx and a new emerald dashboard card in DashboardPage.jsx.

### KsiegaInwentarzPage.jsx — Structure

7 sections, all with `scroll-mt-20`:

| # | id | Section | Key component |
|---|----|---------|---------------|
| 1 | `czym-jest` | Czym jest Ksiega Inwentarzowa | Info cards + placeholder photo |
| 2 | `podstawa-prawna` | Podstawa prawna | Bullet list (3 legal bases) |
| 3 | `struktura` | Struktura — 15 kolumn | KsiegaAccordion x15 |
| 4 | `inwentaryzacja` | Inwentaryzacja otwarcia | Numbered steps |
| 5 | `relacja` | Relacja z ewidencja cyfrowa | 6-row comparison table |
| 6 | `procedura-wpisu` | Procedura dodawania wpisu | Checklist (15 items) + entry simulator |
| 7 | `bledy` | Czeste bledy ewidencyjne | FAQ cards (6 items) |

### Navigation

- Desktop: sticky sidebar (`lg:block`, `top-[49px]`, emerald active state)
- Mobile: sticky select dropdown (`lg:hidden`, `top-[49px]`, emerald styling)
- IntersectionObserver tracks active section (`rootMargin: '-15% 0px -75% 0px'`)
- Scroll-to-top button appears after 400px scroll

### Interactive Components

**Checklist** — sessionStorage key `ksiega_checklist_v1`, group `wpis`, 15 items (w1–w15). State persists across page reloads.

**KsiegaAccordion** — one-at-a-time expand, shows description + amber tip box + example code. Used for all 15 columns.

**Entry Simulator** — 4 input fields (kol4, kol5, kol6, kol7). Validation (red border + ring) deferred until `setSimSubmitted(true)` via "Generuj podglad" button. Preview table always visible.

**Comparison Table** — 6 rows x 3 columns (Cecha / Ksiega Inwentarzowa / Ewidencja cyfrowa).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | fb8b159 | feat(04-03): create KsiegaInwentarzPage.jsx |
| 2 | abeee39 | feat(04-03): wire /ksiega-inwentarzowa route and add dashboard card |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `/public/ksiega/placeholder.jpg` — placeholder image path. The `<img>` tag has `onError` handler that hides the element if the file is missing. Comment in code: `TODO: replace with actual photo after user uploads to /public/ksiega/`. This is intentional and does NOT prevent the plan's goal from being achieved.

## Self-Check: PASSED

- `src/pages/KsiegaInwentarzPage.jsx` — FOUND
- `src/App.jsx` contains `ksiega-inwentarzowa` route — FOUND
- `src/pages/DashboardPage.jsx` contains `ksiega-inwentarzowa` card — FOUND
- Commit fb8b159 — FOUND
- Commit abeee39 — FOUND
- 7 sections with scroll-mt-20 — CONFIRMED (grep -c returns 7)
- 2 occurrences of ksiega_checklist_v1 — CONFIRMED
- Build: `npx vite build --mode development` exits 0 — CONFIRMED
