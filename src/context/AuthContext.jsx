import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        try {
          const q = query(
            collection(db, "authorized_users"),
            where("email", "==", currentUser.email.toLowerCase())
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const role = snapshot.docs[0].data().role;
            setUser(currentUser);
            setUserRole(role);
            setAuthError(null);
          } else {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setAuthError("Brak uprawnień. Twój e-mail nie znajduje się na liście autoryzowanych użytkowników.");
          }
        } catch (error) {
          console.error("Błąd sprawdzania uprawnień:", error);
          setAuthError("Błąd połączenia z bazą danych. Spróbuj ponownie.");
          await signOut(auth);
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setAuthError(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, authError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);