# Phase 5: Mapa Kampusu - Research

**Researched:** 2026-04-05
**Domain:** React SPA — interactive map page with role-based UI, GAS backend, Tailwind CSS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Kontener mapy wypełnia całą dostępną przestrzeń (`flex-1`, `object-fit: contain`). Hotspoty pozycjonowane w % relative do naturalnych wymiarów obrazu — obliczone dynamicznie przez `onLoad` obrazu.
- **D-02:** Kontener mapy: `<div className="flex-1 relative overflow-hidden">` + `<img className="w-full h-full object-contain">`. Hotspoty: `style={{ top: calcTop(loc), left: calcLeft(loc) }}` przeliczane relatywnie do rendered dimensions.
- **D-03:** Filtry i wyszukiwarka przenoszone do sticky headera nad mapą. Struktura: `<div className="flex flex-col h-full">` → `<header className="shrink-0 bg-white border-b px-4 py-2 flex gap-3">` → `<div className="flex-1 relative">` (mapa z hotspotami).
- **D-04:** Tooltip po najechaniu na pineszkę — zawiera nazwę miejsca + typ + status kolorowy. Implementacja przez `useState(hoveredId)`.
- **D-05:** User widzi po kliknięciu: nazwę, pojemność, wolne miejsca, przycisk "Jak zarezerwować?". Bez zakładek.
- **D-06:** Admin widzi pełen panel z zakładkami: "Informacje" + "Zarządzaj" (aktywne plakaty + formularz dodawania + historia + statystyki + edycja danych lokalizacji).
- **D-07:** Filtry widoczne dla wszystkich (user i admin).
- **D-08:** Desktop: sliding panel z prawej (`fixed right-0`, 500px). Mobile: `fixed inset-0` (full screen modal). Breakpoint: `md:`.
- **D-09:** Zakładka "Zarządzaj" ma 4 sekcje: aktywne plakaty (lista + "Zdejmij"), formularz dodawania, historia (`getHistory` GAS), statystyki (z historii).
- **D-10:** Edycja danych lokalizacji inline w panelu admin — formularz z GAS `updateLocation`. Pola: `name`, `capacity`, `imageUrl`.
- **D-11:** MapPage ma przełącznik widoku w sticky headerze: "Mapa" / "Rejestr". Widoczny tylko dla admina (`userRole === 'admin'`).
- **D-12:** Widok Rejestru: tabela ze wszystkimi plakatami/banerami z całego kampusu. Kolumny: Kod CRED | Nazwa | Organizacja | Lokalizacja | Data zawieszenia | Termin zdjęcia | Status. Dane z GAS `getAllPosters`.
- **D-13:** Filtry w Rejestrze: "Wszystkie" / "Aktywne" / "Zakończone" + wyszukiwarka po nazwie/org/CRED.
- **D-14:** Nowe akcje GAS: `getHistory` (GET), `getAllPosters` (GET), `updateLocation` (POST) — implementowane po stronie GAS, frontend tylko wywołuje.
- **D-15:** Frontend wywołuje nowe akcje przez istniejący wzorzec `fetch(DATA_URL)`. Dodać error handling z komunikatem.
- **D-16:** Dodać `useEffect(() => { window.scrollTo(0,0); }, [])` — jak w KompendiumPage i KsiegaInwentarzPage.

### Claude's Discretion

- Dokładny breakpoint responsive panelu (obecny kod używa `md:` — zachować)
- Implementacja tooltipa (preferuj useState dla lepszej kontroli)
- Wizualne detale Rejestru (kolory statusów, sortowanie domyślne)
- Obsługa braku danych historycznych (skeleton / empty state)
- Ikony z lucide-react (MapPin, Filter, Search, Clock, BarChart2 itd.)

### Deferred Ideas (OUT OF SCOPE)

- CRUD lokalizacji (dodawanie/usuwanie pinezek z mapy)
- Mobilna mapa z pinch-to-zoom
- Powiadomienia push
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | Poprawić funkcjonalność modułu Mapy Kampusu (integracja z nową mapą z Photoshopa, interaktywność) | Responsive container fix (D-01/D-02), UI collision fix (D-03), tooltip (D-04), role split (D-05/D-06), Rejestr tab (D-11/D-12), new GAS actions (D-14/D-15) |
</phase_requirements>

---

## Summary

Phase 5 is a contained rewrite of a single file — `src/pages/MapPage.jsx` (currently 368 lines). The work falls into five distinct areas: (1) fix the responsive map container so a new high-res Photoshop image renders correctly at any viewport, (2) fix a z-index UI collision between the absolute-positioned filter bar and the App.jsx fixed back button, (3) add hover tooltip on hotspot pins, (4) split the detail panel into user vs admin roles with a new "Zarządzaj" admin sub-panel that includes history and stats, and (5) add a "Rejestr" tab (admin only) showing a table of all posters campus-wide.

All data comes from a Google Apps Script endpoint. Three new GAS actions must be implemented on the GAS side (`getHistory`, `getAllPosters`, `updateLocation`); the frontend only calls them using the existing `fetch(DATA_URL)` pattern already present in MapPage. The `activePosters` array from GAS currently omits `endDate` — this is a known bug that must be fixed in the GAS `doGet()` handler.

No new routes, no new npm packages, no new components outside MapPage are required. The entire change is self-contained: one .jsx file plus GAS-side edits.

**Primary recommendation:** Implement in a single-file rewrite of MapPage.jsx divided into clear waves — layout/responsive first, then tooltip, then admin panel expansion, then Rejestr tab, then GAS action calls.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI framework | Already in use project-wide |
| Tailwind CSS | 3.4.1 | Utility styling | Already in use project-wide |
| lucide-react | 1.7.0 | Icons | Already in use in KompendiumPage, KsiegaInwentarzPage |
| react-router-dom | 7.13.1 | Routing (no change) | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Google Apps Script (GAS) | n/a | Backend data endpoint | All data reads/writes go through DATA_URL |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState(hoveredId) for tooltip | CSS group-hover | useState gives programmatic control, easier to integrate with accessibility; CONTEXT.md prefers it |
| Inline tab state | React Router sub-routes | Tabs as state is simpler, no route change needed per CONTEXT.md |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Current File Structure (MapPage.jsx — 368 lines)

```
MapPage.jsx
├── State declarations (locations, filteredLocations, selected, loading, ...)
├── fetchData() — GET DATA_URL
├── handleAddPoster() — POST addPoster
├── handleRemovePoster() — POST removePoster
├── Loading spinner (early return)
└── JSX render
    ├── Absolute-positioned filter bar (BUG — to fix)
    ├── Map container (flex-1 bg-slate-100 relative) + img + hotspot buttons
    ├── Sliding detail panel (fixed right-0)
    └── Info modal (fixed inset-0 z-[100])
```

### Target File Structure (after phase)

```
MapPage.jsx
├── State declarations (+ view, hoveredId, locationHistory, allPosters, editForm, ...)
├── fetchData() — GET DATA_URL (no change)
├── fetchHistory(locationId) — GET DATA_URL?action=getHistory&locationId=X  [NEW]
├── fetchAllPosters() — GET DATA_URL?action=getAllPosters                    [NEW]
├── handleAddPoster() — POST addPoster (no change)
├── handleRemovePoster() — POST removePoster (no change)
├── handleUpdateLocation() — POST updateLocation                             [NEW]
├── calcTop(loc, imgRef) / calcLeft(loc, imgRef) — hotspot position helpers [NEW]
├── Loading spinner (early return) (no change)
└── JSX render
    ├── <div className="flex flex-col h-full">
    │   ├── <header className="shrink-0 ...">  (sticky filters + view toggle) [FIXED]
    │   └── {view === 'map' ? <MapView> : <RegistryView>}
    │       MapView:
    │       ├── <div className="flex-1 relative overflow-hidden">
    │       │   ├── <img ref={imgRef} className="w-full h-full object-contain" onLoad={...}>
    │       │   └── hotspot <button> elements + tooltip <div>
    │       └── Sliding detail panel (fixed right-0) — unchanged outer shell
    │           ├── User view: info + capacity + "Jak zarezerwować?"
    │           └── Admin view: "Informacje" tab + "Zarządzaj" tab
    │               Zarządzaj: active posters | add form | history | stats | edit location
    │       RegistryView (admin only):
    │       └── filter bar + table of all posters/banners
    └── Info modal (no change)
```

### Pattern 1: Responsive Map Container with Dynamic Hotspot Positioning

**What:** Image fills its container with `object-contain`. A `useRef` on the `<img>` element provides the rendered bounding box. An `onLoad` handler (or ResizeObserver if needed) stores `naturalWidth`/`naturalHeight`. `calcTop`/`calcLeft` convert GAS coordinates (stored as percentages in `loc.top`/`loc.left`) into CSS percentages relative to the rendered image area inside the container.

**When to use:** Any time hotspot positions are stored as pixel or percentage coordinates relative to the source image dimensions and the image is rendered with `object-contain` (which adds letterboxing).

**Key insight on coordinate conversion:** With `object-contain`, the rendered image may have letterbox bars (transparent areas) inside the container. The hotspot percentage must be mapped into the rendered image area, not the whole container. The formula:

```javascript
// Source: derived from CSS object-contain geometry
function calcHotspotStyle(loc, containerRef, naturalW, naturalH) {
  if (!containerRef.current) return {};
  const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
  const containerRatio = cw / ch;
  const imageRatio = naturalW / naturalH;

  let renderedW, renderedH, offsetX, offsetY;
  if (imageRatio > containerRatio) {
    // letterbox top/bottom
    renderedW = cw;
    renderedH = cw / imageRatio;
    offsetX = 0;
    offsetY = (ch - renderedH) / 2;
  } else {
    // letterbox left/right
    renderedH = ch;
    renderedW = ch * imageRatio;
    offsetX = (cw - renderedW) / 2;
    offsetY = 0;
  }

  // loc.top and loc.left are stored as percentage strings like "42.5%"
  const topPct = parseFloat(loc.top) / 100;
  const leftPct = parseFloat(loc.left) / 100;

  return {
    position: 'absolute',
    top: offsetY + topPct * renderedH,
    left: offsetX + leftPct * renderedW,
    transform: 'translate(-50%, -50%)',
  };
}
```

**Important:** The GAS sheet "Miejsca" stores `top`/`left` as percentages of the original image dimensions (confirmed in CONTEXT.md D-01). If the existing data uses raw `px` values, a one-time coordinate migration would be needed — verify format in GAS data before implementing.

**Alternative simpler approach (if GAS already stores percentages and image always fills full width):** Just use `style={{ top: loc.top, left: loc.left }}` directly — the image is `w-full h-full object-contain` so coordinates stored as % of image already work if the image fills the container axis-aligned. Confirm with real data before over-engineering.

### Pattern 2: Sticky Header with View Toggle (Admin)

**What:** A `shrink-0` header above the flex-1 map area. Contains filters (always visible) and a view toggle (admin only).

```jsx
// Source: pattern derived from existing filter bar + D-03
<div className="flex flex-col h-full">
  <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap gap-3 items-center">
    {/* Search */}
    <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 md:w-72">
      <Search className="w-4 h-4 text-slate-400" />
      <input ... />
    </div>
    {/* Type filter */}
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
      <button ...>WSZYSTKIE</button>
      <button ...>PLAKATY</button>
      <button ...>BANERY</button>
    </div>
    {/* View toggle — admin only */}
    {isAdmin && (
      <div className="ml-auto flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setView('map')} ...><Map className="w-4 h-4" /> Mapa</button>
        <button onClick={() => setView('rejestr')} ...><List className="w-4 h-4" /> Rejestr</button>
      </div>
    )}
  </header>
  <div className="flex-1 relative overflow-hidden">
    {view === 'map' ? <MapView /> : <RegistryView />}
  </div>
</div>
```

### Pattern 3: Hover Tooltip via useState(hoveredId)

**What:** A state variable `hoveredId` tracks which pin the user is hovering. The tooltip div appears above the pin when `hoveredId === loc.id`.

```jsx
// Source: D-04 decision
const [hoveredId, setHoveredId] = useState(null);

// Inside hotspot button:
<button
  onMouseEnter={() => setHoveredId(loc.id)}
  onMouseLeave={() => setHoveredId(null)}
  onClick={() => { setSelected(loc); setAdminTab('info'); }}
  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all hover:scale-125 focus:outline-none z-20"
  style={calcHotspotStyle(loc, ...)}
>
  {/* Pin icon */}
  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white
    ${loc.type === 'baner' ? 'bg-orange-500' : 'bg-blue-600'}
    ${loc.free === 0 ? 'ring-4 ring-red-500/50' : ''}`}>
    {loc.type === 'baner' ? <Flag className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
  </div>
  {/* Tooltip */}
  {hoveredId === loc.id && (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
      bg-slate-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl pointer-events-none">
      <p className="font-bold">{loc.name}</p>
      <p className="text-slate-300 capitalize">{loc.type}</p>
      <p className={`font-bold ${loc.free > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {loc.free > 0 ? `${loc.free} wolne` : 'Brak miejsc'}
      </p>
      {/* Triangle */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  )}
</button>
```

### Pattern 4: GAS Fetch — New Actions

**What:** New GET actions follow the existing query-string pattern. New POST actions follow the existing POST pattern.

```javascript
// GET with action param — Source: D-14, D-15
const fetchHistory = async (locationId) => {
  setHistoryLoading(true);
  try {
    const res = await fetch(`${DATA_URL}?action=getHistory&locationId=${locationId}`);
    const data = await res.json();
    setLocationHistory(data.history || []);
  } catch (err) {
    console.error(err);
    setHistoryError('Nie udało się pobrać historii.');
  } finally {
    setHistoryLoading(false);
  }
};

// POST — updateLocation — Source: D-10, D-14, D-15
const handleUpdateLocation = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    await fetch(DATA_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateLocation',
        locationId: selected.id,
        name: editForm.name,
        capacity: editForm.capacity,
        imageUrl: editForm.imageUrl,
      }),
    });
    fetchData(); // refresh
  } catch (err) {
    alert('Błąd zapisu. Spróbuj ponownie.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Critical:** GAS endpoints return JSON after a redirect (Chrome extension issue workaround already solved: `redirect: 'follow'` and `Content-Type: 'text/plain;charset=utf-8'`). Use the same pattern for all new POST calls.

### Pattern 5: isAdmin Check — Two Roles

**What:** Both `'admin'` and `'logitech'` roles get admin access in MapPage. This is already in the existing code comment but the current code only checks `userRole === 'admin'`. The CONTEXT.md explicitly says to preserve the `logitech` check.

```javascript
// Source: CONTEXT.md code_context "Istniejące wzorce"
const isAdmin = userRole === 'logitech' || userRole === 'admin';
```

**Current code bug:** Line 9 of MapPage.jsx currently reads `const isAdmin = userRole === 'admin'` — missing the `'logitech'` check. This must be fixed.

### Anti-Patterns to Avoid

- **Fixed/absolute overlay filters:** The current `absolute top-4 left-4 z-30` pattern collides with App.jsx's `fixed top-6 left-6 z-50` back button. Never use absolute-positioned overlay controls on pages that share the App.jsx shell.
- **Hardcoded image height:** `h-[800px]` on the `<img>` element forces horizontal scroll on smaller viewports. Use `w-full h-full object-contain` instead.
- **Eager history fetch on panel open:** Fetching history for every location on page load wastes GAS quota. Fetch lazily when user opens the "Zarządzaj" tab (see D-09).
- **Coordinate assumptions:** Don't assume `loc.top`/`loc.left` are already CSS-ready percentages without confirming the GAS data format first. If GAS stores raw px values against a fixed reference image size, you need a conversion step.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icons (MapPin, Search, Filter, Clock, BarChart2, X, List, Map, Plus, Trash2) | Custom SVG | `lucide-react` (already installed, v1.7.0, all icons confirmed present) | Consistent style, accessible |
| Table styling | Custom CSS grid | Tailwind utility classes matching existing page patterns | Consistency with codebase |
| Responsive breakpoints | Custom media queries | Tailwind `md:` prefix (already used project-wide) | Consistent with existing panel code |
| Loading state | Custom spinner | Existing project spinner pattern (border-t-transparent animate-spin) | Already established |

**Key insight:** This phase requires zero new npm packages. Everything needed is already in the project's dependency tree.

---

## Common Pitfalls

### Pitfall 1: isAdmin Missing 'logitech' Role

**What goes wrong:** Admin features (Zarządzaj tab, Rejestr) are invisible to `logitech` users.
**Why it happens:** Line 9 of current MapPage.jsx: `const isAdmin = userRole === 'admin'` — the `'logitech'` role is missing.
**How to avoid:** Always use `const isAdmin = userRole === 'logitech' || userRole === 'admin'`.
**Warning signs:** Logitech-role user cannot see the "Zarządzaj" tab or "Rejestr" toggle.

### Pitfall 2: Hotspot Positions Wrong After Object-Contain Resize

**What goes wrong:** Pins appear in the wrong position when viewport is resized or image has letterboxing.
**Why it happens:** CSS `object-contain` adds transparent bars — hotspot % calculated against container dimensions instead of rendered image dimensions.
**How to avoid:** Calculate rendered image dimensions using `getBoundingClientRect()` on the img element (or the container ref) combined with natural aspect ratio. Use a `resize` listener or `onLoad` trigger to recalculate.
**Warning signs:** Pins drift off their targets when browser window is resized.

### Pitfall 3: activePosters Missing endDate

**What goes wrong:** "Zdjąć do: undefined" shown in the admin panel active posters list.
**Why it happens:** GAS `doGet()` doesn't include `endDate` in `activePosters[]` — confirmed bug in CONTEXT.md.
**How to avoid:** Fix on GAS side: add `endDate: Utilities.formatDate(new Date(row[1]), 'Europe/Warsaw', 'dd.MM.yyyy')` when building activePosters in doGet().
**Warning signs:** `poster.endDate` is undefined in frontend data; existing line 279 renders "Zdjąć do: undefined".

### Pitfall 4: GAS Redirect / CORS on New Actions

**What goes wrong:** New fetch calls for `getHistory` / `getAllPosters` / `updateLocation` fail silently or throw CORS errors.
**Why it happens:** GAS endpoints redirect; Chrome extensions and some fetch configurations don't follow redirects properly.
**How to avoid:** Use existing proven pattern: `redirect: 'follow'` for POST calls, `Content-Type: 'text/plain;charset=utf-8'`. GET calls for new actions append query params to DATA_URL — no headers needed.
**Warning signs:** `fetch` returns a redirect response body that isn't JSON; console shows CORB or CORS error.

### Pitfall 5: Panel z-index Conflict

**What goes wrong:** The sliding detail panel (z-40) hides behind or improperly overlaps with App.jsx's `fixed top-6 left-6 z-50` back button.
**Why it happens:** The back button is `z-50`, panel is `z-40`. On mobile (full screen panel), the back button shows through.
**How to avoid:** The detail panel is already `z-40` and the back button `z-50`. This is acceptable — the back button will show on top of the panel on mobile. If this is undesirable, the mobile panel can use `z-[55]` but this must be a conscious decision.
**Warning signs:** On mobile, back button appears inside the detail panel area.

### Pitfall 6: view State Not Reset on Route Change

**What goes wrong:** User navigates away and back — `view` state is reset to 'map' by default, which is correct. No pitfall here, but ensure `view` defaults to `'map'`.
**How to avoid:** `const [view, setView] = useState('map')`.

### Pitfall 7: Rejestr Visible to Non-Admin Users

**What goes wrong:** A regular user sees the "Rejestr" tab toggle or navigates to the registry view.
**Why it happens:** Conditional on wrong role check.
**How to avoid:** `{isAdmin && <button onClick={() => setView('rejestr')}>Rejestr</button>}`. Also guard inside RegistryView render: if not isAdmin, return null.

---

## Code Examples

### Scroll to Top on Mount (project-standard pattern)

```javascript
// Source: KompendiumPage.jsx line 241, KsiegaInwentarzPage.jsx line 95
useEffect(() => { window.scrollTo(0, 0); }, []);
```

### Existing POST Pattern (proven working)

```javascript
// Source: MapPage.jsx handleAddPoster()
await fetch(DATA_URL, {
  method: 'POST',
  redirect: 'follow',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload)
});
```

### Existing Panel Slide Pattern (preserve this)

```javascript
// Source: MapPage.jsx line 190
<div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-500 ease-in-out z-40 overflow-y-auto ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
```

### Empty State Pattern (consistent with codebase)

```jsx
// Source: MapPage.jsx line 291 (existing empty poster state)
<p className="text-sm font-bold text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
  Brak danych historycznych.
</p>
```

### Loading Skeleton for Lazy-Fetched History

```jsx
// Discretion: consistent with project spinner style
{historyLoading && (
  <div className="flex items-center justify-center py-6 gap-3">
    <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ładowanie historii...</span>
  </div>
)}
```

---

## GAS Schema Reference

### Sheet: Rezerwacje_Mapy

| Col | Field | Notes |
|-----|-------|-------|
| A | locationId | id lokalizacji |
| B | endDate | Date object — format `dd.MM.yyyy` for frontend |
| C | posterName | nazwa plakatu |
| D | organization | organizacja |
| E | email | email rezerwującego |
| F | locationType | 'plakat' lub 'baner' |
| G | credId | znak CRED np. CRED-24-001 |

### Sheet: REJESTR_PLAKATOWANIA / REJESTR_BANEROW

| Col | Field |
|-----|-------|
| A | id |
| B | credId (znak) |
| C | org |
| D | email |
| E | dataZgody |
| F | opisPromo |
| G | opisObowiazku |
| H | dataZdjecia |
| I | statusReczny |
| M | statusSystem (AKTYWNE / ZDJETE) |

### Sheet: Miejsca

| Field | Notes |
|-------|-------|
| id | lokalizacji |
| name | nazwa |
| type | 'plakat' lub 'baner' |
| top | pozycja Y (jako %) |
| left | pozycja X (jako %) |
| capacity | pojemność |
| image | URL zdjęcia |

### GAS doGet() Current Response Shape

```json
{
  "locations": [
    {
      "id": "TAB-01",
      "name": "Tablica A",
      "type": "plakat",
      "top": "42.5%",
      "left": "31.2%",
      "capacity": 3,
      "free": 1,
      "image": "https://...",
      "activePosters": [
        { "credId": "CRED-24-001", "nazwa": "...", "org": "..." }
      ]
    }
  ]
}
```

**Bug:** `activePosters[]` items are missing `endDate`. Fix in GAS `doGet()`:
```javascript
// Add to GAS doGet() when building activePosters array:
endDate: Utilities.formatDate(new Date(row[1]), 'Europe/Warsaw', 'dd.MM.yyyy')
```

### New GAS Action: getHistory

```
GET: DATA_URL?action=getHistory&locationId=TAB-01

Response:
{
  "history": [
    { "credId": "CRED-24-001", "nazwa": "...", "org": "...", "endDate": "15.03.2026", "status": "ZDJETE" }
  ]
}
```

GAS implementation: filter Rezerwacje_Mapy by col A = locationId (all rows, not just active), then for each row join to REJESTR_PLAKATOWANIA/REJESTR_BANEROW by credId (col G → col B) to get statusSystem (col M).

### New GAS Action: getAllPosters

```
GET: DATA_URL?action=getAllPosters

Response:
{
  "posters": [
    {
      "credId": "CRED-24-001",
      "org": "NZS UEW",
      "email": "...",
      "dataZgody": "01.01.2026",
      "dataZdjecia": "15.03.2026",
      "status": "AKTYWNE",
      "type": "plakat",
      "locationId": "TAB-01",
      "nazwa": "Wampiriada"
    }
  ]
}
```

GAS implementation: read REJESTR_PLAKATOWANIA + REJESTR_BANEROW; join to Rezerwacje_Mapy via credId (col G) to get locationId (col A) and posterName (col C).

### New GAS Action: updateLocation

```
POST body: { "action": "updateLocation", "locationId": "TAB-01", "name": "Nowa Nazwa", "capacity": 4, "imageUrl": "https://..." }

Response: { "success": true }
```

GAS implementation: find row in Miejsca where id = locationId; update name/capacity/imageUrl columns.

---

## State Additions Required

The following new state variables must be added to MapPage:

| Variable | Type | Initial | Purpose |
|----------|------|---------|---------|
| `view` | string | `'map'` | Switch between map and registry views |
| `hoveredId` | string/null | `null` | Tooltip display on pin hover |
| `locationHistory` | array | `[]` | History for selected location (lazy) |
| `historyLoading` | bool | `false` | Loading state for history fetch |
| `historyError` | string/null | `null` | Error state for history fetch |
| `allPosters` | array | `[]` | All posters for registry view (lazy) |
| `postersLoading` | bool | `false` | Loading state for getAllPosters |
| `registryFilter` | string | `'all'` | Filter in registry: 'all'/'aktywne'/'zakonczone' |
| `registrySearch` | string | `''` | Search term for registry table |
| `editForm` | object | `{}` | Form state for updateLocation |
| `isEditing` | bool | `false` | Toggle edit mode for location data |
| `imgRef` | ref | `useRef()` | Ref to img element for dimension calculation |
| `imgDimensions` | object | `{}` | Rendered image dimensions for hotspot calc |

---

## Environment Availability

Step 2.6: No external dependencies beyond the already-running GAS endpoint. All npm packages verified installed. No environment probing needed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| lucide-react | Icons | Yes | 1.7.0 | — |
| tailwindcss | Styling | Yes | 3.4.1 | — |
| GAS endpoint | All data | Assumed (existing live endpoint) | n/a | Show error state |

---

## Validation Architecture

`nyquist_validation` is set to `false` in `.planning/config.json` — this section is skipped per configuration.

---

## Open Questions

1. **GAS coordinate format for `loc.top` / `loc.left`**
   - What we know: CONTEXT.md D-01 says positions are stored as "px/% GAS" and converted dynamically. Current code uses `style={{ top: loc.top, left: loc.left }}` directly (treating them as CSS-ready values).
   - What's unclear: Whether existing GAS data stores these as `"42%"` strings (CSS-ready) or raw pixel integers. If pixel integers, the conversion formula needs a known reference image size.
   - Recommendation: Check actual GAS response during Wave 1 implementation. If already `%` strings, use them directly via the simpler approach. The letterbox geometry formula is only needed if coordinates fall outside the rendered image area.

2. **GAS-side implementation timing**
   - What we know: The three new GAS actions (`getHistory`, `getAllPosters`, `updateLocation`) must be implemented by someone with GAS editor access.
   - What's unclear: Whether GAS changes are in scope for this phase's implementer or handled separately.
   - Recommendation: Plan includes a GAS implementation task. Frontend tasks for these features should be coded defensively (empty state for missing data) so the frontend can be deployed before GAS is updated.

3. **`poster.endDate` display in active posters**
   - What we know: Currently shows "Zdjąć do: undefined" because GAS omits endDate.
   - What's unclear: Whether to show a fallback ("—") in the frontend before the GAS fix, or require GAS fix first.
   - Recommendation: Add GAS fix as an early task; also add frontend fallback `{poster.endDate ?? '—'}` as defensive coding.

---

## Sources

### Primary (HIGH confidence)

- Direct code read: `src/pages/MapPage.jsx` (368 lines, full read) — existing state, patterns, bugs
- Direct code read: `src/App.jsx` — BackButton component `fixed top-6 left-6 z-50`
- Direct code read: `src/context/AuthContext.jsx` — userRole patterns
- Direct code read: `.planning/phases/05-mapa-kampusu/05-CONTEXT.md` — all design decisions, GAS schema
- Direct code read: `package.json` — confirmed installed packages and versions
- Runtime verification: `lucide-react@1.7.0` installed; icons MapPin, Filter, Search, Clock, BarChart2, X, List, Map, Plus, Trash2, AlertTriangle, CheckCircle all present

### Secondary (MEDIUM confidence)

- Pattern inference from `KompendiumPage.jsx` and `KsiegaInwentarzPage.jsx` — scroll-to-top, lucide-react usage patterns
- CSS `object-contain` letterbox geometry — standard CSS specification behavior

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified from package.json and node_modules
- Architecture: HIGH — derived from full code read + CONTEXT.md decisions
- GAS schema: HIGH — documented in CONTEXT.md as verified against GAS script
- Pitfalls: HIGH — derived from direct bugs found in code + CONTEXT.md notes
- Hotspot coordinate conversion: MEDIUM — formula is correct CSS geometry but exact GAS data format unverified (open question 1)

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable stack, no rapidly-changing dependencies)
