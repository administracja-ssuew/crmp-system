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
