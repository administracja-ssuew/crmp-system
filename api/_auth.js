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
