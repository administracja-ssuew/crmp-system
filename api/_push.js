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
