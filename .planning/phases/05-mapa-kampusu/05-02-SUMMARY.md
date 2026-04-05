---
phase: 05-mapa-kampusu
plan: "02"
subsystem: ui
tags: [react, tailwind, mappage, admin-panel, gas, history, edit-location]

# Dependency graph
requires:
  - 05-01 (locationHistory, historyLoading, historyError, editForm, isEditing state variables)
provides:
  - fetchHistory function (lazy GET getHistory from GAS)
  - handleUpdateLocation function (POST updateLocation to GAS)
  - Full Zarządzaj tab with 4 sections: active posters, add form, history, stats
  - Edit location form (name, capacity, imageUrl) wired to handleUpdateLocation
  - useEffect([adminTab, selected]) triggering fetchHistory + editForm seed on tab open
  - endDate ?? '—' fallback guarding against GAS activePosters bug
affects:
  - 05-03-rejestr (no overlap — this plan only touches the panel/Zarządzaj section)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy fetch on tab open: useEffect([adminTab, selected]) triggers fetchHistory only when adminTab === 'zarzadzaj'
    - Defensive null fallback: poster.endDate ?? '—' protects against GAS activePosters missing endDate field
    - POST updateLocation: same proven pattern (redirect:follow, Content-Type text/plain) as addPoster/removePoster

key-files:
  created: []
  modified:
    - src/pages/MapPage.jsx

key-decisions:
  - "fetchHistory lazy-loaded on adminTab === 'zarzadzaj' open — not on page load (preserves GAS quota per D-09)"
  - "poster.endDate ?? '—' fallback — GAS bug fix deferred to GAS-side, frontend guards defensively"
  - "Stats section conditionally rendered only when locationHistory.length > 0 — avoids empty grid flash"
  - "useEffect([adminTab, selected]) also seeds editForm with selected.name/capacity/image — avoids stale form values on location switch"

# Metrics
duration: 25min
completed: 2026-04-05
---

# Phase 05 Plan 02: Mapa Kampusu — Admin Panel Expansion Summary

**Full admin panel with Zarządzaj tab implementing 4 sections (active posters, add form, lazy history, stats) plus inline edit location form wired to GAS updateLocation action**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-05T20:10:00Z
- **Completed:** 2026-04-05T20:30:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `fetchHistory(locationId)` — lazy GET to `DATA_URL?action=getHistory&locationId=X`; resets locationHistory/historyLoading/historyError on each call
- Added `handleUpdateLocation(e)` — POST to GAS `updateLocation` action with name/capacity/imageUrl payload; calls fetchData() on success to refresh map pins
- Added `useEffect([adminTab, selected])` — triggers fetchHistory + seeds editForm when Zarządzaj tab is opened; handles location switching correctly
- Replaced the single-section Zarządzaj JSX block with full 4-section implementation:
  - Section 1: Active posters list with `poster.endDate ?? '—'` defensive fallback
  - Section 2: Add poster form (visible only when `selected.free > 0`)
  - Section 3: History with loading spinner, error state, empty state, and entry list
  - Section 4: Stats grid (total reservations + currently active) — rendered only when history available
- Added inline edit location form with name/capacity/imageUrl fields and Edytuj/Anuluj/Zapisz controls
- Documented GAS endDate bug in code comment with exact fix for GAS developer
- Build passes with exit 0

## Functions Added (line numbers)

| Function | Line | Description |
|----------|------|-------------|
| `fetchHistory` | 217 | Lazy GET getHistory from GAS; called from useEffect on adminTab change |
| `handleUpdateLocation` | 234 | POST updateLocation to GAS; closes edit mode and refreshes data on success |
| useEffect trigger | 129 | `[adminTab, selected]` dependency — fires fetchHistory + seeds editForm |

## Task Commits

1. **Task 1: fetchHistory, handleUpdateLocation, lazy-fetch useEffect** — `0ee3609`
2. **Task 2: Full Zarządzaj tab JSX — 4 sections + edit location form** — `747b651`

## Files Created/Modified

- `src/pages/MapPage.jsx` — Admin panel expansion: fetchHistory, handleUpdateLocation, full Zarządzaj tab JSX

## Decisions Made

- **Lazy fetch pattern confirmed**: `useEffect([adminTab, selected])` with `adminTab === 'zarzadzaj'` guard — fetches history only when the tab is opened, not on every render or page load.
- **editForm seeded in same useEffect**: When the Zarządzaj tab opens, `setEditForm({ name: selected.name, capacity: selected.capacity, imageUrl: selected.image })` ensures the edit form always reflects the currently selected location (handles location switching correctly).
- **Stats conditional on history**: `{locationHistory.length > 0 && <section>...stats...</section>}` avoids showing an empty 0/0 grid before history loads.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mixed `??` and `||` operator precedence in JSX**
- **Found during:** Task 2 — `npm run build` failed
- **Issue:** `selected.free ?? selected.capacity || 0` mixes nullish coalescing (`??`) and logical OR (`||`) without explicit precedence grouping — rolldown parser rejects it
- **Fix:** Added parentheses: `selected.free ?? (selected.capacity || 0)`
- **Files modified:** `src/pages/MapPage.jsx` line 454
- **Commit:** `747b651` (included in Task 2 commit)

## GAS Note: endDate Bug in activePosters

**Issue:** GAS `doGet()` returns `activePosters[]` without `endDate` field — frontend previously showed "Zdjąć do: undefined".

**Frontend fix (this plan):** `{poster.endDate ?? '—'}` — displays dash when endDate is missing.

**Required GAS-side fix:** In `doGet()`, when building the `activePosters` array, add to the push:
```javascript
endDate: Utilities.formatDate(new Date(row[1]), 'Europe/Warsaw', 'dd.MM.yyyy')
```
Where `row[1]` is column B (endDate) of the Rezerwacje_Mapy sheet.

## React useEffect Dependency Warning

No React warning was triggered. The `useEffect([adminTab, selected])` dependency array correctly lists both dependencies. `fetchHistory` is defined inside the component and is recreated on each render, but since it is not listed as a dependency (only `adminTab` and `selected` are), this is intentional — the effect only re-runs when the tab or location changes, not every render. If eslint-plugin-react-hooks is active, it may suggest adding `fetchHistory` to deps; this can be resolved by wrapping `fetchHistory` in `useCallback` in a future cleanup, but is not needed for correctness.

## Build Status

`npm run build` exits 0. Pre-existing chunk size warning (>500kB) is unrelated to this plan's changes.

## Known Stubs

None — all sections implemented. The `fetchHistory` and `handleUpdateLocation` functions make real GAS calls; they will return errors or empty states until the GAS-side `getHistory` and `updateLocation` actions are implemented (tracked in D-14 as GAS-side work).

---
*Phase: 05-mapa-kampusu*
*Completed: 2026-04-05*
