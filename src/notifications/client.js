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
