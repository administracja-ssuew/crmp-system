import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

// === TUTAJ WPISZ MAILE, KTÓRE MAJĄ MIEĆ DOSTĘP ===
const ALLOWED_EMAILS = [
  "administracja@samorzad.ue.wroc.pl", 
  "magdalena.skoczylas@samorzad.ue.wroc.pl",
  "bartosz.buczkowski@samorzad.ue.wroc.pl",
  "karol.vogel@samorzad.ue.wroc.pl",
  "martalisowska04@gmail.com",
  "mateusz.mielczarek@samorzad.ue.wroc.pl",
  "jakub.panas@samorzad.ue.wroc.pl",
  "martyna.porebska@samorzad.ue.wroc.pl",
  "hubert.stachowski@samorzad.ue.wroc.pl",
  "emilia.cwiklinska@samorzad.ue.wroc.pl",
  "julia.pytel@samorzad.ue.wroc.pl",
  "marcel.tyrakowski@samorzad.ue.wroc.pl",
  "karolina.smereczniak@samorzad.ue.wroc.pl",
  "mikolaj.radlinski@samorzad.ue.wroc.pl",
  "daria.szewczyk@samorzad.ue.wroc.pl",
  "weronika.rebacz@samorzad.ue.wroc.pl",
  "alicja.goralska@samorzad.ue.wroc.pl",
  "bartosz.bakalarz@samorzad.ue.wroc.pl",
  "aurelia.gierszewska.kpbit@gmail.com",
  "yuliia.hural.kpbit@gmail.com",
  "mikolaj.jankowski.kpbit@gmail.com",
  "aleksandra.plonka@samorzad.ue.wroc.pl",
  "anna.skrzypczak@samorzad.ue.wroc.pl",
  "maciej.kulik@samorzad.ue.wroc.pl",
  "jakub.jasinski@samorzad.ue.wroc.pl",
  "kamil.szponar.zsp@gmail.com"
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