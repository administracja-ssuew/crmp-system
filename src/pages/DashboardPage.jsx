import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CRED_API_URL, NOTICES_API_URL } from '../config';
import { useGASFetch } from '../hooks/useGASFetch';
import MyApplications from '../components/MyApplications';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
const Icons = {
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
};


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
  const _noticesEnabled = NOTICES_API_URL !== "TUTAJ_WKLEJ_LINK_DO_OGLOSZEN_Z_APPS_SCRIPT";
  const { data: rawNotices, loading: isLoadingNotices } = useGASFetch(
    _noticesEnabled ? NOTICES_API_URL : null
  );
  const [notices, setNotices] = useState([]);
  const [dismissedNotices, setDismissedNotices] = useState(
    () => JSON.parse(localStorage.getItem('cra_dismissed_notices') || '[]')
  );

  // === STANY KREATORA OGŁOSZEŃ (TYLKO DLA ADMINA) ===
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [noticeForm, setNoticeForm] = useState({ target: 'ALL', type: 'info', text: '' });

  // === STANY WYSZUKIWARKI CRED ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // === ADMIN: STATYSTYKI ===
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsTab, setStatsTab] = useState('ranking'); // 'ranking' | 'chart' | 'today'
  const [statsRefreshedAt, setStatsRefreshedAt] = useState(null);

  const [uniqueUsers, setUniqueUsers] = useState(null);
  const [todayUsers, setTodayUsers] = useState(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [pageSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'page_stats')),
        getDocs(collection(db, 'user_visits')),
      ]);
      const rows = pageSnap.docs.map(d => ({ path: d.id, ...d.data() }))
        .sort((a, b) => (b.total || 0) - (a.total || 0));
      setStats(rows);

      const today = new Date().toISOString().slice(0, 10);
      const users = userSnap.docs.map(d => d.data());
      setUniqueUsers(users.length);
      setTodayUsers(users.filter(u => u.lastSeen === today).length);
      setUserActivity([...users].sort((a, b) => (b.lastSeen || '').localeCompare(a.lastSeen || '')));

      setStatsRefreshedAt(new Date());
    } catch { setStats([]); }
    setStatsLoading(false);
  }, []);

  useEffect(() => { if (showStats && isAdmin) loadStats(); }, [showStats, isAdmin, loadStats]);

  // === HELPDESK ===
  const [showHelpdesk, setShowHelpdesk] = useState(false);
  const [helpdeskTab, setHelpdeskTab] = useState('submit'); // 'submit' | 'my' | 'all' (admin)
  const [helpdeskForm, setHelpdeskForm] = useState({ category: 'bug', title: '', description: '' });
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [adminReply, setAdminReply] = useState({}); // { [ticketId]: replyText }
  const [userActivity, setUserActivity] = useState([]); // dla zakładki Aktywność w statystykach

  const loadTickets = useCallback(async () => {
    if (!user?.uid) return;
    setTicketsLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'helpdesk_tickets'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'helpdesk_tickets'), where('userId', '==', user.uid));
        
      const snap = await getDocs(q);
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (!isAdmin) {
        fetched.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      }
      
      setTickets(fetched);
    } catch { setTickets([]); }
    setTicketsLoading(false);
  }, [isAdmin, user?.uid]);

  const submitTicket = async () => {
    if (!helpdeskForm.title.trim() || !helpdeskForm.description.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'helpdesk_tickets'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        category: helpdeskForm.category,
        title: helpdeskForm.title.trim(),
        description: helpdeskForm.description.trim(),
        status: 'new',
        createdAt: Timestamp.now(),
        adminResponse: null,
      });
      setHelpdeskForm({ category: 'bug', title: '', description: '' });
      setSubmitSuccess(true);
      loadTickets();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'helpdesk_tickets', id), { status });
      setTickets(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    } catch { /* silent */ }
  };

  const sendAdminReply = async (id) => {
    const text = (adminReply[id] || '').trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, 'helpdesk_tickets', id), {
        adminResponse: text,
        respondedAt: Timestamp.now(),
        status: 'in_progress',
      });
      setTickets(ts => ts.map(t => t.id === id ? { ...t, adminResponse: text, status: 'in_progress' } : t));
      setAdminReply(r => ({ ...r, [id]: '' }));
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (showHelpdesk) {
      loadTickets();
      setHelpdeskTab(isAdmin ? 'all' : 'submit');
    }
  }, [showHelpdesk, isAdmin, loadTickets]);

  // Synchronizuj ogłoszenia z rawNotices (cache → natychmiastowe ładowanie przy kolejnych wizytach)
  // notices pozostaje jako mutable state dla lokalnych operacji add/delete
  useEffect(() => {
    if (!rawNotices || !Array.isArray(rawNotices)) return;
    setNotices([...rawNotices].reverse());
  }, [rawNotices]);

  // DODAWANIE NOWEGO OGŁOSZENIA
  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.text.trim()) return;
    setNoticeError('');
    setIsSubmittingNotice(true);
    try {
      const response = await fetch(NOTICES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(noticeForm)
      });
      const result = await response.json();

      if (result.success) {
        const newNotice = {
          id: result.id, target: noticeForm.target, type: noticeForm.type, text: noticeForm.text, date: result.date
        };
        setNotices([newNotice, ...notices]);
        setShowNoticeModal(false);
        setNoticeForm({ target: 'ALL', type: 'info', text: '' });
        setNoticeError('');
      } else {
        setNoticeError('Błąd zapisu w Google Sheets. Spróbuj ponownie.');
      }
    } catch (err) {
      setNoticeError('Wystąpił błąd komunikacji. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setIsSubmittingNotice(false);
    }
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

  const handleDismiss = (id) => {
    const updated = [...dismissedNotices, id];
    setDismissedNotices(updated);
    localStorage.setItem('cra_dismissed_notices', JSON.stringify(updated));
  };

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

        {/* === MOJE WNIOSKI === */}
        <MyApplications userEmail={user?.email} />

        {/* === SIATKA 6 KAFELKÓW === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <Card to="/sprzet" icon="📦" title="Baza Sprzętu" subtitle="Katalog i Rezerwacje" colorFrom="from-orange-500" colorTo="to-red-600" buttonText="Otwórz Magazyn" />
          <Card to="/mapa" icon="🗺️" title="Mapa Kampusu" subtitle="Banery i Plakaty" colorFrom="from-blue-500" colorTo="to-blue-700" buttonText="Otwórz Mapę" />
          <Card to="/rejestr" icon="📋" title="Rejestr Standów" subtitle="Harmonogram stoisk promocyjnych" colorFrom="from-indigo-600" colorTo="to-purple-800" buttonText="Sprawdź Terminy" />
          <Card to="/kalendarz-wybor" icon="📅" title="Sale i Przestrzenie" subtitle="Rezerwacje samorządowe" colorFrom="from-emerald-500" colorTo="to-teal-700" buttonText="Wybierz Tryb" />
          <Card to="/dokumenty" icon="📂" title="Moduł Lex SSUEW" subtitle="Uchwały i Studio Legislacyjne" colorFrom="from-slate-600" colorTo="to-slate-800" buttonText="Przeglądaj Pliki" />
          <Card to="/legal-hub" icon="⚖️" title="Zaplecze Prawne" subtitle="Wzory regulaminów i edukacja" colorFrom="from-amber-500" colorTo="to-orange-500" buttonText="Otwórz Akademię" />
          <Card to="/kompendium" icon="📖" title="Kompendium Wiedzy Protokolanta" subtitle="Przewodnik protokolanta — wzory, checklisty, słownik pojęć" colorFrom="from-violet-600" colorTo="to-indigo-800" buttonText="Otwórz Kompendium" />
          <Card
            to="/ksiega-inwentarzowa"
            icon="📒"
            title="Księga Inwentarzowa"
            subtitle="Przewodnik K-205/60 — wpisy, kolumny, procedury"
            colorFrom="from-emerald-600"
            colorTo="to-green-800"
            buttonText="Otwórz Przewodnik"
          />
          <Card to="/lista-dostepowa" icon="🗝️" title="Lista Dostępowa" subtitle="Zgłoszenia dostępu do pomieszczeń" colorFrom="from-cyan-500" colorTo="to-blue-600" buttonText="Otwórz Moduł" />
          <Card to="/ksiega-dokumentow" icon="🏛️" title="Księga Dokumentów" subtitle="Standardy i wzorce dokumentacji SSUEW" colorFrom="from-slate-700" colorTo="to-slate-900" buttonText="Otwórz Księgę" />
          <Card
            to="/archiwum"
            icon="🗄️"
            title="Przewodnik Archiwizacji"
            subtitle="JRWA, klasy akt, checklista roczna, matryca klasyfikacyjna"
            colorFrom="from-amber-700"
            colorTo="to-yellow-900"
            buttonText="Otwórz Przewodnik"
          />
          <Card to="/rodo" icon="🔒" title="Hub RODO" subtitle="Kompendium, dokumenty i narzędzia ochrony danych" colorFrom="from-rose-600" colorTo="to-rose-900" buttonText="Otwórz Hub" />
          {isAdmin && (
            <>
              <Card to="/wnioski" icon="📥" title="Panel Wniosków" subtitle="Zarządzaj dostępem do CRA" colorFrom="from-rose-500" colorTo="to-pink-700" buttonText="Rozpatrz Wnioski" />

              {/* KAFELEK: STATYSTYKI */}
              <button onClick={() => setShowStats(true)}
                className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl isolate [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)] text-left">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 group-hover:scale-110 transition-transform duration-700 -z-10" />
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors -z-10" />
                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">📊</div>
                  <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">Statystyki Systemu</h2>
                  <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 px-2">Odwiedziny i aktywność — tylko Admin</p>
                  <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                    Otwórz Statystyki
                  </div>
                </div>
              </button>

              {/* KAFELEK: HELPDESK — tylko Admin */}
              <button onClick={() => setShowHelpdesk(true)}
                className="group relative block h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl isolate [transform:translateZ(0)] [-webkit-mask-image:-webkit-radial-gradient(white,black)] text-left">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-teal-800 group-hover:scale-110 transition-transform duration-700 -z-10" />
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors -z-10" />
                {tickets.filter(t => t.status === 'new').length > 0 && (
                  <div className="absolute top-4 right-4 z-20 bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                    {tickets.filter(t => t.status === 'new').length} nowych
                  </div>
                )}
                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">🎫</div>
                  <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">HelpDesk SSUEW</h2>
                  <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 px-2">Zgłoszenia użytkowników — tylko Admin</p>
                  <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                    Otwórz Panel
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        <footer className="mt-16 flex flex-col items-center gap-2">
          <div className="h-[1px] w-10 bg-slate-300 opacity-50"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-50">Powered by Samorząd Studentów UEW</p>
          {/* Przycisk zgłoszenia dla zwykłych użytkowników */}
          {!isAdmin && (
            <button onClick={() => { setHelpdeskTab('submit'); setShowHelpdesk(true); }}
              className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-teal-600 transition-colors uppercase tracking-widest">
              <span>🎫</span> Zgłoś problem lub sugestię
            </button>
          )}
          {/* Podpis autora — celowo dyskretny, ale trwale obecny w kodzie i renderze */}
          <p className="text-[9px] text-slate-300 tracking-[0.15em] select-none mt-1">
            system by{' '}
            <span className="font-semibold text-slate-300/70">Mikołaj Radliński</span>
          </p>
        </footer>
      </div>

      {/* ==================================================== */}
      {/* MODAL: STATYSTYKI (TYLKO DLA ADMINA) */}
      {/* ==================================================== */}
      {showStats && isAdmin && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const totalVisits   = stats ? stats.reduce((s, r) => s + (r.total || 0), 0) : 0;
        const todayVisits   = stats ? stats.reduce((s, r) => s + (r.days?.[today] || 0), 0) : 0;
        const totalPages    = stats ? stats.length : 0;
        const topPage       = stats?.[0];
        const barColors     = ['bg-indigo-500','bg-violet-500','bg-blue-500','bg-sky-500','bg-cyan-500',
                               'bg-teal-500','bg-emerald-500','bg-green-500','bg-amber-500','bg-orange-500'];

        const tabs = [
          { id: 'ranking',   label: 'Ranking stron' },
          { id: 'chart',     label: 'Wykres słupkowy' },
          { id: 'today',     label: 'Dzisiaj' },
          { id: 'activity',  label: 'Użytkownicy' },
        ];

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowStats(false)} />
            <div className="relative bg-slate-950 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">

              {/* NAGŁÓWEK */}
              <div className="px-7 pt-7 pb-5 shrink-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Panel Administracyjny</p>
                    <h2 className="text-2xl font-black text-white">Statystyki Systemu</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={loadStats} title="Odśwież"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all text-base">
                      ↻
                    </button>
                    <button onClick={() => setShowStats(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                      <Icons.Close />
                    </button>
                  </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Użytkowników w systemie', value: statsLoading ? '…' : (uniqueUsers ?? '…'),                                                                  color: 'from-indigo-600 to-violet-600', icon: '👥' },
                    { label: 'Aktywnych dziś',           value: statsLoading ? '…' : (todayUsers ?? '…'),                                                                  color: 'from-emerald-600 to-teal-600',  icon: '🟢' },
                    { label: 'Wszystkich wizyt',         value: statsLoading ? '…' : totalVisits.toLocaleString('pl-PL'),                                                  color: 'from-blue-600 to-sky-600',      icon: '👁' },
                    { label: 'Wizyt dzisiaj',            value: statsLoading ? '…' : todayVisits.toLocaleString('pl-PL'),                                                  color: 'from-teal-600 to-cyan-600',     icon: '📅' },
                    { label: 'Podstron w systemie',      value: statsLoading ? '…' : totalPages,                                                                            color: 'from-sky-600 to-blue-600',      icon: '📂' },
                    { label: 'Najpopularniejsza',        value: statsLoading ? '…' : (topPage ? ('/' + topPage.path.replace(/_/g,'/').replace(/^\//,'')) : '—'),            color: 'from-amber-600 to-orange-600',  icon: '🏆', small: true },
                  ].map((k, i) => (
                    <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4`}>
                      <div className="text-xl mb-1">{k.icon}</div>
                      <div className={`font-black text-white leading-tight mb-1 ${k.small ? 'text-xs truncate' : 'text-2xl'}`}>{k.value}</div>
                      <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* TABS */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setStatsTab(t.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        statsTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white/80'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TREŚĆ ZAKŁADKI */}
              <div className="overflow-y-auto flex-1 px-7 pb-7">
                {statsLoading ? (
                  <div className="space-y-3 pt-2">
                    {[...Array(7)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-xl" />)}
                  </div>
                ) : !stats || stats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/30">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-sm font-bold">Brak danych</p>
                    <p className="text-xs mt-1">Dane pojawią się po pierwszych odwiedzinach podstron</p>
                  </div>
                ) : statsTab === 'ranking' ? (
                  <div className="space-y-2 pt-2">
                    {stats.map((row, i) => {
                      const label = '/' + row.path.replace(/_/g, '/').replace(/^\//, '');
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      return (
                        <div key={row.path} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 transition-colors">
                          <span className="w-6 text-center text-sm shrink-0">{medal || <span className="text-white/30 text-xs font-bold">{i + 1}</span>}</span>
                          <span className="flex-1 text-sm font-mono text-white/80 truncate">{label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {row.days?.[today] > 0 && (
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                +{row.days[today]} dziś
                              </span>
                            )}
                            <span className="text-base font-black text-white w-12 text-right">{row.total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : statsTab === 'chart' ? (
                  <div className="pt-4 space-y-3">
                    {stats.slice(0, 12).map((row, i) => {
                      const label = '/' + row.path.replace(/_/g, '/').replace(/^\//, '');
                      const max = stats[0]?.total || 1;
                      const pct = Math.round(((row.total || 0) / max) * 100);
                      const color = barColors[i % barColors.length];
                      return (
                        <div key={row.path}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-white/60 truncate max-w-[240px]">{label}</span>
                            <span className="text-xs font-black text-white ml-2">{row.total}</span>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-3 ${color} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : statsTab === 'today' ? (
                  <div className="pt-2 space-y-2">
                    {stats.filter(r => (r.days?.[today] || 0) > 0)
                      .sort((a, b) => (b.days?.[today] || 0) - (a.days?.[today] || 0))
                      .map(row => {
                        const label = '/' + row.path.replace(/_/g, '/').replace(/^\//, '');
                        const max = Math.max(...stats.map(r => r.days?.[today] || 0), 1);
                        const pct = Math.round(((row.days?.[today] || 0) / max) * 100);
                        return (
                          <div key={row.path} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 transition-colors">
                            <span className="flex-1 text-sm font-mono text-white/80 truncate">{label}</span>
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden shrink-0">
                              <div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-emerald-400 font-black text-sm w-8 text-right shrink-0">{row.days[today]}</span>
                          </div>
                        );
                      })}
                    {stats.every(r => !(r.days?.[today] > 0)) && (
                      <div className="text-center py-12 text-white/30">
                        <div className="text-4xl mb-2">🌙</div>
                        <p className="text-sm font-bold">Brak odwiedzin dzisiaj</p>
                      </div>
                    )}
                  </div>
                ) : /* activity */ (
                  <div className="pt-2 space-y-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest px-1 mb-3">Wszyscy zarejestrowani użytkownicy — sortowanie: ostatnia aktywność</p>
                    {userActivity.map((u, i) => {
                      const isToday = u.lastSeen === today;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 transition-colors">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isToday ? 'bg-emerald-400' : 'bg-white/20'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.displayName || '—'}</p>
                            <p className="text-xs text-white/40 truncate">{u.email}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                              {isToday ? 'Dziś' : (u.lastSeen || '—')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {userActivity.length === 0 && (
                      <div className="text-center py-12 text-white/30">
                        <div className="text-4xl mb-2">👥</div>
                        <p className="text-sm font-bold">Brak danych użytkowników</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="px-7 py-4 border-t border-white/10 shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                  {statsRefreshedAt ? `Odświeżono: ${statsRefreshedAt.toLocaleTimeString('pl-PL')}` : 'Tylko zalogowani użytkownicy'}
                </p>
                <button onClick={loadStats}
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">
                  Odśwież
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* MODAL: HELPDESK SSUEW */}
      {/* ==================================================== */}
      {showHelpdesk && (() => {
        const CATEGORIES = [
          { id: 'bug',        label: '🐛 Błąd w systemie',         color: 'bg-rose-100 text-rose-700 border-rose-200'   },
          { id: 'question',   label: '❓ Pytanie / pomoc',          color: 'bg-blue-100 text-blue-700 border-blue-200'   },
          { id: 'suggestion', label: '💡 Pomysł / sugestia',        color: 'bg-amber-100 text-amber-700 border-amber-200'},
          { id: 'technical',  label: '🔧 Problem techniczny',       color: 'bg-slate-100 text-slate-700 border-slate-200'},
        ];
        const STATUS_MAP = {
          new:         { label: 'Nowe',        color: 'bg-rose-100 text-rose-700'     },
          in_progress: { label: 'W trakcie',   color: 'bg-amber-100 text-amber-700'   },
          closed:      { label: 'Zamknięte',   color: 'bg-emerald-100 text-emerald-700' },
        };
        const hdTabs = isAdmin
          ? [{ id: 'all', label: '📋 Wszystkie zgłoszenia' }, { id: 'submit', label: '✏️ Nowe zgłoszenie' }]
          : [{ id: 'submit', label: '✏️ Nowe zgłoszenie' }, { id: 'my', label: '📂 Moje zgłoszenia' }];

        const myTickets = tickets.filter(t => t.userId === user?.uid);
        const newCount  = tickets.filter(t => t.status === 'new').length;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowHelpdesk(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

              {/* NAGŁÓWEK */}
              <div className="bg-gradient-to-r from-cyan-600 to-teal-700 px-7 pt-6 pb-0 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-cyan-200 uppercase tracking-[0.2em] mb-0.5">System Zgłoszeń</p>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      HelpDesk SSUEW
                      {isAdmin && newCount > 0 && (
                        <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">{newCount} nowych</span>
                      )}
                    </h2>
                  </div>
                  <button onClick={() => setShowHelpdesk(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all">
                    <Icons.Close />
                  </button>
                </div>
                <div className="flex gap-0.5">
                  {hdTabs.map(t => (
                    <button key={t.id} onClick={() => setHelpdeskTab(t.id)}
                      className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all ${
                        helpdeskTab === t.id ? 'bg-white text-teal-700' : 'text-cyan-200 hover:text-white hover:bg-white/10'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TREŚĆ */}
              <div className="flex-1 overflow-y-auto bg-slate-50">

                {/* ══ FORMULARZ NOWEGO ZGŁOSZENIA ══ */}
                {helpdeskTab === 'submit' && (
                  <div className="p-6 space-y-5">
                    {submitSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-black text-emerald-800">Zgłoszenie wysłane!</p>
                          <p className="text-xs text-emerald-600 mt-0.5">Admin zostanie powiadomiony. Możesz śledzić status w zakładce „Moje zgłoszenia".</p>
                        </div>
                      </div>
                    )}

                    {/* Kategoria */}
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Kategoria</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map(c => (
                          <button key={c.id} onClick={() => setHelpdeskForm(f => ({ ...f, category: c.id }))}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all ${
                              helpdeskForm.category === c.id ? c.color + ' ring-2 ring-offset-1 ring-teal-400' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tytuł */}
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Tytuł zgłoszenia</label>
                      <input
                        value={helpdeskForm.title}
                        onChange={e => setHelpdeskForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Krótki opis problemu lub pytania…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    {/* Opis */}
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Szczegółowy opis</label>
                      <textarea
                        value={helpdeskForm.description}
                        onChange={e => setHelpdeskForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Opisz dokładnie co się stało, gdzie wystąpił błąd, jak go odtworzyć…"
                        rows={5}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                      />
                    </div>

                    <button onClick={submitTicket} disabled={submitting || !helpdeskForm.title.trim() || !helpdeskForm.description.trim()}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-200 transition-all active:scale-[0.98]">
                      {submitting ? 'Wysyłanie…' : 'Wyślij zgłoszenie →'}
                    </button>
                  </div>
                )}

                {/* ══ MOJE ZGŁOSZENIA ══ */}
                {helpdeskTab === 'my' && (
                  <div className="p-6">
                    {ticketsLoading ? (
                      <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />)}</div>
                    ) : myTickets.length === 0 ? (
                      <div className="text-center py-16 text-slate-300">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-sm font-bold text-slate-400">Brak twoich zgłoszeń</p>
                        <p className="text-xs mt-1">Przejdź do zakładki „Nowe zgłoszenie", aby coś zgłosić.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myTickets.map(t => {
                          const cat = CATEGORIES.find(c => c.id === t.category);
                          const st  = STATUS_MAP[t.status] || STATUS_MAP.new;
                          const date = t.createdAt?.toDate?.()?.toLocaleDateString('pl-PL') || '—';
                          return (
                            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cat?.color || ''}`}>{cat?.label || t.category}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                  </div>
                                  <p className="font-bold text-slate-800 text-sm">{t.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{date}</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">{t.description}</p>
                              {t.adminResponse && (
                                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Odpowiedź admina</p>
                                  <p className="text-sm text-teal-900">{t.adminResponse}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ WSZYSTKIE ZGŁOSZENIA (ADMIN) ══ */}
                {helpdeskTab === 'all' && (
                  <div className="p-6">
                    {ticketsLoading ? (
                      <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}</div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-16 text-slate-300">
                        <div className="text-5xl mb-3">🎫</div>
                        <p className="text-sm font-bold text-slate-400">Brak zgłoszeń</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tickets.map(t => {
                          const cat = CATEGORIES.find(c => c.id === t.category);
                          const st  = STATUS_MAP[t.status] || STATUS_MAP.new;
                          const date = t.createdAt?.toDate?.()?.toLocaleDateString('pl-PL') || '—';
                          return (
                            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                              {/* Nagłówek ticketu */}
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cat?.color || ''}`}>{cat?.label || t.category}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                  </div>
                                  <p className="font-bold text-slate-800">{t.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{t.userName} · {t.userEmail} · {date}</p>
                                </div>
                                {/* Status selector */}
                                <select value={t.status} onChange={e => updateTicketStatus(t.id, e.target.value)}
                                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 shrink-0">
                                  <option value="new">Nowe</option>
                                  <option value="in_progress">W trakcie</option>
                                  <option value="closed">Zamknięte</option>
                                </select>
                              </div>

                              {/* Treść */}
                              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">{t.description}</p>

                              {/* Istniejąca odpowiedź */}
                              {t.adminResponse && (
                                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Twoja odpowiedź</p>
                                  <p className="text-sm text-teal-900">{t.adminResponse}</p>
                                </div>
                              )}

                              {/* Pole odpowiedzi admina */}
                              <div className="flex gap-2">
                                <input
                                  value={adminReply[t.id] || ''}
                                  onChange={e => setAdminReply(r => ({ ...r, [t.id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && sendAdminReply(t.id)}
                                  placeholder={t.adminResponse ? 'Zaktualizuj odpowiedź…' : 'Napisz odpowiedź…'}
                                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                <button onClick={() => sendAdminReply(t.id)}
                                  disabled={!(adminReply[t.id] || '').trim()}
                                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-sm font-black transition-all shrink-0">
                                  Wyślij
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* FOOTER */}
              <div className="px-7 py-3.5 border-t border-slate-100 shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Zgłoszenia · Firestore · HelpDesk SSUEW</p>
                <button onClick={loadTickets} className="text-xs font-black text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider">↻ Odśwież</button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  onChange={(e) => setNoticeForm({ ...noticeForm, target: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="ALL">Wszyscy Użytkownicy (Studenci, Organizacje)</option>
                  <option value="ADMIN">Tylko Zarząd / Administratorzy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Priorytet (Kolor Kafelka)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setNoticeForm({ ...noticeForm, type: 'info' })} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Zwykła<br />(Niebieski)</button>
                  <button type="button" onClick={() => setNoticeForm({ ...noticeForm, type: 'warning' })} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Ważne<br />(Żółty)</button>
                  <button type="button" onClick={() => setNoticeForm({ ...noticeForm, type: 'urgent' })} className={`p-3 rounded-xl border text-xs font-bold transition-all ${noticeForm.type === 'urgent' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Pilne!<br />(Czerwony)</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Treść Komunikatu</label>
                <textarea
                  required
                  value={noticeForm.text}
                  onChange={(e) => setNoticeForm({ ...noticeForm, text: e.target.value })}
                  placeholder="Np. Przypominamy o konieczności rozliczenia projektów do końca tygodnia!"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-24"
                />
              </div>
            </div>

            {noticeError && (
              <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700 animate-fadeIn">
                ❌ {noticeError}
              </div>
            )}

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowNoticeModal(false); setNoticeError(''); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
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