# Backend sprzętu — powiadomienia o wnioskach + PDF zwrotu na maila

Pełny, gotowy do wklejenia skrypt: [`docs/apps-script/sprzet-backend.gs`](../apps-script/sprzet-backend.gs)
(kopia produkcyjnego skryptu z 2026-10-11 + zmiany opisane w jego nagłówku).

## Wdrożenie (5 min)

1. Arkusz sprzętu (`1oFNVEsHmWS_b3-kOIhU8JpTiw-q-2LQ_vwDNxQN7C5o`) → **Rozszerzenia → Apps Script**.
2. W pliku ze skryptem: **Ctrl+A** → wklej całą zawartość `sprzet-backend.gs` → **Ctrl+S**.
3. W arkuszu, zakładka **WYDANIA**: w komórce **L1** wpisz nagłówek `Email`.
4. W edytorze z listy funkcji wybierz **`testPowiadomienia`** → **Uruchom** → sprawdź, czy mail doszedł
   do Martyny i Jakuba.
5. **Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: „Nowa wersja” → Wdróż.**
   Nie „Nowe wdrożenie” — zmieniłby się URL używany przez CRA.

## Co się zmienia

- **Nowy wniosek o sprzęt** → mail do `POWIADOMIENIA_WNIOSKI` (kto, termin, sprzęt z nazwami).
- **Wydanie** → e-mail korzystającego zapisywany w WYDANIA (kolumna L), żeby przy zwrocie był pod ręką.
- **Zwrot** → PDF zawiera stan przy zwrocie i decyzję wydającego (krzyżyki) i jest wysyłany na e-mail
  zwracającego (pole w CRA, wstępnie wypełnione z kolumny Email). Wcześniej PDF zwrotu w ogóle nie szedł mailem.

Mail wychodzi z konta właściciela skryptu (to samo, z którego już idą porozumienia sprzętowe).
