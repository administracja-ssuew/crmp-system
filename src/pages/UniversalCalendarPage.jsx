import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00

export default function UniversalCalendarPage({ variant = 'full' }) {
  const isOrgMode = variant === 'orgs';
  const [filterRoom, setFilterRoom] = useState(isOrgMode ? '28J' : 'ALL');
const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ZMIANA: Przechowujemy dwa rodzaje danych!
  const [calendarData, setCalendarData] = useState({ sale: [], przedluzenia: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const data = await response.json();
        // data zawiera teraz { sale: [...], przedluzenia: [...] }
        setCalendarData(data);
      } catch (error) {
        console.error("Błąd pobierania kalendarza:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const visibleRooms = isOrgMode ? ['28J'] : ['9J', '16J', '28J'];

  const nextDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() + 1); setCurrentDate(d); };
  const prevDay = () => { const d = new Date(currentDate); d.setDate(currentDate.getDate() - 1); setCurrentDate(d); };

  const daysToShow = [0, 1, 2].map(offset => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      
      {/* NAGŁÓWEK */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/kalendarz-wybor" className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block">← Wróć do wyboru</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Kalendarz <span className={isOrgMode ? "text-blue-600" : "text-emerald-600"}>
              {isOrgMode ? "Sali 28J" : "Samorządu"}
            </span>
          </h1>
        </div>

        <div className="flex gap-4">
            {!isOrgMode && (
                <div className="hidden md:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                    <button onClick={() => setFilterRoom('9J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>
                    <button onClick={() => setFilterRoom('16J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>
                    <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                </div>
            )}
            
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 transition active:scale-95 flex items-center gap-2">
                <span>+</span> <span className="hidden md:inline">Rezerwuj</span>
            </button>
        </div>
      </div>

      {/* STEROWANIE FILTRAMI (MOBILNE) */}
      {!isOrgMode && (
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2">
            <button onClick={() => setFilterRoom('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>Wszystkie</button>
            <button onClick={() => setFilterRoom('9J')} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${filterRoom === '9J' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>Sala 9J</button>
            <button onClick={() => setFilterRoom('16J')} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${filterRoom === '16J' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>Sala 16J</button>
            <button onClick={() => setFilterRoom('28J')} className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>Sala 28J</button>
        </div>
      )}

      {/* TIMELINE */}
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
          <span>↔️</span>
          <span>Przesuń tabelę w bok, aby zobaczyć godziny</span>
        </div>

        {/* EKRAN ŁADOWANIA */}
        {isLoading ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">Pobieranie danych z Google Sheets...</p>
          </div>
        ) : (
          /* Dni */
          daysToShow.map(dayDate => {
            // SZUKANIE PRZEDŁUŻENIA Z EXCELA:
            const extension = calendarData.przedluzenia.find(e => {
              const eDate = e.date ? e.date.toString().substring(0, 10) : '';
              return eDate === dayDate;
            });

            return (
              <div key={dayDate} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-1.5 w-12 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(dayDate).toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
                      <span className="text-lg font-black text-slate-900">{new Date(dayDate).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 text-sm">{new Date(dayDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h3>
                      
                      {/* POKAZYWANIE ZGODY Z EXCELA */}
                      {extension && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                          🌙 {extension.note} (do {extension.until})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[700px] p-4">
                    <div className="flex mb-2 pl-14">
                      {HOURS.map(h => <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-300 border-l border-slate-100">{h}:00</div>)}
                    </div>

                    {visibleRooms
                      .filter(r => (isOrgMode ? r === '28J' : (filterRoom === 'ALL' || filterRoom === r)))
                      .map(room => (
                      <div key={room} className="flex items-center mb-2 relative h-12">
                        <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border border-slate-100 h-full text-xs sticky left-0 z-10">{room}</div>
                        <div className="flex-grow bg-slate-50/50 rounded-r-xl border border-slate-100 h-full relative flex">
                          {HOURS.map(h => <div key={h} className="flex-1 border-l border-slate-100/50 h-full"></div>)}
                          
                          {/* POBIERANIE REZERWACJI Z EXCELA */}
                          {calendarData.sale
                            .filter(ev => {
                              const evDate = ev.date ? ev.date.toString().substring(0, 10) : '';
                              return evDate === dayDate && ev.room === room;
                            })
                            .map((ev, idx) => {
                              const startH = parseFloat(ev.start.split(':')[0]) + parseFloat(ev.start.split(':')[1] || 0)/60;
                              const endH = parseFloat(ev.end.split(':')[0]) + parseFloat(ev.end.split(':')[1] || 0)/60;
                              const left = ((startH - 8) / 15) * 100;
                              const width = ((endH - startH) / 15) * 100;
                              if (startH < 8 && endH < 8) return null;

                              return (
                                <div key={idx} className={`absolute top-1 bottom-1 rounded-lg ${ev.color || 'bg-indigo-500'} shadow-sm flex items-center justify-center hover:scale-105 hover:z-20 transition cursor-pointer`}
                                  style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }} title={`${ev.title} (${ev.start} - ${ev.end})`}>
                                  <span className="text-[9px] font-black text-white truncate px-1">{ev.title}</span>
                                </div>
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

      {/* MODAL REZERWACJI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-bounceIn">
             <h2 className="text-2xl font-black text-slate-900 mb-4">Rezerwacja Sali</h2>
             <p className="text-sm text-slate-500 mb-6">Funkcja podpięcia formularza Google Forms wkrótce.</p>
             <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Zamknij</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}