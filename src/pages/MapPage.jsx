import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Flag, Search, Map, List } from 'lucide-react';

// Proxy przez Vercel API route — omija CORS Google Apps Script
const DATA_URL = "/api/gas-proxy";

// Konwertuje link Google Drive (viewer) na bezpośredni URL obrazka
const toDriveImg = (url) => {
  if (!url) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url;
};

// Zapobiega wdowom typograficznym — wkleja niełamliwą spację po jednoliterowych spójnikach/przyimkach
const noWidows = (text) => {
  if (!text) return text;
  return text.replace(/\s([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])\s/g, '\u00A0$1\u00A0');
};

export default function MapPage() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'logitech' || userRole === 'admin';

  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [adminTab, setAdminTab] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addPosterModal, setAddPosterModal] = useState(false);

  const emptyNewPoster = { credId: '', name: '', organization: '', email: '', endDate: '', locationIds: [] };
  const [newPoster, setNewPoster] = useState(emptyNewPoster);

  const [view, setView] = useState('map');
  const [hoveredId, setHoveredId] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [allPosters, setAllPosters] = useState([]);
  const [postersLoading, setPostersLoading] = useState(false);
  const [registryFilter, setRegistryFilter] = useState('all');
  const [registrySearch, setRegistrySearch] = useState('');
  const [editForm, setEditForm] = useState({ name: '', capacity: '', imageUrl: '' });
  const [isEditing, setIsEditing] = useState(false);
  const imgRef = useRef(null);

  // === TRYB WSPÓŁRZĘDNYCH (pkt 4) ===
  const [coordMode, setCoordMode] = useState(false);
  const [coordPreview, setCoordPreview] = useState(null);

  // === MODAL REJESTR: edycja i dodawanie wpisów ===
  const emptyPosterForm = { credId: '', type: 'plakat', nazwa: '', org: '', email: '', locationId: '', locationIds: [], dataZgody: '', dataZdjecia: '', status: 'AKTYWNE', uwagi: '' };
  const [posterModal, setPosterModal] = useState(null); // null = zamknięty, 'add' | 'edit'
  const [posterForm, setPosterForm] = useState(emptyPosterForm);
  const [posterSubmitting, setPosterSubmitting] = useState(false);

  // === HELPER: oblicz współrzędne kliknięcia względem obrazu (z uwzględnieniem letterbox) ===
  const getMapCoords = (e) => {
    if (!imgRef.current) return null;
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const { width: cw, height: ch } = rect;
    const naturalW = img.naturalWidth || cw;
    const naturalH = img.naturalHeight || ch;
    const containerRatio = cw / ch;
    const imageRatio = naturalW / naturalH;
    let renderedW, renderedH, offsetX, offsetY;
    if (imageRatio > containerRatio) {
      renderedW = cw; renderedH = cw / imageRatio;
      offsetX = 0; offsetY = (ch - renderedH) / 2;
    } else {
      renderedH = ch; renderedW = ch * imageRatio;
      offsetX = (cw - renderedW) / 2; offsetY = 0;
    }
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    if (clickX < offsetX || clickX > offsetX + renderedW || clickY < offsetY || clickY > offsetY + renderedH) return null;
    return {
      x: ((clickX - offsetX) / renderedW * 100).toFixed(1),
      y: ((clickY - offsetY) / renderedH * 100).toFixed(1),
    };
  };

  const calcHotspotStyle = (loc) => {
    if (!imgRef.current) return { top: loc.top, left: loc.left };
    const img = imgRef.current;
    const { width: cw, height: ch } = img.getBoundingClientRect();
    if (!cw || !ch) return { top: loc.top, left: loc.left };
    const naturalW = img.naturalWidth || cw;
    const naturalH = img.naturalHeight || ch;
    const containerRatio = cw / ch;
    const imageRatio = naturalW / naturalH;
    let renderedW, renderedH, offsetX, offsetY;
    if (imageRatio > containerRatio) {
      renderedW = cw;
      renderedH = cw / imageRatio;
      offsetX = 0;
      offsetY = (ch - renderedH) / 2;
    } else {
      renderedH = ch;
      renderedW = ch * imageRatio;
      offsetX = (cw - renderedW) / 2;
      offsetY = 0;
    }
    const topPct = parseFloat(loc.top) / 100;
    const leftPct = parseFloat(loc.left) / 100;
    return {
      position: 'absolute',
      top: offsetY + topPct * renderedH,
      left: offsetX + leftPct * renderedW,
      transform: 'translate(-50%, -50%)',
    };
  };

  // === REJESTR: lazy-fetch getAllPosters z GAS (per D-12, D-14, D-15) ===
  const fetchAllPosters = async (force = false) => {
    if (!force && allPosters.length > 0) return; // already loaded — skip re-fetch
    setPostersLoading(true);
    try {
      const res = await fetch(`${DATA_URL}?action=getAllPosters`, { redirect: 'follow' });
      const data = await res.json();
      setAllPosters(data.posters || []);
    } catch (err) {
      console.error(err);
      setAllPosters([]);
    } finally {
      setPostersLoading(false);
    }
  };

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    fetch(`${DATA_URL}?t=${Date.now()}`)
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

  useEffect(() => { window.scrollTo(0, 0); }, []);

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

  // Lazy-fetch history + seed edit form when Zarządzaj tab is opened (per D-09, D-10)
  useEffect(() => {
    if (adminTab === 'zarzadzaj' && selected) {
      fetchHistory(selected.id);
      setEditForm({
        name: selected.name || '',
        capacity: selected.capacity || '',
        imageUrl: selected.image || '',
      });
    }
  }, [adminTab, selected]);

  // Pre-select current pin's location when opening a pin panel
  useEffect(() => {
    if (selected) {
      setNewPoster(prev => ({ ...prev, locationIds: [selected.id] }));
    }
  }, [selected?.id]);

  // Lazy-fetch all posters when admin first switches to Rejestr view (per D-12)
  useEffect(() => {
    if (view === 'rejestr' && isAdmin) {
      fetchAllPosters();
    }
  }, [view]);

  const handleOpenInfo = () => setIsInfoModalOpen(true);

  // === LOGIKA ZARZĄDU: WYSYŁKA NOWEGO PLAKATU DO BAZY ===
  const handleAddPoster = async (e) => {
    e.preventDefault();
    if (!newPoster.credId || !newPoster.name || !newPoster.organization || !newPoster.email || !newPoster.endDate) {
      alert("Proszę uzupełnić wszystkie pola formularza (w tym Znak Zgody).");
      return;
    }
    if (!newPoster.locationIds || newPoster.locationIds.length === 0) {
      alert("Wybierz co najmniej jedną lokalizację.");
      return;
    }

    setIsSubmitting(true);
    // locationType — bierzemy z pierwszej wybranej lokalizacji (lub selected jeśli dostępne)
    const firstLoc = locations.find(l => l.id === newPoster.locationIds[0]);
    const payload = {
      action: 'addPosterMulti',
      locationIds: newPoster.locationIds,
      locationType: (selected && newPoster.locationIds.includes(selected.id)) ? selected.type : (firstLoc?.type || 'plakat'),
      credId: newPoster.credId,
      posterName: newPoster.name,
      organization: newPoster.organization,
      email: newPoster.email,
      endDate: newPoster.endDate
    };

    try {
      const response = await fetch(DATA_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        const count = newPoster.locationIds.length;
        alert(`Plakat oficjalnie powieszony w ${count} ${count === 1 ? 'lokalizacji' : 'lokalizacjach'}!\nUruchomiono cykl przypomnień.`);
        setNewPoster({ ...emptyNewPoster, locationIds: selected ? [selected.id] : [] });
        setAddPosterModal(false);
        setTimeout(() => fetchData(true), 2500);
      } else {
        console.error('GAS error:', result);
        alert(`Błąd zapisu: ${result.error || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia. Sprawdź konsolę i spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === LOGIKA ZARZĄDU: ZDEJMOWANIE PLAKATU ===
  const handleRemovePoster = async (posterCredId) => {
    if(!window.confirm("Czy potwierdzasz zdjęcie plakatu? Spowoduje to zwolnienie miejsca na mapie i zamknięcie statusu w systemie eskalacji Kanclerza.")) return;

    setIsSubmitting(true);
    const payload = {
      action: 'removePoster',
      credId: posterCredId // <--- WYSYŁAMY ZNAK ABY USUNĄĆ Z EXCELA
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
      console.error(err);
      alert("Błąd połączenia — operacja mogła nie zostać zapisana. Odśwież stronę i sprawdź stan.");
    } finally {
      setTimeout(() => fetchData(true), 2500);
      setIsSubmitting(false);
    }
  };

  // === HISTORIA LOKALIZACJI: lazy-fetch gdy admin otworzy zakładkę Zarządzaj (per D-09) ===
  const fetchHistory = async (locationId) => {
    setHistoryLoading(true);
    setHistoryError(null);
    setLocationHistory([]);
    try {
      const res = await fetch(`${DATA_URL}?action=getHistory&locationId=${locationId}`);
      const data = await res.json();
      setLocationHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setHistoryError('Nie udało się pobrać historii. Spróbuj ponownie.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // === EDYCJA DANYCH LOKALIZACJI: POST updateLocation do GAS (per D-10) ===
  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(DATA_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateLocation',
          locationId: selected.id,
          name: editForm.name,
          capacity: Number(editForm.capacity),
          imageUrl: editForm.imageUrl,
        }),
      });
      setIsEditing(false);
      fetchData(true);
    } catch (err) {
      console.error(err);
      alert('Błąd zapisu danych lokalizacji. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === REJESTR: zapisz wpis (nowy lub edytowany) do GAS ===
  const handleSavePoster = async (e) => {
    e.preventDefault();
    if (posterModal === 'add' && posterForm.locationIds.length === 0) {
      alert("Wybierz co najmniej jedną lokalizację.");
      return;
    }
    setPosterSubmitting(true);
    try {
      const payload = posterModal === 'add'
        ? {
            action: 'addPosterMulti',
            locationIds: posterForm.locationIds,
            locationType: posterForm.type,
            credId: posterForm.credId,
            posterName: posterForm.nazwa,
            organization: posterForm.org,
            email: posterForm.email,
            endDate: posterForm.dataZdjecia,
          }
        : {
            action: 'updatePoster',
            credId: posterForm.credId,
            type: posterForm.type,
            nazwa: posterForm.nazwa,
            org: posterForm.org,
            email: posterForm.email,
            locationId: posterForm.locationId,
            dataZgody: posterForm.dataZgody,
            dataZdjecia: posterForm.dataZdjecia,
            status: posterForm.status,
            uwagi: posterForm.uwagi,
          };
      await fetch(DATA_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      setPosterModal(null);
      setPosterForm(emptyPosterForm);
      // Wymuś ponowne pobranie Rejestru przy następnym otwarciu
      fetchAllPosters(true);
      fetchData(true);
    } catch (err) {
      console.error(err);
      alert('Błąd zapisu. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setPosterSubmitting(false);
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
    <div className="flex flex-col h-screen overflow-hidden animate-fadeIn">

      <header className="shrink-0 bg-white border-b border-slate-200 pl-56 pr-4 py-2 flex flex-wrap gap-3 items-center">
        {/* Search input + type filter — tylko na mapie */}
        {view === 'map' && (
          <>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 md:w-72">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Szukaj tablicy..."
                className="bg-transparent border-none outline-none text-slate-700 font-bold w-full placeholder:font-normal text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>WSZYSTKIE</button>
              <button onClick={() => setFilterType('plakat')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'plakat' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-slate-600'}`}>PLAKATY</button>
              <button onClick={() => setFilterType('baner')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'baner' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'hover:bg-orange-50 text-slate-600'}`}>BANERY</button>
            </div>
          </>
        )}
        {/* View toggle + coord picker — admin only */}
        {isAdmin && (
          <div className="ml-auto flex gap-2 items-center">
            {/* Tryb współrzędnych — do znajdowania pozycji nowych pinezek */}
            {view === 'map' && (
              <>
                <button
                  onClick={() => { setNewPoster({ ...emptyNewPoster }); setAddPosterModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  + Dodaj plakat
                </button>
                <button
                  onClick={() => { setCoordMode(m => !m); setCoordPreview(null); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${coordMode ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                  title="Kliknij w mapę żeby sprawdzić współrzędne pineski"
                >
                  📍 Współrzędne
                </button>
              </>
            )}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => { setView('map'); setCoordMode(false); setCoordPreview(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Map className="w-3.5 h-3.5" /> Mapa
              </button>
              <button
                onClick={() => setView('rejestr')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'rejestr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <List className="w-3.5 h-3.5" /> Rejestr
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 relative overflow-hidden">
        {view === 'map' ? (
          <div
            className={`w-full h-full relative ${coordMode ? 'cursor-crosshair' : ''}`}
            onClick={coordMode ? (e) => {
              const coords = getMapCoords(e);
              if (coords) setCoordPreview(coords);
            } : undefined}
          >
            <img
              ref={imgRef}
              src="/mapa.png"
              alt="Mapa kampusu"
              className="w-full h-full object-contain"
              onLoad={() => {
                setFilteredLocations(prev => [...prev]);
              }}
            />

            {/* Panel współrzędnych — pokazuje się po kliknięciu w trybie 📍 */}
            {coordMode && coordPreview && (
              <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-2xl min-w-[220px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Współrzędne pineski</span>
                  <button onClick={(e) => { e.stopPropagation(); setCoordPreview(null); }} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
                <p className="font-mono text-sm font-bold">left: <span className="text-amber-300">{coordPreview.x}%</span></p>
                <p className="font-mono text-sm font-bold">top: <span className="text-amber-300">{coordPreview.y}%</span></p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(`top: "${coordPreview.y}%", left: "${coordPreview.x}%"`);
                    alert(`Skopiowano!\ntop: "${coordPreview.y}%"\nleft: "${coordPreview.x}%"\n\nWpisz te wartości w arkuszu Miejsca (kolumny E i F) dla nowej lokalizacji.`);
                  }}
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all"
                >
                  Kopiuj do schowka
                </button>
                <p className="text-[9px] text-slate-400 mt-2 leading-tight">Kliknij ponownie w mapę żeby pobrać inne współrzędne.</p>
              </div>
            )}

            {/* Baner informacyjny gdy tryb współrzędnych aktywny */}
            {coordMode && !coordPreview && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white rounded-xl px-5 py-3 shadow-xl text-xs font-black uppercase tracking-widest pointer-events-none">
                📍 Kliknij w mapę żeby pobrać współrzędne nowej pineski
              </div>
            )}

            {!coordMode && filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); setSelected(loc); setAdminTab('info'); }}
                className="absolute transition-all duration-300 hover:scale-125 focus:outline-none z-20"
                style={calcHotspotStyle(loc)}
              >
                {/* Pin */}
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white shadow border-[1.5px] border-white
                  ${loc.type === 'baner' ? 'bg-orange-500' : 'bg-blue-600'}
                  ${loc.free === 0 ? 'ring-2 ring-red-500/60' : ''}`}>
                  {loc.type === 'baner'
                    ? <Flag className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    : <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  }
                </div>
                {/* Tooltip (per D-04) */}
                {hoveredId === loc.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
                    bg-slate-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl pointer-events-none">
                    <p className="font-bold">{loc.name}</p>
                    <p className="text-slate-300 capitalize">{loc.type}</p>
                    <p className={`font-bold ${loc.free > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {loc.free > 0 ? `${loc.free} wolne` : 'Brak miejsc'}
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          // === REJESTR PLAKATÓW I BANERÓW (per D-11, D-12, D-13) ===
          <div className="flex flex-col h-full overflow-hidden">
            {/* Registry filter bar */}
            <div className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap gap-3 items-center">
              {/* Status filter tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {[
                  { key: 'all', label: 'Wszystkie' },
                  { key: 'aktywne', label: 'Aktywne' },
                  { key: 'zakonczone', label: 'Zakończone' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRegistryFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      registryFilter === key
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Search input */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 md:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Szukaj po CRED, nazwie, org..."
                  value={registrySearch}
                  onChange={e => setRegistrySearch(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full placeholder-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {(() => {
                    const filtered = allPosters.filter(p => {
                      const matchFilter =
                        registryFilter === 'all' ||
                        (registryFilter === 'aktywne' && p.status === 'AKTYWNE') ||
                        (registryFilter === 'zakonczone' && p.status !== 'AKTYWNE');
                      const q = registrySearch.toLowerCase();
                      const matchSearch =
                        !q ||
                        (p.credId || '').toLowerCase().includes(q) ||
                        (p.nazwa || '').toLowerCase().includes(q) ||
                        (p.org || '').toLowerCase().includes(q);
                      return matchFilter && matchSearch;
                    });
                    return `${filtered.length} wyników`;
                  })()}
                </span>
                <button
                  onClick={() => { setPosterForm(emptyPosterForm); setPosterModal('add'); }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all shadow-sm"
                >
                  + Dodaj nowy wpis
                </button>
              </div>
            </div>

            {/* Table area */}
            <div className="flex-1 overflow-auto">
              {postersLoading && (
                <div className="flex items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ładowanie rejestru...</span>
                </div>
              )}

              {!postersLoading && (() => {
                const filtered = allPosters.filter(p => {
                  const matchFilter =
                    registryFilter === 'all' ||
                    (registryFilter === 'aktywne' && p.status === 'AKTYWNE') ||
                    (registryFilter === 'zakonczone' && p.status !== 'AKTYWNE');
                  const q = registrySearch.toLowerCase();
                  const matchSearch =
                    !q ||
                    (p.credId || '').toLowerCase().includes(q) ||
                    (p.nazwa || '').toLowerCase().includes(q) ||
                    (p.org || '').toLowerCase().includes(q);
                  return matchFilter && matchSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <p className="text-sm font-bold text-slate-400 text-center py-16 bg-slate-50">
                      {allPosters.length === 0
                        ? 'Brak danych w rejestrze. Sprawdź połączenie z bazą.'
                        : 'Brak wyników dla wybranych filtrów.'}
                    </p>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        {['Kod CRED', 'Nazwa', 'Organizacja', 'Lokalizacja', 'Data zawieszenia', 'Termin zdjęcia', 'Status', ''].map(col => (
                          <th key={col} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((poster, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-black text-slate-800 whitespace-nowrap">{poster.credId || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{noWidows(poster.nazwa) || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{poster.org || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{poster.locationId || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{poster.dataZgody || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{poster.dataZdjecia || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                              poster.status === 'AKTYWNE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {poster.status === 'AKTYWNE' ? 'Aktywny' : 'Zakończony'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setPosterForm({
                                  credId: poster.credId || '',
                                  type: poster.type || 'plakat',
                                  nazwa: poster.nazwa || '',
                                  org: poster.org || '',
                                  email: poster.email || '',
                                  locationId: poster.locationId || '',
                                  dataZgody: poster.dataZgody || '',
                                  dataZdjecia: poster.dataZdjecia || '',
                                  status: poster.status || 'AKTYWNE',
                                  uwagi: poster.uwagi || '',
                                });
                                setPosterModal('edit');
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all"
                            >
                              Edytuj
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-500 ease-in-out z-40 overflow-y-auto ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <div className="flex flex-col min-h-full">
            <div className="h-64 bg-slate-200 relative group shrink-0">
              {selected.image ? (
                <img src={toDriveImg(selected.image)} className="w-full h-full object-cover" alt="Podgląd Miejsca" />
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
                <h2 className="text-xl font-black text-slate-800 leading-tight">{noWidows(selected.name)}</h2>
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
                      const occupiedCount = (selected.capacity || 0) - (selected.free ?? (selected.capacity || 0));
                      const isOccupied = !!posterInSlot || (activePosters.length === 0 && i < occupiedCount);

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
                <div className="animate-fadeIn space-y-8">

                  {/* === SEKCJA 1: Aktywne plakaty (per D-09) === */}
                  {/* NOTE dla GAS: activePosters[].endDate jest nieobecne w doGet().
                      Fix GAS: dodaj endDate: Utilities.formatDate(new Date(row[1]), 'Europe/Warsaw', 'dd.MM.yyyy')
                      do push() w bloku budowania activePosters w funkcji doGet().
                      Frontend stosuje fallback: {poster.endDate ?? '—'} */}
                  <section>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
                      Zawieszone Plakaty ({(selected.capacity || 0) - (selected.free ?? (selected.capacity || 0))}/{selected.capacity || 0})
                    </h3>
                    <div className="space-y-3">
                      {(selected.activePosters || []).length > 0 ? (
                        selected.activePosters.map((poster, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{poster.credId}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{noWidows(poster.nazwa)} ({poster.org})</p>
                              <p className="text-[10px] text-red-500 font-bold mt-1">Zdjąć do: {poster.endDate ?? '—'}</p>
                            </div>
                            <button
                              onClick={() => handleRemovePoster(poster.credId)}
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
                  </section>

                  {/* === SEKCJA 2: Formularz dodawania (per D-09) — wielolokalizacyjny === */}
                  <section className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                    <h3 className="font-black text-blue-900 text-xs uppercase tracking-widest mb-4">Ewidencjonuj Nowy Plakat</h3>
                      <form onSubmit={handleAddPoster} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Znak Zgody (CRED)</label>
                          <input type="text" required value={newPoster.credId} onChange={e => setNewPoster({...newPoster, credId: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. P.PKT.01/01/2026/SSUEW" />
                        </div>
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
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 uppercase mb-2">Lokalizacje ({newPoster.locationIds.length} wybranych)</label>
                          <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                            {locations.map(loc => (
                              <label key={loc.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded-lg px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={newPoster.locationIds.includes(loc.id)}
                                  onChange={e => {
                                    const ids = newPoster.locationIds;
                                    setNewPoster({
                                      ...newPoster,
                                      locationIds: e.target.checked
                                        ? [...ids, loc.id]
                                        : ids.filter(id => id !== loc.id)
                                    });
                                  }}
                                  className="accent-blue-600 w-4 h-4 flex-shrink-0"
                                />
                                <span className="text-xs font-bold text-slate-700 leading-tight">{loc.name}</span>
                                {loc.free <= 0 && (
                                  <span className="text-[9px] font-black text-red-500 uppercase ml-auto">pełne</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-2">
                          {isSubmitting ? 'Zapisywanie w Bazie...' : `Zatwierdź Powieszenie${newPoster.locationIds.length > 1 ? ` (${newPoster.locationIds.length} lok.)` : ''}`}
                        </button>
                      </form>
                  </section>

                  {/* === SEKCJA 3: Historia (per D-09) — lazy-loaded === */}
                  <section>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Historia Lokalizacji</h3>
                    {historyLoading && (
                      <div className="flex items-center justify-center py-6 gap-3">
                        <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ładowanie historii...</span>
                      </div>
                    )}
                    {historyError && !historyLoading && (
                      <p className="text-sm font-bold text-red-500 text-center py-4 bg-red-50 rounded-xl border border-red-100">{historyError}</p>
                    )}
                    {!historyLoading && !historyError && locationHistory.length === 0 && (
                      <p className="text-sm font-bold text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Brak danych historycznych.
                      </p>
                    )}
                    {!historyLoading && locationHistory.length > 0 && (
                      <div className="space-y-2">
                        {locationHistory.map((entry, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{entry.credId}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{noWidows(entry.nazwa)} — {entry.org}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Zdjęto: {entry.endDate}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${entry.status === 'AKTYWNE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {entry.status === 'AKTYWNE' ? 'Aktywny' : 'Zakończony'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* === SEKCJA 4: Statystyki (per D-09) — derived from locationHistory === */}
                  {locationHistory.length > 0 && (
                    <section>
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Statystyki Lokalizacji</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                          <div className="text-2xl font-black text-slate-800">{locationHistory.length}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Łączne rezerwacje</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                          <div className="text-2xl font-black text-slate-800">
                            {locationHistory.filter(e => e.status === 'AKTYWNE').length}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Aktualnie aktywnych</div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* === EDYCJA DANYCH LOKALIZACJI (per D-10) === */}
                  <section className="border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Dane Lokalizacji</h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
                        >
                          Edytuj
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <form onSubmit={handleUpdateLocation} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nazwa Lokalizacji</label>
                          <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pojemność (liczba miejsc)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="20"
                            value={editForm.capacity}
                            onChange={e => setEditForm({...editForm, capacity: e.target.value})}
                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">URL Zdjęcia Lokalizacji</label>
                          <input
                            type="url"
                            value={editForm.imageUrl}
                            onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            {isSubmitting ? 'Zapisuję...' : 'Zapisz Zmiany'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-bold text-slate-800">Nazwa:</span> {noWidows(selected.name)}</p>
                        <p><span className="font-bold text-slate-800">Pojemność:</span> {selected.capacity} miejsc</p>
                        <p><span className="font-bold text-slate-800">Zdjęcie:</span> {selected.image ? 'Ustawione' : 'Brak'}</p>
                      </div>
                    )}
                  </section>

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
                <h3 className="text-xl font-black text-slate-800">Procedura</h3>
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
                  <p className="text-sm font-medium text-slate-600 mt-1">Przynieś plakat do biura SSUEW i podaj znak CRED z pisma. Administrator wpisze go do cyfrowej ewidencji i wyzwoli przypomnienia mailowe.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsInfoModalOpen(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-lg">Zrozumiałem</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DODAJ / EDYTUJ WPIS W REJESTRZE ===== */}
      {posterModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setPosterModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="font-black text-slate-800 text-lg">
                {posterModal === 'add' ? '+ Dodaj nowy wpis do Rejestru' : `Edytuj: ${posterForm.credId}`}
              </h2>
              <button onClick={() => setPosterModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePoster} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Znak CRED *</label>
                  <input
                    type="text" required
                    value={posterForm.credId}
                    readOnly={posterModal === 'edit'}
                    onChange={e => setPosterForm({...posterForm, credId: e.target.value})}
                    className={`w-full border p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none ${posterModal === 'edit' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                    placeholder="np. P.PKT.01/01/2026/SSUEW"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Typ *</label>
                  <select
                    required value={posterForm.type}
                    onChange={e => setPosterForm({...posterForm, type: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="plakat">Plakat</option>
                    <option value="baner">Baner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Nazwa / Wydarzenie *</label>
                <input
                  type="text" required
                  value={posterForm.nazwa}
                  onChange={e => setPosterForm({...posterForm, nazwa: e.target.value})}
                  className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                  placeholder="np. Wampiriada Wiosna 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Organizacja *</label>
                  <input
                    type="text" required
                    value={posterForm.org}
                    onChange={e => setPosterForm({...posterForm, org: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                    placeholder="np. NZS UEW"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Email *</label>
                  <input
                    type="email" required
                    value={posterForm.email}
                    onChange={e => setPosterForm({...posterForm, email: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                    placeholder="kontakt@org.pl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={posterModal === 'add' ? 'col-span-2' : ''}>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">
                    {posterModal === 'add' ? `Lokalizacje * (${posterForm.locationIds.length} wybrane)` : 'ID Lokalizacji'}
                  </label>
                  {posterModal === 'add' ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      {locations.map(l => {
                        const checked = posterForm.locationIds.includes(l.id);
                        return (
                          <label key={l.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => {
                              const ids = checked
                                ? posterForm.locationIds.filter(id => id !== l.id)
                                : [...posterForm.locationIds, l.id];
                              setPosterForm({...posterForm, locationIds: ids});
                            }} className="accent-blue-600 w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs font-bold text-slate-800 truncate">{l.name}</span>
                              <span className="block text-[10px] font-mono text-slate-400">{l.id}</span>
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex-shrink-0 ${l.free > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {l.free > 0 ? `${l.free} wolne` : 'pełne'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      value={posterForm.locationId}
                      onChange={e => setPosterForm({...posterForm, locationId: e.target.value})}
                      className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                    >
                      <option value="">— wybierz —</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.id} – {l.name}</option>)}
                    </select>
                  )}
                </div>
                {posterModal === 'edit' && <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Status</label>
                  <select
                    value={posterForm.status}
                    onChange={e => setPosterForm({...posterForm, status: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                  >
                    <option value="AKTYWNE">AKTYWNE</option>
                    <option value="ZDJĘTE">ZDJĘTE</option>
                  </select>
                </div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Data zgody (zawieszenia)</label>
                  <input
                    type="text"
                    value={posterForm.dataZgody}
                    onChange={e => setPosterForm({...posterForm, dataZgody: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none"
                    placeholder="dd.MM.yyyy"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Termin zdjęcia *</label>
                  <input
                    type="date" required
                    value={posterForm.dataZdjecia?.includes('.') ? posterForm.dataZdjecia.split('.').reverse().join('-') : posterForm.dataZdjecia}
                    onChange={e => setPosterForm({...posterForm, dataZdjecia: e.target.value})}
                    className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Uwagi</label>
                <textarea
                  value={posterForm.uwagi}
                  onChange={e => setPosterForm({...posterForm, uwagi: e.target.value})}
                  rows={2}
                  className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none resize-none"
                  placeholder="Opcjonalne uwagi..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={posterSubmitting}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  {posterSubmitting ? 'Zapisuję...' : posterModal === 'add' ? 'Dodaj do Rejestru i Bazy' : 'Zapisz zmiany'}
                </button>
                <button
                  type="button" onClick={() => setPosterModal(null)}
                  className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: Szybkie dodawanie plakatu z mapy (bez wyboru pinezki) === */}
      {addPosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h2 className="font-black text-slate-800 text-base uppercase tracking-widest">Ewidencjonuj Nowy Plakat</h2>
              <button onClick={() => setAddPosterModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleAddPoster} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Znak Zgody (CRED)</label>
                <input type="text" required value={newPoster.credId} onChange={e => setNewPoster({...newPoster, credId: e.target.value})} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. P.PKT.01/01/2026/SSUEW" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nazwa Wydarzenia / Plakatu</label>
                <input type="text" required value={newPoster.name} onChange={e => setNewPoster({...newPoster, name: e.target.value})} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. Wampiriada Wiosna" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Organizacja / Koło Naukowe</label>
                <input type="text" required value={newPoster.organization} onChange={e => setNewPoster({...newPoster, organization: e.target.value})} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="np. NZS UEW" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Adres e-mail z formularza</label>
                <input type="email" required value={newPoster.email} onChange={e => setNewPoster({...newPoster, email: e.target.value})} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none" placeholder="kontakt@nzs.ue.wroc.pl" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Termin Zdjęcia Plakatu</label>
                <input type="date" required value={newPoster.endDate} onChange={e => setNewPoster({...newPoster, endDate: e.target.value})} className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-300 outline-none text-red-600" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">
                  Lokalizacje <span className="text-blue-600">({newPoster.locationIds.length} wybranych)</span>
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {locations.map(loc => (
                    <label key={loc.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-slate-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={newPoster.locationIds.includes(loc.id)}
                        onChange={e => {
                          const ids = newPoster.locationIds;
                          setNewPoster({
                            ...newPoster,
                            locationIds: e.target.checked ? [...ids, loc.id] : ids.filter(id => id !== loc.id)
                          });
                        }}
                        className="accent-blue-600 w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm font-bold text-slate-700 flex-1">{loc.name}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${loc.free > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {loc.free > 0 ? `${loc.free} wolne` : 'pełne'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  {isSubmitting ? 'Zapisywanie...' : `Zatwierdź Powieszenie${newPoster.locationIds.length > 1 ? ` (${newPoster.locationIds.length} lok.)` : ''}`}
                </button>
                <button type="button" onClick={() => setAddPosterModal(false)} className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
