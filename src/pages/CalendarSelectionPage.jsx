import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SalaKalendar from '../components/Sale/SalaKalendar';
import KalendarzProjektowy from '../components/Projekty/KalendarzProjektowy';

export default function CalendarSelectionPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  // null | 'sala' | 'projektowy'
  const [activeView, setActiveView] = useState(null);

  if (activeView === 'sala') {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }} />
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="bg-white rounded-b-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <SalaKalendar onBack={() => setActiveView(null)} />
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'projektowy') {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }} />
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="bg-white rounded-b-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            {/* Back button in header area */}
            <div className="flex items-center justify-between px-6 pt-4 pb-0">
              <span />
              <button
                onClick={() => setActiveView(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                ← Wróć do wyboru kalendarza
              </button>
            </div>
            <KalendarzProjektowy isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* TŁO */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }} />

      <div className="relative z-10 max-w-5xl w-full text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">Wybierz Tryb Kalendarza</h1>
        <p className="text-slate-500 mb-12 font-medium">Zakres dostępnych sal różni się w zależności od podmiotu.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* OPCJA 1: SAMORZĄD */}
          <Link to="/kalendarz/samorzad" className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-emerald-400 transition-all text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">👑</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Dla Samorządu Studentów</h2>
            <p className="text-sm text-slate-500 mb-5">
              Dostęp do wszystkich przestrzeni samorządowych (110&nbsp;L,&nbsp;106&nbsp;L,&nbsp;101&nbsp;L).
            </p>
            <span className="text-emerald-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Otwórz pełny kalendarz →</span>
          </Link>

          {/* OPCJA 2: ORGANIZACJE — WYGASZONY */}
          <Link to="/kalendarz/organizacje" className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-md opacity-60 grayscale transition-all text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-5">🎓</div>
            <h2 className="text-xl font-black text-slate-500 mb-2">Dla Organizacji Studenckich</h2>
            <p className="text-sm text-slate-400 mb-5">
              Kalendarz został wygaszony — rezerwacje są nieaktywne.
            </p>
            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Wygaszony</span>
          </Link>

          {/* OPCJA 3: PLAN SAL UEW */}
          <button
            onClick={() => setActiveView('sala')}
            className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-violet-400 transition-all text-center flex flex-col items-center w-full"
          >
            <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">🏛️</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Plan sal UEW</h2>
            <p className="text-sm text-slate-500 mb-5">
              Sprawdź zajętość dowolnej sali dydaktycznej na podstawie aktualnego planu zajęć uczelni.
            </p>
            <span className="text-violet-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Sprawdź dostępność →</span>
          </button>

          {/* OPCJA 4: KALENDARZ PROJEKTOWY */}
          <button
            onClick={() => setActiveView('projektowy')}
            className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-amber-400 transition-all text-center flex flex-col items-center w-full"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">📊</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Kalendarz Projektowy</h2>
            <p className="text-sm text-slate-500 mb-5">
              Planowane finały i kluczowe daty wydarzeń organizacji studenckich i&nbsp;samorządu w roku akademickim.
            </p>
            <span className="text-amber-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Zobacz kalendarz →</span>
          </button>

        </div>
      </div>
    </div>
  );
}
