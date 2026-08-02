# Kalendarz Projektowy — naprawa CRUD + redesign — plan implementacji (Tor 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naprawić CRUD wydarzeń w Kalendarzu Projektowym (przyczyna: rozjazd GET/POST w routerze GAS) oraz przeprojektować komponent na Tailwind z widokiem Miesiąc/Lista i lepszym flow.

**Architecture:** Backend fix = dodanie `addProjekt`/`updateProjekt` do dispatchu `doGet` (deliverable do wklejenia; front zostaje na GET‑z‑`?body=`). Frontend = przepisanie `KalendarzProjektowy.jsx` na Tailwind; czysta logika siatki/agendy wydzielona do `kalendarzUtils.js` + testy Vitest.

**Tech Stack:** React 18, Vite 8, Tailwind, Vitest, Google Apps Script (backend, poza repo).

**Spec:** `docs/superpowers/specs/2026-08-02-kalendarz-projektowy-design.md`

---

## Struktura plików
- **Tworzone:** `src/components/Projekty/kalendarzUtils.js`, `src/components/Projekty/kalendarzUtils.test.js`, `docs/superpowers/backend-kalendarz-projektowy-fix.md`.
- **Modyfikowane (przepisywane):** `src/components/Projekty/KalendarzProjektowy.jsx`.

---

## Task 1: Backend fix (deliverable do wklejenia)

**Files:** Create `docs/superpowers/backend-kalendarz-projektowy-fix.md`

- [ ] **Step 1: Utwórz notatkę** z treścią:

```markdown
# Kalendarz Projektowy — poprawka backendu (do wklejenia w Apps Script)

Przyczyna błędów CRUD: frontend wysyła wszystkie akcje przez GET, a `addProjekt` i
`updateProjekt` są obsługiwane tylko w `doPost` — GET do nich trafia w `default` i nic
nie zapisuje. Handlery już czytają `e.parameter.body`, więc wystarczy dodać je do routera
`doGet`.

## Zmiana: w funkcji `doGet`, w bloku `switch (action)`, dodaj dwa case (obok istniejących
`getProjekty`/`deleteProjekt`):

\`\`\`js
      case 'getProjekty':     return getProjektyResponse(e);
      case 'addProjekt':      return addProjektResponse(e);      // <-- DODAJ
      case 'updateProjekt':   return updateProjektResponse(e);   // <-- DODAJ
      case 'deleteProjekt':   return deleteProjektResponse(e);
\`\`\`

Po wklejeniu wszystkie 4 akcje działają przez GET. `doPost` możesz zostawić bez zmian
(dalej obsłuży POST). Wdróż nową wersję: Wdrożenie → Zarządzaj wdrożeniami → Edytuj →
Nowa wersja (URL musi zostać ten sam co `VITE_AS_URL`/`VITE_AS_SALA_URL`).
```

- [ ] **Step 2: Commit**
```bash
git add docs/superpowers/backend-kalendarz-projektowy-fix.md
git commit -m "docs: poprawka backendu Kalendarza Projektowego (GET dla add/update)"
```

---

## Task 2: `kalendarzUtils.js` — czyste funkcje + testy (TDD)

**Files:** Create `src/components/Projekty/kalendarzUtils.js`, `src/components/Projekty/kalendarzUtils.test.js`

- [ ] **Step 1: Testy (failing)** — utwórz `src/components/Projekty/kalendarzUtils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildCalGrid, groupUpcoming, MONTHS_PL, DAYS_PL } from './kalendarzUtils';

describe('buildCalGrid', () => {
  it('zwraca siatkę o długości wielokrotności 7', () => {
    const grid = buildCalGrid(2026, 0, []); // styczeń 2026
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(31);
  });
  it('ma dokładnie tyle komórek bieżącego miesiąca, ile dni', () => {
    const grid = buildCalGrid(2026, 0, []);
    expect(grid.filter(c => c.month === 0).length).toBe(31); // styczeń ma 31 dni
  });
  it('przypisuje wydarzenie do właściwego dnia po data_finalu', () => {
    const ev = { id: 'x', data_finalu: '2026-01-15', nazwa: 'Test' };
    const grid = buildCalGrid(2026, 0, [ev]);
    const cell = grid.find(c => c.month === 0 && c.day === 15);
    expect(cell.events).toHaveLength(1);
    expect(cell.events[0].id).toBe('x');
  });
  it('komórki wiodące pochodzą z poprzedniego miesiąca', () => {
    const grid = buildCalGrid(2026, 0, []);
    // 1 stycznia 2026 to czwartek → 3 komórki wiodące z grudnia (month === -1)
    expect(grid[0].month).toBe(-1);
  });
});

describe('groupUpcoming', () => {
  const events = [
    { id: 'a', data_finalu: '2026-02-10', nazwa: 'B' },
    { id: 'b', data_finalu: '2026-01-20', nazwa: 'A' },
    { id: 'c', data_finalu: '2025-12-01', nazwa: 'past' },
    { id: 'd', data_finalu: '2026-02-05', nazwa: 'C' },
    { id: 'e', data_finalu: '', nazwa: 'brak daty' },
  ];
  it('odrzuca przeszłe i puste daty, grupuje po miesiącu, sortuje rosnąco', () => {
    const g = groupUpcoming(events, new Date(2026, 0, 1)); // od 2026-01-01
    expect(g.map(x => x.key)).toEqual(['2026-01', '2026-02']);
    expect(g[0].label).toBe('Styczeń 2026');
    expect(g[1].label).toBe('Luty 2026');
    expect(g[1].events.map(e => e.id)).toEqual(['d', 'a']); // 05 przed 10
  });
  it('pusta lista → pusta tablica grup', () => {
    expect(groupUpcoming([], new Date(2026, 0, 1))).toEqual([]);
  });
});
```

- [ ] **Step 2: Uruchom — mają NIE przejść**
Run: `npm test`
Expected: FAIL — `Failed to resolve import "./kalendarzUtils"`.

- [ ] **Step 3: Zaimplementuj** — utwórz `src/components/Projekty/kalendarzUtils.js`:

```js
// Czyste funkcje Kalendarza Projektowego (testowalne, bez DOM).

export const MONTHS_PL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];
export const DAYS_PL = ['Pon','Wt','Śr','Cz','Pt','So','Nd'];

// Siatka miesiąca (7×N): komórki poprzedniego/bieżącego/następnego miesiąca,
// z przypisaniem wydarzeń po polu data_finalu (YYYY-MM-DD).
export function buildCalGrid(year, month, events) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: month - 1, year, events: [], isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = (
      today.getFullYear() === year &&
      today.getMonth()    === month &&
      today.getDate()     === d
    );
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = (events || []).filter(ev => {
      if (!ev.data_finalu) return false;
      return String(ev.data_finalu).slice(0, 10) === dateStr;
    });
    cells.push({ day: d, month, year, events: dayEvents, isToday });
  }
  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: day++, month: month + 1, year, events: [], isToday: false });
  }
  return cells;
}

// Nadchodzące wydarzenia (od fromDate włącznie), posortowane rosnąco,
// pogrupowane po miesiącu: [{ key:'YYYY-MM', label:'Miesiąc RRRR', events:[...] }]
export function groupUpcoming(events, fromDate = new Date()) {
  const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
  const upcoming = (events || [])
    .filter(ev => ev.data_finalu && String(ev.data_finalu).slice(0, 10) >= fromStr)
    .sort((a, b) => String(a.data_finalu).slice(0, 10).localeCompare(String(b.data_finalu).slice(0, 10)));

  const groups = [];
  const byKey = {};
  for (const ev of upcoming) {
    const key = String(ev.data_finalu).slice(0, 7); // YYYY-MM
    if (!byKey[key]) {
      const [y, m] = key.split('-');
      byKey[key] = { key, label: `${MONTHS_PL[parseInt(m, 10) - 1]} ${y}`, events: [] };
      groups.push(byKey[key]);
    }
    byKey[key].events.push(ev);
  }
  return groups;
}
```

- [ ] **Step 4: Uruchom — mają przejść**
Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/Projekty/kalendarzUtils.js src/components/Projekty/kalendarzUtils.test.js
git commit -m "feat: czyste funkcje Kalendarza Projektowego (buildCalGrid, groupUpcoming) + testy"
```

---

## Task 3: Przepisanie `KalendarzProjektowy.jsx` na Tailwind (Miesiąc/Lista + flow)

**Files:** Modify (rewrite): `src/components/Projekty/KalendarzProjektowy.jsx`

> To zadanie to prowadzony redesign UI. Zachowaj DOKŁADNIE kontrakt danych i wywołania
> API (poniżej), a warstwę wizualną napisz w Tailwind spójnie z resztą aplikacji
> (klasy jak w `AdminAccessPanel.jsx`/`RodoPage.jsx`). Nie zmieniaj `AS_URL`, nazw pól,
> ani akcji API.

- [ ] **Step 1: Zachowaj kontrakt danych/API (bez zmian)**

Komponent nadal:
- Przyjmuje prop `{ isAdmin = false }`.
- `AS_URL = import.meta.env.VITE_AS_URL || import.meta.env.VITE_AS_SALA_URL`.
- Pobiera: `fetch(\`${AS_URL}?action=getProjekty\`)` → `{success, data}` (tablica wydarzeń).
- Zapis: `fetch(\`${AS_URL}?action=${id ? 'updateProjekt' : 'addProjekt'}&body=${encodeURIComponent(JSON.stringify(formData))}\`)`.
- Usuwanie: `fetch(\`${AS_URL}?action=deleteProjekt&id=${id}\`)`.
- Po każdej mutacji: ponownie `getProjekty` (odświeżenie listy).
- Model wydarzenia: `{ id, nazwa, organizacja, typ, data_finalu, opis, status, kolor }`.
- Statusy (5): `Planowany, W toku, Finalizacja, Zakończony, Odwołany`. Typy (3):
  `Samorząd, Organizacja Studencka, Koło Naukowe`. Zachowaj kolory/ikony statusów
  (przenieś `STATUS_CONFIG`/`TYP_CONFIG` jako mapy klas Tailwind lub stałych kolorów).

- [ ] **Step 2: Zaimplementuj widok w Tailwind**

Wymagania (zastępują inline-`style`):
1. Import czystych funkcji: `import { buildCalGrid, groupUpcoming, MONTHS_PL, DAYS_PL } from './kalendarzUtils'`. Usuń lokalne duplikaty tych funkcji/stałych.
2. **Przełącznik widoku** `Miesiąc | Lista` (stan `view`, domyślnie `'miesiac'`).
3. **Nagłówek**: tytuł „Kalendarz projektowy SSUEW" + podtytuł; po prawej (gdy `isAdmin`) przycisk „+ Dodaj wydarzenie".
4. **Filtry**: select statusu, select typu, licznik „N wydarzeń" (filtr wspólny dla obu widoków).
5. **Widok Miesiąc**: nawigacja ‹ / › / „Dziś"; siatka z `buildCalGrid(year, month, filteredEvents)`; nagłówki `DAYS_PL`; komórki: numer dnia, wyróżnienie „dziś", pigułki wydarzeń (kolor wg statusu, klik → modal szczegółów), „+N więcej" gdy >3; puste dni czytelne; dni spoza bieżącego miesiąca wyszarzone.
6. **Widok Lista/agenda**: `groupUpcoming(filteredEvents)` → sekcje po miesiącu (nagłówek = `label`), w każdej lista wydarzeń (data, nazwa, badge statusu + typu, organizacja), klik → modal szczegółów. Pusty stan: „Brak nadchodzących wydarzeń".
7. **Modale**: szczegóły (Edytuj/Usuń dla admina) + formularz (pola jak w modelu; walidacja: nazwa i data_finalu wymagane). Reużyj wzorca modalu.
8. **Flow zamiast `alert`/`confirm`**: potwierdzenie usuwania (modal/inline „Na pewno?"), komunikaty sukcesu/błędu jako toast lub inline banner (nie `window.alert`). Stany: loading (spinner/skeleton), error (komunikat + „Spróbuj ponownie" → `loadEvents`), empty.
9. **Legenda** statusów.
10. Cała stylizacja w Tailwind (żadnych obiektów `style={{…}}` poza ewentualnym dynamicznym kolorem statusu, jeśli konieczne).

- [ ] **Step 3: Build**
Run: `npm run build`
Expected: OK. Grep pliku: brak `style={{` dla layoutu (dozwolone tylko dynamiczne kolory, jeśli użyte); brak lokalnych definicji `buildCalGrid`/`groupUpcoming` (importowane z utils).

- [ ] **Step 4: Commit**
```bash
git add src/components/Projekty/KalendarzProjektowy.jsx
git commit -m "feat: redesign Kalendarza Projektowego na Tailwind (Miesiąc/Lista, lepszy flow)"
```

---

## Task 4: Weryfikacja końcowa

**Files:** brak (weryfikacja)

- [ ] **Step 1: Testy** — Run: `npm test` → PASS (kalendarzUtils + zarzad + rooms + signaturePadUtils).
- [ ] **Step 2: Build** — Run: `npm run build` → OK.
- [ ] **Step 3: Klik-through (`npm run dev`)** — (pełny CRUD wymaga wdrożonego backend-fixu):
  1. Przełącznik Miesiąc/Lista działa; filtry statusu/typu zawężają oba widoki.
  2. Miesiąc: nawigacja ‹/›/Dziś; „dziś" wyróżniony; wydarzenia jako pigułki; „+N więcej".
  3. Lista: nadchodzące pogrupowane po miesiącu, posortowane; pusty stan.
  4. Admin: dodaj → po zapisie pojawia się; edytuj → zmiana widoczna; usuń → potwierdzenie → znika. Komunikaty jako toast/inline (nie alert).
  5. Stany loading/error/empty renderują się poprawnie.

---

## Self-review (wykonane przy pisaniu planu)
- **Pokrycie spec:** backend fix (Task 1) ✓; czyste funkcje + testy (Task 2) ✓; redesign Tailwind + Miesiąc/Lista + flow (Task 3) ✓; weryfikacja (Task 4) ✓.
- **Świadome:** Task 3 to prowadzony redesign — dokładny kontrakt danych/API podany verbatim, warstwa Tailwind pisana przez wykonawcę wg briefu i konwencji repo (dwuetapowy review to weryfikuje). Pełne działanie CRUD zależne od wklejenia backend-fixu (Task 1) — udokumentowane.
- **Spójność nazw:** `buildCalGrid`, `groupUpcoming`, `MONTHS_PL`, `DAYS_PL` z `kalendarzUtils.js` używane w Task 2 (testy) i Task 3 (komponent). Akcje API i model pól niezmienione.
- **Placeholdery:** brak (poza świadomym „prowadzonym" charakterem Task 3).
