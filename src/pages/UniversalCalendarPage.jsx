import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

export default function UniversalCalendarPage() {
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
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

  const nextDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() + 1); setCurrentDate(d); };
  const prevDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() - 1); setCurrentDate(d); };

  const daysToShow = [0, 1, 2].map(offset => {
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
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>ALL</button>
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>28J</button>
            </div>
            
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                <span>+</span> Złóż Wniosek
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 animate-slideUp">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevDay} className="w-10 h-10 rounded-full bg-slate-100 text-indigo-600 font-bold hover:bg-indigo-100">→</button>
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase">Zakres widoczności</span>
            <span className="text-lg font-black text-slate-800">{new Date(daysToShow[0]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {new Date(daysToShow[2]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
          </div>
          <button onClick={nextDay} className="w-10 h-10 rounded-full bg-slate-100 text-indigo-600 font-bold hover:bg-indigo-100">→</button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-12 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
        ) : (
          daysToShow.map(dayDate => {
            const dateObj = new Date(dayDate);
            const dayOfWeek = dateObj.getDay();
            let dailyRooms = ['28J'];
            Object.keys(CAMPUS_ROOMS).forEach(room => { if (CAMPUS_ROOMS[room].days.includes(dayOfWeek)) dailyRooms.push(room); });
            const roomsToRender = dailyRooms.filter(r => filterRoom === 'ALL' || filterRoom === r);
            const allEvents = [...(calendarData.sale || []), ...(calendarData.pending || [])];

            return (
              <div key={dayDate} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-6">
                <div className="bg-slate-50 p-3 border-b flex items-center gap-3">
                    <div className="flex flex-col items-center bg-white border rounded-xl p-1.5 w-12"><span className="text-[9px] font-bold text-slate-400">{dateObj.toLocaleDateString('pl-PL', { weekday: 'short' })}</span><span className="text-lg font-black text-slate-900">{dateObj.getDate()}</span></div>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[1200px] p-4">
                    <div className="flex mb-2 pl-14">{HOURS.map(h => <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-300 border-l">{String(h).padStart(2, '0')}:00</div>)}</div>
                    {roomsToRender.map(room => (
                        <div key={room} className="flex items-center mb-2 relative h-12">
                          <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border h-full text-xs sticky left-0 z-20">{room}</div>
                          <div className="flex-grow bg-slate-50/30 rounded-r-xl border h-full relative flex overflow-hidden">
                            {HOURS.map(h => <div key={h} className="flex-1 border-l"></div>)}
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
                    ))}
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
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Przestrzenie SSUEW</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">✕</button>
             </div>

             <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">Imię i nazwisko zgłaszającego *</label>
                    <input type="text" value={bookingForm.applicantName} onChange={e => setBookingForm({...bookingForm, applicantName: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 ml-1">E-mail kontaktowy *</label>
                    <input type="email" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Nazwa Organizacji / Koła *</label>
                  <input type="text" value={bookingForm.org} onChange={e => setBookingForm({...bookingForm, org: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Nazwa wydarzenia / Cel *</label>
                  <input type="text" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div>
                    <label className="text-xs font-black text-indigo-800 ml-1 uppercase">Data Rezerwacji *</label>
                    <input type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-indigo-800 ml-1 uppercase">Wybór Sali *</label>
                    <select value={bookingForm.room} onChange={e => setBookingForm({...bookingForm, room: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1 shadow-sm">
                      <option value="28J">Sala 28J</option>
                      {Object.keys(CAMPUS_ROOMS).map(r => <option key={r} value={r}>Sala {r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-indigo-800 ml-1 uppercase">Start *</label>
                    <input type="time" value={bookingForm.start} onChange={e => setBookingForm({...bookingForm, start: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-indigo-800 ml-1 uppercase">Koniec *</label>
                    <input type="time" value={bookingForm.end} onChange={e => setBookingForm({...bookingForm, end: e.target.value})} className="w-full bg-white border border-indigo-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none mt-1 shadow-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Uzasadnienie rezerwacji *</label>
                  <textarea value={bookingForm.justification} onChange={e => setBookingForm({...bookingForm, justification: e.target.value})} rows="3" className="w-full bg-slate-50 border p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none mt-1 resize-none" placeholder="Opisz krótko charakter spotkania..."></textarea>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 ml-1">Dodatkowe uwagi / Potrzeby techniczne</label>
                  <textarea value={bookingForm.notes} onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} rows="2" className="w-full bg-slate-50 border p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none mt-1 resize-none" placeholder="Opcjonalnie..."></textarea>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl flex items-start gap-3">
                  <input type="checkbox" id="rodo" checked={bookingForm.rodo} onChange={e => setBookingForm({...bookingForm, rodo: e.target.checked})} className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="rodo" className="text-[10px] text-slate-500 leading-tight">
                    Zgodnie z art. 13 ust. 1 i 2 ogólnego rozporządzenia o ochronie danych (RODO) informujemy, że administratorem Twoich danych osobowych jest Uniwersytet Ekonomiczny we Wrocławiu... <strong className="text-slate-700">Akceptuję klauzulę informacyjną i wyrażam zgodę na przetwarzanie danych. *</strong>
                  </label>
                </div>

                {bookingError && <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 text-center animate-pulse">{bookingError}</p>}
             </div>
             
             <div className="p-4 border-t border-slate-100 bg-white rounded-b-[2rem]">
                <button onClick={handleSubmitBooking} disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:bg-slate-300">
                  {isSubmitting ? 'Przetwarzanie...' : 'Wyślij Wniosek'}
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}