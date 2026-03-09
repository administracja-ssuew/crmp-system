import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// === KONFIGURACJA ===
const DATA_URL = "https://script.google.com/macros/s/AKfycbwNtQx8na9KJnx6RvdwgzcmPM07Vym5dqgjrGJCXTxOMxdv2Q2kGqquME3uqpgSTBs/exec"; 
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1A63PV5WAj5B6jkbgurENB2sZ9ncGaEOQftkCzDBZKsM/edit"; 
const ITEMS_PER_PAGE = 6; 

// === WHITELISTA ADMINÓW ===
const ADMIN_EMAILS = [
  'twoj.mail@samorzad.ue.wroc.pl',
  'administracja@samorzad.ue.wroc.pl' // Zmień na swój e-mail
];

const BUILDING_INFO = {
  'Z': { name: 'Budynek Z', capacity: 2, color: 'bg-blue-100 text-blue-700' },
  'CKU': { name: 'Budynek CKU', capacity: 2, color: 'bg-purple-100 text-purple-700' },
  'E': { name: 'Budynek E', capacity: 1, color: 'bg-green-100 text-green-700' },
  'D': { name: 'Budynek D', capacity: 1, color: 'bg-orange-100 text-orange-700' },
  'U': { name: 'Budynek U', capacity: 1, color: 'bg-yellow-100 text-yellow-700' },
  'W': { name: 'Budynek W', capacity: 1, color: 'bg-pink-100 text-pink-700' },
};

export default function StandsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start: '08:00',
    end: '15:00',
    building: 'Z',
    org: '',
    title: '',
    status: 'Zaopiniowane' 
  });
  
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMapDate, setSelectedMapDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('list'); 
  const [weekOffset, setWeekOffset] = useState(0); 

  const fetchData = () => {
    setLoading(true);
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => {
        const bookings = json.bookings || json || [];
        setData(bookings);
        setLoading(false);
      })
      .catch(err => {
        console.error("Błąd:", err);
        setError("Błąd połączenia z bazą.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, viewMode]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(DATA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'add', ...addForm })
      });
      const result = await response.json();

      if (result.success) {
        setIsAdminModalOpen(false);
        setAddForm({ ...addForm, org: '', title: '' });
        fetchData(); 
      } else {
        alert("Błąd dodawania zapisu do bazy.");
      }
    } catch (err) {
      alert("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(DATA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', id: id, status: newStatus })
      });
      const result = await response.json();

      if (result.success) {
        fetchData(); 
      } else {
        alert("Błąd aktualizacji statusu.");
      }
    } catch (err) {
      alert("Błąd połączenia z bazą.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getOccupancyForDate = (date) => {
    const occupancy = {};
    Object.keys(BUILDING_INFO).forEach(k => occupancy[k] = []);
    data.forEach(item => {
      if (item.date === date && !(item.status || '').toLowerCase().includes('odrzucone')) {
        const bCode = item.building;
        if (occupancy[bCode]) occupancy[bCode].push(item);
      }
    });
    return occupancy;
  };

  const currentOccupancy = getOccupancyForDate(selectedMapDate);

  const getProcessedData = () => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = data.filter(item => {
      const search = searchTerm.toLowerCase();
      const org = (item.org || '').toLowerCase();
      const bCode = (item.building || '');
      const bName = (BUILDING_INFO[bCode]?.name || bCode).toLowerCase(); 
      return org.includes(search) || bName.includes(search) || bCode.toLowerCase().includes(search);
    });

    if (activeTab === 'upcoming') {
      filtered = filtered.filter(item => item.date >= today && (item.status||'').toLowerCase().includes('potwierdzone'));
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(item => {
        const s = (item.status || '').toLowerCase();
        return s.includes('zaopiniowane') || s.includes('zgłoszone');
      });
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (activeTab === 'history') {
      filtered = filtered.filter(item => item.date < today || (item.status||'').toLowerCase().includes('odrzucone'));
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filtered;
  };

  const processedData = getProcessedData();
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + (weekOffset * 7));
    
    const days = [];
    const todayStr = today.toISOString().split('T')[0];

    for (let i = 0; i < 5; i++) { 
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      days.push({
         dateStr: dateStr,
         displayStr: d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' }),
         isToday: dateStr === todayStr
      });
    }
    return days;
  };
  const weekDays = getWeekDays();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-indigo-900 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizacja rejestru...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20 pt-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-6xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 animate-fadeIn">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🗓️</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Rejestr Stoisk Promocyjnych</h1>
            </div>
            <p className="text-slate-500 font-medium mt-2 max-w-lg">
              Oficjalny harmonogram stoisk promocyjnych na terenie kampusu UEW.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* PANEL ADMINA */}
            {isAdmin && (
              <>
                <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-4 bg-white text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-50 transition border border-slate-200 shadow-sm">
                  ✏️ Edytuj w Excelu
                </a>
                <button onClick={() => setIsAdminModalOpen(true)} className="px-5 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black tracking-wide hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                  + Wprowadź do Rejestru
                </button>
              </>
            )}
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white pl-6 pr-8 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className="bg-white/20 rounded-lg p-1 group-hover:bg-white/30 transition">➕</div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Zarezerwuj przestrzeń</div>
                <div className="text-sm">Procedura krok po kroku</div>
              </div>
            </button>
          </div>
        </div>

        {/* WIZUALNA MAPA DOSTĘPNOŚCI */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">📍 Mapa Dostępności Kampusu</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Szybki podgląd wolnych miejsc (BHP)</p>
            </div>
            <input type="date" value={selectedMapDate} onChange={(e) => setSelectedMapDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(BUILDING_INFO).map(([code, info]) => {
              const occupants = currentOccupancy[code] || [];
              const count = occupants.length;
              const capacity = info.capacity;
              const isFull = count >= capacity;
              const percentage = Math.min(100, (count / capacity) * 100);

              return (
                <div key={code} className={`p-5 rounded-2xl border transition-all ${isFull ? 'bg-red-50/50 border-red-100 shadow-sm' : 'bg-white border-slate-100 hover:shadow-md hover:border-indigo-100'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-slate-800">{info.name}</h3>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-sm ${isFull ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                      {count} / {info.capacity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="space-y-1.5 min-h-[40px]">
                    {occupants.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Wszystkie miejsca wolne
                      </p>
                    ) : (
                      occupants.map((occ, idx) => (
                        <p key={idx} className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-400' : 'bg-indigo-400'}`}></span> {occ.org}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PASEK NARZĘDZI */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8 animate-slideUp">
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
            <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>☰ Widok Listy</button>
            <button onClick={() => setViewMode('grid')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>📅 Szeroki Kalendarz</button>
          </div>
          {viewMode === 'list' && (
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" placeholder="Szukaj organizacji, budynku..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-none outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          )}
        </div>

        {/* DODATKOWE ZAKŁADKI */}
        {viewMode === 'list' && (
           <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto mb-6 w-fit animate-fadeIn">
             <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} label="Zatwierdzone" count={data.filter(i => i.date >= new Date().toISOString().split('T')[0] && (i.status||'').toLowerCase().includes('potwierdzone')).length} />
             <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} label="W toku" count={data.filter(i => (i.status||'').toLowerCase().includes('zaopiniowane') || (i.status||'').toLowerCase().includes('zgłoszone')).length} />
             <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Archiwum" />
           </div>
        )}

        {/* RENDEROWANIE WIDOKÓW */}
        {viewMode === 'list' ? (
          <div className="space-y-4 animate-slideUp min-h-[400px]">
            {paginatedData.map((row, index) => {
              const building = BUILDING_INFO[row.building] || { name: row.building, capacity: '?', color: 'bg-slate-100 text-slate-600' };
              const dateObj = new Date(row.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString('pl-PL', { month: 'short' });
              
              const isPending = (row.status || '').toLowerCase().includes('zaopiniowane') || (row.status || '').toLowerCase().includes('zgłoszone');
              
              return (
                <div key={index} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                  
                  <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase group-hover:text-indigo-400">{month}</span>
                    <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-700">{day}</span>
                  </div>

                  <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border border-transparent ${building.color} bg-opacity-50`}>📍 {building.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200">🕒 {row.start?.substring(0,5)} - {row.end?.substring(0,5)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{row.org}</h3>
                    <p className="text-sm text-slate-500 font-medium">{row.title || 'Wydarzenie promocyjne'}</p>
                  </div>

                  <div className="shrink-0 w-full md:w-auto flex flex-col items-end gap-2">
                     <StatusBadge status={row.status} />
                     
                     {/* PRZYCISK ZATWIERDZANIA DLA ADMINA */}
                     {isAdmin && isPending && (
                       <button 
                         onClick={() => handleStatusUpdate(row.id, 'Potwierdzone')}
                         disabled={updatingId === row.id}
                         className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                       >
                         {updatingId === row.id ? 'Przetwarzanie...' : 'Zatwierdź Kanclerza ✅'}
                       </button>
                     )}
                  </div>
                </div>
              );
            })}

            {paginatedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <span className="text-5xl mb-4 opacity-20">📭</span>
                <p className="font-bold text-lg text-slate-600">Brak wyników</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 disabled:opacity-50">←</button>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700">Strona {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 disabled:opacity-50">→</button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between bg-white p-4 rounded-t-3xl border border-slate-200 border-b-0">
              <button onClick={() => setWeekOffset(o => o - 1)} className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition">← Poprzedni</button>
              <h3 className="font-black text-slate-800 text-lg">Tydzień: {weekDays[0].displayStr.split(',')[1]} - {weekDays[4].displayStr.split(',')[1]}</h3>
              <button onClick={() => setWeekOffset(o => o + 1)} className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition">Następny →</button>
            </div>
            
            <div className="overflow-x-auto bg-white rounded-b-3xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-r border-slate-200 bg-slate-50 w-48 sticky left-0 z-10"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budynek</span></th>
                    {weekDays.map((day, idx) => (
                      <th key={idx} className={`p-4 border-b border-slate-200 text-center w-1/5 ${day.isToday ? 'bg-amber-50 border-b-2 border-b-amber-500' : 'bg-slate-50'}`}>
                        {day.isToday && <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Dzisiaj</div>}
                        <div className={`text-sm font-black capitalize ${day.isToday ? 'text-amber-900' : 'text-slate-700'}`}>{day.displayStr.split(',')[0]}</div>
                        <div className={`text-xs font-bold ${day.isToday ? 'text-amber-700' : 'text-slate-500'}`}>{day.displayStr.split(',')[1]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(BUILDING_INFO).map(([bCode, info]) => (
                    <tr key={bCode} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-b border-r border-slate-200 bg-white sticky left-0 z-10">
                        <div className="font-black text-slate-800">{info.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Miejsc: {info.capacity}</div>
                      </td>
                      {weekDays.map((day, idx) => {
                        const occupants = data.filter(item => item.building === bCode && item.date === day.dateStr && !(item.status || '').toLowerCase().includes('odrzucone'));
                        const isFull = occupants.length >= info.capacity;
                        const isFree = occupants.length === 0;
                        return (
                          <td key={idx} className={`p-3 border-b border-slate-100 align-top relative ${day.isToday ? 'bg-amber-50/20' : ''}`}>
                            <div className={`h-full min-h-[80px] rounded-xl p-2 border ${isFree ? 'bg-emerald-50/30 border-emerald-100/50' : isFull ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/40 border-amber-100'}`}>
                              <div className="absolute top-4 right-4 text-[10px] font-black text-slate-400">{occupants.length}/{info.capacity}</div>
                              {isFree ? (
                                <div className="h-full flex items-center justify-center opacity-40"><span className="text-xs font-bold text-emerald-600 uppercase">Wolne</span></div>
                              ) : (
                                <div className="space-y-1.5 mt-4">
                                  {occupants.map((occ, i) => (
                                    <div key={i} className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                                      <p className="text-[11px] font-black text-slate-800 truncate" title={occ.org}>{occ.org}</p>
                                      <p className="text-[9px] font-bold text-slate-500 flex justify-between items-center mt-0.5">
                                        <span>{occ.start?.substring(0,5)}-{occ.end?.substring(0,5)}</span>
                                        <span className={`w-2 h-2 rounded-full ${(occ.status||'').toLowerCase().includes('potwierdzone') ? 'bg-emerald-400' : 'bg-amber-400'}`} title={occ.status}></span>
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* === MODAL: PROCEDURA MAILOWA (DLA UŻYTKOWNIKA) === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-bounceIn flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 text-center shrink-0">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl backdrop-blur-sm border border-white/10">🚀</div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Jak zarezerwować stoisko?</h2>
              <p className="text-slate-400 text-sm font-medium">To system poglądowy. Właściwa procedura odbywa się za sprawą wniosków - drogą mailową.</p>
            </div>
            <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
              <Step num="1" title="Wybierz termin" desc="Sprawdź na naszej nowej Mapie Dostępności, czy w wybranym dniu i budynku są jeszcze wolne miejsca (limit BHP)." />
              <Step num="2" title="Wyślij podanie (EOD)" desc={<span>Napisz podanie zgodnie z zasadami <strong>CRED SSUEW</strong> i wyślij je na adres: <br/><a href="mailto:administracja@samorzad.ue.wroc.pl" className="text-indigo-600 font-bold hover:underline">administracja@samorzad.ue.wroc.pl</a>.</span>} />
              <Step num="3" title="Czekaj na opinię" desc="Członek ds. Administracji SSUEW zaopiniuje Twoje podanie. Wtedy w tym systemie pojawi się status: 'ZAOPINIOWANE'." status="Zaopiniowane" />
              <Step num="4" title="Zgoda Zastępcy Kanclerza ds. Technicznych" desc={<span>Prześlij zaopiniowane podanie do Zastępcy Kanclerza ds.&nbsp;Technicznych (<a href="mailto:wieslaw.witter@ue.wroc.pl" className="text-indigo-600 font-bold hover:underline">wieslaw.witter@ue.wroc.pl</a>). Pamiętaj, aby w DW koreponencji zawrzeć adres: <a href="mailto:administracja@samorzad.ue.wroc.pl" className="text-indigo-600 font-bold hover:underline">administracja@samorzad.ue.wroc.pl</a>. Po jego zgodzie status zmieni się na 'POTWIERDZONE'.</span>} status="Potwierdzone" isLast={true} />
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full md:w-auto px-12 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">Rozumiem, zamykam</button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: DODAWANIE DO BAZY (TYLKO DLA ADMINA) === */}
      {isAdminModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAdminModalOpen(false)}></div>
          
          <form onSubmit={handleAddSubmit} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounceIn">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                ✏️ Wprowadź wpis do Rejestru
              </h3>
              <button type="button" onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                  <input type="date" required value={addForm.date} onChange={(e) => setAddForm({...addForm, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budynek</label>
                  <select value={addForm.building} onChange={(e) => setAddForm({...addForm, building: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    {Object.entries(BUILDING_INFO).map(([code, info]) => (
                      <option key={code} value={code}>{info.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Godzina Od</label>
                  <input type="time" required value={addForm.start} onChange={(e) => setAddForm({...addForm, start: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Godzina Do</label>
                  <input type="time" required value={addForm.end} onChange={(e) => setAddForm({...addForm, end: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organizacja / Koło</label>
                <input type="text" required placeholder="Np. SKN Młodych Menedżerów" value={addForm.org} onChange={(e) => setAddForm({...addForm, org: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tytuł Wydarzenia / Cel (Opcjonalnie)</label>
                <input type="text" placeholder="Np. Zbiórka charytatywna" value={addForm.title} onChange={(e) => setAddForm({...addForm, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Procedury</label>
                <select value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-amber-600">
                  <option value="Zaopiniowane">⚖️ Zaopiniowane (Domyślny dla nowych)</option>
                  <option value="Potwierdzone">✅ Potwierdzone (Kanclerz OK)</option>
                  <option value="Zgłoszone">📩 Zgłoszone (Oczekuje)</option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsAdminModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Anuluj</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-md transition-all disabled:opacity-70">
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz do bazy'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// === KOMPONENTY UI ===
const TabButton = ({ active, onClick, label, count }) => (
  <button 
    onClick={onClick}
    className={`relative px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
  >
    {label}
    {count > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${active ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}>{count}</span>}
  </button>
);

const Step = ({ num, title, desc, status, isLast }) => (
  <div className="flex gap-5">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm border-2 border-indigo-100 shadow-sm shrink-0">{num}</div>
      {!isLast && <div className="w-0.5 h-full bg-slate-100 my-2 rounded-full min-h-[40px]"></div>}
    </div>
    <div className="pb-2 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
        <h3 className="font-bold text-slate-900 text-lg leading-tight">{title}</h3>
        {status && <div className="shrink-0 w-fit"><StatusBadge status={status} mini /></div>}
      </div>
      <div className="text-slate-500 text-sm leading-relaxed mt-2">{desc}</div>
    </div>
  </div>
);

function StatusBadge({ status, mini }) {
  if (!status) return null;
  const s = status.toLowerCase().trim();
  
  let style = 'bg-slate-100 text-slate-500 border-slate-200';
  let icon = '•';
  let label = status;

  if (s.includes('potwierdzone')) { style = 'bg-emerald-100 text-emerald-700 border-emerald-200'; icon = '✅'; label = 'Potwierdzone'; }
  else if (s.includes('zaopiniowane')) { style = 'bg-amber-100 text-amber-700 border-amber-200'; icon = '⚖️'; label = 'Zaopiniowane'; }
  else if (s.includes('zgłoszone')) { style = 'bg-blue-100 text-blue-700 border-blue-200'; icon = '📩'; label = 'Zgłoszone'; }
  else if (s.includes('odrzucone')) { style = 'bg-red-100 text-red-700 border-red-200'; icon = '⛔'; label = 'Odrzucone'; }

  if (mini) return <span className={`text-[10px] px-2 py-1 rounded border ${style} font-bold uppercase truncate inline-block`}>{label}</span>;
  return (
    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${style}`}>
      <span className="text-base leading-none">{icon}</span> <span className="pt-0.5">{label}</span>
    </div>
  );
}