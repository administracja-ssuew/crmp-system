import { useState } from 'react';
import { Link } from 'react-router-dom';

// === BAZA DANYCH SPRZĘTU (Rozszerzona pod Paszporty i CRW) ===
const EQUIPMENT_DATA = [
  {
    id: 'SSUEW/INW/2026/001',
    name: 'Głośnik JBL PartyBox 310',
    category: 'Elektronika / Audio',
    status: 'available',
    condition: 'Bardzo dobry',
    locationPath: 'Magazyn SSUEW > Szafa 1A > Półka Środkowa',
    description: 'Komplet: głośnik, kabel zasilający. Wymaga wpisu do CRW przy wydaniu.',
    value: '2 499,00 PLN',
    warranty: '24.11.2027',
    image: '🔊'
  },
  {
    id: 'SSUEW/INW/2026/014',
    name: 'Namiot Plenerowy 3x3m (Niebieski)',
    category: 'Sprzęt Eventowy',
    status: 'rented',
    condition: 'Dobry (Zgłoszone przetarcie poszycia)',
    locationPath: 'Wydany (Zgodnie z CRW)',
    description: 'Namiot ekspresowy z logotypem SSUEW. Do rozkładania wymagane minimum 2 osoby.',
    value: '1 850,00 PLN',
    warranty: 'Brak',
    image: '⛺'
  },
  {
    id: 'SSUEW/INW/2026/042',
    name: 'Przedłużacz Bębnowy 50m IP44',
    category: 'Sprzęt Techniczny',
    status: 'available',
    condition: 'Idealny',
    locationPath: 'Magazyn SSUEW > Regał 2B > Podłoga',
    description: 'Gruby kabel do zastosowań zewnętrznych, 4 gniazda z uziemieniem.',
    value: '350,00 PLN',
    warranty: '10.02.2028',
    image: '🔌'
  },
  {
    id: 'SSUEW/INW/2026/008',
    name: 'Roll-up Promocyjny (Wersja 2024)',
    category: 'Materiały Promocyjne',
    status: 'maintenance',
    condition: 'Uszkodzony (Zacięty mechanizm)',
    locationPath: 'Magazyn SSUEW > Depozyt Techniczny',
    description: 'Uszkodzony mechanizm zwijania zgłoszony w protokole zdawczym. Czeka na serwis.',
    value: '450,00 PLN',
    warranty: 'Brak',
    image: '📜'
  }
];

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // Do modalu Paszportu
  const [activeTab, setActiveTab] = useState('info'); // Zakładki w Paszporcie
  
  // === SYSTEM KOSZYKA (KREATOR PROTOKOŁU) ===
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Filtrowanie
  const filteredEquipment = EQUIPMENT_DATA.filter(item => 
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

  // Generowanie linku Mailto dla całego Protokołu
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center pb-32">
      
      {/* TŁO */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-indigo-50/50 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-6xl pt-8">
        
        {/* NAGŁÓWEK */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Katalog Majątku</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Centralny Rejestr Wypożyczeń (CRW)</p>
        </div>

        {/* WYSZUKIWARKA */}
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
          {filteredEquipment.map((item) => (
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
                <button 
                  onClick={() => {setSelectedItem(item); setActiveTab('info');}}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Paszport
                </button>
                <button 
                  onClick={() => toggleCart(item)}
                  disabled={item.status !== 'available'}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all ${isInCart(item.id) ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'}`}
                >
                  {isInCart(item.id) ? '✓ Dodano' : '+ Do Protokołu'}
                </button>
              </div>
            </div>
          ))}
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
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
          >
            Generuj Wniosek
          </button>
        </div>
      )}

      {/* === MODAL: FINALIZACJA PROTOKOŁU (Zalążek Weryfikacji) === */}
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

            {/* Miejsce na przyszłą integrację z Czarną Listą */}
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

            {/* Nagłówek Paszportu */}
            <div className="flex items-center gap-4 mb-6 pr-10">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner shrink-0">{selectedItem.image}</div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paszport Majątku</span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{selectedItem.name}</h2>
              </div>
            </div>

            {/* Nawigacja Zakładek */}
            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {['info', 'lokalizacja', 'serwis'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TREŚĆ ZAKŁADEK */}
            <div className="min-h-[200px] mb-8">
              
              {/* Zakładka 1: INFO */}
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
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Opis Inwentaryzacyjny</span>
                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedItem.description}</p>
                  </div>
                </div>
              )}

              {/* Zakładka 2: LOKALIZACJA */}
              {activeTab === 'lokalizacja' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📍</div>
                    <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Drzewo Lokalizacji (Miejsce na miejsce)</span>
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
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stan Fizyczny</span>
                      <span className="font-black text-slate-700 text-sm block">{selectedItem.condition}</span>
                  </div>
                </div>
              )}

              {/* Zakładka 3: SERWIS */}
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
                  
                  {/* Poważny przycisk proceduralny */}
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