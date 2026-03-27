import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
};

// === TUTAJ WKLEJ LINKI DO SKRYPTÓW GOOGLE ===
const CRED_API_URL = "https://script.google.com/macros/s/AKfycbzAvKdBA-8C773HeI9AjGsGh-xtzplOwnHrlXEkqS7ELN2FkRnlRGFgpkAAmZGDeWRkvA/exec";
const NOTICES_API_URL = "https://script.google.com/macros/s/AKfycbxiFv70EvHp709-j4Lrxm7mbnxgybCXuzkgUubNQedCuc4EuanK3lxUttQwpvgE1UGyng/exec";

// === INTELIGENTNY FORMATER DATY ===
const formatDate = (rawDate) => {
  if (!rawDate) return 'Brak';
  if (rawDate === 'Dzisiaj' || rawDate === 'Wczoraj') return rawDate;
  
  try {
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return rawDate; 
    
    return dateObj.toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch (e) { return rawDate; }
};

export default function DashboardPage() {
  const { user, userRole } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Użytkowniku';
  const isAdmin = userRole === 'admin';

  // === STANY OGŁOSZEŃ ===
  const [notices, setNotices] = useState([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [dismissedNotices, setDismissedNotices] = useState([]);
  
  // === STANY KREATORA OGŁOSZEŃ (TYLKO DLA ADMINA) ===
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ target: 'ALL', type: 'info', text: '' });

  // === STANY WYSZUKIWARKI CRED ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // POBIERANIE OGŁOSZEŃ
  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoadingNotices(true);
      try {
        if (NOTICES_API_URL === "TUTAJ_WKLEJ_LINK_DO_OGLOSZEN_Z_APPS_SCRIPT") {
          setIsLoadingNotices(false); return;
        }
        const [response] = await Promise.all([
          fetch(NOTICES_API_URL),
          new Promise(resolve => setTimeout(resolve, 600))
        ]);
        const data = await response.json();
        if (!data.error && Array.isArray(data)) {
          setNotices(data.reverse()); 
        }
      } catch (error) {
        console.error("Błąd pobierania ogłoszeń:", error);
      } finally {
        setIsLoadingNotices(false);
      }
    };
    fetchNotices();
  }, []);

  // DODAWANIE NOWEGO OGŁOSZENIA
  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.text.trim()) return;

    setIsSubmittingNotice(true);
    try {
      const response = await fetch(NOTICES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(noticeForm) // Dodaje ogłoszenie
      });
      const result = await response.json();

      if (result.success) {
        const newNotice = {
          id: result.id, target: noticeForm.target, type: noticeForm.type, text: noticeForm.text, date: result.date
        };
        setNotices([newNotice, ...notices]);
        setShowNoticeModal(false);
        setNoticeForm({ target: 'ALL', type: 'info', text: '' }); 
      } else {
        alert("Błąd zapisu w Google Sheets.");
      }
    } catch (err) { alert("Wystąpił błąd komunikacji. Spróbuj ponownie."); } 
    finally { setIsSubmittingNotice(false); }
  };

  // GLOBALNE USUWANIE OGŁOSZENIA (Tylko Admin)
  const handleDeleteNoticeGlobal = async (id) => {
    if (!window.confirm("Czy na pewno chcesz trwale usunąć to ogłoszenie z tablicy wszystkich studentów?")) return;
    
    // Usuwamy optymistycznie od razu ze strony
    setNotices(notices.filter(n => n.id !== id));
    
    try {
      // Wysyłamy sygnał "delete" do Apps Script
      await fetch(NOTICES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: id })
      });
    } catch (err) {
      console.error("Błąd podczas globalnego usuwania:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSearchError(''); setSearchResult(null);
    try {
      const response = await fetch(`${CRED_API_URL}?znak=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.error) setSearchError(data.error);
      else setSearchResult(data);
    } catch (error) {
      setSearchError("Błąd połączenia z bazą CRED. Spróbuj ponownie później.");
    } finally {
      setIsSearching(false);
    }
  };

  const activeNotices = notices.filter(notice => {
    if (dismissedNotices.includes(notice.id)) return false;
    if (notice.target === 'ADMIN' && !isAdmin) return false;
    if (!notice.text || String(notice.text).trim() === '') return false;
    return true;
  });

  const handleDismiss = (id) => setDismissedNotices([...dismissedNotices, id]);

  const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText }) => (
    <Link to={to} className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 isolate [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} group-hover:scale-110 transition-transform duration-700 -z-10`}></div>
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors -z-10"></div>
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      
      {/* TŁO */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-blue-100/30 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center pt-16">
        
        {/* NAGŁÓWEK */}
        <header className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1 mb-4 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-sm shadow-sm">
            <span className="text-xs font-black tracking-[0.2em] text-blue-600 uppercase">Witaj, {firstName} 👋</span>
            {isAdmin && <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-md font-bold tracking-widest shadow-inner">ADMIN</span>}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Centralny Rejestr <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 pb-4 break-words whitespace-normal">Administracyjny</span>
          </h1>
          <p className="mt-4 text-sm md:text-base font-medium text-slate-500 max-w-2xl mx-auto hidden md:block">
            Wybierz przestrzeń roboczą, aby uzyskać dostęp do narzędzi i zasobów SSUEW.
          </p>
        </header>

        {/* ==================================================== */}
        {/* GŁÓWNY PRZYCISK: SYSTEM WERYFIKACJI (SKANER QR) */}
        {/* ==================================================== */}
        <div className="w-full max-w-3xl mb-8 animate-fadeIn">
          <Link 
            to="/skaner" 
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-6 md:p-8 text-white shadow-xl hover:shadow-2xl hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 w-full"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
            
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
              <span className="text-2xl md:text-3xl">📷</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-black mb-1 tracking-tight drop-shadow-sm">System Weryfikacji (Skaner QR)</h3>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-100">
                Zamelduj wejście do sali lub przekaż odpowiedzialność
              </p>
            </div>

            <div className="shrink-0 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
              <Icons.ArrowRight />
            </div>
          </Link>
        </div>

        {/* ==================================================== */}
        {/* PANEL ADMINISTRATORA I TABLICA OGŁOSZEŃ */}
        {/* ==================================================== */}
        <div className="w-full max-w-3xl mb-10 relative">
          
          {/* Przycisk dodawania (Tylko dla Adminów) */}
          {isAdmin && (
            <div className="absolute -top-10 right-0 z-10 animate-fadeIn">
              <button 
                onClick={() => setShowNoticeModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
              >
                <Icons.Plus /> Nadaj Komunikat
              </button>
            </div>
          )}

          {/* Lista Ogłoszeń */}
          {(isLoadingNotices || activeNotices.length > 0) && (
            <div className="space-y-3">
              {isLoadingNotices ? (
                <div className="w-full h-16 bg-slate-200/50 animate-pulse rounded-2xl"></div>
              ) : (
                activeNotices.map((notice) => (
                  <div 
                    key={notice.id} 
                    className={`flex items-start md:items-center justify-between p-4 rounded-2xl border shadow-sm transition-all group backdrop-blur-sm animate-slideDown
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
                            {notice.target === 'ADMIN' ? 'Wiadomość Zarządu' : 'Ogłoszenie SSUEW'} • {formatDate(notice.date)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-snug">{notice.text}</p>
                      </div>
                    </div>
                    
                    {/* Przyciski kontroli nad ogłoszeniem */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteNoticeGlobal(notice.id)}
                          className="p-2 rounded-full hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                          title="Usuń to ogłoszenie dla wszystkich (Admin)"
                        >
                          <Icons.Trash />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDismiss(notice.id)} 
                        className="p-2 rounded-full hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                        title="Zrozumiałem, ukryj dla mnie"
                      >
                        <Icons.Close />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* === WYSZUKIWARKA CRED === */}
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-blue-900/5 border border-white mb-10 animate-slideUp">
          
          <div className="mb-4 pl-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sprawdź status swojej sprawy w systemie CRED</h3>
          </div>

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
               {isSearching ? 'Szukanie...' : 'Szukaj Pisma'}
             </button>
          </div>
          
          <div className="mt-4 pl-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               * Planowany dzień zakończenia sprawy wlicza w siebie czas niezbędny na uzyskanie podpisów Władz Uczelni.
             </p>
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
                  <span className="font-bold text-slate-700 text-sm">{formatDate(searchResult.data_zlozenia)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Planowane zakończenie</span>
                  <span className="font-bold text-slate-700 text-sm">{formatDate(searchResult.planowane_zakonczenie)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === SIATKA 6 KAFELKÓW === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full animate-slideUp" style={{animationDelay: '0.1s'}}>
          <Card to="/sprzet" icon="📦" title="Baza Sprzętu" subtitle="Katalog i Rezerwacje" colorFrom="from-orange-500" colorTo="to-red-600" buttonText="Otwórz Magazyn" />
          <Card to="/mapa" icon="🗺️" title="Mapa Kampusu" subtitle="Banery i Plakaty" colorFrom="from-blue-500" colorTo="to-blue-700" buttonText="Otwórz Mapę" />
          <Card to="/rejestr" icon="📋" title="Rejestr Standów" subtitle="Harmonogram stoisk promocyjnych" colorFrom="from-indigo-600" colorTo="to-purple-800" buttonText="Sprawdź Terminy" />
          <Card to="/kalendarz-wybor" icon="📅" title="Sale i Przestrzenie" subtitle="Rezerwacje samorządowe" colorFrom="from-emerald-500" colorTo="to-teal-700" buttonText="Wybierz Tryb" />
          <Card to="/dokumenty" icon="📂" title="Moduł Lex SSUEW" subtitle="Uchwały i Studio Legislacyjne" colorFrom="from-slate-600" colorTo="to-slate-800" buttonText="Przeglądaj Pliki" />
          <Card to="/legal-hub" icon="⚖️" title="Zaplecze Prawne" subtitle="Wzory regulaminów i edukacja" colorFrom="from-amber-500" colorTo="to-orange-500" buttonText="Otwórz Akademię" />
          {isAdmin && (
          <Card to="/wnioski" icon="📥" title="Panel Wniosków" subtitle="Zarządzaj dostępem do CRA" colorFrom="from-rose-500" colorTo="to-pink-700" buttonText="Rozpatrz Wnioski" />
           )}
        </div>

        <footer className="mt-16 opacity-50 flex flex-col items-center gap-2">
            <div className="h-[1px] w-10 bg-slate-300"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Samorząd Studentów UEW</p>
        </footer>
      </div>

      {/* ==================================================== */}
      {/* MODAL DODAWANIA OGŁOSZENIA (TYLKO DLA ADMINA) */}
      {/* ==================================================== */}
      {showNoticeModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmittingNotice && setShowNoticeModal(false)}></div>
          
          <form onSubmit={handleSubmitNotice} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounceIn">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Icons.Bell /> Utwórz Nowy Komunikat
              </h3>
              <button type="button" onClick={() => setShowNoticeModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <Icons.Close />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grupa Docelowa</label>
                <select 
                  value={noticeForm.target} 
                  onChange={(e) => setNoticeForm({...noticeForm, target: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="ALL">Wszyscy Użytkownicy (Studenci, Organizacje)</option>
                  <option value="ADMIN">Tylko Zarząd / Administratorzy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Priorytet (Kolor Kafelka)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setNoticeForm({...noticeForm, type: 'info'})} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Zwykła<br/>(Niebieski)</button>
                  <button type="button" onClick={() => setNoticeForm({...noticeForm, type: 'warning'})} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Ważne<br/>(Żółty)</button>
                  <button type="button" onClick={() => setNoticeForm({...noticeForm, type: 'urgent'})} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'urgent' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Pilne!<br/>(Czerwony)</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Treść Komunikatu</label>
                <textarea 
                  required
                  value={noticeForm.text}
                  onChange={(e) => setNoticeForm({...noticeForm, text: e.target.value})}
                  placeholder="Np. Przypominamy o konieczności rozliczenia projektów do końca tygodnia!"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-24"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowNoticeModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                Anuluj
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingNotice}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {isSubmittingNotice ? 'Wysyłanie...' : 'Opublikuj na tablicy'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}