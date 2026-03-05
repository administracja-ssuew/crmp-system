import { useState, useEffect } from 'react';

export default function EquipmentPage() {
  // === STANY APLIKACJI ===
  const [equipmentData, setEquipmentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // === TUTAJ JEST TWÓJ LINK DO GOOGLE APPS SCRIPT ===
  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  // === POBIERANIE DANYCH Z CRW ===
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        
        // FORMATOWANIE DANYCH Z EXCELA (Zgodne z Twoimi kolumnami!)
        const formattedData = data.map(item => {
          // Inteligentne przypisywanie ikonek na podstawie kolumny "TYP"
          let icon = '📦';
          if (item.TYP === 'OŚW') icon = '💡';
          if (item.TYP === 'AUD') icon = '🔊';
          if (item.TYP === 'WIZ') icon = '📷';
          if (item.TYP === 'ADM') icon = '🚧';

          return {
            id: item.KOD_QR || `SSUEW-BRAK-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            category: `${item.RODZAJ || ''} / ${item.TYP || ''}`.trim(),
            // Automatyczne blokowanie jeśli w uwagach jest "uszkodz"
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            locationPath: item['POLE SPISOWE'] && item['POLE SPISOWE'] !== '-' ? item['POLE SPISOWE'].replace('\n', ' > ') : 'Magazyn SSUEW',
            description: item.INTERAKCJA ? `Wymagane akcesoria/zestaw: ${item.INTERAKCJA}` : 'Brak powiązanych akcesoriów.',
            value: 'Zgodnie z ewidencją księgową',
            warranty: 'Sprawdź protokół zakupu',
            image: icon,
            link: item.LINK || null // Link do specyfikacji / sklepu
          };
        });

        setEquipmentData(formattedData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Błąd pobierania bazy CRW:", err);
        setError("Nie udało się pobrać bazy sprzętu z CRW. Sprawdź połączenie lub link.");
        setIsLoading(false);
      });
  }, []);

  // Filtrowanie
  const filteredEquipment = equipmentData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funkcje koszyka
  const toggleCart = (item) => {
    if (cart.find(c => c.id === item.id)) {
      setCart(cart.filter(c => c.id !== item.id));
    } else {
      setCart([...cart, item]);
    }
  };
  const isInCart = (id) => cart.some(c => c.id === id);

  const generateProtocolMail = () => {
    const email = "biuro@samorzad.uew.edu.pl";
    const subject = encodeURIComponent(`Wniosek o Protokół Zdawczo-Odbiorczy - ${cart.length} przedmioty`);
    let itemsList = cart.map((item, index) => `${index + 1}. ${item.name} (${item.id})`).join('\n');
    const body = encodeURIComponent(`Cześć,\n\nZgłaszam zapotrzebowanie na wydanie poniższego majątku i przygotowanie Protokołu Zdawczo-Odbiorczego:\n\n${itemsList}\n\nProszę o weryfikację dostępności i kontakt.\n\nPozdrawiam,`);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Statusy
  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return (
        <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          W magazynie
        </span>
      );
      case 'rented': return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">🔵 Wydany</span>;
      case 'maintenance': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">🔴 Serwis / Wycofany</span>;
      default: return null;
    }
  };

  // === EKRAN ŁADOWANIA ===
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-slate-800">Łączenie z bazą CRW...</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Pobieranie rejestru z chmury</p>
      </div>
    );
  }

  // === EKRAN BŁĘDU ===
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black text-red-600 mb-2">Błąd synchronizacji</h2>
        <p className="text-sm font-bold text-slate-600 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors">Spróbuj ponownie</button>
      </div>
    );
  }

  // === GŁÓWNY WIDOK (Zwracany, gdy dane są pobrane) ===
  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center pb-32">
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-indigo-50/50 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-6xl pt-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Katalog Majątku</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Centralny Rejestr Wypożyczeń (CRW)</p>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 max-w-xl mx-auto flex items-center transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300">
          <span className="pl-4 pr-2 text-xl opacity-50">🔍</span>
          <input 
            type="text" 
            placeholder="Szukaj po nazwie lub sygnaturze..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-3 px-2 outline-none"
          />
        </div>

        {/* SIATKA SPRZĘTU */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
            <div key={item.id} className={`bg-white rounded-3xl p-6 shadow-lg border transition-all duration-300 group flex flex-col h-full ${isInCart(item.id) ? 'border-indigo-500 shadow-indigo-200 ring-4 ring-indigo-50' : 'border-slate-100 shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                  {item.image}
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category}</span>
                <h2 className="text-lg font-black text-slate-800 leading-tight mt-1">{item.name}</h2>
                <span className="text-[10px] font-bold text-slate-400 font-mono mt-1 block bg-slate-50 inline-block px-2 py-1 rounded-md">{item.id}</span>
              </div>
              <div className="mt-auto pt-6 flex gap-2">
                <button onClick={() => {setSelectedItem(item); setActiveTab('info');}} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                  Paszport
                </button>
                <button onClick={() => toggleCart(item)} disabled={item.status !== 'available'} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all ${isInCart(item.id) ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'}`}>
                  {isInCart(item.id) ? '✓ Dodano' : '+ Do Protokołu'}
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
               <p className="text-slate-400 font-bold text-lg">Brak sprzętu spełniającego kryteria wyszukiwania.</p>
            </div>
          )}
        </div>
      </div>

      {/* === PŁYWAJĄCA BELKA (KOSZYK / PROTOKÓŁ) === */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl flex items-center justify-between z-40 animate-slideUp">
          <div className="flex items-center gap-4 pl-2">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-xl shadow-inner">📦</div>
            <div>
              <p className="text-white font-black leading-tight">Protokół Wydania</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Majątek: {cart.length} szt.</p>
            </div>
          </div>
          <button onClick={() => setIsCheckoutOpen(true)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
            Generuj Wniosek
          </button>
        </div>
      )}

      {/* === MODAL: FINALIZACJA PROTOKOŁU === */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Kreator Protokołu</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Podsumowanie Rejestru</p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-0 border-slate-200">
                  <div>
                    <p className="text-sm font-black text-slate-700">{idx + 1}. {item.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{item.id}</p>
                  </div>
                  <button onClick={() => toggleCart(item)} className="text-red-500 text-xs font-bold hover:underline">Usuń</button>
                </div>
              ))}
            </div>
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Weryfikacja Odbiorcy (Czarna Lista)</label>
              <input type="text" placeholder="Wpisz Nr Albumu studenta pobierającego..." className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" />
              <p className="text-[9px] text-slate-400 font-bold mt-2">W przyszłości system automatycznie zweryfikuje zadłużenia w SSUEW.</p>
            </div>
            <a href={generateProtocolMail()} onClick={() => {setCart([]); setIsCheckoutOpen(false);}} className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all">
              Zatwierdź i Wyślij do CRW
            </a>
          </div>
        </div>
      )}

      {/* === MODAL: PASZPORT SPRZĘTU 2.0 === */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp border border-white/20">
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold">✕</button>
            <div className="flex items-center gap-4 mb-6 pr-10">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner shrink-0">{selectedItem.image}</div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paszport Majątku</span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{selectedItem.name}</h2>
              </div>
            </div>
            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {['info', 'lokalizacja', 'serwis'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
              ))}
            </div>
            <div className="min-h-[200px] mb-8">
              {activeTab === 'info' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sygnatura INW</span>
                      <span className="font-mono text-sm font-black text-slate-700 break-all">{selectedItem.id}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status CRW</span>
                      <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Zestaw / Akcesoria</span>
                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedItem.description}</p>
                  </div>
                  {/* LINK DO SKLEPU/KATALOGU (JEŚLI ISTNIEJE W EXCELU) */}
                  {selectedItem.link && (
                    <div className="pt-2 text-center">
                      <a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest underline transition-colors">
                        🔗 Zobacz sprzęt w katalogu/sklepie
                      </a>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'lokalizacja' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📍</div>
                    <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Drzewo Lokalizacji</span>
                    <div className="font-bold text-indigo-900 text-sm leading-relaxed flex flex-col gap-2">
                      {selectedItem.locationPath.split(' > ').map((step, i, arr) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-indigo-300">{'↳'.padStart(i + 1, ' ')}</span>
                          <span className={i === arr.length - 1 ? 'bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100' : ''}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stan Fizyczny (Uwagi)</span>
                      <span className="font-black text-slate-700 text-sm block">{selectedItem.condition}</span>
                  </div>
                </div>
              )}
              {activeTab === 'serwis' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wartość Księgowa</span>
                      <span className="font-black text-slate-700 text-sm">{selectedItem.value}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gwarancja do</span>
                      <span className="font-black text-slate-700 text-sm">{selectedItem.warranty}</span>
                    </div>
                  </div>
                  <a href={`mailto:biuro@samorzad.uew.edu.pl?subject=Zgłoszenie Usterki - ${selectedItem.id}`} className="mt-4 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                    <span>⚠️</span> Zgłoś uszkodzenie (Załącznik nr 4)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}