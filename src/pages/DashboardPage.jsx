import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  // Wyciągamy imię (lub fallback)
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Użytkowniku';

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

  // === KOMPONENT POMOCNICZY KAFELKA ===
  const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText }) => (
    <Link to={to} className="group relative h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20">
      
      {/* TŁO GRADIENTOWE */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} group-hover:scale-110 transition-transform duration-700`}></div>
      
      {/* DEKORACJA (Plama światła) */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
      
      {/* TREŚĆ KARTY */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
        
        {/* IKONA */}
        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">
          {icon}
        </div>
        
        {/* TYTUŁY */}
        <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight leading-tight">{title}</h2>
        <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6">{subtitle}</p>
        
        {/* PRZYCISK */}
        <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          {buttonText}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      
      {/* === TŁO === */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-blue-100/30 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center pt-16">
        
        {/* === NAGŁÓWEK === */}
        <header className="text-center mb-10 animate-fadeIn">
          <div className="inline-block px-4 py-1 mb-4 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-sm">
            <span className="text-xs font-black tracking-[0.2em] text-blue-600 uppercase">Witaj, {firstName} 👋</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
            Centralny Rejestr <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Materiałów Promocyjnych</span>
          </h1>
          <p className="mt-4 text-sm md:text-base font-medium text-slate-500 max-w-2xl mx-auto hidden md:block">
            Wybierz moduł poniżej, aby zarządzać zasobami UEW.
          </p>
        </header>

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
          
          {/* Komunikat o błędzie */}
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-fadeIn text-center">
              ❌ {searchError}
            </div>
          )}
          
          {/* Wynik wyszukiwania */}
          {searchResult && (
            <div className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 border-b border-emerald-200/50 pb-3">
                 <div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Znaleziono dokument</span>
                   <h3 className="font-black text-slate-800 text-lg md:text-xl">{searchResult.znak}</h3>
                 </div>
                 <span className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-sm uppercase">
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

        {/* === SIATKA 4 KAFELKÓW === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full animate-slideUp" style={{animationDelay: '0.1s'}}>
          
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
            subtitle="Rezerwacje A, B, C, CKU" 
            colorFrom="from-indigo-600" 
            colorTo="to-purple-800" 
            buttonText="Sprawdź Terminy" 
          />

          <Card 
            to="/kalendarz-wybor" 
            icon="📅" 
            title="Kalendarz Przestrzeni" 
            subtitle="Pomieszczenia Samorządu oraz sale uczelniane" 
            colorFrom="from-emerald-500" 
            colorTo="to-teal-700" 
            buttonText="Wybierz Tryb" 
          />

          <Card 
            to="/dokumenty" 
            icon="📂" 
            title="Baza Wiedzy" 
            subtitle="Regulaminy i Zarządzenia" 
            colorFrom="from-slate-600" 
            colorTo="to-slate-800" 
            buttonText="Przeglądaj Pliki" 
          />

        </div>

        {/* === STOPKA === */}
        <footer className="mt-12 opacity-50 flex flex-col items-center gap-2">
            <div className="h-[1px] w-10 bg-slate-300"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Samorząd Studentów UEW</p>
        </footer>
      </div>
    </div>
  );
}