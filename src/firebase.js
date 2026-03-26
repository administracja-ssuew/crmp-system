import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,  // <--- ZMIANA: BYŁO signInWithRedirect
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Dane znajdziesz w Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// === TUTAJ JEST KLUCZOWA ZMIANA ===
const loginWithGoogle = async () => {
  try {
    // Używamy Popup zamiast Redirect - to naprawia błąd na telefonach
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Błąd logowania:", error);
    alert("Wystąpił błąd podczas logowania: " + error.message);
  }
};

const logout = () => {
  signOut(auth);
};

export { auth, db, loginWithGoogle, logout };