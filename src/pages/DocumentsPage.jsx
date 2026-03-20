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

// === KOMPONENT AKORDEONU ===
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
              
              {/* === ZAWARTOŚĆ: KSIĘGA DOKUMENTÓW === */}
              {knowledgeTab === 'KSIEGA' && (
                <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto">
                  <p className="text-slate-500 mb-8 font-medium text-center">
                    Oficjalny zbiór zasad dotyczących formatowania, obiegu, zatwierdzania i archiwizowania dokumentów obowiązujących w całej organizacji. Zastępuje dotychczasowe, rozproszone wytyczne.
                  </p>
                  
                  <Accordion title="Rozdział I: Konstytucja Dokumentów" badge="Część I" icon={<Icons.Shield />} isOpen={openAccordion === 'rozdzial1'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial1' ? null : 'rozdzial1')}>
                    <h4 className="font-bold text-slate-800 mb-2">§1-4. Cel i zakres obowiązywania</h4>
                    <p className="mb-3 text-slate-600">
                      Celem Księgi jest ujednolicenie standardów, ograniczenie ryzyk organizacyjnych oraz wsparcie ciągłości działania Samorządu. Księga ma charakter standardotwórczy, organizacyjny i wykonawczy.
                    </p>
                    <div className="bg-slate-100 p-4 border-l-4 border-slate-800 mb-3">
                      <strong>Wymóg bezwzględny:</strong> Stosowanie Księgi jest obowiązkowe dla wszystkich organów, komisji i pionów SSUEW. W razie sprzeczności z aktami wyższego rzędu (np. Regulaminem Samorządu), Księga ustępuje im pierwszeństwa.
                    </div>
                    <h4 className="font-bold text-slate-800 mt-4 mb-2">§5. Definicje</h4>
                    <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-600 text-sm">
                      <li><strong>Dokument roboczy:</strong> pozostaje w opracowaniu, niezatwierdzony.</li>
                      <li><strong>Dokument finalny:</strong> ukończony pod względem formalnym i merytorycznym.</li>
                      <li><strong>Dokument podpisany:</strong> finalny, który przeszedł ścieżkę akceptacji.</li>
                      <li><strong>Repozytorium centralne:</strong> zasób na dokumenty finalne. Przestrzeń robocza służy pracy bieżącej.</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział II: Klasyfikacja i Hierarchia" badge="Część II" icon={<Icons.Document />} isOpen={openAccordion === 'rozdzial2'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial2' ? null : 'rozdzial2')}>
                    <h4 className="font-bold text-slate-800 mb-2">§6-10. Kategorie dokumentów</h4>
                    <ul className="list-[square] pl-5 space-y-2 mb-4 text-slate-600">
                      <li><strong>Akty normatywne (wiążące):</strong> Uchwały, zarządzenia, regulaminy, ordynacje.</li>
                      <li><strong>Dokumenty organizacyjne (porządkujące):</strong> Protokoły, sprawozdania, harmonogramy, rejestry.</li>
                      <li><strong>Dokumenty operacyjne (bieżące):</strong> Podania, pisma przewodnie, wnioski, pełnomocnictwa, zaświadczenia.</li>
                      <li><strong>Materiały pomocnicze (wspierające):</strong> Wzory, checklisty, instrukcje (np. KWP).</li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział III: Standard Edytorski i Architektura" badge="Część III" icon={<Icons.Pen />} isOpen={openAccordion === 'rozdzial3'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial3' ? null : 'rozdzial3')}>
                    <h4 className="font-bold text-slate-800 mb-2">§14-17. Zasady ogólne</h4>
                    <p className="text-slate-600 mb-4">Dokument musi być czytelny i precyzyjny. Niedopuszczalne jest używanie sformułowań potocznych lub emocjonalnych w oficjalnych aktach.</p>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                      <p className="font-bold text-indigo-900 mb-1">§18-22. Parametry techniczne (Żelazna Reguła)</p>
                      <p className="text-indigo-800 text-sm">Podstawowym formatem jest A4 w układzie pionowym. <strong>Podstawowym i jedynym urzędowym krojem pisma dla oficjalnej dokumentacji SSUEW jest Times New Roman.</strong> Niedopuszczalne jest dowolne zmienianie tego kroju.</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-indigo-800">
                        <li><strong>Marginesy:</strong> Standardowe, dla aktów normatywnych poszerzony lewy margines redakcyjny (35 mm).</li>
                        <li><strong>Bolding:</strong> Stosuje się do tytułów i wyróżnień. Kursywa rzadko (np. dygresje, noty techniczne).</li>
                      </ul>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-2">§23-26. Struktura podstawowa</h4>
                    <p className="text-slate-600">Dokument musi posiadać: oznaczenie organu, datę, miejsce, jednoznaczny tytuł, treść, blok podpisu (wskazujący funkcję) oraz listę załączników (jeśli dotyczy).</p>
                  </Accordion>

                  <Accordion title="Rozdział IV: Typy Dokumentów i Układ" badge="Część IV" icon={<Icons.Book />} isOpen={openAccordion === 'rozdzial4'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial4' ? null : 'rozdzial4')}>
                    <h4 className="font-bold text-slate-800 mb-2">§27-30. Akty normatywne</h4>
                    <p className="text-slate-600 mb-4"><strong>Uchwała:</strong> Wymaga podstawy działania, części normatywnej, postanowienia o wykonaniu/wejściu w życie. <strong>Regulamin:</strong> Musi regulować definicje, zasady, procedury i kompetencje w paragrafach.</p>

                    <h4 className="font-bold text-slate-800 mb-2">§31-33. Dokumenty organizacyjne</h4>
                    <p className="text-slate-600 mb-4"><strong>Protokół:</strong> Wymaga listy uczestników (lub quorum), wyników głosowań, decyzji. <strong>Sprawozdanie/Raport:</strong> Rzeczowe, oparte na faktach i rekomendacjach.</p>

                    <h4 className="font-bold text-slate-800 mb-2">§34-36. Dokumenty operacyjne</h4>
                    <p className="text-slate-600"><strong>Pisma/Wnioski:</strong> Muszą wskazywać adresata i precyzyjne uzasadnienie. <strong>Zaświadczenia:</strong> Formy krótkie, bez komentarzy i ozdobników.</p>
                  </Accordion>

                  <Accordion title="Rozdział V: Obieg i System Weryfikacji (SWD)" badge="Część V" icon={<Icons.Check />} isOpen={openAccordion === 'rozdzial5'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial5' ? null : 'rozdzial5')}>
                    <h4 className="font-bold text-slate-800 mb-2">§37-43. Cykl życia dokumentu</h4>
                    <ol className="list-decimal pl-5 space-y-1 mb-4 text-slate-600">
                      <li>Opracowanie robocze (w odpowiednim Szablonie).</li>
                      <li><strong>Weryfikacja formalna:</strong> Zgodność z Księgą (czcionka, układ, marginesy).</li>
                      <li>Akceptacja merytoryczna.</li>
                      <li>Zatwierdzenie (podpis) -> Status finalny.</li>
                      <li>Archiwizacja w Repozytorium.</li>
                    </ol>

                    <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-4">
                      <p className="font-bold text-rose-900 mb-1">§48-49. Błędy Krytyczne w SWD</p>
                      <p className="text-sm text-rose-800">
                        Za błąd krytyczny, dyskwalifikujący z obiegu, uważa się m.in.: brak daty, brak podpisów, brak załączników, użycie potocznej nazwy pliku lub rozbieżność między tytułem a treścią. Dokument z błędem wraca do wnioskodawcy.
                      </p>
                    </div>
                  </Accordion>

                  <Accordion title="Rozdział VI: Repozytorium i Nomenklatura Plików" badge="Część VI" icon={<Icons.Hardware />} isOpen={openAccordion === 'rozdzial6'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial6' ? null : 'rozdzial6')}>
                    <h4 className="font-bold text-slate-800 mb-2">§50-52. Zasady nazewnictwa (Bezwzględne)</h4>
                    <code className="block bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs mb-4">
                      RRRR-MM-DD_TypDokumentu_Organ_SygnaturaWewnetrzna<br/>
                      <span className="text-slate-500">Przykłady:</span><br/>
                      <span className="text-white">2026-03-20_Uchwala_RUSS_03-2026</span><br/>
                      <span className="text-white">2026-03-20_Protokol_KomisjaAdministracji_04-2026</span>
                    </code>
                    
                    <h4 className="font-bold text-slate-800 mb-2">§53-60. Struktura i ciągłość</h4>
                    <p className="text-slate-600">Rozróżnia się foldery: <strong>Robocze</strong> (projekty, brudnopisy) i <strong>Finalne/Archiwalne</strong> (tylko pdf/docx zatwierdzone). Zapewnia to ciągłość organizacyjną na kolejne kadencje.</p>
                  </Accordion>

                  <Accordion title="Rozdział VII: Wyłączenia (Finanse i RODO)" badge="Część VII" icon={<Icons.Document />} isOpen={openAccordion === 'rozdzial7'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial7' ? null : 'rozdzial7')}>
                    <h4 className="font-bold text-slate-800 mb-2">§63. Dokumenty finansowe</h4>
                    <p className="text-slate-600 mb-4">Księga <strong>nie ingeruje w wygląd i wzory</strong> dokumentów finansowych (np. budżet, faktury, wnioski o wydatek, rozliczenia). Podlegają one rygorom Prawa Finansów Publicznych oraz Zarządzeniom Kwestora UEW. Należy je pobierać bezpośrednio z Uczelnianego Systemu LEX.</p>

                    <h4 className="font-bold text-slate-800 mb-2">§64-65. Dane osobowe (RODO)</h4>
                    <p className="text-slate-600">Dokumenty operujące danymi (szczególnie w HR i Administracji) podlegają podwyższonej ostrożności i muszą znajdować się w Obszarach Ograniczonego Dostępu na Dysku Samorządu.</p>
                  </Accordion>

                  <Accordion title="Załączniki do Księgi Dokumentów" badge="Wzorce" icon={<Icons.Paperclip />} isOpen={openAccordion === 'rozdzial8'} onClick={() => setOpenAccordion(openAccordion === 'rozdzial8' ? null : 'rozdzial8')}>
                    <h4 className="font-bold text-slate-800 mb-2">Zał. 1: Checklista weryfikacji (SWD)</h4>
                    <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-600 text-sm">
                      <li>Czy ma prawidłowy tytuł, datę, organ?</li>
                      <li>Czy zachowano czcionkę (Times New Roman)?</li>
                      <li>Czy język jest formalny?</li>
                      <li>Czy nazwa pliku to <em>RRRR-MM-DD_Typ...</em>?</li>
                    </ul>

                    <h4 className="font-bold text-slate-800 mb-2">Zał. 4: Struktura dysku (Repozytorium)</h4>
                    <code className="block bg-slate-100 p-3 rounded-lg text-xs text-slate-800 font-mono">
                      01_Akty_normatywne<br/>
                      02_Protokoły<br/>
                      03_Pisma_i_wnioski<br/>
                      04_Wzory_i_szablony<br/>
                      05_Sprawozdania_i_raporty<br/>
                      06_Archiwum_kadencyjne<br/>
                      07_Obszar_ograniczonego_dostepu
                    </code>
                  </Accordion>
                </div>
              )}

              {/* === ZAWARTOŚĆ: AKADEMIA PROTOKOLANTA (KWP) === */}
              {knowledgeTab === 'KWP' && (
                <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
                  <p className="text-slate-500 mb-8 font-medium text-center">
                    Kompendium stanowi praktyczny przewodnik dla protokolantów obrad SSUEW. Wspiera sporządzanie dokumentów utrwalających przebieg posiedzeń, narad i zjazdów.
                  </p>
                  
                  <Accordion title="Rozdział 1: Wprowadzenie i Rola Protokolanta" badge="Część I" icon={<Icons.Shield />} isOpen={openAccordion === 'kwp1'} onClick={() => setOpenAccordion(openAccordion === 'kwp1' ? null : 'kwp1')}>
                    <h4 className="font-bold text-slate-800 mb-2">Rola i obowiązki</h4>
                    <p className="mb-3 text-slate-600">
                      Zadaniem protokolanta nie jest sporządzanie stenogramu (zapisywanie słowo w słowo), lecz odzwierciedlenie przebiegu obrad w sposób <strong>rzetelny i użyteczny organizacyjnie</strong>. Należy ustalić agendę, zapisywać decyzje, zadania oraz wyniki głosowań.
                    </p>
                    <div className="bg-amber-50 p-4 border-l-4 border-amber-500">
                      <strong>Neutralność:</strong> Protokół nie może zawierać osobistych ocen, interpretacji ani żartów. Opis ma być suchy i faktograficzny.
                    </div>
                  </Accordion>

                  <Accordion title="Rozdział 2: Przygotowanie i Warsztat" badge="Część II" icon={<Icons.Hardware />} isOpen={openAccordion === 'kwp2'} onClick={() => setOpenAccordion(openAccordion === 'kwp2' ? null : 'kwp2')}>
                    <ul className="space-y-4 text-sm text-slate-600">
                      <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Szablon (Template):</strong> Zawsze posługuj się gotowym wzorem z Księgi Dokumentów. Wklej agendę <em>przed</em> spotkaniem.</span></li>
                      <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Zasilanie i sprzęt:</strong> Bateria do laptopa i woda to podstawa długich obrad.</span></li>
                      <li className="flex items-start gap-3"><span className="text-amber-500 mt-0.5"><Icons.Check /></span><span><strong>Dyktafon:</strong> Służy wyłącznie jako pomocnicza autokontrola do weryfikacji skomplikowanych głosowań lub cytatów, a nie do transkrypcji od zera.</span></li>
                    </ul>
                  </Accordion>

                  <Accordion title="Rozdział 3: Sztuka Protokołowania i Głosowania" badge="Część III" icon={<Icons.Pen />} isOpen={openAccordion === 'kwp3'} onClick={() => setOpenAccordion(openAccordion === 'kwp3' ? null : 'kwp3')}>
                    <h4 className="font-bold text-slate-800 mb-2">Zapisywanie dyskusji</h4>
                    <p className="mb-4 text-slate-600 text-sm">Wskazuj mówcę tylko, gdy zgłasza stanowisko, formalny wniosek lub zadał kluczowe pytanie. Oddawaj <strong>sens</strong> wypowiedzi. Omijaj dygresje.</p>

                    <h4 className="font-bold text-slate-800 mb-2">Zapisywanie zadań</h4>
                    <p className="mb-4 text-slate-600 text-sm">Zawsze wskazuj: <em>co ustalono, kto jest odpowiedzialny, jaki jest deadline</em>.</p>

                    <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-2">Głosowania (Kluczowy Element)</h4>
                      <p className="text-sm text-slate-700">Każde głosowanie decyzyjne musi znaleźć się w protokole. Wymagane składowe: przedmiot, tryb (jawny/tajny), "ZA", "PRZECIW", "WSTRZYMUJE SIĘ" oraz wynik.</p>
                      <code className="block mt-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded">
                        Przykład: W głosowaniu jawnym oddano 9 głosów „za”, 0 „przeciw”, 1 „wstrzymujący się”. Uchwała została podjęta.
                      </code>
                    </div>
                  </Accordion>

                  <Accordion title="Rozdział 4: Redakcja i Obieg po spotkaniu" badge="Część IV" icon={<Icons.Timer />} isOpen={openAccordion === 'kwp4'} onClick={() => setOpenAccordion(openAccordion === 'kwp4' ? null : 'kwp4')}>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                      <li><strong>Niezwłoczność:</strong> Uzupełnij luki w notatkach maksymalnie kilka godzin po spotkaniu, póki pamiętasz kontekst.</li>
                      <li><strong>Weryfikacja:</strong> Upewnij się co do poprawności imion, nazwisk, nazw komisji i numerów uchwał.</li>
                      <li><strong>Korekta językowa:</strong> Usuń potoczne zwroty i błędy ortograficzne (Księga Dokumentów czuwa!).</li>
                      <li><strong>Akceptacja:</strong> Przekaż dokument Przewodniczącemu do akceptacji przed umieszczeniem w folderze Finalnym.</li>
                    </ul>
                  </Accordion>

                  {/* TYPY PROTOKOŁÓW + WZORY */}
                  <Accordion title="Rozdział 5: Typy Protokołów i Wzory" badge="Część V" icon={<Icons.Document />} isOpen={openAccordion === 'kwp5'} onClick={() => setOpenAccordion(openAccordion === 'kwp5' ? null : 'kwp5')}>
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-800">1. Protokół Formalny (RUSS / Organ Kolegialny)</h4>
                          <button className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"><Icons.Download /> Pobierz Wzór</button>
                        </div>
                        <p className="text-xs text-slate-600">Dokument rygorystyczny i faktograficzny. Wymaga podania quorum, imiennej listy obecności i dokładnego rozbicia każdego głosowania (za/przeciw/wstrzym.).</p>
                      </div>

                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-800">2. Protokół Komisji (SKS)</h4>
                          <button className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"><Icons.Download /> Pobierz Wzór</button>
                        </div>
                        <p className="text-xs text-slate-600">Cel: operacyjna użyteczność. Monitoruje statusy projektów, terminy oraz tzw. ewaluację (weryfikację założeń po evencie).</p>
                      </div>

                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-800">3. Raport Roboczy</h4>
                          <button className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"><Icons.Download /> Pobierz Wzór</button>
                        </div>
                        <p className="text-xs text-slate-600">Krótki, zadaniowy, zorientowany na cel. Spisuje ustalenia, osoby odpowiedzialne i terminy na najbliższy tydzień.</p>
                      </div>

                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-800">4. Protokół Absolutoryjny</h4>
                          <button className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"><Icons.Download /> Pobierz Wzór</button>
                        </div>
                        <p className="text-xs text-slate-600">Szczegółowy dokument na koniec kadencji. Obejmuje sprawozdania funkcyjne, Panel Q&A (Kto pyta -> Kto odpowiada) i wynik głosowania Rewizyjnej.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-800">5. Zewnętrzny (Forum Uczelni Ekonomicznych)</h4>
                          <button className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"><Icons.Download /> Pobierz Wzór FUE</button>
                        </div>
                        <p className="text-xs text-slate-600">Wymaga uwzględnienia narzuconych zewnętrznie zasad KPUE. Zwykle wymaga pogrubiania nazwisk, dedykowanych tabel głosowań oraz kursywy dla not technicznych.</p>
                      </div>
                    </div>
                  </Accordion>

                  <Accordion title="Rozdział 6: Dobre Praktyki i Najczęstsze Błędy" badge="Część VI" icon={<Icons.Brain />} isOpen={openAccordion === 'kwp6'} onClick={() => setOpenAccordion(openAccordion === 'kwp6' ? null : 'kwp6')}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="font-bold text-emerald-800 mb-2">👍 Dobre Praktyki</p>
                        <ul className="list-disc pl-4 text-xs text-emerald-700 space-y-1">
                          <li>Przygotowanie wzoru z agendą przed obradami.</li>
                          <li>Bieżące porządkowanie i boldowanie nazwisk w trakcie wpisywania.</li>
                          <li>Zapisywanie decyzji w czasie rzeczywistym.</li>
                        </ul>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <p className="font-bold text-rose-800 mb-2">❌ Najczęstsze Błędy</p>
                        <ul className="list-disc pl-4 text-xs text-rose-700 space-y-1">
                          <li>Stenogramowanie (zapisywanie "yhy", "eee", dygresji).</li>
                          <li>Pomijanie wyników głosowań.</li>
                          <li>Brak listy obecności.</li>
                          <li>Zapisywanie pliku jako `dokument1.pdf`.</li>
                        </ul>
                      </div>
                    </div>
                  </Accordion>

                  <Accordion title="Załączniki: Checklisty i Przykłady Zapisu" badge="Załączniki" icon={<Icons.Paperclip />} isOpen={openAccordion === 'kwp7'} onClick={() => setOpenAccordion(openAccordion === 'kwp7' ? null : 'kwp7')}>
                    <h4 className="font-bold text-slate-800 mb-3">Przykłady poprawnych zapisów operacyjnych:</h4>
                    <div className="space-y-3 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <span className="text-rose-500 font-bold">Źle:</span> "W sumie to chyba zrobimy to później."<br/>
                        <span className="text-emerald-600 font-bold">Dobrze:</span> "Ustalono przesunięcie realizacji zadania na późniejszy termin."
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <span className="text-rose-500 font-bold">Źle:</span> "Trzeba to w końcu ogarnąć."<br/>
                        <span className="text-emerald-600 font-bold">Dobrze:</span> "Anna Nowak przygotuje projekt komunikatu do dnia 28 marca 2026 r."
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <span className="text-rose-500 font-bold">Źle:</span> "Większość była za."<br/>
                        <span className="text-emerald-600 font-bold">Dobrze:</span> "Oddano 7 głosów „za”, 1 głos „przeciw” i 2 głosy „wstrzymujące się”."
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-4 rounded-xl">
                        <p className="font-bold text-slate-800 text-xs uppercase mb-2">Checklista PRZED:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>[ ] Mam właściwy wzór?</li>
                          <li>[ ] Znam agendę i prowadzącego?</li>
                          <li>[ ] Mam sprawny sprzęt i baterię?</li>
                        </ul>
                      </div>
                      <div className="border border-slate-200 p-4 rounded-xl">
                        <p className="font-bold text-slate-800 text-xs uppercase mb-2">Checklista PO:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>[ ] Wpisano głosowania i zadania?</li>
                          <li>[ ] Sprawdzono nazwiska i interpunkcję?</li>
                          <li>[ ] Zapisano wg RRRR-MM-DD_...?</li>
                        </ul>
                      </div>
                    </div>
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL LEX */}
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