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
  apiKey: "AIzaSyBsKTsr-p1-najTnG3MlKUTZCGStKHGl8w",
  authDomain: "crmp-uew.firebaseapp.com",
  projectId: "crmp-uew",
  storageBucket: "crmp-uew.firebasestorage.app",
  messagingSenderId: "185755994538",
  appId: "1:185755994538:web:813d556cc4356debe0c3d3",
  measurementId: "G-TTH3EDGTXE"
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