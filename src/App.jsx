import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import { logout } from "./firebase";
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';

// === IMPORTY STRON ===
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import StandsPage from './pages/StandsPage';
import CalendarSelectionPage from './pages/CalendarSelectionPage';
// ZMIANA: Importujemy teraz ten uniwersalny kalendarz
import UniversalCalendarPage from './pages/UniversalCalendarPage'; 

// === KOMPONENT POWROTU ===
function BackButton() {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname === '/login') return null;

  return (
    <Link to="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-white/60 shadow-lg rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:scale-105 transition-all group">
      <span className="group-hover:-translate-x-1 transition-transform">←</span>
      Wróć do Menu
    </Link>
  );
}

// === PROFIL UŻYTKOWNIKA ===
function UserProfile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 p-3 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl animate-fadeIn">
      <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-sm" alt="Avatar" />
      <div className="hidden md:block">
        <p className="text-[10px] font-bold text-slate-800 leading-none mb-1 truncate max-w-[120px]">{user.displayName}</p>
        <button onClick={logout} className="text-[9px] text-red-500 hover:text-red-700 font-black uppercase tracking-tighter transition-colors">
          Wyloguj się
        </button>
      </div>
    </div>
  );
}

// === KOMPONENT OCHRONY ===
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// === ZAŚLEPKA ===
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest p-6 text-center">
    <div className="text-4xl mb-4">🚧</div>
    <h1 className="text-xl text-slate-700 mb-2">{title}</h1>
    <p className="text-xs opacity-70">Moduł w trakcie budowy</p>
  </div>
);

// === GŁÓWNA APLIKACJA ===
export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => setAppLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white font-bold">Ładowanie...</div>;
  if (!user) return <LoginPage />;

  // Splash Screen
  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-slate-100">
             <img src="/logo.png" className="w-16 h-16 object-contain" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/1087/1087815.png" }} />
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-800 italic">CRMP <span className="text-blue-600 font-normal">SYSTEM</span></h1>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
        <BackButton />
        <UserProfile />
        
        <Routes>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/mapa" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/rejestr" element={<ProtectedRoute><StandsPage /></ProtectedRoute>} />
          
          {/* Wybór Kalendarza */}
          <Route path="/kalendarz-wybor" element={<ProtectedRoute><CalendarSelectionPage /></ProtectedRoute>} />
          
          {/* === NOWA KONFIGURACJA KALENDARZY === */}
          
          {/* 1. SAMORZĄD (Pełny dostęp) */}
          <Route 
            path="/kalendarz/samorzad" 
            element={
              <ProtectedRoute>
                <UniversalCalendarPage variant="full" />
              </ProtectedRoute>
            } 
          />

          {/* 2. ORGANIZACJE (Tylko 28J) */}
          <Route 
            path="/kalendarz/organizacje" 
            element={
              <ProtectedRoute>
                <UniversalCalendarPage variant="orgs" />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/dokumenty" element={<ProtectedRoute><PlaceholderPage title="Baza Dokumentów" /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}