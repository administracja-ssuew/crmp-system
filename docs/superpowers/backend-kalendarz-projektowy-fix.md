# Kalendarz Projektowy — poprawki backendu (do wklejenia w Apps Script)

Dwie niezależne poprawki w skrypcie sekcji „Kalendarz Projektowy".

## Poprawka 1 — router: `addProjekt`/`updateProjekt` przez GET

Przyczyna: frontend wysyła wszystkie akcje przez GET, a `addProjekt` i `updateProjekt` są
obsługiwane tylko w `doPost` — GET do nich trafia w `default` i nic nie zapisuje. Handlery
już czytają `e.parameter.body`, więc wystarczy dodać je do routera `doGet`.

W funkcji `doGet`, w bloku `switch (action)`, dodaj dwa `case` (obok istniejących
`getProjekty` / `deleteProjekt`):

```js
      case 'getProjekty':     return getProjektyResponse(e);
      case 'addProjekt':      return addProjektResponse(e);      // <-- DODAJ
      case 'updateProjekt':   return updateProjektResponse(e);   // <-- DODAJ
      case 'deleteProjekt':   return deleteProjektResponse(e);
```

Po wklejeniu wszystkie 4 akcje działają przez GET. `doPost` możesz zostawić bez zmian.

## Poprawka 2 — data przesuwa się o 1 dzień (np. 2.08 zapisuje się jako 1.08)

Przyczyna: `sheetToObjects` czyta komórki przez `getValues()`. Data zapisana w arkuszu jest
zwracana jako obiekt `Date`, który `JSON.stringify` (w `jsonOk`) serializuje do **UTC** —
północ w Warszawie staje się 22:00 dnia poprzedniego, więc front (biorący pierwsze 10 znaków
`YYYY-MM-DD`) widzi dzień wcześniej. To ten sam problem, który drugi backend (kalendarz
Samorządu, `getSheetData`) rozwiązuje czytaniem dat „z ekranu".

Rozwiązanie: w `sheetToObjects` formatuj kolumnę `data_finalu` jako `yyyy-MM-dd` w strefie
skryptu (zamiast oddawać surowy `Date`). Zamień funkcję `sheetToObjects` na:

```js
function sheetToObjects(sh) {
  var data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var tz = Session.getScriptTimeZone();
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var v = row[i];
      // data_finalu: Arkusz oddaje Date -> formatuj jako 'yyyy-MM-dd' w strefie skryptu,
      // żeby JSON.stringify nie przesunął dnia do UTC.
      if (h === 'data_finalu' && v instanceof Date) {
        obj[h] = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      } else {
        obj[h] = v;
      }
    });
    return obj;
  }).filter(function(r) { return r.id; });
}
```

Uwaga: upewnij się, że strefa czasowa projektu Apps Script to `Europe/Warsaw`
(Ustawienia projektu → Strefa czasowa). Frontend nie wymaga zmian — poprawnie obsługuje
czysty `YYYY-MM-DD`.

## Wdrożenie

Po obu poprawkach: Wdrożenie → Zarządzaj wdrożeniami → Edytuj → Nowa wersja. URL musi
zostać ten sam co `VITE_AS_URL` / `VITE_AS_SALA_URL`.
