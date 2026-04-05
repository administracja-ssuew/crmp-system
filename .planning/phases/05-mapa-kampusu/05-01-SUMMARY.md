---
phase: 05-mapa-kampusu
plan: "01"
subsystem: ui
tags: [react, tailwind, lucide-react, mappage, responsive, hotspot, tooltip]

# Dependency graph
requires: []
provides:
  - Refactored MapPage.jsx with responsive map container (flex-1 object-contain)
  - Sticky header with search, type filters, and admin-only view toggle
  - calcHotspotStyle helper with object-contain letterbox geometry formula
  - Hover tooltip on map pins (hoveredId state, name/type/free status)
  - isAdmin check covering both 'admin' and 'logitech' roles
  - State scaffolding for plan 05-02 (history, editForm, isEditing) and 05-03 (allPosters, registry)
  - scroll-to-top useEffect on mount
affects:
  - 05-02-admin-panel (uses locationHistory, historyLoading, editForm, isEditing state)
  - 05-03-rejestr (uses allPosters, postersLoading, registryFilter, registrySearch, fetchAllPosters)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - calcHotspotStyle formula for object-contain letterbox coordinate mapping
    - hoveredId useState pattern for tooltip (preferred over CSS group-hover)
    - shrink-0 header + flex-1 map container layout pattern for collision-free filter UI

key-files:
  created: []
  modified:
    - src/pages/MapPage.jsx

key-decisions:
  - "isAdmin = userRole === 'logitech' || userRole === 'admin' — both roles get admin features"
  - "Sticky header (shrink-0 bg-white border-b) replaces absolute overlay to avoid z-index collision with App.jsx fixed back button"
  - "calcHotspotStyle uses getBoundingClientRect + naturalWidth/naturalHeight for letterbox-aware positioning"
  - "RegistryView implemented as placeholder div — full implementation deferred to plan 05-03"
  - "X icon imported but unused — reserved for future plans (05-02 close buttons)"

patterns-established:
  - "Pattern: Sticky filter header above flex-1 content area — eliminates overlay/z-index collisions"
  - "Pattern: calcHotspotStyle(loc) reads imgRef.current.getBoundingClientRect() on each render — correct for object-contain letterboxing"
  - "Pattern: hoveredId === loc.id tooltip pattern — prefer over CSS group-hover for programmatic control"

requirements-completed:
  - MAP-01

# Metrics
duration: 25min
completed: 2026-04-05
---

# Phase 05 Plan 01: Mapa Kampusu — Layout Foundation Summary

**Responsive MapPage.jsx with sticky filter header, object-contain map image, calcHotspotStyle letterbox formula, and hover tooltips replacing the broken absolute overlay and hardcoded h-[800px] image**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-05T20:09:00Z
- **Completed:** 2026-04-05T20:34:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Fixed isAdmin check to include 'logitech' role (was missing, blocking logitech admins from seeing admin features)
- Replaced absolute-positioned overlay filter bar (z-30 collision with App.jsx z-50 back button) with a proper sticky header using `shrink-0 bg-white border-b`
- Replaced hardcoded `h-[800px]` img with `w-full h-full object-contain` inside a `flex-1 relative overflow-hidden` container — eliminates horizontal scroll
- Added `calcHotspotStyle` helper with full object-contain letterbox geometry (getBoundingClientRect + naturalWidth/naturalHeight)
- Added hover tooltip on each pin with name, type, and color-coded free/occupied status (emerald/red)
- Replaced emoji pins (📌 🚩) with lucide-react MapPin/Flag icons
- Scaffolded all state variables needed by plans 05-02 and 05-03
- Added admin-only view toggle (Mapa / Rejestr) in header; Rejestr view is a placeholder
- Build passes with no errors (`npm run build` exit 0)

## Task Commits

1. **Task 1: Fix isAdmin, add state variables, scroll-to-top** - `ae763b2` (feat)
2. **Task 2: Refactor JSX — sticky header, responsive map, hotspot tooltips** - `3c3aa19` (feat)

## Files Created/Modified

- `src/pages/MapPage.jsx` — Full layout refactor: sticky header, responsive map container, hotspot tooltips, new state variables, calcHotspotStyle, fetchAllPosters stub

## Decisions Made

- **calcHotspotStyle uses letterbox formula** — The plan offered a simpler direct-% alternative, but the letterbox formula was implemented per plan specification because object-contain always letterboxes when the image aspect ratio differs from the container. The formula correctly handles both top/bottom and left/right letterboxing.
- **RegistryView as placeholder** — `<div>Widok Rejestru — wkrótce</div>` placeholder placed in the ternary branch. Full implementation is plan 05-03's responsibility.
- **X icon imported** — Not used in this plan's JSX; reserved for close buttons in the admin panel (plan 05-02). Left as-is since it's a hint (not error) and avoids a re-import in the next plan.

## Deviations from Plan

None — plan executed exactly as written. The JSX comment-in-ternary pitfall noted in the plan (`{ /* comment */ <div> }` is invalid JSX) was avoided — the registry placeholder was written as a clean JSX expression.

## Issues Encountered

None. The build produced deprecation warnings about `esbuild`, `optimizeDeps.rollupOptions`, and chunk size — all pre-existing, unrelated to this plan's changes.

## Known Stubs

- **RegistryView placeholder** — `src/pages/MapPage.jsx` line ~312: `<div className="flex items-center justify-center h-full text-slate-400 font-bold">Widok Rejestru — wkrótce</div>` — intentional stub, resolved in plan 05-03.
- **fetchAllPosters** — stub function exists but only fetches; registry display not implemented until plan 05-03.

## Next Phase Readiness

- Plan 05-02 (Admin Panel expansion) can proceed: `locationHistory`, `historyLoading`, `historyError`, `editForm`, `isEditing` state variables are declared; panel JSX skeleton is unchanged and ready for expansion.
- Plan 05-03 (Rejestr tab) can proceed: `allPosters`, `postersLoading`, `registryFilter`, `registrySearch`, `fetchAllPosters` are all in place; the `view === 'rejestr'` branch renders the placeholder that 05-03 will replace.

---
*Phase: 05-mapa-kampusu*
*Completed: 2026-04-05*
