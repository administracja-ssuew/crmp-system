import { useState } from 'react';
import { Link } from 'react-router-dom';

// === DANE PRZYKŁADOWE (Symulacja bazy) ===
const MOCK_EVENTS = [
  { id: 1, room: '9J', date: '2026-02-17', start: '19:00', end: '22:00', title: 'MOSTY', color: 'bg-fuchsia-500' },
  { id: 2, room: '16J', date: '2026-02-17', start: '19:00', end: '23:00', title: 'KPUE', color: 'bg-blue-500' },
  { id: 3, room: '9J', date: '2026-02-18', start: '16:00', end: '23:00', title: 'ZARZĄD', color: 'bg-red-600' },
  { id: 4, room: '9J', date: '2026-02-18', start: '08:00', end: '16:00', title: 'WOLNY DOSTĘP', color: 'bg-slate-300' },
  { id: 5, room: '28J', date: '2026-02-18', start: '10:00', end: '14:00', title: 'DEBATA', color: 'bg-indigo-600' }, // To zobaczą Organizacje
  { id: 6, room: '28J', date: '2026-02-19', start: '18:00', end: '22:00', title: 'JUWENALIA', color: 'bg-indigo-600' },
];

const EXTENSIONS = [
  { date: '2026-02-18', until: '23:00', note: 'Zgoda Kanclerza (Zarząd)' },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00

// === KOMPONENT GŁÓWNY ===
// Przyjmuje prop "variant" -> 'full' (Samorząd) lub 'orgs' (Organizacje)
export default function UniversalCalendarPage({ variant = 'full' }) {
  const isOrgMode = variant === 'orgs';
  
  // Jeśli tryb Organizacji -> Zawsze 28J, Jeśli Samorząd -> Domyślnie ALL
  const [filterRoom, setFilterRoom] = useState(isOrgMode ? '28J' : 'ALL');
  const [currentDate, setCurrentDate] = useState(new Date('2026-02-17'));
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sale dostępne w danym widoku
  // Dla Samorządu: Wszystkie. Dla Organizacji: Tylko 28J.
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
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/kalendarz-wybor" className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block">← Wróć do wyboru</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Kalendarz <span className={isOrgMode ? "text-blue-600" : "text-emerald-600"}>
              {isOrgMode ? "Sali 28J" : "Samorządu"}
            </span>
          </h1>
          <p className="text-slate-500 font-medium">
            {isOrgMode ? "Dostępność Auli (Sala Lustrzana)" : "Grafik sal 9J, 16J i 28J"}
          </p>
        </div>

        <div className="flex gap-4">
            {/* PRZYCISKI FILTRACJI (Tylko dla Samorządu) */}
            {!isOrgMode && (
                <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                    <button onClick={() => setFilterRoom('9J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>
                    <button onClick={() => setFilterRoom('16J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>
                    <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                </div>
            )}
            
            {/* PRZYCISK DODAWANIA */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 transition active:scale-95 flex items-center gap-2"
            >
                <span>+</span> <span className="hidden md:inline">Rezerwuj</span>
            </button>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="max-w-7xl mx-auto space-y-6 animate-slideUp">
        
        {/* Nawigacja */}
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

        {/* Dni */}
        {daysToShow.map(dayDate => {
          const extension = EXTENSIONS.find(e => e.date === dayDate);
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
                    {extension && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">🌙 {extension.note}</span>}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[700px] p-4">
                  <div className="flex mb-2 pl-14">
                    {HOURS.map(h => <div key={h} className="flex-1 text-center text-[9px] font-bold text-slate-300 border-l border-slate-100">{h}:00</div>)}
                  </div>

                  {visibleRooms
                    .filter(r => (isOrgMode ? r === '28J' : (filterRoom === 'ALL' || filterRoom === r)))
                    .map(room => (
                    <div key={room} className="flex items-center mb-2 relative h-12">
                      <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border border-slate-100 h-full text-xs">{room}</div>
                      <div className="flex-grow bg-slate-50/50 rounded-r-xl border border-slate-100 h-full relative flex">
                        {HOURS.map(h => <div key={h} className="flex-1 border-l border-slate-100/50 h-full"></div>)}
                        
                        {MOCK_EVENTS
                          .filter(ev => ev.date === dayDate && ev.room === room)
                          .map(ev => {
                            const startH = parseFloat(ev.start.split(':')[0]) + parseFloat(ev.start.split(':')[1])/60;
                            const endH = parseFloat(ev.end.split(':')[0]) + parseFloat(ev.end.split(':')[1])/60;
                            const left = ((startH - 8) / 15) * 100;
                            const width = ((endH - startH) / 15) * 100;
                            if (startH < 8 && endH < 8) return null;

                            return (
                              <div key={ev.id} className={`absolute top-1 bottom-1 rounded-lg ${ev.color} shadow-sm flex items-center justify-center hover:scale-105 hover:z-20 transition cursor-pointer`}
                                style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }} title={ev.title}>
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
        })}
      </div>

      {/* MODAL DODAWANIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-bounceIn">
             <h2 className="text-2xl font-black text-slate-900 mb-4">Rezerwacja Sali</h2>
             <p className="text-sm text-slate-500 mb-6">Wypełnij formularz, aby dodać wydarzenie do kalendarza.</p>
             
             {/* Tutaj będzie formularz */}
             <div className="space-y-3">
               <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" />
               <div className="flex gap-2">
                 <input type="time" className="w-1/2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" defaultValue="08:00"/>
                 <input type="time" className="w-1/2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" defaultValue="10:00"/>
               </div>
               <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold">
                 {isOrgMode ? <option>Sala 28J</option> : <><option>Sala 9J</option><option>Sala 16J</option><option>Sala 28J</option></>}
               </select>
               <input type="text" placeholder="Nazwa wydarzenia" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" />
             </div>

             <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Anuluj</button>
                <button onClick={() => alert("Wysyłanie danych...")} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Zapisz</button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}