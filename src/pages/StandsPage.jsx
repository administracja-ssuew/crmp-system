import { useState, useEffect } from 'react';

// === KONFIGURACJA ===
const DATA_URL = "https://script.google.com/macros/s/AKfycbwNtQx8na9KJnx6RvdwgzcmPM07Vym5dqgjrGJCXTxOMxdv2Q2kGqquME3uqpgSTBs/exec";
const ITEMS_PER_PAGE = 6; 

const BUILDING_INFO = {
  'Z': { name: 'Budynek Z', capacity: 2, color: 'bg-blue-100 text-blue-700' },
  'CKU': { name: 'Budynek CKU', capacity: 2, color: 'bg-purple-100 text-purple-700' },
  'E': { name: 'Budynek E', capacity: 1, color: 'bg-green-100 text-green-700' },
  'D': { name: 'Budynek D', capacity: 1, color: 'bg-orange-100 text-orange-700' },
  'U': { name: 'Budynek U', capacity: 1, color: 'bg-yellow-100 text-yellow-700' },
  'W': { name: 'Budynek W', capacity: 1, color: 'bg-pink-100 text-pink-700' },
};

export default function StandsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const [currentPage, setCurrentPage] = useState(1);

  // === POBIERANIE DANYCH ===
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // === LOGIKA FILTROWANIA ===
  const getProcessedData = () => {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = data.filter(item => {
      const search = searchTerm.toLowerCase();
      const org = (item.org || '').toLowerCase();
      const building = (item.building || '').toLowerCase();
      return org.includes(search) || building.includes(search);
    });

    if (activeTab === 'upcoming') {
      filtered = filtered.filter(item => item.date >= today);
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } 
    else if (activeTab === 'pending') {
      filtered = filtered.filter(item => {
        const s = (item.status || '').toLowerCase();
        return s.includes('zaopiniowane') || s.includes('zgłoszone');
      });
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } 
    else if (activeTab === 'history') {
      filtered = filtered.filter(item => item.date < today);
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return filtered;
  };

  const processedData = getProcessedData();
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

      <div className="max-w-5xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 animate-fadeIn">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🗓️</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Rejestr Stoisk Promocyjnych</h1>
            </div>
            <p className="text-slate-500 font-medium mt-2 max-w-lg">
              Oficjalny harmonogram stoisk promocyjnych na terenie kampusu UEW.
            </p>
          </div>
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

        {/* PASEK NARZĘDZI */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8 animate-slideUp">
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
            <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} label="Nadchodzące" />
            <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} label="W toku" count={data.filter(i => (i.status||'').toLowerCase().includes('zaopiniowane') || (i.status||'').toLowerCase().includes('zgłoszone')).length} />
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Archiwum" />
          </div>

          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Szukaj organizacji, budynku..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-none outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA KART REZERWACJI */}
        <div className="space-y-4 animate-slideUp min-h-[400px]">
          {paginatedData.map((row, index) => {
            const building = BUILDING_INFO[row.building] || { name: row.building, capacity: '?', color: 'bg-slate-100 text-slate-600' };
            const dateObj = new Date(row.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('pl-PL', { month: 'short' });
            
            return (
              <div key={index} className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                
                {/* 1. KALENDARZYK */}
                <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase group-hover:text-indigo-400">{month}</span>
                  <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-700">{day}</span>
                </div>

                {/* 2. GŁÓWNE INFO */}
                <div className="flex-grow">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border border-transparent ${building.color} bg-opacity-50`}>
                      📍 {building.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 flex items-center gap-1">
                      🕒 {row.start?.substring(0,5)} - {row.end?.substring(0,5)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{row.org}</h3>
                  <p className="text-sm text-slate-500 font-medium">{row.title || 'Wydarzenie promocyjne'}</p>
                </div>

                {/* 3. STATUS */}
                <div className="shrink-0 w-full md:w-auto flex justify-end">
                   <StatusBadge status={row.status} />
                </div>
              </div>
            );
          })}

          {/* STAN PUSTY */}
          {paginatedData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <span className="text-5xl mb-4 opacity-20">📭</span>
              <p className="font-bold text-lg text-slate-600">Brak wyników</p>
              <p className="text-sm">Nie znaleziono rezerwacji w tej kategorii.</p>
            </div>
          )}
        </div>

        {/* PAGINACJA */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition"
            >
              ←
            </button>
            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
              Strona {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* === MODAL: PROCEDURA MAILOWA === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-bounceIn flex flex-col max-h-[90vh]">
            
            {/* Header Modala */}
            <div className="bg-slate-900 p-8 text-center shrink-0">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl backdrop-blur-sm border border-white/10">
                🚀
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Jak zarezerwować stoisko?</h2>
              <p className="text-slate-400 text-sm font-medium">To system poglądowy. Właściwa procedura odbywa się za sprawą wniosków - drogą mailową.</p>
            </div>
            
            {/* Kroki Procedury (Przewijana zawartość) */}
            <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
              
              <Step 
                num="1" 
                title="Wybierz termin" 
                desc="Sprawdź w tym Rejestrze, czy wybrana data i budynek są wolne (nie ma statusu 'Potwierdzone')." 
              />
              
              <Step 
                num="2" 
                title="Wyślij podanie (EOD)" 
                desc={
                  <span>
                    Napisz podanie zgodnie z zasadami <strong>CRED SSUEW</strong> i wyślij je na adres: <br/>
                    <a href="mailto:administracja@samorzad.ue.wroc.pl" className="text-indigo-600 font-bold hover:underline">administracja@samorzad.ue.wroc.pl</a>.
                  </span>
                }
              />

              <Step 
                num="3" 
                title="Czekaj na opinię" 
                desc="Członek ds. Administracji SSUEW zaopiniuje Twoje podanie. Wtedy w tym systemie pojawi się status: 'ZAOPINIOWANE'." 
                status="Zaopiniowane"
              />

              <Step 
                num="4" 
                title="Zgoda Zastępcy Kanclerza ds.&nbsp;Technicznych" 
                desc={
                  <span>
                    Prześlij zaopiniowane podanie do Zastępcy Kanclerza ds.&nbsp;Technicznych (<a href="mailto:wieslaw.witter@ue.wroc.pl" className="text-indigo-600 font-bold hover:underline">wieslaw.witter@ue.wroc.pl</a>). Po jego zgodzie status zmieni się na 'POTWIERDZONE'.
                  </span>
                } 
                status="Potwierdzone"
                isLast={true}
              />

            </div>

            {/* Footer Modala */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full md:w-auto px-12 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
              >
                Rozumiem, zamykam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// === KOMPONENTY UI ===

const TabButton = ({ active, onClick, label, count }) => (
  <button 
    onClick={onClick}
    className={`
      relative px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}
    `}
  >
    {label}
    {count > 0 && (
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${active ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}>
        {count}
      </span>
    )}
  </button>
);

const Step = ({ num, title, desc, status, isLast }) => (
  <div className="flex gap-5">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm border-2 border-indigo-100 shadow-sm shrink-0">
        {num}
      </div>
      {!isLast && <div className="w-0.5 h-full bg-slate-100 my-2 rounded-full min-h-[40px]"></div>}
    </div>
    <div className="pb-2 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
        <h3 className="font-bold text-slate-900 text-lg leading-tight">{title}</h3>
        {status && (
          <div className="shrink-0 w-fit">
            <StatusBadge status={status} mini />
          </div>
        )}
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

  if (s.includes('potwierdzone')) { 
    style = 'bg-emerald-100 text-emerald-700 border-emerald-200'; 
    icon = '✅'; 
    label = 'Potwierdzone';
  }
  else if (s.includes('zaopiniowane')) { 
    style = 'bg-amber-100 text-amber-700 border-amber-200'; 
    icon = '⚖️'; 
    label = 'Zaopiniowane';
  }
  else if (s.includes('zgłoszone')) { 
    style = 'bg-blue-100 text-blue-700 border-blue-200'; 
    icon = '📩'; 
    label = 'Zgłoszone';
  }
  else if (s.includes('odrzucone')) { 
    style = 'bg-red-100 text-red-700 border-red-200'; 
    icon = '⛔'; 
    label = 'Odrzucone';
  }

  if (mini) {
    return (
      <span className={`text-[10px] px-2 py-1 rounded border ${style} font-bold uppercase truncate inline-block`}>
        {label}
      </span>
    );
  }

  return (
    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${style}`}>
      <span className="text-base leading-none">{icon}</span> 
      <span className="pt-0.5">{label}</span>
    </div>
  );
}