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
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
};

const CATEGORY_STYLES = {
  'Uchwały':    { icon: '📜', ring: 'ring-red-100',   text: 'text-red-700',   badge: 'bg-red-50 text-red-700 border border-red-100',     accent: 'border-l-red-400' },
  'Zarządzenia':{ icon: '🖊️', ring: 'ring-blue-100',  text: 'text-blue-700',  badge: 'bg-blue-50 text-blue-700 border border-blue-100',   accent: 'border-l-blue-400' },
  'Protokoły':  { icon: '📄', ring: 'ring-amber-100', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border border-amber-100', accent: 'border-l-amber-400' },
  'Instrukcje': { icon: '💡', ring: 'ring-sky-100',   text: 'text-sky-700',   badge: 'bg-sky-50 text-sky-700 border border-sky-100',       accent: 'border-l-sky-400' },
  'Default':    { icon: '⚖️', ring: 'ring-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-600 border border-slate-200', accent: 'border-l-slate-300' }
};

const PETITION_TYPES = [
  { id: 'wydarzenie', label: 'Organizacja wydarzenia', recipientTitle: 'Prorektor ds. Studenckich', recipientName: 'Dr hab. inż. Andrzej Okruszek, prof. UEW' },
  { id: 'rezerwacja_sali', label: 'Rezerwacja sali/pomieszczenia', recipientTitle: 'Prorektor ds. Studenckich', recipientName: 'Dr hab. inż. Andrzej Okruszek, prof. UEW' },
  { id: 'przestrzen', label: 'Rezerwacja przestrzeni na kampusie', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'plakatowanie', label: 'Plakatowanie', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'banerowanie', label: 'Banerowanie', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'grill', label: 'Organizacja grilla / Zaprzęgubie', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'stoisko', label: 'Stoisko promocyjne', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'wjazd', label: 'Wjazd na kampus', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'umeblowanie', label: 'Doposażenie w umeblowanie', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'przedluzenie', label: 'Przedłużenie dostępu do pomieszczeń', recipientTitle: 'Zastępca Kanclerza ds. Technicznych', recipientName: 'Mgr inż. Wiesław Witter' },
  { id: 'zwolnienie', label: 'Zwolnienie z zajęć dydaktycznych', recipientTitle: 'Prorektor ds. Studenckich', recipientName: 'Dr hab. inż. Andrzej Okruszek, prof. UEW' },
];

const PETITION_FIELDS = {
  wydarzenie: [
    { id: 'nazwa_wydarzenia', label: 'Nazwa wydarzenia', type: 'text', placeholder: 'np. TEDxUEW 2026' },
    { id: 'daty', label: 'Data/daty', type: 'text', placeholder: 'np. 15.05.2026' },
    { id: 'miejsce', label: 'Miejsce', type: 'text', placeholder: 'np. Aula B, Budynek J' },
    { id: 'cel', label: 'Opis celu', type: 'textarea', placeholder: 'Cel i charakter wydarzenia...' },
    { id: 'liczba_uczestnikow', label: 'Liczba uczestników', type: 'text', placeholder: 'np. 200' },
    { id: 'koordynator', label: 'Koordynator', type: 'text', placeholder: 'Imię Nazwisko' },
    { id: 'budzet', label: 'Budżet (opcjonalne)', type: 'text', placeholder: 'np. 5000 zł' },
  ],
  rezerwacja_sali: [
    { id: 'sala', label: 'Numer sali i budynek', type: 'text', placeholder: 'np. Sala 104, Budynek B' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. 16:00–20:00' },
    { id: 'cel', label: 'Cel spotkania', type: 'textarea', placeholder: 'Charakter merytoryczny spotkania...' },
    { id: 'osoba_odpowiedzialna', label: 'Osoba odpowiedzialna', type: 'text', placeholder: 'Imię Nazwisko' },
  ],
  przestrzen: [
    { id: 'lokalizacja', label: 'Przestrzeń/lokalizacja', type: 'text', placeholder: 'np. Zaprzęgubie, dziedziniec B' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. 12:00–23:00' },
    { id: 'cel', label: 'Cel', type: 'textarea', placeholder: 'Opis i cel wydarzenia...' },
  ],
  plakatowanie: [
    { id: 'nazwa_inicjatywy', label: 'Nazwa inicjatywy', type: 'text', placeholder: 'np. Bal Absolwentów 2026' },
    { id: 'lokalizacje', label: 'Lokalizacje plakatów', type: 'textarea', placeholder: 'np. tablice B, J, hol główny' },
    { id: 'format_liczba', label: 'Format i liczba plakatów', type: 'text', placeholder: 'np. 15 szt. A3' },
    { id: 'termin', label: 'Termin ekspozycji', type: 'text', placeholder: 'np. 10.05–20.05.2026' },
  ],
  banerowanie: [
    { id: 'nazwa_projektu', label: 'Nazwa projektu', type: 'text', placeholder: 'np. Bal UEW 2026' },
    { id: 'cel', label: 'Cel', type: 'textarea', placeholder: 'Opis celu banerowania...' },
    { id: 'lokalizacja', label: 'Lokalizacja baneru', type: 'text', placeholder: 'np. Główne wejście, budynek B' },
    { id: 'termin', label: 'Termin ekspozycji', type: 'text', placeholder: 'np. 10.05–20.05.2026' },
  ],
  grill: [
    { id: 'nazwa_wydarzenia', label: 'Nazwa wydarzenia', type: 'text', placeholder: 'np. Grill SSUEW 2026' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. 14:00–20:00' },
    { id: 'opis', label: 'Opis działań', type: 'textarea', placeholder: 'Opis planowanych działań...' },
    { id: 'zasilanie', label: 'Czy potrzebne zasilanie?', type: 'text', placeholder: 'np. Tak, 1 gniazdko 230V' },
  ],
  stoisko: [
    { id: 'nazwa_wydarzenia', label: 'Nazwa wydarzenia', type: 'text', placeholder: 'np. Targi Projektów SSUEW' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. 10:00–18:00' },
    { id: 'lokalizacja', label: 'Lokalizacja', type: 'text', placeholder: 'np. Hol główny, Budynek B' },
    { id: 'wyposazenie', label: 'Potrzebne wyposażenie (stoły, krzesła)', type: 'text', placeholder: 'np. 2 stoły, 4 krzesła' },
  ],
  wjazd: [
    { id: 'nr_rejestracyjny', label: 'Nr rejestracyjny', type: 'text', placeholder: 'np. DW 12345' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'wydarzenie_powod', label: 'Wydarzenie/powód', type: 'text', placeholder: 'np. dostawa sprzętu na event' },
    { id: 'budynek', label: 'Budynek docelowy', type: 'text', placeholder: 'np. Budynek B' },
  ],
  umeblowanie: [
    { id: 'nazwa_wydarzenia', label: 'Nazwa wydarzenia', type: 'text', placeholder: 'np. Konferencja SSUEW' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'miejsce', label: 'Miejsce', type: 'text', placeholder: 'np. Aula B' },
    { id: 'liczba_stolow', label: 'Liczba stołów', type: 'text', placeholder: 'np. 5' },
    { id: 'liczba_krzesel', label: 'Liczba krzeseł', type: 'text', placeholder: 'np. 30' },
    { id: 'cel', label: 'Cel użycia', type: 'textarea', placeholder: 'Do czego będą potrzebne meble...' },
  ],
  przedluzenie: [
    { id: 'pomieszczenia', label: 'Numery pomieszczeń i budynek', type: 'text', placeholder: 'np. Pokój 204, Budynek B' },
    { id: 'daty', label: 'Daty', type: 'text', placeholder: 'np. 15.05–20.05.2026' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. do godz. 22:00' },
    { id: 'cel', label: 'Cel', type: 'textarea', placeholder: 'Cel pracy w wydłużonych godzinach...' },
  ],
  zwolnienie: [
    { id: 'wydarzenie', label: 'Nazwa wydarzenia/powód', type: 'text', placeholder: 'np. Konferencja Regionalna SSUEW' },
    { id: 'data', label: 'Data', type: 'text', placeholder: 'dd.mm.rrrr' },
    { id: 'godziny', label: 'Godziny', type: 'text', placeholder: 'np. 8:00–16:00' },
    { id: 'lista_studentow', label: 'Lista studentów (imię nazwisko + nr indeksu)', type: 'textarea', placeholder: 'Jan Kowalski 123456\nAnna Nowak 654321' },
  ],
};


function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const parts = [];
    let remaining = line;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
        parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }
    return <span key={i} className="block">{parts}</span>;
  });
}

export default function DocumentsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Studio — AI petitions
  const [selectedPetitionType, setSelectedPetitionType] = useState('');
  const [petitionFormData, setPetitionFormData] = useState({});
  const [isGeneratingPetition, setIsGeneratingPetition] = useState(false);
  const [applicantData, setApplicantData] = useState({
    imie_nazwisko: '',
    email: '',
    telefon: '',
    funkcja: '',
    nr_indeksu: '',
  });

  // Document summaries — keyed by doc identifier
  const [docSummaries, setDocSummaries] = useState({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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
          const trimmed = item.trim();
          if (!trimmed) return;
          const parts = trimmed.split('|');
          if (parts.length >= 2) {
            parsedAttachments.push({
              name: String(parts[0]).trim(),
              link: String(parts.slice(1).join('|')).trim()
            });
          } else if (trimmed.startsWith('http')) {
            const fileName = trimmed.split('/').pop().split('?')[0] || 'Załącznik';
            parsedAttachments.push({ name: fileName, link: trimmed });
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

  let aiReportData = { target: '-', rigor: '-', rigorColor: 'text-slate-400', readTimeLabel: 'ok. 5–10 min czytania', importance: 'Standardowa', importanceColor: 'text-slate-400', importanceBg: 'bg-slate-700/40 border border-slate-600/40' };
  if (selectedDoc && isAiActive && aiStage === 4) {
    try {
      const text = `${selectedDoc.title || ''} ${selectedDoc.desc || ''}`.toLowerCase();

      aiReportData.target = text.includes('zarząd') || text.includes('wewnętrz') ? "Administracja SSUEW" : (text.includes('koł') || text.includes('organizacj') ? "Organizacje Studenckie" : "Wszyscy Studenci");

      aiReportData.rigor = text.includes('regulamin') || text.includes('uchwała') ? "Bardzo Wysoki" : (text.includes('zarządzenie') ? "Średni" : "Niski");
      aiReportData.rigorColor = aiReportData.rigor === "Bardzo Wysoki" ? "text-rose-500" : (aiReportData.rigor === "Średni" ? "text-amber-400" : "text-emerald-400");

      // Czas czytania — deterministyczny, bez losowości
      const pages = parseInt(selectedDoc.strony || selectedDoc.pages || '', 10);
      const category = String(selectedDoc.category || '');
      const titleLen = String(selectedDoc.title || '').length;
      let readTimeLabel;
      if (!isNaN(pages) && pages > 0) {
        const mins = Math.ceil(pages * 1.5);
        readTimeLabel = `ok. ${mins} min czytania`;
      } else if (category === 'Uchwały') {
        // proxy: krótka nazwa → 3 min, długa → 8 min
        const mins = titleLen < 40 ? 3 : titleLen < 80 ? 5 : 8;
        readTimeLabel = `ok. ${mins} min czytania`;
      } else if (category === 'Zarządzenia') {
        const mins = titleLen < 40 ? 5 : titleLen < 80 ? 10 : 15;
        readTimeLabel = `ok. ${mins} min czytania`;
      } else if (category === 'Regulaminy') {
        const mins = titleLen < 40 ? 10 : titleLen < 80 ? 18 : 25;
        readTimeLabel = `ok. ${mins} min czytania`;
      } else if (category === 'Protokoły' || category === 'Instrukcje') {
        const mins = titleLen < 40 ? 2 : 5;
        readTimeLabel = `ok. ${mins} min czytania`;
      } else {
        readTimeLabel = 'ok. 5–10 min czytania';
      }
      aiReportData.readTimeLabel = readTimeLabel;

      // Ważność na podstawie kategorii z badge kolorem
      const importanceHigh = ['Uchwały', 'Zarządzenia', 'Regulaminy'];
      const importanceMid = ['Protokoły', 'Instrukcje'];
      if (importanceHigh.includes(category)) {
        aiReportData.importance = 'Wysoka';
        aiReportData.importanceColor = 'text-rose-400';
        aiReportData.importanceBg = 'bg-rose-500/20 border border-rose-500/40';
      } else if (importanceMid.includes(category)) {
        aiReportData.importance = 'Średnia';
        aiReportData.importanceColor = 'text-amber-400';
        aiReportData.importanceBg = 'bg-amber-500/20 border border-amber-500/40';
      } else {
        aiReportData.importance = 'Standardowa';
        aiReportData.importanceColor = 'text-slate-400';
        aiReportData.importanceBg = 'bg-slate-700/40 border border-slate-600/40';
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

  const callGeminiAPI = async (prompt, systemPrompt = null) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    if (systemPrompt) {
      body.system_instruction = { parts: [{ text: systemPrompt }] };
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const handleSuggestJustification = async () => {
    if (!selectedPetitionType) return;
    setIsGeneratingPetition(true);
    const petitionType = PETITION_TYPES.find(p => p.id === selectedPetitionType);
    const today = new Date().toLocaleDateString('pl-PL');
    const formSummary = Object.entries(petitionFormData)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const systemPrompt = `Jesteś asystentem Samorządu Studentów UEW (SSUEW) generującym formalne podania. Styl: oficjalny, rzeczowy, bez slangu. Nie używaj słów: 'pragnę nadmienić', 'w związku z powyższym', 'mając na uwadze'.`;

    const prompt = `Zaproponuj profesjonalne uzasadnienie do podania SSUEW.

Typ podania: ${petitionType?.label}
Adresat: ${petitionType?.recipientName}, ${petitionType?.recipientTitle}, UEW
Data: ${today}
Dane:
${formSummary || '[brak danych — zaproponuj ogólne uzasadnienie]'}

Napisz 2–4 zdania uzasadnienia, które:
- Odwołuje się do celów statutowych Samorządu Studentów
- Wskazuje konkretne korzyści dla społeczności studenckiej UEW
- Jest napisane w formalnym, akademickim stylu polskim
- Brzmi autentycznie i przekonująco

Odpowiedz TYLKO samym tekstem uzasadnienia, bez wstępów ani komentarzy.`;

    try {
      const result = await callGeminiAPI(prompt, systemPrompt);
      const fields = PETITION_FIELDS[selectedPetitionType] || [];
      const targetField = fields.find(f => (f.id === 'cel' || f.id === 'opis') && f.type === 'textarea');
      if (targetField) {
        setPetitionFormData(prev => ({ ...prev, [targetField.id]: result.trim() }));
      }
    } catch (e) {
      console.error('Błąd Gemini (uzasadnienie):', e);
    }
    setIsGeneratingPetition(false);
  };

  const handleGenerateAIPetition = async () => {
    const petitionType = PETITION_TYPES.find(p => p.id === selectedPetitionType);
    if (!petitionType) return;

    setIsGeneratingPetition(true);
    const today = new Date().toLocaleDateString('pl-PL');
    const formFields = PETITION_FIELDS[selectedPetitionType] || [];
    const filledFields = formFields.map(f => `${f.label}: ${petitionFormData[f.id] || '[nie podano]'}`).join('\n');

    const systemPrompt = `Jesteś asystentem Samorządu Studentów UEW (SSUEW) generującym formalne podania. Piszesz w imieniu Samorządu Studentów. Styl: oficjalny, rzeczowy, bez slangu, zdania długie ale zrozumiałe. Uzasadnienia muszą być konkretne i merytoryczne — nie ogólnikowe. Nie używaj słów: 'pragnę nadmienić', 'w związku z powyższym', 'mając na uwadze'. Podanie ma wyglądać jak napisane przez doświadczonego działacza samorządowego, nie przez chatbota. Format wyjściowy: czysty tekst podania gotowy do skopiowania, z zachowaniem układu (data, blok danych, adresat, PODANIE, treść, zamknięcie, podpis).`;

    const zwolnieniePersonNote = selectedPetitionType === 'zwolnienie'
      ? `\nOsoba odpowiedzialna: ${applicantData.imie_nazwisko || '[imię nazwisko]'} (nr indeksu: ${applicantData.nr_indeksu || '[numer]'}, tel. ${applicantData.telefon || '[telefon]'}).`
      : '';

    const prompt = `Napisz formalne podanie SSUEW według poniższych danych.

DANE SKŁADAJĄCEGO:
Imię i Nazwisko: ${applicantData.imie_nazwisko || '[nie podano]'}
Email: ${applicantData.email || '[nie podano]'}
Telefon: ${applicantData.telefon || '[nie podano]'}
Funkcja w Samorządzie: ${applicantData.funkcja || '[nie podano]'}
Nr indeksu: ${applicantData.nr_indeksu || '[nie podano]'}

ADRESAT:
${petitionType.recipientName}
${petitionType.recipientTitle}
Uniwersytet Ekonomiczny we Wrocławiu

TYP PODANIA: ${petitionType.label}

SZCZEGÓŁY:
${filledFields}

Zastosuj dokładnie tę strukturę:

                                                    Wrocław, ${today} r.

${applicantData.imie_nazwisko || '[Imię i Nazwisko]'}
${applicantData.email || '[email@samorzad.ue.wroc.pl]'}
${applicantData.telefon || '[numer telefonu]'}

${petitionType.recipientName}
${petitionType.recipientTitle}
Uniwersytet Ekonomiczny we Wrocławiu

PODANIE

W imieniu Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu zwracam się z uprzejmą prośbą o [konkretna prośba wynikająca z danych — rozwiń stosownie do typu podania].

[uzasadnienie — 2–4 akapity, formalne, konkretne, bez slangu]${zwolnieniePersonNote}

Uprzejmie proszę o pozytywne rozpatrzenie niniejszego podania.

Z wyrazami szacunku,

[odręczny podpis, ${today}]

${applicantData.imie_nazwisko || '[Imię i Nazwisko]'}
${applicantData.funkcja || '[funkcja w Samorządzie Studentów UEW]'}`;

    try {
      const result = await callGeminiAPI(prompt, systemPrompt);
      simulateAiTyping(result);
      setEditorText(result);
    } catch (e) {
      setAiOutput('BŁĄD: Nie udało się połączyć z API Gemini. Sprawdź klucz VITE_GEMINI_API_KEY.');
    }
    setIsGeneratingPetition(false);
  };

  const handleGenerateSummary = async (docKey) => {
    if (!selectedDoc) return;
    setIsGeneratingSummary(true);

    const systemPrompt = `Jesteś asystentem Samorządu Studentów UEW (SSUEW). Twoim zadaniem jest streszczenie dokumentów uczelnianych dla członków Samorządu — aktywnych studentów działających w komisjach, którzy potrzebują szybko zrozumieć co dany dokument oznacza dla ich pracy i dla studentów.

Otrzymujesz nazwę dokumentu, kategorię i opis. Na ich podstawie wygeneruj streszczenie w dokładnie 3 sekcjach:

🎯 O czym jest dokument
Jedno-dwa zdania konkretnie opisujące temat. Bez ogólników typu 'dokument reguluje kwestie'. Napisz CO konkretnie reguluje.

👥 Kogo dotyczy
Wymień konkretnie: studentów (jakich — wszystkich, pierwszego roku, niepełnosprawnych?), Samorząd, konkretne komisje, pracowników, organizacje studenckie. Jeśli dotyczy Samorządu bezpośrednio — podkreśl to.

⚡ Co musisz wiedzieć
2-3 najważniejsze punkty które członek Samorządu powinien zapamiętać. Konkretne terminy, kwoty, prawa, obowiązki, procedury. To ma być praktyczna wiedza, nie streszczenie treści.

Pisz po polsku, zwięźle, bez urzędowego języka. Używaj aktywnych zdań.`;

    const prompt = `Tytuł: ${selectedDoc.title || ''}
Kategoria: ${selectedDoc.category || ''}
Opis: ${selectedDoc.desc || selectedDoc.tresc || selectedDoc.opis || 'Brak opisu.'}`;

    try {
      const result = await callGeminiAPI(prompt, systemPrompt);
      // Parsuj 3 sekcje z plain-text odpowiedzi
      const sections = { o_czym: '', kogo: '', co_wiedziec: '' };
      const oCzymMatch = result.match(/🎯[^\n]*\n([\s\S]*?)(?=👥|$)/);
      const kogoMatch = result.match(/👥[^\n]*\n([\s\S]*?)(?=⚡|$)/);
      const coWiedziecMatch = result.match(/⚡[^\n]*\n([\s\S]*?)$/);
      sections.o_czym = oCzymMatch ? oCzymMatch[1].trim() : result.trim();
      sections.kogo = kogoMatch ? kogoMatch[1].trim() : '';
      sections.co_wiedziec = coWiedziecMatch ? coWiedziecMatch[1].trim() : '';
      setDocSummaries(prev => ({ ...prev, [docKey]: sections }));
    } catch (e) {
      setDocSummaries(prev => ({ ...prev, [docKey]: { o_czym: 'Nie udało się wygenerować streszczenia. Spróbuj ponownie.', kogo: '', co_wiedziec: '' } }));
    }
    setIsGeneratingSummary(false);
  };

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
        
        <div className="mb-6 flex flex-wrap gap-6 border-b border-slate-200">
          <button onClick={() => setActiveView('LEX')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all ${activeView === 'LEX' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            📚 Baza Aktów Prawnych
          </button>
          <button onClick={() => setActiveView('STUDIO')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeView === 'STUDIO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icons.Brain /> Studio Legislacyjne (AI)
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
                      <div key={doc.id || Math.random()} onClick={() => openModal(doc)} className={`group relative bg-white p-5 rounded-2xl border border-l-4 transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 md:items-center hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80 ${style.accent} ${isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/80 hover:opacity-100'}`}>
                        <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-xl items-center justify-center text-xl transition-colors ${isActive ? 'bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-slate-100'}`}>
                          {style.icon}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>{doc.category || '-'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{doc.date || '-'}</span>
                            {nowosc && <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">Nowość</span>}
                            {hasAttachments && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-bold uppercase tracking-wider"><Icons.Paperclip /> Zał.</span>}
                          </div>
                          <h3 className={`text-base font-bold transition-colors leading-snug truncate ${isActive ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 line-through'}`}>{doc.title || 'Brak tytułu'}</h3>
                          {!isActive && <p className="text-xs text-red-400 font-medium mt-1">Uchylony</p>}
                        </div>
                        <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 border-slate-100">
                          <span className="text-xs font-mono font-semibold text-slate-400">{doc.signature || '-'}</span>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
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

            {/* LEWA: Formularz */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 flex flex-col h-[900px] overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Icons.Pen /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-none">Generator Podań SSUEW</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Wypełnij formularz i wygeneruj formalne pismo</span>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-4">

                {/* Dane składającego */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Dane składającego</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: 'imie_nazwisko', label: 'Imię i Nazwisko', placeholder: 'Jan Kowalski' },
                      { key: 'email', label: 'Email', placeholder: 'jan.kowalski@samorzad.ue.wroc.pl' },
                      { key: 'telefon', label: 'Telefon', placeholder: '+48 123 456 789' },
                      { key: 'funkcja', label: 'Funkcja w Samorządzie', placeholder: 'np. Przewodniczący Komisji Kultury' },
                      { key: 'nr_indeksu', label: 'Nr indeksu', placeholder: '123456' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{f.label}</label>
                        <input
                          type="text"
                          value={applicantData[f.key] || ''}
                          onChange={(e) => setApplicantData(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typ podania */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Typ podania</label>
                  <select
                    value={selectedPetitionType}
                    onChange={(e) => { setSelectedPetitionType(e.target.value); setPetitionFormData({}); setAiOutput(''); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="">— wybierz typ podania —</option>
                    {PETITION_TYPES.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Pola dynamiczne */}
                {selectedPetitionType && (() => {
                  const pt = PETITION_TYPES.find(p => p.id === selectedPetitionType);
                  return (
                    <>
                      <div className="bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-xs text-blue-800">
                        <span className="font-bold">Adresat: </span>
                        {pt?.recipientName}, {pt?.recipientTitle}, UEW
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Szczegóły podania</label>
                        {(PETITION_FIELDS[selectedPetitionType] || []).map(field => (
                          <div key={field.id}>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{field.label}</label>
                            {field.type === 'textarea' ? (
                              <div>
                                <textarea
                                  value={petitionFormData[field.id] || ''}
                                  onChange={(e) => setPetitionFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  rows={3}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none placeholder:text-slate-400"
                                />
                                {(field.id === 'cel' || field.id === 'opis') && (
                                  <button
                                    onClick={handleSuggestJustification}
                                    disabled={isGeneratingPetition}
                                    className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 hover:text-amber-500 disabled:opacity-50 transition-colors"
                                  >
                                    {isGeneratingPetition ? (
                                      <><span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin"></span> Sugeruję...</>
                                    ) : (
                                      <><Icons.Brain /> Sugeruj uzasadnienie AI</>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={petitionFormData[field.id] || ''}
                                onChange={(e) => setPetitionFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-400"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {!selectedPetitionType && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-slate-500 leading-relaxed">
                    Wybierz typ podania z listy powyżej. Wypełnij formularz, a Gemini AI wygeneruje kompletne, formalne pismo urzędnicze w stylu SSUEW.
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleGenerateAIPetition}
                  disabled={isGeneratingPetition || isDrafting || !selectedPetitionType}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isGeneratingPetition || isDrafting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generuję podanie...</>
                  ) : (
                    <><Icons.Brain /> Generuj podanie</>
                  )}
                </button>
              </div>
            </div>

            {/* PRAWA: Podgląd */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 flex flex-col h-[900px] overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Icons.Document /></div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-none">Podgląd Podania</h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {aiOutput ? (isDrafting ? 'Generowanie...' : 'Gotowe do kopiowania') : 'Wygenerowane podanie pojawi się tutaj'}
                    </span>
                  </div>
                </div>
                {aiOutput && !isDrafting && (
                  <button
                    onClick={() => { try { navigator.clipboard.writeText(aiOutput); showAlert('Skopiowano podanie!'); } catch(e) {} }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
                  >
                    <Icons.Copy /> Kopiuj
                  </button>
                )}
              </div>

              <div className="flex-grow overflow-y-auto p-6" ref={aiOutputRef}>
                {!aiOutput && !isGeneratingPetition ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                      <Icons.Document />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Wypełnij formularz i kliknij<br />"Generuj podanie"</p>
                    <p className="text-slate-300 text-xs mt-2">Gotowe podanie pojawi się tutaj<br />i zostanie skopiowane do edytora</p>
                  </div>
                ) : isGeneratingPetition && !aiOutput ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <span className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></span>
                    <p className="text-slate-400 text-sm font-medium">Gemini generuje podanie...</p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                    {aiOutput}
                    {isDrafting && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>}
                  </div>
                )}
              </div>
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
                        <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-2 gap-3 animate-slideUp">
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Główny Adresat</span><span className="font-bold text-white text-sm">{aiReportData.target}</span></div>
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Poziom Formalizacji</span><span className={`font-bold flex items-center gap-1 text-sm ${aiReportData.rigorColor}`}><Icons.Shield /> {aiReportData.rigor}</span></div>
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Czas Czytania</span><span className="font-bold text-sky-400 flex items-center gap-1 text-sm"><Icons.Timer /> {aiReportData.readTimeLabel}</span></div>
                           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><span className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Ważność Dokumentu</span><span className={`inline-block font-bold text-sm px-2 py-0.5 rounded-md ${aiReportData.importanceColor} ${aiReportData.importanceBg}`}>{aiReportData.importance}</span></div>
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
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Icons.Paperclip /> Powiązane Załączniki <span className="ml-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-black">{safeModalData.attachments.length}</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {safeModalData.attachments.map((att, idx) => (
                        <a key={idx} href={att.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:shadow-sm transition-all group">
                          <div className="shrink-0 w-8 h-8 bg-white rounded-lg border border-orange-100 flex items-center justify-center text-orange-400 group-hover:text-orange-600 transition-colors"><Icons.Document /></div>
                          <span className="font-bold text-sm text-slate-700 group-hover:text-orange-700 transition-colors truncate">{att.name}</span>
                          <Icons.External />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* STRESZCZENIE AI */}
                {(() => {
                  const docKey = selectedDoc?.id || selectedDoc?.signature || selectedDoc?.title || '';
                  const summary = docSummaries[docKey];
                  return (
                    <div className="mb-8">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Icons.Brain /> Streszczenie AI
                      </h3>
                      {summary ? (
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl border-l-4 border-l-blue-500 bg-blue-50">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">🎯 O czym jest dokument</span>
                            <p className="text-slate-700 text-sm font-medium leading-relaxed">{renderMarkdown(summary.o_czym)}</p>
                          </div>
                          {summary.kogo && (
                            <div className="p-4 rounded-xl border-l-4 border-l-indigo-500 bg-indigo-50">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">👥 Kogo dotyczy</span>
                              <p className="text-slate-700 text-sm font-medium leading-relaxed">{renderMarkdown(summary.kogo)}</p>
                            </div>
                          )}
                          {summary.co_wiedziec && (
                            <div className="p-4 rounded-xl border-l-4 border-l-amber-500 bg-amber-50">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">⚡ Co musisz wiedzieć</span>
                              <p className="text-slate-700 text-sm font-medium leading-relaxed">{renderMarkdown(summary.co_wiedziec)}</p>
                            </div>
                          )}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleGenerateSummary(docKey)}
                              disabled={isGeneratingSummary}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all disabled:opacity-50"
                            >
                              {isGeneratingSummary ? (
                                <><span className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></span> Generuję...</>
                              ) : (
                                <>↺ Odśwież</>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                          <p className="text-slate-400 text-sm">Streszczenie jeszcze nie zostało wygenerowane.</p>
                          <button
                            onClick={() => handleGenerateSummary(docKey)}
                            disabled={isGeneratingSummary}
                            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                          >
                            {isGeneratingSummary ? (
                              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generuję...</>
                            ) : (
                              <><Icons.Brain /> Generuj streszczenie</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
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