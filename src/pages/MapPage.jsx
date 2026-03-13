import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config';

// === TWÓJ NOWY LINK DO SKRYPTU ===
const DATA_URL = "https://script.google.com/macros/s/AKfycbyO_eJLtdAs63yScKpVuIzbkCQoQKqQTcWgBN_nlfjg__nAkzXXVYuuisKm_MHmoQ5rNw/exec";

export default function MapPage() {
  const { user } = useAuth();
  const isAdmin = user && user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());

  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); 

  const [adminTab, setAdminTab] = useState('info'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPoster, setNewPoster] = useState({
    name: '',
    organization: '',
    email: '',
    endDate: ''
  });

  const fetchData = () => {
    setLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const locs = json.locations || [];
        setLocations(locs);
        
        if (selected) {
          const updatedSelected = locs.find(l => l.id === selected.id);
          if (updatedSelected) setSelected(updatedSelected);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
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

  // === LOGIKA ZARZĄDU: WYSYŁKA NOWEGO PLAKATU DO BAZY ===
  const handleAddPoster = async (e) => {
    e.preventDefault();
    if (!newPoster.name || !newPoster.organization || !newPoster.email || !newPoster.endDate) {
      alert("Proszę uzupełnić wszystkie pola formularza ewidencyjnego.");
      return;
    }
    if (selected.free <= 0) {
      alert("Brak fizycznych miejsc na tej tablicy / w tej lokalizacji!");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      action: 'addPoster',
      locationId: selected.id,
      locationType: selected.type,
      posterName: newPoster.name,
      organization: newPoster.organization,
      email: newPoster.email,
      endDate: newPoster.endDate
    };

    try {
      const response = await fetch(DATA_URL, {
        method: 'POST',
        redirect: 'follow', // OMIJA PROBLEMY Z EXTENSIONAMI CHROME
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`Plakat oficjalnie powieszony! \nZarejestrowano w systemie pod UID: ${result.uid}\nUruchomiono cykl przypomnień na podany e-mail.`);
        setNewPoster({ name: '', organization: '', email: '', endDate: '' });
      }
    } catch (err) {
      console.log(err);
      alert("Plakat dodany, system odświeża bazę.");
    } finally {
      fetchData(); 
      setIsSubmitting(false);
    }
  };

  // === LOGIKA ZARZĄDU: ZDEJMOWANIE PLAKATU ===
  const handleRemovePoster = async (posterUid) => {
    if(!window.confirm("Czy potwierdzasz zdjęcie plakatu? Spowoduje to zwolnienie miejsca na mapie i zamknięcie statusu w systemie eskalacji Kanclerza.")) return;
    
    setIsSubmitting(true);
    const payload = {
      action: 'removePoster',
      uid: posterUid
    };

    try {
      await fetch(DATA_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      alert("Miejsce oficjalnie zwolnione!");
    } catch (err) {
      console.log(err);
      alert("Zwolniono miejsce, odświeżam widok.");
    } finally {
      fetchData(); 
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 fixed top-0 left-0 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="font-bold text-slate-400 text-xs uppercase tracking-[0.3em] animate-pulse">Ładowanie bazy CRA...</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative overflow-hidden animate-fadeIn">
      
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col md:flex-row gap-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-xl rounded-xl p-2 pointer-events-auto flex items-center border border-slate-200 md:w-80">
          <span className="text-xl px-2">🔍</span>
          <input type="text" placeholder="Szukaj tablicy..." className="bg-transparent border-none outline-none text-slate-700 font-bold w-full placeholder:font-normal" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white/90 backdrop-blur shadow-xl rounded-xl p-1 pointer-events-auto flex gap-1 border border-slate-200">
          <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>WSZYSTKIE</button>
          <button onClick={() => setFilterType('plakat')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'plakat' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-slate-600'}`}>PLAKATY</button>
          <button onClick={() => setFilterType('baner')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'baner' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'hover:bg-orange-50 text-slate-600'}`}>BANERY</button>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 relative overflow-auto flex justify-center items-center">
        <div className="relative inline-block shadow-2xl rounded-xl">
           <img src="/mapa.jpg" alt="Mapa" className="max-w-none h-[800px] opacity-90 block" />
           {filteredLocations.map((loc, index) => (
             <button
               key={index}
               onClick={(e) => { e.stopPropagation(); setSelected(loc); setAdminTab('info'); }}
               className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 hover:scale-125 focus:outline-none z-20"
               style={{ top: loc.top, left: loc.left }}
             >
               <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${loc.type === 'baner' ? 'bg-orange-500' : 'bg-blue-600'} ${loc.free === 0 ? 'ring-4 ring-red-500/50' : ''}`}>
                 {loc.type === 'baner' ? '🚩' : '📌'}
               </div>
             </button>
           ))}
        </div>
      </div>

      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-500 ease-in-out z-40 overflow-y-auto ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <div className="flex flex-col min-h-full">
            <div className="h-64 bg-slate-200 relative group shrink-0">
              {selected.image ? (
                <img src={selected.image} className="w-full h-full object-cover" alt="Podgląd Miejsca" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                  <span className="text-5xl mb-2">📸</span>
                  <span className="text-xs mt-2 uppercase font-bold tracking-widest text-slate-500">Zdjęcie w przygotowaniu</span>
                </div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 backdrop-blur font-bold">✕</button>
              
              {selected.free === 0 && (
                <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                  Brak wolnych miejsc
                </div>
              )}
            </div>

            <div className="p-8 pb-32 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-3xl font-black text-slate-800 leading-tight">{selected.name}</h2>
              </div>
              <p className="text-sm font-mono text-slate-500 mb-6 bg-slate-100 inline-block px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
                Kod Lokalizacji: <span className="text-slate-800 font-bold">{selected.id}</span>
              </p>

              {isAdmin && (
                <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button onClick={() => setAdminTab('info')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Informacje</button>
                  <button onClick={() => setAdminTab('zarzadzaj')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'zarzadzaj' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Zarządzaj (Admin)</button>
                </div>
              )}

              {adminTab === 'info' && (
                <div className="animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-200 shadow-sm">
                        <div className="text-4xl font-black text-slate-800">{selected.capacity}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Miejsc Ogółem</div>
                    </div>
                    <div className={`${selected.free > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} p-5 rounded-2xl text-center border shadow-sm`}>
                        <div className={`text-4xl font-black ${selected.free > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{selected.free ?? selected.capacity}</div>
                        <div className={`text-[10px] uppercase font-bold mt-1 ${selected.free > 0 ? 'text-emerald-700' : 'text-red-700'}`}>Wolnych Miejsc</div>
                    </div>
                  </div>

                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Podgląd Slotów na Tablicy</h3>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {Array.from({ length: selected.capacity || 1 }).map((_, i) => {
                      const activePosters = selected.activePosters || [];
                      const posterInSlot = activePosters[i]; 
                      const isOccupied = !!posterInSlot || (i >= (selected.free ?? selected.capacity));
                      
                      return (
                        <div key={i} className={`aspect-square border-2 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300
                          ${isOccupied 
                            ? 'border-red-200 bg-red-50 text-red-500 shadow-inner' 
                            : 'border-dashed border-slate-200 bg-white text-slate-300 shadow-sm'
                          }`}>
                          <span className="text-2xl font-black mb-1">{isOccupied ? '🔒' : '+'}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isOccupied ? 'text-red-500' : 'text-slate-400'}`}>
                            {isOccupied ? 'Zajęte' : 'Wolne'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={handleOpenInfo} className="mt-auto w-full bg-blue-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex justify-center items-center gap-2 group">
                    <span>ℹ️ Jak zarezerwować miejsce?</span>
                  </button>
                </div>
              )}

              {adminTab === 'zarzadzaj' && isAdmin && (
                <div className="animate-fadeIn">
                  
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Zawieszone Plakaty ({selected.capacity - selected.free}/{selected.capacity})</h3>
                  
                  <div className="space-y-3 mb-8">
                    {(selected.activePosters || []).length > 0 ? (
                      selected.activePosters.map((poster) => (
                        <div key={poster.uid} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{poster.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{poster.organization}</p>
                            <p className="text-[10px] text-red-500 font-bold mt-1">Zdjąć do: {poster.endDate}</p>
                          </div>
                          <button 
                            onClick={() => handleRemovePoster(poster.uid)}
                            disabled={isSubmitting}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white p-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50"
                          >
                            Zdejmij
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Brak wiszących plakatów w bazie.
                      </p>
                    )}
                  </div>

                  {selected.free > 0 && (
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                      <h3 className="font-black text-blue-900 text-xs uppercase tracking-widest mb-4">➕ Ewidencjonuj Nowy Plakat</h3>
                      <form onSubmit={handleAddPoster} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Nazwa Wydarzenia / Plakatu</label>
                          <input type="text" required value={newPoster.name} onChange={e => setNewPoster({...newPoster, name: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. Wampiriada Wiosna" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Organizacja / Koło Naukowe</label>
                          <input type="text" required value={newPoster.organization} onChange={e => setNewPoster({...newPoster, organization: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. NZS UEW" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Adres e-mail z formularza</label>
                          <input type="email" required value={newPoster.email} onChange={e => setNewPoster({...newPoster, email: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="kontakt@nzs.ue.wroc.pl" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Termin Zdjęcia Plakatu</label>
                          <input type="date" required value={newPoster.endDate} onChange={e => setNewPoster({...newPoster, endDate: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none text-red-600" />
                        </div>
                        
                        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-2">
                          {isSubmitting ? 'Zapisywanie w Bazie...' : 'Zatwierdź Powieszenie'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isInfoModalOpen && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up border border-slate-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Procedura Wieszania</h3>
                <p className="text-sm text-slate-500 font-bold">Miejscówka: <span className="font-black text-blue-600">{selected.id}</span></p>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition font-black">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center font-black">1</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">Spisz Kod ID Tablicy</h4>
                  <p className="text-sm font-medium text-slate-600 mt-1">Twój docelowy kod to: <code className="bg-slate-100 px-2 py-1 rounded font-bold border border-slate-300 text-slate-800">{selected.id}</code></p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center font-black">2</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">Wizyta w Biurze Zarządu</h4>
                  <p className="text-sm font-medium text-slate-600 mt-1">Przynieś plakat do biura SSUEW. Administrator wpisze go do cyfrowej ewidencji i wyzwoli przypomnienia mailowe na podany adres e-mail.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsInfoModalOpen(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-lg">Zrozumiałem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}