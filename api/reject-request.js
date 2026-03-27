import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
      from: 'onboarding@resend.dev',
      to: email,
      subject: '❌ Wniosek o dostęp do CRA — odrzucony',
      html: `
        <h2>Cześć ${name},</h2>
        <p>Twój wniosek o dostęp do systemu CRA został <b>odrzucony</b>.</p>
        <p>W razie pytań skontaktuj się z administratorem: <a href="mailto:administracja@samorzad.ue.wroc.pl">administracja@samorzad.ue.wroc.pl</a></p>
        <p style="color:#64748b;font-size:12px;margin-top:16px;">Samorząd Studentów UEW</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}