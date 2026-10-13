import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, auth, firebaseConfig } from '../firebase';
import { pushSupportState, pushLifecycle } from './logic';

const TOKEN_KEY = 'cra_push_token';
const readToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const writeToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* tryb prywatny */ } };
const swUrl = () => `/firebase-messaging-sw.js?${new URLSearchParams(Object.entries(firebaseConfig).filter(([, v]) => v))}`;
const permissionNow = () => ('Notification' in window ? Notification.permission : 'default');

async function fetchToken() {
  const registration = await navigator.serviceWorker.register(swUrl());
  return getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

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
  const token = await fetchToken();
  if (!token) return { ok: false, reason: 'no-token' };
  await authedPost('/api/push-token', { token });
  writeToken(token);
  return { ok: true };
}

// Przy starcie aplikacji (zalogowany): FCM rotuje tokeny — pobierz aktualny i odśwież zapis na serwerze.
export async function ensurePushRegistration() {
  const action = pushLifecycle({ event: 'load', permission: permissionNow(), storedToken: readToken() });
  if (action === 'forget') { writeToken(null); return; }
  if (action !== 'refresh' || !(await isSupported())) return;
  const token = await fetchToken();
  if (!token) return;
  const stored = readToken();
  if (stored && stored !== token) await authedPost('/api/push-token', { token: stored }, 'DELETE').catch(() => {});
  await authedPost('/api/push-token', { token });
  writeToken(token);
}

// Przed wylogowaniem: to urządzenie przestaje dostawać powiadomienia tego konta.
export async function unregisterPush() {
  const stored = readToken();
  if (pushLifecycle({ event: 'logout', permission: permissionNow(), storedToken: stored }) !== 'unregister') return;
  try { await authedPost('/api/push-token', { token: stored }, 'DELETE'); } finally { writeToken(null); }
}
