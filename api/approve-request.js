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
    // 1. Dodaj do authorized_users
    await db.collection('authorized_users').add({
      email: email.toLowerCase(),
      role: 'member',
    });

    // 2. Zaktualizuj status wniosku
    await db.collection('access_requests').doc(requestId).update({ status: 'approved' });

    // 3. Wyślij maila do wnioskodawcy
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '✅ Dostęp do CRA przyznany!',
      html: `
        <h2>Cześć ${name}!</h2>
        <p>Twój wniosek o dostęp do systemu CRA został <b>zatwierdzony</b>.</p>
        <a href="https://cra-system.vercel.app" 
           style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Przejdź do CRA →
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:16px;">Samorząd Studentów UEW</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}