# Kalendarz Projektowy — naprawa CRUD + redesign — projekt (Tor 2)

**Data:** 2026-08-02
**Komponent:** `src/components/Projekty/KalendarzProjektowy.jsx`
**Backend:** deployed Apps Script (`VITE_AS_URL` / `VITE_AS_SALA_URL`) — poza repo, sekcja „KALENDARZ PROJEKTOWY".

## Cel
1. Naprawić CRUD wydarzeń (dodawanie/edycja/usuwanie/odświeżanie), które obecnie nie działa.
2. Przeprojektować widok: spójność z Tailwind, widok listy/agendy, czytelniejsza siatka, lepszy flow.

## A. Naprawa CRUD — przyczyna i rozwiązanie

**Przyczyna:** frontend wysyła wszystkie akcje przez `GET` (`fetch(url)` z `?body=`/`?id=`),
a backend obsługuje `addProjekt`/`updateProjekt` **tylko w `doPost`**. GET do tych akcji
trafia w `default` w `doGet` → zwraca `{ping:'ok', success:true}`, więc front myśli, że
zapisał, ale nic się nie zapisuje. `getProjekty`/`deleteProjekt` są w `doGet` (działają).

**Rozwiązanie (backend — deliverable do wklejenia):** ujednolicić router — `doGet` ma
obsługiwać także `addProjekt` i `updateProjekt` (handlery już czytają `e.parameter.body`,
co działa dla GET). Minimalna zmiana: dodać do `switch` w `doGet` dwa `case`:
```js
case 'addProjekt':    return addProjektResponse(e);
case 'updateProjekt': return updateProjektResponse(e);
```
Po wklejeniu wszystkie 4 akcje (`getProjekty`, `addProjekt`, `updateProjekt`,
`deleteProjekt`) działają przez GET. Front zostaje na GET‑z‑`?body=` (przeżywa redirecty
GAS). Dostarczymy notatkę `docs/superpowers/backend-kalendarz-projektowy-fix.md`.

**Frontend CRUD:** logika `handleSave`/`handleDelete` (GET‑z‑`?body=`/`?id=` + `loadEvents()`)
jest poprawna i zostaje; przenosimy ją do przeprojektowanego komponentu. Dodajemy: potwierdzenie
usuwania, komunikaty inline/toast zamiast `alert()`, obsługę stanów loading/error.

## B. Redesign `KalendarzProjektowy.jsx` (inline-style → Tailwind)

Przepisanie komponentu na Tailwind (dziś jedyny ekran na obiektach `style`). Zachowany
model danych: wydarzenia jednodniowe po `data_finalu`, `STATUS_CONFIG` (5 statusów),
`TYP_CONFIG` (3 typy), pola `{id, nazwa, organizacja, typ, data_finalu, opis, status, kolor}`.

**Widoki (przełącznik Miesiąc / Lista):**
- **Miesiąc** — siatka 7×N (jak teraz), ale w Tailwind: kolory statusów, „dziś", pigułki
  wydarzeń, „+N więcej", czytelne puste dni, nagłówki dni tygodnia.
- **Lista / agenda** — nadchodzące wydarzenia (od dziś w górę) pogrupowane po miesiącu,
  posortowane rosnąco po `data_finalu`, z badge statusu/typu; pod filtrami statusu/typu.

**Elementy wspólne:**
- Nagłówek z tytułem + (admin) „+ Dodaj wydarzenie".
- Filtry: status, typ, licznik wyników.
- Nawigacja miesiąca (‹ / › / Dziś) — widoczna w widoku Miesiąc.
- Modal szczegółów (z akcjami Edytuj/Usuń dla admina) + modal formularza (dodaj/edytuj).
- **Potwierdzenie usuwania** (modal/inline zamiast `window.confirm`), **toasty/komunikaty**
  zamiast `alert()`, stany: loading (skeleton/spinner), error (z retry), empty.
- Legenda statusów.

**Czyste funkcje (testowalne, Vitest):**
- `buildCalGrid(year, month, events)` — istnieje; wydzielić do `src/components/Projekty/kalendarzUtils.js` + testy (siatka: dopełnienie z poprzedniego/następnego miesiąca, przypisanie eventów po dacie, flaga „dziś").
- `groupUpcoming(events, fromDate)` — nowa: filtruje wydarzenia od `fromDate`, sortuje rosnąco, grupuje po `YYYY-MM` (klucz + etykieta „Miesiąc RRRR"). Testy.

## Testy
- **Vitest** dla `kalendarzUtils.js` (`buildCalGrid`, `groupUpcoming`).
- **Build** `npm run build` OK.
- **Klik-through** (wymaga wdrożonego backendu z fixem): dodaj → pojawia się; edytuj → zapisuje;
  usuń (z potwierdzeniem) → znika; przełącznik Miesiąc/Lista; filtry; stany empty/loading.

## Poza zakresem
- Plan sal UEW (godziny 8–21) — zostaje bez zmian (decyzja z Toru 1 rozmów).
- Zmiana modelu danych (multi-day / godziny) — nie.
- Backend deploy — po stronie użytkownika (dostarczamy snippet).

## Zależność
Pełne działanie CRUD wymaga wklejenia poprawki backendu (sekcja A) do wdrożonego Apps
Scriptu. Do tego czasu redesign działa wizualnie, ale zapis/edycja nie zadziałają
end-to-end.
