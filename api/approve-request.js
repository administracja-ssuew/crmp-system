import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FROM, emailShell, ctaButton, esc } from './_email.js';

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
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: '✅ Dostęp do CRA przyznany!',
      html: emailShell('Dostęp przyznany — CRA', `
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${esc(name)}!</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 12px;">
      Twój wniosek o dostęp do systemu CRA został <strong>zatwierdzony</strong>.
      Witamy Cię w gronie aktywnych członków Samorządu Studentów UEW!
    </p>

    <h3 style="color:#4f46e5;font-size:16px;margin:24px 0 8px;">Czym jest CRA?</h3>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">
      CRA (Centralny Rejestr Administracyjny) to wewnętrzna platforma Samorządu Studentów
      Uniwersytetu Ekonomicznego we Wrocławiu. Znajdziesz tu katalog sprzętu i rezerwacje,
      rejestr stanowisk, dokumenty organizacyjne oraz mapę kampusu — wszystko w jednym miejscu.
    </p>

    <h3 style="color:#4f46e5;font-size:16px;margin:24px 0 8px;">Jak się zalogować?</h3>
    <ol style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
      <li>Wejdź na stronę: <a href="https://cra-system.vercel.app"
          style="color:#4f46e5;">cra-system.vercel.app</a></li>
      <li>Kliknij przycisk <strong>„Zaloguj się przez Google"</strong></li>
      <li>Wybierz swoje konto Google przypisane do organizacji</li>
    </ol>

    ${ctaButton('Przejdź do CRA →', 'https://cra-system.vercel.app')}

    <p style="color:#64748b;font-size:14px;margin-top:24px;">
      Do zobaczenia w systemie!<br>
      <strong>Samorząd Studentów UEW</strong>
    </p>
  `),
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: `Błąd wysyłki maila: ${emailError.message}` });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}
