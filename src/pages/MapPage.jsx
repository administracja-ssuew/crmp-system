import { useState, useEffect } from 'react';

// === TWÓJ LINK DO SKRYPTU (Ten z obsługą rezerwacji) ===
const DATA_URL = "https://script.google.com/macros/s/AKfycbyrzMCrYZUQN_tL8fNcRFcCXShx4hCH75tGxDhDBPWmhgF68Bs-xmEVNiNk8yWPQwWIRQ/exec";

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Filtry
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); 

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const locs = json.locations || [];
        setLocations(locs);
        setFilteredLocations(locs);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  useEffect(() => {
    let result = locations;
    if (filterType !== 'all') {
      result = result.filter(loc => loc.type.toLowerCase() === filterType);
    }
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(loc => 
        loc.name.toLowerCase().includes(lowerTerm) || 
        loc.id.toLowerCase().includes(lowerTerm)
      );
    }
    setFilteredLocations(result);
  }, [searchTerm, filterType, locations]);

  const handleOpenInfo = () => setIsInfoModalOpen(true);

 if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 fixed top-0 left-0 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="font-bold text-slate-400 text-xs uppercase tracking-[0.3em] animate-pulse">Ładowanie mapy...</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative overflow-hidden animate-fadeIn">
      
      {/* PASEK FILTRÓW */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col md:flex-row gap-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-xl rounded-xl p-2 pointer-events-auto flex items-center border border-slate-200 md:w-80">
          <span className="text-xl px-2">🔍</span>
          <input 
            type="text" 
            placeholder="Szukaj..." 
            className="bg-transparent border-none outline-none text-slate-700 font-bold w-full placeholder:font-normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white/90 backdrop-blur shadow-xl rounded-xl p-1 pointer-events-auto flex gap-1 border border-slate-200">
          <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>WSZYSTKIE</button>
          <button onClick={() => setFilterType('plakat')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'plakat' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-600'}`}>PLAKATY</button>
          <button onClick={() => setFilterType('baner')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'baner' ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 text-slate-600'}`}>BANERY</button>
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 bg-slate-100 relative overflow-auto flex justify-center items-center">
        <div className="relative inline-block shadow-2xl rounded-xl">
           <img src="/mapa.jpg" alt="Mapa" className="max-w-none h-[800px] opacity-90 block" />
           {filteredLocations.map((loc, index) => (
             <button
               key={index}
               onClick={(e) => { e.stopPropagation(); setSelected(loc); }}
               className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 hover:scale-125 focus:outline-none z-20"
               style={{ top: loc.top, left: loc.left }}
             >
               <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${loc.type === 'baner' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                 {loc.type === 'baner' ? '🚩' : '📌'}
               </div>
             </button>
           ))}
        </div>
      </div>

      {/* PANEL BOCZNY */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-500 ease-in-out z-40 overflow-y-auto ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <div className="flex flex-col min-h-full">
            <div className="h-64 bg-slate-200 relative group">
              {selected.image ? (
                <img src={selected.image} className="w-full h-full object-cover" alt="Podgląd" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-4xl">📷</span>
                  <span className="text-xs mt-2 uppercase font-bold tracking-widest">Brak Zdjęcia</span>
                </div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 backdrop-blur">✕</button>
            </div>

            <div className="p-8 pb-32">
              <h2 className="text-3xl font-black text-slate-800 mb-1">{selected.name}</h2>
              <p className="text-sm font-mono text-slate-400 mb-6 bg-slate-100 inline-block px-2 py-1 rounded border">
                ID: <span className="text-slate-800 font-bold">{selected.id}</span>
              </p>

              {/* LICZBY - TERAZ CZYTAJĄ Z 'FREE' */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl text-center border">
                    <div className="text-3xl font-bold text-slate-800">{selected.capacity}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Miejsc Ogółem</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                    {/* Wyświetlamy pole 'free' ze skryptu, jeśli nie ma - capacity */}
                    <div className="text-3xl font-bold text-green-600">{selected.free ?? selected.capacity}</div>
                    <div className="text-[10px] uppercase font-bold text-green-700">Miejsc Wolnych</div>
                </div>
              </div>

              {/* KRATKI - TERAZ KOLORUJĄ ZAJĘTE MIEJSCA */}
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Podgląd Slotów</h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {Array.from({ length: selected.capacity || 1 }).map((_, i) => {
                  // Sprawdzamy czy dany slot jest zajęty (np. jeśli mamy 5 miejsc i 2 wolne, to 3 są zajęte)
                  const isOccupied = i >= (selected.free ?? selected.capacity);
                  
                  return (
                    <div key={i} className={`aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-center transition-colors
                      ${isOccupied 
                        ? 'border-red-200 bg-red-50 text-red-300' 
                        : 'border-dashed border-slate-200 bg-slate-50 text-slate-300 hover:border-green-400 hover:bg-green-50 hover:text-green-500'
                      }`}>
                      <span className="text-xl font-bold">{isOccupied ? '🔒' : '+'}</span>
                      <span className={`text-[10px] font-bold uppercase mt-1 ${isOccupied ? 'text-red-400' : 'text-slate-400 group-hover:text-green-600'}`}>
                        {isOccupied ? 'Zajęte' : 'Wolne'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button onClick={handleOpenInfo} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex justify-center items-center gap-2 group">
                <span>ℹ️ Jak zająć to miejsce?</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL INSTRUKCJI (BEZ ZMIAN) */}
      {isInfoModalOpen && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up border border-slate-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Procedura</h3>
                <p className="text-sm text-slate-500">Miejscówka: <span className="font-bold text-blue-600">{selected.id}</span></p>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">Spisz Kod ID</h4>
                  <p className="text-sm text-slate-600 mt-1">Twój kod to: <code className="bg-slate-100 px-2 py-1 rounded font-bold border">{selected.id}</code></p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">Wypełnij wniosek</h4>
                  <p className="text-sm text-slate-600 mt-1">Wpisz ten kod do papierowego wniosku w biurze samorządu.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsInfoModalOpen(false)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition">Jasne, dzięki</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}