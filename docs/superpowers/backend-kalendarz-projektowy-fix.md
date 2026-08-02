# Kalendarz Projektowy — poprawka backendu (do wklejenia w Apps Script)

Przyczyna błędów CRUD: frontend wysyła wszystkie akcje przez GET, a `addProjekt` i
`updateProjekt` są obsługiwane tylko w `doPost` — GET do nich trafia w `default` i nic
nie zapisuje. Handlery już czytają `e.parameter.body`, więc wystarczy dodać je do routera
`doGet`.

## Zmiana
W funkcji `doGet`, w bloku `switch (action)`, dodaj dwa `case` (obok istniejących
`getProjekty` / `deleteProjekt`):

```js
      case 'getProjekty':     return getProjektyResponse(e);
      case 'addProjekt':      return addProjektResponse(e);      // <-- DODAJ
      case 'updateProjekt':   return updateProjektResponse(e);   // <-- DODAJ
      case 'deleteProjekt':   return deleteProjektResponse(e);
```

Po wklejeniu wszystkie 4 akcje (`getProjekty`, `addProjekt`, `updateProjekt`,
`deleteProjekt`) działają przez GET. `doPost` możesz zostawić bez zmian (dalej obsłuży
POST).

Wdróż nową wersję: Wdrożenie → Zarządzaj wdrożeniami → Edytuj → Nowa wersja. URL musi
zostać ten sam co `VITE_AS_URL` / `VITE_AS_SALA_URL`.
