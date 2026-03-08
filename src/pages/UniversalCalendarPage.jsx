import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// !!! UWAGA: Upewnij się, że to Twój najnowszy link po wdrożeniu skryptu! !!!
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';
const HOURS = Array.from({ length: 24 }, (_, i) => i); 

const CAMPUS_ROOMS = {
  '10 A': { days: [2, 3], start: 18, end: 22 }, 
  '213 Z': { days: [4, 5], start: 18, end: 22 }, 
  '214 Z': { days: [1, 5], start: 18, end: 22 }
};

const EMPTY_FORM = {
  applicantName: '', email: '', orgType: 'Organizacja Studencka / Koło Naukowe', org: '', title: '',
  date: '', room: '28J', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
};

// Funkcja naprawiająca format godziny wysyłany przez Google Sheets (ucinamy datę 1899-12-30)
const formatTime = (timeStr) => {
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    return timeStr.split('T')[1].substring(0, 5);
  }
  return timeStr;
};

export default function UniversalCalendarPage() {
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // NOWOŚĆ: Stan przechowujący zakres widoczności kalendarza (3, 7 lub 30 dni)
  const [viewRange, setViewRange] = useState(3);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarData, setCalendarData] = useState({ sale: [], przedluzenia: [], pending: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [bookingForm, setBookingForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

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

  useEffect(() => { fetchData(); }, []);

  // Nawigacja dat (przeskok o 1 dzień w widoku 3D, lub o cały blok w widoku 7D/30D)
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

  const daysToShow = Array.from({ length: viewRange }).map((_, offset) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  const checkCollision = (form) => {
    const toFloat = (timeStr) => parseFloat(timeStr.split(':')[0]) + parseFloat(timeStr.split(':')[1] || 0)/60;
    const reqStart = toFloat(form.start);
    const reqEnd = toFloat(form.end);
    const allEvents = [...(calendarData.sale || []), ...(calendarData.pending || [])];

    return allEvents.some(ev => {
      const evDate = ev.date ? ev.date.toString().substring(0, 10) : '';
      if (evDate !== form.date || ev.room !== form.room) return false;
      const evStart = toFloat(ev.start);
      const evEnd = toFloat(ev.end);
      return (reqStart < evEnd && reqEnd > evStart);
    });
  };

  const handleSubmitBooking = async () => {
    setBookingError('');
    if (!bookingForm.applicantName || !bookingForm.email || !bookingForm.org || !bookingForm.title || !bookingForm.date || !bookingForm.justification) {
      return setBookingError('Wypełnij wszystkie wymagane pola (*).');
    }
    if (!bookingForm.rodo) return setBookingError('Musisz zaakceptować klauzulę RODO.');
    if (bookingForm.start >= bookingForm.end) return setBookingError('Godzina zakończenia musi być późniejsza.');
    if (checkCollision(bookingForm)) return setBookingError('KOLIZJA! Sala jest już zajęta w tym terminie (lub wniosek oczekuje).');

    setIsSubmitting(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "submitBooking", ...bookingForm })
      });
      alert('Wniosek został wysłany! Oczekuje na weryfikację Administracji.');
      setIsModalOpen(false);
      setBookingForm(EMPTY_FORM);
      fetchData(); 
    } catch (e) {
      setBookingError('Błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/kalendarz-wybor" className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block">← Wróć do wyboru</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Kalendarz <span className="text-blue-600">Organizacji</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Rezerwacja sali 28J oraz wyznaczonych sal uczelnianych.</p>
        </div>

        <div className="flex gap-4 items-center">
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-w-md scrollbar-hide">
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                <button onClick={() => setFilterRoom('10 A')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '10 A' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>10 A</button>
                <button onClick={() => setFilterRoom('213 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '213 Z' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>213 Z</button>
                <button onClick={() => setFilterRoom('214 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '214 Z' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>214 Z</button>
            </div>
            
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
            
            const extension = calendarData.przedluzenia?.find(e => e.date?.substring(0, 10) === dayDate);

            let dailyRooms = ['28J'];
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
                            
                            {/* POPRAWIONY FORMAT GODZINY PRZEDŁUŻENIA */}
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
           <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-bounceIn">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Wniosek o Rezerwację</h2>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">✕</button>
             </div>
             <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-xs font-bold text-slate-600 ml-1">Imię i nazwisko *</label><input type="text" value={bookingForm.applicantName} onChange={e => setBookingForm({...bookingForm, applicantName: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold mt-1" /></div>
                  <div><label className="text-xs font-bold text-slate-600 ml-1">E-mail *</label><input type="email" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold mt-1" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-600 ml-1">Organizacja *</label><input type="text" value={bookingForm.org} onChange={e => setBookingForm({...bookingForm, org: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold mt-1" /></div>
                <div><label className="text-xs font-bold text-slate-600 ml-1">Wydarzenie *</label><input type="text" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold mt-1" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div><label className="text-xs font-black text-indigo-800 ml-1 uppercase">Data *</label><input type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold mt-1" /></div>
                  <div>
                    <label className="text-xs font-black text-indigo-800 ml-1 uppercase">Sala *</label>
                    <select value={bookingForm.room} onChange={e => setBookingForm({...bookingForm, room: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold mt-1">
                      <option value="28J">Sala 28J</option>
                      {Object.keys(CAMPUS_ROOMS).map(r => <option key={r} value={r}>Sala {r}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-black text-indigo-800 ml-1 uppercase">Start *</label><input type="time" value={bookingForm.start} onChange={e => setBookingForm({...bookingForm, start: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold mt-1" /></div>
                  <div><label className="text-xs font-black text-indigo-800 ml-1 uppercase">Koniec *</label><input type="time" value={bookingForm.end} onChange={e => setBookingForm({...bookingForm, end: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold mt-1" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-600 ml-1">Uzasadnienie *</label><textarea value={bookingForm.justification} onChange={e => setBookingForm({...bookingForm, justification: e.target.value})} rows="2" className="w-full bg-slate-50 border p-3 rounded-xl font-medium mt-1"></textarea></div>
                <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3">
                  <input type="checkbox" id="rodo" checked={bookingForm.rodo} onChange={e => setBookingForm({...bookingForm, rodo: e.target.checked})} className="mt-1 w-5 h-5 rounded" />
                  <label htmlFor="rodo" className="text-[10px] text-slate-500 leading-tight">Akceptuję klauzulę informacyjną i wyrażam zgodę na przetwarzanie danych. *</label>
                </div>
                {bookingError && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 text-center">{bookingError}</p>}
             </div>
             <div className="p-4 border-t border-slate-100 bg-white rounded-b-[2rem]">
                <button onClick={handleSubmitBooking} disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition">
                  {isSubmitting ? 'Przetwarzanie...' : 'Wyślij Wniosek'}
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}