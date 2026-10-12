// Jedna, leniwa inicjalizacja firebase-admin dla nowych endpointów.
// Leniwa = import pliku nie wymaga kluczy (pozwala na test importu lokalnie).
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

function app() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getApps()[0];
}

export const adminDb = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
export const adminMessaging = () => getMessaging(app());
export { FieldValue };
