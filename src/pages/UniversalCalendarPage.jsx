import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// TWÓJ DZIAŁAJĄCY LINK DO SKRYPTU KALENDARZA:
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';

const HOURS = Array.from({ length: 24 }, (_, i) => i); 

const CAMPUS_ROOMS = {
  '10 A': { days: [2, 3], start: 18, end: 22 }, 
  '213 Z': { days: [4, 5], start: 18, end: 22 }, 
  '214 Z': { days: [1, 5], start: 18, end: 22 }  
};

export default function UniversalCalendarPage({ variant = 'full' }) {
  const isOrgMode = variant === 'orgs';
  // Domyślnie pokazujemy wszystkie dostępne dla danej grupy sale
  const [filterRoom, setFilterRoom] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [calendarData, setCalendarData] = useState({ sale: [], przedluzenia: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const data = await response.json();
        
        // Zabezpieczenie przed błędem HTML z Google
        if (data.error) {
           setFetchError('Błąd Arkusza: ' + data.error);
        } else {
           setCalendarData(data);
        }
      } catch (error) {
        console.error("Błąd pobierania kalendarza:", error);
        setFetchError('Nie udało się połączyć. Upewnij się, że link prowadzi do skryptu Kalendarza i został wdrożony jako "Nowa wersja".');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const nextDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() + 1); setCurrentDate(d); };
  const prevDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() - 1); setCurrentDate(d); };

  const daysToShow = [0, 1, 2].map(offset => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/kalendarz-wybor" className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block">← Wróć do wyboru</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Kalendarz <span className={isOrgMode ? "text-blue-600" : "text-emerald-600"}>
              {isOrgMode ? "Organizacji" : "Przestrzeni"}
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isOrgMode 
              ? "Rezerwacja sali 28J oraz wyznaczonych sal uczelnianych (bud. A, Z)." 
              : "Panel administracyjny rezerwacji wszystkich sal."}
          </p>
        </div>

        <div className="flex gap-4">
            {/* Pasek filtrów widoczny dla obu trybów, ale dynamicznie ukrywa 9J i 16J dla Organizacji */}
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-w-md scrollbar-hide">
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                
                {!isOrgMode && <button onClick={() => setFilterRoom('9J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>}
                {!isOrgMode && <button onClick={() => setFilterRoom('16J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>}
                
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                <button onClick={() => setFilterRoom('10 A')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '10 A' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>10 A</button>
                <button onClick={() => setFilterRoom('213 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '213 Z' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>213 Z</button>
                <button onClick={() => setFilterRoom('214 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '214 Z' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>214 Z</button>
            </div>
            
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 transition active:scale-95 flex items-center gap-2 shrink-0">
                <span>+</span> <span className="hidden md:inline">Rezerwuj</span>
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 animate-slideUp">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevDay} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 text-indigo-600 font-bold transition">←</button>
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Zakres widoczności</span>
            <span className="text-lg font-black text-slate-800">
              {new Date(daysToShow[0]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {new Date(daysToShow[2]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <button onClick={nextDay} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 text-indigo-600 font-bold transition">→</button>
        </div>

        <div className="md:hidden flex items-center justify-center gap-2 text-xs text-slate-400 bg-white py-2 rounded-xl border border-slate-100 shadow-sm animate-pulse">
          <span>↔️</span><span>Przesuń w bok, aby zobaczyć 24h</span>
        </div>

        {fetchError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold border border-red-200 text-center animate-fadeIn">
            {fetchError}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">Ładowanie rezerwacji...</p>
          </div>
        ) : (
          daysToShow.map(dayDate => {
            const [y, m, d] = dayDate.split('-');
            const dateObj = new Date(y, m - 1, d);
            const dayOfWeek = dateObj.getDay();

            // Ustawienie bazy sal w zależności od trybu
            let dailyRooms = isOrgMode ? ['28J'] : ['9J', '16J', '28J'];
            
            // Dodawanie sal uczelnianych (dla obu trybów) w dni ich dostępności
            Object.keys(CAMPUS_ROOMS).forEach(room => {
              if (CAMPUS_ROOMS[room].days.includes(dayOfWeek)) {
                dailyRooms.push(room);
              }
            });

            // Filtrowanie wybrane przez użytkownika
            const roomsToRender = dailyRooms.filter(r => filterRoom === 'ALL' || filterRoom === r);

            const extension = calendarData.przedluzenia?.find(e => {
              const eDate = e.date ? e.date.toString().substring(0, 10) : '';
              return eDate === dayDate;
            });

            return (
              <div key={dayDate} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-6">
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-1.5 w-12 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{dateObj.toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
                      <span className="text-lg font-black text-slate-900">{dateObj.getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 text-sm">{dateObj.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h3>
                      {extension && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mt-1">
                          🌙 {extension.note} (do {extension.until})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[1200px] p-4">
                    <div className="flex mb-2 pl-14">
                      {HOURS.map(h => <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-300 border-l border-slate-100">{String(h).padStart(2, '0')}:00</div>)}
                    </div>

                    {roomsToRender.map(room => {
                      const campusRules = CAMPUS_ROOMS[room];
                      const isWorkingDay = [1, 2, 3, 4, 5].includes(dayOfWeek);

                      return (
                        <div key={room} className="flex items-center mb-2 relative h-12">
                          <div className="w-14 shrink-0 flex flex-col items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border border-slate-100 h-full text-xs sticky left-0 z-20">
                            {room}
                            {campusRules && <span className="text-[7px] text-slate-400 leading-none">{campusRules.start}-{campusRules.end}</span>}
                          </div>
                          
                          <div className="flex-grow bg-slate-50/30 rounded-r-xl border border-slate-100 h-full relative flex overflow-hidden">
                            {HOURS.map(h => <div key={h} className="flex-1 border-l border-slate-100/50 h-full"></div>)}
                            
                            {/* WYSZARZENIE DLA SAL UCZELNIANYCH */}
                            {campusRules && (
                              <>
                                <div className="absolute top-0 bottom-0 left-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${(campusRules.start / 24) * 100}%`}}>
                                  <span className="text-[10px] font-bold text-slate-400 opacity-50">SALA ZABLOKOWANA</span>
                                </div>
                                <div className="absolute top-0 bottom-0 right-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${((24 - campusRules.end) / 24) * 100}%`}}>
                                </div>
                              </>
                            )}

                            {/* === WOLNY DOSTĘP DLA 9J === */}
                            {room === '9J' && isWorkingDay && (
                              <div className="absolute top-1 bottom-1 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-lg z-0 flex items-center justify-center pointer-events-none" 
                                   style={{ left: `${(8 / 24) * 100}%`, width: `${(9 / 24) * 100}%` }}>
                                <span className="text-[10px] font-black text-emerald-600/70 tracking-widest uppercase px-2 bg-emerald-50 rounded-full">Wolny Dostęp</span>
                              </div>
                            )}
                            
                            {/* REZERWACJE Z EXCELA */}
                            {calendarData.sale
                              ?.filter(ev => {
                                const evDate = ev.date ? ev.date.toString().substring(0, 10) : '';
                                return evDate === dayDate && ev.room === room;
                              })
                              .map((ev, idx) => {
                                const startH = parseFloat(ev.start.split(':')[0]) + parseFloat(ev.start.split(':')[1] || 0)/60;
                                const endH = parseFloat(ev.end.split(':')[0]) + parseFloat(ev.end.split(':')[1] || 0)/60;
                                
                                const left = (startH / 24) * 100;
                                const width = ((endH - startH) / 24) * 100;

                                return (
                                  <div key={idx} className={`absolute top-1 bottom-1 rounded-lg ${ev.color || 'bg-indigo-500'} shadow-sm flex items-center justify-center hover:scale-[1.02] hover:z-20 transition cursor-pointer z-10`}
                                    style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }} title={`${ev.title} (${ev.start} - ${ev.end})`}>
                                    <span className="text-[9px] font-black text-white truncate px-1">{ev.title}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL REZERWACJI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-bounceIn">
             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
               <span className="text-2xl">📝</span>
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-2">Złóż wniosek o rezerwację</h2>
             <div className="text-sm text-slate-500 mb-6 space-y-3 leading-relaxed">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
               Wypełnij formularz rezerwacyjny, aby zgłosić chęć skorzystania z&nbsp;wybranej przestrzeni. 
             </p>
             <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
               <li>Rezerwacja wyznaczonych sal uczelnianych (bud.&nbsp;A,&nbsp;Z) możliwa tylko w&nbsp;godz. 18:00&nbsp;-&nbsp;22:00.</li>
               <li>Wnioski są weryfikowane przez Administrację&nbsp;SSUEW.</li>
               <li>Po akceptacji, Twoja rezerwacja automatycznie pojawi się w&nbsp;kalendarzu.</li>
             </ul>
             </div>
             <div className="flex flex-col gap-3">
                <a 
                  href="https://forms.gle/TWÓJ_LINK_DO_FORMULARZA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-indigo-600 text-white text-center font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition"
                >
                  Przejdź do formularza
                </a>
                <button onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">
                  Anuluj
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}