# Phase 4: Kompendium + Księga Inwentarzowa — Research

**Researched:** 2026-04-05
**Domain:** React 18 + Tailwind CSS — UI-only page redesign and new page creation
**Confidence:** HIGH (all findings from direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**KompendiumPage — Layout Redesign**
- D-01: Add colorful section headers with icons for every major section (Wstęp, Słownik, Przed, Podczas, Po, Typy protokołów, Błędy, Wzory i szablony). Each section gets a visually distinct card/header treatment.
- D-02: Add a reading progress bar at the top of the page (horizontal bar showing scroll progress through the document).
- D-03: Add a summary intro card ("Co znajdziesz tutaj") at the start of each major section — 2–3 bullet points of what the section covers.
- D-04: Refresh color palette and typography — keep existing structure and component logic (sticky nav, IntersectionObserver, Checklist, Accordion, ProtocolCard components all stay), update visual styling only.
- D-05: Preserve sessionStorage-based checklist state (key: `kompendium_checklist_v1`) — do not break existing persistence.

**KompendiumPage — Sekcja Szablonów Dokumentów (KOMP-02)**
- D-06: Add a "Wzory i szablony" section at the end of KompendiumPage with its own entry in the sticky nav (`NAV_ITEMS`).
- D-07: Templates displayed as a card grid (3 columns on desktop, responsive). Each card: document icon + name + "Otwórz" button → opens Google Drive link in new tab.
- D-08: 7–15 templates expected. Links are hardcoded in the component data array (same pattern as `BEFORE_ITEMS`, `AFTER_ITEMS`). Planner should add placeholder array with TODO comments for the actual Drive URLs.
- D-09: No categories needed for this count — flat grid is sufficient.

**KsiegaInwentarzPage — Treść (7 sekcji)**
- D-10: Page has exactly 7 sections (see CONTEXT.md for full list).
- D-11: Photos of the physical ledger in `/public/ksiega/` — embed as `<img>` with placeholder and TODO comment.

**KsiegaInwentarzPage — Interaktywność**
- D-12: Checklist for adding new ledger entry — same Checklist component pattern, sessionStorage key: `ksiega_checklist_v1`.
- D-13: Accordion for 15 columns — same Accordion component pattern.
- D-14: Static comparison table (Cecha | Księga Inwentarzowa | Ewidencja cyfrowa).
- D-15: Entry simulator — educational form (Kol. 4/5/6/7), preview row, validation with red border on empty required fields. No saving, no backend.

**KsiegaInwentarzPage — Nawigacja**
- D-16: Sticky side nav (same pattern as KompendiumPage): left drawer on desktop (lg:), dropdown select on mobile. IntersectionObserver for active section tracking.
- D-17: New route: `/ksiega-inwentarzowa` in App.jsx, wrapped in `<ProtectedRoute>`.
- D-18: New dashboard card in DashboardPage linking to `/ksiega-inwentarzowa`.

### Claude's Discretion
- Exact color palette for section headers (should be visually distinct but cohesive with existing Tailwind palette)
- Exact icon choices from lucide-react (already imported in KompendiumPage)
- Exact wording of checklist steps for D-12
- Exact wording of FAQ entries for section 7 of KsiegaInwentarzPage
- Order of nav items in KsiegaInwentarzPage
- Whether to add a "scroll to top" button in KsiegaInwentarzPage (existing pattern — safe to replicate)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KOMP-01 | Uatrakcyjnić UI Kompendium Wiedzy Protokolanta — nowy layout, karty, sekcje, estetyka | Plan 4.1: Redesign existing KompendiumPage with colored section headers, intro cards, progress bar |
| KOMP-02 | Dodać wzory i szablony dokumentów do Kompendium | Plan 4.2: New "Wzory i szablony" section + card grid at end of KompendiumPage |
| INV-01 | Nowa zakładka Księga Inwentarzowa — informacyjny przewodnik po inwentarzu SSUEW | Plan 4.3: New KsiegaInwentarzPage with route, dashboard card, 7 sections, all interactive components |
</phase_requirements>

---

## Summary

Phase 4 is a pure frontend UI phase — no backend, no Firestore, no GAS integration. All three plans touch a single file each (Plan 4.1 and 4.2 both modify `KompendiumPage.jsx`; Plan 4.3 creates `KsiegaInwentarzPage.jsx` and makes minimal additions to `App.jsx` and `DashboardPage.jsx`).

The existing `KompendiumPage.jsx` (1111 lines) is a self-contained file with all sub-components defined inline (no shared component library). This is the established pattern for the project — KsiegaInwentarzPage must follow the same structure. Components are: `DeadlineBadge`, `Checklist`, `Accordion`, `ProtocolCard`, `SectionTitle` — all defined as inner functions inside the default export. State management uses `useState` + `sessionStorage` only. No context, no Redux, no external state.

The primary implementation risk is the progress bar (D-02): it requires a `scroll` event listener that reads `window.scrollY` and the full document height to compute a percentage. This is a new pattern not present in KompendiumPage but straightforward to implement.

**Primary recommendation:** Copy KompendiumPage.jsx's full structural pattern (IntersectionObserver setup, sticky nav, scroll-to helper, sessionStorage init, sub-component definitions) verbatim into KsiegaInwentarzPage.jsx and adapt. Do not attempt to extract shared components — the project pattern is intentionally self-contained files.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x (project existing) | Component model, hooks | Project-established |
| Tailwind CSS | 3.x (project existing) | All styling — no CSS files | Project-established, confirmed by code inspection |
| lucide-react | existing in project | Icons | Already imported in KompendiumPage |
| react-router-dom | existing in project | Routing (Link, Route, Navigate) | Already used for all routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sessionStorage (Web API) | Browser built-in | Checklist persistence | Used for `kompendium_checklist_v1` — replicate for `ksiega_checklist_v1` |
| IntersectionObserver (Web API) | Browser built-in | Active section tracking in sticky nav | Same pattern as KompendiumPage |

**No new npm installs required for this phase.** All needed tools are already in the project.

---

## Architecture Patterns

### Established Project Structure
```
src/
├── pages/                  # All pages — self-contained, no shared components
│   ├── KompendiumPage.jsx  # PRIMARY REFERENCE (1111 lines, modify in Plans 4.1 + 4.2)
│   └── KsiegaInwentarzPage.jsx   # NEW — create in Plan 4.3
├── App.jsx                 # Add one import + one Route in Plan 4.3
└── pages/DashboardPage.jsx # Add one Card entry in Plan 4.3
```

No `src/components/` folder exists. Every page is a self-contained file with local sub-components defined as inner functions inside the main export function. This is non-negotiable — the project has been explicitly structured this way.

### Pattern 1: Self-Contained Page with Inline Sub-Components

All sub-components (`Checklist`, `Accordion`, `ProtocolCard`, `SectionTitle`, `DeadlineBadge`) are defined as functions INSIDE the main `export default function KompendiumPage()` body, after the state declarations and before the `return` statement.

```jsx
// Source: KompendiumPage.jsx lines 271–366
export default function KompendiumPage() {
  // 1. State + sessionStorage init
  const [activeSection, setActiveSection] = useState('wstep');
  const [openAccordion, setOpenAccordion] = useState(null);
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kompendium_checklist_v1');
      return saved ? JSON.parse(saved) : { before: [], after: [] };
    } catch {
      return { before: [], after: [] };
    }
  });

  // 2. IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    ALL_SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // 3. Sub-components defined inline
  const Checklist = ({ group, items }) => ( ... );
  const Accordion = ({ id, title, content }) => ( ... );
  const SectionTitle = ({ icon: Icon, chapter, title }) => ( ... );

  // 4. return JSX
  return ( ... );
}
```

### Pattern 2: Checklist Component (exact props and behavior)

```jsx
// Source: KompendiumPage.jsx lines 287–313
const Checklist = ({ group, items }) => (
  <div className="space-y-2">
    {items.map((item) => {
      const checked = (checklistState[group] || []).includes(item.id);
      return (
        <button
          key={item.id}
          onClick={() => toggleCheck(group, item.id)}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
            checked
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-white border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50/30'
          }`}
        >
          {checked ? (
            <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          )}
          <span className={`text-sm font-medium leading-snug ${checked ? 'line-through opacity-60' : ''}`}>
            {item.text}
          </span>
        </button>
      );
    })}
  </div>
);
```

- `group` — string key into `checklistState` object (e.g., `"before"`, `"after"`, or for KsiegaInwentarz: `"wpis"`)
- `items` — array of `{ id: string, text: string }` — defined as a const at the top of the file
- Persistence via `toggleCheck(group, itemId)` which calls `sessionStorage.setItem(KEY, JSON.stringify(newState))`
- For KsiegaInwentarzPage: use key `ksiega_checklist_v1`, state shape `{ wpis: [] }`

### Pattern 3: Accordion Component (exact props and behavior)

```jsx
// Source: KompendiumPage.jsx lines 315–335
const Accordion = ({ id, title, content }) => {
  const open = openAccordion === id;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpenAccordion(open ? null : id)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed pt-3">{content}</p>
        </div>
      )}
    </div>
  );
};
```

- Uses single shared `openAccordion` state (only one open at a time — clicking same closes it)
- `content` prop is a string — for the 15-column accordion in KsiegaInwentarz, each column's content can be a JSX-capable string or the component can be extended to accept ReactNode
- **Note for KsiegaInwentarz:** The 15-column accordion items need richer content (column name + description + tips + example). Either extend `content` to be JSX or add additional props (`description`, `tips`, `example`) to the Accordion variant in KsiegaInwentarzPage.

### Pattern 4: SectionTitle Component

```jsx
// Source: KompendiumPage.jsx lines 354–366
const SectionTitle = ({ icon: Icon, chapter, title }) => (
  <div className="flex items-center gap-3 mb-6">
    {Icon && (
      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
    )}
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-0.5">{chapter}</p>
      <h2 className="text-2xl font-black text-slate-800">{title}</h2>
    </div>
  </div>
);
```

- For the D-01 redesign: the `bg-violet-100` and `text-violet-600` on the icon box, plus `text-violet-500` chapter label, are the current monochrome pattern. The redesign should change these per-section to distinct colors (e.g., blue for Wstęp, purple for Słownik, teal for Przed, etc.).

### Pattern 5: Sticky Nav Layout

```jsx
// Source: KompendiumPage.jsx lines 407–460
// Desktop sidebar: always visible lg+
<aside className="hidden lg:block w-[260px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto border-r border-slate-200 bg-white py-6">
  <nav className="px-3 space-y-0.5">
    {NAV_ITEMS.map((item) => {
      const active = isActive(item.id);
      return (
        <button
          onClick={() => scrollTo(item.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
            active ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </nav>
</aside>

// Mobile: dropdown select, sticky below breadcrumb
<div className="lg:hidden sticky top-[49px] z-30 bg-white border-b border-slate-200 px-4 py-2.5">
  <select value={activeSection} onChange={(e) => scrollTo(e.target.value)} ...>
    {allSelectOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
  </select>
</div>
```

- `top-[49px]` is the height of the breadcrumb bar — KsiegaInwentarzPage must use the same value
- Main content area: `<main className="flex-1 min-w-0 p-6 lg:p-10 pb-24">`
- Outer wrapper: `<div className="flex max-w-screen-2xl mx-auto">`

### Pattern 6: ProtocolCard Component (used in Types section)

```jsx
// Source: KompendiumPage.jsx lines 337–352
const ProtocolCard = ({ id, title, deadline, deadlineColor, children }) => (
  <section id={id} className="scroll-mt-20 mb-12">
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
        </div>
        <DeadlineBadge text={deadline} color={deadlineColor} />
      </div>
      <div className="p-6">{children}</div>
    </div>
  </section>
);
```

### Pattern 7: Route Addition in App.jsx

```jsx
// Source: App.jsx lines 56–61 (ProtectedRoute definition)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Source: App.jsx lines 24, 146 (existing KompendiumPage pattern to replicate)
import KompendiumPage from './pages/KompendiumPage';
// ...
<Route path="/kompendium" element={<ProtectedRoute><KompendiumPage /></ProtectedRoute>} />

// New route to add (Plan 4.3):
import KsiegaInwentarzPage from './pages/KsiegaInwentarzPage';
// ...
<Route path="/ksiega-inwentarzowa" element={<ProtectedRoute><KsiegaInwentarzPage /></ProtectedRoute>} />
```

### Pattern 8: Dashboard Card Component

```jsx
// Source: DashboardPage.jsx lines 150–165
const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText }) => (
  <Link to={to} className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl ...">
    <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} ...`}></div>
    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 ... text-2xl md:text-3xl mb-4 ...">
        {icon}
      </div>
      <h2 className="text-xl md:text-2xl font-black text-white mb-1 ...">{title}</h2>
      <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 px-2">{subtitle}</p>
      <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase ... opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 ...">{buttonText}</div>
    </div>
  </Link>
);

// Usage — existing cards at DashboardPage.jsx lines 356–363
// New card to add:
<Card
  to="/ksiega-inwentarzowa"
  icon="📒"
  title="Księga Inwentarzowa"
  subtitle="Przewodnik K-205/60 — wpisy, kolumny, procedury"
  colorFrom="from-emerald-600"
  colorTo="to-green-800"
  buttonText="Otwórz Przewodnik"
/>
```

The card grid uses `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full` — adding a new `<Card>` element to the grid automatically places it in the correct position.

### Pattern 9: Reading Progress Bar (NEW — not in KompendiumPage)

This is a new pattern for D-02. Standard implementation using a `scroll` event listener:

```jsx
// Add to KompendiumPage state
const [readingProgress, setReadingProgress] = useState(0);

// Add to useEffect (alongside existing scroll-to-top detector)
useEffect(() => {
  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    setReadingProgress(progress);
    setShowScrollTop(scrollTop > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);

// Place at top of breadcrumb bar (inside the sticky top-0 div)
<div className="h-1 bg-slate-100 absolute bottom-0 left-0 right-0">
  <div
    className="h-1 bg-violet-600 transition-all duration-75"
    style={{ width: `${readingProgress}%` }}
  />
</div>
```

The breadcrumb bar already has `sticky top-0 z-40` — the progress bar fits as an absolutely-positioned bottom border of that bar.

### Anti-Patterns to Avoid
- **Extracting to `src/components/`:** The project has no shared component folder — do not create one. All sub-components go inside the page file.
- **Using CSS modules or external CSS files:** Tailwind only. All styling is className-based.
- **Adding Firestore/GAS calls:** Phase 4 pages are read-only. No data fetching.
- **Using `useRef` for scroll tracking:** The project uses `window.scrollY` and `window.addEventListener` directly (not refs) — see existing scroll-to-top pattern.
- **Multiple accordion items open simultaneously:** The existing pattern uses single `openAccordion` state — only one item open at a time. Keep this behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sticky section tracking | Custom scroll position calculations | IntersectionObserver (already in project) | Cleaner, performant, exact same pattern exists |
| Checklist persistence | Custom storage abstraction | Direct `sessionStorage.getItem/setItem` (already in project) | Pattern is established and working |
| Icon components | Custom SVG icons | `lucide-react` (already imported) | Consistent with existing code |
| Gradient cards | Custom card CSS | Tailwind gradient utilities + existing `Card` component in DashboardPage | Card component already handles all styling |

---

## lucide-react Icons Already Imported in KompendiumPage

Confirmed from line 3–6 of KompendiumPage.jsx:

```js
import {
  BookOpen, CheckSquare, Square, ChevronRight, ArrowUp,
  Clock, AlertTriangle, CheckCircle, XCircle, Users, FileText
} from 'lucide-react';
```

**Available without new imports:** BookOpen, CheckSquare, Square, ChevronRight, ArrowUp, Clock, AlertTriangle, CheckCircle, XCircle, Users, FileText

**For KsiegaInwentarzPage, additional icons that will be needed (add to import):**
- `Archive` or `BookMarked` — for Księga Inwentarzowa identity
- `Hash` — for column numbers
- `ClipboardList` — for the checklist section
- `Scale` or `BarChart2` — for legal basis section
- `Table` — for the 15-column structure section
- `GitCompare` — for the comparison table section
- `Pencil` or `Edit3` — for the entry simulator section
- `AlertOctagon` or `XOctagon` — for common errors section

**For KompendiumPage D-01 colored section headers:** All needed icons already exist in the current import list. The color customization is purely Tailwind className changes on the icon wrapper `div`, not new icons.

---

## Common Pitfalls

### Pitfall 1: Breaking sessionStorage Persistence on KompendiumPage

**What goes wrong:** If Plan 4.1 (layout redesign) touches the `checklistState` initialization or the `toggleCheck` function, the persistence to `kompendium_checklist_v1` can break.
**Why it happens:** The state init, the `toggleCheck` function, and the `Checklist` component are tightly coupled — changing one without updating the others causes silent failure (checked items don't persist across page loads).
**How to avoid:** In Plan 4.1, treat the checklist state block (lines 213–258), the `toggleCheck` function (lines 252–258), and the `Checklist` component (lines 287–313) as a locked unit. Only modify className strings — do not touch logic.
**Warning signs:** After editing, open the page, check some items, navigate away, come back — items should still be checked.

### Pitfall 2: IntersectionObserver Not Observing New Sections

**What goes wrong:** After adding new sections (e.g., "wzory-szablony" in Plan 4.2, or all 7 sections in Plan 4.3), if the section IDs are not added to `ALL_SECTION_IDS` and `NAV_ITEMS`, the IntersectionObserver won't track them and the nav won't highlight them.
**Why it happens:** The observer is seeded from `ALL_SECTION_IDS.forEach(...)` — the array is the source of truth.
**How to avoid:** For every new `<section id="...">` added, add the same ID to both `ALL_SECTION_IDS` and `NAV_ITEMS`.

### Pitfall 3: scroll-mt-20 Missing on New Section Elements

**What goes wrong:** Clicking a nav item scrolls to the section, but the section header lands behind the sticky breadcrumb bar.
**Why it happens:** Tailwind's `scroll-mt-20` (80px offset) compensates for the sticky header height. Every section root element needs this class.
**How to avoid:** All `<section id="...">` elements must have `className="scroll-mt-20 mb-16"` (or equivalent). Check every new section added.

### Pitfall 4: Entry Simulator Validation Timing

**What goes wrong:** Required field highlighting (red border on empty fields) fires immediately on render before the user has interacted, creating a confusing UX.
**Why it happens:** Naive implementation checks `value === ''` on every render.
**How to avoid:** Use a `submitted` state flag — only show validation styling after user clicks "Generuj podgląd" button. Pattern: `const [submitted, setSubmitted] = useState(false)` — border turns red only when `submitted && !field.value`.

### Pitfall 5: Progress Bar flickering or jank

**What goes wrong:** The progress bar updates on every scroll event, causing unnecessary repaints.
**Why it happens:** `setState` on every pixel of scroll is expensive.
**How to avoid:** The `{ passive: true }` flag is already used in KompendiumPage's scroll listener (line 244) — keep it. Additionally use `transition-all duration-75` on the bar's width for smooth updates without lerp complexity.

---

## Code Examples

### Section Data Array Pattern (for TEMPLATES_ITEMS in Plan 4.2)

```jsx
// Source: KompendiumPage.jsx lines 41–62 (BEFORE_ITEMS / AFTER_ITEMS pattern)
// Replicate for templates:
const TEMPLATE_ITEMS = [
  { id: 't1', name: 'Wzór protokołu SKS', icon: '📄', driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't2', name: 'Wzór protokołu RUSS', icon: '📄', driveUrl: 'TODO: wstaw_link_google_drive' },
  // ... 7–15 total
];
```

### KsiegaInwentarzPage Column Data Array (for Accordion in Plan 4.3)

```jsx
const COLUMN_ITEMS = [
  {
    id: 'kol-1',
    title: 'Kolumna 1 — Liczba porządkowa',
    description: 'Kolejny numer wpisu w księdze.',
    tips: 'Nie można usuwać ani pomijać numerów — wykreślone pozycje zostawiamy z adnotacją.',
    example: '1, 2, 3...',
  },
  // ... 15 total
];
```

### Comparison Table (Plan 4.3 — D-14)

```jsx
// Static table, no state needed
const COMPARISON_ROWS = [
  { cecha: 'Charakter', ksiega: 'Dokument prawny', ewidencja: 'Narzędzie operacyjne' },
  { cecha: 'Funkcja', ksiega: 'Potwierdza przynależność majątkową', ewidencja: 'Zarządza stanem bieżącym' },
  // ...
];

// Render:
<table className="w-full text-sm">
  <thead>
    <tr className="bg-slate-50 border-b border-slate-200">
      <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Cecha</th>
      <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Księga Inwentarzowa</th>
      <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Ewidencja cyfrowa</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    {COMPARISON_ROWS.map((row, i) => (
      <tr key={i} className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-3 font-semibold text-slate-700">{row.cecha}</td>
        <td className="px-5 py-3 text-slate-600">{row.ksiega}</td>
        <td className="px-5 py-3 text-slate-600">{row.ewidencja}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Entry Simulator (Plan 4.3 — D-15)

```jsx
const [simForm, setSimForm] = useState({ kol4: '', kol5: '', kol6: '', kol7: '' });
const [simSubmitted, setSimSubmitted] = useState(false);

const fieldError = (val) => simSubmitted && !val.trim();

// Input styling:
className={`w-full p-3 rounded-xl border text-sm font-medium ... ${
  fieldError(simForm.kol4) ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-blue-400'
}`}

// Preview row — shown always or after submit — a styled table row:
<tr>
  <td>...</td>
  <td>{simForm.kol4 || <span className="text-slate-300 italic">FV 2026/04/001</span>}</td>
  <td>{simForm.kol5 || <span className="text-slate-300 italic">SN-XXXX</span>}</td>
  <td>{simForm.kol6 || <span className="text-slate-300 italic">SSUEW-YYY-XXX-000 Nazwa modelu</span>}</td>
  <td>{simForm.kol7 || <span className="text-slate-300 italic">0,00 zł</span>}</td>
</tr>
```

---

## Integration Points Summary

### Plan 4.1 + 4.2 — KompendiumPage.jsx modifications

| What changes | How |
|---|---|
| `SectionTitle` component | Add per-section color prop or inline different color classes per section |
| Progress bar state + listener | Add `readingProgress` state; merge with existing scroll listener |
| Per-section intro cards | Add `<div className="bg-... rounded-2xl p-5 mb-6">` block at start of each `<section>` |
| `NAV_ITEMS` array | Add `{ id: 'wzory-szablony', label: 'Wzory i szablony' }` entry |
| `ALL_SECTION_IDS` array | Add `'wzory-szablony'` |
| New data array | Add `TEMPLATE_ITEMS` const above the component |
| New section JSX | Add `<section id="wzory-szablony" className="scroll-mt-20 mb-16">` at bottom of `<main>` |

### Plan 4.3 — Files modified

| File | Change |
|---|---|
| `src/pages/KsiegaInwentarzPage.jsx` | CREATE — new self-contained page (~500–700 lines) |
| `src/App.jsx` | ADD import + one `<Route>` inside `<Routes>` |
| `src/pages/DashboardPage.jsx` | ADD one `<Card>` inside the grid div |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is purely frontend code changes with no external dependencies beyond the existing project stack. No CLI tools, databases, or external services required.

---

## Validation Architecture

nyquist_validation is explicitly set to `false` in `.planning/config.json`. Section omitted.

---

## Open Questions

1. **Color assignments for D-01 section headers**
   - What we know: Seven sections need distinct colors; existing Tailwind palette includes violet, blue, teal, emerald, amber, red, indigo, orange
   - What's unclear: User preference for specific color-to-section mapping
   - Recommendation: Claude's Discretion — assign colors that flow logically (blue for intro/Wstęp, purple for Słownik, teal for Przed, green for Podczas, amber for Po, indigo for Typy, red for Błędy, emerald for Wzory)

2. **Accordion content format for 15 columns (D-13)**
   - What we know: Existing `Accordion` takes `content` as a string; each column needs name + description + tips + example
   - What's unclear: Whether to extend the Accordion component to accept structured content or keep string-only
   - Recommendation: Create a `KsiegaAccordion` variant in KsiegaInwentarzPage that accepts `{ description, tips, example }` props in addition to `title`. Do not modify KompendiumPage's Accordion.

3. **Actual Google Drive template URLs (D-08)**
   - What we know: 7–15 templates expected; URLs not yet provided by user
   - What's unclear: The actual Drive links
   - Recommendation: Planner should scaffold array with placeholder strings `'TODO: wstaw_link_google_drive'` and a comment that user must replace them post-implementation.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/pages/KompendiumPage.jsx` (lines 1–1111) — component definitions, state patterns, nav structure, sessionStorage implementation, IntersectionObserver setup
- Direct codebase read: `src/App.jsx` (lines 1–164) — ProtectedRoute definition, route pattern, import pattern
- Direct codebase read: `src/pages/DashboardPage.jsx` (lines 1–445) — Card component definition and props, grid structure
- Direct codebase read: `.planning/phases/04-kompendium-ksi-ga-inwentarzowa/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Reading progress bar pattern: Standard React `window.scrollY / (scrollHeight - innerHeight)` — well-established browser API usage, no library needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from existing imports in codebase
- Architecture patterns: HIGH — extracted directly from KompendiumPage.jsx source code with line references
- Component props/behavior: HIGH — read from exact source, not inferred
- Progress bar implementation: MEDIUM — standard Web API pattern, not currently in codebase
- Pitfalls: HIGH — derived from reading actual component coupling in source

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable codebase, no fast-moving dependencies)
