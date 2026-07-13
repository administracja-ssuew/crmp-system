# Migracja sal budynek J → L + wygaszenie Kalendarza Organizacji Studenckich — projekt

**Data:** 2026-07-13
**Powód:** Przenosiny siedziby Samorządu Studentów z budynku **J** do budynku **L**.

## Cel

1. Zmienić wszystkie sale budynku J na nowe sale budynku L (wg mapowania niżej).
2. Usunąć sale campusowe **10 A**, **213 Z**, **214 Z**.
3. Wygasić **Kalendarz Organizacji Studenckich** (`/kalendarz/organizacje`).
4. Zaktualizować wzmianki nie-funkcyjne (baza wiedzy AI-bota, placeholdery, teksty).
5. Zrobić to tak, by przyszłe zmiany sal były trywialne — **centralne źródło prawdy**.

## Mapowanie sal (kanoniczny format: `<numer> L`, ze spacją)

| Stara sala (budynek J) | Nowa sala (budynek L) | Rola |
|---|---|---|
| 9J / „9 J" | **110 L** | rdzeń samorządowy |
| 16J / „16 J" | **106 L** | rdzeń samorządowy |
| 28J / „28 J" | **101 L** | rdzeń samorządowy |
| 11J / „11 J" | **13 L** | specjalna (dodatkowe pytania projektowe) |
| 24J / „24 J" | **108 L** | tylko stały dostęp (bez rekrutacji) |

**Sale usuwane całkowicie:** `10 A`, `213 Z`, `214 Z`.

Backend (Google Sheets / Apps Script) musi użyć **dokładnie tych samych** stringów
przy migracji danych — patrz sekcja „Backend".

## Decyzje (zatwierdzone z użytkownikiem)

- **Wariant B — centralizacja.** Powstaje jedno źródło prawdy `src/data/rooms.js`;
  pliki funkcyjne przestają hardkodować sale i importują z modułu. (Odrzucone:
  edycje w miejscu bez centralizacji — łatwiejsze teraz, ale utrwala rozproszenie.)
- **Wygaszenie org-kalendarza = baner „nieaktywny" + blokada rezerwacji.** Strona i
  trasa zostają w repo; kafelek na ekranie wyboru oznaczony jako nieaktywny.
- **Backend osobno.** Front zmienia nazwy; migrację arkuszy i listy sal backendu
  wykonuje użytkownik. Do czasu migracji stare rezerwacje pod starymi nazwami mogą
  nie pojawiać się w siatce (świadomie zaakceptowane).
- **Zakres wzmianek = wszystko**, łącznie z bazą wiedzy AI-bota i placeholderami.

## Centralny moduł `src/data/rooms.js`

Czysty moduł JS (bez JSX) — jedyne źródło tożsamości sal:

```js
// Sale Samorządu — budynek L (po przenosinach z budynku J).
export const ROOMS = {
  '110 L': { label: '110 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-emerald-600' }, // było 9J
  '106 L': { label: '106 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-blue-600' },    // było 16J
  '101 L': { label: '101 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-indigo-600' },  // było 28J
  '13 L':  { label: '13 L',  building: 'L', kind: 'special',   activeColor: 'bg-amber-600' },   // było 11J
  '108 L': { label: '108 L', building: 'L', kind: 'permanent', activeColor: 'bg-fuchsia-600' }, // było 24J
};

// Rdzeń zawsze-dostępny (siatka kalendarza Samorządu):
export const SAMORZAD_ROOMS   = ['110 L', '106 L', '101 L'];
// Sale w formularzu rekrutacji dostępu (108 L wykluczona — tylko stały dostęp):
export const RECRUITMENT_ROOMS = ['110 L', '106 L', '101 L', '13 L'];
// Kolejność sal w PDF panelu dostępów:
export const ACCESS_PDF_ORDER  = ['110 L', '106 L', '101 L', '13 L', '108 L'];

export const SPECIAL_ROOM   = '13 L';   // wymaga dodatkowych pytań projektowych (było 11J)
export const PERMANENT_ROOM = '108 L';  // tylko stały dostęp, brak rekrutacji (było 24J)
```

Kolory filtrów przechowywane w metadanych każdej sali (`activeColor`) — komponenty
kalendarza/paneli czytają je z modułu, więc dodanie/zmiana sali to edycja jednego pliku.
Zachowane oryginalne kolory: 110 L=emerald (było 9J), 106 L=blue (16J), 101 L=indigo (28J).

## Refaktor plików funkcyjnych (import z modułu)

### `src/pages/CalendarSamorzadPage.jsx`
- Przyciski filtrów, `SCHEDULE`/campus, `dailyRooms`, `<option>`, domyślna sala formularza,
  wszelkie `room === '9J'` — zasilane z `SAMORZAD_ROOMS` / `ROOMS`.
- **Usuwane:** przyciski i wpisy `213 Z`, `214 Z`; po usunięciu kalendarz pokazuje tylko
  rdzeń 110 L / 106 L / 101 L (brak sal campusowych).
- Domyślna sala formularza: `'9J'` → `'110 L'` (pierwsza z `SAMORZAD_ROOMS`).

### `src/pages/AccessListPage.jsx`
- `export const ROOMS = [...]` → używa `RECRUITMENT_ROOMS` z modułu.
- Logika „sali specjalnej": `includes('11 J')` → `includes(SPECIAL_ROOM)`; etykiety
  „Sala 11J" → „Sala 13 L".
- **Nazwy wewnętrznych pól/kluczy payloadu** (`justification11J`, `needs11J`, `has11J`)
  **pozostają bez zmian** — to identyfikatory pól, nie sale; ich zmiana zepsułaby backend
  rekrutacji. Zmieniają się tylko wartości sal i teksty widoczne dla użytkownika.

### `src/pages/AdminAccessPanel.jsx`
- Klucze `ROOM_TO_MEMBERS` i `ROOMS_PDF_ORDER` → nowe id z modułu (`ACCESS_PDF_ORDER`).
- Listy osób (`CORE_MEMBERS` itd.) zostają lokalnie; tylko przeklucza się je na nowe id
  (110 L / 106 L / 101 L / 13 L / 108 L).
- Etykiety „11J", „24J" w UI → „13 L", „108 L".

## Wygaszenie Kalendarza Organizacji Studenckich

### `src/pages/UniversalCalendarPage.jsx` (`/kalendarz/organizacje`)
- Na górze widoku **baner**: „Kalendarz Organizacji Studenckich został wygaszony
  (nieaktywny)." + krótka informacja.
- **Blokada rezerwacji:** formularz/przycisk składania wniosku wyłączony (disabled) lub
  ukryty; próba wysyłki niemożliwa.
- Wewnętrzne sale campusowe (`10 A`, `213 Z`, `214 Z`) usuwane dla porządku. Strona i
  trasa `/kalendarz/organizacje` **zostają** w repo (łatwy powrót). Nie podłączamy jej do
  modułu sal (jest wygaszona — YAGNI).

### `src/pages/CalendarSelectionPage.jsx`
- Kafelek „Dla Organizacji Studenckich" oznaczony jako **nieaktywny** (wyszarzony,
  informacja o wygaszeniu). Link może zostać (strona i tak pokaże baner).
- Teksty wymieniające sale: „(9J, 16J, 28J)" → „(110 L, 106 L, 101 L)"; wzmianki o
  „bud. A, Z" / „sali 28J" zaktualizowane/usunięte zgodnie z usunięciem sal campusowych
  i wygaszeniem org-kalendarza.

## Wzmianki tekstowe + AI-bot (zakres „wszystko")

- `src/knowledge.js` — „pokój 9J" → „pokój 110 L"; „(9J, 16J, 28J)" → „(110 L, 106 L,
  101 L)"; „bud. B/J" → „bud. B/L"; zdanie o rezerwacji „28J oraz sal dydaktycznych bud.
  A i Z przez zakładkę Dla Organizacji Studenckich" — przeredagowane (org-kalendarz
  wygaszony, sale A/Z usunięte).
- `src/pages/DocumentsPage.jsx` — placeholdery: „np. Budynek J" → „np. Budynek L";
  „np. Pomieszczenia 9, 16, 28 - Budynek J" → „np. Pomieszczenia 110, 106, 101 - Budynek
  L"; „np. Sala 214, w budynku A" → neutralny przykład (np. „np. Sala 101, w budynku L").
  Ogólny „np. Sala 205, Budynek A" (niezwiązany z J) — bez zmian.
- `src/pages/KompendiumPage.jsx` — cytat-przykład „w budynku B/J" → „w budynku B/L".

## Backend (POZA repo — deliverable: notatka migracyjna)

Powstaje `docs/superpowers/backend-migracja-sal.md` z instrukcją dla użytkownika:
- **Google Sheets rezerwacji** (`CalendarSamorzadPage` → `GOOGLE_SHEETS_URL`): w kolumnie
  sali podmienić `9J→110 L`, `16J→106 L`, `28J→101 L` (i ewentualnie zdecydować, co ze
  starymi wpisami `213 Z`/`214 Z`).
- **Lista sal `SalaKalendar`** (`getSalaList`, `VITE_AS_SALA_URL`): wprowadzić nowe nazwy L,
  usunąć skasowane sale (te dane są w całości po stronie backendu, nie w repo).
- Bez tej migracji stare rezerwacje pod starymi nazwami nie pojawią się w siatce kalendarza.
- Stringi muszą być **identyczne** z kanonicznymi (`110 L`, `106 L`, `101 L`, `13 L`, `108 L`).

## Testy

- **Vitest** dla `src/data/rooms.js` (`src/data/rooms.test.js`):
  - żadne id sali nie zawiera litery „J",
  - wszystkie sale mają `building === 'L'`,
  - skasowane sale (`10 A`, `213 Z`, `214 Z`, `9J`, `16J`, `28J`, `11 J`, `24 J`) nie
    występują jako klucze,
  - obecne są nowe id (110 L, 106 L, 101 L, 13 L, 108 L),
  - `RECRUITMENT_ROOMS` nie zawiera `PERMANENT_ROOM` (108 L),
  - `ACCESS_PDF_ORDER` zawiera wszystkie 5 sal.
- **Grep akceptacyjny** (weryfikacja końcowa): brak wzorca `\d+\s?J` w plikach funkcyjnych
  sal (`rooms.js`, `CalendarSamorzadPage`, `AccessListPage`, `AdminAccessPanel`).
- **Build** `npm run build` bez błędów.
- **Klik-through manualny:** kalendarz Samorządu (filtry/siatka/formularz pokazują 110/106/
  101 L, brak 213/214 Z), panel dostępów (nowe sale, sala specjalna 13 L działa), ekran
  wyboru (kafelek org-kalendarza nieaktywny), wejście w org-kalendarz (baner + brak
  możliwości rezerwacji).

## Poza zakresem

- Faktyczna migracja danych w Google Sheets / liście sal backendu (robi użytkownik wg notatki).
- Refaktor wygaszonego `UniversalCalendarPage` do modułu sal (strona nieaktywna).
- Zmiana nazw wewnętrznych identyfikatorów pól (`justification11J` itp.) — zostają, by nie
  psuć kontraktu z backendem rekrutacji.
- Centralizacja sal campusowych/uczelnianych (A/Z) — usuwane, nie centralizowane.
