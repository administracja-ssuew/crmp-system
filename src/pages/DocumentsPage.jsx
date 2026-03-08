import { useState, useEffect } from 'react';

// !!! TUTAJ WKLEJ LINK DO TWOJEGO SKRYPTU BAZY DOKUMENTÓW Z GOOGLE SHEETS !!!
const DOCS_API_URL = 'https://script.google.com/macros/s/AKfycby06P_0sI4H0PMMrBQgTwp9fF_ftGrNFUMpEdYcWOrQMqPqdsT9-CmbE1Ir-2a1DlldiQ/exec';

// Eleganckie ikony SVG wstawione bezpośrednio do kodu
const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  Document: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>,
  External: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [copiedAlert, setCopiedAlert] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(DOCS_API_URL);
        const data = await response.json();
        if (!data.error) {
          setDocuments(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (error) {
        console.error("Błąd pobierania dokumentów:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const categoriesFromSheets = ['Wszystkie', ...new Set(documents.map(doc => doc.category).filter(Boolean))];

  const isNew = (dateStr) => {
    const docDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - docDate) / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30;
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  const filteredDocs = documents.filter(doc => {
    const searchString = `${doc.title} ${doc.signature} ${doc.desc}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Wszystkie' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-24 pt-24 relative overflow-x-hidden">
      
      {/* NAGŁÓWEK - Czysta typografia */}
      <div className="max-w-5xl mx-auto mb-10 text-center md:text-left animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Lex <span className="text-blue-600">SSUEW</span>
        </h1>
        <p className="text-base font-medium text-slate-500 mt-2">
          Samorządowy System Aktów Prawnych zsynchronizowany z chmurą.
        </p>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-slideUp">
        
        {/* PANEL WYSZUKIWANIA I FILTRÓW */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-5 justify-between items-center">
            
            <div className="relative w-full md:w-1/2 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Icons.Search />
              </span>
              <input 
                type="text" 
                placeholder="Szukaj po sygnaturze, tytule lub treści..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-xl font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              {categoriesFromSheets.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* LISTA DOKUMENTÓW */}
        <div className="p-6 bg-slate-50/30 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm"></div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Icons.Search />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Nie znaleziono dokumentów</h3>
              <p className="text-slate-500 text-sm mt-1 mb-4">Spróbuj zmienić słowa kluczowe lub filtry.</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('Wszystkie'); }} className="text-sm text-blue-600 font-bold hover:underline">
                Wyczyść filtry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredDocs.map(doc => {
                const isActive = doc.status === 'Obowiązujący';
                const nowosc = isNew(doc.date);
                
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 md:items-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 ${
                      isActive ? 'border-slate-200 hover:border-blue-200' : 'border-slate-200 opacity-70 bg-slate-50 hover:opacity-100'
                    }`}
                  >
                    {/* Ikona dokumentu */}
                    <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-xl items-center justify-center transition-colors ${isActive ? 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                      <Icons.Document />
                    </div>

                    <div className="flex-grow">
                      {/* Sub-header (Kategoria, data, nowość) */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {doc.category}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {doc.date}
                        </span>
                        {nowosc && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Nowość
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Tytuł główny */}
                      <h3 className={`text-lg font-bold transition-colors leading-tight ${isActive ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 line-through'}`}>
                        {doc.title}
                      </h3>
                      
                      {/* Jeśli uchylony, pokazujemy krótki alert pod tytułem */}
                      {!isActive && <p className="text-xs text-red-500 font-medium mt-1">Uchylony: Zastąpiony przez nowszy akt</p>}
                    </div>

                    {/* Prawa sekcja (Sygnatura i status) */}
                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{doc.signature}</span>
                      
                      {/* Elegancka pigułka statusu */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isActive ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {doc.status}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* METRYKA DOKUMENTU (LEX MODAL) - Wersja Clean Design */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDoc(null)}></div>
           
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-bounceIn overflow-hidden border border-slate-100">
             
             {/* Alert Kopiowania */}
             {copiedAlert && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl z-50 flex items-center gap-2 animate-slideDown">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Link skopiowany!
                </div>
             )}

             <div className="p-8 pb-6 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
               <div className="pr-6">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedDoc.signature}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedDoc.category}</p>
                  </div>
                  <h2 className={`text-2xl font-black leading-tight ${selectedDoc.status === 'Obowiązujący' ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                    {selectedDoc.title}
                  </h2>
               </div>
               <button onClick={() => setSelectedDoc(null)} className="shrink-0 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <Icons.Close />
               </button>
             </div>

             <div className="p-8 overflow-y-auto bg-slate-50/50 flex-grow">
                
                {/* Karty Informacyjne */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Prawny</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${selectedDoc.status === 'Obowiązujący' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <span className="font-bold text-slate-800 text-sm">{selectedDoc.status}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Data Wydania</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.date}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Udostępnij</span>
                    <button 
                      onClick={() => handleCopyLink(selectedDoc.link)}
                      className="flex items-center gap-2 font-bold text-blue-600 text-sm hover:text-blue-700 transition-colors"
                    >
                      <Icons.Copy /> Kopiuj link
                    </button>
                  </div>
                </div>

                {/* Opis */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Zakres Regulacji</h3>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedDoc.desc}</p>
                  </div>
                </div>

                {/* Relacje Lex */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Organ Wydający</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.issuer}</span>
                  </div>
                  
                  {selectedDoc.repeals && selectedDoc.repeals !== 'Brak' && selectedDoc.repeals !== '' && (
                    <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1 block">Uchyla akt</span>
                      <span className="font-bold text-red-600 text-sm">{selectedDoc.repeals}</span>
                    </div>
                  )}
                </div>

             </div>
             
             {/* Przycisk akcji */}
             <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <a 
                  href={selectedDoc.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-900/20 transition-all"
                >
                  Otwórz oryginał dokumentu <Icons.External />
                </a>
             </div>

           </div>
        </div>
      )}
    </div>
  );
}