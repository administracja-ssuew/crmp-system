# Zmiana kadencji Zarządu SSUEW + centralny plik kadry — plan implementacji (Tor 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podmienić skład Zarządu SSUEW na nową kadencję we wszystkich miejscach w aplikacji, wyprowadzając skład do jednego źródła prawdy `src/data/zarzad.js`, z zachowaniem atrybucji twórcy (Mikołaj Radliński).

**Architecture:** Wariant B — nowy `src/data/zarzad.js` (czysty moduł JS) jako jedyne źródło składu. Konsumenci (`AdminAccessPanel`, `KompendiumPage`, `RodoPage`, `DashboardPage`) importują z modułu. Kontakt RODO/administracyjny pochodzi z helpera `KONTAKT_ADMINISTRACJA`. Atrybucja twórcy = stała `TWORCA_SYSTEMU`, niezależna od kadencji.

**Tech Stack:** React 18, Vite 8, Vitest (skonfigurowany), Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-01-zarzad-kadencja-design.md`

---

## Struktura plików
- **Tworzone:** `src/data/zarzad.js`, `src/data/zarzad.test.js`.
- **Modyfikowane:** `src/pages/AdminAccessPanel.jsx`, `src/pages/KompendiumPage.jsx`, `src/pages/RodoPage.jsx`, `src/pages/DashboardPage.jsx`.
- **Bez zmian (świadomie):** `index.html` (atrybucja już jest), `src/knowledge.js` (brak imiennego składu — tylko role), `AdminEquipmentPanel.jsx` (generyczna rola).

**Listy dostępu do sal specjalnych (zatwierdzone):** 13 L i 108 L = **Vogel, Radliński, Pytel, Porębska**.

---

## Task 1: Moduł `zarzad.js` + testy (TDD)

**Files:**
- Create: `src/data/zarzad.js`
- Create: `src/data/zarzad.test.js`

- [ ] **Step 1: Testy (failing)** — utwórz `src/data/zarzad.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { ZARZAD, CZLONKOWIE, KONTAKT_ADMINISTRACJA, TWORCA_SYSTEMU, pelneImie, osoba } from './zarzad';

describe('zarzad — nowa kadencja', () => {
  it('ma 10 członków z kompletem pól', () => {
    expect(ZARZAD).toHaveLength(10);
    for (const m of ZARZAD) {
      expect(m.imie).toBeTruthy();
      expect(m.nazwisko).toBeTruthy();
      expect(String(m.nrIndeksu)).toMatch(/^\d{6}$/);
      expect(m.funkcja).toBeTruthy();
    }
  });
  it('dokładnie jeden Przewodniczący SSUEW (Karol Vogel)', () => {
    const p = ZARZAD.filter(m => m.funkcja === 'Przewodniczący SSUEW');
    expect(p).toHaveLength(1);
    expect(pelneImie(p[0])).toBe('Karol Vogel');
  });
  it('kontakt administracyjny/RODO to Martyna Porębska z telefonem', () => {
    expect(KONTAKT_ADMINISTRACJA).toBeTruthy();
    expect(pelneImie(KONTAKT_ADMINISTRACJA)).toBe('Martyna Porębska');
    expect(KONTAKT_ADMINISTRACJA.telefon).toBe('500 214 385');
  });
  it('CZLONKOWIE: 10 wpisów {name, index}', () => {
    expect(CZLONKOWIE).toHaveLength(10);
    for (const m of CZLONKOWIE) { expect(m.name).toContain(' '); expect(m.index).toBeTruthy(); }
  });
  it('brak odeszłych członków starej kadencji', () => {
    const stare = ['Ćwiklińska','Skoczylas','Panas','Tyrakowski','Stachowski','Smereczniak','Szewczyk'];
    const wszystkie = ZARZAD.map(pelneImie).join(' ');
    for (const s of stare) expect(wszystkie).not.toContain(s);
  });
  it('osoba() znajduje po nazwisku', () => {
    expect(osoba('Porębska').index).toBe('198336');
    expect(osoba('Vogel').name).toBe('Karol Vogel');
  });
  it('TWORCA_SYSTEMU to Mikołaj Radliński', () => {
    expect(TWORCA_SYSTEMU).toBe('Mikołaj Radliński');
  });
});
```

- [ ] **Step 2: Uruchom — mają NIE przejść**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./zarzad"`.

- [ ] **Step 3: Zaimplementuj moduł** — utwórz `src/data/zarzad.js`:

```js
// Jedyne źródło prawdy o składzie Zarządu SSUEW.
// Zmiana kadencji = edycja TYLKO tego pliku.
export const ZARZAD = [
  { imie: 'Karol',     nazwisko: 'Vogel',        nrIndeksu: '194535', funkcja: 'Przewodniczący SSUEW' },
  { imie: 'Mikołaj',   nazwisko: 'Radliński',    nrIndeksu: '193471', funkcja: 'Wiceprzewodniczący ds. Strategii i Działań Operacyjnych' },
  { imie: 'Julia',     nazwisko: 'Pytel',        nrIndeksu: '194174', funkcja: 'Wiceprzewodnicząca ds. Projektów' },
  { imie: 'Alicja',    nazwisko: 'Góralska',     nrIndeksu: '193295', funkcja: 'Wiceprzewodnicząca ds. Public Relations' },
  { imie: 'Martyna',   nazwisko: 'Porębska',     nrIndeksu: '198336', funkcja: 'Członek Zarządu ds. Administracji', telefon: '500 214 385' },
  { imie: 'Katarzyna', nazwisko: 'Krzepkowska',  nrIndeksu: '197635', funkcja: 'Członek Zarządu ds. Finansów' },
  { imie: 'Martyna',   nazwisko: 'Staniszewska', nrIndeksu: '190894', funkcja: 'Członek Zarządu ds. Dydaktyki i Jakości Kształcenia' },
  { imie: 'Alicja',    nazwisko: 'Rózik',        nrIndeksu: '197976', funkcja: 'Członek Zarządu ds. Promocji' },
  { imie: 'Zuzanna',   nazwisko: 'Bąk',          nrIndeksu: '198222', funkcja: 'Członek Zarządu ds. Kontaktów Zewnętrznych' },
  { imie: 'Lena',      nazwisko: 'Kwoka',        nrIndeksu: '197408', funkcja: 'Członek Zarządu ds. Human Resources' },
];

export const pelneImie = (m) => `${m.imie} ${m.nazwisko}`;
export const znajdzPoFunkcji = (frag) => ZARZAD.find(m => m.funkcja.toLowerCase().includes(frag.toLowerCase()));

// Kontakt administracyjny/RODO (Członek Zarządu ds. Administracji):
export const KONTAKT_ADMINISTRACJA = znajdzPoFunkcji('Administracji');

// Format {name, index} dla panelu dostępów (AdminAccessPanel):
export const CZLONKOWIE = ZARZAD.map(m => ({ name: pelneImie(m), index: m.nrIndeksu }));

// Wybór członka po nazwisku (do budowy list dostępu do sal specjalnych):
export const osoba = (nazwisko) => CZLONKOWIE.find(m => m.name.includes(nazwisko));

// Twórca systemu — NIEZALEŻNY od kadencji (atrybucja techniczna):
export const TWORCA_SYSTEMU = 'Mikołaj Radliński';
```

- [ ] **Step 4: Uruchom — mają przejść**

Run: `npm test`
Expected: PASS (nowe testy `zarzad` + wcześniejsze `rooms`/`signaturePadUtils`).

- [ ] **Step 5: Commit**

```bash
git add src/data/zarzad.js src/data/zarzad.test.js
git commit -m "feat: centralny plik składu Zarządu (zarzad.js) + testy — nowa kadencja"
```

---

## Task 2: Refaktor `AdminAccessPanel.jsx`

**Files:**
- Modify: `src/pages/AdminAccessPanel.jsx`

- [ ] **Step 1: Import modułu** — zamień (linia 5):
```jsx
import { ACCESS_PDF_ORDER, SPECIAL_ROOM } from '../data/rooms'
```
na:
```jsx
import { ACCESS_PDF_ORDER, SPECIAL_ROOM } from '../data/rooms'
import { CZLONKOWIE, osoba } from '../data/zarzad'
```

- [ ] **Step 2: `CORE_MEMBERS` z modułu** — zamień cały blok (linie 19-31):
```jsx
// Stałe wpisy — nie wymagają zgłoszenia
const CORE_MEMBERS = [
  { name: 'Emilia Ćwiklińska',    index: '188086' },
  { name: 'Magdalena Skoczylas',  index: '187691' },
  { name: 'Jakub Panas',          index: '187103' },
  { name: 'Daria Szewczyk',       index: '194192' },
  { name: 'Mikołaj Radliński',    index: '193471' },
  { name: 'Hubert Stachowski',    index: '194609' },
  { name: 'Karolina Smereczniak', index: '187608' },
  { name: 'Karol Vogel',          index: '194535' },
  { name: 'Marcel Tyrakowski',    index: '193563' },
  { name: 'Julia Pytel',          index: '194174' },
]
```
na:
```jsx
// Stały skład Zarządu (nie wymaga zgłoszenia) — z centralnego pliku kadry
const CORE_MEMBERS = CZLONKOWIE
```

- [ ] **Step 3: `PERMANENT` — listy sal z modułu** — zamień (linie 33-48):
```jsx
const PERMANENT = {
  '110 L': CORE_MEMBERS,
  '106 L': CORE_MEMBERS,
  '101 L': CORE_MEMBERS,
  '13 L': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
    { name: 'Karol Vogel',       index: '194535' },
  ],
  '108 L': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
  ],
}
```
na:
```jsx
// Dostęp do sal specjalnych — cały skład rdzeniowy + wskazane osoby
const DOSTEP_SPECJALNY = [osoba('Vogel'), osoba('Radliński'), osoba('Pytel'), osoba('Porębska')]

const PERMANENT = {
  '110 L': CORE_MEMBERS,
  '106 L': CORE_MEMBERS,
  '101 L': CORE_MEMBERS,
  '13 L': DOSTEP_SPECJALNY,
  '108 L': DOSTEP_SPECJALNY,
}
```

- [ ] **Step 4: Build**
Run: `npm run build`
Expected: OK. Grep pliku nie zwraca starych nazwisk (`Ćwiklińska`, `Skoczylas`, `Panas`, `Szewczyk`, `Stachowski`, `Smereczniak`, `Tyrakowski`).

- [ ] **Step 5: Commit**
```bash
git add src/pages/AdminAccessPanel.jsx
git commit -m "refactor: AdminAccessPanel na centralny skład Zarządu (zarzad.js)"
```

---

## Task 3: `KompendiumPage.jsx` — tabela składu + cytaty

**Files:**
- Modify: `src/pages/KompendiumPage.jsx`

- [ ] **Step 1: Import modułu** — dodaj do bloku importów na górze pliku (po istniejących importach) linię:
```jsx
import { ZARZAD, pelneImie } from '../data/zarzad'
```
(Umieść razem z pozostałymi `import` na początku pliku.)

- [ ] **Step 2: Tabela składu z `ZARZAD`** — zamień (linie 636-652):
```jsx
                      {[
                        ['Emilia Ćwiklińska', 'Przewodnicząca Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu'],
                        ['Magdalena Skoczylas', 'Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych'],
                        ['Daria Szewczyk', 'Wiceprzewodnicząca ds. Projektów'],
                        ['Jakub Panas', 'Wiceprzewodniczący ds. Public Relations'],
                        ['Marcel Tyrakowski', 'Członek Zarządu ds. Human Resources'],
                        ['Hubert Stachowski', 'Członek Zarządu ds. Finansów'],
                        ['Karol Vogel', 'Członek Zarządu ds. Kontaktów Zewnętrznych'],
                        ['Julia Pytel', 'Członek Zarządu ds. Promocji'],
                        ['Karolina Smereczniak', 'Członek Zarządu ds. Dydaktyki i Jakości Kształcenia'],
                        ['Mikołaj Radliński', 'Członek Zarządu ds. Administracji'],
                      ].map(([name, func], i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800">{name}</td>
                          <td className="px-5 py-3 text-slate-600">{func}</td>
                        </tr>
                      ))}
```
na:
```jsx
                      {ZARZAD.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800">{pelneImie(m)}</td>
                          <td className="px-5 py-3 text-slate-600">{m.funkcja}</td>
                        </tr>
                      ))}
```

- [ ] **Step 3: Cytat l.185 (nieformalny ton)** — zamień:
```jsx
    desc: '"Ćwikła stwierdziła że to nie ma sensu" zamiast "Przewodnicząca SSUEW Emilia Ćwiklińska wyraziła sprzeciw wobec proponowanego rozwiązania". Protokół jest dokumentem urzędowym — zdrobnienia, pseudonimy i wykrzykniki go dyskwalifikują.',
```
na:
```jsx
    desc: '"Karol stwierdził że to nie ma sensu" zamiast "Przewodniczący SSUEW Karol Vogel wyraził sprzeciw wobec proponowanego rozwiązania". Protokół jest dokumentem urzędowym — zdrobnienia, pseudonimy i wykrzykniki go dyskwalifikują.',
```

- [ ] **Step 4: Cytat „Zobowiązanie" (l.792)** — zamień:
```jsx
                        '"Przewodnicząca SSUEW Emilia Ćwiklińska zobowiązała się do przygotowania projektu uchwały do dnia 15.11.2025 r."',
```
na:
```jsx
                        '"Przewodniczący SSUEW Karol Vogel zobowiązał się do przygotowania projektu uchwały do dnia 15.11.2025 r."',
```

- [ ] **Step 5: Cytat „Omówienie punktu" (l.797)** — zamień:
```jsx
                        '"Członek Zarządu ds. Finansów Hubert Stachowski przedstawił stan realizacji budżetu SSUEW za III kwartał 2025 r. Saldo wynosi X zł. Wskazano na konieczność zwiększenia kontroli wydatków w projektach."',
```
na:
```jsx
                        '"Członek Zarządu ds. Finansów Katarzyna Krzepkowska przedstawiła stan realizacji budżetu SSUEW za III kwartał 2025 r. Saldo wynosi X zł. Wskazano na konieczność zwiększenia kontroli wydatków w projektach."',
```

- [ ] **Step 6: Cytat „Notatka nieformalna" (l.802)** — zamień:
```jsx
                        '"Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych Magdalena Skoczylas zaprosiła obecnych na spotkanie integracyjne w budynku B/L."',
```
na:
```jsx
                        '"Wiceprzewodniczący ds. Strategii i Działań Operacyjnych Mikołaj Radliński zaprosił obecnych na spotkanie integracyjne w budynku B/L."',
```

- [ ] **Step 7: Build**
Run: `npm run build`
Expected: OK. Grep pliku nie zwraca `Ćwiklińska`, `Skoczylas`, `Stachowski`, `Panas`, `Tyrakowski`, `Smereczniak`, `Szewczyk`.

- [ ] **Step 8: Commit**
```bash
git add src/pages/KompendiumPage.jsx
git commit -m "feat: Kompendium — skład Zarządu z zarzad.js + aktualizacja cytatów do nowej kadencji"
```

---

## Task 4: `RodoPage.jsx` — kontakt administracyjny → Martyna Porębska

**Files:**
- Modify: `src/pages/RodoPage.jsx`

- [ ] **Step 1: Import modułu** — dodaj do bloku importów na górze pliku:
```jsx
import { KONTAKT_ADMINISTRACJA, pelneImie } from '../data/zarzad'
```

- [ ] **Step 2: Sidebar kontaktu** — zamień (linie 952-956):
```jsx
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Czł. Zarządu ds. Administracji</p>
            <p className="text-xs font-bold text-slate-700 mb-0.5">Mikołaj Radliński</p>
            <p className="text-[11px] text-slate-500 mb-0.5">+48 514 174 791</p>
            <p className="text-[11px] text-slate-500 break-all">mikolaj.radlinski@samorzad.ue.wroc.pl</p>
            <p className="text-[11px] text-slate-500 break-all">administracja@samorzad.ue.wroc.pl</p>
```
na:
```jsx
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Czł. Zarządu ds. Administracji</p>
            <p className="text-xs font-bold text-slate-700 mb-0.5">{pelneImie(KONTAKT_ADMINISTRACJA)}</p>
            <p className="text-[11px] text-slate-500 mb-0.5">{KONTAKT_ADMINISTRACJA.telefon}</p>
            <p className="text-[11px] text-slate-500 break-all">administracja@samorzad.ue.wroc.pl</p>
```
(Osobisty e-mail poprzedniej osoby usuwamy — nie mamy adresu Martyny; zostaje funkcyjny `administracja@…`. Można dodać `email` do wpisu w `zarzad.js` i tu wyrenderować, gdy będzie dostępny.)

- [ ] **Step 3: Tekst inline (l.1000)** — zamień:
```jsx
                  W razie wątpliwości — przed uruchomieniem formularza skontaktuj się z <strong>Członkiem Zarządu ds. Administracji SSUEW</strong>: Mikołaj Radliński, +48 514 174 791.
```
na:
```jsx
                  W razie wątpliwości — przed uruchomieniem formularza skontaktuj się z <strong>Członkiem Zarządu ds. Administracji SSUEW</strong>: {pelneImie(KONTAKT_ADMINISTRACJA)}, {KONTAKT_ADMINISTRACJA.telefon}.
```

- [ ] **Step 4: Build**
Run: `npm run build`
Expected: OK. Grep pliku: brak `514 174 791`; brak `Mikołaj Radliński` w kontekście kontaktu administracyjnego (l.953). (Uwaga: `TWORCA_SYSTEMU`/atrybucja twórcy jest w DashboardPage, nie tutaj.)

- [ ] **Step 5: Commit**
```bash
git add src/pages/RodoPage.jsx
git commit -m "feat: RodoPage — kontakt administracyjny/RODO z zarzad.js (Martyna Porębska)"
```

---

## Task 5: `DashboardPage.jsx` — atrybucja twórcy z `TWORCA_SYSTEMU`

**Files:**
- Modify: `src/pages/DashboardPage.jsx`

- [ ] **Step 1: Import** — dodaj do bloku importów na górze pliku:
```jsx
import { TWORCA_SYSTEMU } from '../data/zarzad'
```

- [ ] **Step 2: Stopka twórcy** — zamień (linie 407-410):
```jsx
          <p className="text-[9px] text-slate-300 tracking-[0.15em] select-none mt-1">
            system by{' '}
            <span className="font-semibold text-slate-300/70">Mikołaj Radliński</span>
          </p>
```
na:
```jsx
          <p className="text-[9px] text-slate-300 tracking-[0.15em] select-none mt-1">
            system by{' '}
            <span className="font-semibold text-slate-300/70">{TWORCA_SYSTEMU}</span>
          </p>
```
(Atrybucja pozostaje dyskretna i trwała; nazwisko z jednego źródła. `index.html` bez zmian — atrybucja meta już tam jest.)

- [ ] **Step 3: Build**
Run: `npm run build`
Expected: OK.

- [ ] **Step 4: Commit**
```bash
git add src/pages/DashboardPage.jsx
git commit -m "chore: DashboardPage — atrybucja twórcy z TWORCA_SYSTEMU (zachowana)"
```

---

## Task 6: Weryfikacja końcowa

**Files:** brak (weryfikacja)

- [ ] **Step 1: Testy** — Run: `npm test` → PASS (zarzad + rooms + signaturePadUtils).

- [ ] **Step 2: Grep akceptacyjny — brak odeszłych członków** — wzorzec
  `Ćwiklińska|Skoczylas|Panas|Tyrakowski|Stachowski|Smereczniak|Szewczyk` w `src/`.
  Expected: **zero** trafień.
  Dodatkowo `514 174 791` w `src/` → zero. `Mikołaj Radliński` w `src/` → tylko atrybucja
  twórcy (DashboardPage używa `TWORCA_SYSTEMU`, więc literał może pojawić się tylko w
  `src/data/zarzad.js` jako członek + `TWORCA_SYSTEMU`).

- [ ] **Step 3: Build** — Run: `npm run build` → OK.

- [ ] **Step 4: Klik-through manualny (`npm run dev`)**
  1. Panel dostępów (admin) — stały skład = nowy Zarząd (10 osób); PDF w kolejności sal; sale 13 L / 108 L pokazują Vogel/Radliński/Pytel/Porębska.
  2. Kompendium — tabela „skład Zarządu" = nowy skład + funkcje; cytaty-przykłady wymieniają nowe osoby z poprawnym rodzajem.
  3. RODO — kontakt administracyjny = Martyna Porębska, 500 214 385.
  4. Dashboard — stopka „system by Mikołaj Radliński" nadal obecna.

---

## Self-review (wykonane przy pisaniu planu)

- **Pokrycie spec:** zarzad.js + testy (Task 1) ✓; AdminAccessPanel skład + sale specjalne (Task 2) ✓; Kompendium tabela + cytaty (Task 3) ✓; RODO kontakt (Task 4) ✓; atrybucja twórcy zachowana + scentralizowana (Task 5) ✓; knowledge.js — brak imiennego składu, świadomie pominięty ✓; weryfikacja + grep (Task 6) ✓.
- **Spójność nazw:** eksporty `ZARZAD`, `CZLONKOWIE`, `KONTAKT_ADMINISTRACJA`, `TWORCA_SYSTEMU`, `pelneImie`, `osoba` użyte identycznie w Task 1-5. Listy 13 L/108 L = Vogel/Radliński/Pytel/Porębska (zgodnie z zatwierdzonym specem).
- **Rodzaj gramatyczny w cytatach:** Emilia→Karol (wyraziła→wyraził, zobowiązała→zobowiązał, Przewodnicząca→Przewodniczący); Hubert→Katarzyna (przedstawił→przedstawiła); Magdalena→Mikołaj (Wiceprzewodnicząca→Wiceprzewodniczący, zaprosiła→zaprosił) — sprawdzone.
- **Placeholdery:** brak. Osobisty e-mail w RODO świadomie usunięty (brak adresu Martyny) — funkcyjny `administracja@…` zostaje.
