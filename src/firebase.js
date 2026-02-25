import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

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
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);