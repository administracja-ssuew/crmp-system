import { useState } from 'react';
import { Link } from 'react-router-dom';
import SalaKalendar from '../components/Sale/SalaKalendar';

export default function CalendarSelectionPage() {
  const [showSalaKalendar, setShowSalaKalendar] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* TŁO */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>

      {!showSalaKalendar ? (
        <div className="relative z-10 max-w-4xl w-full text-center">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">Wybierz Tryb Kalendarza</h1>
          <p className="text-slate-500 mb-12 font-medium">Zakres dostępnych sal różni się w zależności od podmiotu.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* OPCJA 1: SAMORZĄD */}
            <Link to="/kalendarz/samorzad" className="group bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-emerald-400 transition-all text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">👑</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Dla Samorządu Studentów</h2>
              <p className="text-sm text-slate-500 mb-6">
                Dostęp do wszystkich przestrzeni samorządowych (9J,&nbsp;16J,&nbsp;28J) i&nbsp;wyznaczonych sal uczelnianych (bud.&nbsp;A,&nbsp;Z).
              </p>
              <span className="text-emerald-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Otwórz pełny kalendarz →</span>
            </Link>

            {/* OPCJA 2: ORGANIZACJE */}
            <Link to="/kalendarz/organizacje" className="group bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-blue-400 transition-all text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">🎓</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Dla Organizacji Studenckich</h2>
              <p className="text-sm text-slate-500 mb-6">
                Rezerwacja sali 28J oraz wyznaczonych sal dydaktycznych w&nbsp;budynkach A&nbsp;i&nbsp;Z (w&nbsp;godzinach wieczornych).
              </p>
              <span className="text-blue-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Otwórz kalendarz →</span>
            </Link>

            {/* OPCJA 3: PLAN SAL UEW */}
            <button
              onClick={() => setShowSalaKalendar(true)}
              className="group bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-violet-400 transition-all text-center flex flex-col items-center w-full"
            >
              <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">🏛️</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Plan sal UEW</h2>
              <p className="text-sm text-slate-500 mb-6">
                Sprawdź zajętość dowolnej sali dydaktycznej na podstawie aktualnego planu zajęć uczelni.
              </p>
              <span className="text-violet-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Sprawdź dostępność →</span>
            </button>

          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-7xl">
          <button
            onClick={() => setShowSalaKalendar(false)}
            className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Wróć do wyboru kalendarza
          </button>
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <SalaKalendar />
          </div>
        </div>
      )}
    </div>
  );
}
