import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicjalizacja Firebase Admin
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, index, organization, justification } = req.body;

  // Walidacja
  if (!name || !email || !organization || !justification) {
    return res.status(400).json({ error: 'Brak wymaganych pól' });
  }

  try {
    // 1. Zapisz wniosek w Firestore
    await db.collection('access_requests').add({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      index: index || '',
      organization,
      justification,
      status: 'pending',
      createdAt: new Date(),
    });

    // 2. Mail do admina
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'administracja@samorzad.ue.wroc.pl',
      subject: `📥 Nowy wniosek o dostęp do Centralnego Rejestru Administracyjnego — ${name}`,
      html: `
        <h2>Nowy wniosek o dostęp do Centralnego Rejestru Administracyjnego</h2>
        <table>
          <tr><td><b>Imię i nazwisko:</b></td><td>${name}</td></tr>
          <tr><td><b>E-mail:</b></td><td>${email}</td></tr>
          <tr><td><b>Telefon:</b></td><td>${phone || '—'}</td></tr>
          <tr><td><b>Nr indeksu:</b></td><td>${index || '—'}</td></tr>
          <tr><td><b>Organizacja:</b></td><td>${organization}</td></tr>
          <tr><td><b>Uzasadnienie:</b></td><td>${justification}</td></tr>
        </table>
        <br/>
         <a href="https://cra-system.vercel.app/wniosek"
           style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Przejdź do panelu wniosków →
        </a>
      `,
    });

    // 3. Mail potwierdzający do wnioskodawcy
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '✅ Wniosek o dostęp do Centralnego Rejestru Administracyjnego — potwierdzenie',
      html: `
        <h2>Twój wniosek został przyjęty!</h2>
        <p>Cześć <b>${name}</b>,</p>
        <p>Twój wniosek o dostęp do systemu CRA Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu został przyjęty i oczekuje na rozpatrzenie przez administratora.</p>
        <p>Otrzymasz kolejnego maila gdy Twój wniosek zostanie rozpatrzony.</p>
        <br/>
        <p style="color:#64748b;font-size:12px;">Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu — System CRA</p>
      `,
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Błąd API:', error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}