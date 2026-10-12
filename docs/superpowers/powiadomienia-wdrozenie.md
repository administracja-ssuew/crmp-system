# Powiadomienia CRA — wdrożenie (etap 1: Sale)

Kolejność ma znaczenie: najpierw konfiguracja (1–4), potem kod CRA (5), na końcu skrypt sal (6).

## 1. Klucz VAPID (Firebase)
Firebase Console → ⚙️ Ustawienia projektu → **Cloud Messaging** → **Web Push certificates** →
**Generate key pair** → skopiuj klucz (długi ciąg zaczynający się zwykle od `B…`).

## 2. Sekrety
Wygeneruj dwa losowe ciągi (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```
Pierwszy = `NOTIFY_SECRET`, drugi = `CRON_SECRET`.

## 3. Zmienne w Vercelu (projekt CRA → Settings → Environment Variables, Production + Preview)
| Zmienna | Wartość |
|---|---|
| `VITE_FIREBASE_VAPID_KEY` | klucz z kroku 1 |
| `NOTIFY_SECRET` | sekret z kroku 2 |
| `CRON_SECRET` | drugi sekret z kroku 2 |
| `APP_URL` | `https://cra-system.vercel.app` (po zmianie domeny — nowy adres) |

`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` już są (używa ich `approve-request`).

## 4. Reguły Firestore (Firebase Console → Firestore Database → Reguły)
Dopisz wewnątrz `match /databases/{database}/documents { … }` i **Opublikuj**:
```
match /notifications/{id} {
  allow read: if request.auth != null;
  allow write: if false;            // zapis tylko przez serwer (/api/notify)
}
match /push_tokens/{id} {
  allow read, write: if false;      // tylko przez /api/push-token
}
```

## 5. Kod CRA
`git push` → Vercel zbuduje nową wersję (nowe zmienne `VITE_*` wymagają nowego builda — jeśli były dodane po pushu, zrób **Redeploy**).

## 6. Skrypt sal (Apps Script)
1. Arkusz kalendarza sal → **Rozszerzenia → Apps Script**.
2. **Ustawienia projektu (⚙️) → Właściwości skryptu → Dodaj**: `NOTIFY_SECRET` = ten sam sekret co w Vercelu.
3. Edytor: **Ctrl+A** → wklej `docs/apps-script/sale-backend.gs` → **Ctrl+S**.
4. Najpierw włącz powiadomienia w CRA na swoim telefonie (dzwonek 🔔 → „Włącz powiadomienia”).
5. Lista funkcji → **`testPowiadomCRA`** → **Uruchom** → zaakceptuj zgody (zewnętrzne żądania, poczta) → na telefonie powinien przyjść push „Nowy wniosek o salę · 110 L”, a na kafelku „Sale i Przestrzenie” licznik 1.
6. **Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: „Nowa wersja” → Wdróż** (nie „Nowe wdrożenie”).
7. Wejdź na `/kalendarz/samorzad` jako admin — testowa sprawa zamknie się sama (licznik wróci do stanu rzeczywistego).

## 7. Telefony adminów
- **Android:** otwórz CRA w Chrome → 🔔 → „Włącz powiadomienia” → Zezwól. (Opcjonalnie menu ⋮ → „Dodaj do ekranu głównego”.)
- **iPhone (iOS 16.4+):** Safari → CRA → Udostępnij → **Do ekranu początkowego** → otwórz CRA z ikony → 🔔 → „Włącz powiadomienia” → Zezwól.

## Checklista odbioru
- [ ] Złożenie wniosku o salę → push u adminów + licznik +1 na dashboardzie i na „Dla Samorządu Studentów”.
- [ ] Kliknięcie pusha → otwiera się lista oczekujących.
- [ ] Zatwierdzenie → licznik −1, w dzwonku „zatwierdzono · e-mail admina”, wnioskodawca dostaje mail.
- [ ] Odrzucenie → licznik −1, wnioskodawca dostaje mail „nie została zatwierdzona”.
- [ ] Wniosek usunięty ręcznie z arkusza → licznik spada po wejściu admina na stronę sal.
- [ ] Konto `member` nie widzi dzwonka ani liczników.
- [ ] Następnego dnia o 8:00 przy wniosku starszym niż 48 h → push przypomnienia (Vercel → projekt → Cron Jobs pokazuje wywołania).
