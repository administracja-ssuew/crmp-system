import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Scale, Users, ClipboardList, Database, AlertTriangle,
  Share2, CheckSquare, Clock, FileText, FilePen, CheckCircle,
  Square, ChevronRight, ArrowUp, Copy, Check, Download,
  Key, BookOpen, Flame, Link as LinkIcon, Edit2, Save, X, Plus, Trash2,
  UserCheck, Lock, Eye, EyeOff,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nb(text) {
  return text.replace(/ (i|w|z|o|a|u|do|we|ze|że|bo|na|po|od|ku|by) /g, ' $1\u00A0');
}

// ─── NAWIGACJA ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'wstep', label: 'Wstęp' },
  {
    id: 'czlonkowie', label: 'Dla Członka Samorządu',
    children: [
      { id: 'formularze',     label: 'Formularze i klauzule' },
      { id: 'przechowywanie', label: 'Przechowywanie danych' },
      { id: 'udostepnianie',  label: 'Udostępnianie danych' },
    ],
  },
  {
    id: 'kompendium', label: 'Kompendium RODO',
    children: [
      { id: 'podstawy',    label: 'Podstawy prawne' },
      { id: 'prawa',       label: 'Prawa osób' },
      { id: 'obowiazki',   label: 'Obowiązki ADO' },
      { id: 'rcpsection',  label: 'Rejestr czynności' },
      { id: 'naruszenia',  label: 'Naruszenia danych' },
      { id: 'powierzenie', label: 'Powierzenie' },
      { id: 'zgody',       label: 'Zgody' },
      { id: 'retencja',    label: 'Retencja danych' },
    ],
  },
  {
    id: 'dokumenty', label: 'Dokumenty',
    children: [
      { id: 'doc-polityka',   label: 'Polityka ODO' },
      { id: 'doc-instrukcja', label: 'Instrukcja IT' },
      { id: 'doc-rcp',        label: 'Rejestr RCP' },
      { id: 'doc-klauzule',   label: 'Klauzule informacyjne' },
    ],
  },
  { id: 'linki', label: 'Linki i akty prawne' },
  {
    id: 'narzedzia', label: 'Narzędzia',
    children: [
      { id: 'generator',  label: 'Generator upoważnień' },
      { id: 'checklista', label: 'Checklista kadencji' },
      { id: 'incydent',   label: 'Rejestr incydentu' },
    ],
  },
];

const ALL_IDS = [
  'wstep',
  'formularze', 'przechowywanie', 'udostepnianie',
  'podstawy', 'prawa', 'obowiazki', 'rcpsection', 'naruszenia', 'powierzenie', 'zgody', 'retencja',
  'doc-polityka', 'doc-instrukcja', 'doc-rcp', 'doc-klauzule',
  'linki',
  'generator', 'checklista', 'incydent',
];

const CHILD_IDS = {
  czlonkowie: ['formularze', 'przechowywanie', 'udostepnianie'],
  kompendium: ['podstawy', 'prawa', 'obowiazki', 'rcpsection', 'naruszenia', 'powierzenie', 'zgody', 'retencja'],
  dokumenty:  ['doc-polityka', 'doc-instrukcja', 'doc-rcp', 'doc-klauzule'],
  narzedzia:  ['generator', 'checklista', 'incydent'],
};

// ─── DANE — RCP ───────────────────────────────────────────────────────────────

const RCP_DEFAULT = [
  { lp:'1',  nazwa:'Ewidencja członków Samorządu',           cel:'Zarządzanie członkostwem',              kategoria:'Imię, nazwisko, email, nr indeksu, funkcja',         podstawa:'art. 6 ust. 1 lit. e', retencja:'Czas kadencji + 5 lat' },
  { lp:'2',  nazwa:'Lista uczestników wydarzeń',             cel:'Organizacja wydarzeń, bezpieczeństwo',  kategoria:'Imię, nazwisko, email, nr indeksu',                  podstawa:'art. 6 ust. 1 lit. a', retencja:'Koniec roku akad. + 1 rok' },
  { lp:'3',  nazwa:'Wnioski studenckie (CRED)',              cel:'Obsługa wniosków administracyjnych',    kategoria:'Imię, nazwisko, email, nr indeksu, treść wniosku',   podstawa:'art. 6 ust. 1 lit. e', retencja:'5 lat (kat. B5)' },
  { lp:'4',  nazwa:'Protokoły posiedzeń',                   cel:'Dokumentacja organów samorządu',        kategoria:'Imię, nazwisko, stanowisko, opinia',                  podstawa:'art. 6 ust. 1 lit. e', retencja:'Wieczyste (kat. A)' },
  { lp:'5',  nazwa:'Rezerwacje sprzętu',                    cel:'Zarządzanie wypożyczalnią',              kategoria:'Imię, nazwisko, email, kontakt',                      podstawa:'art. 6 ust. 1 lit. b', retencja:'1 rok od zwrotu' },
  { lp:'6',  nazwa:'Lista dostępowa do pomieszczeń',        cel:'Bezpieczeństwo, kontrola dostępu',      kategoria:'Imię, nazwisko, nr indeksu, email @samorzad',          podstawa:'art. 6 ust. 1 lit. c/e', retencja:'Dany miesiąc + 1 rok' },
  { lp:'7',  nazwa:'Mailing informacyjny',                  cel:'Komunikacja z członkami',               kategoria:'Email, imię',                                         podstawa:'art. 6 ust. 1 lit. a', retencja:'Do wycofania zgody' },
  { lp:'8',  nazwa:'Materiały fotograficzne i wideo',       cel:'Promocja, dokumentacja działalności',   kategoria:'Wizerunek',                                           podstawa:'art. 6 ust. 1 lit. a', retencja:'Do wycofania zgody' },
  { lp:'9',  nazwa:'Wnioski o dostęp do CRA',               cel:'Zarządzanie dostępem do systemu',       kategoria:'Imię, nazwisko, email uczelniany',                    podstawa:'art. 6 ust. 1 lit. e', retencja:'1 rok' },
  { lp:'10', nazwa:'Faktury i dokumenty finansowe',         cel:'Rozliczenia, rachunkowość',              kategoria:'Imię, nazwisko, adres, NIP (os. fizyczne)',           podstawa:'art. 6 ust. 1 lit. c', retencja:'5 lat od końca roku podat.' },
  { lp:'11', nazwa:'Umowy wolontariackie',                  cel:'Formalizacja współpracy wolontariuszy', kategoria:'Imię, nazwisko, PESEL, adres, podpis',                podstawa:'art. 6 ust. 1 lit. b', retencja:'10 lat (kat. B10)' },
  { lp:'12', nazwa:'Rejestr naruszeń ochrony danych',       cel:'Dokumentacja incydentów RODO',          kategoria:'Dane identyfikacyjne osób dotkniętych naruszeniem',   podstawa:'art. 6 ust. 1 lit. c', retencja:'3 lata' },
  { lp:'13', nazwa:'Korespondencja z UODO',                 cel:'Obsługa kontroli i postępowań',         kategoria:'Dane zawarte w pismach',                              podstawa:'art. 6 ust. 1 lit. c', retencja:'10 lat' },
];

const RCP_COLS = ['lp', 'nazwa', 'cel', 'kategoria', 'podstawa', 'retencja'];
const RCP_LABELS = { lp: 'Lp.', nazwa: 'Czynność', cel: 'Cel', kategoria: 'Kategorie danych', podstawa: 'Podstawa prawna', retencja: 'Retencja' };
const RCP_DOC = doc(db, 'rodo', 'rcp_data');

// ─── DANE — CHECKLISTA KADENCJI ───────────────────────────────────────────────

const CHECKLIST_KEY = 'ssuew_rodo_checklist_v2';
const CHECKLIST_ITEMS = [
  { id:'c1',  text:'Przekazano dostępy do systemów (CRA, Google Drive, poczta samorządowa)' },
  { id:'c2',  text:'Zmieniono hasła po przekazaniu — wszystkie konta samorządowe' },
  { id:'c3',  text:'Odebrano sprzęt samorządowy (laptopy, dyski, nośniki z danymi)' },
  { id:'c4',  text:'Przekazana dokumentacja papierowa zawierająca dane osobowe' },
  { id:'c5',  text:'Usunięte dane z urządzeń prywatnych ustępujących członków' },
  { id:'c6',  text:'Zaktualizowano Rejestr Czynności Przetwarzania — nowe osoby upoważnione' },
  { id:'c7',  text:'Podpisano nowe upoważnienia do przetwarzania danych przez nowy skład' },
  { id:'c8',  text:'Poinformowano dostawców usług o zmianie osób kontaktowych' },
  { id:'c9',  text:'Przeprowadzono szkolenie RODO dla nowego składu samorządu' },
  { id:'c10', text:'Sporządzono protokół przekazania dokumentacji i uprawnień' },
];

// ─── DANE — FORMULARZ INCYDENTU ───────────────────────────────────────────────

const INCIDENT_STEPS = [
  { label: 'Co się stało?',   fields: ['Opis zdarzenia', 'Data i godzina wykrycia', 'Kto wykrył naruszenie?'] },
  { label: 'Zakres danych',   fields: ['Rodzaj danych (imiona, emaile, nr ind. itd.)', 'Szacunkowa liczba osób', 'Szacunkowa liczba rekordów'] },
  { label: 'Przyczyna',       fields: ['Prawdopodobna przyczyna naruszenia', 'Czy naruszenie jest ciągłe?'] },
  { label: 'Skutki',          fields: ['Możliwe skutki dla osób, których dane dotyczą', 'Czy istnieje ryzyko dla praw i wolności?'] },
  { label: 'Działania',       fields: ['Podjęte działania naprawcze', 'Planowane działania zapobiegawcze'] },
  { label: 'Powiadomienia',   fields: ['Czy zgłoszono do UODO (72h)?', 'Czy poinformowano osoby?', 'Data i sposób zgłoszenia'] },
  { label: 'Podsumowanie',    fields: [] },
];

// ─── DANE — LINKI ─────────────────────────────────────────────────────────────

const LINKI = [
  {
    group: 'Akty prawne UE',
    color: 'blue',
    items: [
      { title: 'Rozporządzenie RODO (UE) 2016/679 — tekst pełny PL', desc: 'Oficjalny tekst Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 w języku polskim w serwisie EUR-Lex.', url: 'https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX%3A32016R0679', badge: 'EUR-Lex' },
      { title: 'Art. 13 RODO — Obowiązek informacyjny (klauzula)', desc: 'Bezpośrednie odwołanie do art. 13 — podstawa prawna klauzul informacyjnych stosowanych przy zbieraniu danych.', url: 'https://eur-lex.europa.eu/legal-content/PL/TXT/HTML/?uri=CELEX:32016R0679#d1e2061-1-1', badge: 'Art. 13' },
    ],
  },
  {
    group: 'Urząd Ochrony Danych Osobowych (UODO)',
    color: 'rose',
    items: [
      { title: 'Strona główna UODO', desc: 'Oficjalny organ nadzorczy — informacje, poradniki, formularze zgłoszenia naruszenia, wzory klauzul i wyjaśnienia dla podmiotów przetwarzających.', url: 'https://uodo.gov.pl', badge: 'uodo.gov.pl' },
      { title: 'Poradniki i wskazówki UODO', desc: 'Sekcja poradnikowa dla podmiotów — m.in. wytyczne dot. zgód, klauzul informacyjnych i praw osób. Rekomendowane jako uzupełnienie tego Hubu.', url: 'https://uodo.gov.pl/pl/83', badge: 'Poradniki' },
      { title: 'Formularz zgłoszenia naruszenia do UODO', desc: 'Oficjalny formularz zgłoszenia naruszenia ochrony danych osobowych. Obowiązkowe przy naruszeniach wysokiego ryzyka — termin 72 godziny od wykrycia.', url: 'https://uodo.gov.pl/pl/134/233', badge: 'Zgłoszenie' },
    ],
  },
  {
    group: 'Dokumenty wewnętrzne SSUEW',
    color: 'slate',
    items: [
      { title: 'Regulamin Samorządu Studentów UEW', desc: 'Dokument ustrojowy SSUEW — kontekst konieczny przy interpretacji zakresu działalności i odpowiedzialności administratora.', url: 'https://drive.google.com/file/d/1KZwp_jrbmuF2Wwxw4OMkYpfrKlczTL6h/view?usp=sharing', badge: 'Drive' },
    ],
  },
];

// ─── DANE — KLAUZULE ──────────────────────────────────────────────────────────

const KLAUZULE = [
  {
    id: 'ogolna',
    tytul: 'Klauzula ogólna — formularz / rejestracja',
    tresc: `Zgodnie z art. 13 RODO informuję, że:
1. Administratorem Pani/Pana danych jest Samorząd Studentów UEW, ul. Komandorska 118/120, 53-345 Wrocław.
2. Dane przetwarzane są w celu [CEL] na podstawie art. 6 ust. 1 lit. [LITERA] RODO.
3. Dane będą przechowywane przez [OKRES].
4. Odbiorcami danych mogą być dostawcy usług IT na podstawie umów powierzenia.
5. Przysługuje Pani/Panu prawo: dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia, sprzeciwu i cofnięcia zgody.
6. Przysługuje Pani/Panu prawo skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa).
7. Podanie danych jest [dobrowolne / obowiązkowe — uzupełnić].`,
  },
  {
    id: 'wizerunek',
    tytul: 'Klauzula wizerunkowa — zgoda na zdjęcia / wideo',
    tresc: `Zgodnie z art. 13 RODO informuję, że:
1. Administratorem Pani/Pana danych jest Samorząd Studentów UEW, ul. Komandorska 118/120, 53-345 Wrocław.
2. Podstawą przetwarzania wizerunku jest art. 6 ust. 1 lit. a RODO — dobrowolna zgoda.
3. Celem jest dokumentacja działalności i promocja SSUEW w materiałach: [strona www / media społecznościowe / materiały drukowane].
4. Dane przetwarzane są do momentu wycofania zgody.
5. Przysługuje Pani/Panu prawo cofnięcia zgody w dowolnym momencie. Kontakt: rodo@samorzad.ue.wroc.pl
6. Przysługuje Pani/Panu prawo skargi do Prezesa UODO.
7. Podanie danych jest dobrowolne. Odmowa nie skutkuje żadnymi negatywnymi konsekwencjami.`,
  },
];

// ─── KOMPONENT: klauzula — musi być osobnym komponentem (nie inline w .map())
//     Powód: useState jest używany w środku, a Hooks nie mogą być w pętlach/mapach

function KlauzulaCard({ tytul, tresc }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(tresc).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="font-black text-slate-800 text-sm">{tytul}</p>
        <button onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all border border-slate-200">
          {copied ? <><Check className="w-3 h-3 text-green-600" />Skopiowano</> : <><Copy className="w-3 h-3" />Kopiuj</>}
        </button>
      </div>
      <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 border border-slate-100 rounded-xl p-4">{tresc}</pre>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function RodoPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [activeSection, setActiveSection]     = useState('wstep');
  const [showScrollTop, setShowScrollTop]     = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [openGroups, setOpenGroups]           = useState({ czlonkowie: true, kompendium: false, dokumenty: false, narzedzia: false });

  // RCP
  const [rcpData, setRcpData]       = useState(RCP_DEFAULT);
  const [rcpLoading, setRcpLoading] = useState(false);
  const [rcpEditing, setRcpEditing] = useState(null);   // id lp of row being edited
  const [rcpDraft, setRcpDraft]     = useState({});     // draft values for edited row
  const [rcpSaving, setRcpSaving]   = useState(false);
  const [rcpNewRow, setRcpNewRow]   = useState(false);
  const [rcpNewDraft, setRcpNewDraft] = useState({ lp:'', nazwa:'', cel:'', kategoria:'', podstawa:'', retencja:'' });

  // checklista
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CHECKLIST_KEY) || '[]'); } catch { return []; }
  });

  // generator — pojedynczy useState, nie w pętli
  const [genForm, setGenForm] = useState({
    imieNazwisko:'', funkcja:'', dataDo:'',
    dostepCRA: false, dostepDrive: false, dostepPoczta: false,
    dostepFizyczny: false, dostepArchiwum: false,
    uwagi: '',
  });

  // incydent
  const [incStep, setIncStep]       = useState(0);
  const [incAnswers, setIncAnswers] = useState({});
  const [incDone, setIncDone]       = useState(false);

  // ─── RCP FIRESTORE ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAdmin) return;
    setRcpLoading(true);
    getDoc(RCP_DOC).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.rows) && data.rows.length > 0) setRcpData(data.rows);
      }
    }).catch(() => {}).finally(() => setRcpLoading(false));
  }, [isAdmin]);

  const saveRcp = async (newRows) => {
    setRcpSaving(true);
    try { await setDoc(RCP_DOC, { rows: newRows, updatedAt: new Date().toISOString() }); setRcpData(newRows); }
    catch (e) { alert('Błąd zapisu. Sprawdź połączenie.'); }
    finally { setRcpSaving(false); }
  };

  const startEdit = (row) => { setRcpEditing(row.lp); setRcpDraft({ ...row }); };
  const cancelEdit = () => { setRcpEditing(null); setRcpDraft({}); };
  const commitEdit = () => {
    const updated = rcpData.map(r => r.lp === rcpEditing ? { ...rcpDraft } : r);
    saveRcp(updated).then(() => { setRcpEditing(null); setRcpDraft({}); });
  };
  const deleteRow = (lp) => {
    if (!window.confirm('Usunąć ten wpis z RCP?')) return;
    const updated = rcpData.filter(r => r.lp !== lp).map((r, i) => ({ ...r, lp: String(i + 1) }));
    saveRcp(updated);
  };
  const addRow = () => {
    const lp = String(rcpData.length + 1);
    const updated = [...rcpData, { ...rcpNewDraft, lp }];
    saveRcp(updated).then(() => { setRcpNewRow(false); setRcpNewDraft({ lp:'', nazwa:'', cel:'', kategoria:'', podstawa:'', retencja:'' }); });
  };

  // ─── SCROLL ──────────────────────────────────────────────────────────────────

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    ALL_IDS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const dh  = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(dh > 0 ? Math.round((top / dh) * 100) : 0);
      setShowScrollTop(top > 300);
      if (dh > 0 && top >= dh - 150) setActiveSection('incydent');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback(id => {
    for (const [grp, children] of Object.entries(CHILD_IDS)) {
      if (children.includes(id)) setOpenGroups(prev => ({ ...prev, [grp]: true }));
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ─── SIDEBAR ─────────────────────────────────────────────────────────────────

  const isActive = id => {
    if (activeSection === id) return true;
    for (const [grp, children] of Object.entries(CHILD_IDS)) {
      if (id === grp && children.includes(activeSection)) return true;
    }
    return false;
  };

  const allOpts = NAV.flatMap(item =>
    item.children
      ? [{ id: item.id, label: item.label }, ...item.children.map(c => ({ id: c.id, label: '  ' + c.label }))]
      : [{ id: item.id, label: item.label }]
  );

  // ─── CHECKLISTA ───────────────────────────────────────────────────────────────

  const toggleCheck = id => {
    const next = checks.includes(id) ? checks.filter(x => x !== id) : [...checks, id];
    setChecks(next);
    sessionStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  };
  const resetChecks = () => { if (window.confirm('Zresetować postęp checklisty?')) { setChecks([]); sessionStorage.removeItem(CHECKLIST_KEY); } };

  // ─── GENERATOR PDF ───────────────────────────────────────────────────────────

  const generateUpowaznienie = () => {
    const pdf  = new jsPDF();
    const today = new Date().toLocaleDateString('pl-PL');
    const m = 20; let y = 20;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(13);
    pdf.text('UPOWAŻNIENIE DO PRZETWARZANIA DANYCH OSOBOWYCH', 105, y, { align:'center' }); y += 7;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
    pdf.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 105, y, { align:'center' }); y += 14;
    pdf.setFontSize(10); pdf.text(`Wrocław, dnia ${today}`, m, y); y += 10;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
    pdf.text(`UPOWAŻNIENIE NR ___/RODO/${new Date().getFullYear()}`, m, y); y += 10;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
    ['Na podstawie art. 29 Rozporządzenia (UE) 2016/679 (RODO) upoważnia się:','',
     `Imię i nazwisko: ${genForm.imieNazwisko}`,`Funkcja: ${genForm.funkcja}`,'',
     'do przetwarzania danych osobowych w zakresie niezbędnym do pełnienia',
     'powierzonej funkcji w Samorządzie Studentów UEW, w szczególności:',
    ].forEach(l => { pdf.text(l, m, y); y += 6; }); y += 2;
    [genForm.dostepCRA && '- dostęp do systemu CRA', genForm.dostepDrive && '- dostęp do Google Drive SSUEW',
     genForm.dostepPoczta && '- dostęp do poczty samorządowej', genForm.dostepFizyczny && '- dostęp do dokumentacji fizycznej',
     genForm.dostepArchiwum && '- dostęp do archiwum dokumentów',
    ].filter(Boolean).forEach(l => { pdf.text(l, m + 4, y); y += 6; }); y += 4;
    [`Upoważnienie obowiązuje do: ${genForm.dataDo || '_______________'}`,'',
     genForm.uwagi ? `Uwagi: ${genForm.uwagi}` : null,'',
     'Osoba upoważniona zobowiązuje się do zachowania przetwarzanych danych','w ścisłej tajemnicy.','','',
     '..................................          ..................................',
     'Zarząd SSUEW (podpis i pieczęć)          Osoba upoważniona (podpis)',
    ].filter(l => l !== null).forEach(l => { pdf.text(l, m, y); y += 6; });
    pdf.save(`upowaznienie_${genForm.imieNazwisko.replace(/\s+/g,'_') || 'rodo'}.pdf`);
  };

  // ─── INCYDENT PDF ─────────────────────────────────────────────────────────────

  const generateIncydentPDF = () => {
    const pdf = new jsPDF(); const today = new Date().toLocaleString('pl-PL');
    let y = 20; const m = 20; const pw = 170;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(12);
    pdf.text('REJESTR NARUSZEŃ OCHRONY DANYCH OSOBOWYCH', 105, y, { align:'center' }); y += 7;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
    pdf.text('Samorząd Studentów UEW', 105, y, { align:'center' }); y += 5;
    pdf.text(`Sporządzono: ${today}`, 105, y, { align:'center' }); y += 12;
    INCIDENT_STEPS.slice(0,-1).forEach((s,si) => {
      pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
      pdf.text(`${si+1}. ${s.label}`, m, y); y += 6;
      pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
      s.fields.forEach(f => {
        pdf.text(`${f}:`, m+4, y); y += 5;
        const val = incAnswers[`${si}_${f}`] || '—';
        pdf.splitTextToSize(val, pw-10).forEach(l => { pdf.text(l, m+8, y); y += 5; });
        y += 2; if (y > 270) { pdf.addPage(); y = 20; }
      }); y += 3;
    });
    y += 5; pdf.setFontSize(9);
    pdf.text('Podpis sporządzającego: ..............................', m, y); y += 7;
    pdf.text('Podpis osoby odpow. za RODO: ..............................', m, y);
    pdf.save(`incydent_rodo_${new Date().toISOString().slice(0,10)}.pdf`);
    setIncDone(true);
  };

  // ─── SUB-KOMPONENTY ───────────────────────────────────────────────────────────

  const SectionTitle = ({ icon: Icon, chapter, title, color = 'rose' }) => {
    const palette = {
      rose:   ['bg-rose-100',   'text-rose-600',   'text-rose-500'],
      amber:  ['bg-amber-100',  'text-amber-600',  'text-amber-500'],
      blue:   ['bg-blue-100',   'text-blue-600',   'text-blue-500'],
      teal:   ['bg-teal-100',   'text-teal-600',   'text-teal-500'],
      red:    ['bg-red-100',    'text-red-600',     'text-red-500'],
      purple: ['bg-purple-100', 'text-purple-600', 'text-purple-500'],
      slate:  ['bg-slate-100',  'text-slate-600',  'text-slate-500'],
      green:  ['bg-green-100',  'text-green-600',  'text-green-500'],
      indigo: ['bg-indigo-100', 'text-indigo-600', 'text-indigo-500'],
    };
    const [bg, ic, lbl] = palette[color] || palette.rose;
    return (
      <div className="flex items-center gap-3 mb-6">
        {Icon && <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${ic}`} /></div>}
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${lbl} mb-0.5`}>{chapter}</p>
          <h2 className="text-2xl font-black text-slate-800">{title}</h2>
        </div>
      </div>
    );
  };

  const InfoBox = ({ children, color = 'rose' }) => {
    const map = { rose:'bg-rose-50 border-rose-200 text-rose-900', amber:'bg-amber-50 border-amber-200 text-amber-900', blue:'bg-blue-50 border-blue-200 text-blue-900', green:'bg-green-50 border-green-200 text-green-900', red:'bg-red-50 border-red-200 text-red-900', slate:'bg-slate-50 border-slate-200 text-slate-700' };
    return <div className={`rounded-xl border p-4 text-sm font-medium leading-relaxed ${map[color] || map.rose}`}>{children}</div>;
  };

  const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>{children}</div>
  );

  const Rule = ({ n, children }) => (
    <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
      <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-slate-700 leading-relaxed font-medium">{children}</p>
    </div>
  );

  const progress = Math.round((checks.length / CHECKLIST_ITEMS.length) * 100);
  const allDone  = checks.length === CHECKLIST_ITEMS.length;

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* PASEK CZYTANIA */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-100">
        <div className="h-0.5 bg-rose-600 transition-all duration-75" style={{ width: `${readingProgress}%` }} />
      </div>

      {/* MOBILE: STICKY SELECT */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5">
        <select value={activeSection} onChange={e => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400">
          {allOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white pt-20 pb-32">
          <div className="px-4 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Hub RODO SSUEW</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {NAV.map(item => {
              if (!item.children) return (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isActive(item.id) ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                  {item.label}
                </button>
              );
              const groupOpen   = openGroups[item.id];
              const groupActive = isActive(item.id);
              return (
                <div key={item.id}>
                  <button
                    onClick={e => { setOpenGroups(prev => ({ ...prev, [item.id]: !prev[item.id] })); e.currentTarget.blur(); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${groupActive ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                    <span>{item.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${groupOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {groupOpen && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-rose-100 pl-3">
                      {item.children.map(c => (
                        <button key={c.id} onClick={() => scrollTo(c.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSection === c.id ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* TREŚĆ */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-32 [&_p]:leading-relaxed [&_p]:text-pretty">

          {/* ══════════════════════════════════════════════════════════ WSTĘP */}
          <section id="wstep" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Shield} chapter="Wprowadzenie" title="Hub RODO — ochrona danych w SSUEW" color="rose" />
            <Card className="mb-5 space-y-4">
              <p className="text-slate-700">{nb('Każda kadencja Samorządu Studentów przetwarza dane osobowe: listuje uczestników, podpisuje umowy, organizuje szkolenia. RODO nie jest biurokratycznym wymogiem — to zestaw reguł, które chronią studentów, wolontariuszy i członków samorządu przed nadużyciami.')}</p>
              <p className="text-slate-700">{nb('Ten Hub zawiera kompendium wiedzy, gotowe dokumenty, linki do aktów prawnych oraz interaktywne narzędzia dla każdego Członka Samorządu — niezależnie od funkcji.')}</p>
            </Card>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { ic: UserCheck, col:'bg-emerald-50 border-emerald-200', ic2:'text-emerald-600', t:'Dla każdego', d:'Praktyczne wskazówki dot. formularzy, klauzul i codziennego postępowania z danymi.' },
                { ic: BookOpen,  col:'bg-rose-50 border-rose-200',    ic2:'text-rose-600',   t:'Kompendium', d:'8 tematów RODO — podstawy, prawa, obowiązki, naruszenia, zgody i retencja.' },
                { ic: Key,       col:'bg-indigo-50 border-indigo-200', ic2:'text-indigo-600', t:'Narzędzia',  d:'Generator upoważnień PDF, checklista kadencji i kreator zgłoszenia incydentu.' },
              ].map(({ ic: Icon, col, ic2, t, d }) => (
                <div key={t} className={`flex items-start gap-3 p-4 rounded-2xl border ${col}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ic2}`} />
                  <div><p className="font-black text-slate-800 text-sm mb-1">{t}</p><p className="text-xs leading-relaxed text-slate-600">{d}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════ DLA CZŁONKA SAMORZĄDU */}

          <section id="formularze" className="scroll-mt-20 mb-14">
            <SectionTitle icon={UserCheck} chapter="Dla Członka Samorządu — 1" title="Formularze i klauzule informacyjne" color="green" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Każdy formularz zbierający dane osobowe (zapisy na wydarzenie, ankieta, lista uczestników, rejestracja) musi zawierać klauzulę informacyjną. Bez niej zbieranie danych jest niezgodne z RODO.')}</p>
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Obowiązkowe elementy każdego formularza z danymi</p>
                {[
                  ['Klauzula informacyjna', 'Widoczna przed lub w formularzu — nie gdzieś na dole drobnym drukiem. Wzory w sekcji Dokumenty.'],
                  ['Pole checkbox z wymaganą zgodą', 'Treść: „Zapoznałem/am się z Klauzulą Informacyjną i wyrażam zgodę na przetwarzanie moich danych osobowych w celu [cel]." Pole musi być obowiązkowe (required).'],
                  ['Zbieraj tylko to, co niezbędne', 'Jeśli do wysłania materiałów wystarczy email — nie zbieraj nr indeksu, adresu, daty urodzenia. Zasada minimalizacji danych.'],
                  ['Poinformuj o celu i czasie', 'Uczestnik musi wiedzieć, po co zbierasz dane i jak długo będą przechowywane.'],
                ].map(([tytul, opis], i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tytul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="amber">{nb('Jeśli używasz Google Forms — wstaw klauzulę jako sekcję na początku formularza i dodaj obowiązkowe pytanie z checkboxem. Wzór klauzuli do wklejenia znajdziesz w sekcji Dokumenty → Klauzule informacyjne.')}</InfoBox>
          </section>

          <section id="przechowywanie" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Lock} chapter="Dla Członka Samorządu — 2" title="Przechowywanie danych" color="indigo" />
            <Card className="space-y-2 mb-4">
              {[
                ['Dane na urządzeniach prywatnych', 'Danych osobowych (list uczestników, danych kontaktowych) nie przechowuje się na prywatnych urządzeniach bez szyfrowania. Bezpieczna alternatywa: Google Drive Samorządu lub CRA.'],
                ['Pendrive i nośniki zewnętrzne', 'Jeśli przenosisz dane na nośniku — zaszyfruj go lub stosuj dostęp hasłem. Po zakończeniu projektu — skasuj dane z nośnika.'],
                ['Foldery Google Drive', 'Upewnij się, że foldery z danymi osobowymi mają ograniczony dostęp — tylko dla osób, które faktycznie z nich korzystają.'],
                ['Poczta email', 'Nie wysyłaj list z danymi osobowymi na prywatne skrzynki. Używaj kont @samorzad.ue.wroc.pl lub działowych adresów SSUEW.'],
                ['Papierowe dokumenty', 'Przechowywane w zamkniętej szafce lub pomieszczeniu. Po upływie okresu retencji — niszczarka (min. P-4). Nie wyrzucaj do kosza niezniszczonych dokumentów.'],
                ['Czas przechowywania', 'Po zakończeniu celu (np. po evencie) — usuń listę uczestników lub zanonimizuj dane. Nie przechowuj danych „na wszelki wypadek".'],
              ].map(([tytul, opis], i) => (
                <div key={i} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full shrink-0 mt-2" />
                  <div><p className="font-bold text-slate-800 text-sm">{tytul}</p><p className="text-xs text-slate-600 mt-0.5">{nb(opis)}</p></div>
                </div>
              ))}
            </Card>
          </section>

          <section id="udostepnianie" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Eye} chapter="Dla Członka Samorządu — 3" title="Udostępnianie danych osobom trzecim" color="amber" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Danych osobowych nie udostępnia się podmiotom zewnętrznym bez podstawy prawnej i bez informowania osób, których dane dotyczą.')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-black text-green-800 text-sm mb-2">Można udostępnić</p>
                  <ul className="space-y-1.5">
                    {['Innym komórkom SSUEW, jeśli to ten sam cel','Uczelni (UEW), gdy wynika to z obowiązku prawnego','Firmie obsługującej event — na podstawie umowy powierzenia','Organom publicznym (np. UODO) na ich żądanie'].map((t,i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-green-800"><Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600" />{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="font-black text-red-800 text-sm mb-2">Nie wolno udostępniać</p>
                  <ul className="space-y-1.5">
                    {['Sponsorom lub partnerom bez zgody uczestników','Organizacjom zewnętrznym w celach promocyjnych','Prasie studenckiej bez zgody osób','Na prywatny użytek, nawet jeśli jesteś organizatorem'].map((t,i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-800"><X className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            <InfoBox color="slate">{nb('Jeśli ktoś prosi o listę uczestników, bazę mailową lub inne dane — skieruj sprawę do osoby odpowiedzialnej za RODO w Samorządzie, zanim cokolwiek wyślesz.')}</InfoBox>
          </section>

          {/* ══════════════════════════════════ KOMPENDIUM */}

          <section id="podstawy" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Scale} chapter="Kompendium — 1" title="Podstawy prawne przetwarzania danych" color="rose" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Przetwarzanie danych osobowych jest dopuszczalne wyłącznie wtedy, gdy spełniona jest co najmniej jedna z przesłanek art. 6 RODO. Bez wyraźnej podstawy prawnej — przetwarzanie jest niedopuszczalne.')}</p>
              <div className="space-y-2">
                {[
                  ['lit. a', 'Zgoda osoby, której dane dotyczą',              'Zgoda na wizerunek w materiałach promocyjnych'],
                  ['lit. b', 'Wykonanie umowy lub działania przed jej zawarciem','Rejestracja na szkolenie wymagające umowy'],
                  ['lit. c', 'Wypełnienie obowiązku prawnego',                 'Archiwizacja protokołów posiedzeń'],
                  ['lit. e', 'Wykonanie zadania w interesie publicznym',       'Obsługa wniosków studenckich, działalność samorządowa'],
                ].map(([kod, tytul, przyklad]) => (
                  <div key={kod} className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="font-mono text-xs font-black text-rose-600 bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg shrink-0 mt-0.5">art. 6 {kod}</span>
                    <div><p className="font-bold text-slate-800 text-sm">{tytul}</p><p className="text-xs text-slate-500 mt-0.5">{przyklad}</p></div>
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="amber">{nb('Dla danych szczególnych kategorii (zdrowie, poglądy, religia — art. 9 RODO) wymagana jest odrębna przesłanka z art. 9 ust. 2. Przed każdym nowym procesem zidentyfikuj właściwą przesłankę i wpisz ją do RCP.')}</InfoBox>
          </section>

          <section id="prawa" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Users} chapter="Kompendium — 2" title="Prawa osób, których dane dotyczą" color="blue" />
            <p className="text-slate-600 text-sm mb-5">{nb('RODO przyznaje każdej osobie fizycznej katalog praw. Odpowiedź na żądanie należy udzielić w ciągu jednego miesiąca od jego otrzymania.')}</p>
            <div className="space-y-3">
              {[
                ['art. 15','Dostęp','Osoba może żądać informacji o tym, jakie jej dane są przetwarzane, w jakim celu, jak długo i komu są udostępniane.'],
                ['art. 16','Sprostowanie','Osoba może żądać poprawienia błędnych lub uzupełnienia niekompletnych danych.'],
                ['art. 17','Usunięcie','Prawo do bycia zapomnianym — gdy dane nie są już potrzebne, zgoda wycofana lub przetwarzanie było bezprawne.'],
                ['art. 18','Ograniczenie','Osoba może żądać, by dane były przechowywane bez dalszego przetwarzania np. na czas rozpatrzenia sprzeciwu.'],
                ['art. 20','Przenoszenie','Dotyczy danych przetwarzanych automatycznie na podstawie zgody — osoba może żądać ich w ustrukturyzowanym formacie.'],
                ['art. 21','Sprzeciw','Osoba może wnieść sprzeciw wobec przetwarzania opartego na interesie publicznym lub prawnie uzasadnionym interesie ADO.'],
              ].map(([art, tytul, opis]) => (
                <div key={art} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg shrink-0 mt-0.5 whitespace-nowrap">{art}</span>
                  <div><p className="font-bold text-slate-800 text-sm mb-1">Prawo do {tytul.toLowerCase()}</p><p className="text-sm text-slate-600">{opis}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section id="obowiazki" className="scroll-mt-20 mb-14">
            <SectionTitle icon={ClipboardList} chapter="Kompendium — 3" title="Obowiązki administratora danych" color="indigo" />
            <p className="text-slate-600 text-sm mb-5">{nb('Art. 5 RODO określa siedem zasad — ich przestrzeganie musi być wykazalne (zasada rozliczalności).')}</p>
            <div className="space-y-2">
              {[
                ['Zgodność z prawem, rzetelność i przejrzystość','Dane muszą być przetwarzane na podstawie jasnej przesłanki, a osoby muszą być o tym poinformowane.'],
                ['Ograniczenie celu','Dane zbierane w określonym celu nie mogą być przetwarzane w sposób niezgodny z tym celem.'],
                ['Minimalizacja danych','Zbierane są wyłącznie dane adekwatne, stosowne i ograniczone do tego, co niezbędne.'],
                ['Prawidłowość','Dane muszą być aktualne; nieprawidłowe dane należy niezwłocznie usunąć lub sprostować.'],
                ['Ograniczenie przechowywania','Dane przechowywane są przez czas nie dłuższy niż niezbędny do realizacji celu.'],
                ['Integralność i poufność','Dane muszą być chronione przed nieuprawnionym dostępem, utratą i zniszczeniem.'],
                ['Rozliczalność','Administrator musi być w stanie wykazać przestrzeganie wszystkich powyższych zasad.'],
              ].map(([tytul, opis], i) => (
                <Rule key={i} n={i+1}><strong>{tytul}</strong> — {opis}</Rule>
              ))}
            </div>
          </section>

          <section id="rcpsection" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Database} chapter="Kompendium — 4" title="Rejestr Czynności Przetwarzania" color="teal" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Rejestr Czynności Przetwarzania (RCP) to obowiązkowy dokument wewnętrzny (art. 30 RODO) prowadzony w formie pisemnej lub elektronicznej. Musi być dostępny na żądanie Prezesa UODO.')}</p>
            </Card>
            <InfoBox color="blue">{nb('Pełny, edytowalny Rejestr RCP dostępny jest w sekcji Dokumenty → Rejestr RCP. Administratorzy mogą edytować wpisy bezpośrednio w tabeli.')}</InfoBox>
          </section>

          <section id="naruszenia" className="scroll-mt-20 mb-14">
            <SectionTitle icon={AlertTriangle} chapter="Kompendium — 5" title="Naruszenia ochrony danych osobowych" color="red" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Naruszenie (art. 4 pkt 12 RODO) to każde zdarzenie prowadzące do przypadkowego lub niezgodnego z prawem zniszczenia, utracenia, zmodyfikowania, nieuprawnionego ujawnienia lub dostępu do danych.')}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Wysłanie maila z danymi do nieuprawnionego odbiorcy','Utrata pendrive\'a z listą uczestników','Włamanie do konta lub systemu IT','Udostępnienie hasła osobom trzecim','Zagubienie dokumentów z danymi','Udostępnienie danych bez podstawy prawnej'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-red-50 border border-red-100 rounded-xl p-3"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />{ex}</div>
                ))}
              </div>
            </Card>
            <Card className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Procedura po wykryciu naruszenia</p>
              {[
                ['1. Natychmiastowe działanie','Ograniczenie szkód — zmiana haseł, odizolowanie sprzętu, cofnięcie dostępu.'],
                ['2. Dokumentacja','Zanotowanie: daty, godziny, okoliczności, zakresu naruszenia, dotkniętych osób.'],
                ['3. Ocena ryzyka','Ocena, czy naruszenie może skutkować ryzykiem dla praw i wolności osób.'],
                ['4. Zgłoszenie do UODO (72 h)','Przy prawdopodobnym ryzyku — obowiązkowo w ciągu 72 godzin (art. 33 RODO).'],
                ['5. Powiadomienie osób','Przy wysokim ryzyku — niezwłoczne poinformowanie osób, których dane dotyczą.'],
                ['6. Wpis do rejestru naruszeń','Każde naruszenie wpisywane do wewnętrznego rejestru (art. 33 ust. 5 RODO).'],
              ].map(([krok, opis], i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl p-3 border ${i === 3 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${i === 3 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i+1}</span>
                  <div><p className="font-bold text-slate-800 text-sm">{krok}</p><p className="text-xs text-slate-600 mt-0.5">{opis}</p></div>
                </div>
              ))}
            </Card>
          </section>

          <section id="powierzenie" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Share2} chapter="Kompendium — 6" title="Powierzenie przetwarzania danych" color="purple" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Powierzenie przetwarzania (art. 28 RODO) ma miejsce, gdy SSUEW korzysta z zewnętrznego podmiotu (procesora) przetwarzającego dane w jego imieniu. Bez umowy powierzenia — korzystanie z takich narzędzi jest niezgodne z RODO.')}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Platformy do obsługi zapisów na wydarzenia','Usługi przechowywania w chmurze (Google Drive)','Dostawcy systemów mailingu','Drukarnie otrzymujące listy adresatów','Dostawcy aplikacji webowych (formularz, CRA)'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-purple-50 border border-purple-100 rounded-xl p-3"><Share2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />{ex}</div>
                ))}
              </div>
            </Card>
            <InfoBox color="rose">{nb('Przed podpisaniem umowy z dostawcą sprawdź, czy oferuje standardową umowę DPA (Data Processing Agreement). Brak umowy = naruszenie RODO po stronie SSUEW.')}</InfoBox>
          </section>

          <section id="zgody" className="scroll-mt-20 mb-14">
            <SectionTitle icon={CheckSquare} chapter="Kompendium — 7" title="Zgody na przetwarzanie danych" color="green" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Zgoda (art. 7 RODO) musi spełniać cztery łączne warunki. Domniemana zgoda, milczenie i brak sprzeciwu nie stanowią zgody w rozumieniu RODO.')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Dobrowolna','Nie może być warunkiem dostępu do usługi, jeśli przetwarzanie nie jest niezbędne.'],
                  ['Konkretna','Dla każdego celu osobna zgoda — nie wolno łączyć kilku celów w jednej klauzuli.'],
                  ['Świadoma','Przed zgodą osoba musi otrzymać jasne informacje: kto, w jakim celu, jak długo.'],
                  ['Jednoznaczna','Wyraźne działanie potwierdzające — kliknięcie, podpis. Nie milczenie.'],
                ].map(([tytul, opis]) => (
                  <div key={tytul} className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="font-black text-green-800 text-sm mb-1">✓ {tytul}</p>
                    <p className="text-xs text-green-700">{opis}</p>
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="amber">{nb('Wycofanie zgody musi być równie proste jak jej udzielenie. Przechowuj dowody zgód przez cały okres przetwarzania + czas na ewentualne roszczenia.')}</InfoBox>
          </section>

          <section id="retencja" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Clock} chapter="Kompendium — 8" title="Retencja i usuwanie danych" color="amber" />
            <Card className="mb-4">
              <p className="text-slate-700 mb-5">{nb('Zasada ograniczenia przechowywania (art. 5 ust. 1 lit. e) nakazuje, by dane były przechowywane przez czas nie dłuższy niż niezbędny dla celów ich przetwarzania.')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-amber-50">{['Kategoria danych','Podstawa','Okres'].map(h => <th key={h} className="border border-amber-200 p-2.5 text-left font-black text-amber-800">{h}</th>)}</tr></thead>
                  <tbody>
                    {[['Lista uczestników wydarzeń','Zgoda','Do końca roku akademickiego + 1 rok'],['Wnioski studenckie','Obowiązek prawny','5 lat (kat. B5)'],['Umowy i porozumienia','Obowiązek prawny','10 lat (kat. B10)'],['Zdjęcia z wydarzeń (wizerunek)','Zgoda','Do wycofania zgody'],['Baza kontaktów do mailingu','Zgoda','Do wycofania zgody'],['Protokoły posiedzeń','Archiwum','Kat. A — wieczyste']].map((row, i) => (
                      <tr key={i} className="even:bg-slate-50 hover:bg-amber-50/50 transition-colors">
                        {row.map((cell, j) => <td key={j} className="border border-slate-200 p-2.5 text-slate-700">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <InfoBox color="rose">{nb('Dobra praktyka: raz w roku, na początku kadencji, przeprowadzenie przeglądu wszystkich zbiorów danych i usunięcie tych, których termin retencji minął.')}</InfoBox>
          </section>

          {/* ══════════════════════════════════ DOKUMENTY */}

          <section id="doc-polityka" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 1" title="Polityka Ochrony Danych Osobowych" color="slate" />
            <Card className="space-y-5">
              {[['§ 1. Postanowienia ogólne',nb('Niniejsza Polityka Ochrony Danych Osobowych określa zasady przetwarzania i ochrony danych osobowych przez Samorząd Studentów UEW (Administrator).')],['§ 2. Administrator danych',nb('Administrator: Samorząd Studentów UEW, ul. Komandorska 118/120, 53-345 Wrocław. Kontakt RODO: rodo@samorzad.ue.wroc.pl')],['§ 3. Zakres i cele',nb('Dane przetwarzane są wyłącznie w zakresie i celach niezbędnych do realizacji działalności statutowej SSUEW.')],['§ 4. Podstawy prawne',nb('Dane przetwarzane są na podstawie art. 6 RODO (zgoda, umowa, obowiązek prawny, interes publiczny) oraz art. 9 RODO dla danych szczególnych kategorii.')],['§ 5. Prawa osób',nb('Każdej osobie przysługuje prawo dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia i sprzeciwu. Wnioski: rodo@samorzad.ue.wroc.pl. Odpowiedź w ciągu 30 dni.')],['§ 6. Bezpieczeństwo',nb('Stosowane są środki techniczne i organizacyjne: kontrola dostępu, szyfrowanie, polityka haseł i szkolenia.')],['§ 7. Retencja',nb('Dane przechowywane są przez okresy określone w RCP. Po ich upływie — trwałe usunięcie.')],['§ 8. Postanowienia końcowe',nb('Polityka podlega przeglądowi co najmniej raz w roku akademickim oraz przy istotnych zmianach.')]].map(([para, tresc]) => (
                <div key={para} className="border-l-2 border-rose-100 pl-4">
                  <p className="font-black text-slate-800 text-sm mb-1">{para}</p>
                  <p className="text-sm text-slate-600">{tresc}</p>
                </div>
              ))}
            </Card>
          </section>

          <section id="doc-instrukcja" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 2" title="Instrukcja zarządzania systemem informatycznym" color="slate" />
            <div className="space-y-3">
              {[['Rozdział 1. Cel i zakres',nb('Instrukcja określa zasady bezpiecznego użytkowania systemów IT przetwarzających dane osobowe w SSUEW.')],['Rozdział 2. Hasła i uwierzytelnianie',nb('Wymagania: min. 12 znaków, wielkie i małe litery, cyfry, znaki specjalne. Zakaz używania tych samych haseł w różnych serwisach. Obowiązkowe 2FA. Zmiana co 6 miesięcy lub natychmiast po podejrzeniu kompromitacji.')],['Rozdział 3. Kontrola dostępu',nb('Dostęp do danych wyłącznie dla osób z podpisanym upoważnieniem. Zasada minimalnych uprawnień. Po zakończeniu kadencji: natychmiastowe odebranie dostępów.')],['Rozdział 4. Kopie zapasowe',nb('Krytyczne dane: kopia tygodniowa na zewnętrznym nośniku w zamkniętym pomieszczeniu. Testowanie odtworzenia kopii co kwartał.')],['Rozdział 5. Praca zdalna',nb('Zakaz przechowywania danych na prywatnych urządzeniach bez szyfrowania. Blokowanie ekranu po 5 minutach bezczynności.')],['Rozdział 6. Incydenty bezpieczeństwa',nb('Każdy incydent zgłaszany niezwłocznie osobie odpowiedzialnej za RODO. Przy naruszeniu: procedura zgłoszenia do UODO w ciągu 72 godzin.')],['Rozdział 7. Usuwanie danych',nb('Dokumenty papierowe: niszczarka min. P-4. Nośniki elektroniczne: certyfikowane zerowanie lub fizyczne zniszczenie.')]].map(([rozdzial, tresc]) => (
                <Card key={rozdzial} className="flex items-start gap-4 !p-5">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-2" />
                  <div><p className="font-black text-slate-800 text-sm mb-1.5">{rozdzial}</p><p className="text-sm text-slate-600">{tresc}</p></div>
                </Card>
              ))}
            </div>
          </section>

          <section id="doc-rcp" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Database} chapter="Dokumenty — 3" title="Rejestr Czynności Przetwarzania" color="teal" />
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-slate-600 text-sm">{nb('Pełny wykaz procesów przetwarzania danych w SSUEW.')}{isAdmin && ' Kliknij wiersz, aby edytować.'}</p>
              {isAdmin && (
                <button onClick={() => setRcpNewRow(true)} disabled={rcpNewRow}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" /> Dodaj wpis
                </button>
              )}
            </div>
            {rcpSaving && <div className="mb-3 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl p-3">Zapisywanie w Firestore...</div>}
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-teal-50 sticky top-0">
                      {[RCP_LABELS.lp, RCP_LABELS.nazwa, RCP_LABELS.cel, RCP_LABELS.kategoria, RCP_LABELS.podstawa, RCP_LABELS.retencja, ...(isAdmin ? [''] : [])].map((h,i) => (
                        <th key={i} className="border border-teal-100 p-3 text-left font-black text-teal-800 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rcpData.map(row => {
                      const editing = rcpEditing === row.lp;
                      return (
                        <tr key={row.lp} className={`transition-colors ${editing ? 'bg-teal-50' : 'even:bg-slate-50/50 hover:bg-teal-50/30'}`}>
                          {RCP_COLS.map(col => (
                            <td key={col} className="border border-slate-100 p-2">
                              {editing && col !== 'lp' ? (
                                <input value={rcpDraft[col] || ''} onChange={e => setRcpDraft(d => ({ ...d, [col]: e.target.value }))}
                                  className="w-full min-w-[80px] bg-white border border-teal-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-teal-400" />
                              ) : (
                                <span className={col === 'lp' ? 'font-black text-center block text-slate-400' : col === 'podstawa' ? 'font-mono text-rose-700' : 'text-slate-700'}>{row[col]}</span>
                              )}
                            </td>
                          ))}
                          {isAdmin && (
                            <td className="border border-slate-100 p-2 whitespace-nowrap">
                              {editing ? (
                                <div className="flex gap-1">
                                  <button onClick={commitEdit} className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-all"><Save className="w-3 h-3" /></button>
                                  <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-all"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-600 transition-all"><Edit2 className="w-3 h-3" /></button>
                                  <button onClick={() => deleteRow(row.lp)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {/* Nowy wiersz */}
                    {rcpNewRow && isAdmin && (
                      <tr className="bg-teal-50">
                        {RCP_COLS.map(col => (
                          <td key={col} className="border border-teal-200 p-2">
                            {col === 'lp' ? (
                              <span className="text-slate-400 font-black block text-center">{rcpData.length + 1}</span>
                            ) : (
                              <input value={rcpNewDraft[col] || ''} onChange={e => setRcpNewDraft(d => ({ ...d, [col]: e.target.value }))}
                                placeholder={RCP_LABELS[col]}
                                className="w-full min-w-[80px] bg-white border border-teal-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-teal-400" />
                            )}
                          </td>
                        ))}
                        <td className="border border-teal-200 p-2 whitespace-nowrap">
                          <div className="flex gap-1">
                            <button onClick={addRow} className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-all"><Save className="w-3 h-3" /></button>
                            <button onClick={() => setRcpNewRow(false)} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-all"><X className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            {isAdmin && <p className="mt-2 text-xs text-slate-400 text-right">Zmiany zapisywane w Firestore — widoczne dla wszystkich administratorów.</p>}
          </section>

          <section id="doc-klauzule" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 4" title="Klauzule informacyjne" color="slate" />
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <p className="font-black text-amber-900 text-sm">Uwaga prawna — czy klauzule są wystarczające?</p>
              <p className="text-sm text-amber-800 leading-relaxed">{nb('Wzory poniżej są zgodne strukturalnie z art. 13 RODO — obejmują wszystkie obowiązkowe elementy (cel, podstawę, odbiorców, prawa, UODO). Są dobrym punktem startowym.')}</p>
              <ul className="space-y-1.5 text-sm text-amber-800">
                {['Miejsca oznaczone [nawiasami] MUSZĄ być uzupełnione przed każdym użyciem — pustego wzoru nie wolno wysyłać.','Klauzula jest tak dobra, jak dokładne są wypełnione pola. Zły CEL lub ZŁY OKRES = błąd prawny.','Dla danych szczególnych kategorii (zdrowie, religia, poglądy) klauzula wymaga rozbudowania — skonsultuj z Uczelnianym IOD przed użyciem.','Na potrzeby wewnętrznych działań SSUEW wzory są wystarczające. Przed formalnym wdrożeniem dokumentów rekomendowana jest konsultacja z IOD UEW.'].map((p, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-amber-600 font-black shrink-0">→</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              {KLAUZULE.map(k => <KlauzulaCard key={k.id} tytul={k.tytul} tresc={k.tresc} />)}
            </div>
          </section>

          {/* ══════════════════════════════════ LINKI */}

          <section id="linki" className="scroll-mt-20 mb-16">
            <SectionTitle icon={LinkIcon} chapter="Źródła" title="Linki i akty prawne" color="blue" />
            <p className="text-slate-600 text-sm mb-6">{nb('Oficjalne akty prawne, strona organu nadzorczego i dokumenty wewnętrzne SSUEW — zawsze sprawdzaj aktualne wersje przed podjęciem formalnych działań.')}</p>
            <div className="space-y-6">
              {LINKI.map(group => {
                const colorMap = { blue:'border-blue-200 bg-blue-50 text-blue-700', rose:'border-rose-200 bg-rose-50 text-rose-700', slate:'border-slate-200 bg-slate-50 text-slate-600' };
                const badgeCol = colorMap[group.color] || colorMap.slate;
                return (
                  <div key={group.group}>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{group.group}</p>
                    <div className="space-y-3">
                      {group.items.map(item => (
                        <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-start justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeCol}`}>{item.badge}</span>
                            </div>
                            <p className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                          <LinkIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════ NARZĘDZIA */}

          <section id="generator" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FilePen} chapter="Narzędzia — 1" title="Generator upoważnień RODO" color="rose" />
            <p className="text-slate-600 text-sm mb-5">{nb('Wypełnienie formularza i wygenerowanie gotowego upoważnienia do przetwarzania danych osobowych w formacie PDF — gotowego do wydruku i podpisania.')}</p>
            <Card className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Imię i nazwisko</label>
                  <input type="text" value={genForm.imieNazwisko}
                    onChange={e => setGenForm(p => ({ ...p, imieNazwisko: e.target.value }))}
                    placeholder="Jan Kowalski"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Funkcja / stanowisko</label>
                  <input type="text" value={genForm.funkcja}
                    onChange={e => setGenForm(p => ({ ...p, funkcja: e.target.value }))}
                    placeholder="Sekretarz Zarządu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Upoważnienie obowiązuje do</label>
                  <input type="date" value={genForm.dataDo}
                    onChange={e => setGenForm(p => ({ ...p, dataDo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all" />
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Zakres dostępu</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {([
                    { key:'dostepCRA',      label:'System CRA' },
                    { key:'dostepDrive',    label:'Google Drive SSUEW' },
                    { key:'dostepPoczta',   label:'Poczta samorządowa' },
                    { key:'dostepFizyczny', label:'Dokumentacja papierowa' },
                    { key:'dostepArchiwum', label:'Archiwum dokumentów' },
                  ]).map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => setGenForm(p => ({ ...p, [key]: !p[key] }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all text-left ${genForm[key] ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${genForm[key] ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
                        {genForm[key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Uwagi dodatkowe (opcjonalnie)</label>
                <textarea value={genForm.uwagi}
                  onChange={e => setGenForm(p => ({ ...p, uwagi: e.target.value }))}
                  placeholder="Np. dostęp ograniczony do projektów X i Y"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none h-16" />
              </div>

              <button onClick={generateUpowaznienie}
                disabled={!genForm.imieNazwisko.trim() || !genForm.funkcja.trim()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest shadow-md shadow-rose-600/20 disabled:shadow-none">
                <Download className="w-4 h-4" /> Generuj upoważnienie PDF
              </button>
              {(!genForm.imieNazwisko.trim() || !genForm.funkcja.trim()) && (
                <p className="text-center text-xs text-slate-400">Wypełnij imię, nazwisko i funkcję, aby odblokować generator.</p>
              )}
            </Card>
          </section>

          <section id="checklista" className="scroll-mt-20 mb-14">
            <SectionTitle icon={CheckCircle} chapter="Narzędzia — 2" title="Checklista przekazania kadencji" color="green" />
            <p className="text-slate-600 text-sm mb-5">{nb('Do wykonania przed każdą zmianą składu Samorządu. Postęp zapisywany w sesji przeglądarki.')}</p>
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Postęp</p>
                  <p className={`text-2xl font-black ${allDone ? 'text-green-600' : 'text-slate-800'}`}>{checks.length}<span className="text-slate-400 font-normal text-base"> / {CHECKLIST_ITEMS.length}</span></p>
                </div>
                <button onClick={resetChecks} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">Resetuj</button>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-rose-500'}`} style={{ width: `${progress}%` }} />
              </div>
              {allDone && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Wszystkie kroki ukończone — przekazanie kadencji zgodne z RODO.
                </div>
              )}
              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const done = checks.includes(item.id);
                  return (
                    <button key={item.id} onClick={() => toggleCheck(item.id)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                      {done ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-slate-300 mr-1.5">#{String(idx+1).padStart(2,'0')}</span>
                        <span className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>

          <section id="incydent" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Flame} chapter="Narzędzia — 3" title="Rejestr incydentu — zgłoszenie naruszenia" color="red" />
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="font-black text-red-900 text-sm mb-2">Do czego służy ten formularz?</p>
              <p className="text-sm text-red-800 leading-relaxed">{nb('Formularz prowadzi przez obowiązkowe pola Rejestru Naruszeń Ochrony Danych Osobowych wymaganego przez art. 33 ust. 5 RODO. Po wypełnieniu 6 kroków generowany jest plik PDF — gotowy do wydruku i wpisania do wewnętrznego rejestru SSUEW. Jeśli naruszenie niesie ryzyko dla osób, należy je zgłosić do UODO przez oficjalny formularz (link w sekcji Linki) w ciągu 72 godzin.')}</p>
            </div>

            {incDone ? (
              <Card className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8" /></div>
                <h3 className="font-black text-slate-800 text-lg">PDF pobrany</h3>
                <p className="text-sm text-slate-500">{nb('Wpisz formularz do wewnętrznego rejestru naruszeń. Jeśli ryzyko było prawdopodobne — sprawdź, czy zgłoszenie do UODO (72 h) zostało już wysłane.')}</p>
                <button onClick={() => { setIncStep(0); setIncAnswers({}); setIncDone(false); }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all">
                  Nowe zgłoszenie
                </button>
              </Card>
            ) : (
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Krok {incStep + 1} z {INCIDENT_STEPS.length}</p>
                  <div className="flex gap-1">
                    {INCIDENT_STEPS.map((_,i) => (
                      <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i < incStep ? 'bg-rose-400' : i === incStep ? 'bg-rose-600' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-base mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 bg-rose-100 text-rose-700 rounded-full text-xs font-black flex items-center justify-center">{incStep+1}</span>
                  {INCIDENT_STEPS[incStep].label}
                </h3>
                {incStep === INCIDENT_STEPS.length - 1 ? (
                  <div className="space-y-3 mb-5">
                    <p className="text-sm text-slate-600 font-medium">{nb('Sprawdź dane przed wygenerowaniem PDF.')}</p>
                    {INCIDENT_STEPS.slice(0,-1).map((s,si) => (
                      <div key={si} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                        {s.fields.map(f => (
                          <div key={f} className="flex gap-2 text-xs mb-1">
                            <span className="font-bold text-slate-500 shrink-0">{f}:</span>
                            <span className="text-slate-700">{incAnswers[`${si}_${f}`] || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 mb-5">
                    {INCIDENT_STEPS[incStep].fields.map(field => (
                      <div key={field}>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{field}</label>
                        <textarea value={incAnswers[`${incStep}_${field}`] || ''}
                          onChange={e => setIncAnswers(p => ({ ...p, [`${incStep}_${field}`]: e.target.value }))}
                          placeholder="Opisz szczegółowo..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none h-20" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => setIncStep(s => s - 1)} disabled={incStep === 0}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-30">
                    ← Wstecz
                  </button>
                  {incStep === INCIDENT_STEPS.length - 1 ? (
                    <button onClick={generateIncydentPDF}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all active:scale-95">
                      <Download className="w-4 h-4" /> Wygeneruj PDF i zapisz
                    </button>
                  ) : (
                    <button onClick={() => setIncStep(s => s + 1)}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all active:scale-95">
                      Dalej →
                    </button>
                  )}
                </div>
              </Card>
            )}
          </section>

          <div className="border-t border-slate-200 pt-8 pb-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] text-center">
              Hub RODO · Samorząd Studentów UEW · Treści mają charakter informacyjny — nie zastępują porady prawnej
            </p>
          </div>

        </main>
      </div>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-6 z-50 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:shadow-xl transition-all">
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
