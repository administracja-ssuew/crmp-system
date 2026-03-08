import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';
const HOURS = Array.from({ length: 24 }, (_, i) => i); 

const CAMPUS_ROOMS = {
  '10 A': { days: [2, 3], start: 18, end: 22 }, 
  '213 Z': { days: [4, 5], start: 18, end: 22 }, 
  '214 Z': { days: [1, 5], start: 18, end: 22 }
};

// 🔒 BIAŁA LISTA ADMINISTRATORÓW (Zmień na Wasze maile)
const ADMIN_EMAILS = [
  'twoj.mail@uew.edu.pl',
  'inny.czlonek.zarzadu@uew.edu.pl',
  'administracja@samorzad.ue.wroc.pl'
];

const PALETTE = [
  'bg-indigo-600', 'bg-blue-500', 'bg-sky-400', 
  'bg-emerald-500', 'bg-lime-500', 'bg-fuchsia-500', 
  'bg-purple-600', 'bg-red-500', 'bg-red-800', 
  'bg-orange-400', 'bg-amber-500', 'bg-slate-600'
];

const EMPTY_FORM = {
  applicantName: '', email: '', orgType: 'Samorząd Studentów UEW', org: 'Samorząd Studentów', title: '',
  date: '', room: '9J', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
};

// === WKLEJ TO TUTAJ ===
const formatTime = (timeStr) => {
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    return timeStr.split('T')[1].substring(0, 5);
  }
  return timeStr;
};
// =====================

export default function CalendarSamorzadPage({ userEmail }) {
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  const [filterRoom, setFilterRoom] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // NOWOŚĆ: Stan przechowujący zakres widoczności kalendarza (3, 7 lub 30 dni)
  const [viewRange, setViewRange] = useState(3);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [calendarData, setCalendarData] = useState({ sale: [], przedluzenia: [], pending: [] });
  
  const [processingId, setProcessingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [bookingForm, setBookingForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [expandedReq, setExpandedReq] = useState(null);
  const [eventColor, setEventColor] = useState('bg-indigo-600');

  const [isExtModalOpen, setIsExtModalOpen] = useState(false);
  const [extForm, setExtForm] = useState({ date: '', until: '03:00', note: 'Zgoda Kanclerza na przedłużenie' });
  const [isExtSubmitting, setIsExtSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      const data = await response.json();
      if (!data.error) setCalendarData(data);
    } catch (error) {
      console.error("Błąd pobierania kalendarza:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // Inteligentne przewijanie kalendarza (O 1 dzień w widoku 3D, lub o cały blok w widoku 7D/30D)
  const nextDay = () => { 
    const d = new Date(currentDate); 
    d.setDate(currentDate.getDate() + (viewRange === 3 ? 1 : viewRange)); 
    setCurrentDate(d); 
  };
  const prevDay = () => { 
    const d = new Date(currentDate); 
    d.setDate(currentDate.getDate() - (viewRange === 3 ? 1 : viewRange)); 
    setCurrentDate(d); 
  };

  // Dynamiczne generowanie listy dni do wyświetlenia
  const daysToShow = Array.from({ length: viewRange }).map((_, offset) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  const checkCollision = (form, ignoreId = null) => {
    const toFloat = (timeStr) => parseFloat(timeStr.split(':')[0]) + parseFloat(timeStr.split(':')[1] || 0)/60;
    const reqStart = toFloat(form.start);
    const reqEnd = toFloat(form.end);
    const allEvents = [...(calendarData.sale || []), ...(calendarData.pending || [])];

    return allEvents.some(ev => {
      if (ignoreId && ev.id === ignoreId) return false;
      const evDate = ev.date ? ev.date.toString().substring(0, 10) : '';
      if (evDate !== form.date || ev.room !== form.room) return false;
      const evStart = toFloat(ev.start);
      const evEnd = toFloat(ev.end);
      return (reqStart < evEnd && reqEnd > evStart);
    });
  };

  const handleSubmitBooking = async () => {
    setBookingError('');
    if (!bookingForm.title || !bookingForm.date) return setBookingError('Wypełnij wymagane pola.');
    if (bookingForm.start >= bookingForm.end) return setBookingError('Koniec musi być po starcie.');
    if (checkCollision(bookingForm)) return setBookingError('KOLIZJA! Sala jest zajęta.');

    setIsSubmitting(true);
    try {
      const payload = {
        ...bookingForm,
        action: "submitBooking",
        rodo: true,
        applicantName: userEmail || "Zalogowany Użytkownik"
      };

      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert('Wysłano wniosek wewnętrzny (Oczekuje na akceptację Admina).');
      setIsModalOpen(false);
      setBookingForm(EMPTY_FORM);
      fetchData();
    } catch (e) {
      setBookingError('Błąd połączenia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (req) => {
    if (checkCollision({ date: req.date.substring(0,10), room: req.room, start: req.start, end: req.end }, req.id)) {
      alert('Nie można zatwierdzić! Sala została w międzyczasie zajęta.'); return;
    }

    setProcessingId(req.id);

    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "approveBooking", rowId: req.id, date: req.date.substring(0,10), room: req.room, start: req.start, end: req.end, org: req.org, title: req.title, color: eventColor })
      });
      alert('Zatwierdzono! Wniosek wpisany do oficjalnego kalendarza.');
      setExpandedReq(null); 
      fetchData(); 
    } catch (e) {
      alert('Błąd akceptacji.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req) => {
    const confirmReject = window.confirm(`Czy na pewno chcesz ODRZUCIĆ wniosek organizacji ${req.org}?`);
    if (!confirmReject) return;

    setProcessingId(req.id);

    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "rejectBooking", rowId: req.id })
      });
      alert('Wniosek został odrzucony i usunięty z listy oczekujących.');
      fetchData(); 
    } catch (e) {
      alert('Błąd podczas odrzucania wniosku.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddExtension = async () => {
    if (!extForm.date || !extForm.until || !extForm.note) return alert('Wypełnij wszystkie pola!');
    
    setIsExtSubmitting(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "addExtension", ...extForm })
      });
      alert('Przedłużenie zostało dodane do kalendarza!');
      setIsExtModalOpen(false);
      setExtForm({ date: '', until: '03:00', note: 'Zgoda Kanclerza na przedłużenie' });
      fetchData(); 
    } catch (e) {
      alert('Błąd dodawania przedłużenia.');
    } finally {
      setIsExtSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedReq === id) {
      setExpandedReq(null);
    } else {
      setExpandedReq(id);
      setEventColor('bg-indigo-600'); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/kalendarz-wybor" className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block">← Wróć do wyboru</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Kalendarz <span className="text-emerald-600">Samorządu</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pełny grafik sal Samorządu i przestrzeni uczelnianych.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-w-md scrollbar-hide">
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                <button onClick={() => setFilterRoom('9J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>
                <button onClick={() => setFilterRoom('16J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                <button onClick={() => setFilterRoom('10 A')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '10 A' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>10 A</button>
                <button onClick={() => setFilterRoom('213 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '213 Z' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>213 Z</button>
                <button onClick={() => setFilterRoom('214 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '214 Z' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>214 Z</button>
            </div>

            {isAdmin && (
              <>
                <button onClick={() => setIsExtModalOpen(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                  🌙 <span className="hidden md:inline">Przedłużenie</span>
                </button>
                
                <button onClick={() => setIsPendingModalOpen(true)} className="relative bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                  ⏳ Oczekujące
                  {calendarData.pending?.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{calendarData.pending.length}</span>}
                </button>
              </>
            )}

            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                <span>+</span> Złóż Wniosek
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 animate-slideUp">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevDay} className="w-10 h-10 rounded-full bg-slate-100 text-indigo-600 font-bold hover:bg-indigo-100 transition">←</button>
          
          <div className="text-center flex flex-col items-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Zakres widoczności</span>
            <div className="flex gap-1 mb-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
               <button onClick={() => setViewRange(3)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewRange === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>3 DNI</button>
               <button onClick={() => setViewRange(7)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewRange === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>TYDZIEŃ</button>
               <button onClick={() => setViewRange(30)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewRange === 30 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>MIESIĄC</button>
            </div>
            <span className="text-lg font-black text-slate-800">
              {new Date(daysToShow[0]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {new Date(daysToShow[daysToShow.length - 1]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button onClick={nextDay} className="w-10 h-10 rounded-full bg-slate-100 text-indigo-600 font-bold hover:bg-indigo-100 transition">→</button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-12 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
        ) : (
          daysToShow.map(dayDate => {
            const dateObj = new Date(dayDate);
            const dayOfWeek = dateObj.getDay();
            const isWorkingDay = [1, 2, 3, 4, 5].includes(dayOfWeek);
            
            const extension = calendarData.przedluzenia?.find(e => e.date?.substring(0, 10) === dayDate);

            let dailyRooms = ['9J', '16J', '28J'];
            Object.keys(CAMPUS_ROOMS).forEach(room => { if (CAMPUS_ROOMS[room].days.includes(dayOfWeek)) dailyRooms.push(room); });
            const roomsToRender = dailyRooms.filter(r => filterRoom === 'ALL' || filterRoom === r);
            const allEvents = [...(calendarData.sale || []), ...(calendarData.pending || [])];

            return (
              <div key={dayDate} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-6">
                
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-1.5 w-14 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{dateObj.toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
                            <span className="text-xl font-black text-slate-900">{dateObj.getDate()}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm">{dateObj.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h3>
                            
                          {extension && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 mt-1 shadow-sm">
                            🌙 {extension.note} (do {formatTime(extension.until)})
                            </span>
                          )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[1200px] p-4">
                    <div className="flex mb-2 pl-14">{HOURS.map(h => <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-300 border-l">{String(h).padStart(2, '0')}:00</div>)}</div>
                    
                    {roomsToRender.map(room => {
                        const campusRules = CAMPUS_ROOMS[room];

                        return (
                        <div key={room} className="flex items-center mb-2 relative h-12">
                          <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border h-full text-xs sticky left-0 z-20">{room}</div>
                          <div className="flex-grow bg-slate-50/30 rounded-r-xl border h-full relative flex overflow-hidden">
                            {HOURS.map(h => <div key={h} className="flex-1 border-l"></div>)}
                            
                            {campusRules && (
                              <>
                                <div className="absolute top-0 bottom-0 left-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${(campusRules.start / 24) * 100}%`}}>
                                  <span className="text-[10px] font-bold text-slate-400 opacity-50 px-2 truncate">SALA ZABLOKOWANA</span>
                                </div>
                                <div className="absolute top-0 bottom-0 right-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${((24 - campusRules.end) / 24) * 100}%`}}>
                                </div>
                              </>
                            )}

                            {room === '9J' && isWorkingDay && (
                              <div className="absolute top-1 bottom-1 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-lg z-0 flex items-center justify-center pointer-events-none" 
                                   style={{ left: `${(8 / 24) * 100}%`, width: `${((16-8) / 24) * 100}%` }}>
                                <span className="text-[10px] font-black text-emerald-600/70 tracking-widest uppercase px-2 bg-emerald-50 rounded-full truncate">Wolny Dostęp</span>
                              </div>
                            )}

                            {allEvents.filter(ev => ev.date?.substring(0, 10) === dayDate && ev.room === room).map((ev, idx) => {
                                const startH = parseFloat(ev.start.split(':')[0]) + parseFloat(ev.start.split(':')[1] || 0)/60;
                                const endH = parseFloat(ev.end.split(':')[0]) + parseFloat(ev.end.split(':')[1] || 0)/60;
                                const isPending = ev.status === 'OCZEKUJE';
                                const color = isPending ? 'bg-amber-400 opacity-80 border border-amber-600' : (ev.color || 'bg-indigo-500');
                                return (
                                  <div key={idx} className={`absolute top-1 bottom-1 rounded-lg ${color} shadow-sm flex items-center justify-center hover:scale-[1.02] z-10`} style={{ left: `${(startH/24)*100}%`, width: `${((endH-startH)/24)*100}%` }} title={`${ev.title} (${ev.start} - ${ev.end})`}><span className="text-[9px] font-black text-white px-1 truncate">{ev.title} {isPending && '⏳'}</span></div>
                                );
                            })}
                          </div>
                        </div>
                    )})}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-bounceIn">
             <h2 className="text-2xl font-black text-slate-900 mb-6">Szybka Rezerwacja Wewnętrzna</h2>
             <div className="space-y-4">
                <input type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
                <select value={bookingForm.room} onChange={e => setBookingForm({...bookingForm, room: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold">
                  <option value="9J">Sala 9J</option><option value="16J">Sala 16J</option><option value="28J">Sala 28J</option>
                  {Object.keys(CAMPUS_ROOMS).map(r => <option key={r} value={r}>Sala {r}</option>)}
                </select>
                <div className="flex gap-4">
                   <input type="time" value={bookingForm.start} onChange={e => setBookingForm({...bookingForm, start: e.target.value})} className="w-1/2 bg-slate-50 border p-3 rounded-xl font-bold" />
                   <input type="time" value={bookingForm.end} onChange={e => setBookingForm({...bookingForm, end: e.target.value})} className="w-1/2 bg-slate-50 border p-3 rounded-xl font-bold" />
                </div>
                <input type="text" placeholder="Cel spotkania np. Zarząd" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
                
                {bookingError && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{bookingError}</p>}
                
                <button onClick={handleSubmitBooking} disabled={isSubmitting} className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition mt-4">
                  {isSubmitting ? 'Wysyłanie...' : 'Wyślij Wniosek'}
                </button>
             </div>
           </div>
        </div>
      )}

      {isAdmin && isExtModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExtModalOpen(false)}></div>
           <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-bounceIn">
             <div className="flex items-center gap-3 mb-6">
               <span className="text-3xl">🌙</span>
               <h2 className="text-2xl font-black text-slate-900 leading-tight">Zgoda na przedłużenie</h2>
             </div>
             <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-600 ml-1">Data *</label><input type="date" value={extForm.date} onChange={e => setExtForm({...extForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold mt-1 focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 ml-1">Do której godziny? *</label><input type="time" value={extForm.until} onChange={e => setExtForm({...extForm, until: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold mt-1 focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 ml-1">Krótka notatka</label><input type="text" value={extForm.note} onChange={e => setExtForm({...extForm, note: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold mt-1 focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                
                <button onClick={handleAddExtension} disabled={isExtSubmitting} className="w-full py-4 bg-amber-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-200 mt-4 disabled:bg-slate-300">
                  {isExtSubmitting ? 'Zapisywanie...' : 'Dodaj wpis'}
                </button>
             </div>
           </div>
        </div>
      )}

      {isAdmin && isPendingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPendingModalOpen(false)}></div>
           <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-bounceIn">
             
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem] shrink-0">
               <div><h2 className="text-2xl font-black text-slate-900">Skrzynka Podawcza 📥</h2></div>
               <button onClick={() => setIsPendingModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">✕</button>
             </div>
             
             <div className="p-6 overflow-y-auto bg-slate-50 flex-grow">
               {calendarData.pending?.length === 0 ? (
                 <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm"><span className="text-5xl opacity-30 mb-4 block">☕</span><p className="font-bold text-slate-500 text-lg">Brak nowych wniosków</p></div>
               ) : (
                 <div className="space-y-4">
                   {calendarData.pending?.map(req => {
                     const isExpanded = expandedReq === req.id;
                     return (
                       <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                         <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition" onClick={() => toggleExpand(req.id)}>
                           <div>
                             <div className="flex items-center gap-3 mb-2">
                               <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{req.room}</span>
                               <span className="text-sm font-bold text-slate-700 flex items-center gap-1">📅 {req.date?.substring(0,10)} <span className="text-slate-300 mx-1">|</span> 🕒 {req.start} - {req.end}</span>
                             </div>
                             <h3 className="text-lg font-black text-slate-900">{req.org}</h3>
                             <p className="text-sm font-bold text-slate-500">{req.title}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button 
                               disabled={processingId === req.id}
                               onClick={(e) => { e.stopPropagation(); handleApprove(req); }} 
                               className={`px-4 py-2 rounded-xl font-bold transition text-sm ${processingId === req.id ? 'bg-slate-400 text-white cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-200'}`}
                             >
                               {processingId === req.id ? '⏳...' : 'Akceptuj'}
                             </button>
                             <button 
                               disabled={processingId === req.id}
                               onClick={(e) => { e.stopPropagation(); handleReject(req); }} 
                               className={`px-4 py-2 rounded-xl font-bold transition text-sm ${processingId === req.id ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-wait' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}
                             >
                               Odrzuć
                             </button>
                             <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''} ml-2`}>▼</span>
                           </div>
                         </div>

                         {isExpanded && (
                           <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                             <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Wybierz kolor kafelka w kalendarzu</p>
                               <div className="flex flex-wrap gap-3">
                                 {PALETTE.map(colorClass => (
                                   <button 
                                     key={colorClass}
                                     onClick={(e) => { e.stopPropagation(); setEventColor(colorClass); }}
                                     className={`w-8 h-8 rounded-full ${colorClass} transition-all duration-200 ${eventColor === colorClass ? 'ring-4 ring-offset-2 ring-slate-300 scale-110 shadow-md' : 'hover:scale-110 hover:shadow-sm'}`}
                                     title={`Użyj koloru: ${colorClass}`}
                                   />
                                 ))}
                               </div>
                               <p className="text-[10px] text-slate-400 mt-3 italic">Ten kolor zostanie przypisany do wydarzenia po kliknięciu "Akceptuj".</p>
                             </div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zgłaszający</p><p className="font-bold text-slate-800">{req.applicantName}</p><p className="text-sm text-indigo-600 font-medium">{req.email}</p></div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Typ</p><p className="font-bold text-slate-800">{req.orgType}</p></div>
                             <div className="md:col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uzasadnienie</p><div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 italic">"{req.justification}"</div></div>
                             {req.notes && <div className="md:col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uwagi</p><div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 font-medium">{req.notes}</div></div>}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}