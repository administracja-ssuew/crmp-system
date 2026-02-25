import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

// === TUTAJ WPISZ MAILE, KTÓRE MAJĄ MIEĆ DOSTĘP ===
const ALLOWED_EMAILS = [
  "administracja@samorzad.ue.wroc.pl", 
  "magdalena.skoczylas@samorzad.ue.wroc.pl",
  // Dodaj tu siebie, bo zaraz stracisz dostęp!
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Sprawdzamy czy mail jest na liście (ignorujemy wielkość liter)
        const isAllowed = ALLOWED_EMAILS.some(email => email.toLowerCase() === currentUser.email.toLowerCase());

        if (isAllowed) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          // Nie ma na liście -> Wyloguj i pokaż błąd
          signOut(auth);
          setUser(null);
          setAuthError("Brak uprawnień. Twój e-mail nie znajduje się na liście autoryzowanych użytkowników.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);