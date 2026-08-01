# Zmiana kadencji Zarządu SSUEW + centralny plik kadry — projekt (Tor 1)

**Data:** 2026-08-01
**Priorytet:** wysoki (nowa kadencja — trzeba podmienić cały Zarząd osobowo).

## Cel

1. Podmienić skład Zarządu na nową kadencję we wszystkich miejscach w aplikacji.
2. Wyprowadzić skład do **jednego źródła prawdy** `src/data/zarzad.js`, żeby kolejna
   zmiana kadencji = edycja jednego pliku (analogicznie do `src/data/rooms.js`).
3. Zachować **atrybucję twórcy** (Mikołaj Radliński) niezależnie od funkcji w Zarządzie.

## Nowy skład Zarządu (dane wejściowe od użytkownika)

| Funkcja | Osoba | Nr indeksu |
|---|---|---|
| Przewodniczący SSUEW | Karol Vogel | 194535 |
| Wiceprzewodniczący ds. Strategii i Działań Operacyjnych | Mikołaj Radliński | 193471 |
| Wiceprzewodnicząca ds. Projektów | Julia Pytel | 194174 |
| Wiceprzewodnicząca ds. Public Relations | Alicja Góralska | 193295 |
| Członek Zarządu ds. Administracji | Martyna Porębska | 198336 |
| Członek Zarządu ds. Finansów | Katarzyna Krzepkowska | 197635 |
| Członek Zarządu ds. Dydaktyki i Jakości Kształcenia | Martyna Staniszewska | 190894 |
| Członek Zarządu ds. Promocji | Alicja Rózik | 197976 |
| Członek Zarządu ds. Kontaktów Zewnętrznych | Zuzanna Bąk | 198222 |
| Członek Zarządu ds. Human Resources | Lena Kwoka | 197408 |

- **Kontakt RODO/administracyjny:** Martyna Porębska, tel. **500 214 385** (zastępuje
  Mikołaja jako Członek Zarządu ds. Administracji).
- **Mikołaj Radliński:** Wiceprzewodniczący ds. Strategii + **twórca/technika systemu**
  (atrybucja twórcy zostaje, niezależnie od funkcji).

## Centralny moduł `src/data/zarzad.js`

Czysty moduł JS — jedyne źródło prawdy o składzie:

```js
export const ZARZAD = [
  { imie: 'Karol',     nazwisko: 'Vogel',       nrIndeksu: '194535', funkcja: 'Przewodniczący SSUEW' },
  { imie: 'Mikołaj',   nazwisko: 'Radliński',   nrIndeksu: '193471', funkcja: 'Wiceprzewodniczący ds. Strategii i Działań Operacyjnych' },
  { imie: 'Julia',     nazwisko: 'Pytel',       nrIndeksu: '194174', funkcja: 'Wiceprzewodnicząca ds. Projektów' },
  { imie: 'Alicja',    nazwisko: 'Góralska',    nrIndeksu: '193295', funkcja: 'Wiceprzewodnicząca ds. Public Relations' },
  { imie: 'Martyna',   nazwisko: 'Porębska',    nrIndeksu: '198336', funkcja: 'Członek Zarządu ds. Administracji', telefon: '500 214 385' },
  { imie: 'Katarzyna', nazwisko: 'Krzepkowska', nrIndeksu: '197635', funkcja: 'Członek Zarządu ds. Finansów' },
  { imie: 'Martyna',   nazwisko: 'Staniszewska',nrIndeksu: '190894', funkcja: 'Członek Zarządu ds. Dydaktyki i Jakości Kształcenia' },
  { imie: 'Alicja',    nazwisko: 'Rózik',       nrIndeksu: '197976', funkcja: 'Członek Zarządu ds. Promocji' },
  { imie: 'Zuzanna',   nazwisko: 'Bąk',         nrIndeksu: '198222', funkcja: 'Członek Zarządu ds. Kontaktów Zewnętrznych' },
  { imie: 'Lena',      nazwisko: 'Kwoka',       nrIndeksu: '197408', funkcja: 'Członek Zarządu ds. Human Resources' },
];

export const pelneImie = (m) => `${m.imie} ${m.nazwisko}`;
export const znajdzPoFunkcji = (frag) => ZARZAD.find(m => m.funkcja.toLowerCase().includes(frag.toLowerCase()));

// Kontakt administracyjny/RODO (Członek Zarządu ds. Administracji):
export const KONTAKT_ADMINISTRACJA = znajdzPoFunkcji('Administracji');

// Format {name, index} dla panelu dostępów (AdminAccessPanel):
export const CZLONKOWIE = ZARZAD.map(m => ({ name: pelneImie(m), index: m.nrIndeksu }));

// Twórca systemu — NIEZALEŻNY od kadencji (atrybucja techniczna):
export const TWORCA_SYSTEMU = 'Mikołaj Radliński';
```

## Konsumenci (refaktor / podmiana)

### `src/pages/AdminAccessPanel.jsx`
- `CORE_MEMBERS` → `CZLONKOWIE` z modułu (cały Zarząd).
- Mapa `PERMANENT` (dostęp do sal): rooms rdzeniowe (110 L / 106 L / 101 L) → cały
  Zarząd. Sale specjalne — **struktura jak była, wymienione tylko osoby, które odeszły**:
  - **13 L** (było: Ćwiklińska, Szewczyk, Radliński, Vogel) → **Vogel, Radliński,
    Pytel, Porębska** (Radliński i Vogel zostają; Szewczyk→Pytel jako Wiceprz. ds.
    Projektów; Ćwiklińska→Porębska).
  - **108 L** (było: Ćwiklińska, Szewczyk, Radliński) → **Vogel, Pytel, Radliński, Porębska**
    (Radliński zostaje; odeszłe zastąpione).
  - Te dwie listy budowane z modułu (helper wybierający po nazwisku/funkcji). **Do
    potwierdzenia w review** — jeśli inny podział, to jedna linijka w `zarzad.js`.

### `src/pages/KompendiumPage.jsx`
- Tabela składu (linie 637-646) → generowana z `ZARZAD` (`[pelneImie, funkcja]`).
- Cytaty-przykłady nazywające konkretne osoby → zaktualizowane do nowego składu:
  - l.185: „Emilia Ćwiklińska" (Przewodnicząca) → **Karol Vogel** (Przewodniczący).
  - l.792: „Przewodnicząca SSUEW Emilia Ćwiklińska" → „Przewodniczący SSUEW Karol Vogel".
  - l.797: „Członek Zarządu ds. Finansów Hubert Stachowski" → „…Katarzyna Krzepkowska".
  - l.802: „Wiceprzewodnicząca ds. Strategii… Magdalena Skoczylas" → „Wiceprzewodniczący
    ds. Strategii i Działań Operacyjnych Mikołaj Radliński".
  (Pozostawiamy poprawne budynki L z wcześniejszej migracji.)

### `src/pages/RodoPage.jsx`
- Kontakt „Członek Zarządu ds. Administracji" (l.953, l.1000): Mikołaj Radliński +
  +48 514 174 791 → **Martyna Porębska, 500 214 385** (z `KONTAKT_ADMINISTRACJA`).

### `src/knowledge.js` (baza wiedzy AI-bota)
- Sprawdzić, czy zawiera imienny skład Zarządu; jeśli tak — zaktualizować tekstowo do
  nowego składu (to plik tekstowy, nie importuje JS). Jeśli tylko role bez nazwisk — bez zmian.

## Atrybucja twórcy (zachować, oddzielić od kadencji)

- `index.html` — meta author + komentarz „System stworzony przez Mikołaja Radlińskiego"
  → **zostaje bez zmian**.
- `src/pages/DashboardPage.jsx` (stopka „system by Mikołaj Radliński", l.407-410) →
  **zostaje**; nazwisko może pochodzić z `TWORCA_SYSTEMU` (spójność). Forma obecna
  („system by") pozostaje dyskretna — bez zmiany brzmienia, chyba że użytkownik zechce
  mocniejsze „Twórca systemu:".
- Kluczowe: podmiana Zarządu **nie może** usunąć tej atrybucji.

## Testy

- **Vitest** `src/data/zarzad.test.js`:
  - `ZARZAD` ma 10 osób, każda ma `imie`, `nazwisko`, `nrIndeksu`, `funkcja`,
  - dokładnie jeden „Przewodniczący SSUEW",
  - `KONTAKT_ADMINISTRACJA` to Martyna Porębska z `telefon` = '500 214 385',
  - `CZLONKOWIE` ma 10 wpisów w formacie `{name, index}`,
  - żaden ze starych (odeszłych) członków nie występuje (Ćwiklińska, Skoczylas,
    Szewczyk, Panas, Tyrakowski, Stachowski, Smereczniak),
  - `TWORCA_SYSTEMU` === 'Mikołaj Radliński'.
- **Grep akceptacyjny:** brak starych nazwisk w `src/` (poza atrybucją twórcy Mikołaja).
- **Build** `npm run build` OK.
- **Klik-through:** panel dostępów (nowy skład + PDF), Kompendium (tabela składu),
  RODO (kontakt = Martyna Porębska), dashboard (kredyt twórcy nadal jest).

## Poza zakresem (Tor 1)

- **Kalendarz Projektowy** (naprawa CRUD + redesign) i **Plan sal UEW** — osobny Tor 2
  (osobny spec/plan), po zakończeniu Toru 1.
- `AdminEquipmentPanel` domyślna rola `'Członek Zarządu SSUEW'` — generyczny placeholder
  (admin i tak wpisuje własną funkcję), zostaje.
- Zmiana brzmienia kredytu twórcy — opcjonalna, domyślnie bez zmian.
