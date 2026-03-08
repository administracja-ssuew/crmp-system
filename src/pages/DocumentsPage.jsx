import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// !!! TUTAJ WKLEJ LINK DO NOWEGO SKRYPTU BAZY DOKUMENTÓW !!!
const DOCS_API_URL = 'https://script.google.com/macros/s/AKfycby06P_0sI4H0PMMrBQgTwp9fF_ftGrNFUMpEdYcWOrQMqPqdsT9-CmbE1Ir-2a1DlldiQ/exec';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Bajer: Stan na powiadomienie o skopiowaniu linku
  const [copiedAlert, setCopiedAlert] = useState(false);

  // Pobieranie danych z Google Sheets
  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(DOCS_API_URL);
        const data = await response.json();
        if (!data.error) {
          setDocuments(data);
        }
      } catch (error) {
        console.error("Błąd pobierania dokumentów:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Bajer: Dynamiczne wyciąganie kategorii z Excela (brak hardkodowania!)
  const categories = ['Wszystkie', ...new Set(documents.map(doc => doc.category).filter(Boolean))];

  // Bajer: Sprawdzanie, czy dokument jest młodszy niż 30 dni
  const isNew = (dateStr) => {
    const docDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - docDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30;
  };

  // Kopiowanie do schowka
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  // Sortowanie i filtrowanie
  const filteredDocs = [...documents]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(doc => {
      const searchString = `${doc.title} ${doc.signature} ${doc.desc}`.toLowerCase();
      const matchesSearch = searchString.includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Wszystkie' || doc.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2 block">← Wróć do Menu</Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Lex <span className="text-blue-600">SSUEW</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Uczelniany System Aktów Prawnych zsynchronizowany z chmurą.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-slideUp">
        
        {/* PANEL WYSZUKIWANIA I FILTRÓW */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="relative w-full md:w-1/2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Szukaj po sygnaturze, tytule lub treści..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3 pl-11 pr-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* LISTA DOKUMENTÓW LUB ŁADOWANIE */}
        <div className="p-4 min-h-[400px]">
          {isLoading ? (
            // BAJER: SKELETON LOADERS
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse">
                  <div className="md:w-48 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex-grow space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-5 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center p-12">
              <span className="text-5xl opacity-30 mb-4 block">⚖️</span>
              <p className="font-bold text-slate-500 text-lg">Brak aktów spełniających kryteria.</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('Wszystkie'); }} className="mt-4 text-sm text-blue-600 font-bold hover:underline">
                Wyczyść filtry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDocs.map(doc => {
                const isObowiazujacy = doc.status === 'Obowiązujący';
                const nowosc = isNew(doc.date);
                
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className={`group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden ${
                      isObowiazujacy ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    {/* Wstążka Nowości na lewym brzegu */}
                    {nowosc && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}

                    <div className="shrink-0 md:w-48 pl-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{doc.date}</p>
                      <p className={`text-sm font-bold ${isObowiazujacy ? 'text-blue-700' : 'text-slate-500'}`}>{doc.signature}</p>
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{doc.category}</span>
                        {!isObowiazujacy && <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-0.5 rounded">Uchylony</span>}
                        {nowosc && <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded animate-pulse">Nowy Akt</span>}
                      </div>
                      <h3 className={`font-bold text-base leading-tight ${isObowiazujacy ? 'text-slate-900 group-hover:text-blue-600 transition-colors' : 'text-slate-600 line-through decoration-red-400'}`}>
                        {doc.title}
                      </h3>
                    </div>

                    <div className="shrink-0 hidden md:flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors pr-2">
                      <span className="text-xl">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* METRYKA DOKUMENTU (LEX MODAL) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}></div>
           
           <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-bounceIn overflow-hidden border border-slate-200">
             
             {/* Alert skopiowania (Absolute na górze modala) */}
             {copiedAlert && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 animate-slideDown">
                  ✅ Skopiowano link do schowka!
                </div>
             )}

             <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
               <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{selectedDoc.signature}</p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight pr-4">{selectedDoc.title}</h2>
               </div>
               <button onClick={() => setSelectedDoc(null)} className="shrink-0 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition">✕</button>
             </div>

             <div className="p-6 overflow-y-auto bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                  
                  {/* Przycisk Kopiuj Link */}
                  <button 
                    onClick={() => handleCopyLink(selectedDoc.link)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm"
                    title="Kopiuj link do dokumentu"
                  >
                    🔗
                  </button>

                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status aktu</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${selectedDoc.status === 'Obowiązujący' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedDoc.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Data wydania</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.date}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Organ wydający</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.issuer}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-3">Zakres regulacji / Opis</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedDoc.desc}</p>
                </div>

                {selectedDoc.repeals && selectedDoc.repeals !== 'Brak' && selectedDoc.repeals !== '' && (
                  <div className="mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-3">Relacje z innymi aktami</h3>
                    <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      <span className="text-rose-500 font-bold text-sm">Uchyla:</span>
                      <span className="text-rose-900 font-medium text-sm">{selectedDoc.repeals}</span>
                    </div>
                  </div>
                )}
             </div>
             
             <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-[2rem]">
                <a 
                  href={selectedDoc.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition shadow-lg"
                >
                  <span>📄</span> Przejdź do tekstu aktu
                </a>
             </div>

           </div>
        </div>
      )}
    </div>
  );
}