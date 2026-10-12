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
