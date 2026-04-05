# Phase 4: Kompendium + Księga Inwentarzowa - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers two things:
1. **KompendiumPage redesign** — visual refresh of the existing 1111-line page: colored section headers with icons, per-section intro cards ("Co znajdziesz tutaj"), a reading progress bar, updated color palette and typography, plus a new "Wzory i szablony" section (card grid of Drive-hosted document templates) added as a nav item.
2. **KsiegaInwentarzPage** — a brand-new interactive page about the physical inventory ledger K-205/60: full content (7 sections), sticky nav, checklist, accordion, comparison table, and an educational entry simulator.

No backend changes. Both pages are read-only informational/interactive — no Firestore, no GAS.

</domain>

<decisions>
## Implementation Decisions

### KompendiumPage — Layout Redesign

- **D-01:** Add colorful section headers with icons for every major section (Wstęp, Słownik, Przed, Podczas, Po, Typy protokołów, Błędy, Wzory i szablony). Each section gets a visually distinct card/header treatment.
- **D-02:** Add a reading progress bar at the top of the page (horizontal bar showing scroll progress through the document).
- **D-03:** Add a summary intro card ("Co znajdziesz tutaj") at the start of each major section — 2–3 bullet points of what the section covers.
- **D-04:** Refresh color palette and typography — keep existing structure and component logic (sticky nav, IntersectionObserver, Checklist, Accordion, ProtocolCard components all stay), update visual styling only.
- **D-05:** Preserve sessionStorage-based checklist state (key: `kompendium_checklist_v1`) — do not break existing persistence.

### KompendiumPage — Sekcja Szablonów Dokumentów (KOMP-02)

- **D-06:** Add a "Wzory i szablony" section at the end of KompendiumPage with its own entry in the sticky nav (`NAV_ITEMS`).
- **D-07:** Templates displayed as a card grid (3 columns on desktop, responsive). Each card: document icon + name + "Otwórz" button → opens Google Drive link in new tab.
- **D-08:** 7–15 templates expected. Links are hardcoded in the component data array (same pattern as `BEFORE_ITEMS`, `AFTER_ITEMS`). Planner should add placeholder array with TODO comments for the actual Drive URLs.
- **D-09:** No categories needed for this count — flat grid is sufficient.

### KsiegaInwentarzPage — Treść (7 sekcji)

- **D-10:** Page has exactly 7 sections:
  1. Czym jest Księga Inwentarzowa (symbol K-205/60, charakter prawny, obowiązek wpisu)
  2. Podstawa prawna (ustawa o rachunkowości art. 17 ust. 1, przepisy Kwestury UEW, regulaminy SSUEW)
  3. Struktura Księgi — opis 15 kolumn (accordion, see D-13)
  4. Inwentaryzacja otwarcia — procedura (gruba kreska, nagłówek, weryfikacja starych wpisów, nowe wpisy)
  5. Relacja Księgi z ewidencją cyfrową (comparison table, see D-14)
  6. Procedura dodawania wpisu krok po kroku (checklista, see D-12)
  7. Częste błędy ewidencyjne (FAQ-style — brak S/N, błędna data, brak kodu SSUEW, etc.)

- **D-11:** Photos of the physical ledger will be provided by the user as static files in `/public/ksiega/`. Embed as `<img>` with captions. Planner should add placeholder `<img src="/ksiega/placeholder.jpg" />` with TODO comment. Photos go in the "Czym jest" and/or "Struktura" sections.

### KsiegaInwentarzPage — Interaktywność

- **D-12:** **Checklista procedury wpisu** — clickable step-by-step checklist for adding a new item to the ledger. Same pattern as KompendiumPage `Checklist` component (sessionStorage persistence). State key: `ksiega_checklist_v1`.
- **D-13:** **Accordion kolumn 1–15** — each of the 15 columns is an expandable accordion item showing: column name, description, tips, and example value. Same `Accordion` component pattern as KompendiumPage.
- **D-14:** **Tabela porównawcza** — static styled table comparing Księga vs Ewidencja cyfrowa. 3 columns: Cecha | Księga Inwentarzowa | Ewidencja cyfrowa. Content from user-provided text (Charakter: Dokument prawny vs Narzędzie operacyjne; Funkcja: Potwierdza przynależność majątkową vs Zarządza stanem bieżącym; etc.).
- **D-15:** **Symulator wpisu** — interactive educational form where user fills in fields (kolumna 4 dowód, kolumna 5 S/N, kolumna 6 nazwa z kodem SSUEW, kolumna 7 cena) and sees a preview of how the ledger row would look. Purely educational — no saving, no backend. Validation: highlight empty required fields with a red border.

### KsiegaInwentarzPage — Nawigacja

- **D-16:** Sticky side nav (same pattern as KompendiumPage): left drawer on desktop (lg:), dropdown select on mobile. Nav items correspond to the 7 sections. IntersectionObserver for active section tracking.
- **D-17:** New route: `/ksiega-inwentarzowa` in App.jsx, wrapped in `<ProtectedRoute>`.
- **D-18:** New dashboard card in DashboardPage linking to `/ksiega-inwentarzowa`.

### Claude's Discretion

- Exact color palette for section headers (should be visually distinct but cohesive with existing Tailwind palette used in the app)
- Exact icon choices from lucide-react (already imported in KompendiumPage)
- Exact wording of checklist steps for D-12 (can be derived from user-provided procedure text)
- Exact wording of FAQ entries for D-17 section 7 (derive from user-provided context: missing S/N, wrong date, missing SSUEW code)
- Order of nav items in KsiegaInwentarzPage
- Whether to add a "scroll to top" button in KsiegaInwentarzPage (existing pattern in KompendiumPage — safe to replicate)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing pages to replicate patterns from
- `src/pages/KompendiumPage.jsx` — PRIMARY REFERENCE. Contains Checklist, Accordion, ProtocolCard, SectionTitle components, sticky nav logic, IntersectionObserver, sessionStorage persistence pattern, scroll-to behavior. KsiegaInwentarzPage should follow the same self-contained file structure.

### Routing and navigation
- `src/App.jsx` — Add new route `/ksiega-inwentarzowa` here (ProtectedRoute pattern)
- `src/pages/DashboardPage.jsx` — Add new Card for Księga Inwentarzowa here

### Project requirements
- `.planning/REQUIREMENTS.md` — KOMP-01, KOMP-02, INV-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (defined inside KompendiumPage.jsx — copy pattern, don't import)
- `Checklist` component (line ~287) — group + items props, sessionStorage persistence, checkmark toggle
- `Accordion` component (line ~315) — id + title + content props, open/close toggle with animation
- `ProtocolCard` component (line ~337) — section wrapper with scroll-mt-20
- `SectionTitle` component (line ~354) — icon + chapter + title props
- `DeadlineBadge` component (line ~271) — colored badge, reusable for tags/labels

### Established Patterns
- No `src/components/` folder — every page is a self-contained file with local sub-components defined inside
- State management: `useState` + sessionStorage for user-facing persistence (no context/Redux)
- Styling: Tailwind CSS only — no CSS files, no CSS modules
- Icons: `lucide-react` (already imported in KompendiumPage)
- Sticky nav: `w-[260px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)]` on desktop, `<select>` dropdown on mobile

### Integration Points
- App.jsx needs: new import + new `<Route>` for `/ksiega-inwentarzowa`
- DashboardPage.jsx needs: new `<Card>` entry

</code_context>

<specifics>
## Specific Ideas

### Treść KsięgiInwentarzowej — dostarczona przez użytkownika
Pełna treść 5 sekcji (poza procedurą wpisu i FAQ) została dostarczona przez użytkownika w rozmowie. Planer powinien ją hardkodować bezpośrednio w komponencie:
- Opis K-205/60 i jego charakteru prawnego
- Podstawa prawna (ustawa z 29.09.1994, art. 17 ust. 1, Kwestura UEW, regulaminy SSUEW)
- Opis wszystkich 15 kolumn (Kol. 1-2 przez Kol. 15 z przykładami)
- Procedura inwentaryzacji otwarcia (gruba kreska, nagłówek, weryfikacja, nowe wpisy)
- Tabela porównawcza (Charakter / Funkcja / Przykład — dostarczone przez użytkownika)

### Symulator wpisu
Kluczowe pola symulatora (edukacyjny, nic nie zapisuje):
- Kol. 4: Symbol i numer dowodu (np. FV 2026/04/001)
- Kol. 5: Nr fabryczny (S/N)
- Kol. 6: Nazwa z kodem SSUEW (format: `SSUEW-YYY-XXX-000 Nazwa modelu`)
- Kol. 7: Cena jednostkowa (zł)
- Podgląd: wiersz tabeli jak w prawdziwej Księdze z wypełnionymi danymi

### Zdjęcia Księgi
Ścieżka: `/public/ksiega/` — użytkownik wgra pliki po implementacji. Planer wstawia `<img src="/ksiega/placeholder.jpg" alt="Wzór strony Księgi Inwentarzowej" />` z TODO komentarzem.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-kompendium-ksi-ga-inwentarzowa*
*Context gathered: 2026-04-05*
