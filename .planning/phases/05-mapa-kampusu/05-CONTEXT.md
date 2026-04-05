# Phase 5: Mapa Kampusu - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Pełna przebudowa MapPage.jsx: naprawa bugów (responsywność, kolizja UI, hotspot scaling), ulepszenie UX (tooltip, layout), wyraźny podział user/admin, oraz nowa zakładka "Rejestr" z tabelarycznym widokiem wszystkich plakatów/banerów. Dane historyczne pobierane z GAS (nowa akcja).

Nie wchodzi w zakres: osobna strona CRUD lokalizacji (odkładamy), żadnych nowych tras w App.jsx poza ewentualnym rejestrem jako zakładką w MapPage.

</domain>

<decisions>
## Implementation Decisions

### Responsywność mapy i hotspoty

- **D-01:** Kontener mapy wypełnia całą dostępną przestrzeń (`flex-1`, `object-fit: contain`). Mapa skaluje się do kontenera zachowując proporcje. Hotspoty pozycjonowane w % relative do naturalnych wymiarów obrazu — obliczone dynamicznie przez `onLoad` obrazu (naturalWidth/naturalHeight → przeliczenie `loc.top`/`loc.left` z px/% GAS na właściwe % aktualnych wymiarów).
- **D-02:** Kontener mapy: `<div className="flex-1 relative overflow-hidden">` + `<img className="w-full h-full object-contain">`. Hotspoty: `style={{ top: calcTop(loc), left: calcLeft(loc) }}` gdzie `calcTop`/`calcLeft` przelicza pozycję relatywnie do aktualnych rendered dimensions obrazu.

### Kolizja UI — filtry i wyszukiwarka

- **D-03:** Filtry i wyszukiwarka przenoszone do **sticky headera** nad mapą (nie jako absolute overlay). Struktura strony: `<div className="flex flex-col h-full">` → `<header className="shrink-0 bg-white border-b px-4 py-2 flex gap-3">` → `<div className="flex-1 relative">` (mapa z hotspotami). Eliminuje kolizję z `fixed top-6 left-6` przyciskiem App.jsx.

### Tooltip on hover

- **D-04:** Tooltip pojawia się po najechaniu na pineszkę. Zawiera: nazwa miejsca + typ (Plakat/Baner) + status kolorowy (wolne/zajęte). Implementacja: absolutnie pozycjonowany `<div>` pojawiający się na `group-hover:opacity-100` (Tailwind group) lub przez `useState(hoveredId)`. Kolor statusu: emerald gdy `free > 0`, red gdy `free === 0`.

### Podział user vs admin

- **D-05:** **User** widzi po kliknięciu pineśki: nazwę, pojemność, wolne miejsca, przycisk "Jak zarezerwować?". Bez zakładek, bez listy aktywnych plakatów.
- **D-06:** **Admin** widzi pełen panel z zakładkami: "Informacje" (jak user) + "Zarządzaj" (aktywne plakaty z możliwością zdjęcia, formularz dodawania, historia, statystyki, edycja danych lokalizacji).
- **D-07:** Filtry (wyszukiwarka + typ) widoczne dla wszystkich (user i admin).

### Panel szczegółów — layout responsive

- **D-08:** Desktop: sliding panel z prawej (`fixed right-0`, 500px) — zachowany obecny wzorzec. Mobile: pełnoekranowy modal (overlay). Breakpoint: `md:` — poniżej md panel staje się `fixed inset-0` (full screen modal z przyciskiem zamknięcia na górze).

### Admin panel — zawartość

- **D-09:** Zakładka "Zarządzaj" ma 4 sekcje:
  1. Aktywne plakaty/banery (lista z przyciskiem "Zdejmij") — istniejące
  2. Formularz dodawania nowego plakatu — istniejący
  3. Historia (zakończone plakaty) — nowe, pobierane z GAS action `getHistory` z parametrem `locationId`
  4. Statystyki: ile razy tablica była pełna (obliczone z historii), średni czas zajętości — nowe
- **D-10:** Edycja danych lokalizacji (nazwa, pojemność, zdjęcie) inline w panelu admin — nowy formularz z GAS action `updateLocation`. Pola: `name`, `capacity`, `imageUrl`.

### Rejestr Plakatów i Banerów (zakładka)

- **D-11:** MapPage ma przełącznik widoku na górze (sticky header): **"Mapa"** / **"Rejestr"**. Widoczny tylko dla admina (userRole === 'admin').
- **D-12:** Widok Rejestru: tabela ze wszystkimi aktywnyimi i archiwalnymi plakatami/banerami z całego kampusu. Kolumny: Kod CRED | Nazwa | Organizacja | Lokalizacja | Data zawieszenia | Termin zdjęcia | Status (Aktywny/Zakończony). Dane z GAS action `getAllPosters`.
- **D-13:** Filtry w Rejestrze: "Wszystkie" / "Aktywne" / "Zakończone" + wyszukiwarka po nazwie/org/CRED.

### GAS — nowe akcje

- **D-14:** Nowe akcje GAS do zaimplementowania przez GAS-side (nie przez frontend — frontend tylko wywołuje):
  - `getHistory` (GET, params: `action=getHistory&locationId=X`) → historia plakatów dla lokalizacji
  - `getAllPosters` (GET, params: `action=getAllPosters`) → wszystkie plakaty z kampusu
  - `updateLocation` (POST, body: `{action:'updateLocation', locationId, name, capacity, imageUrl}`) → edycja lokalizacji
- **D-15:** Frontend wywołuje te akcje przez istniejący wzorzec `fetch(DATA_URL)` / `fetch(DATA_URL, {method:'POST', ...})`. Dodać error handling z komunikatem.

### Naprawa: scroll na górę przy wejściu

- **D-16:** Dodać `useEffect(() => { window.scrollTo(0,0); }, [])` — tak jak w KompendiumPage i KsiegaInwentarzPage.

### Claude's Discretion

- Dokładny breakpoint responsive panelu (obecny kod używa `md:` — zachować)
- Implementacja tooltipa (group-hover CSS vs useState hoveredId) — preferuj useState dla lepszej kontroli
- Wizualne detale Rejestru (kolory statusów, sortowanie domyślne)
- Obsługa braku danych historycznych (skeleton / empty state)
- Ikony z lucide-react (MapPin, Filter, Search, Clock, BarChart2 itd.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Główny plik do modyfikacji
- `src/pages/MapPage.jsx` — JEDYNY plik strony (368 linii). Zawiera: fetchData, handleAddPoster, handleRemovePoster, mapa z hotspotami, panel boczny, modal procedury. PRZECZYTAJ W CAŁOŚCI przed implementacją.

### Routing i nawigacja
- `src/App.jsx` — sprawdź istniejący `fixed top-6 left-6 z-50` przycisk "Wróć do Menu" — to jest przyczyna kolizji UI

### Auth i role
- `src/context/AuthContext.jsx` — `useAuth()` zwraca `{ user, userRole }`. `isAdmin = userRole === 'admin'`

### Wymagania
- `.planning/REQUIREMENTS.md` — MAP-01

</canonical_refs>

<code_context>
## Existing Code Insights

### GAS endpoint — schemat danych (zweryfikowany ze skryptem GAS)

**doGet() → GET zwraca `{ locations: [...] }`**
Każda lokalizacja: `id`, `name`, `type` ('plakat'|'baner'), `top`, `left`, `capacity`, `free`, `image`, `activePosters[]`

`activePosters[]` — każdy element: `{ credId, nazwa, org }` — **BRAK `endDate`!** To istniejący bug w GAS.
Fix: dodać `endDate: Utilities.formatDate(new Date(row[1]), 'Europe/Warsaw', 'dd.MM.yyyy')` przy push w doGet().

**Sheet: Rezerwacje_Mapy** — kolumny:
- A = locationId (numer/id lokalizacji)
- B = endDate (data zdjęcia, jako Date)
- C = posterName (nazwa plakatu/baneru)
- D = organization
- E = email rezerwującego
- F = locationType ('plakat'|'baner')
- G = credId (znak CRED, np. CRED-24-001)

**Sheet: REJESTR_PLAKATOWANIA** — kolumny:
- A = id, B = znak (credId), C = org, D = email, E = data_zgody, F = opis_promo, G = opis_obowiazku, H = data_zdjecia, I = status_reczny, M = status_system (AKTYWNE/ZDJĘTE)

**Sheet: REJESTR_BANEROW** — analogiczna struktura do REJESTR_PLAKATOWANIA

**Sheet: Miejsca** — dane lokalizacji (id, name, type, top, left, capacity, image)

### Nowe akcje GAS do implementacji (po stronie GAS):

**getHistory** (GET, `?action=getHistory&locationId=X`):
- Filtruj Rezerwacje_Mapy po col A (locationId) — WSZYSTKIE wiersze (nie tylko aktywne)
- Zwróć: `{ credId, nazwa, org, endDate, status }` gdzie status pobierany z REJESTR sheet po credId (col B) → col M

**getAllPosters** (GET, `?action=getAllPosters`):
- Czytaj REJESTR_PLAKATOWANIA + REJESTR_BANEROW, zwróć wszystkie wiersze jako:
  `{ credId, org, email, dataZgody, dataZdjecia, status, type ('plakat'|'baner'), locationId, nazwa }`
- locationId: join przez Rezerwacje_Mapy col G (credId) → col A (locationId)

**updateLocation** (POST, body: `{action:'updateLocation', locationId, name, capacity, imageUrl}`):
- Znajdź wiersz w Miejsca po locationId, zaktualizuj name/capacity/imageUrl

### POST actions (działają): `addPoster`, `removePoster`

### Istniejące wzorce
- `isAdmin = userRole === 'logitech' || userRole === 'admin'` — uwaga: logitech też jest adminem tu! Zachować ten wzorzec.
- Panel boczny: `fixed top-0 right-0 h-full w-full md:w-[500px]` + `transform translate-x-full/translate-x-0`
- Mapa: `<img src="/mapa.jpg" className="max-w-none h-[800px]">` — do zmiany na responsive

### Bug: kolizja UI
- Filtry: `absolute top-4 left-4 right-4 z-30`
- Przycisk App.jsx: `fixed top-6 left-6 z-50`
- Fix: przenieść filtry do sticky headera (z-30 + poza mapą)

</code_context>

<specifics>
## Specific Ideas

- Tooltip: `<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ...">` nad pineską — pojawia się przy `hoveredId === loc.id`
- Rejestr: widok przełączany przez `const [view, setView] = useState('map')` w state strony
- Historia lokalizacji: lazy fetch przy otwieraniu zakładki "Zarządzaj" (nie przy starcie strony)
- Nowa mapa z Photoshopa: plik trafi do `/public/mapa.jpg` (nadpisanie istniejącego) — kod nie wymaga zmian jeśli ścieżka ta sama

</specifics>

<deferred>
## Deferred Ideas

- CRUD lokalizacji (dodawanie/usuwanie pinezek z mapy) — zbyt skomplikowane dla tej fazy, wymaga osobnego UX dla wybierania współrzędnych
- Mobilna mapa z pinch-to-zoom — poza zakresem v1
- Powiadomienia push — maile wystarczą (obsługiwane przez GAS)

</deferred>

---

*Phase: 05-mapa-kampusu*
*Context gathered: 2026-04-05*
