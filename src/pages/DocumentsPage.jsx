import { useState, useEffect, useRef } from 'react';

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
  Paperclip: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>,
  Pen: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
};

const CATEGORY_STYLES = {
  'Uchwały': { icon: '📜', ring: 'ring-red-100', text: 'text-red-700' },
  'Zarządzenia': { icon: '🖊️', ring: 'ring-blue-100', text: 'text-blue-700' },
  'Szablony': { icon: '📄', ring: 'ring-amber-100', text: 'text-amber-700' },
  'Instrukcje': { icon: '💡', ring: 'ring-sky-100', text: 'text-sky-700' },
  'Default': { icon: '⚖️', ring: 'ring-slate-100', text: 'text-slate-700' }
};

export default function DocumentsPage() {
  const [activeView, setActiveView] = useState('LEX'); 

  // STANY DLA BAZY
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

  // STANY DLA STUDIA AI
  const [editorText, setEditorText] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const aiOutputRef = useRef(null);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const [response] = await Promise.all([
          fetch(DOCS_API_URL),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        const data = await response.json();
        if (!data.error) setDocuments(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
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
    if (!dateStr) return false;
    return Math.ceil(Math.abs(new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24)) <= 30;
  };
  const showAlert = (msg) => { setCopiedAlert(msg); setTimeout(() => setCopiedAlert(''), 2500); };
  const handleCopyLink = (link) => { navigator.clipboard.writeText(link); showAlert('Skopiowano!'); };
  const handleCopyCitation = (doc) => { navigator.clipboard.writeText(`Zgodnie z postanowieniami aktu: ${doc.signature} ("${doc.title}") wydanego przez ${doc.issuer} w dniu ${doc.date} r.`); showAlert('Skopiowano przypis!'); };
  
  const openModal = (doc) => { 
    setSelectedDoc(doc); 
    setIsAiActive(false); 
    setAiProgress(0); 
    setAiStage(0); 
    setShowQR(false); 
  };

  // NAPRAWIONY ALGORYTM AI (Zabezpieczony przed pustymi polami w Excelu)
  const generateAiReport = (doc) => {
    if (!doc) return { target: '-', rigor: '-', rigorColor: '', readTime: 0 };
    
    // Zabezpieczenie przed undefined/null
    const title = doc.title || '';
    const category = doc.category || '';
    const desc = doc.desc || '';
    const text = `${title} ${category} ${desc}`.toLowerCase();
    
    let target = text.includes('zarząd') || text.includes('wewnętrz') ? "Administracja SSUEW" : (text.includes('koł') || text.includes('organizacj') ? "Organizacje Studenckie" : "Wszyscy Studenci");
    let rigor = text.includes('regulamin') || text.includes('uchwała') ? "Bardzo Wysoki" : (text.includes('zarządzenie') ? "Średni" : "Niski");
    let rigorColor = rigor === "Bardzo Wysoki" ? "text-rose-500" : (rigor === "Średni" ? "text-amber-400" : "text-emerald-400");
    
    let readTime = 2; 
    if (doc.pages && !isNaN(doc.pages)) {
      readTime = parseInt(doc.pages) * 2;
    } else {
      // Wyliczenie na podstawie faktycznej długości tekstu
      const totalLength = title.length + desc.length;
      readTime = Math.max(1, Math.ceil(totalLength / 200)); 
      if (rigor === "Bardzo Wysoki" && readTime < 5) readTime = 5; // Regulaminy minimum 5 min
    }
    return { target, rigor, rigorColor, readTime };
  };

  const runAiAnalysis = () => {
    setIsAiActive(true); setAiProgress(0); setAiStage(1);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; 
      if (progress >= 100) { progress = 100; clearInterval(interval); setTimeout(() => setAiStage(4), 400); } 
      else if (progress > 60 && progress < 80) setAiStage(2);
      else if (progress >= 80) setAiStage(3);
      setAiProgress(progress);
    }, 300);
  };

  const filteredDocs = documents.filter(doc => {
    const title = doc.title || '';
    const sig = doc.signature || '';
    const desc = doc.desc || '';
    const matchesSearch = `${title} ${sig} ${desc}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Wszystkie' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const activeDocsCount = documents.filter(d => d.status === 'Obowiązujący').length;
  const lastUpdate = documents.length > 0 ? documents[0].date : 'Brak danych';

  // ==========================================
  // STUDIO LEGISLACYJNE (Wymogi Podprogowe!)
  // ==========================================
  const simulateAiTyping = (fullText) => {
    setIsDrafting(true);
    setAiOutput('');
    let i = 0;
    const typingInterval = setInterval(() => {
      setAiOutput(prev => prev + fullText.charAt(i));
      i++;
      if (aiOutputRef.current) aiOutputRef.current.scrollTop = aiOutputRef.current.scrollHeight;
      if (i >= fullText.length) {
        clearInterval(typingInterval);
        setIsDrafting(false);
      }
    }, 10); 
  };

  const handleGenerateTemplate = (type) => {
    let template = '';
    if (type === 'nocka') {
      template = `[WYMÓG: Klauzula odpowiedzialności cywilnej i PPOŻ uwzględniona]\n\nWrocław, dnia ${new Date().toLocaleDateString('pl-PL')}\n\nDo: Kanclerz Uniwersytetu Ekonomicznego we Wrocławiu\nOd: Zarząd Samorządu Studentów UEW\n\nWNIOSEK O PRZEDŁUŻENIE GODZIN OTWARCIA BUDYNKU\n\nDziałając na podstawie obowiązującego Regulaminu Przestrzeni, zwracam się z uprzejmą prośbą o wyrażenie zgody na przebywanie członków Samorządu w budynku Z (sala 28J) w godzinach od 22:00 do 03:00 w dniu [WPISZ DATĘ].\n\nUzasadnienie:\nPrzedłużenie godzin jest niezbędne do logistycznego przygotowania projektu [NAZWA PROJEKTU]. Jednocześnie oświadczam, że bierzemy na siebie pełną odpowiedzialność materialną i dyscyplinarną za pozostawione mienie oraz zobowiązujemy się do bezwzględnego przestrzegania przepisów BHP i PPOŻ.\n\nZ wyrazami szacunku,\n[Twój Podpis]`;
    } else if (type === 'rektorskie') {
      template = `[WYMÓG: Powołanie się na pozytywny wpływ na społeczność akademicką uwzględnione]\n\nWrocław, dnia ${new Date().toLocaleDateString('pl-PL')}\n\nDo: Jego Magnificencja Rektor Uniwersytetu Ekonomicznego we Wrocławiu\nOd: [Nazwa Organizacji / Koła Naukowego]\n\nWNIOSEK O ZWOLNIENIE REKTORSKIE (GODZINY REKTORSKIE)\n\nZwracamy się z uprzejmą prośbą o zwolnienie z zajęć dydaktycznych dla niżej wymienionych studentów w dniu [DATA] w godzinach [GODZINY].\n\nUzasadnienie:\nWskazani studenci są kluczowym ogniwem w organizacji wydarzenia "[NAZWA]". Ich nieobecność na zajęciach podyktowana jest pracą na rzecz naszej Uczelni. Projekt ten wnosi istotny, pozytywny wkład w integrację społeczności akademickiej oraz kreuje wizerunek Uniwersytetu jako przestrzeni promującej proaktywne postawy studenckie.\n\nLista studentów:\n1. [Imię Nazwisko, Nr Indeksu]\n\nZ wyrazami szacunku,\n[Twój Podpis]`;
    } else if (type === 'formalize') {
      if (!editorText || editorText.length < 10) {
        setAiOutput("BŁĄD: Zbyt mało tekstu w edytorze po lewej. Napisz chociaż jedno robocze zdanie (np. 'chcemy zrobic grilla za uczelnią'), a ja ubiorę to w odpowiednie paragrafy.");
        return;
      }
      template = `[PRZEKSZTAŁCONO W STYL URZĘDOWY]\n\nWrocław, dnia ${new Date().toLocaleDateString('pl-PL')}\n\nWNIOSEK / PISMO PRZEWODNIE\n\nDziałając w interesie społeczności studenckiej oraz na podstawie obowiązujących przepisów, niniejszym wnoszę o:\n\nZgodnie ze zgłoszonym postulatem: "${editorText.substring(0, 80)}[...]", pragniemy zaznaczyć, iż realizacja tego przedsięwzięcia bezpośrednio wpisuje się w realizację celów statutowych naszej organizacji.\n\nZwracamy się z uprzejmą prośbą o pozytywne rozpatrzenie niniejszego pisma.\n\nZ poważaniem,\n[Podpis]`;
    }
    simulateAiTyping(template);
  };

  const copyToEditor = () => { setEditorText(aiOutput); };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-24 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto mb-8 text-center md:text-left animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Lex <span className="text-blue-600">SSUEW</span>
        </h1>
        <p className="text-base font-medium text-slate-500 mt-2 mb-6">
          Zintegrowane Centrum Dokumentacji i Tworzenia Prawa Samorządowego.
        </p>

        {activeView === 'LEX' && !isLoading && documents.length > 0 && (
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

      <div className="max-w-7xl mx-auto mb-6 flex gap-6 border-b border-slate-200">
        <button onClick={() => setActiveView('LEX')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all ${activeView === 'LEX' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          📚 Baza Aktów Prawnych
        </button>
        <button onClick={() => setActiveView('STUDIO')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeView === 'STUDIO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <Icons.Brain /> Studio Legislacyjne (AI)
        </button>
      </div>

      {activeView === 'LEX' && (
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-slideUp">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-5 justify-between items-center">
              <div className="relative w-full md:w-1/2 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><Icons.Search /></span>
                <input type="text" placeholder="Szukaj po sygnaturze, tytule lub treści..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-xl font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {categoriesFromSheets.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/30 min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse items-center">
                    <div className="hidden md:block w-12 h-12 bg-slate-100 rounded-xl shrink-0"></div>
                    <div className="flex-grow w-full space-y-3"><div className="h-3 bg-slate-100 rounded w-1/3"></div><div className="h-5 bg-slate-100 rounded w-3/4"></div></div>
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
                    <div key={doc.id} onClick={() => openModal(doc)} className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 md:items-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 ${isActive ? 'border-slate-200 hover:border-blue-200' : 'border-slate-200 opacity-70 bg-slate-50 hover:opacity-100'}`}>
                      <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-xl items-center justify-center transition-colors ${isActive ? 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                        <Icons.Document />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.category}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.date}</span>
                          {nowosc && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">Nowość</span></>}
                          
                          {/* Zabezpieczony render ikony załączników na liście */}
                          {doc.attachments && String(doc.attachments).trim() !== '' && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider"><Icons.Paperclip /> Załączniki</span></>}
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
      )}

      {activeView === 'STUDIO' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 flex flex-col h-[700px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Icons.Pen /></div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-sm leading-none">Twój Edytor</h3>
                   <span className="text-[10px] text-slate-400 font-medium">Miejsce robocze na pisma</span>
                 </div>
               </div>
               <button onClick={() => {navigator.clipboard.writeText(editorText); showAlert('Skopiowano treść!');}} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                 Kopiuj Całość
               </button>
            </div>
            <textarea 
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="Zacznij pisać swój dokument lub wniosek tutaj... Albo po prawej wybierz gotowy wzór, który AI dostosuje do uczelnianych wymogów!"
              className="flex-grow p-8 outline-none resize-none text-sm text-slate-800 leading-relaxed font-medium"
            />
          </div>

          <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 flex flex-col h-[700px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 z-0"></div>
            <div className="relative z-10 p-5 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                   <Icons.Brain />
                 </div>
                 <div>
                   <h3 className="font-bold text-white text-sm leading-none">Lex AI Assistant</h3>
                   <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> WDROŻONO WYMOGI FORMALNE</span>
                 </div>
               </div>
            </div>

            <div className="relative z-10 flex-grow p-6 overflow-y-auto flex flex-col gap-6 scrollbar-hide" ref={aiOutputRef}>
               <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl text-sm text-slate-300 leading-relaxed shadow-lg">
                 Cześć! Posiadam zaszyte wewnętrzne wymogi administracji. Wybierz szablon, a przygotuję gotowe pismo spełniające wszystkie "podprogowe" zasady uczelni.
               </div>

               <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => handleGenerateTemplate('rektorskie')} disabled={isDrafting} className="flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                    <div>
                      <span className="block text-white font-bold text-sm mb-1 flex items-center gap-2"><Icons.Document /> Zwolnienie z zajęć dydaktycznych (inaczej Rektorskie)</span>
                      <span className="block text-emerald-400/80 text-xs flex items-center gap-1"><Icons.Check /> Uzasadnienie wkładu w społeczność</span>
                    </div>
                    <span className="text-slate-500 group-hover:text-blue-400 transition-colors"><Icons.ArrowRight /></span>
                 </button>

                 <button onClick={() => handleGenerateTemplate('nocka')} disabled={isDrafting} className="flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                    <div>
                      <span className="block text-white font-bold text-sm mb-1 flex items-center gap-2"><Icons.Document /> Podanie dot. możliwości z przłużonego korzystania z sali 28J</span>
                      <span className="block text-emerald-400/80 text-xs flex items-center gap-1"><Icons.Check /> Klauzule BHP i odpowiedzialności</span>
                    </div>
                    <span className="text-slate-500 group-hover:text-blue-400 transition-colors"><Icons.ArrowRight /></span>
                 </button>
                 
                 <button onClick={() => handleGenerateTemplate('formalize')} disabled={isDrafting} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-800/50 hover:to-indigo-800/50 border border-blue-800/50 rounded-xl text-left transition-all group disabled:opacity-50 mt-2">
                    <div>
                      <span className="block text-blue-100 font-bold text-sm mb-1 flex items-center gap-2"><Icons.Brain /> Sformatuj własny tekst z Edytora</span>
                      <span className="block text-blue-300/70 text-xs">Zamienię luźny pomysł na pismo formalne.</span>
                    </div>
                    <span className="text-blue-400 group-hover:text-blue-300 transition-colors"><Icons.ArrowRight /></span>
                 </button>
               </div>

               {aiOutput && (
                 <div className="mt-4 animate-slideUp">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Icons.Brain /> Generowanie odpowiedzi...
                    </span>
                    <div className="bg-slate-950 border border-slate-700 p-5 rounded-2xl text-sm text-slate-300 leading-relaxed font-mono shadow-inner whitespace-pre-wrap">
                      {aiOutput}
                      {isDrafting && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>}
                    </div>

                    {!isDrafting && (
                      <button onClick={copyToEditor} className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/50">
                        <Icons.Copy /> Przenieś do Edytora
                      </button>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* METRYKA DOKUMENTU (LEX MODAL) */}
      {selectedDoc && activeView === 'LEX' && (
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
                  <button onClick={runAiAnalysis} disabled={isAiActive} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAiActive ? 'bg-slate-800 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/30 hover:scale-105'}`}>
                    <Icons.Brain /> {isAiActive ? 'Analizowanie...' : 'Uruchom Audyt Lex AI'}
                  </button>
                  <button onClick={() => handleCopyCitation(selectedDoc)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                    <Icons.Copy /> Skopiuj przypis
                  </button>
                  <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
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
                      <div className="text-slate-500 text-xs tracking-widest mb-4">[{Array.from({length: 20}).map((_, i) => i < (aiProgress/5) ? '█' : '·').join('')}]</div>
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
                                  <span className={`font-bold flex items-center gap-1 ${aiReport.rigorColor}`}><Icons.Shield /> {aiReport.rigor}</span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                  <span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Szacowany Czas</span>
                                  <span className="font-bold text-sky-400 flex items-center gap-1"><Icons.Timer /> ok. {aiReport.readTime} min</span>
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
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedDoc.link || 'https://google.com')}`} alt="QR Code" className="w-32 h-32" />
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Zakres Regulacji</h3>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedDoc.desc || "Brak opisu."}</p>
                  </div>
                </div>

                {/* ZABEZPIECZONY RENDER ZAŁĄCZNIKÓW */}
                {selectedDoc.attachments && String(selectedDoc.attachments).trim() !== '' && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <Icons.Paperclip /> Powiązane Załączniki
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {String(selectedDoc.attachments).split(';').map((att, idx) => {
                        const parts = att.split('|');
                        if (parts.length !== 2) return null;
                        const [name, link] = parts;
                        return (
                          <a key={idx} href={link.trim()} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group">
                            <div className="text-slate-300 group-hover:text-blue-500 transition-colors"><Icons.Document /></div>
                            <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700 transition-colors">{name.trim()}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Data Wydania</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.date || "-"}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Udostępnij</span>
                    <button onClick={() => handleCopyLink(selectedDoc.link || '')} className="flex items-center gap-2 font-bold text-blue-600 text-sm hover:text-blue-700 transition-colors">🔗 Kopiuj link</button>
                  </div>
                  <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Organ Wydający</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedDoc.issuer || "-"}</span>
                  </div>
                </div>

             </div>
             
             <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <a href={selectedDoc.link || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-900/20 transition-all">
                  Otwórz oryginał dokumentu <Icons.External />
                </a>
             </div>

           </div>
        </div>
      )}
    </div>
  );
}