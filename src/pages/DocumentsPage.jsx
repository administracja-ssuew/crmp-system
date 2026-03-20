import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// !!! TUTAJ WKLEJ LINK DO TWOJEGO SKRYPTU BAZY DOKUMENTÓW Z GOOGLE SHEETS !!!
const DOCS_API_URL = 'https://script.google.com/macros/s/AKfycby06P_0sI4H0PMMrBQgTwp9fF_ftGrNFUMpEdYcWOrQMqPqdsT9-CmbE1Ir-2a1DlldiQ/exec';

const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  Document: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  File: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>,
  External: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  Timer: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Paperclip: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>,
  Pen: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  QR: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" /></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Hardware: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
};

const CATEGORY_STYLES = {
  'Uchwały': { icon: '📜', ring: 'ring-red-100', text: 'text-red-700' },
  'Zarządzenia': { icon: '🖊️', ring: 'ring-blue-100', text: 'text-blue-700' },
  'Szablony': { icon: '📄', ring: 'ring-amber-100', text: 'text-amber-700' },
  'Instrukcje': { icon: '💡', ring: 'ring-sky-100', text: 'text-sky-700' },
  'Default': { icon: '⚖️', ring: 'ring-slate-100', text: 'text-slate-700' }
};

// === KOMPONENT AKORDEONU DLA WIEDZY ===
const Accordion = ({ title, badge, icon, children, isOpen, onClick }) => (
  <div className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white shadow-xl shadow-amber-900/5 ring-1 ring-amber-500/20' : 'bg-slate-50 hover:bg-white hover:shadow-md'}`}>
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-amber-100 text-amber-600' : 'bg-white border border-slate-200 text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{badge}</span>
          </div>
          <h3 className={`text-lg font-black transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-700'}`}>{title}</h3>
        </div>
      </div>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'bg-amber-50 text-amber-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
        <Icons.ChevronDown />
      </div>
    </button>
    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <div className="p-5 md:p-6 pt-0 border-t border-slate-100 text-slate-600 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  </div>
);

export default function DocumentsPage() {
  const [activeView, setActiveView] = useState('LEX'); 

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

  const [editorText, setEditorText] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const aiOutputRef = useRef(null);

  const [knowledgeTab, setKnowledgeTab] = useState('KSIEGA'); 
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const [response] = await Promise.all([
          fetch(DOCS_API_URL),
          new Promise(resolve => setTimeout(resolve, 800))
        ]);
        const data = await response.json();
        if (!data.error && Array.isArray(data)) {
          setDocuments(data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
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
    if (!dateStr) return false;
    const diff = new Date() - new Date(dateStr);
    return !isNaN(diff) && Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24)) <= 30;
  };
  
  const showAlert = (msg) => { setCopiedAlert(msg); setTimeout(() => setCopiedAlert(''), 2500); };
  
  const handleCopyLink = (link) => { 
    try { navigator.clipboard.writeText(link); showAlert('Skopiowano!'); } catch(e) {} 
  };
  
  const handleCopyCitation = (sig, title, issuer, date) => { 
    try { 
      navigator.clipboard.writeText(`Zgodnie z postanowieniami aktu: ${sig} ("${title}") wydanego przez ${issuer} w dniu ${date} r.`); 
      showAlert('Skopiowano przypis!'); 
    } catch(e) {}
  };
  
  const openModal = (rawDoc) => { 
    if (!rawDoc) return;
    setSelectedDoc(rawDoc); 
    setIsAiActive(false); 
    setAiProgress(0); 
    setAiStage(0); 
    setShowQR(false); 
  };

  let safeModalData = null;
  if (selectedDoc && activeView === 'LEX') {
    let parsedAttachments = [];
    try {
      const attString = String(selectedDoc.attachments || '').trim();
      if (attString && attString.toLowerCase() !== 'brak' && attString !== 'undefined') {
        attString.split(';').forEach(item => {
          const parts = item.split('|');
          if (parts.length >= 2) {
            parsedAttachments.push({
              name: String(parts[0]).trim(),
              link: String(parts.slice(1).join('|')).trim()
            });
          }
        });
      }
    } catch (e) { console.error("Ignorowany błąd załączników", e); }

    let parsedRepeals = null;
    try {
      const repString = String(selectedDoc.repeals || '').trim();
      if (repString && repString.toLowerCase() !== 'brak' && repString !== 'undefined') {
        parsedRepeals = repString;
      }
    } catch(e) {}

    safeModalData = {
      title: String(selectedDoc.title || 'Brak tytułu'),
      signature: String(selectedDoc.signature || '-'),
      category: String(selectedDoc.category || 'Niesklasyfikowane'),
      status: String(selectedDoc.status || 'Nieokreślony'),
      date: String(selectedDoc.date || 'Brak daty'),
      issuer: String(selectedDoc.issuer || '-'),
      desc: String(selectedDoc.desc || 'Brak opisu.'),
      link: String(selectedDoc.link || '#'),
      repeals: parsedRepeals,
      attachments: parsedAttachments
    };
  }

  let aiReportData = { target: '-', rigor: '-', rigorColor: 'text-slate-400', readTime: 0 };
  if (selectedDoc && isAiActive && aiStage === 4) {
    try {
      const text = `${selectedDoc.title || ''} ${selectedDoc.desc || ''}`.toLowerCase();
      
      aiReportData.target = text.includes('zarząd') || text.includes('wewnętrz') ? "Administracja SSUEW" : (text.includes('koł') || text.includes('organizacj') ? "Organizacje Studenckie" : "Wszyscy Studenci");
      
      aiReportData.rigor = text.includes('regulamin') || text.includes('uchwała') ? "Bardzo Wysoki" : (text.includes('zarządzenie') ? "Średni" : "Niski");
      aiReportData.rigorColor = aiReportData.rigor === "Bardzo Wysoki" ? "text-rose-500" : (aiReportData.rigor === "Średni" ? "text-amber-400" : "text-emerald-400");
      
      if (selectedDoc.pages && !isNaN(selectedDoc.pages)) {
        aiReportData.readTime = parseInt(selectedDoc.pages) * 2;
      } else {
        const totalLength = String(selectedDoc.title || '').length + String(selectedDoc.desc || '').length;
        aiReportData.readTime = Math.max(1, Math.ceil(totalLength / 200)); 
        if (aiReportData.rigor === "Bardzo Wysoki" && aiReportData.readTime < 5) aiReportData.readTime = 5; 
      }
    } catch (e) { console.error("Ignorowany błąd AI", e); }
  }

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
    const cat = doc.category || '';
    const matchesSearch = `${title} ${sig} ${desc}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Wszystkie' || cat === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const activeDocsCount = documents.filter(d => d.status === 'Obowiązujący').length;
  const lastUpdate = documents.length > 0 ? (documents[0].date || '-') : 'Brak danych';

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
    }, 3); 
  };

  const handleGenerateTemplate = (type) => {
    let template = '';
    const today = new Date().toLocaleDateString('pl-PL');
    
    switch(type) {
      case 'zwolnienie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o zwolnienie)`; break;
      case 'wydarzenie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o wydarzenie)`; break;
      case 'sala_uew': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o salę)`; break;
      case 'banerowanie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o banerowanie)`; break;
      case 'plakatowanie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o plakatowanie)`; break;
      case 'przedluzenie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o przedłużenie)`; break;
      case 'wjazd': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o wjazd)`; break;
      case 'stoisko': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o stoisko)`; break;
      case 'grill': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o grill)`; break;
      case 'przestrzen': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o przestrzeń)`; break;
      case 'umeblowanie': template = `Wrocław, ${today} r.\n\n[Zgłaszający - Imię i Nazwisko]\n... (podanie o umeblowanie)`; break;
      case 'formalize':
        if (!editorText || editorText.length < 10) {
          setAiOutput("BŁĄD: Zbyt mało tekstu w edytorze po lewej. Napisz chociaż jedno robocze zdanie, a ja ubiorę to w odpowiednie paragrafy.");
          return;
        }
        template = `[PRZEKSZTAŁCONO W STYL URZĘDOWY]\n\nWrocław, dnia ${today} r.\n\nWNIOSEK / PISMO PRZEWODNIE\n\nDziałając w interesie społeczności studenckiej oraz na podstawie obowiązujących przepisów, niniejszym wnoszę o:\n\nZgodnie ze zgłoszonym postulatem: "${editorText.substring(0, 80)}[...]", pragniemy zaznaczyć, iż realizacja tego przedsięwzięcia bezpośrednio wpisuje się w realizację celów statutowych naszej organizacji.\n\nZwracamy się z uprzejmą prośbą o pozytywne rozpatrzenie niniejszego pisma.\n\nZ poważaniem,\n[Podpis]`;
        break;
      default: template = "Wybierz wzór z menu.";
    }
    simulateAiTyping(template);
  };

  const copyToEditor = () => { setEditorText(aiOutput); };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-24 pt-24 relative overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto mb-8 text-center md:text-left animate-fadeIn">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-4 transition-colors">
          <span>← Wróć do Dashboardu</span>
        </Link>
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

      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 animate-fadeIn">
          
          <div onClick={() => setActiveView('KNOWLEDGE')} className="cursor-pointer lg:col-span-2 group relative overflow-hidden bg-gradient-to-r from-indigo-700 to-violet-800 rounded-[2rem] p-8 text-white shadow-xl hover:shadow-2xl hover:shadow-indigo-900/20 transition-all hover:-translate-y-1 block isolate">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="inline-block px-3 py-1 mb-4 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  Przewodnik i Warsztat
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                  Strefa Wiedzy SSUEW
                </h2>
                <p className="text-indigo-100/90 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                  Zanim zaczniesz pisać – poznaj zasady Księgi Dokumentów, formatowanie, wymogi WCAG oraz weź udział w Akademii Protokolanta. 
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-3 text-sm font-bold">
                <span className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl shadow-md group-hover:bg-indigo-50 transition-colors flex items-center gap-2">
                  Otwórz Moduł <Icons.ArrowRight />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icons.Download /> Szybkie Szablony (Word)
            </h3>
            
            <div className="flex flex-col gap-3 flex-grow justify-center">
              <a href="#" className="group flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Icons.Document /></div>
                <div>
                  <span className="block font-bold text-slate-700 text-sm group-hover:text-blue-700">Szablon Uchwały</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Margines 35mm, DOCX</span>
                </div>
              </a>
              
              <a href="#" className="group flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Icons.Document /></div>
                <div>
                  <span className="block font-bold text-slate-700 text-sm group-hover:text-emerald-700">Papier Firmowy</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Pisma wychodzące, DOCX</span>
                </div>
              </a>

              <a href="#" className="group flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors">
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Icons.Document /></div>
                <div>
                  <span className="block font-bold text-slate-700 text-sm group-hover:text-amber-700">Zaświadczenie</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Z wklejonymi logotypami, DOCX</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-6 border-b border-slate-200">
          <button onClick={() => setActiveView('LEX')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all ${activeView === 'LEX' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            📚 Baza Aktów Prawnych
          </button>
          <button onClick={() => setActiveView('STUDIO')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeView === 'STUDIO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icons.Brain /> Studio Legislacyjne (AI)
          </button>
          <button onClick={() => setActiveView('KNOWLEDGE')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeView === 'KNOWLEDGE' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icons.Book /> Strefa Wiedzy
          </button>
        </div>

        {activeView === 'LEX' && (
          <div className="max-w-7xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-slideUp">
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
                    const catStr = String(doc.category || 'Default');
                    const style = CATEGORY_STYLES[catStr] || CATEGORY_STYLES.Default;
                    const isActive = doc.status === 'Obowiązujący';
                    const nowosc = isNew(doc.date);
                    
                    let hasAttachments = false;
                    try {
                      const atts = String(doc.attachments || '').trim().toLowerCase();
                      if (atts && atts !== 'brak' && atts !== 'undefined') hasAttachments = true;
                    } catch (e) {}

                    return (
                      <div key={doc.id || Math.random()} onClick={() => openModal(doc)} className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 md:items-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5 ${isActive ? 'border-slate-200 hover:border-blue-200' : 'border-slate-200 opacity-70 bg-slate-50 hover:opacity-100'}`}>
                        <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-xl items-center justify-center transition-colors ${isActive ? 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                          <Icons.Document />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.category || '-'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{doc.date || '-'}</span>
                            {nowosc && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">Nowość</span></>}
                            
                            {hasAttachments && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider"><Icons.Paperclip /> Załączniki</span></>}
                          </div>
                          <h3 className={`text-lg font-bold transition-colors leading-tight ${isActive ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 line-through'}`}>{doc.title || 'Brak tytułu'}</h3>
                          {!isActive && <p className="text-xs text-red-500 font-medium mt-1">Uchylony: Zastąpiony przez nowszy akt</p>}
                        </div>
                        <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 border-slate-100">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{doc.signature || '-'}</span>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isActive ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {doc.status || '-'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 flex flex-col h-[850px] overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Icons.Pen /></div>
                   <div>
                     <h3 className="font-bold text-slate-800 text-sm leading-none">Twój Edytor</h3>
                     <span className="text-[10px] text-slate-400 font-medium">Miejsce robocze na pisma</span>
                   </div>
                 </div>
                 <button onClick={() => {try{navigator.clipboard.writeText(editorText); showAlert('Skopiowano treść!');}catch(e){}}} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                   Kopiuj Całość
                 </button>
              </div>
              <textarea 
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Zacznij pisać swój dokument tutaj... Albo po prawej wybierz gotowy wzór podania, który spełnia wszystkie wewnątrzuczelniane wymogi!"
                className="flex-grow p-8 outline-none resize-none text-sm text-slate-800 leading-relaxed font-medium"
              />
            </div>

            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 flex flex-col h-[850px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 z-0"></div>
              <div className="relative z-10 p-5 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                     <Icons.Brain />
                   </div>
                   <div>
                     <h3 className="font-bold text-white text-sm leading-none">Lex AI Assistant</h3>
                     <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 11 URZĘDOWYCH WZORÓW</span>
                   </div>
                 </div>
              </div>

              <div className="relative z-10 flex-grow p-6 overflow-y-auto flex flex-col gap-6 scrollbar-hide" ref={aiOutputRef}>
                 <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-xs text-slate-300 leading-relaxed shadow-lg">
                   Wybierz oficjalny szablon pisma do władz Uczelni. W każdym z nich zaszyłem już wymagane przez konkretnych dyrektorów paragrafy (BHP, oświadczenia itd.).
                 </div>

                 <div>
                   <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Do Prorektora ds. Studenckich</span>
                   <div className="grid grid-cols-1 gap-2">
                     <button onClick={() => handleGenerateTemplate('zwolnienie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie dot. zwolnienia z zajęć dydaktycznych</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Uzasadnienie wkładu w społeczność i nadrabianie</span>
                        </div>
                        <span className="text-slate-500 group-hover:text-blue-400"><Icons.ArrowRight /></span>
                     </button>
                     <button onClick={() => handleGenerateTemplate('wydarzenie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o możliwość organizacji wydarzenia</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Kwestie techniczne i wizerunek UEW</span>
                        </div>
                        <span className="text-slate-500 group-hover:text-blue-400"><Icons.ArrowRight /></span>
                     </button>
                     <button onClick={() => handleGenerateTemplate('sala_uew')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o rezerwację pomieszczenia UEW</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Charakter merytoryczny spotkania</span>
                        </div>
                        <span className="text-slate-500 group-hover:text-blue-400"><Icons.ArrowRight /></span>
                     </button>
                   </div>
                 </div>

                 <div>
                   <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Do Zastępcy Kanclerza (Administracja)</span>
                   <div className="grid grid-cols-1 gap-2">
                     <button onClick={() => handleGenerateTemplate('banerowanie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie dot. możliwości banerowania</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Klauzule o bezpiecznym montażu i demontażu</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('plakatowanie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o możliwość plakatowania</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Rozpiska 15 plakatów w formacie A3</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('przedluzenie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o przedłużenie godzin otwarcia</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Pokoje SSUEW w B/J i gwarancja spokoju</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('stoisko')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o organizację stoiska promocyjnego</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Ciągi komunikacyjne oraz zapotrzebowanie meblowe</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('grill')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o możliwość grilla na Zaprzęgubiu</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Wniosek o doprowadzenie zasilania</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('wjazd')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o możliwość wjazdu na kampus</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Szablon uwzględniający gabaryty transportu</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('umeblowanie')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o doposażenie w umeblowanie</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Odpowiedzialność za odbiór i stan niepogorszony</span>
                        </div>
                     </button>
                     <button onClick={() => handleGenerateTemplate('przestrzen')} disabled={isDrafting} className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50">
                        <div>
                          <span className="block text-white font-bold text-sm mb-1">Podanie o rezerwację przestrzeni na Kampusie</span>
                          <span className="block text-emerald-400/80 text-[10px]"><Icons.Check /> Backstage i wymogi ewakuacyjne</span>
                        </div>
                     </button>
                   </div>
                 </div>

                 <button onClick={() => handleGenerateTemplate('formalize')} disabled={isDrafting} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-800/50 hover:to-indigo-800/50 border border-blue-800/50 rounded-xl text-left transition-all group disabled:opacity-50 mt-2">
                   <div>
                     <span className="block text-blue-100 font-bold text-sm mb-1 flex items-center gap-2"><Icons.Brain /> Sformatuj własny tekst z Edytora</span>
                     <span className="block text-blue-300/70 text-xs">Zamienię Twój luźny pomysł w formalne pismo.</span>
                   </div>
                   <span className="text-blue-400 group-hover:text-blue-300 transition-colors"><Icons.ArrowRight /></span>
                 </button>

                 {aiOutput && (
                   <div className="mt-4 animate-slideUp">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Icons.Brain /> Generowanie urzędowego pisma...
                      </span>
                      <div className="bg-slate-950 border border-slate-700 p-5 rounded-2xl text-xs text-slate-300 leading-relaxed font-mono shadow-inner whitespace-pre-wrap">
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

        {/* ==================================================== */}
        {/* WIDOK 3: STREFA WIEDZY (Księga + KWP) */}
        {/* ==================================================== */}
        {activeView === 'KNOWLEDGE' && (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-slideUp">
            
            <div className="bg-slate-50 border-b border-slate-100 p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 mb-4 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Oficjalne Standardy SSUEW
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Centrum Wiedzy SSUEW</h2>
                
                <div className="flex justify-center mt-4">
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner border border-slate-200 flex-wrap justify-center">
                    <button 
                      onClick={() => setKnowledgeTab('KSIEGA')}
                      className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${knowledgeTab === 'KSIEGA' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Icons.Document /> Księga Dokumentów
                    </button>
                    <button 
                      onClick={() => setKnowledgeTab('KWP')}
                      className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${knowledgeTab === 'KWP' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Icons.Book /> Akademia Protokolanta (KWP)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              
              {/* === ZAWARTOŚĆ: KSIĘGA DOKUMENTÓW (NOWA WERSJA) === */}
              {knowledgeTab === 'KSIEGA' && (
                <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto">
                  <p className="text-slate-500 mb-8 font-medium text-center">Oficjalny zbiór zasad dotyczących formatowania, marginesów, nazewnictwa plików i cyklu życia dokumentów obowiązujących w całej organizacji.</p>
                  
                  <Accordion title="Rozdział I: Konstytucja Dokumentów" badge="Fundamenty" icon={<Icons.Shield />} isOpen={openAccordion === 'rozdzial1'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial1' ? null : 'rozdzial1')}>
                    <h4 className="font-bold text-slate-800 mb-2">§1. Cel i zakres obowiązywania</h4>
                    <p className="mb-3 text-slate-600">Istotą Księgi jest zapewnienie spójnego wyglądu dokumentów SSUEW. Wdrożenie przedmiotowych standardów ma na celu kategoryczne ograniczenie uchybień formalnych. Stosowanie norm jest <strong>obligatoryjne</strong> dla wszystkich organów.</p>
                    
                    <h4 className="font-bold text-slate-800 mt-4 mb-2">§3. Nomenklatura i tożsamość prawna</h4>
                    <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-600">
                      <li><strong>Pełna nazwa polska:</strong> Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu.</li>
                      <li><strong>Skrócona nazwa polska:</strong> SSUEW.</li>
                      <li><strong>Pełna nazwa angielska:</strong> Student Government of Wroclaw University of Economics and Business.</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział II: Architektura i Typografia" badge="Typografia" icon={<Icons.Pen />} isOpen={openAccordion === 'rozdzial2'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial2' ? null : 'rozdzial2')}>
                    <h4 className="font-bold text-slate-800 mb-2">§5. Format i siatka</h4>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-600">
                      <li><strong>Format:</strong> A4 (210 x 297 mm)</li>
                      <li><strong>Marginesy:</strong> Górny 20 mm, Dolny 18 mm, Lewy 22 mm, Prawy 18 mm.</li>
                      <li><strong>Układ:</strong> Jednokolumnowy. Akty normatywne mają lewy margines redakcyjny (35 mm).</li>
                    </ul>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                      <p className="font-bold text-indigo-900 mb-1">§6. Typografia bazowa (Żelazna Reguła)</p>
                      <p className="text-indigo-800 text-sm">Urzędowym i <strong>jedynym dopuszczalnym</strong> krojem pisma dla wszelkiej dokumentacji oficjalnej SSUEW jest czcionka <strong>Times New Roman</strong>.</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-indigo-800">
                        <li><strong>Treść:</strong> 12 pt, Standard.</li>
                        <li><strong>H1 (Tytuły):</strong> 18 pt, Bold. <strong>H2:</strong> 14 pt, Bold. <strong>H3:</strong> 12 pt, Bold.</li>
                      </ul>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-2">§7. Skład i łamanie tekstu</h4>
                    <p className="text-slate-600">Obowiązuje interlinia 1,15 (lub 1,5). Zakazuje się pozostawiania pojedynczych znaków (tzw. sierot) na końcu wersów – wady te należy korygować twardą spacją (Shift+Enter).</p>
                  </Accordion>

                  <Accordion title="Rozdział III: Pieczęcie i Autoryzacja" badge="Autoryzacja" icon={<Icons.Hardware />} isOpen={openAccordion === 'rozdzial3'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial3' ? null : 'rozdzial3')}>
                    <h4 className="font-bold text-slate-800 mb-2">§8. Bloki podpisu</h4>
                    <p className="text-slate-600 mb-4">Obowiązuje układ: <strong>Imię Nazwisko - Funkcja - Organ</strong>. Podpis osoby o najwyższej randze zawsze po prawej stronie.</p>

                    <h4 className="font-bold text-slate-800 mb-2">§9. Gospodarka pieczęciami</h4>
                    <p className="text-slate-600">Pieczęć nagłówkowa (podłużna) przystawiana jest w lewym górnym rogu dokumentów wychodzących. Umowy wymagają "pieczęci na wąsie".</p>
                  </Accordion>

                  <Accordion title="Rozdział IV: Lingwistyka Urzędowa" badge="Słownik" icon={<Icons.Book />} isOpen={openAccordion === 'rozdzial4'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial4' ? null : 'rozdzial4')}>
                    <h4 className="font-bold text-slate-800 mb-2">§10. Tone of Voice</h4>
                    <p className="text-slate-600 mb-4">Pisma do Władz Rektorskich i administracji kategorycznie wymagają najwyższego standardu języka formalnego. Akty normatywne winny charakteryzować się precyzją i brakiem ozdobników.</p>

                    <h4 className="font-bold text-slate-800 mb-2">§11. Zapis dat i kwot</h4>
                    <p className="text-slate-600">Daty: <em>9 marca 2026 r.</em> Kwoty w umowach należy podawać liczbowo z walutą oraz uzupełniać zapisem słownym w nawiasie.</p>
                  </Accordion>

                  <Accordion title="Rozdział V: Katalog Administracja i Projekty" badge="Katalog Aktów" icon={<Icons.Document />} isOpen={openAccordion === 'rozdzial5'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial5' ? null : 'rozdzial5')}>
                    <p className="text-slate-600 mb-4"><strong>§12.</strong> Sekcja obejmuje wszelkie dokumenty regulujące wewnętrzne funkcjonowanie organizacji oraz wymianę pism z Władzami. Ustalony katalog:</p>
                    <ul className="list-[square] pl-8 space-y-2 text-slate-600">
                      <li><strong>Podania (każdej maści):</strong> m.in. o zwolnienie z zajęć, organizację wydarzenia, udostępnienie sali, rozwieszenie plakatów, banery, wjazd na kampus, stoiska, grille, umeblowanie.</li>
                      <li><strong>Akty Normatywne (wszystkie):</strong> Uchwały Zarządu, Uchwały RUSS, Zarządzenia Przewodniczącego, Regulaminy, Ordynacje.</li>
                      <li><strong>Korespondencja:</strong> Pisma Przewodnie, Listy Intencyjne.</li>
                      <li><strong>Akty Operacyjne:</strong> Pełnomocnictwa, Zaświadczenia, Klauzule RODO.</li>
                      <li><strong>Obieg Informacji:</strong> Protokoły (RUSS, SKS, Absolutoryjne) oraz Raporty.</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział VI: Katalog Finanse (Wyłączenia)" badge="Wyłączenia Prawne" icon={<Icons.Document />} isOpen={openAccordion === 'rozdzial6'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial6' ? null : 'rozdzial6')}>
                    <div className="bg-rose-50 border-l-4 border-rose-800 p-4 mb-4">
                      <p className="font-bold text-rose-900 text-sm">Klauzula Odrębności Prawnej</p>
                      <p className="text-rose-800 text-xs">Dokumentacja finansowo-księgowa podlega wymogom Prawa Finansów Publicznych i Zarządzeniom Kwestora UEW. Księga <strong>nie narzuca im formy wizualnej</strong>. Obowiązujące wzory należy pobierać z LEX UEW.</p>
                    </div>
                    <ul className="list-[square] pl-8 space-y-1 text-slate-600 text-sm">
                      <li>Budżet Główny, Prowizoria, Sprawozdania Budżetowe, Wnioski Grantowe.</li>
                      <li>Wniosek o Zgodę na Wydatek, Zamówienia (Usługi/Komputery), Wyjaśnienia do Zakupu.</li>
                      <li>Umowy Zlecenia / o Dzieło, Rachunki do Umów Zlecenia.</li>
                      <li>Karta Przekazania Danych (autowypłaty), Zlecenia Podróży, Rozchód Wewnętrzny.</li>
                      <li>Faktury, Noty Korygujące, Centralny Rejestr Faktur.</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział VII: Katalog Fundacja" badge="Katalog Aktów" icon={<Icons.Document />} isOpen={openAccordion === 'rozdzial7'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial7' ? null : 'rozdzial7')}>
                    <p className="text-slate-600 mb-4"><strong>§17. Akty Sektora Pozarządowego</strong><br/>Gdy podmiotem reprezentującym interesy jest Fundacja przy UEW, obowiązuje odrębna ścieżka:</p>
                    <ul className="list-[square] pl-8 space-y-2 text-slate-600">
                      <li><strong>Kontraktacja:</strong> Umowa Barterowa, Finansowa, Mieszana, Formularze Zamówień.</li>
                      <li><strong>Realizacja:</strong> Protokół Realizacji Świadczeń Sponsorskich.</li>
                      <li><strong>Kadry:</strong> Umowy Zlecenia / o Dzieło z funduszy Fundacji.</li>
                      <li><strong>Księgowość:</strong> Opisy Faktur Fundacyjnych, Noty Korygujące.</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział VIII: System Weryfikacji (SWD)" badge="System Weryfikacji" icon={<Icons.Check />} isOpen={openAccordion === 'rozdzial8'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial8' ? null : 'rozdzial8')}>
                    <h4 className="font-bold text-slate-800 mb-2">§18. Nomenklatura Archiwalna</h4>
                    <code className="block bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs mb-4">RRRR-MM-DD_TypDokumentu_Organ_SygnaturaWewnetrzna</code>
                    
                    <h4 className="font-bold text-slate-800 mb-2">§19. Etapy SWD</h4>
                    <ol className="list-[upper-roman] pl-8 space-y-2 text-slate-600">
                      <li><strong>Autokontrola (Wnioskodawca):</strong> Twórca sprawdza redakcję i wymuszoną czcionkę (Times New Roman).</li>
                      <li><strong>Nadzór Formalny (Administracja):</strong> Badanie zgodności z Księgą. Plik wadliwy zostaje odrzucony.</li>
                      <li><strong>Akceptacja i Kodyfikacja:</strong> Dokument po wizycie formalnej trafia do podpisu i Rejestru Prawa SSUEW.</li>
                    </ol>
                  </Accordion>
                </div>
              )}

              {/* === ZAWARTOŚĆ: AKADEMIA PROTOKOLANTA (KWP) === */}
              {knowledgeTab === 'KWP' && (
                <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
                  
                  {/* Karty Warsztatowe KWP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                      <div className="w-12 h-12 bg-white text-amber-600 shadow-sm rounded-xl flex items-center justify-center mb-6"><Icons.Hardware /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">1. Ekwipunek (Hardware)</h3>
                      <p className="text-slate-500 mb-6 text-sm">Nie siadaj do pisania z pustymi rękami. Dobre przygotowanie to połowa sukcesu.</p>
                      <ul className="space-y-4 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Dyktafon / Telefon:</strong> Nagrywaj długie posiedzenia. Nagranie służy weryfikacji luk, a nie pisaniu od zera.</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Szablon (Template):</strong> Wzór dokumentu przygotuj przed spotkaniem. Wklej do niego agendę – to Twój szkielet.</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Zasilanie i komfort:</strong> Ładowarka, przedłużacz i woda to Twoi najlepsi przyjaciele podczas długich obrad.</span></li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                      <div className="w-12 h-12 bg-white text-amber-600 shadow-sm rounded-xl flex items-center justify-center mb-6"><Icons.Pen /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">2. Sztuka "Tłumaczenia"</h3>
                      <p className="text-slate-500 mb-6 text-sm">Protokół to nie transkrypcja. Jesteś tłumaczem, który zamienia chaos dyskusji na uporządkowany tekst.</p>
                      <ul className="space-y-4 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Sens zamiast cytatów:</strong> Wystarczy oddać sens i najważniejsze informacje dla kontekstu, bez pisania "słowo w słowo".</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Odpowiednia forma:</strong> Zapisuj w formie bezosobowej lub w trzeciej osobie z zachowaniem spójności.</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Identyfikacja mówcy:</strong> Przed wypowiedzią musi znaleźć się: Imię, Nazwisko oraz pełniona funkcja.</span></li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                      <div className="w-12 h-12 bg-white text-amber-600 shadow-sm rounded-xl flex items-center justify-center mb-6"><Icons.Brain /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">3. Pełny Obiektywizm</h3>
                      <p className="text-slate-500 mb-6 text-sm">Jako protokolant jesteś obserwatorem, a nie stroną w dyskusji. Dokument musi być neutralny.</p>
                      <ul className="space-y-4 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Brak ocen:</strong> Rzetelność to przedstawienie faktów w sposób obiektywny, bez podkoloryzowania.</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Neutralność językowa:</strong> Twórz bez osobistych osądów lub wprowadzania opinii osób trzecich jako faktów.</span></li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                      <div className="w-12 h-12 bg-white text-amber-600 shadow-sm rounded-xl flex items-center justify-center mb-6"><Icons.Book /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-4">4. Szlifowanie Diamentu</h3>
                      <p className="text-slate-500 mb-6 text-sm">Ostatni etap to dbałość o formę, która świadczy o Twoim profesjonalizmie przed Zarządem.</p>
                      <ul className="space-y-4 text-sm text-slate-600">
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Ton i poprawność:</strong> Dbaj o formalny ton, interpunkcję oraz wielkie litery w nazwach organów.</span></li>
                        <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Terminowość:</strong> Zewnętrzne protokoły do miesiąca. Wewnętrzne (RUSS, SKS) wysyłaj póki pamiętasz kontekst!</span></li>
                      </ul>
                    </div>
                  </div>

                  {/* Anatomia Protokołów z WZORAMI */}
                  <div className="space-y-4 mt-8">
                    <p className="text-slate-500 mb-6 font-medium text-center">Każde spotkanie ma inny ciężar gatunkowy. Poniżej znajdziesz wytyczne dla 5 kluczowych typów dokumentów oraz oficjalne Szablony.</p>
                    
                    <Accordion title="Raport Projektowy (Team Meeting)" badge="Operacyjne" icon={<Icons.File />} isOpen={openAccordion === 'raport'} onClick={() => setOpenAccordion(openAccordion === 'raport' ? null : 'raport')}>
                      <div className="mb-4">
                        <a href="#" className="inline-flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
                          <Icons.Download /> Pobierz Wzór Raportu
                        </a>
                      </div>
                      <p className="mb-4 text-slate-700 font-medium">To najlżejsza forma. Raport ma być krótki, zwięzły i służyć szybkiej wymianie informacji w zespole.</p>
                      <ul className="space-y-3 list-disc list-inside pl-4 marker:text-amber-500 text-slate-600">
                        <li><strong>Nagłówek:</strong> Nazwa projektu, data spotkania oraz lista uczestników.</li>
                        <li><strong>Podsumowanie Działań:</strong> Konkretne wypunktowanie "zrobionego" z podziałem na osoby.</li>
                        <li><strong>Plany na tydzień:</strong> Action points, czyli jasne przypisanie zadań na kolejne dni.</li>
                        <li><strong>SRIWW:</strong> Sprawy Różne i Wolne Wnioski – miejsce na luźne wrzutki.</li>
                      </ul>
                    </Accordion>

                    <Accordion title="Protokół SKS (Spotkanie Komisji)" badge="Ewaluacyjne" icon={<Icons.File />} isOpen={openAccordion === 'sks'} onClick={() => setOpenAccordion(openAccordion === 'sks' ? null : 'sks')}>
                      <div className="mb-4">
                        <a href="#" className="inline-flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
                          <Icons.Download /> Pobierz Wzór Protokołu SKS
                        </a>
                      </div>
                      <p className="mb-4 text-slate-700 font-medium">SKS to serce operacyjne. Protokół monitoruje bieżące projekty i służy edukacji zespołu.</p>
                      <ul className="space-y-3 list-disc list-inside pl-4 marker:text-amber-500 text-slate-600">
                        <li><strong>Metryczka:</strong> Numer sprawy, dokładna data, miejsce i czas.</li>
                        <li><strong>Status projektów:</strong> Krótkie raporty o działających projektach.</li>
                        <li>
                          <strong>Ewaluacja (Must-have):</strong> Dla zakończonych projektów podajemy twarde metryki: koszt, liczbę członków, frekwencję i średnią ocenę.<br/>
                          <span className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 inline-block border border-amber-100">
                            💡 Wskazówka: Wypisujemy "Plusy ujemne" (do poprawy) i "Plusy dodatnie" (sukcesy) z rekomendacjami.
                          </span>
                        </li>
                      </ul>
                    </Accordion>

                    <Accordion title="Protokół RUSS (Rada Uczelniana)" badge="Legislacyjne" icon={<Icons.File />} isOpen={openAccordion === 'russ'} onClick={() => setOpenAccordion(openAccordion === 'russ' ? null : 'russ')}>
                      <div className="mb-4">
                        <a href="#" className="inline-flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
                          <Icons.Download /> Pobierz Wzór Protokołu RUSS
                        </a>
                      </div>
                      <p className="mb-4 text-slate-700 font-medium">Wchodzimy na poziom legislacyjny. Protokół musi być rygorystyczny, suchy i faktograficzny.</p>
                      <ul className="space-y-3 list-disc list-inside pl-4 marker:text-amber-500 text-slate-600">
                        <li><strong>Otwarcie obrad:</strong> Stwierdzenie prawomocności obrad (quorum) na podstawie obecności.</li>
                        <li><strong>Lista obecności:</strong> Imienna tabela z zaznaczeniem obecności każdego Radnego.</li>
                        <li>
                          <strong className="text-slate-900">Głosowania:</strong> Wyniki uchwał z podaniem trybu (jawny/tajny) oraz rozbiciem na <em>"za"</em>, <em>"przeciw"</em>, <em>"wstrzymujące"</em>.
                        </li>
                      </ul>
                    </Accordion>

                    <Accordion title="Protokół z Absolutorium" badge="Roczne" icon={<Icons.File />} isOpen={openAccordion === 'absolutorium'} onClick={() => setOpenAccordion(openAccordion === 'absolutorium' ? null : 'absolutorium')}>
                      <div className="mb-4">
                        <a href="#" className="inline-flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
                          <Icons.Download /> Pobierz Wzór Protokołu Absolutoryjnego
                        </a>
                      </div>
                      <p className="mb-4 text-slate-700 font-medium">Najważniejszy dokument w kadencji. Dowód oceny działalności Samorządu.</p>
                      <ul className="space-y-3 list-disc list-inside pl-4 marker:text-amber-500 text-slate-600">
                        <li><strong>Sprawozdania Osobowe:</strong> Cele strategiczne, podjęte działania i twarde liczby osoby funkcyjnej.</li>
                        <li><strong>Panel Q&A:</strong> Zapis dyskusji wskazujący Radnego pytającego i odpowiedź (w 3. osobie).</li>
                        <li><strong>Wynik Absolutorium:</strong> Werdykt ogłoszony przez Komisję Skrutacyjną.</li>
                      </ul>
                    </Accordion>

                    <Accordion title="Standard KPUE (Forum)" badge="Zewnętrzne" icon={<Icons.File />} isOpen={openAccordion === 'kpue'} onClick={() => setOpenAccordion(openAccordion === 'kpue' ? null : 'kpue')}>
                      <div className="mb-4">
                        <a href="#" className="inline-flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
                          <Icons.Download /> Pobierz Wzór Protokołu FUE
                        </a>
                      </div>
                      <p className="mb-4 text-slate-700 font-medium">Wizytówka Samorządu na wyjazdach. Wymaga ścisłego trzymania się standardów FUE.</p>
                      <ul className="space-y-3 list-disc list-inside pl-4 marker:text-amber-500 text-slate-600">
                        <li><strong>Wyróżnienia:</strong> Punkty obrad oraz imiona/funkcje wypowiadających się <strong>bezwzględnie pogrubione</strong>.</li>
                        <li><strong>Tabele Głosowań:</strong> Kolumny: <em>Ilość głosujących</em>, <em>Ważne</em>, <em>Za</em>, <em>Wstrzymane</em>, <em>Przeciw</em>.</li>
                        <li><strong>Komentarze techniczne:</strong> Przerwy zapisujemy <span className="italic">wyśrodkowaną kursywą</span> z dokładną godziną.</li>
                      </ul>
                    </Accordion>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {safeModalData && activeView === 'LEX' && (
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
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{safeModalData.signature}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{safeModalData.category}</p>
                  </div>
                  <h2 className={`text-2xl font-black leading-tight ${safeModalData.status === 'Obowiązujący' ? 'text-slate-900' : 'text-slate-500 line-through'}`}>{safeModalData.title}</h2>
               </div>
               <button onClick={() => setSelectedDoc(null)} className="shrink-0 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Icons.Close /></button>
             </div>
             <div className="p-8 overflow-y-auto bg-slate-50/50 flex-grow">
                <div className="flex flex-wrap gap-3 mb-6">
                  <button onClick={runAiAnalysis} disabled={isAiActive} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAiActive ? 'bg-slate-800 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/30 hover:scale-105'}`}><Icons.Brain /> {isAiActive ? 'Analizowanie...' : 'Uruchom Audyt Lex AI'}</button>
                  <button onClick={() => handleCopyCitation(safeModalData.signature, safeModalData.title, safeModalData.issuer, safeModalData.date)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"><Icons.Copy /> Skopiuj przypis</button>
                  <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"><Icons.QR /> Kod QR do druku</button>
                </div>
                {isAiActive && (
                  <div className="mb-8 bg-slate-900 rounded-2xl p-6 shadow-inner border border-slate-800 text-slate-300 font-mono text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4"><span className="flex items-center gap-2 text-blue-400 font-bold"><Icons.Brain /> LEX_AI_CORE_v1.2</span><span className="text-emerald-400 font-bold">{aiProgress}%</span></div>
                      <div className="text-slate-500 text-xs tracking-widest mb-4">[{Array.from({length: 20}).map((_, i) => i < (aiProgress/5) ? '█' : '·').join('')}]</div>
                      {aiStage >= 1 && <p className="text-slate-400">» Inicjowanie skanera semantycznego... <span className="text-emerald-400 float-right">OK</span></p>}
                      {aiStage >= 2 && <p className="text-slate-400">» Mapowanie referencji uchylających... <span className="text-emerald-400 float-right">OK</span></p>}
                      {aiStage >= 3 && <p className="text-slate-400">» Kompilacja raportu syntetycznego... <span className="text-emerald-400 float-right">DONE</span></p>}
                      {aiStage === 4 && (
                        <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideUp">
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Główny Adresat</span><span className="font-bold text-white">{aiReportData.target}</span></div>
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Poziom Formalizacji</span><span className={`font-bold flex items-center gap-1 ${aiReportData.rigorColor}`}><Icons.Shield /> {aiReportData.rigor}</span></div>
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Szacowany Czas</span><span className="font-bold text-sky-400 flex items-center gap-1"><Icons.Timer /> ok. {aiReportData.readTime} min</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {showQR && (
                  <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center animate-slideDown">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Zeskanuj, aby przeczytać akt</p>
                    <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(safeModalData.link)}`} alt="QR Code" className="w-32 h-32" /></div>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Zakres Regulacji</h3>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="text-slate-600 text-sm leading-relaxed">{safeModalData.desc}</p></div>
                </div>
                {safeModalData.attachments && safeModalData.attachments.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Icons.Paperclip /> Powiązane Załączniki</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {safeModalData.attachments.map((att, idx) => (
                        <a key={idx} href={att.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group"><div className="text-slate-300 group-hover:text-blue-500 transition-colors"><Icons.Document /></div><span className="font-bold text-sm text-slate-700 group-hover:text-blue-700 transition-colors">{att.name}</span></a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Data Wydania</span><span className="font-bold text-slate-800 text-sm">{safeModalData.date}</span></div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative group"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Udostępnij</span><button onClick={() => handleCopyLink(safeModalData.link)} className="flex items-center gap-2 font-bold text-blue-600 text-sm hover:text-blue-700 transition-colors">🔗 Kopiuj link</button></div>
                  <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Organ Wydający</span><span className="font-bold text-slate-800 text-sm">{safeModalData.issuer}</span></div>
                  {safeModalData.repeals && (
                    <div className="col-span-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm mt-2 flex flex-col justify-center"><span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 block">Ten akt uchyla:</span><span className="font-bold text-rose-700 text-sm">{safeModalData.repeals}</span></div>
                  )}
                </div>
             </div>
             <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <a href={safeModalData.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-900/20 transition-all">Otwórz oryginał dokumentu <Icons.External /></a>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}