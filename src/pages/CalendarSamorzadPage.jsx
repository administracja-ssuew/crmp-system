import { useState } from 'react';
import { Link } from 'react-router-dom';

// === DANE PRZYKŁADOWE (Symulacja Excela) ===
const MOCK_EVENTS = [
  // 17.02
  { id: 1, room: '9J', date: '2026-02-17', start: '19:00', end: '22:00', title: 'MOSTY', type: 'project', color: 'bg-fuchsia-500' },
  { id: 2, room: '16J', date: '2026-02-17', start: '19:00', end: '23:00', title: 'KPUE', type: 'project', color: 'bg-blue-500' },
  
  // 18.02
  { id: 3, room: '9J', date: '2026-02-18', start: '16:00', end: '23:00', title: 'ZARZĄD', type: 'internal', color: 'bg-red-600' },
  { id: 4, room: '9J', date: '2026-02-18', start: '08:00', end: '16:00', title: 'WOLNY DOSTĘP', type: 'free', color: 'bg-slate-300' },
  
  // 19.02 - Przedłużenie!
  { id: 5, room: '9J', date: '2026-02-19', start: '00:00', end: '03:00', title: 'ZARZĄD (Nocka)', type: 'internal', color: 'bg-red-600' },
  { id: 6, room: '28J', date: '2026-02-19', start: '18:00', end: '22:00', title: 'JUWENALIA', type: 'project', color: 'bg-indigo-600' },
];

// Oznaczenia "Przedłużeń" (Zgoda Kanclerza na dłuższe otwarcie budynku)
const EXTENSIONS = [
  { date: '2026-02-18', until: '23:00', note: 'Zgoda Kanclerza (Zarząd)' },
  { date: '2026-02-19', until: '03:00', note: 'Zgoda Kanclerza (Nocka)' },
];

const ROOMS = ['9J', '16J', '28J'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 do 22:00 (standard)

export default function CalendarSamorzadPage() {
  const [currentDate, setCurrentDate] = useState(new Date('2026-02-17')); // Ustawiamy start na luty z Twojego screena
  const [filterRoom, setFilterRoom] = useState('ALL');

  // Funkcje daty
  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };
  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    setCurrentDate(prev);
  };

  // Generowanie widoku (pokazujemy 3 dni na raz dla wygody)
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
            Kalendarz <span className="text-emerald-600">Samorządu</span>
          </h1>
          <p className="text-slate-500 font-medium">Grafik sal 9J, 16J i 28J.</p>
        </div>

        {/* STEROWANIE I FILTRY */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => setFilterRoom('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>WSZYSTKIE</button>
          <button onClick={() => setFilterRoom('9J')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>
          <button onClick={() => setFilterRoom('16J')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>
          <button onClick={() => setFilterRoom('28J')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
        </div>
      </div>

      {/* GŁÓWNY WIDOK TIMELINE */}
      <div className="max-w-7xl mx-auto space-y-8 animate-slideUp">
        
        {/* Nawigacja Datami */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevDay} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 text-indigo-600 font-bold transition">←</button>
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Wyświetlany zakres</span>
            <span className="text-lg font-black text-slate-800">
              {new Date(daysToShow[0]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} — {new Date(daysToShow[2]).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          <button onClick={nextDay} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 text-indigo-600 font-bold transition">→</button>
        </div>

        {/* PĘTLA PO DNIACH */}
        {daysToShow.map(dayDate => {
          const extension = EXTENSIONS.find(e => e.date === dayDate);
          const isExtended = !!extension;

          return (
            <div key={dayDate} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden relative">
              
              {/* NAGŁÓWEK DNIA */}
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center bg-white border border-slate-200 rounded-xl p-2 w-14 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(dayDate).toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
                    <span className="text-xl font-black text-slate-900">{new Date(dayDate).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">{new Date(dayDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h3>
                    {isExtended && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                        🌙 {extension.note} (do {extension.until})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* OŚ CZASU (TIMELINE) */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px] p-6">
                  
                  {/* Nagłówek Godzin */}
                  <div className="flex mb-2 pl-16">
                    {HOURS.map(h => (
                      <div key={h} className="flex-1 text-center text-[10px] font-bold text-slate-300 border-l border-slate-100">
                        {h}:00
                      </div>
                    ))}
                  </div>

                  {/* Wiersze dla Pokoi */}
                  {ROOMS.filter(r => filterRoom === 'ALL' || filterRoom === r).map(room => (
                    <div key={room} className="flex items-center mb-3 relative h-14 group">
                      
                      {/* Etykieta Pokoju */}
                      <div className="w-16 shrink-0 flex items-center justify-center font-black text-slate-600 bg-slate-50 rounded-l-xl border border-slate-100 h-full z-10">
                        {room}
                      </div>

                      {/* Tło pasków (siatka) */}
                      <div className="flex-grow bg-slate-50/50 rounded-r-xl border border-slate-100 h-full relative flex">
                        {HOURS.map(h => (
                           <div key={h} className="flex-1 border-l border-slate-100/50 h-full"></div>
                        ))}

                        {/* RENDEROWANIE BLOKÓW REZERWACJI */}
                        {MOCK_EVENTS
                          .filter(ev => ev.date === dayDate && ev.room === room)
                          .map(ev => {
                            // Obliczanie pozycji i szerokości
                            const startHour = parseInt(ev.start.split(':')[0]) + (parseInt(ev.start.split(':')[1])/60);
                            const endHour = parseInt(ev.end.split(':')[0]) + (parseInt(ev.end.split(':')[1])/60);
                            
                            // Skala: 8:00 to 0%, 23:00 to 100% (15 godzin na osi)
                            const startPercent = ((startHour - 8) / 15) * 100;
                            const durationPercent = ((endHour - startHour) / 15) * 100;

                            // Obsługa rezerwacji poza skalą (np. do 3:00 rano)
                            // To uproszczenie na potrzeby demo
                            
                            if (startHour < 8 && endHour < 8) return null; // Poza wykresem

                            return (
                              <div 
                                key={ev.id}
                                className={`absolute top-1 bottom-1 rounded-lg ${ev.color} shadow-md flex items-center justify-center overflow-hidden hover:scale-105 hover:z-20 transition-all cursor-pointer`}
                                style={{ 
                                  left: `${Math.max(0, startPercent)}%`, 
                                  width: `${Math.min(100 - Math.max(0, startPercent), durationPercent)}%` 
                                }}
                                title={`${ev.title} (${ev.start} - ${ev.end})`}
                              >
                                <span className="text-[10px] font-black text-white px-2 truncate">
                                  {ev.title}
                                </span>
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
    </div>
  );
}