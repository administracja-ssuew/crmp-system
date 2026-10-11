# Globalny system powiadomień CRA — projekt (etap 1: Sale)

Data: 2026-10-11 · Status: do przeglądu

## 1. Cel i kontekst

**Problem.** Admini muszą codziennie zaglądać do CRA, bo nic ich nie informuje o nowych wnioskach —
a wnioskodawcy nie dostają informacji o decyzji. Obie strony są tak samo ważne.

**Cel.** CRA samo woła admina, gdy coś czeka na decyzję (push na telefon + licznik na kafelku),
a wnioskodawca dostaje informację o rozpatrzeniu. Mechanizm jest wspólny dla wszystkich modułów;
etap 1 podłącza **Sale i Przestrzenie**, kolejne etapy podłączają resztę bez zmiany architektury.

**Ustalenia z rozmowy:**
- Kanał zewnętrzny: CRA jako aplikacja na telefon (PWA) z powiadomieniami push. Android/Chrome
  działa od razu; iPhone wymaga dodania CRA do ekranu głównego (iOS 16.4+).
- Podejście A: centralna skrzynka zdarzeń w Firestore + push przez Firebase Cloud Messaging (FCM).
- **Bez przebudowy skryptów Apps Script** — w każdym dochodzi jedna funkcja pomocnicza i po
  jednej linijce w akcjach.
- Odbiorcy powiadomień o salach: rola `admin` (jak dziś).
- Docelowo wszystkie moduły mają mieć powiadomienia + liczniki; kolejność etapów w §10.

**Stan obecny (sale).** Kalendarz Samorządu i kalendarz organizacji wysyłają wnioski do jednego
skryptu Apps Script (`AKfycbwy2o…`, akcja `submitBooking`) → arkusz wniosków „KRRPPD SSUEW (WNIOSKI)”
ze statusem `OCZEKUJE`. Admin rozpatruje je w „⏳ Oczekujące” na `/kalendarz/samorzad`
(`approveBooking` / `rejectBooking`). Identyfikator wniosku `rowId` = numer wiersza w arkuszu
wniosków (wiersze są tylko dopisywane). **Dziś wnioskodawca nie dostaje żadnego maila o decyzji.**

## 2. Architektura

```
Apps Script / CRA ──POST──▶ /api/notify  (Vercel; NOTIFY_SECRET albo Firebase ID token)
                               ├─▶ Firestore notifications  (sprawy otwarte + historia)
                               └─▶ FCM push → urządzenia adminów modułu (push_tokens)

Vercel Cron (codziennie) ──▶ /api/cron/reminders ──▶ push „czeka > 48 h”

CRA ◀── onSnapshot(notifications) ── liczniki na kafelkach + dzwonek
```

Jednostki (każda z jedną odpowiedzialnością):

| Jednostka | Odpowiedzialność |
|---|---|
| `src/data/roles.js` | Mapa moduł → role (dochodzi `sale: [admin]`); wspólna dla frontu i API |
| `api/_firebaseAdmin.js` | Jedna inicjalizacja firebase-admin (dziś zduplikowana w kilku plikach `api/`) |
| `api/_auth.js` | Weryfikacja wywołującego: `NOTIFY_SECRET` (Apps Script) lub ID token + rola z `authorized_users` |
| `api/notify.js` | Przyjmuje zdarzenia `created` / `resolved` / `sync`, zapisuje w Firestore, wysyła push |
| `api/push-token.js` | Rejestruje / usuwa token urządzenia zalogowanego użytkownika |
| `api/cron/reminders.js` | Codzienne przypomnienie o sprawach otwartych > 48 h |
| `api/_push.js` | Wybór odbiorców wg ról + wysyłka FCM + kasowanie nieważnych tokenów |
| `src/notifications/` | Logika czysta (treści, wybór odbiorców, porównanie do samonaprawy) — testowana Vitestem |
| `public/manifest.webmanifest` + ikony | Instalowalna aplikacja z nową ikoną CRA (`docs/logo/final/`) |
| `public/firebase-messaging-sw.js` | Odbiór push w tle i otwieranie właściwej strony po kliknięciu |
| `src/hooks/useNotifications.js` | Subskrypcja otwartych spraw → `{ counts, recent }` |
| `src/components/NotificationBell.jsx` | Dzwonek: lista ostatnich zdarzeń + „Włącz powiadomienia” |
| `Card` w `DashboardPage.jsx` | Nowa właściwość `badge` (licznik) |

## 3. Model danych (Firestore)

**`notifications/{module}_{refId}`** — jeden dokument na sprawę (np. `sale_42`):

```
module      'sale'
refId       '42'                       // rowId z arkusza wniosków
status      'open' | 'resolved'
title       'Nowy wniosek o salę · 110 L'
body        'Koło X — Spotkanie rekrutacyjne, 14.10, 18:00–20:00'
url         '/kalendarz/samorzad?oczekujace=1'
createdAt   serverTimestamp
updatedAt   serverTimestamp
resolvedAt  serverTimestamp | null
resolution  'approved' | 'rejected' | 'auto' | null
actor       'jan.kowalski@samorzad.ue.wroc.pl' | null   // kto rozpatrzył
remindedAt  serverTimestamp | null                       // ostatnie przypomnienie 48 h
```

Licznik modułu = liczba dokumentów `status == 'open'` dla modułu. Dzwonek = ostatnie 20 dokumentów
(wg `updatedAt`) z modułów, którymi użytkownik zarządza.

**`push_tokens/{token}`**: `uid`, `email`, `userAgent`, `createdAt`, `lastSeenAt`.
Odbiorcy są wyznaczani w chwili wysyłki: role z mapy modułu → e-maile z `authorized_users` →
tokeny z `push_tokens` (zmiana roli działa od razu, bez przepisywania tokenów).

## 4. Kontrakt API

`POST /api/notify` — nagłówek `X-Notify-Secret: <NOTIFY_SECRET>` **albo**
`Authorization: Bearer <Firebase ID token>` (użytkownik musi zarządzać danym modułem).

| `event` | Pola | Działanie |
|---|---|---|
| `created` | `module, refId, title, body, url` | Tworzy/odnawia sprawę `open`; push do adminów modułu |
| `resolved` | `module, refId, resolution, actor?` | Ustawia `resolved`; **bez** pushu |
| `sync` | `module, openRefIds[]`, opcjonalnie `items[]` (dane do brakujących) | Samonaprawa: sprawy `open` spoza listy → `resolved/auto`; brakujące z listy → tworzy `open` **bez** pushu |

Odpowiedź: `{ ok: true, pushed: <liczba urządzeń> }`. Idempotencja: ten sam `created` dwa razy
nie dubluje sprawy ani nie wysyła drugiego pushu, jeśli sprawa jest już `open`.

`POST /api/push-token` (Bearer) — `{ token }` zapisuje urządzenie; `DELETE` — usuwa.

`GET /api/cron/reminders` — wywoływany przez Vercel Cron (nagłówek `Authorization: Bearer <CRON_SECRET>`),
raz dziennie o 8:00. Dla każdego modułu: sprawy `open` starsze niż 48 h, których `remindedAt` jest
pusty lub starszy niż 24 h → **jeden zbiorczy** push („2 wnioski o sale czekają ponad 2 dni”).

## 5. Sale — zdarzenia, treści, odbiorcy

| Zdarzenie | Źródło | Odbiorca | Kanał | Licznik / dzwonek |
|---|---|---|---|---|
| Nowy wniosek | Apps Script `submitBooking` → `created` | admini | push: „Nowy wniosek o salę · {sala}” / „{org} — {tytuł}, {dd.mm}, {start}–{end}”; klik → lista oczekujących | +1, wpis |
| Zatwierdzono | `approveBooking` → `resolved/approved` | wnioskodawca | mail z Apps Script (MailApp) | −1, wpis „zatwierdził: {kto}” |
| Odrzucono | `rejectBooking` → `resolved/rejected` | wnioskodawca | mail z Apps Script (MailApp) | −1, wpis |
| Czeka > 48 h | cron | admini | push zbiorczy | bez zmian |

Przedłużenia godzin (`addExtension`) nie tworzą spraw — dodaje je sam admin.
Maile do wnioskodawców idą z Apps Script (`MailApp`, konto właściciela skryptu — tak jak porozumienia
sprzętowe), bo to sprawdzony kanał; `/api/notify` ich nie wysyła.

**Zmiany w skrypcie sal** (jedyne): stała `CRA_NOTIFY_URL`, sekret w Właściwościach skryptu
(`NOTIFY_SECRET`), funkcja `powiadomCRA(payload)` (`UrlFetchApp`, `muteHttpExceptions`, w `try/catch`),
funkcja `mailDoWnioskodawcy(...)`, po jednej linijce w `submitBooking` / `approveBooking` /
`rejectBooking`. `rejectBooking` dostaje e-mail wnioskodawcy z wiersza arkusza (front wysyła tylko `rowId`).
Akcja `submitBooking` zwraca też `rowId` nowego wiersza (do `refId`).

**Frontend sal:** `CalendarSamorzadPage` po pobraniu danych (admin) wysyła `sync` z listą
`pending[].id`; parametr `?oczekujace=1` otwiera od razu okno oczekujących. Kafelek „Sale i Przestrzenie”
(`DashboardPage`) i kafelek „Samorząd” na `/kalendarz-wybor` dostają `badge`.

## 6. PWA i zgoda na powiadomienia

- `manifest.webmanifest`: nazwa „CRA — Centralny Rejestr Administracyjny”, `display: standalone`,
  ikony 192/512 + `apple-touch-icon` 180 z `docs/logo/final/`, kolor motywu `#0B1322`.
- Service worker `firebase-messaging-sw.js` — konfiguracja Firebase przekazywana w parametrach URL
  rejestracji (pliki z `public/` nie przechodzą przez Vite), obsługa `notificationclick` → otwiera `url`.
- Klucz VAPID z konsoli Firebase (Cloud Messaging → Web Push certificates) → `VITE_FIREBASE_VAPID_KEY`.
- Zgoda wyłącznie po kliknięciu „Włącz powiadomienia” w dzwonku (wymóg iOS: gest użytkownika).
  Na iPhonie bez instalacji dzwonek pokazuje instrukcję „Udostępnij → Do ekranu początkowego”.
- Dzwonek i liczniki w etapie 1 widzą tylko użytkownicy zarządzający modułem (`canManage`).

## 7. Bezpieczeństwo

- `NOTIFY_SECRET` w env Vercela i we Właściwościach skryptu Apps Script — nie w kodzie.
- Wywołania z CRA: weryfikacja ID tokena (firebase-admin) + rola z `authorized_users` + `canManage`.
- Reguły Firestore (do wklejenia w konsoli — reguł nie ma w repo):
  `notifications` — odczyt tylko dla użytkowników z rolą zarządzającą modułem, zapis tylko serwer;
  `push_tokens` — klient nie ma dostępu (wszystko przez `/api/push-token`).
- Treści pushy nie zawierają danych osobowych poza nazwą organizacji i tytułem wydarzenia.
- **Poza zakresem, ale odnotowane:** `api/approve-request.js` nie weryfikuje wywołującego — osobna poprawka
  (może od razu użyć `api/_auth.js`).

## 8. Obsługa błędów

- Błąd powiadomienia nigdy nie blokuje złożenia/rozpatrzenia wniosku (`try/catch` w Apps Script,
  `muteHttpExceptions`; front nie czeka na powodzenie `sync`).
- Tokeny odrzucone przez FCM (`registration-token-not-registered`) są kasowane przy wysyłce.
- Push może nie dojść — licznik i dzwonek i tak pokazują sprawę; rozjazdy naprawia `sync`.
- `/api/notify` odpowiada 401/403 przy złym sekrecie/roli, 400 przy złych danych.

## 9. Testy

- Vitest (logika czysta w `src/notifications/`): budowa treści pushy z wniosku, wybór ról/odbiorców
  dla modułu, wyliczenie `sync` (co zamknąć, co utworzyć), kwalifikacja do przypomnienia 48 h,
  idempotencja `created`.
- `canManage(role, 'sale')` w `roles.test.js`.
- Checklista ręczna: Android/Chrome i iPhone (PWA na ekranie głównym) — złóż wniosek → push + licznik +1;
  zatwierdź → licznik −1 + mail do wnioskodawcy; odrzuć → mail; sprawa ręcznie usunięta z arkusza →
  zniknie po wejściu na stronę sal; zmiana roli → push przestaje przychodzić.

## 10. Wdrożenie i kolejne etapy

Etap 1 (Sale), kolejność: (1) PWA + logo, (2) `/api/notify` + Firestore + reguły, (3) liczniki + dzwonek +
„Włącz powiadomienia”, (4) skrypt sal, (5) cron 48 h.

Konfiguracja po stronie użytkownika: zmienne Vercel `NOTIFY_SECRET`, `CRON_SECRET`,
`VITE_FIREBASE_VAPID_KEY` (firebase-admin już skonfigurowany), Właściwość skryptu `NOTIFY_SECRET`,
reguły Firestore, wdrożenie skryptu sal jako „Nowa wersja”.

Kolejne etapy (ten sam mechanizm, nowy wpis w mapie modułów + linijki w źródle):
sprzęt (`nowaRezerwacja` / `updateRezerwacjaStatus`; zastąpi mail z 2026-10-11 pushem lub uzupełni) →
lista dostępowa (Firestore `access_submissions`) → wnioski o dostęp do CRA i helpdesk (Firestore) →
standy i plakaty (rola `promocja`) → przypomnienia o terminach zwrotu sprzętu.

## 11. Poza zakresem etapu 1

Push dla wnioskodawców (status widoczny w „Moje wnioski” + mail), ustawienia „wycisz moduł”,
statystyki czasu reakcji, natywne aplikacje mobilne.
