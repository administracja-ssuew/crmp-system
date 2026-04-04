import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FROM, emailShell, esc } from './_email.js';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { requestId, email, name } = req.body;

  try {
    // 1. Zaktualizuj status wniosku
    await db.collection('access_requests').doc(requestId).update({ status: 'rejected' });

    // 2. Wyślij maila do wnioskodawcy
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '❌ Wniosek o dostęp do CRA — odrzucony',
      html: emailShell('Wniosek odrzucony — CRA', `
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${esc(name)},</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 12px;">
      Twój wniosek o dostęp do systemu CRA nie został zatwierdzony.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Jeśli masz pytania lub uważasz, że to pomyłka, skontaktuj się z administratorem:
      <a href="mailto:administracja@samorzad.ue.wroc.pl"
         style="color:#4f46e5;">administracja@samorzad.ue.wroc.pl</a>
    </p>
    <p style="color:#64748b;font-size:14px;margin-top:24px;">
      <strong>Samorząd Studentów UEW</strong>
    </p>
  `),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}