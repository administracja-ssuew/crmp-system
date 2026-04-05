---
phase: 05-mapa-kampusu
plan: "03"
subsystem: ui
tags: [react, tailwind, lucide-react, mappage, rejestr, registry, getAllPosters]

# Dependency graph
requires:
  - "05-01"
  - "05-02"
provides:
  - fetchAllPosters function with allPosters.length > 0 lazy guard
  - useEffect triggering fetchAllPosters when view === 'rejestr' && isAdmin
  - Full RegistryView JSX block replacing placeholder from 05-01
  - Filter tabs (Wszystkie / Aktywne / Zakończone) with client-side filtering
  - Search bar filtering by credId, nazwa, org (case-insensitive)
  - Result count badge (X wyników)
  - Loading spinner during fetch (postersLoading)
  - 7-column table: Kod CRED | Nazwa | Organizacja | Lokalizacja | Data zawieszenia | Termin zdjęcia | Status
  - Color-coded status badge: emerald for AKTYWNE, slate for others
  - Empty state (no data vs. no filter matches)
affects:
  - Admins can now see the Rejestr Plakatów i Banerów view at all campus locations

# Tech tracking
tech-stack:
  added: []
  patterns:
    - allPosters.length > 0 guard pattern for lazy-fetch caching
    - IIFE pattern for filtered calculations inside JSX (avoids separate state)
    - Two-stage empty state (no data vs. filtered empty)

key-files:
  created: []
  modified:
    - src/pages/MapPage.jsx

key-decisions:
  - "fetchAllPosters uses allPosters.length > 0 guard — toggleing back to Rejestr uses cached data without re-fetching GAS"
  - "RegistryView inserted at lines 364-503 replacing 'Widok Rejestru — wkrótce' placeholder from 05-01"
  - "Search icon already imported in 05-01 — no new imports needed"
  - "Filter logic computed inline via IIFE in JSX — no extra state variable for filtered results"
  - "View toggle button simplified: removed inline allPosters.length === 0 check (now handled by useEffect + guard inside function)"
  - "Preserved all 05-02 admin panel content (fetchHistory, handleUpdateLocation, Zarządzaj sections) in the merged write"

requirements-completed:
  - MAP-01

# Metrics
duration: 21min
completed: 2026-04-05
---

# Phase 05 Plan 03: Rejestr Plakatów i Banerów Summary

**RegistryView component replacing placeholder with full-width table listing all campus posters/banners — lazy-fetched from GAS getAllPosters, with Wszystkie/Aktywne/Zakończone filter tabs, search bar, loading spinner, color-coded status badges, and two empty states**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-04-05T20:27:42Z
- **Completed:** 2026-04-05T20:48:56Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

### Task 1: fetchAllPosters with lazy guard + useEffect

- Added `if (allPosters.length > 0) return;` guard inside `fetchAllPosters` — prevents redundant GAS calls when admin toggles between Mapa and Rejestr views
- Added `setAllPosters([])` in catch block for clean error state (was missing in 05-01 stub)
- Added useEffect triggered by `view === 'rejestr' && isAdmin` — lazy-fetch fires automatically on first Rejestr view switch
- Simplified the view toggle Rejestr button (removed inline `if (allPosters.length === 0) fetchAllPosters()` call since the useEffect + guard handles it)

### Task 2: Full RegistryView JSX block

- Replaced `<div>Widok Rejestru — wkrótce</div>` placeholder (05-01 output) with complete RegistryView
- Filter bar: Wszystkie / Aktywne / Zakończone tab pills (matching project's existing toggle pill pattern)
- Search input: filters by `credId`, `nazwa`, `org` — case-insensitive, client-side
- Result count badge: shows filtered count in top-right of filter bar
- Loading state: spinning border-t-transparent spinner during `postersLoading`
- Empty state (2 variants): "Brak danych w rejestrze" (no data) vs "Brak wyników dla wybranych filtrów" (filter miss)
- Table: sticky header with 7 columns: Kod CRED | Nazwa | Organizacja | Lokalizacja | Data zawieszenia | Termin zdjęcia | Status
- Status badge: `bg-emerald-100 text-emerald-700` for AKTYWNE, `bg-slate-200 text-slate-600` for others
- All filtering is purely client-side — no extra GAS calls per filter/search action

## Integration with 05-02

The write operation preserved all 05-02 admin panel content (fetchHistory, handleUpdateLocation, full Zarządzaj tab with 4 sections, location edit form). The final file integrates:
- Wave 1 (05-01): Layout, hotspots, tooltips, sticky header
- Wave 2 (05-02): Admin panel expansion (history, stats, location edit)
- Wave 2 (05-03): Rejestr view (this plan)

## Task Commits

NOTE: Git commit operations were blocked by sandbox permissions in this agent's worktree. The implementation is complete and build-verified. Commits require manual execution or orchestrator merge:

```bash
# From worktree: /c/Users/Mikołaj/Downloads/stand-dashboard-main/.claude/worktrees/agent-a57bebe4
git add src/pages/MapPage.jsx
git commit --no-verify -m "feat(05-03): add fetchAllPosters lazy guard, useEffect trigger, and RegistryView JSX

- Add allPosters.length > 0 guard inside fetchAllPosters to skip re-fetch
- Add setAllPosters([]) in catch block for clean error state
- Add useEffect triggered by view === 'rejestr' && isAdmin for lazy-fetch
- Add full RegistryView JSX: filter tabs, search, spinner, 7-col table, status badges, empty states
"
```

## Files Created/Modified

- `src/pages/MapPage.jsx` — Added fetchAllPosters lazy guard, useEffect trigger, and full RegistryView JSX (815 lines total after all wave changes)

## Verification Results

All acceptance criteria verified via grep and build:

- `const fetchAllPosters = async () => {` — line 77
- `if (allPosters.length > 0) return;` — line 78
- `?action=getAllPosters` — line 81
- `data.posters || []` — line 83
- `view === 'rejestr' && isAdmin` — line 147 (useEffect)
- `Kod CRED` — line 461 (table column header)
- `registryFilter === 'aktywne'` — lines 408, 436
- `registrySearch.toLowerCase()` — lines 410, 438
- `poster.status === 'AKTYWNE'` — line 482
- `bg-emerald-100 text-emerald-700` — line 483
- `Brak wyników dla wybranych filtrów` — line 452
- `Brak danych w rejestrze` — line 451
- `postersLoading` spinner — line 425
- Build: `npx vite build` exits 0 (no errors, pre-existing chunk size warnings only)

## Decisions Made

- **Lazy guard inside function** — The `allPosters.length > 0` check inside `fetchAllPosters` is the canonical guard. The useEffect triggers it, and the guard prevents double-fetch even if called from both the button click AND the useEffect.
- **Search icon already imported** — `Search` was imported in 05-01 (`import { MapPin, Flag, Search, Map, List, X } from 'lucide-react'`). No new import needed.
- **Filter logic via IIFE** — Used `{!postersLoading && (() => { ... })()}` pattern to compute filtered array inline without adding a separate `filteredPosters` state variable. Keeps state minimal.
- **Client-side filtering only** — No GAS calls triggered per filter/search action. All filtering happens against the cached `allPosters` array. Re-fetch only happens on first Rejestr view open.

## Deviations from Plan

**None from plan scope.** The plan executed exactly as written.

**Integration deviation (auto-handled):** The 05-02 agent wrote additional content to the shared `src/pages/MapPage.jsx` file between my Task 1 and Task 2 reads. I merged both the 05-02 admin panel content AND my 05-03 registry content into a single complete file write (815 lines). This preserved all 05-02 work while adding the 05-03 registry implementation.

**Commit deviation (environment constraint):** Git commit operations were blocked by the agent sandbox permissions. The implementation is complete and build-verified. The orchestrator or user must commit manually from the worktree directory.

## Known Stubs

None — the RegistryView is fully implemented. Data from GAS getAllPosters will display immediately once the GAS backend implements the `getAllPosters` action (documented in D-14 as a GAS-side task, not frontend scope).

## Self-Check

**File exists:**
- `src/pages/MapPage.jsx` — FOUND (815 lines) — contains all required content

**Build:** `npx vite build` — PASSED (exit 0)

**Grep verification:** All 14 acceptance criteria strings present

**Commits:** BLOCKED by sandbox permissions — requires manual git add + commit from worktree

## Self-Check: PARTIAL

Implementation complete and verified. Commits pending due to sandbox permission restriction on `git add`/`git commit`. All other criteria met.
