import { useState, useEffect } from 'react';

// !!! TUTAJ WKLEJ LINK DO TWOJEGO SKRYPTU BAZY DOKUMENTÓW Z GOOGLE SHEETS !!!
const DOCS_API_URL = 'https://script.google.com/macros/s/AKfycby06P_0sI4H0PMMrBQgTwp9fF_ftGrNFUMpEdYcWOrQMqPqdsT9-CmbE1Ir-2a1DlldiQ/exec';

const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  Document: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>,
  External: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Timer: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Paperclip: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
};

const CATEGORY_STYLES = {
  'Uchwały': { icon: '📜', ring: 'ring-red-100', text: 'text-red-700' },
  'Zarządzenia': { icon: '🖊️', ring: 'ring-blue-100', text: 'text-blue-700' },
  'Szablony': { icon: '📄', ring: 'ring-amber-100', text: 'text-amber-700' },
  'Instrukcje': { icon: '💡', ring: 'ring-sky-100', text: 'text-sky-700' },
  'Default': { icon: '⚖️', ring: 'ring-slate-100', text: 'text-slate-700' }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [copiedAlert, setCopiedAlert] = useState('');
  
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState(0);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        // Wymuszamy minimum 800ms ładowania dla efektu płynności (nawet jak internet jest super szybki)
        const [response] = await Promise.all([
          fetch(DOCS_API_URL),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        
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
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30;
  };

  const showAlert = (message) => {
    setCopiedAlert(message);
    setTimeout(() => setCopiedAlert(''), 2500);
  };

  const handleCopyCitation = (doc) => {
    const citation = `Zgodnie z postanowieniami aktu: ${doc.signature} ("${doc.title}") wydanego przez ${doc.issuer} w dniu ${doc.date} r.`;
    navigator.clipboard.writeText(citation);
    showAlert('Kopiowanie przypisu...');
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    showAlert('Link skopiowany!');
  };

  const openModal = (doc) => {
    setSelectedDoc(doc);
    setIsAiActive(false);
    setAiProgress(0);
    setAiStage(0);
    setShowQR(false);
  };

  const runAiAnalysis = () => {
    setIsAiActive(true);
    setAiProgress(0);
    setAiStage(1);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; 
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setAiStage(4), 400);
      } else if (progress > 60 && progress < 80) {
        setAiStage(2);
      } else if (progress >= 80) {
        setAiStage(3);
      }
      setAiProgress(progress);
    }, 300);
  };

  const generateAiReport = (doc) => {
    const text = `${doc.title} ${doc.category} ${doc.desc}`.toLowerCase();
    let target = "Wszyscy Studenci";
    if (text.includes('zarząd') || text.includes('wewnętrz')) target = "Administracja SSUEW";
    if (text.includes('koł') || text.includes('organizacj')) target = "Organizacje Studenckie";

    let rigor = "Niski";
    let rigorColor = "text-emerald-400";
    if (text.includes('regulamin') || text.includes('uchwała')) { rigor = "Bardzo Wysoki"; rigorColor = "text-rose-500"; }
    else if (text.includes('zarządzenie')) { rigor = "Średni"; rigorColor = "text-amber-400"; }

    let readTime = 2; 
    if (doc.pages && !isNaN(doc.pages)) {
      readTime = parseInt(doc.pages) * 2;
    } else {
      if (text.includes('regulamin') || text.includes('statut')) readTime = Math.floor(Math.random() * 10) + 15;
      else if (text.includes('uchwała')) readTime = Math.floor(Math.random() * 5) + 5;
      else if (text.includes('instrukcja') || text.includes('szablon')) readTime = 2;
    }
    return { target, rigor, rigorColor, readTime };
  };

  const filteredDocs = documents.filter(doc => {
    const searchString = `${doc.title} ${doc.signature} ${doc.desc}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Wszystkie' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const activeDocsCount = documents.filter(d => d.status === 'Obowiązujący').length;
  const lastUpdate = documents.length > 0 ? documents[0].date : 'Brak danych';

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-24 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-5xl mx-auto mb-10 text-center md:text-left animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Lex <span className="text-blue-600">SSUEW</span>
        </h1>
        <p className="text-base font-medium text-slate-500 mt-2 mb-6">
          Samorządowy System Aktów Prawnych zsynchronizowany z chmurą.
        </p>

        {/* MINIDASHBOARD PRAWNY */}
        {!isLoading && documents.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aktywne Akty: <span className="text-slate-900 text-sm">{activeDocsCount}</span></span>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
              <span className="text-xl">📅</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ostatnia zmiana: <span className="text-slate-900 text-sm">{lastUpdate}</span></span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-slideUp">
        
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
                    activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/30 min-h-[400px]">
          {isLoading ? (
            // NOWY, ŁADNIEJSZY EFEKT SKELETON
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse items-center">
                  <div className="hidden md:block w-12 h-12 bg-slate-100 rounded-xl shrink-0"></div>
                  <div className="flex-grow w-full space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                  </div>
                  <div className="shrink-0 w-20 h-6 bg-slate-100 rounded-lg mt-3 md:mt-0"></div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4"><Icons.Search /></div>
              <h3 className="font-bold text-slate-800 text-lg">Nie znaleziono dokumentów</h3>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('Wszystkie'); }} className="text-sm text-blue-600 font-bold hover:underline mt-2">Wyczyść filtry</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredDocs.map(doc => {
                const style = CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.Default;
                const isActive = doc.status === 'Obowiązujący';
                const nowosc = isNew(doc.date);
                
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => openModal(doc)}
                    className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 md:items-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 ${
                      isActive ? 'border-slate-200 hover:border-blue-200' : 'border-slate-200 opacity-70 bg-slate-50 hover:opacity-100'
                    }`}
                  >
                    <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-xl items-center justify-center transition-colors ${isActive ? 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                      <Icons.Document />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.date}</span>
                        {nowosc && (
                          <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">Nowość</span></>
                        )}
                        
                        {doc.attachments && doc.attachments.trim() !== '' && (
                           <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider"><Icons.Paperclip /> Załączniki</span></>
                        )}
                      </div>
                      <h3 className={`text-lg font-bold transition-colors leading-tight ${isActive ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 line-through'}`}>{doc.title}</h3>
                      {!isActive && <p className="text-xs text-red-500 font-medium mt-1">Uchylony: Zastąpiony przez nowszy akt</p>}
                    </div>

                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{doc.signature}</span>
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

      {/* METRYKA DOKUMENTU (LEX MODAL) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDoc(null)}></div>
           
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-bounceIn overflow-hidden border border-slate-100">
             
             {copiedAlert && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl z-50 flex items-center gap-2 animate-slideDown">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {copiedAlert}
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
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <button 
                    onClick={runAiAnalysis}
                    disabled={isAiActive}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAiActive ? 'bg-slate-800 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/30 hover:scale-105'}`}
                  >
                    <Icons.Brain /> {isAiActive ? 'Analizowanie...' : 'Uruchom Audyt Lex AI'}
                  </button>
                  <button 
                    onClick={() => handleCopyCitation(selectedDoc)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                  >
                    <Icons.Copy /> Skopiuj przypis
                  </button>
                  <button 
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                  >
                    <Icons.QR /> Kod QR do druku
                  </button>
                </div>

                {isAiActive && (
                  <div className="mb-8 bg-slate-900 rounded-2xl p-6 shadow-inner border border-slate-800 text-slate-300 font-mono text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-pulse"></div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                         <span className="flex items-center gap-2 text-blue-400 font-bold"><Icons.Brain /> LEX_AI_CORE_v1.2</span>
                         <span className="text-emerald-400 font-bold">{aiProgress}%</span>
                      </div>
                      
                      <div className="text-slate-500 text-xs tracking-widest mb-4">
                        [{Array.from({length: 20}).map((_, i) => i < (aiProgress/5) ? '█' : '·').join('')}]
                      </div>

                      {aiStage >= 1 && <p className="text-slate-400">» Inicjowanie skanera semantycznego... <span className="text-emerald-400 float-right">OK</span></p>}
                      {aiStage >= 2 && <p className="text-slate-400">» Mapowanie referencji uchylających... <span className="text-emerald-400 float-right">OK</span></p>}
                      {aiStage >= 3 && <p className="text-slate-400">» Kompilacja raportu syntetycznego... <span className="text-emerald-400 float-right">DONE</span></p>}
                      
                      {aiStage === 4 && (
                        <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideUp">
                          {(() => {
                            const aiReport = generateAiReport(selectedDoc);
                            return (
                              <>
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                  <span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Główny Adresat</span>
                                  <span className="font-bold text-white">{aiReport.target}</span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                  <span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Poziom Formalizacji</span>
                                  <span className={`font-bold flex items-center gap-1 ${aiReport.rigorColor}`}>
                                    <Icons.Shield /> {aiReport.rigor}
                                  </span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                  <span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Szacowany Czas</span>
                                  <span className="font-bold text-sky-400 flex items-center gap-1">
                                    <Icons.Timer /> ok. {aiReport.readTime} min
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showQR && (
                  <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center animate-slideDown">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Zeskanuj, aby przeczytać akt</p>
                    <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedDoc.link)}`} alt="QR Code" className="w-32 h-32" />
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Zakres Regulacji</h3>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedDoc.desc}</p>
                  </div>
                </div>

                {selectedDoc.attachments && selectedDoc.attachments.trim() !== '' && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <Icons.Paperclip /> Powiązane Załączniki
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDoc.attachments.split(';').map((att, idx) => {
                        const parts = att.split('|');
                        if (parts.length !== 2) return null;
                        const [name, link] = parts;
                        return (
                          <a 
                            key={idx} 
                            href={link.trim()} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group"
                          >
                            <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                              <Icons.Document />
                            </div>
                            <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700 transition-colors">
                              {name.trim()}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Data Wydania</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.date}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Udostępnij</span>
                    <button onClick={() => handleCopyLink(selectedDoc.link)} className="flex items-center gap-2 font-bold text-blue-600 text-sm hover:text-blue-700 transition-colors">
                      🔗 Kopiuj link
                    </button>
                  </div>
                  <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Organ Wydający</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.issuer}</span>
                  </div>
                </div>

             </div>
             
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