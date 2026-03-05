import { useState } from 'react';

// === BAZA DANYCH SPRZĘTU (Mockup zgodny z CRW) ===
const EQUIPMENT_DATA = [
  {
    id: 'SSUEW/INW/2026/001',
    name: 'Głośnik JBL PartyBox 310',
    category: 'Elektronika / Audio',
    status: 'available',
    condition: 'Bardzo dobry',
    location: 'Magazyn SSUEW (Szafa 1A)',
    description: 'Zgodnie z protokołem nr 12/2025. Komplet: głośnik, kabel zasilający. Wymaga wpisu do CRW przy wydaniu.',
    image: '🔊'
  },
  {
    id: 'SSUEW/INW/2026/014',
    name: 'Namiot Plenerowy 3x3m (Niebieski)',
    category: 'Sprzęt Eventowy',
    status: 'rented',
    condition: 'Dobry (Zgłoszone przetarcie poszycia)',
    location: 'Wydany (Zgodnie z CRW)',
    description: 'Namiot ekspresowy z logotypem SSUEW. Do rozkładania wymagane minimum 2 osoby. Kategoryczny zakaz pakowania mokrego poszycia.',
    image: '⛺'
  },
  {
    id: 'SSUEW/INW/2026/042',
    name: 'Przedłużacz Bębnowy 50m IP44',
    category: 'Sprzęt Techniczny',
    status: 'available',
    condition: 'Idealny',
    location: 'Magazyn SSUEW (Regał 2B)',
    description: 'Gruby kabel do zastosowań zewnętrznych, 4 gniazda z uziemieniem, bezpiecznik termiczny.',
    image: '🔌'
  },
  {
    id: 'SSUEW/INW/2026/008',
    name: 'Roll-up Promocyjny (Wersja 2024)',
    category: 'Materiały Promocyjne',
    status: 'maintenance',
    condition: 'Uszkodzony (Wymaga naprawy mechanizmu)',
    location: 'Magazyn SSUEW / Depozyt techniczny',
    description: 'Uszkodzony mechanizm zwijania zgłoszony w protokole zdawczym z dnia 10.02.2026. Zablokowany do wydania.',
    image: '📜'
  }
];

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filtrowanie
  const filteredEquipment = EQUIPMENT_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Kopiowanie ID do schowka
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generowanie linku Mailto
  const generateMailto = (item) => {
    const email = "biuro@samorzad.uew.edu.pl"; // ZMIEŃ NA WASZ OFICJALNY MAIL
    const subject = encodeURIComponent(`Wniosek o wydanie sprzętu: ${item.id}`);
    const body = encodeURIComponent(`Cześć,
    
Zgłaszam zapotrzebowanie na wypożyczenie poniższego składnika majątku:
- Nazwa: ${item.name}
- Sygnatura: ${item.id}

Proszę o informację o możliwym terminie odbioru oraz przygotowanie Protokołu Zdawczo-Odbiorczego.

Pozdrawiam,`);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Statusy z bajerami (pulsująca kropka)
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
      case 'maintenance': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">🔴 Serwis</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center">
      
      {/* TŁO */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-indigo-50/50 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-6xl pt-16">
        
        {/* NAGŁÓWEK (Bez przycisku powrotu, bo jest globalny) */}
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
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/40 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {item.image}
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <div className="mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category}</span>
                <h2 className="text-lg font-black text-slate-800 leading-tight mt-1">{item.name}</h2>
                <span className="text-[10px] font-bold text-slate-400 font-mono mt-1 block bg-slate-50 inline-block px-2 py-1 rounded-md">{item.id}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* === MODAL (KARTA EWIDENCYJNA) === */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp border border-white/20">
            
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-6 pr-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl border border-indigo-100 shadow-inner shrink-0">
                {selectedItem.image}
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Karta Ewidencyjna Majątku</span>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedItem.name}</h2>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                
                {/* KOPIOWANIE ID */}
                <div 
                  onClick={() => handleCopyId(selectedItem.id)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors group relative"
                  title="Kliknij, aby skopiować"
                >
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between">
                    Nr Inwentarzowy
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">📋 Skopiuj</span>
                  </span>
                  <span className="font-mono text-sm font-black text-slate-700 break-all">{selectedItem.id}</span>
                  {copied && <span className="absolute top-2 right-2 text-[8px] font-black text-white bg-indigo-500 px-2 py-1 rounded-full animate-fadeIn">Skopiowano!</span>}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status CRW</span>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stan fizyczny / Lokalizacja</span>
                <span className="font-bold text-slate-700 text-sm block">{selectedItem.condition}</span>
                <span className="font-medium text-slate-500 text-xs block mt-1">📍 {selectedItem.location}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Szczegóły z Rejestru</span>
                <p className="text-sm font-medium text-slate-600 leading-relaxed px-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedItem.description}
                </p>
              </div>
            </div>

            {/* INTELIGENTNE AKCJE */}
            <div className="flex gap-3">
              {selectedItem.status === 'available' ? (
                <a 
                  href={generateMailto(selectedItem)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>✉️</span> Złóż wniosek o wydanie
                </a>
              ) : (
                <div className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center cursor-not-allowed border border-slate-200">
                  Sprzęt niedostępny
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}