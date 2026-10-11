# Powiadomienia CRA — etap 1 (Sale) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin dostaje push na telefon i licznik na kafelku „Sale i Przestrzenie”, gdy wpłynie wniosek o salę; wnioskodawca dostaje mail o decyzji — na wspólnym mechanizmie, do którego później podłączymy resztę modułów.

**Architecture:** Źródła (skrypt Apps Script sal, strona sal w CRA) wysyłają zdarzenia `created` / `resolved` / `sync` do `POST /api/notify` (Vercel). Endpoint trzyma stan spraw w Firestore `notifications` i wysyła push przez FCM do urządzeń z `push_tokens` należących do ról zarządzających modułem. CRA (PWA) subskrybuje `notifications` → liczniki i dzwonek; Vercel Cron raz dziennie przypomina o sprawach starszych niż 48 h.

**Tech Stack:** React 18 + Vite 8, Firebase JS SDK 12 (Firestore, Auth, Messaging), firebase-admin 13 (Vercel Functions, ESM), Google Apps Script, Vitest 2.

**Spec:** `docs/superpowers/specs/2026-10-11-powiadomienia-design.md`

## Global Constraints

- Cały tekst widoczny dla użytkownika (UI, push, maile, komunikaty błędów API) — po polsku.
- Błąd powiadomień nigdy nie blokuje złożenia ani rozpatrzenia wniosku (`try/catch`, `muteHttpExceptions`, front nie czeka na `sync`).
- Push do adminów tylko dla zdarzeń wymagających działania: nowy wniosek i przypomnienie > 48 h. `resolved` i `sync` nie wysyłają pushy.
- Odbiorcy wyznaczani w chwili wysyłki: `MODULE_MANAGERS.sale = [admin]` → `authorized_users` → `push_tokens`.
- Treść pushy: tylko sala, organizacja, tytuł wydarzenia, data, godziny — bez e-maili i nazwisk.
- Skrypt sal: bez przebudowy — dochodzą funkcje `powiadomCRA`, `mailDoWnioskodawcy`, `testPowiadomCRA`, `esc` i po kilka linijek w `submitBooking` / `approveBooking` / `rejectBooking`.
- `firebase-admin` ≥ 13 (stare `sendMulticast` korzysta z wyłączonego przez Google batch API FCM).
- Sekrety (`NOTIFY_SECRET`, `CRON_SECRET`) tylko w env Vercela / Właściwościach skryptu — nigdy w repo.
- Testy: `npx vitest run` (środowisko `node`, pliki `src/**/*.test.{js,jsx}`); build: `npx vite build`.
- Commity po polsku w stylu repo (`feat:`, `fix:`, `docs:`), zakończone linią `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Odstępstwa od specu (świadome):**
- Reguła odczytu `notifications`: każdy zalogowany (nie tylko zarządzający). Reguły Firestore nie mogą sprawdzić roli, bo `authorized_users` ma losowe ID dokumentów (nie `uid`); treść spraw i tak jest widoczna wszystkim w kalendarzu sal (wnioski oczekujące są tam pokazywane). UI filtruje po `canManage`.
- Zdarzenie `sync` przyjmuje tylko `items[]` (pełną listę oczekujących) — `openRefIds` z specu wynika z niej, osobne pole jest zbędne.

## Review Focus

- Skrypt sal wyśle `created` dwa razy dla tego samego wniosku (ponowienie) → drugi push nie wychodzi, licznik się nie podwaja. (Task 1: `shouldPushOnCreate`)
- Wniosek usunięty lub zmieniony ręcznie w arkuszu → licznik spada przy najbliższym wejściu admina na stronę sal. (Task 1: `planSync`)
- Admin zdegradowany do `member` z zarejestrowanym telefonem → przestaje dostawać push od razu. (Task 1: `pickRecipientEmails`)
- Data/godzina z arkusza w innym formacie (`14.10.2026`, ISO z `T`, puste) → push bez „undefined”/„NaN”. (Task 1: `buildContent`)
- iPhone bez CRA na ekranie głównym → dzwonek pokazuje instrukcję instalacji zamiast cichego błędu. (Task 1: `pushSupportState`)

---

## File Structure

| Plik | Status | Odpowiedzialność |
|---|---|---|
| `src/data/roles.js` | modyfikacja | moduł `sale` + `rolesForModule()` |
| `src/notifications/modules.js` | nowy | metadane modułów (etykieta, url) |
| `src/notifications/content.js` | nowy | treści pushy (wniosek, przypomnienie) |
| `src/notifications/logic.js` | nowy | walidacja zdarzeń, idempotencja, sync, przypomnienia, odbiorcy, sekret, stan wsparcia push |
| `src/notifications/notifications.test.js` | nowy | testy logiki i treści |
| `api/_firebaseAdmin.js` | nowy | leniwa inicjalizacja firebase-admin |
| `api/_auth.js` | nowy | kim jest wywołujący (sekret / ID token + rola) |
| `api/_push.js` | nowy | odbiorcy modułu + wysyłka FCM + sprzątanie tokenów |
| `api/notify.js` | nowy | endpoint zdarzeń |
| `api/push-token.js` | nowy | rejestracja/usuwanie urządzenia |
| `api/cron/reminders.js` | nowy | codzienne przypomnienia |
| `vercel.json` | modyfikacja | cron |
| `public/manifest.webmanifest`, `public/icons/*`, `public/firebase-messaging-sw.js` | nowe | PWA + odbiór push w tle |
| `index.html`, `src/App.jsx`, `src/firebase.js` | modyfikacja | linki PWA, logo na ekranie ładowania, eksport `app`/`firebaseConfig` |
| `src/notifications/client.js` | nowy | wywołania API z tokenem, włączanie push |
| `src/hooks/useNotifications.js` | nowy | subskrypcja liczników i ostatnich zdarzeń |
| `src/components/NotificationBell.jsx` | nowy | dzwonek + włączanie powiadomień |
| `src/pages/DashboardPage.jsx`, `src/pages/CalendarSelectionPage.jsx` | modyfikacja | liczniki na kafelkach, dzwonek |
| `src/pages/CalendarSamorzadPage.jsx` | modyfikacja | `sync`, `?oczekujace=1`, `actor` |
| `docs/apps-script/sale-backend.gs` | nowy | pełny skrypt sal do wklejenia |
| `docs/superpowers/powiadomienia-wdrozenie.md` | nowy | konfiguracja: VAPID, env, sekret, reguły Firestore, wdrożenie skryptu |

---

### Task 1: Rola `sale` i czysta logika powiadomień

**Files:**
- Modify: `src/data/roles.js`
- Modify: `src/data/roles.test.js`
- Create: `src/notifications/modules.js`, `src/notifications/content.js`, `src/notifications/logic.js`
- Test: `src/notifications/notifications.test.js`

**Interfaces:**
- Produces:
  - `rolesForModule(module: string): string[]`, `canManage(role, module): boolean` (istniejąca, teraz przez `rolesForModule`)
  - `MODULE_META: { sale: { label: string, url: string } }`, `isKnownModule(m): boolean`
  - `buildContent(module, data: {room, org, title, date, start, end}): { title, body, url }`
  - `buildReminder(module, count: number): { title, body, url }`
  - `formatDayMonth(raw): string`, `formatHour(raw): string`
  - `notificationId(module, refId): string` → `"sale_42"`
  - `validateEvent(body): string | null` (komunikat błędu albo `null`)
  - `shouldPushOnCreate(existing: object | null): boolean`
  - `planSync(openRefIds: string[], items: {refId, data}[]): { resolve: string[], create: {refId, data}[] }`
  - `needsReminder({status, createdAtMs, remindedAtMs}, nowMs): boolean`
  - `countOpenByModule(docs: {module, status}[], modules: string[]): Record<string, number>`
  - `pickRecipientEmails(users: {email, role}[], roles: string[]): string[]`
  - `secretMatches(provided, expected): boolean`
  - `pushSupportState({isIos, isStandalone, hasNotification, hasServiceWorker, permission}): 'ios-install'|'unsupported'|'denied'|'granted'|'default'`
  - `chunk(arr, size): any[][]`

- [ ] **Step 1: Napisz testy ról (failing)**

Dopisz na końcu `describe` w `src/data/roles.test.js` (i dodaj `rolesForModule` do importu):

```js
import { canManage, ROLES, rolesForModule } from './roles';
```

```js
  it('sale: tylko admin', () => {
    expect(canManage(ROLES.ADMIN, 'sale')).toBe(true);
    expect(canManage(ROLES.LOGITECH, 'sale')).toBe(false);
    expect(canManage(ROLES.PROMOCJA, 'sale')).toBe(false);
  });
  it('rolesForModule zwraca role modułu, dla nieznanego tylko admin', () => {
    expect(rolesForModule('sale')).toEqual(['admin']);
    expect(rolesForModule('equipment')).toEqual(['admin', 'logitech']);
    expect(rolesForModule('nieznany')).toEqual(['admin']);
  });
```

- [ ] **Step 2: Napisz testy logiki (failing)**

Utwórz `src/notifications/notifications.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildContent, buildReminder, formatDayMonth, formatHour } from './content';
import {
  notificationId, validateEvent, shouldPushOnCreate, planSync, needsReminder,
  countOpenByModule, pickRecipientEmails, secretMatches, pushSupportState, chunk,
} from './logic';

const H = 3600 * 1000;

describe('treści powiadomień — sale', () => {
  it('pełny wniosek', () => {
    expect(buildContent('sale', { room: '110 L', org: 'Koło X', title: 'Rekrutacja', date: '2026-10-14', start: '18:00', end: '20:00' }))
      .toEqual({ title: 'Nowy wniosek o salę · 110 L', body: 'Koło X — Rekrutacja, 14.10, 18:00–20:00', url: '/kalendarz/samorzad?oczekujace=1' });
  });
  it('nietypowe formaty daty i godzin bez "undefined"/"NaN"', () => {
    const c = buildContent('sale', { room: '106 L', org: 'Koło X', title: 'A', date: '14.10.2026', start: '1899-12-30T18:00:00.000Z', end: '20:00:00' });
    expect(c.body).toBe('Koło X — A, 14.10, 18:00–20:00');
    const empty = buildContent('sale', {});
    expect(empty.title).toBe('Nowy wniosek o salę');
    expect(empty.body).toBe('Wniosek bez tytułu');
    expect(JSON.stringify(empty)).not.toMatch(/undefined|NaN|null/);
  });
  it('formatDayMonth / formatHour', () => {
    expect(formatDayMonth('2026-01-05')).toBe('05.01');
    expect(formatDayMonth('5.1.2026')).toBe('05.01');
    expect(formatDayMonth('')).toBe('');
    expect(formatHour('9:05')).toBe('09:05');
    expect(formatHour(undefined)).toBe('');
  });
  it('przypomnienie z polską odmianą', () => {
    expect(buildReminder('sale', 1).body).toBe('1 wniosek czeka ponad 2 dni na decyzję');
    expect(buildReminder('sale', 3).body).toBe('3 wnioski czekają ponad 2 dni na decyzję');
    expect(buildReminder('sale', 5).body).toBe('5 wniosków czeka ponad 2 dni na decyzję');
    expect(buildReminder('sale', 12).body).toBe('12 wniosków czeka ponad 2 dni na decyzję');
    expect(buildReminder('sale', 22).body).toBe('22 wnioski czekają ponad 2 dni na decyzję');
    expect(buildReminder('sale', 2).title).toBe('Sale i Przestrzenie: przypomnienie');
  });
});

describe('logika zdarzeń', () => {
  it('notificationId', () => expect(notificationId('sale', '42')).toBe('sale_42'));
  it('validateEvent', () => {
    expect(validateEvent({ event: 'created', module: 'sale', refId: 42, data: {} })).toBeNull();
    expect(validateEvent({ event: 'resolved', module: 'sale', refId: '7', resolution: 'approved' })).toBeNull();
    expect(validateEvent({ event: 'sync', module: 'sale', items: [] })).toBeNull();
    expect(validateEvent(null)).toMatch(/Brak/);
    expect(validateEvent({ event: 'x', module: 'sale' })).toMatch(/typ/);
    expect(validateEvent({ event: 'created', module: 'kosmos', refId: 1 })).toMatch(/moduł/);
    expect(validateEvent({ event: 'created', module: 'sale', refId: undefined })).toMatch(/refId/);
    expect(validateEvent({ event: 'resolved', module: 'sale', refId: 1, resolution: 'maybe' })).toMatch(/rozstrzygnięcie/);
    expect(validateEvent({ event: 'sync', module: 'sale' })).toMatch(/items/);
  });
  it('ponowny created dla otwartej sprawy nie wysyła drugiego pushu', () => {
    expect(shouldPushOnCreate(null)).toBe(true);
    expect(shouldPushOnCreate({ status: 'open' })).toBe(false);
    expect(shouldPushOnCreate({ status: 'resolved' })).toBe(true);
  });
  it('planSync: zamyka sprawy spoza arkusza, dopisuje brakujące', () => {
    const items = [{ refId: '1', data: {} }, { refId: 3, data: {} }];
    expect(planSync(['1', '2'], items)).toEqual({ resolve: ['2'], create: [{ refId: 3, data: {} }] });
    expect(planSync([], [])).toEqual({ resolve: [], create: [] });
  });
  it('needsReminder: > 48 h i nie częściej niż co 24 h', () => {
    const now = 1_000 * H;
    expect(needsReminder({ status: 'open', createdAtMs: now - 49 * H, remindedAtMs: 0 }, now)).toBe(true);
    expect(needsReminder({ status: 'open', createdAtMs: now - 47 * H, remindedAtMs: 0 }, now)).toBe(false);
    expect(needsReminder({ status: 'open', createdAtMs: now - 72 * H, remindedAtMs: now - 23 * H }, now)).toBe(false);
    expect(needsReminder({ status: 'open', createdAtMs: now - 72 * H, remindedAtMs: now - 25 * H }, now)).toBe(true);
    expect(needsReminder({ status: 'resolved', createdAtMs: now - 99 * H }, now)).toBe(false);
    expect(needsReminder({ status: 'open', createdAtMs: 0 }, now)).toBe(false);
  });
  it('countOpenByModule liczy tylko otwarte z podanych modułów', () => {
    const docs = [{ module: 'sale', status: 'open' }, { module: 'sale', status: 'resolved' }, { module: 'equipment', status: 'open' }];
    expect(countOpenByModule(docs, ['sale'])).toEqual({ sale: 1 });
  });
  it('pickRecipientEmails: tylko aktualne role, bez duplikatów, małymi literami', () => {
    const users = [
      { email: 'A@samorzad.ue.wroc.pl', role: 'admin' },
      { email: 'a@samorzad.ue.wroc.pl', role: 'admin' },
      { email: 'b@samorzad.ue.wroc.pl', role: 'member' },
      { email: '', role: 'admin' },
    ];
    expect(pickRecipientEmails(users, ['admin'])).toEqual(['a@samorzad.ue.wroc.pl']);
  });
  it('secretMatches', () => {
    expect(secretMatches('abc123', 'abc123')).toBe(true);
    expect(secretMatches('abc124', 'abc123')).toBe(false);
    expect(secretMatches('abc', '')).toBe(false);
    expect(secretMatches(undefined, 'abc')).toBe(false);
  });
  it('pushSupportState: iPhone bez instalacji dostaje instrukcję', () => {
    const base = { isIos: false, isStandalone: false, hasNotification: true, hasServiceWorker: true, permission: 'default' };
    expect(pushSupportState({ ...base, isIos: true })).toBe('ios-install');
    expect(pushSupportState({ ...base, isIos: true, isStandalone: true })).toBe('default');
    expect(pushSupportState({ ...base, hasServiceWorker: false })).toBe('unsupported');
    expect(pushSupportState({ ...base, permission: 'denied' })).toBe('denied');
    expect(pushSupportState({ ...base, permission: 'granted' })).toBe('granted');
  });
  it('chunk', () => expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]));
});
```

- [ ] **Step 3: Uruchom testy — mają nie przejść**

Run: `npx vitest run src/notifications src/data/roles.test.js`
Expected: FAIL — `Failed to resolve import "./content"` oraz `rolesForModule is not a function`.

- [ ] **Step 4: Zaimplementuj role**

W `src/data/roles.js` zastąp blok `MODULE_MANAGERS` i `canManage`:

```js
// Które role zarządzają danym modułem (admin zawsze)
export const MODULE_MANAGERS = {
  equipment: [ADMIN, LOGITECH],
  archive: [ADMIN, LOGITECH],
  map: [ADMIN, PROMOCJA],
  stands: [ADMIN, PROMOCJA],
  sale: [ADMIN],
};

export const rolesForModule = (module) => MODULE_MANAGERS[module] ?? [ADMIN];

export const canManage = (role, module) => rolesForModule(module).includes(role);
```

- [ ] **Step 5: Zaimplementuj `src/notifications/modules.js`**

```js
// Moduły objęte powiadomieniami. Kolejne etapy dopisują tu wpis + role w src/data/roles.js.
export const MODULE_META = {
  sale: { label: 'Sale i Przestrzenie', url: '/kalendarz/samorzad?oczekujace=1' },
};

export const isKnownModule = (m) => Object.prototype.hasOwnProperty.call(MODULE_META, m);
```

- [ ] **Step 6: Zaimplementuj `src/notifications/content.js`**

```js
import { MODULE_META } from './modules.js';

const clean = (v) => String(v ?? '').trim();

// "2026-10-14" | "14.10.2026" | "5.1" → "14.10" / "05.01"; inne formaty bez zmian
export function formatDayMonth(raw) {
  const s = clean(raw);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}`;
  m = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.\d{2,4})?$/);
  if (m) return `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}`;
  return s;
}

// "18:00" | "9:05" | "18:00:00" | "1899-12-30T18:00:00.000Z" → "HH:MM"
export function formatHour(raw) {
  let s = clean(raw);
  if (s.includes('T')) s = s.split('T')[1];
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : s;
}

export function buildContent(module, data = {}) {
  const meta = MODULE_META[module];
  if (module !== 'sale' || !meta) throw new Error(`Nieznany moduł: ${module}`);
  const room = clean(data.room);
  const who = [clean(data.org), clean(data.title)].filter(Boolean).join(' — ');
  const day = formatDayMonth(data.date);
  const start = formatHour(data.start);
  const end = formatHour(data.end);
  const parts = [who || 'Wniosek bez tytułu'];
  if (day) parts.push(day);
  if (start && end) parts.push(`${start}–${end}`);
  return {
    title: room ? `Nowy wniosek o salę · ${room}` : 'Nowy wniosek o salę',
    body: parts.join(', '),
    url: meta.url,
  };
}

function wnioskiCzekaja(n) {
  if (n === 1) return 'wniosek czeka';
  const d = n % 10, h = n % 100;
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return 'wnioski czekają';
  return 'wniosków czeka';
}

export function buildReminder(module, count) {
  const meta = MODULE_META[module];
  return {
    title: `${meta.label}: przypomnienie`,
    body: `${count} ${wnioskiCzekaja(count)} ponad 2 dni na decyzję`,
    url: meta.url,
  };
}
```

- [ ] **Step 7: Zaimplementuj `src/notifications/logic.js`**

```js
import { isKnownModule } from './modules.js';

export const REMIND_AFTER_MS = 48 * 3600 * 1000;
export const REMIND_EVERY_MS = 24 * 3600 * 1000;

export const notificationId = (module, refId) => `${module}_${refId}`;

// Zwraca komunikat błędu (PL) albo null, gdy zdarzenie jest poprawne.
export function validateEvent(body) {
  if (!body || typeof body !== 'object') return 'Brak danych zdarzenia';
  const { event, module } = body;
  if (!['created', 'resolved', 'sync'].includes(event)) return 'Nieznany typ zdarzenia';
  if (!isKnownModule(module)) return 'Nieznany moduł';
  if (event === 'sync') return Array.isArray(body.items) ? null : 'Zdarzenie sync wymaga listy items';
  const refId = String(body.refId ?? '').trim();
  if (!refId || refId === 'undefined' || refId === 'null') return 'Brak refId';
  if (event === 'resolved' && !['approved', 'rejected', 'auto'].includes(body.resolution)) return 'Nieznane rozstrzygnięcie';
  return null;
}

// Ponowne `created` dla sprawy, która już jest otwarta, nie wysyła drugiego pushu.
export const shouldPushOnCreate = (existing) => !existing || existing.status !== 'open';

// Arkusz jest źródłem prawdy: otwarte sprawy spoza listy → zamknąć; pozycje z listy bez otwartej sprawy → utworzyć (bez pushu).
export function planSync(openRefIds, items) {
  const pending = new Set(items.map((i) => String(i.refId)));
  const open = new Set(openRefIds.map(String));
  return {
    resolve: [...open].filter((id) => !pending.has(id)),
    create: items.filter((i) => !open.has(String(i.refId))),
  };
}

export function needsReminder(doc, now) {
  if (doc.status !== 'open' || !doc.createdAtMs) return false;
  if (now - doc.createdAtMs < REMIND_AFTER_MS) return false;
  return !doc.remindedAtMs || now - doc.remindedAtMs >= REMIND_EVERY_MS;
}

export function countOpenByModule(docs, modules) {
  const counts = Object.fromEntries(modules.map((m) => [m, 0]));
  for (const d of docs) if (d.status === 'open' && d.module in counts) counts[d.module] += 1;
  return counts;
}

export function pickRecipientEmails(users, roles) {
  const allowed = new Set(roles);
  return [...new Set(
    users.filter((u) => allowed.has(u.role) && u.email).map((u) => String(u.email).trim().toLowerCase()),
  )];
}

// Porównanie w stałym czasie (bez node:crypto, żeby działało też w testach/przeglądarce).
export function secretMatches(provided, expected) {
  if (!expected || typeof provided !== 'string' || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function pushSupportState({ isIos, isStandalone, hasNotification, hasServiceWorker, permission }) {
  if (isIos && !isStandalone) return 'ios-install';
  if (!hasNotification || !hasServiceWorker) return 'unsupported';
  if (permission === 'denied') return 'denied';
  if (permission === 'granted') return 'granted';
  return 'default';
}

export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
```

- [ ] **Step 8: Uruchom testy — mają przejść**

Run: `npx vitest run`
Expected: PASS — wszystkie pliki, w tym `notifications.test.js` i `roles.test.js` (wcześniejsze 42 testy nadal zielone).

- [ ] **Step 9: Commit**

```bash
git add src/data/roles.js src/data/roles.test.js src/notifications
git commit -m "feat(powiadomienia): moduł sale w rolach + czysta logika i treści powiadomień

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Fundament serwera — firebase-admin 13, autoryzacja, rejestracja urządzeń

**Files:**
- Modify: `package.json`, `package-lock.json` (aktualizacja `firebase-admin`)
- Create: `api/_firebaseAdmin.js`, `api/_auth.js`, `api/push-token.js`

**Interfaces:**
- Consumes: `secretMatches`, `canManage` (Task 1)
- Produces:
  - `adminDb(): Firestore`, `adminAuth(): Auth`, `adminMessaging(): Messaging`, `FieldValue`
  - `getCaller(req): Promise<{kind:'system'} | {kind:'user', uid, email, role} | null>`
  - `callerCanManage(caller, module): boolean`
  - `POST/DELETE /api/push-token` body `{ token }` → `{ ok: true }`

- [ ] **Step 1: Zaktualizuj firebase-admin**

Run: `npm install firebase-admin@^13`
Expected: `package.json` → `"firebase-admin": "^13.x.x"`.

- [ ] **Step 2: Sprawdź, że istniejące endpointy nadal się importują**

Run: `node --input-type=module -e "for (const f of ['approve-request','reject-request','request-access']) { await import('./api/'+f+'.js').then(()=>console.log('ok',f)).catch(e=>console.log('IMPORT',f,e.message)); }"`
Expected: `ok` dla każdego pliku albo wyłącznie błąd poświadczeń (`Failed to parse private key` / `Service account object must contain…`) — brak lokalnych poprawnych kluczy jest akceptowalny; **nie** może być błędów typu `does not provide an export named`.

- [ ] **Step 3: Utwórz `api/_firebaseAdmin.js`**

```js
// Jedna, leniwa inicjalizacja firebase-admin dla nowych endpointów.
// Leniwa = import pliku nie wymaga kluczy (pozwala na test importu lokalnie).
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

function app() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getApps()[0];
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
export const adminMessaging = () => getMessaging(app());
export { FieldValue };
```

- [ ] **Step 4: Utwórz `api/_auth.js`**

```js
import { adminAuth, adminDb } from './_firebaseAdmin.js';
import { secretMatches } from '../src/notifications/logic.js';
import { canManage } from '../src/data/roles.js';

// Apps Script: nagłówek X-Notify-Secret. CRA: Authorization: Bearer <Firebase ID token>.
export async function getCaller(req) {
  const secret = req.headers['x-notify-secret'];
  if (secret) {
    return secretMatches(String(secret), process.env.NOTIFY_SECRET || '') ? { kind: 'system' } : null;
  }
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(header.slice(7));
    const email = String(decoded.email || '').toLowerCase();
    if (!email) return null;
    const snap = await adminDb().collection('authorized_users').where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return { kind: 'user', uid: decoded.uid, email, role: snap.docs[0].data().role };
  } catch {
    return null;
  }
}

export const callerCanManage = (caller, module) =>
  caller?.kind === 'system' || canManage(caller?.role, module);
```

- [ ] **Step 5: Utwórz `api/push-token.js`**

```js
import { adminDb, FieldValue } from './_firebaseAdmin.js';
import { getCaller } from './_auth.js';

// Rejestracja (POST) / usunięcie (DELETE) urządzenia zalogowanego użytkownika.
export default async function handler(req, res) {
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).end();
  const caller = await getCaller(req);
  if (!caller || caller.kind !== 'user') return res.status(401).json({ error: 'Brak autoryzacji' });

  const token = String(req.body?.token || '').trim();
  if (token.length < 20 || token.length > 4096 || token.includes('/')) {
    return res.status(400).json({ error: 'Nieprawidłowy token urządzenia' });
  }
  const ref = adminDb().collection('push_tokens').doc(token);

  try {
    if (req.method === 'DELETE') {
      const snap = await ref.get();
      if (snap.exists && snap.data().uid === caller.uid) await ref.delete();
      return res.status(200).json({ ok: true });
    }
    await ref.set({
      uid: caller.uid,
      email: caller.email,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
      lastSeenAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('push-token:', err);
    return res.status(500).json({ error: 'Błąd zapisu urządzenia' });
  }
}
```

- [ ] **Step 6: Test importu nowych plików**

Run: `node --input-type=module -e "for (const f of ['_firebaseAdmin','_auth','push-token']) { await import('./api/'+f+'.js'); console.log('ok', f); }"`
Expected: `ok _firebaseAdmin`, `ok _auth`, `ok push-token` (inicjalizacja jest leniwa, więc brak kluczy nie przeszkadza).

- [ ] **Step 7: Testy i build bez regresji**

Run: `npx vitest run && npx vite build`
Expected: wszystkie testy PASS, `✓ built`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json api/_firebaseAdmin.js api/_auth.js api/push-token.js
git commit -m "feat(powiadomienia): firebase-admin 13, autoryzacja wywołań i rejestracja urządzeń

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Endpoint zdarzeń `/api/notify` + wysyłka push

**Files:**
- Create: `api/_push.js`, `api/notify.js`

**Interfaces:**
- Consumes: `adminDb`, `adminMessaging`, `FieldValue`, `getCaller`, `callerCanManage` (Task 2); `rolesForModule`, `validateEvent`, `notificationId`, `shouldPushOnCreate`, `planSync`, `pickRecipientEmails`, `chunk`, `buildContent` (Task 1)
- Produces:
  - `pushToModule(module, {title, body, url}): Promise<number>` (liczba urządzeń, do których wysłano)
  - `POST /api/notify`:
    - `{event:'created', module, refId, data:{room, org, title, date, start, end}}` → `{ok, pushed}`
    - `{event:'resolved', module, refId, resolution:'approved'|'rejected', actor?}` → `{ok, pushed:0}`
    - `{event:'sync', module, items:[{refId, data}]}` → `{ok, resolved, created}`
  - Dokument `notifications/{module}_{refId}`: `module, refId, status, title, body, url, createdAt, updatedAt, resolvedAt, resolution, actor, remindedAt`

- [ ] **Step 1: Utwórz `api/_push.js`**

```js
import { adminDb, adminMessaging } from './_firebaseAdmin.js';
import { rolesForModule } from '../src/data/roles.js';
import { pickRecipientEmails, chunk } from '../src/notifications/logic.js';

const appUrl = () => (process.env.APP_URL || 'https://cra-system.vercel.app').replace(/\/$/, '');
const DEAD_TOKEN = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

// Odbiorcy wyznaczani w chwili wysyłki: role modułu → authorized_users → push_tokens.
async function tokensForModule(module) {
  const db = adminDb();
  const roles = rolesForModule(module);
  const users = await db.collection('authorized_users').where('role', 'in', roles).get();
  const emails = pickRecipientEmails(users.docs.map((d) => d.data()), roles);
  const tokens = [];
  for (const part of chunk(emails, 30)) {
    const snap = await db.collection('push_tokens').where('email', 'in', part).get();
    snap.docs.forEach((d) => tokens.push(d.id));
  }
  return tokens;
}

export async function pushToModule(module, { title, body, url }) {
  const tokens = await tokensForModule(module);
  if (!tokens.length) return 0;
  let sent = 0;
  for (const part of chunk(tokens, 500)) {
    const res = await adminMessaging().sendEachForMulticast({
      tokens: part,
      data: { url },
      webpush: {
        notification: { title, body, icon: '/icons/cra-192.png', badge: '/icons/cra-192.png' },
        fcmOptions: { link: appUrl() + url },
      },
    });
    sent += res.successCount;
    const dead = res.responses
      .map((r, i) => (!r.success && DEAD_TOKEN.has(r.error?.code) ? part[i] : null))
      .filter(Boolean);
    await Promise.all(dead.map((t) => adminDb().collection('push_tokens').doc(t).delete()));
  }
  return sent;
}
```

- [ ] **Step 2: Utwórz `api/notify.js`**

```js
import { adminDb, FieldValue } from './_firebaseAdmin.js';
import { getCaller, callerCanManage } from './_auth.js';
import { pushToModule } from './_push.js';
import { validateEvent, notificationId, shouldPushOnCreate, planSync } from '../src/notifications/logic.js';
import { buildContent } from '../src/notifications/content.js';

const FRESH = { resolvedAt: null, resolution: null, actor: null, remindedAt: null };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};
  const error = validateEvent(body);
  if (error) return res.status(400).json({ error });

  const caller = await getCaller(req);
  if (!caller) return res.status(401).json({ error: 'Brak autoryzacji' });
  if (!callerCanManage(caller, body.module)) return res.status(403).json({ error: 'Brak uprawnień do modułu' });

  const db = adminDb();
  const col = db.collection('notifications');
  const now = FieldValue.serverTimestamp();

  try {
    if (body.event === 'created') {
      const refId = String(body.refId);
      const ref = col.doc(notificationId(body.module, refId));
      const content = buildContent(body.module, body.data || {});
      const doPush = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const push = shouldPushOnCreate(snap.exists ? snap.data() : null);
        tx.set(ref, {
          module: body.module, refId, status: 'open', ...content, updatedAt: now,
          ...(push ? { createdAt: now, ...FRESH } : {}),
        }, { merge: true });
        return push;
      });
      const pushed = doPush
        ? await pushToModule(body.module, content).catch((e) => { console.error('push:', e); return 0; })
        : 0;
      return res.status(200).json({ ok: true, pushed });
    }

    if (body.event === 'resolved') {
      const ref = col.doc(notificationId(body.module, String(body.refId)));
      const snap = await ref.get();
      if (snap.exists) {
        await ref.set({
          status: 'resolved', resolution: body.resolution,
          actor: body.actor || caller.email || null, resolvedAt: now, updatedAt: now,
        }, { merge: true });
      }
      return res.status(200).json({ ok: true, pushed: 0 });
    }

    // sync — arkusz jest źródłem prawdy, bez pushy
    const items = body.items.map((i) => ({ refId: String(i.refId), data: i.data || {} }));
    const openSnap = await col.where('module', '==', body.module).where('status', '==', 'open').get();
    const { resolve, create } = planSync(openSnap.docs.map((d) => d.data().refId), items);
    if (resolve.length || create.length) {
      const batch = db.batch();
      resolve.forEach((refId) => batch.set(col.doc(notificationId(body.module, refId)),
        { status: 'resolved', resolution: 'auto', resolvedAt: now, updatedAt: now }, { merge: true }));
      create.forEach((i) => batch.set(col.doc(notificationId(body.module, i.refId)), {
        module: body.module, refId: i.refId, status: 'open', ...buildContent(body.module, i.data),
        createdAt: now, updatedAt: now, ...FRESH,
      }, { merge: true }));
      await batch.commit();
    }
    return res.status(200).json({ ok: true, resolved: resolve.length, created: create.length });
  } catch (err) {
    console.error('notify:', err);
    return res.status(500).json({ error: 'Błąd zapisu powiadomienia' });
  }
}
```

- [ ] **Step 3: Test importu**

Run: `node --input-type=module -e "for (const f of ['_push','notify']) { await import('./api/'+f+'.js'); console.log('ok', f); }"`
Expected: `ok _push`, `ok notify`.

- [ ] **Step 4: Testy bez regresji**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_push.js api/notify.js
git commit -m "feat(powiadomienia): endpoint /api/notify (created/resolved/sync) i wysyłka FCM

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Codzienne przypomnienie (Vercel Cron)

**Files:**
- Create: `api/cron/reminders.js`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `adminDb`, `FieldValue` (Task 2); `pushToModule` (Task 3); `needsReminder`, `buildReminder`, `MODULE_META` (Task 1)
- Produces: `GET /api/cron/reminders` (nagłówek `Authorization: Bearer <CRON_SECRET>`) → `{ ok, summary }`

- [ ] **Step 1: Utwórz `api/cron/reminders.js`**

```js
import { adminDb, FieldValue } from '../_firebaseAdmin.js';
import { pushToModule } from '../_push.js';
import { needsReminder } from '../../src/notifications/logic.js';
import { buildReminder } from '../../src/notifications/content.js';
import { MODULE_META } from '../../src/notifications/modules.js';

const ms = (ts) => (ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0);

// Vercel Cron dołącza nagłówek Authorization: Bearer <CRON_SECRET>, gdy zmienna jest ustawiona.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers['authorization'] !== `Bearer ${secret}`) return res.status(401).end();

  const db = adminDb();
  const now = Date.now();
  const summary = {};
  try {
    for (const module of Object.keys(MODULE_META)) {
      const snap = await db.collection('notifications')
        .where('module', '==', module).where('status', '==', 'open').get();
      const due = snap.docs.filter((d) => {
        const x = d.data();
        return needsReminder({ status: x.status, createdAtMs: ms(x.createdAt), remindedAtMs: ms(x.remindedAt) }, now);
      });
      if (!due.length) { summary[module] = { due: 0, pushed: 0 }; continue; }
      const pushed = await pushToModule(module, buildReminder(module, due.length))
        .catch((e) => { console.error('reminder push:', e); return 0; });
      const batch = db.batch();
      due.forEach((d) => batch.update(d.ref, { remindedAt: FieldValue.serverTimestamp() }));
      await batch.commit();
      summary[module] = { due: due.length, pushed };
    }
    return res.status(200).json({ ok: true, summary });
  } catch (err) {
    console.error('reminders:', err);
    return res.status(500).json({ error: 'Błąd przypomnień' });
  }
}
```

- [ ] **Step 2: Dodaj cron do `vercel.json`**

Plik po zmianie (8:00 czasu polskiego latem = 6:00 UTC):

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 6 * * *" }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

- [ ] **Step 3: Test importu**

Run: `node --input-type=module -e "await import('./api/cron/reminders.js'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add api/cron/reminders.js vercel.json
git commit -m "feat(powiadomienia): codzienne przypomnienie o wnioskach czekających ponad 48 h

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: CRA jako aplikacja (PWA) z nowym logo + service worker

**Files:**
- Create: `public/manifest.webmanifest`, `public/firebase-messaging-sw.js`, `public/icons/` (kopie z `docs/logo/final/`)
- Modify: `index.html`, `src/App.jsx:162`, `src/firebase.js`

**Interfaces:**
- Produces:
  - `export { app, firebaseConfig }` z `src/firebase.js` (obok istniejących `auth, db, loginWithGoogle, logout`)
  - Pliki: `/icons/cra-icon.svg`, `/icons/cra-192.png`, `/icons/cra-512.png`, `/icons/apple-touch-icon.png`, `/icons/favicon-32.png`, `/manifest.webmanifest`, `/firebase-messaging-sw.js` (parametry konfiguracji Firebase w query string)

- [ ] **Step 1: Skopiuj ikony**

```bash
mkdir -p public/icons
cp docs/logo/final/cra-icon.svg public/icons/cra-icon.svg
cp docs/logo/final/cra-icon-192.png public/icons/cra-192.png
cp docs/logo/final/cra-icon-512.png public/icons/cra-512.png
cp docs/logo/final/cra-icon-180.png public/icons/apple-touch-icon.png
cp docs/logo/final/cra-icon-32.png public/icons/favicon-32.png
```

- [ ] **Step 2: Utwórz `public/manifest.webmanifest`**

```json
{
  "name": "CRA — Centralny Rejestr Administracyjny",
  "short_name": "CRA",
  "description": "Centralny Rejestr Administracyjny Samorządu Studentów UEW",
  "lang": "pl",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0B1322",
  "theme_color": "#0B1322",
  "icons": [
    { "src": "/icons/cra-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/cra-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/cra-icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 3: Sprawdź dostępność SDK compat na CDN**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js`
Expected: `200`. Jeśli nie — użyj wersji z `node -p "require('firebase/package.json').version"` i powtórz.

- [ ] **Step 4: Utwórz `public/firebase-messaging-sw.js`**

```js
/* Service worker CRA: odbiór powiadomień push w tle (Firebase Cloud Messaging).
   Konfiguracja Firebase przychodzi w query stringu rejestracji (pliki z public/ nie przechodzą przez Vite).
   Powiadomienia z polem webpush.notification wyświetla SDK; kliknięcie otwiera fcmOptions.link. */
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location.href).searchParams.entries());
firebase.initializeApp(config);
firebase.messaging();
```

- [ ] **Step 5: Zaktualizuj `index.html`**

Zastąp linię `<link rel="icon" type="image/svg+xml" href="/logo.png" />` blokiem:

```html
    <link rel="icon" type="image/svg+xml" href="/icons/cra-icon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0B1322" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="CRA" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

- [ ] **Step 6: Logo na ekranie ładowania (`src/App.jsx`)**

Zastąp linię 162:

```jsx
            <img src="/logo.png" className="w-16 h-16 object-contain" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/1087/1087815.png" }} />
```

na:

```jsx
            <img src="/icons/cra-icon.svg" alt="CRA" className="w-20 h-20 object-contain rounded-2xl" />
```

- [ ] **Step 7: Eksportuj `app` i `firebaseConfig` z `src/firebase.js`**

Zmień ostatnią linię pliku:

```js
export { app, firebaseConfig, auth, db, loginWithGoogle, logout };
```

- [ ] **Step 8: Build i podgląd**

Run: `npx vite build && ls dist/manifest.webmanifest dist/firebase-messaging-sw.js dist/icons`
Expected: `✓ built`, pliki obecne w `dist/`.

- [ ] **Step 9: Commit**

```bash
git add public/manifest.webmanifest public/firebase-messaging-sw.js public/icons index.html src/App.jsx src/firebase.js
git commit -m "feat(pwa): CRA jako aplikacja — manifest, nowe logo, service worker FCM

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Liczniki na kafelkach, dzwonek i włączanie powiadomień

**Files:**
- Create: `src/notifications/client.js`, `src/hooks/useNotifications.js`, `src/components/NotificationBell.jsx`
- Modify: `src/pages/DashboardPage.jsx` (`Card` ok. l. 178, kafelek sal l. 330, nagłówek ok. l. 205), `src/pages/CalendarSelectionPage.jsx` (l. 1–9, kafelek l. 62)

**Interfaces:**
- Consumes: `app`, `firebaseConfig`, `auth`, `db` (Task 5); `MODULE_META`, `countOpenByModule`, `pushSupportState`, `canManage` (Task 1); `/api/notify`, `/api/push-token` (Tasks 2–3)
- Produces:
  - `authedPost(url, payload, method?='POST'): Promise<object>`
  - `postNotify(payload): Promise<object>`
  - `currentPushState(): 'ios-install'|'unsupported'|'denied'|'granted'|'default'`
  - `enablePush(): Promise<{ok:true} | {ok:false, reason:'denied'|'unsupported'|'no-token'}>`
  - `useNotifications(userRole) → { enabled: boolean, counts: Record<module, number>, total: number, recent: object[] }`
  - `<NotificationBell total recent />`
  - `Card` przyjmuje `badge?: number`

- [ ] **Step 1: Utwórz `src/notifications/client.js`**

```js
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, auth, firebaseConfig } from '../firebase';
import { pushSupportState } from './logic';

export async function authedPost(url, payload, method = 'POST') {
  const user = auth.currentUser;
  if (!user) throw new Error('Niezalogowany');
  const idToken = await user.getIdToken();
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const postNotify = (payload) => authedPost('/api/notify', payload);

export function currentPushState() {
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const hasNotification = 'Notification' in window;
  return pushSupportState({
    isIos, isStandalone, hasNotification,
    hasServiceWorker: 'serviceWorker' in navigator,
    permission: hasNotification ? Notification.permission : 'default',
  });
}

// Wywoływać WYŁĄCZNIE z obsługi kliknięcia: iOS wymaga, by requestPermission było pierwszym await w geście.
export async function enablePush() {
  if (!('Notification' in window)) return { ok: false, reason: 'unsupported' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };
  if (!(await isSupported())) return { ok: false, reason: 'unsupported' };
  const params = new URLSearchParams(Object.entries(firebaseConfig).filter(([, v]) => v));
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`);
  const token = await getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) return { ok: false, reason: 'no-token' };
  await authedPost('/api/push-token', { token });
  try { localStorage.setItem('cra_push_token', token); } catch { /* tryb prywatny */ }
  return { ok: true };
}
```

- [ ] **Step 2: Utwórz `src/hooks/useNotifications.js`**

```js
import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { canManage } from '../data/roles';
import { MODULE_META } from '../notifications/modules';
import { countOpenByModule } from '../notifications/logic';

// Liczniki otwartych spraw + ostatnie zdarzenia dla modułów, którymi zarządza użytkownik.
export function useNotifications(userRole) {
  const modules = useMemo(() => Object.keys(MODULE_META).filter((m) => canManage(userRole, m)), [userRole]);
  const key = modules.join(',');
  const [openDocs, setOpenDocs] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!modules.length) { setOpenDocs([]); setRecent([]); return undefined; }
    const col = collection(db, 'notifications');
    const offOpen = onSnapshot(
      query(col, where('status', '==', 'open')),
      (s) => setOpenDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setOpenDocs([]),
    );
    const offRecent = onSnapshot(
      query(col, orderBy('updatedAt', 'desc'), limit(30)),
      (s) => setRecent(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => modules.includes(d.module))),
      () => setRecent([]),
    );
    return () => { offOpen(); offRecent(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => countOpenByModule(openDocs, modules), [openDocs, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { enabled: modules.length > 0, counts, total, recent };
}
```

- [ ] **Step 3: Utwórz `src/components/NotificationBell.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_META } from '../notifications/modules';
import { currentPushState, enablePush } from '../notifications/client';

const RESOLUTION = { approved: 'zatwierdzono', rejected: 'odrzucono', auto: 'zamknięto' };
const when = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const hasLocalToken = () => { try { return Boolean(localStorage.getItem('cra_push_token')); } catch { return false; } };

export default function NotificationBell({ total, recent }) {
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState(() => currentPushState());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleEnable = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await enablePush();
      if (r.ok) setMsg('Powiadomienia włączone na tym urządzeniu.');
      else if (r.reason === 'denied') setMsg('Powiadomienia są zablokowane w ustawieniach przeglądarki.');
      else setMsg('To urządzenie nie obsługuje powiadomień push.');
    } catch {
      setMsg('Nie udało się włączyć powiadomień. Spróbuj ponownie.');
    } finally {
      setPushState(currentPushState()); setBusy(false);
    }
  };

  const enabledHere = pushState === 'granted' && hasLocalToken();

  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Powiadomienia${total ? ` (${total} oczekujących)` : ''}`}
        className="relative w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md border border-white/60 shadow-lg rounded-xl text-xl hover:scale-105 transition-all"
      >
        🔔
        {total > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow">{total}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">Powiadomienia</p>
            {total > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">{total} oczekuje</span>}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {recent.length === 0 && <li className="px-5 py-6 text-sm text-slate-400 text-center">Brak powiadomień</li>}
            {recent.map((n) => (
              <li key={n.id}>
                <Link to={n.url || MODULE_META[n.module]?.url || '/'} onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-black ${n.status === 'open' ? 'text-slate-900' : 'text-slate-400'}`}>{n.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{when(n.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  {n.status === 'resolved' && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">
                      {RESOLUTION[n.resolution] || 'rozpatrzono'}{n.actor ? ` · ${n.actor}` : ''}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-xs">
            {pushState === 'ios-install' && (
              <p className="text-slate-600">Na iPhonie: <b>Udostępnij → Do ekranu początkowego</b>, otwórz CRA z ikony i włącz powiadomienia tutaj.</p>
            )}
            {pushState === 'unsupported' && <p className="text-slate-500">Ta przeglądarka nie obsługuje powiadomień push.</p>}
            {pushState === 'denied' && <p className="text-slate-500">Powiadomienia są zablokowane — odblokuj je w ustawieniach przeglądarki dla tej strony.</p>}
            {(pushState === 'default' || (pushState === 'granted' && !enabledHere)) && (
              <button onClick={handleEnable} disabled={busy} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50">
                {busy ? 'Włączanie…' : 'Włącz powiadomienia na tym urządzeniu'}
              </button>
            )}
            {enabledHere && <p className="text-emerald-700 font-bold">✓ Powiadomienia włączone na tym urządzeniu</p>}
            {msg && <p className="mt-2 text-slate-600">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Dashboard — `badge` w `Card`, licznik sal, dzwonek**

W `src/pages/DashboardPage.jsx`:

Importy (obok istniejących):

```jsx
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from '../components/NotificationBell';
```

Po `const isAdmin = userRole === 'admin';`:

```jsx
  const { enabled: notificationsEnabled, counts, total, recent } = useNotifications(userRole);
```

Zmień sygnaturę i początek `Card`:

```jsx
  const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText, badge = 0 }) => (
    <Link to={to} className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 isolate [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)]">
      {badge > 0 && (
        <span className="absolute top-5 right-5 z-20 min-w-[2rem] h-8 px-2 rounded-full bg-rose-500 text-white text-sm font-black flex items-center justify-center shadow-lg ring-4 ring-white/30" aria-label={`${badge} oczekujących`}>
          {badge}
        </span>
      )}
```

(reszta `Card` bez zmian). Kafelek sal (l. 330):

```jsx
          <Card to="/kalendarz-wybor" icon="📅" title="Sale i Przestrzenie" subtitle="Rezerwacje samorządowe" colorFrom="from-emerald-500" colorTo="to-teal-700" buttonText="Wybierz Tryb" badge={counts.sale || 0} />
```

Dzwonek — pierwsza linia wewnątrz zewnętrznego `<div className="min-h-screen flex flex-col …">` (przed `{/* TŁO */}`):

```jsx
      {notificationsEnabled && <NotificationBell total={total} recent={recent} />}
```

- [ ] **Step 5: Licznik na kafelku „Dla Samorządu Studentów”**

W `src/pages/CalendarSelectionPage.jsx`: import `import { useNotifications } from '../hooks/useNotifications';`, pod `const isAdmin = …`:

```jsx
  const { counts } = useNotifications(userRole);
```

W `<Link to="/kalendarz/samorzad" className="group bg-white …">` dodaj `relative` do `className` i jako pierwsze dziecko:

```jsx
            {counts.sale > 0 && (
              <span className="absolute top-5 right-5 min-w-[2rem] h-8 px-2 rounded-full bg-rose-500 text-white text-sm font-black flex items-center justify-center shadow-lg">{counts.sale}</span>
            )}
```

- [ ] **Step 6: Testy i build**

Run: `npx vitest run && npx vite build`
Expected: PASS, `✓ built`.

- [ ] **Step 7: Sprawdzenie w przeglądarce**

Run: `npx vite --port 5173` i zaloguj się kontem admina.
Expected: na dashboardzie widać 🔔 w prawym górnym rogu; otwarcie pokazuje „Brak powiadomień” i przycisk „Włącz powiadomienia na tym urządzeniu”; konto `member` nie widzi dzwonka. (Liczniki pojawią się po Task 7/8.)

- [ ] **Step 8: Commit**

```bash
git add src/notifications/client.js src/hooks/useNotifications.js src/components/NotificationBell.jsx src/pages/DashboardPage.jsx src/pages/CalendarSelectionPage.jsx
git commit -m "feat(powiadomienia): liczniki na kafelkach, dzwonek i włączanie push

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Strona sal — samonaprawa liczników, link do oczekujących, kto rozpatrzył

**Files:**
- Modify: `src/pages/CalendarSamorzadPage.jsx` (importy l. 1–4, `fetchData` l. 57–68, `handleApprove` l. 168, `handleReject` l. 189)

**Interfaces:**
- Consumes: `postNotify` (Task 6); zdarzenie `sync` (Task 3)
- Produces: payloady `approveBooking` / `rejectBooking` z polem `actor` (e-mail admina) — czyta je skrypt sal (Task 8)

- [ ] **Step 1: Importy**

```jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SAMORZAD_ROOMS, ROOMS } from '../data/rooms';
import { postNotify } from '../notifications/client';
```

- [ ] **Step 2: Helper `sync` nad komponentem (po `formatTime`)**

```jsx
// Arkusz wniosków jest źródłem prawdy dla liczników powiadomień (zamyka/odtwarza sprawy bez pushy).
const syncPendingNotifications = (pending) =>
  postNotify({
    event: 'sync',
    module: 'sale',
    items: pending.map((p) => ({
      refId: String(p.id),
      data: { room: p.room, org: p.org, title: p.title, date: p.date, start: p.start, end: p.end },
    })),
  }).catch((err) => console.warn('Synchronizacja powiadomień nie powiodła się:', err.message));
```

- [ ] **Step 3: `fetchData` + parametr `?oczekujace=1`**

Pod `const isAdmin = userRole === 'admin';`:

```jsx
  const [searchParams] = useSearchParams();
```

W `fetchData` zamień `if (!data.error) setCalendarData(data);` na:

```jsx
      if (!data.error) {
        setCalendarData(data);
        if (isAdmin) syncPendingNotifications(data.pending || []);
      }
```

Pod istniejącym `useEffect(() => { fetchData(); }, []);`:

```jsx
  useEffect(() => {
    if (isAdmin && searchParams.get('oczekujace')) setIsPendingModalOpen(true);
  }, [isAdmin, searchParams]);
```

- [ ] **Step 4: `actor` w zatwierdzaniu i odrzucaniu**

`handleApprove` — w obiekcie `JSON.stringify({ action: "approveBooking", … })` dodaj na końcu `, actor: userEmail || ""`.
`handleReject` — zamień body na:

```jsx
        body: JSON.stringify({ action: "rejectBooking", rowId: req.id, actor: userEmail || "" })
```

- [ ] **Step 5: Testy i build**

Run: `npx vitest run && npx vite build`
Expected: PASS, `✓ built`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CalendarSamorzadPage.jsx
git commit -m "feat(powiadomienia): sale — samonaprawa liczników, link do oczekujących, actor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Skrypt sal (Apps Script) i instrukcja wdrożenia

**Files:**
- Create: `docs/apps-script/sale-backend.gs` (pełny skrypt do wklejenia)
- Create: `docs/superpowers/powiadomienia-wdrozenie.md`

**Interfaces:**
- Consumes: `POST /api/notify` z nagłówkiem `X-Notify-Secret` (Task 3); pole `actor` z frontu (Task 7)
- Produces: `submitBooking` zwraca `{ success: true, rowId }`; zdarzenia `created` / `resolved`; maile do wnioskodawców

- [ ] **Step 1: Utwórz `docs/apps-script/sale-backend.gs`**

Treść = produkcyjny skrypt sal (wklejony przez użytkownika 2026-10-11) z dopisanymi elementami. Cały plik:

```js
// =============================================================================
// BACKEND SAL CRA (Google Apps Script) — kopia referencyjna z repo.
// Wdrożenie: edytor Apps Script → Ctrl+A → wklej → Ctrl+S → uruchom raz testPowiadomCRA
// (zgoda na UrlFetch i MailApp) → Wdróż → Zarządzaj wdrożeniami → ołówek → „Nowa wersja”.
// Zmiany 2026-10-11: powiadomienia CRA (powiadomCRA), maile do wnioskodawców
// (mailDoWnioskodawcy), submitBooking zwraca rowId.
// Sekret: Ustawienia projektu → Właściwości skryptu → NOTIFY_SECRET (ta sama wartość co w Vercelu).
// =============================================================================

// === KONFIGURACJA ===
// Wklej tutaj ID swojego drugiego pliku: KRRPPD SSUEW (WNIOSKI)
var INBOX_SHEET_ID = '1TspT6A7mV1NdHuiFB8-2_R8mYH9LGYldWNcIifYV0zc'; 
var CRA_NOTIFY_URL = 'https://cra-system.vercel.app/api/notify';

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); 
  
  var sheetSale = ss.getSheetByName('Sale') || ss.getSheets()[0];
  var dataSale = getSheetData(sheetSale);
  
  var sheetPrzedluzenia = ss.getSheetByName('Przedluzenia');
  var dataPrzedluzenia = getSheetData(sheetPrzedluzenia);
  
  var pending = [];
  var rejected = []; 
    try {
    var inboxSS = SpreadsheetApp.openById(INBOX_SHEET_ID);
    var inboxSheet = inboxSS.getSheets()[0];
    
    pending = getPendingData(inboxSheet, "OCZEKUJE");
    rejected = getPendingData(inboxSheet, "ODRZUCONE"); 
    
    // 🔥 DODAJ TĘ LINIJKĘ (Pobierze dla nas zatwierdzone wnioski z mailem!)
    var approved_reqs = getPendingData(inboxSheet, "ZATWIERDZONE"); 

  } catch(err) {
    console.error("Błąd: ", err);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    sale: dataSale,
    przedluzenia: dataPrzedluzenia,
    pending: pending,
    rejected: rejected,
    // 🔥 DODAJ TĘ LINIJKĘ W ZWRACANYM JSON-ie (Wysyła je do frontendu):
    approved_reqs: approved_reqs || [] 
  })).setMimeType(ContentService.MimeType.JSON);
}


function getPendingData(sheet, filterStatus) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var displayRows = sheet.getDataRange().getDisplayValues();
  if (rows.length <= 1) return []; 

  var originalHeaders = rows[0].map(function(h) { return h.toString().trim(); });
  var lowerHeaders = originalHeaders.map(function(h) { return h.toLowerCase(); });
  
  var statusIdx = lowerHeaders.indexOf('status');
  if (statusIdx === -1) statusIdx = originalHeaders.length - 1;

  var data = [];
  var targetStatus = String(filterStatus).trim().toUpperCase();
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var statusValue = String(row[statusIdx] || "").trim().toUpperCase(); 
    
    var isMatch = false;
    if (targetStatus === "OCZEKUJE") {
        if (statusValue === "" || statusValue === "OCZEKUJE" || statusValue === "NOWY" || statusValue === "OCZEKUJĄCY") {
            isMatch = true;
        }
    } else {
        if (statusValue === targetStatus) {
            isMatch = true;
        }
    }
    
    if (isMatch) {
      if (!row.join("").trim()) continue; // pomiń totalnie puste wiersze

      var record = { id: i }; 
      for (var j = 0; j < originalHeaders.length; j++) {
        var headerKey = originalHeaders[j];
        if (lowerHeaders[j] === 'date' || lowerHeaders[j] === 'start' || lowerHeaders[j] === 'end' || lowerHeaders[j] === 'timestamp') {
          record[headerKey] = displayRows[i][j];
        } else {
          record[headerKey] = row[j];
        }
      }
      
      if (targetStatus === "OCZEKUJE" && !record.status) {
          record.status = "OCZEKUJE"; 
      }
      
      data.push(record);
    }
  }
  return data;
}



// ==========================================
// FUNKCJE POMOCNICZE (MAGIA CZYTANIA DAT)
// ==========================================

function getSheetData(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var displayRows = sheet.getDataRange().getDisplayValues(); 
  if (rows.length === 0) return [];
  
  var headers = rows[0].map(function(h) { return h.toString().trim(); });
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      // Wymuszamy czytanie daty i godzin jako czysty tekst z ekranu
      if (headers[j] === 'date' || headers[j] === 'start' || headers[j] === 'end' || headers[j] === 'until') {
        record[headers[j]] = displayRows[i][j];
      } else {
        record[headers[j]] = row[j];
      }
    }
    // Sprawdzamy czy wiersz nie jest całkowicie pusty
    if (row.join("").length > 0) {
      data.push(record);
    }
  }
  return data;
}

// ==========================================
// FUNKCJA ODBIERAJĄCA ZAPYTANIA POST (Z REACTA)
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var inboxSS = SpreadsheetApp.openById(INBOX_SHEET_ID);
    var calSS = SpreadsheetApp.getActiveSpreadsheet();
    
    // AKCJA 1: Student wysyła formularz -> Zapis w Arkuszu Wniosków
    if (data.action === "submitBooking") {
      var inboxSheet = inboxSS.getSheets()[0];
      
      // Tworzy nagłówki automatycznie, jeśli to nowy arkusz
      if (inboxSheet.getLastRow() === 0) {
        inboxSheet.appendRow(["Timestamp", "applicantName", "email", "orgType", "org", "title", "room", "date", "start", "end", "justification", "notes", "status"]);
      }
      
      inboxSheet.appendRow([
        new Date().toLocaleString('pl-PL'), 
        data.applicantName || "", 
        data.email || "", 
        data.orgType || "", 
        data.org || "", 
        data.title || "", 
        data.room || "", 
        data.date || "", 
        data.start || "", 
        data.end || "", 
        data.justification || "", 
        data.notes || "", 
        "OCZEKUJE"
      ]);

      // rowId = indeks w getPendingData (numer wiersza arkusza - 1)
      var rowId = inboxSheet.getLastRow() - 1;
      powiadomCRA({
        event: 'created', module: 'sale', refId: String(rowId),
        data: { room: data.room, org: data.org, title: data.title, date: data.date, start: data.start, end: data.end }
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, rowId: rowId })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // AKCJA 2: Admin Akceptuje -> Zapis w Kalendarzu ('Sale') + zmiana we Wnioskach na ZATWIERDZONE
    if (data.action === "approveBooking") {
      var calSheet = calSS.getSheetByName('Sale') || calSS.getSheets()[0];
      var inboxSheet = inboxSS.getSheets()[0];
      
      // Sprytne łączenie nazwy organizacji z tematem na jeden kafelek (jak w Twoim Excelu)
      var displayTitle = data.title;
      if (data.org && data.org !== "Samorząd Studentów UEW" && data.org !== "Samorząd Studentów") {
         displayTitle = data.title + " (" + data.org + ")";
      }
      
      // 🟢 OTO ZMIANA: Pobieramy kolor z danych, a jeśli go nie ma, dajemy domyślny indigo
      var eventColor = data.color ? data.color : "bg-indigo-600";
      
      calSheet.appendRow([
        data.room,         
        data.date,         
        data.start,        
        data.end,          
        displayTitle,      
        eventColor,         // 🟢 Wstawiamy zmienną eventColor zamiast sztywnego "bg-indigo-600"
        data.applicantName || "",   // ← nowe
        data.email || ""            // ← nowe
      ]);
      
      // Zmiana statusu we wnioskach
      var headers = inboxSheet.getDataRange().getValues()[0];
      var statusCol = headers.indexOf('status') + 1; // +1 bo Arkusze liczą od 1
      if (statusCol === 0) statusCol = inboxSheet.getLastColumn();
      
      inboxSheet.getRange(data.rowId + 1, statusCol).setValue("ZATWIERDZONE"); 

      powiadomCRA({ event: 'resolved', module: 'sale', refId: String(data.rowId), resolution: 'approved', actor: data.actor || '' });
      mailDoWnioskodawcy(data.email, 'ZATWIERDZONE', { title: data.title, room: data.room, date: data.date, start: data.start, end: data.end });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // AKCJA 3: Admin Odrzuca -> Tylko zmiana statusu we Wnioskach na ODRZUCONE
    if (data.action === "rejectBooking") {
      var inboxSheet = inboxSS.getSheets()[0];
      
      var headers = inboxSheet.getDataRange().getValues()[0];
      var statusCol = headers.indexOf('status') + 1;
      if (statusCol === 0) statusCol = inboxSheet.getLastColumn();
      
      inboxSheet.getRange(data.rowId + 1, statusCol).setValue("ODRZUCONE"); 

      // Dane wnioskodawcy z wiersza (front wysyła tylko rowId)
      var lower = headers.map(function(h) { return String(h).trim().toLowerCase(); });
      var vals = inboxSheet.getRange(data.rowId + 1, 1, 1, headers.length).getDisplayValues()[0];
      var pick = function(name) { var i = lower.indexOf(name); return i === -1 ? '' : vals[i]; };

      powiadomCRA({ event: 'resolved', module: 'sale', refId: String(data.rowId), resolution: 'rejected', actor: data.actor || '' });
      mailDoWnioskodawcy(pick('email'), 'ODRZUCONE', { title: pick('title'), room: pick('room'), date: pick('date'), start: pick('start'), end: pick('end') });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
  // AKCJA 4: Admin dodaje Przedłużenie (Zgoda Kanclerza)
    if (data.action === "addExtension") {
      var extSheet = calSS.getSheetByName('Przedluzenia');
      
      // Jeśli nie masz zakładki, skrypt sam ją stworzy z odpowiednimi nagłówkami
      if (!extSheet) {
        extSheet = calSS.insertSheet('Przedluzenia');
        extSheet.appendRow(["date", "until", "note"]);
      }
      
      extSheet.appendRow([data.date, data.until, data.note]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ==========================================
// FUNKCJA: AUTOMATYCZNY BACKUP ARKUSZA
// ==========================================
function createBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var originalFileId = ss.getId();
  var originalFile = DriveApp.getFileById(originalFileId);
  
  // Formatowanie daty do nazwy pliku
  var date = new Date();
  var dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // Nowa nazwa pliku
  var newName = ss.getName() + " - BACKUP " + dateString;
  
  // Pobieranie folderu, w którym leży oryginał
  var folders = originalFile.getParents();
  var folder = folders.hasNext() ? folders.next() : DriveApp.getRootFolder();
  
  // Tworzenie kopii
  originalFile.makeCopy(newName, folder);
}

// ==========================================
// POWIADOMIENIA CRA (2026-10-11)
// Błąd powiadomienia nigdy nie blokuje wniosku — wszystko w try/catch.
// ==========================================
function powiadomCRA(payload) {
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('NOTIFY_SECRET');
    if (!secret) { console.warn('Brak NOTIFY_SECRET we Właściwościach skryptu — pomijam powiadomienie'); return; }
    var res = UrlFetchApp.fetch(CRA_NOTIFY_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Notify-Secret': secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 300) console.warn('CRA notify ' + res.getResponseCode() + ': ' + res.getContentText());
  } catch (err) {
    console.warn('CRA notify: ' + err);
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mailDoWnioskodawcy(email, decyzja, w) {
  try {
    email = String(email || '').trim();
    if (!email || email.indexOf('@') === -1) return;
    var zatw = decyzja === 'ZATWIERDZONE';
    var kiedy = esc(w.date) + (w.start && w.end ? ', ' + esc(w.start) + '–' + esc(w.end) : '');
    var html = 'Cześć,<br><br>Twoja rezerwacja <b>„' + esc(w.title) + '”</b> w sali <b>' + esc(w.room) + '</b> (' + kiedy + ') '
      + (zatw ? 'została <b>zatwierdzona</b> i jest już w kalendarzu Samorządu.'
              : '<b>nie została zatwierdzona</b>. Jeśli masz pytania, odpowiedz na tę wiadomość.')
      + '<br><br>Pozdrawiamy,<br>Administracja Samorządu Studentów UEW';
    MailApp.sendEmail({
      to: email,
      subject: 'Rezerwacja sali ' + w.room + ' (' + w.date + ') — ' + (zatw ? 'zatwierdzona' : 'odrzucona'),
      htmlBody: html,
      name: 'CRA — Samorząd Studentów UEW'
    });
  } catch (err) {
    console.warn('Mail do wnioskodawcy: ' + err);
  }
}

// Uruchom raz ręcznie (lista funkcji → testPowiadomCRA → Uruchom): nada zgody i wyśle testowy push.
// Testowa sprawa zamknie się sama przy następnym wejściu admina na stronę sal.
function testPowiadomCRA() {
  powiadomCRA({
    event: 'created', module: 'sale', refId: 'TEST-' + new Date().getTime(),
    data: { room: '110 L', org: 'Test', title: 'Test powiadomień CRA', date: '2026-10-20', start: '18:00', end: '20:00' }
  });
}
```

- [ ] **Step 2: Utwórz `docs/superpowers/powiadomienia-wdrozenie.md`**

````markdown
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
````

- [ ] **Step 3: Commit**

```bash
git add docs/apps-script/sale-backend.gs docs/superpowers/powiadomienia-wdrozenie.md
git commit -m "docs(powiadomienia): skrypt sal z powiadomieniami i mailami + instrukcja wdrożenia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Weryfikacja końcowa

**Files:** brak zmian w kodzie (chyba że weryfikacja coś wykaże).

- [ ] **Step 1: Pełne testy i build**

Run: `npx vitest run && npx vite build`
Expected: wszystkie testy PASS, `✓ built`.

- [ ] **Step 2: Test importu wszystkich endpointów**

Run: `node --input-type=module -e "for (const f of ['_firebaseAdmin','_auth','_push','notify','push-token','cron/reminders']) { await import('./api/'+f+'.js'); console.log('ok', f); }"`
Expected: `ok` dla każdego.

- [ ] **Step 3: Pokrycie specu — przejdź §2–§10 specu i potwierdź, że każdy element ma zaimplementowany odpowiednik**

Lista do odhaczenia: mapa modułów (T1), `/api/notify` created/resolved/sync (T3), `push_tokens` + `/api/push-token` (T2), cron 48 h (T4), PWA + SW + VAPID (T5), liczniki + dzwonek + przycisk zgody + instrukcja iOS (T6), `?oczekujace=1` + `sync` z frontu (T7), maile do wnioskodawców + `powiadomCRA` + `rowId` (T8), reguły Firestore + konfiguracja (T8).

- [ ] **Step 4: Push**

```bash
git push origin main
```

Następnie przekaż użytkownikowi `docs/superpowers/powiadomienia-wdrozenie.md` (kroki 1–4 i 6–7 wykonuje on).
