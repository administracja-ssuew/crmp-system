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
