import { describe, it, expect } from 'vitest';
import { buildContent, buildReminder, formatDayMonth, formatHour } from './content';
import {
  notificationId, validateEvent, shouldPushOnCreate, planSync, needsReminder,
  countOpenByModule, pickRecipientEmails, secretMatches, pushSupportState, chunk,
  pushLifecycle, pendingForSync,
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

describe('poprawki po przeglądzie', () => {
  it('pushLifecycle: przy starcie odświeża zarejestrowany token, przy wylogowaniu go wyrejestrowuje', () => {
    expect(pushLifecycle({ event: 'load', permission: 'granted', storedToken: 'tok' })).toBe('refresh');
    expect(pushLifecycle({ event: 'load', permission: 'granted', storedToken: null })).toBe('none');
    expect(pushLifecycle({ event: 'load', permission: 'denied', storedToken: 'tok' })).toBe('forget');
    expect(pushLifecycle({ event: 'logout', permission: 'granted', storedToken: 'tok' })).toBe('unregister');
    expect(pushLifecycle({ event: 'logout', permission: 'granted', storedToken: null })).toBe('none');
  });
  it('pendingForSync: błąd odczytu arkusza wniosków nie zamyka spraw', () => {
    const pending = [{ id: 1 }];
    expect(pendingForSync({ pending })).toBe(pending);
    expect(pendingForSync({ pending: [] })).toEqual([]);
    expect(pendingForSync({ pending: [], inboxError: true })).toBeNull();
    expect(pendingForSync({ pending: null })).toBeNull();
    expect(pendingForSync({})).toBeNull();
    expect(pendingForSync(null)).toBeNull();
  });
});
