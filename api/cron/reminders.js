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
