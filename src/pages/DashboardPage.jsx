import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// === BAZA OGŁOSZEŃ (SMART NOTICES) ===
const ALL_NOTICES = [
  { id: 1, target: 'ALL', type: 'info', text: 'Przypominamy o konieczności terminowego zwrotu sprzętu po wydarzeniach (max 48h).', date: 'Dzisiaj' },
  { id: 2, target: 'ALL', type: 'warning', text: 'Nowe wzory podań do Kanclerza zostały zaktualizowane w Lex SSUEW. Prosimy nie używać starych druków!', date: 'Wczoraj' },
  { id: 3, target: 'ADMIN', type: 'urgent', text: 'Posiedzenie Zarządu zostało przeniesione na ten czwartek, godz. 18:30 (Sala 205A).', date: 'Dzisiaj' },
  { id: 4, target: 'ADMIN', type: 'info', text: 'W systemie CRED oczekują 3 nowe wnioski o rezerwację CKU na przyszły tydzień.', date: 'Wczoraj' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  // Wyciągamy imię (lub fallback)
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Użytkowniku';

  // === PRZEŁĄCZNIK ROLI (Do testów tablicy ogłoszeń) ===
  const [isAdmin, setIsAdmin] = useState(false);
  const [dismissedNotices, setDismissedNotices] = useState([]);

  // === STANY DLA WYSZUKIWARKI CRED ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // === TUTAJ WKLEJ LINK ZE SKRYPTU DLA BAZY CRED ===
  const CRED_API_URL = "https://script.google.com/macros/s/AKfycbzAvKdBA-8C773HeI9AjGsGh-xtzplOwnHrlXEkqS7ELN2FkRnlRGFgpkAAmZGDeWRkvA/exec";

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    
    try {
      const response = await fetch(`${CRED_API_URL}?znak=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.error) {
        setSearchError(data.error);
      } else {
        setSearchResult(data);
      }
    } catch (error) {
      setSearchError("Błąd połączenia z bazą CRED. Spróbuj ponownie później.");
    } finally {
      setIsSearching(false);
    }
  };

  // Logika filtrowania ogłoszeń
  const activeNotices = ALL_NOTICES.filter(notice => {
    if (dismissedNotices.includes(notice.id)) return false;
    if (notice.target === 'ADMIN' && !isAdmin) return false;
    return true;
  });

  const handleDismiss = (id) => {
    setDismissedNotices([...dismissedNotices, id]);
  };

  // === KOMPONENT POMOCNICZY KAFELKA ===
  const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText }) => (
    <Link 
      to={to} 
      // OPCJA ATOMOWA: mask-image i isolate wymuszają perfekcyjne docięcie tła!
      className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 isolate [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)]"
    >
      {/* TŁO GRADIENTOWE */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} group-hover:scale-110 transition-transform duration-700 -z-10`}></div>
      
      {/* DEKORACJA (Plama światła) */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors -z-10"></div>
      
      {/* TREŚĆ KARTY */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-14 h-14 md:w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">
          {icon}
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight leading-tight">{title}</h2>
        <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 px-2">{subtitle}</p>
        <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          {buttonText}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden bg-slate-50">
      
      {/* === TŁO === */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-blue-100/30 pointer-events-none z-0"></div>

      {/* === PASEK ZARZĄDZANIA ROLĄ (Do testów) === */}
      <div className="relative z-20 w-full max-w-6xl flex justify-end mt-4 mb-2">
        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <button onClick={() => setIsAdmin(false)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${!isAdmin ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            Użytkownik
          </button>
          <button onClick={() => setIsAdmin(true)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${isAdmin ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icons.Shield /> Admin
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        
        {/* === NAGŁÓWEK === */}
        <header className="text-center mb-8 animate-fadeIn">
          <div className="inline-block px-4 py-1 mb-4 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-sm">
            <span className="text-xs font-black tracking-[0.2em] text-blue-600 uppercase">Witaj, {firstName} 👋</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Centralny Rejestr <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 pb-4 break-words whitespace-normal">Administracyjny</span>
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-slate-500 max-w-2xl mx-auto hidden md:block">
            Wybierz moduł poniżej, aby zarządzać zasobami.
          </p>
        </header>

        {/* === INTELIGENTNA TABLICA OGŁOSZEŃ === */}
        {activeNotices.length > 0 && (
          <div className="w-full max-w-3xl mb-10 space-y-3 animate-slideDown">
            {activeNotices.map((notice) => (
              <div 
                key={notice.id} 
                className={`flex items-start md:items-center justify-between p-4 rounded-2xl border shadow-sm transition-all group backdrop-blur-sm
                  ${notice.type === 'urgent' ? 'bg-rose-50/90 border-rose-200 text-rose-900' : 
                    notice.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-900' : 
                    'bg-white/90 border-slate-200 text-slate-700'}`}
              >
                <div className="flex items-start md:items-center gap-4 pr-4">
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${notice.type === 'urgent' ? 'bg-rose-200/50 text-rose-600' : 
                      notice.type === 'warning' ? 'bg-amber-200/50 text-amber-600' : 
                      'bg-slate-100 text-slate-500'}`}>
                    <Icons.Bell />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {notice.target === 'ADMIN' ? 'Wiadomość Zarządu' : 'Ogłoszenie SSUEW'} • {notice.date}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">{notice.text}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDismiss(notice.id)} 
                  className="shrink-0 p-2 rounded-full hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                  title="Zrozumiałem, ukryj"
                >
                  <Icons.Close />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* === WYSZUKIWARKA CRED === */}
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-blue-900/5 border border-white mb-10 animate-slideUp">
          <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">🔎</div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               placeholder="Wpisz znak sprawy CRED..." 
               className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
             />
             <button 
               onClick={handleSearch}
               disabled={isSearching}
               className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 whitespace-nowrap"
             >
               {isSearching ? 'Szukanie...' : 'Sprawdź'}
             </button>
          </div>
          
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-fadeIn text-center">
              ❌ {searchError}
            </div>
          )}
          
          {searchResult && (
            <div className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 border-b border-emerald-200/50 pb-3">
                 <div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Znaleziono dokument</span>
                   <h3 className="font-black text-slate-800 text-lg md:text-xl break-all">{searchResult.znak}</h3>
                 </div>
                 <span className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-sm uppercase">
                   {searchResult.status}
                 </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Data wpłynięcia</span>
                  <span className="font-bold text-slate-700 text-sm">{searchResult.data_zlozenia || 'Brak'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Planowane zakończenie</span>
                  <span className="font-bold text-slate-700 text-sm">{searchResult.planowane_zakonczenie || 'Brak'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === SIATKA 6 KAFELKÓW (PERFEKCYJNY GRID 3x2) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full animate-slideUp" style={{animationDelay: '0.1s'}}>
          
          <Card 
            to="/sprzet" 
            icon="📦" 
            title="Baza Sprzętu" 
            subtitle="Katalog i Rezerwacje" 
            colorFrom="from-orange-500" 
            colorTo="to-red-600" 
            buttonText="Otwórz Magazyn" 
          />

          <Card 
            to="/mapa" 
            icon="🗺️" 
            title="Mapa Kampusu" 
            subtitle="Banery i Plakaty" 
            colorFrom="from-blue-500" 
            colorTo="to-blue-700" 
            buttonText="Otwórz Mapę" 
          />
          
          <Card 
            to="/rejestr" 
            icon="📋" 
            title="Rejestr Stoisk" 
            subtitle="Harmonogram w budynkach" 
            colorFrom="from-indigo-600" 
            colorTo="to-purple-800" 
            buttonText="Sprawdź Terminy" 
          />

          <Card 
            to="/kalendarz-wybor" 
            icon="📅" 
            title="Sale i Przestrzenie" 
            subtitle="Rezerwacje samorządowe" 
            colorFrom="from-emerald-500" 
            colorTo="to-teal-700" 
            buttonText="Wybierz Tryb" 
          />

          <Card 
            to="/dokumenty" 
            icon="📂" 
            title="Moduł Lex SSUEW" 
            subtitle="Uchwały i Studio Legislacyjne" 
            colorFrom="from-slate-600" 
            colorTo="to-slate-800" 
            buttonText="Przeglądaj Pliki" 
          />

          <Card 
            to="/legal-hub" 
            icon="⚖️" 
            title="Zaplecze Prawne" 
            subtitle="Wzory regulaminów i edukacja" 
            colorFrom="from-amber-500" 
            colorTo="to-orange-500" 
            buttonText="Otwórz Akademię" 
          />

        </div>

        {/* === STOPKA === */}
        <footer className="mt-16 opacity-50 flex flex-col items-center gap-2">
            <div className="h-[1px] w-10 bg-slate-300"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Samorząd Studentów UEW</p>
        </footer>
      </div>
    </div>
  );
}