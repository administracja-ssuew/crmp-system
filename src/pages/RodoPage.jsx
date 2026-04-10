import { useState, useEffect } from 'react';
import {
  Shield, Scale, Users, ClipboardList, Database, AlertTriangle,
  Share2, CheckSquare, Clock, FileText, FilePen, CheckCircle,
  Square, ChevronRight, ArrowUp, Copy, Check, Download,
  Key, BookOpen, Flame,
} from 'lucide-react';
import jsPDF from 'jspdf';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nb(text) {
  return text.replace(/ (i|w|z|o|a|u|do|we|ze|że|bo|na|po|od|ku|by) /g, ' $1\u00A0');
}

// ─── NAWIGACJA ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'wstep', label: 'Wstęp' },
  {
    id: 'kompendium', label: 'Kompendium RODO',
    children: [
      { id: 'podstawy',    label: 'Podstawy prawne' },
      { id: 'prawa',       label: 'Prawa osób' },
      { id: 'obowiazki',   label: 'Obowiązki ADO' },
      { id: 'rcp',         label: 'Rejestr czynności' },
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
      { id: 'doc-instrukcja', label: 'Instrukcja przetwarzania' },
      { id: 'doc-rcp',        label: 'Rejestr RCP' },
      { id: 'doc-klauzule',   label: 'Klauzule informacyjne' },
    ],
  },
  {
    id: 'narzedzia', label: 'Narzędzia',
    children: [
      { id: 'generator',  label: 'Generator upoważnień' },
      { id: 'checklista', label: 'Checklista kadencji' },
      { id: 'incydent',   label: 'Zgłoszenie incydentu' },
    ],
  },
];

const ALL_IDS = [
  'wstep',
  'podstawy', 'prawa', 'obowiazki', 'rcp', 'naruszenia', 'powierzenie', 'zgody', 'retencja',
  'doc-polityka', 'doc-instrukcja', 'doc-rcp', 'doc-klauzule',
  'generator', 'checklista', 'incydent',
];

const CHILD_IDS = {
  kompendium: ['podstawy','prawa','obowiazki','rcp','naruszenia','powierzenie','zgody','retencja'],
  dokumenty:  ['doc-polityka','doc-instrukcja','doc-rcp','doc-klauzule'],
  narzedzia:  ['generator','checklista','incydent'],
};

// ─── DANE — RCP ───────────────────────────────────────────────────────────────
// Administrator we wszystkich procesach: Uniwersytet Ekonomiczny we Wrocławiu (UEW).
// SSUEW przetwarza dane jako jednostka organizacyjna UEW, nie jako samodzielny ADO.

const RCP_DANE = [
  { lp:'1',  nazwa:'Ewidencja członków Samorządu',        cel:'Zarządzanie członkostwem, organizacja pracy organów',    kategoria:'Imię, nazwisko, e-mail, nr indeksu, funkcja, kadencja',   podstawa:'art. 6 ust. 1 lit. e', retencja:'Czas kadencji + 5 lat (JRWA UEW)' },
  { lp:'2',  nazwa:'Lista uczestników wydarzeń',           cel:'Organizacja wydarzeń, bezpieczeństwo, dokumentacja',     kategoria:'Imię, nazwisko, e-mail, nr indeksu',                       podstawa:'art. 6 ust. 1 lit. e', retencja:'Do rozliczenia projektu + 1 rok' },
  { lp:'3',  nazwa:'Wnioski studenckie (CRED)',            cel:'Obsługa wniosków administracyjnych',                    kategoria:'Imię, nazwisko, e-mail, nr indeksu, treść wniosku',        podstawa:'art. 6 ust. 1 lit. e', retencja:'5 lat (kat. B5 JRWA UEW)' },
  { lp:'4',  nazwa:'Protokoły posiedzeń RUSS',             cel:'Dokumentacja organów kolegialnych SSUEW',               kategoria:'Imię, nazwisko, funkcja, głosowania, stanowiska',          podstawa:'art. 6 ust. 1 lit. e', retencja:'Archiwum wieczyste (kat. A)' },
  { lp:'5',  nazwa:'Rezerwacje sprzętu (Magazyn 16b)',     cel:'Zarządzanie wypożyczalnią sprzętu',                    kategoria:'Imię, nazwisko, e-mail, kontakt',                          podstawa:'art. 6 ust. 1 lit. e', retencja:'1 rok od zwrotu' },
  { lp:'6',  nazwa:'Lista dostępowa do pomieszczeń',       cel:'Bezpieczeństwo, kontrola dostępu',                     kategoria:'Imię, nazwisko, nr indeksu, e-mail @samorzad',             podstawa:'art. 6 ust. 1 lit. e / c', retencja:'Dany miesiąc + 1 rok' },
  { lp:'7',  nazwa:'Mailing informacyjny',                 cel:'Komunikacja z członkami i sympatykami',                kategoria:'E-mail, imię (opcjonalnie)',                               podstawa:'art. 6 ust. 1 lit. a (zgoda)', retencja:'Do wycofania zgody' },
  { lp:'8',  nazwa:'Materiały fotograficzne i wideo',      cel:'Promocja, dokumentacja działalności SSUEW',            kategoria:'Wizerunek (fotografie, nagrania)',                          podstawa:'art. 6 ust. 1 lit. a (zgoda)', retencja:'Do wycofania zgody' },
  { lp:'9',  nazwa:'Wnioski o dostęp do CRA',              cel:'Zarządzanie dostępem do systemu',                      kategoria:'Imię, nazwisko, e-mail uczelniany',                        podstawa:'art. 6 ust. 1 lit. e', retencja:'Czas kadencji + 1 rok' },
  { lp:'10', nazwa:'Faktury i dokumenty finansowe',        cel:'Rozliczenia, rachunkowość',                           kategoria:'Imię, nazwisko, adres, NIP (os. fizyczne)',                podstawa:'art. 6 ust. 1 lit. c', retencja:'5 lat od końca roku podatkowego' },
  { lp:'11', nazwa:'Umowy wolontariackie',                 cel:'Formalizacja współpracy wolontariuszy',               kategoria:'Imię, nazwisko, PESEL, adres, podpis',                     podstawa:'art. 6 ust. 1 lit. b', retencja:'10 lat (kat. B10 JRWA UEW)' },
  { lp:'12', nazwa:'Rejestr naruszeń ochrony danych',      cel:'Dokumentacja incydentów RODO (art. 33 ust. 5)',        kategoria:'Dane dotknięte naruszeniem, opis zdarzenia',               podstawa:'art. 6 ust. 1 lit. c', retencja:'Min. 3 lata od incydentu' },
  { lp:'13', nazwa:'Korespondencja z UODO / IOD UEW',      cel:'Obsługa kontroli, postępowań, konsultacji',            kategoria:'Dane zawarte w pismach',                                   podstawa:'art. 6 ust. 1 lit. c', retencja:'10 lat' },
];

// ─── DANE — CHECKLISTA KADENCJI ───────────────────────────────────────────────

const CHECKLIST_KEY = 'ssuew_rodo_checklist_v2';
const CHECKLIST_ITEMS = [
  { id:'c1',  text:'Przekazano dostępy do systemów (CRA, Google Drive, poczta samorządowa)' },
  { id:'c2',  text:'Zmieniono hasła po przekazaniu — wszystkie konta samorządowe' },
  { id:'c3',  text:'Odebrano sprzęt samorządowy (laptopy, dyski, nośniki z danymi)' },
  { id:'c4',  text:'Przekazano dokumentację papierową zawierającą dane osobowe' },
  { id:'c5',  text:'Usunięto dane z urządzeń prywatnych ustępujących członków' },
  { id:'c6',  text:'Zaktualizowano Rejestr Czynności Przetwarzania — nowe osoby upoważnione' },
  { id:'c7',  text:'Podpisano nowe upoważnienia do przetwarzania danych przez nowy skład' },
  { id:'c8',  text:'Poinformowano dostawców usług o zmianie osób kontaktowych' },
  { id:'c9',  text:'Przeprowadzono szkolenie RODO dla nowego składu samorządu' },
  { id:'c10', text:'Sporządzono Protokół Przekazania Kadencji (Zał. nr 5 do Instrukcji)' },
];

// ─── DANE — FORMULARZ INCYDENTU ───────────────────────────────────────────────

const INCIDENT_STEPS = [
  { label: 'Co się stało?',   fields: ['Opis zdarzenia', 'Data i godzina wykrycia', 'Kto wykrył naruszenie?'] },
  { label: 'Zakres danych',   fields: ['Rodzaj danych (imiona, e-maile, nr ind. itd.)', 'Szacunkowa liczba osób', 'Szacunkowa liczba rekordów'] },
  { label: 'Przyczyna',       fields: ['Prawdopodobna przyczyna naruszenia', 'Czy naruszenie jest ciągłe?'] },
  { label: 'Skutki',          fields: ['Możliwe skutki dla osób, których dane dotyczą', 'Czy istnieje ryzyko dla praw i wolności?'] },
  { label: 'Działania',       fields: ['Podjęte działania naprawcze', 'Planowane działania zapobiegawcze'] },
  { label: 'Powiadomienia',   fields: ['Czy zgłoszono do IOD UEW? (iod@ue.wroc.pl)', 'Czy poinformowano UODO (72h)?', 'Data i sposób zgłoszenia'] },
  { label: 'Podsumowanie',    fields: [] },
];

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function RodoPage() {
  const [activeSection, setActiveSection]     = useState('wstep');
  const [showScrollTop, setShowScrollTop]     = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [openGroups, setOpenGroups]           = useState({ kompendium: true, dokumenty: false, narzedzia: false });

  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CHECKLIST_KEY) || '[]'); } catch { return []; }
  });

  const [genForm, setGenForm] = useState({
    imieNazwisko:'', funkcja:'', dataDo:'',
    dostepCRA: false, dostepDrive: false, dostepPoczta: false,
    dostepFizyczny: false, dostepArchiwum: false,
    uwagi: '',
  });

  const [incStep, setIncStep]       = useState(0);
  const [incAnswers, setIncAnswers] = useState({});
  const [incDone, setIncDone]       = useState(false);

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

  const scrollTo = id => {
    for (const [grp, children] of Object.entries(CHILD_IDS)) {
      if (children.includes(id)) setOpenGroups(prev => ({ ...prev, [grp]: true }));
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
  // POPRAWKA PRAWNA: Administrator = UEW. Upoważnienie nadawane przez Czł. Zarządu
  // ds. Administracji w imieniu Administratora (UEW), nie przez „Zarząd SSUEW" jako ADO.

  const generateUpowaznienie = () => {
    const doc   = new jsPDF();
    const today = new Date().toLocaleDateString('pl-PL');
    const m = 20; let y = 20;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('UPOWAŻNIENIE DO PRZETWARZANIA DANYCH OSOBOWYCH', 105, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 105, y, { align: 'center' }); y += 5;
    doc.text('(jednostka organizacyjna Administratora — Uniwersytetu Ekonomicznego we Wrocławiu)', 105, y, { align: 'center' }); y += 14;
    doc.setFontSize(10);
    doc.text(`Wrocław, dnia ${today}`, m, y); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`UPOWAŻNIENIE NR ___/RODO/${new Date().getFullYear()}`, m, y); y += 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    [
      'Na podstawie art. 29 Rozporządzenia (UE) 2016/679 (RODO) oraz § 7 Instrukcji',
      'przetwarzania danych osobowych w SSUEW, działając w imieniu Administratora —',
      'Uniwersytetu Ekonomicznego we Wrocławiu, upoważniam:',
      '',
      `Imię i nazwisko: ${genForm.imieNazwisko}`,
      `Funkcja w SSUEW: ${genForm.funkcja}`,
      '',
      'do przetwarzania danych osobowych w zakresie niezbędnym do pełnienia',
      'powierzonej funkcji w Samorządzie Studentów UEW, w szczególności:',
    ].forEach(l => { doc.text(l, m, y); y += 6; }); y += 2;

    [
      genForm.dostepCRA      && '- dostęp do systemu CRA',
      genForm.dostepDrive    && '- dostęp do Google Drive SSUEW',
      genForm.dostepPoczta   && '- dostęp do poczty samorządowej',
      genForm.dostepFizyczny && '- dostęp do dokumentacji fizycznej',
      genForm.dostepArchiwum && '- dostęp do archiwum dokumentów',
    ].filter(Boolean).forEach(l => { doc.text(l, m + 4, y); y += 6; }); y += 4;

    [
      `Upoważnienie obowiązuje do: ${genForm.dataDo || '_______________'}`,
      '',
      genForm.uwagi ? `Uwagi: ${genForm.uwagi}` : null,
      '',
      'Przed podjęciem czynności osoba upoważniona składa Oświadczenie o poufności',
      '(Załącznik nr 2 do Instrukcji przetwarzania danych osobowych w SSUEW).',
      '',
      'W sprawach ochrony danych: IOD UEW — iod@ue.wroc.pl',
      '',
      '',
      '..................................          ..................................',
      'Czł. Zarządu ds. Administracji SSUEW      Osoba upoważniona (podpis)',
      '(działający/a w imieniu Administratora)',
    ].filter(l => l !== null).forEach(l => { doc.text(l, m, y); y += 6; });

    doc.save(`upowaznienie_${genForm.imieNazwisko.replace(/\s+/g, '_') || 'rodo'}.pdf`);
  };

  // ─── INCYDENT PDF ─────────────────────────────────────────────────────────────

  const generateIncydentPDF = () => {
    const doc = new jsPDF(); const today = new Date().toLocaleString('pl-PL');
    let y = 20; const m = 20; const pw = 170;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('KARTA INCYDENTU — NARUSZENIE OCHRONY DANYCH OSOBOWYCH', 105, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Samorząd Studentów UEW (j.o. Administratora — Uniwersytetu Ekonomicznego we Wrocławiu)', 105, y, { align: 'center' }); y += 5;
    doc.text(`Sporządzono: ${today}`, 105, y, { align: 'center' }); y += 12;
    INCIDENT_STEPS.slice(0, -1).forEach((s, si) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(`${si + 1}. ${s.label}`, m, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      s.fields.forEach(f => {
        doc.text(`${f}:`, m + 4, y); y += 5;
        const val = incAnswers[`${si}_${f}`] || '—';
        doc.splitTextToSize(val, pw - 10).forEach(l => { doc.text(l, m + 8, y); y += 5; });
        y += 2; if (y > 270) { doc.addPage(); y = 20; }
      }); y += 3;
    });
    y += 5;
    doc.setFontSize(9);
    doc.text('Podpis sporządzającego: ..............................', m, y); y += 7;
    doc.text('Czł. Zarządu ds. Administracji: ..............................', m, y); y += 7;
    doc.text('Kontakt IOD UEW: iod@ue.wroc.pl', m, y);
    doc.save(`karta_incydentu_${new Date().toISOString().slice(0, 10)}.pdf`);
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
    const map = { rose: 'bg-rose-50 border-rose-200 text-rose-900', amber: 'bg-amber-50 border-amber-200 text-amber-900', blue: 'bg-blue-50 border-blue-200 text-blue-900', green: 'bg-green-50 border-green-200 text-green-900', red: 'bg-red-50 border-red-200 text-red-900' };
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
        <select
          value={activeSection}
          onChange={e => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
        >
          {allOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white pt-6 pb-32">
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
          <div className="px-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IOD UEW</p>
            <p className="text-xs text-slate-500">iod@ue.wroc.pl</p>
          </div>
        </aside>

        {/* TREŚĆ */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-32 [&_p]:leading-relaxed [&_p]:text-pretty">

          {/* ══════════════════════════════════════════════════════════════ WSTĘP */}
          <section id="wstep" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Shield} chapter="Wprowadzenie" title="Hub RODO — ochrona danych w SSUEW" color="rose" />

            {/* Kluczowy kontekst prawny — widoczny od razu */}
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Ważne — status prawny SSUEW</p>
              <p className="text-sm text-amber-900 leading-relaxed">
                {nb('SSUEW nie posiada osobowości prawnej i nie może być samodzielnym administratorem danych osobowych w rozumieniu RODO. Administratorem jest Uniwersytet Ekonomiczny we Wrocławiu (art. 111 ustawy PSW). SSUEW przetwarza dane jako jednostka organizacyjna UEW, na podstawie upoważnień, a Inspektorem Ochrony Danych jest IOD UEW — kontakt: iod@ue.wroc.pl.')}
              </p>
            </div>

            <Card className="mb-5 space-y-4">
              <p className="text-slate-700">{nb('Każda kadencja Samorządu Studentów przetwarza dane osobowe: listuje uczestników, organizuje szkolenia, obsługuje wnioski. RODO nie jest biurokratycznym wymogiem — to zestaw reguł, które chronią studentów, wolontariuszy i członków samorządu przed nadużyciami.')}</p>
              <p className="text-slate-700">{nb('Ten hub zawiera kompendium wiedzy, gotowe dokumenty oraz interaktywne narzędzia — upoważnienia, checklistę przekazania kadencji i formularz incydentu. Wszystko, czego potrzebuje Zarząd SSUEW, żeby działać zgodnie z prawem.')}</p>
            </Card>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { ic: BookOpen, col: 'bg-rose-50 border-rose-200 text-rose-700', ic2: 'text-rose-500', t: 'Kompendium', d: '8 tematów RODO — podstawy, prawa, obowiązki, RCP, naruszenia, zgody i retencja.' },
                { ic: FileText, col: 'bg-slate-50 border-slate-200 text-slate-700', ic2: 'text-slate-500', t: 'Dokumenty', d: 'Polityka ODO, Instrukcja przetwarzania, Rejestr RCP i gotowe klauzule informacyjne.' },
                { ic: Key,      col: 'bg-indigo-50 border-indigo-200 text-indigo-700', ic2: 'text-indigo-500', t: 'Narzędzia', d: 'Generator upoważnień PDF, checklista kadencji i kreator zgłoszenia incydentu.' },
              ].map(({ ic: Icon, col, ic2, t, d }) => (
                <div key={t} className={`flex items-start gap-3 p-4 rounded-2xl border ${col}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ic2}`} />
                  <div><p className="font-black text-sm mb-1">{t}</p><p className="text-xs leading-relaxed opacity-80">{d}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════ KOMPENDIUM */}

          <section id="podstawy" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Scale} chapter="Kompendium — 1" title="Podstawy prawne przetwarzania danych" color="rose" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Przetwarzanie danych osobowych jest dopuszczalne wyłącznie wtedy, gdy spełniona jest co najmniej jedna z przesłanek art. 6 RODO. Bez wyraźnej podstawy prawnej — przetwarzanie jest niedopuszczalne. Podstawę zawsze identyfikuj przed uruchomieniem nowego procesu i wpisuj do RCP.')}</p>
              <div className="space-y-2">
                {[
                  ['lit. a', 'Zgoda osoby, której dane dotyczą', 'np. zgoda na wizerunek w materiałach promocyjnych, mailing informacyjny'],
                  ['lit. b', 'Wykonanie umowy lub działania przed jej zawarciem', 'np. umowa wolontariacka — dotyczy wyłącznie sytuacji, gdy umowa faktycznie istnieje'],
                  ['lit. c', 'Wypełnienie obowiązku prawnego', 'np. archiwizacja protokołów, dokumentacja finansowa, rejestr naruszeń'],
                  ['lit. e', 'Wykonanie zadania w interesie publicznym', 'obsługa wniosków studenckich, organizacja wydarzeń i szkoleń, działalność przedstawicielska — najczęstsza podstawa w SSUEW'],
                ].map(([kod, tytul, przyklad]) => (
                  <div key={kod} className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="font-mono text-xs font-black text-rose-600 bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg shrink-0 mt-0.5">art. 6 ust. 1 {kod}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tytul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{przyklad}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="amber">
              {nb('Uwaga na art. 6(1)(b) — wykonanie umowy. Między SSUEW a studentem uczestniczącym w szkoleniu lub wydarzeniu nie istnieje umowa w rozumieniu cywilnoprawnym. Właściwą podstawą jest art. 6(1)(e) — interes publiczny. Art. 6(1)(b) stosuj wyłącznie tam, gdzie podpisywana jest formalna umowa (np. umowa wolontariacka).')}
            </InfoBox>
          </section>

          <section id="prawa" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Users} chapter="Kompendium — 2" title="Prawa osób, których dane dotyczą" color="blue" />
            <p className="text-slate-600 text-sm mb-5">{nb('RODO przyznaje każdej osobie fizycznej katalog praw. Administrator (UEW/SSUEW) musi je szanować i odpowiadać na żądania w ciągu jednego miesiąca od ich otrzymania. Wnioski kieruj do IOD UEW: iod@ue.wroc.pl.')}</p>
            <div className="space-y-3">
              {[
                ['art. 15', 'Dostęp', 'Osoba może żądać informacji o tym, jakie jej dane są przetwarzane, w jakim celu, jak długo i komu są udostępniane.'],
                ['art. 16', 'Sprostowanie', 'Osoba może żądać poprawienia błędnych lub uzupełnienia niekompletnych danych.'],
                ['art. 17', 'Usunięcie', 'Prawo do bycia zapomnianym — gdy dane nie są już potrzebne, zgoda została wycofana lub przetwarzanie było bezprawne.'],
                ['art. 18', 'Ograniczenie', 'Osoba może żądać, by dane były przechowywane bez dalszego przetwarzania np. na czas rozpatrzenia sprzeciwu.'],
                ['art. 20', 'Przenoszenie', 'Dotyczy danych przetwarzanych automatycznie na podstawie zgody lub umowy — osoba może żądać ich w ustrukturyzowanym formacie.'],
                ['art. 21', 'Sprzeciw', 'Osoba może wnieść sprzeciw wobec przetwarzania opartego na interesie publicznym (lit. e) lub prawnie uzasadnionym interesie (lit. f).'],
              ].map(([art, tytul, opis]) => (
                <div key={art} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg shrink-0 mt-0.5 whitespace-nowrap">{art}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">Prawo do {tytul.toLowerCase()}</p>
                    <p className="text-sm text-slate-600">{opis}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="obowiazki" className="scroll-mt-20 mb-14">
            <SectionTitle icon={ClipboardList} chapter="Kompendium — 3" title="Obowiązki administratora danych" color="indigo" />
            <p className="text-slate-600 text-sm mb-5">{nb('Art. 5 RODO określa siedem zasad, które musi spełniać każdy administrator. Administratorem jest UEW. SSUEW jako jednostka organizacyjna stosuje te zasady w codziennej pracy i musi być w stanie wykazać ich przestrzeganie.')}</p>
            <div className="space-y-2">
              {[
                ['1. Zgodność z prawem, rzetelność i przejrzystość', 'Dane muszą być przetwarzane na podstawie jasnej przesłanki, a osoby muszą być o tym poinformowane (klauzula informacyjna art. 13 RODO).'],
                ['2. Ograniczenie celu', 'Dane zbierane w określonym celu nie mogą być przetwarzane w sposób niezgodny z tym celem.'],
                ['3. Minimalizacja danych', 'Zbierane są wyłącznie dane adekwatne, stosowne i ograniczone do tego, co niezbędne.'],
                ['4. Prawidłowość', 'Dane muszą być aktualne; nieprawidłowe dane należy niezwłocznie usunąć lub sprostować.'],
                ['5. Ograniczenie przechowywania', 'Dane przechowywane są przez czas nie dłuższy niż niezbędny do realizacji celu.'],
                ['6. Integralność i poufność', 'Dane muszą być chronione przed nieuprawnionym dostępem, utratą i zniszczeniem.'],
                ['7. Rozliczalność', 'Administrator (UEW/SSUEW) musi być w stanie wykazać przestrzeganie wszystkich powyższych zasad.'],
              ].map(([tytul, opis], i) => (
                <Rule key={i} n={i + 1}><strong>{tytul}</strong> — {opis}</Rule>
              ))}
            </div>
          </section>

          <section id="rcp" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Database} chapter="Kompendium — 4" title="Rejestr Czynności Przetwarzania" color="teal" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Rejestr Czynności Przetwarzania (RCP) to obowiązkowy dokument wewnętrzny (art. 30 RODO), który administrator prowadzi w formie pisemnej lub elektronicznej. Musi być dostępny na żądanie Prezesa UODO.')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Nazwa i cel czynności przetwarzania', 'Kategorie osób i kategorie danych', 'Odbiorcy danych (podmioty zewnętrzne)', 'Transfery do państw trzecich — jeśli dotyczy', 'Planowane terminy usunięcia danych', 'Opis środków bezpieczeństwa'].map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {p}
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="blue">{nb('Aktualizuj RCP przy każdej zmianie zakresu przetwarzania, wdrożeniu nowego narzędzia cyfrowego lub zawarciu umowy powierzenia. Pełny rejestr SSUEW dostępny jest w sekcji Dokumenty poniżej.')}</InfoBox>
          </section>

          <section id="naruszenia" className="scroll-mt-20 mb-14">
            <SectionTitle icon={AlertTriangle} chapter="Kompendium — 5" title="Naruszenia ochrony danych osobowych" color="red" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Naruszenie ochrony danych (art. 4 pkt 12 RODO) to każde zdarzenie prowadzące do przypadkowego lub niezgodnego z prawem zniszczenia, utracenia, zmodyfikowania, nieuprawnionego ujawnienia lub dostępu do danych.')}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Wysłanie maila z danymi do nieuprawnionego odbiorcy', "Utrata pendrive'a z listą uczestników", 'Włamanie do konta lub systemu IT', 'Udostępnienie hasła osobom trzecim', 'Zagubienie dokumentów z danymi osobowymi', 'Udostępnienie danych bez podstawy prawnej'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-red-50 border border-red-100 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    {ex}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Procedura po wykryciu naruszenia</p>
              {[
                ['1. Natychmiastowe działanie', 'Ogranicz szkody — zmień hasła, odizoluj sprzęt, cofnij dostęp.'],
                ['2. Dokumentacja', 'Zanotuj: datę, godzinę, okoliczności, zakres naruszenia, osoby dotknięte. Wypełnij Kartę Incydentu (Zał. 4A).'],
                ['3. Ocena ryzyka', 'Czy naruszenie może skutkować ryzykiem dla praw i wolności osób?'],
                ['4. Zgłoszenie do IOD UEW — niezwłocznie', 'Zawiadom iod@ue.wroc.pl. IOD podejmuje decyzję o zgłoszeniu do UODO (termin: 72 h od wykrycia, art. 33 RODO).'],
                ['5. Powiadomienie osób', 'Jeśli ryzyko jest wysokie — IOD UEW niezwłocznie informuje osoby, których dane dotyczą.'],
                ['6. Rejestr naruszeń', 'Każde naruszenie wpisz do wewnętrznego rejestru (Zał. 7 do Instrukcji, art. 33 ust. 5 RODO).'],
              ].map(([krok, opis], i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl p-3 border ${i === 3 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${i === 3 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i + 1}</span>
                  <div><p className="font-bold text-slate-800 text-sm">{krok}</p><p className="text-xs text-slate-600 mt-0.5">{opis}</p></div>
                </div>
              ))}
            </Card>
          </section>

          <section id="powierzenie" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Share2} chapter="Kompendium — 6" title="Powierzenie przetwarzania danych" color="purple" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Powierzenie przetwarzania (art. 28 RODO) ma miejsce, gdy SSUEW korzysta z zewnętrznego podmiotu (procesora), który przetwarza dane w imieniu Administratora (UEW). Bez umowy powierzenia (DPA) korzystanie z zewnętrznych narzędzi do przetwarzania danych jest niezgodne z RODO.')}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Platformy do obsługi zapisów na wydarzenia', 'Usługi przechowywania w chmurze (Google Drive)', 'Dostawcy systemów mailingu', 'Drukarnie otrzymujące listy adresatów', 'Dostawcy aplikacji webowych (CRA, formularze)'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-purple-50 border border-purple-100 rounded-xl p-3">
                    <Share2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    {ex}
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="rose">{nb('Przed podpisaniem umowy z dostawcą sprawdź, czy oferuje standardową umowę DPA (Data Processing Agreement). Brak umowy = naruszenie RODO po stronie Administratora. W razie wątpliwości skonsultuj z IOD UEW.')}</InfoBox>
          </section>

          <section id="zgody" className="scroll-mt-20 mb-14">
            <SectionTitle icon={CheckSquare} chapter="Kompendium — 7" title="Zgody na przetwarzanie danych" color="green" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">{nb('Zgoda (art. 7 RODO) musi spełniać cztery łączne warunki, by była prawnie skuteczna. Domniemana zgoda, milczenie i brak sprzeciwu nie stanowią zgody w rozumieniu RODO.')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Dobrowolna', 'Nie może być warunkiem dostępu do usługi, jeśli przetwarzanie nie jest niezbędne.'],
                  ['Konkretna', 'Dla każdego celu osobna zgoda — nie wolno łączyć kilku celów w jednej klauzuli.'],
                  ['Świadoma', 'Przed zgodą osoba musi otrzymać jasne informacje: kto, w jakim celu, jak długo.'],
                  ['Jednoznaczna', 'Wyraźne działanie potwierdzające — kliknięcie, podpis. Nie milczenie.'],
                ].map(([tytul, opis]) => (
                  <div key={tytul} className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="font-black text-green-800 text-sm mb-1">✓ {tytul}</p>
                    <p className="text-xs text-green-700">{opis}</p>
                  </div>
                ))}
              </div>
            </Card>
            <InfoBox color="amber">{nb('Wycofanie zgody musi być równie proste jak jej udzielenie. Przechowuj dowody zgód przez cały okres przetwarzania danych + czas na ewentualne roszczenia. Cofnięcie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed cofnięciem.')}</InfoBox>
          </section>

          <section id="retencja" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Clock} chapter="Kompendium — 8" title="Retencja i usuwanie danych" color="amber" />
            <Card className="mb-4">
              <p className="text-slate-700 mb-5">{nb('Zasada ograniczenia przechowywania (art. 5 ust. 1 lit. e RODO) nakazuje, by dane były przechowywane przez okres nie dłuższy niż niezbędny dla celów, w których są przetwarzane.')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-50">
                      {['Kategoria danych', 'Podstawa', 'Okres'].map(h => (
                        <th key={h} className="border border-amber-200 p-2.5 text-left font-black text-amber-800">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Lista uczestników wydarzeń', 'art. 6(1)(e)', 'Do rozliczenia projektu + 1 rok'],
                      ['Wnioski studenckie (CRED)', 'art. 6(1)(e)', '5 lat (kat. B5 JRWA UEW)'],
                      ['Umowy i porozumienia', 'art. 6(1)(b/c)', '10 lat (kat. B10 JRWA UEW)'],
                      ['Zdjęcia z wydarzeń (wizerunek)', 'art. 6(1)(a) — zgoda', 'Do wycofania zgody'],
                      ['Baza kontaktów do mailingu', 'art. 6(1)(a) — zgoda', 'Do wycofania zgody'],
                      ['Protokoły posiedzeń RUSS', 'art. 6(1)(e)', 'Kat. A — archiwum wieczyste'],
                      ['Faktury i dokumenty finansowe', 'art. 6(1)(c)', '5 lat od końca roku podatkowego'],
                      ['Rejestr naruszeń danych', 'art. 6(1)(c)', 'Min. 3 lata od incydentu'],
                    ].map((row, i) => (
                      <tr key={i} className="even:bg-slate-50 hover:bg-amber-50/50 transition-colors">
                        {row.map((cell, j) => <td key={j} className="border border-slate-200 p-2.5 text-slate-700">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <InfoBox color="rose">{nb('Dobra praktyka: raz w roku (np. na początku kadencji) przeprowadź przegląd wszystkich zbiorów i usuń te, których termin retencji minął. Odnotuj fakt przeglądu. Dokumenty papierowe niszczyć w niszczarce min. P-4; nośniki elektroniczne — certyfikowane zerowanie lub fizyczne zniszczenie.')}</InfoBox>
          </section>

          {/* ══════════════════════════════════ DOKUMENTY */}

          <section id="doc-polityka" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 1" title="Polityka Prywatności SSUEW" color="slate" />
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
              Dokument nadrzędny systemu ochrony danych. Instrukcja przetwarzania jest dokumentem wykonawczym do Polityki. W przypadku rozbieżności: Polityka ma pierwszeństwo w kwestiach informacyjnych, Instrukcja — organizacyjnych i proceduralnych (§ 16 Instrukcji).
            </div>
            <Card className="space-y-5">
              {[
                ['§ 1. Postanowienia ogólne', nb('Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych w Samorządzie Studentów Uniwersytetu Ekonomicznego we Wrocławiu (SSUEW). Polityka ma zastosowanie do kandydatów do struktur SSUEW, członków, uczestników wydarzeń, interesariuszy oraz kontrahentów. Sporządzona w szczególności na podstawie Rozporządzenia (UE) 2016/679 (RODO) oraz Rozporządzenia (UE) 2025/2518.')],
                ['§ 2. Administrator danych i rola SSUEW', nb('Administratorem danych osobowych w rozumieniu RODO jest Uniwersytet Ekonomiczny we Wrocławiu (UEW), ul. Komandorska 118/120, 53-345 Wrocław. SSUEW nie posiada osobowości prawnej i przetwarza dane jako jednostka organizacyjna UEW, na podstawie upoważnień, w ramach swojej działalności statutowej. Inspektorem Ochrony Danych jest IOD UEW — kontakt: iod@ue.wroc.pl.')],
                ['§ 3. Kontakt w sprawach danych osobowych', nb('W sprawach ochrony danych osobowych należy kontaktować się z Inspektorem Ochrony Danych UEW: iod@ue.wroc.pl. Kontakt może dotyczyć w szczególności: realizacji praw osób, wyjaśniania podstaw przetwarzania, zgłaszania naruszeń oraz konsultacji w zakresie zgodności działań SSUEW z przepisami.')],
                ['§ 4. Cele i podstawy prawne przetwarzania', nb('SSUEW przetwarza dane osobowe w jasno określonych celach: rekrutacja do organów i komisji (art. 6(1)(e)), obsługa członków w trakcie kadencji (art. 6(1)(e)), organizacja wydarzeń i szkoleń (art. 6(1)(e)), obowiązki finansowe i rozliczeniowe (art. 6(1)(c)), obsługa korespondencji (art. 6(1)(f)), działania informacyjne i promocyjne — wizerunek wyłącznie za zgodą (art. 6(1)(a)).')],
                ['§ 5. Zakres przetwarzanych danych', nb('SSUEW przetwarza wyłącznie dane adekwatne i niezbędne: dane identyfikacyjne (imię, nazwisko), kontaktowe (e-mail, nr telefonu), organizacyjne (rola, komisja, kadencja), finansowe (wyłącznie w zakresie wymaganym przepisami), wizerunek (tylko przy udzielonej zgodzie) oraz inne dane dobrowolnie przekazane przez osobę — z zastrzeżeniem zasady minimalizacji.')],
                ['§ 6. Odbiorcy danych', nb('Odbiorcami danych mogą być: organy i komisje SSUEW (wyłącznie w zakresie niezbędnym), UEW (w zakresie wynikającym z przepisów prawa oraz regulacji wewnętrznych), podmioty współpracujące przy realizacji wydarzeń lub projektów (wyłącznie na podstawie odpowiednich umów powierzenia). SSUEW nie udostępnia danych na żądanie nieformalne.')],
                ['§ 7. Okres przechowywania danych', nb('Dane przechowywane są: przez czas trwania kadencji, projektu lub procesu, a następnie przez okres wynikający z JRWA UEW i wymogów rozliczeniowych. Szczegółowe okresy retencji określa Rejestr Czynności Przetwarzania.')],
                ['§ 8. Prawa osób, których dane dotyczą', nb('Każdej osobie przysługuje prawo: dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu (przy podstawach art. 6(1)(e) i (f)), przenoszenia (przy zgodzie/umowie i przetwarzaniu automatycznym). Wnioski kierować do IOD UEW: iod@ue.wroc.pl. Odpowiedź w ciągu 30 dni. Przysługuje prawo skargi do Prezesa UODO, ul. Stawki 2, 00-193 Warszawa.')],
                ['§ 9. Bezpieczeństwo danych', nb('SSUEW stosuje adekwatne środki techniczne i organizacyjne: kontrolę dostępu i upoważnienia imienne, zasadę need-to-know, zabezpieczenia obiegu dokumentów i repozytoriów, procedury reagowania na incydenty, działania porządkujące i archiwizacyjne na zakończenie kadencji/projektów.')],
                ['§ 10. Aktualizacja Polityki', nb('Polityka podlega okresowej weryfikacji i aktualizacji, w szczególności w przypadku zmiany przepisów prawa, zmiany zakresu działalności SSUEW lub wprowadzenia nowych procesów przetwarzania danych.')],
              ].map(([para, tresc]) => (
                <div key={para} className="border-l-2 border-rose-100 pl-4">
                  <p className="font-black text-slate-800 text-sm mb-1">{para}</p>
                  <p className="text-sm text-slate-600">{tresc}</p>
                </div>
              ))}
            </Card>
          </section>

          <section id="doc-instrukcja" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 2" title="Instrukcja przetwarzania danych osobowych" color="slate" />
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
              Dokument wykonawczy do Polityki Prywatności. Ma charakter wewnętrzny i wiążący dla wszystkich osób przetwarzających dane w ramach działalności SSUEW (§ 1 ust. 3). Naruszenie Instrukcji może skutkować cofnięciem upoważnienia i odpowiedzialnością organizacyjną.
            </div>
            <div className="space-y-3">
              {[
                ['Rozdział I — Postanowienia ogólne', nb('Instrukcja określa zasady, tryb oraz odpowiedzialność w zakresie przetwarzania danych osobowych w SSUEW. Wiąże: Przewodniczącego, Prezydium, Zarząd, Radę Uczelnianą, członków komisji, pionów i zespołów roboczych oraz wszystkie inne osoby przetwarzające dane w ramach SSUEW. Każda z tych osób przetwarza dane wyłącznie w zakresie powierzonych zadań.')],
                ['Rozdział II — Administrator danych i odpowiedzialność', nb('Administratorem danych jest UEW. SSUEW przetwarza dane jako jednostka organizacyjna UEW. Bieżący nadzór nad stosowaniem Instrukcji sprawuje Członek Zarządu ds. Administracji. Przewodniczący, Prezydium i Zarząd odpowiadają za organizację systemu ochrony danych i prowadzenie RCP. Zarząd może zasięgać opinii IOD UEW: iod@ue.wroc.pl.')],
                ['Rozdział III — Upoważnienia i dostęp do danych', nb('Dostęp do danych mogą posiadać wyłącznie osoby imiennie upoważnione. Upoważnienie nadaje Członek Zarządu ds. Administracji (w imieniu Administratora), w formie pisemnej wg wzoru Zał. 1. Określa: zakres danych, dozwolone czynności, systemy/repozytoria objęte dostępem i okres obowiązywania. Zabrania się przetwarzania bez upoważnienia. Upoważnienie wygasa z chwilą zakończenia kadencji/projektu, rezygnacji lub cofnięcia. Ewidencja upoważnień prowadzona jest w Zał. 3.')],
                ['Rozdział IV — Zasady przetwarzania w praktyce', nb('Dane mogą być przetwarzane wyłącznie w systemach i na kontach wskazanych przez Zarząd. Zabrania się przechowywania danych na prywatnych kontach e-mail, prywatnych nośnikach i w niezabezpieczonych lokalizacjach. Udostępnienie danych podmiotom zewnętrznym wymaga decyzji Członka Zarządu ds. Administracji. Przed każdym nowym projektem/wydarzeniem dokonywana jest ocena zgodności z RODO (Formularz Oceny — Zał. 6). Przed uzyskaniem dostępu osoba składa Oświadczenie o poufności (Zał. 2).')],
                ['Rozdział V — Naruszenia ochrony danych', nb('Każde podejrzenie naruszenia zgłasza się niezwłocznie Przewodniczącemu lub Zarządowi SSUEW, a następnie IOD UEW (iod@ue.wroc.pl). Naruszeniem jest m.in.: utrata danych, nieuprawniony dostęp, wysłanie danych do błędnego adresata. Członek Zarządu ds. Administracji analizuje naruszenie, dokumentuje zdarzenie (Karta Incydentu — Zał. 4A) i we współpracy z IOD UEW podejmuje decyzję o zgłoszeniu do UODO (72 h). Każde naruszenie wpisywane jest do Rejestru naruszeń (Zał. 7).')],
                ['Rozdział VI — Przekazanie kadencji i archiwizacja', nb('Przekazanie kadencji dokumentowane jest Protokołem Przekazania Kadencji (Zał. 5). Obejmuje: przekazanie dokumentacji, uporządkowanie repozytoriów, cofnięcie dostępów ustępującym osobom, zmianę haseł i tokenów, identyfikację danych do archiwizacji (JRWA UEW) i usunięcia. Dane niepodlegające archiwizacji niszczone są w sposób uniemożliwiający odtworzenie. Dostęp do archiwum ma wyłącznie Zarząd lub osoby upoważnione.')],
                ['Rozdział VII — Postanowienia końcowe', nb('Naruszenie Instrukcji może skutkować cofnięciem upoważnienia, odpowiedzialnością organizacyjną i konsekwencjami wynikającymi z przepisów powszechnie obowiązujących. Wszystkie osoby przetwarzające dane są zobowiązane do zapoznania się z Instrukcją. Instrukcja podlega okresowej weryfikacji.')],
              ].map(([rozdzial, tresc]) => (
                <Card key={rozdzial} className="flex items-start gap-4 !p-5">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-2" />
                  <div>
                    <p className="font-black text-slate-800 text-sm mb-1.5">{rozdzial}</p>
                    <p className="text-sm text-slate-600">{tresc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section id="doc-rcp" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Database} chapter="Dokumenty — 3" title="Rejestr Czynności Przetwarzania" color="teal" />
            <p className="text-slate-600 text-sm mb-2">{nb('Pełny wykaz procesów przetwarzania danych osobowych w Samorządzie Studentów UEW. Administrator we wszystkich procesach: Uniwersytet Ekonomiczny we Wrocławiu. Aktualizowany każdorazowo przy zmianie zakresu działalności lub wdrożeniu nowego narzędzia.')}</p>
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-medium">
              Niniejszy widok ma charakter poglądowy. Wiążący rejestr prowadzony jest w formie arkusza XLSX (Załącznik nr 4 do Instrukcji).
            </div>
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-teal-50 sticky top-0">
                      {['Lp.', 'Czynność przetwarzania', 'Cel', 'Kategorie danych', 'Podstawa prawna', 'Retencja'].map(h => (
                        <th key={h} className="border border-teal-100 p-3 text-left font-black text-teal-800 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RCP_DANE.map(row => (
                      <tr key={row.lp} className="even:bg-slate-50/50 hover:bg-teal-50/30 transition-colors">
                        <td className="border border-slate-100 p-3 font-black text-center text-slate-500">{row.lp}</td>
                        <td className="border border-slate-100 p-3 font-semibold text-slate-800">{row.nazwa}</td>
                        <td className="border border-slate-100 p-3 text-slate-600">{row.cel}</td>
                        <td className="border border-slate-100 p-3 text-slate-600">{row.kategoria}</td>
                        <td className="border border-slate-100 p-3 font-mono text-rose-700 whitespace-nowrap">{row.podstawa}</td>
                        <td className="border border-slate-100 p-3 text-slate-600 whitespace-nowrap">{row.retencja}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section id="doc-klauzule" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FileText} chapter="Dokumenty — 4" title="Klauzule informacyjne" color="slate" />
            <p className="text-slate-600 text-sm mb-2">{nb('Gotowe wzory klauzul do wklejenia w formularze, dokumenty i maile. Miejsca oznaczone [nawiasami] należy uzupełnić przed użyciem. We wszystkich klauzulach Administratorem jest UEW.')}</p>
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              Podstawa prawna dla szkoleń i wydarzeń: art. 6(1)(e) — interes publiczny. Nie stosuj art. 6(1)(b) (wykonanie umowy) dla rejestracji uczestników, jeśli nie istnieje formalna umowa.
            </div>
            <div className="space-y-5">
              {[
                {
                  tytul: 'Klauzula ogólna — formularz / rejestracja na wydarzenie lub szkolenie',
                  tresc: `Zgodnie z art. 13 RODO informuję, że:
1. Administratorem Pani/Pana danych jest Uniwersytet Ekonomiczny we Wrocławiu, ul. Komandorska 118/120, 53-345 Wrocław. Dane przetwarzane są w ramach działalności Samorządu Studentów UEW (ul. Kamienna 43, 53-307 Wrocław), działającego jako jednostka organizacyjna Administratora.
2. Inspektor Ochrony Danych UEW: iod@ue.wroc.pl.
3. Dane przetwarzane są w celu [CEL: np. organizacji i obsługi szkolenia/wydarzenia] na podstawie art. 6 ust. 1 lit. e RODO (zadanie w interesie publicznym — działalność przedstawicielska SSUEW).
4. Dane będą przechowywane przez [OKRES: np. czas trwania projektu + 1 rok, zgodnie z JRWA UEW].
5. Odbiorcami danych mogą być: organy SSUEW, UEW oraz dostawcy usług technicznych na podstawie umów powierzenia. Dane nie są przekazywane do państw trzecich.
6. Przysługuje Pani/Panu prawo: dostępu (art. 15), sprostowania (art. 16), usunięcia (art. 17), ograniczenia (art. 18), sprzeciwu (art. 21) oraz skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa).
7. Podanie danych jest [dobrowolne / niezbędne do udziału — uzupełnić]. Odmowa podania danych [skutki — uzupełnić].`,
                },
                {
                  tytul: 'Klauzula wizerunkowa — zgoda na utrwalanie i publikację wizerunku',
                  tresc: `Zgodnie z art. 13 RODO informuję, że:
1. Administratorem Pani/Pana danych osobowych (wizerunku) jest Uniwersytet Ekonomiczny we Wrocławiu, ul. Komandorska 118/120, 53-345 Wrocław. Dane przetwarzane są w ramach działalności SSUEW, działającego jako jednostka organizacyjna Administratora.
2. Inspektor Ochrony Danych UEW: iod@ue.wroc.pl.
3. Podstawą przetwarzania wizerunku jest art. 6 ust. 1 lit. a RODO (dobrowolna zgoda), w związku z art. 81 ustawy o prawie autorskim i prawach pokrewnych.
4. Celem jest dokumentacja działalności i promocja SSUEW: [strona www / media społecznościowe / materiały drukowane — zaznaczyć].
5. Dane przetwarzane są do momentu wycofania zgody. Wycofanie zgody jest możliwe w każdym momencie i nie wpływa na zgodność z prawem przetwarzania przed jej cofnięciem. Kontakt: iod@ue.wroc.pl.
6. Odbiorcami mogą być: organy SSUEW, UEW, fotografowie i firmy medialne na podstawie umów powierzenia. Dane nie są przekazywane do państw trzecich.
7. Przysługuje Pani/Panu prawo: dostępu, sprostowania, usunięcia, ograniczenia, cofnięcia zgody, skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa).
8. Podanie danych jest dobrowolne. Odmowa nie skutkuje żadnymi negatywnymi konsekwencjami.`,
                },
              ].map(({ tytul, tresc }) => {
                const [copied, setCopied] = useState(false);
                const handleCopy = () => {
                  navigator.clipboard?.writeText(tresc).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                };
                return (
                  <Card key={tytul}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="font-black text-slate-800 text-sm">{tytul}</p>
                      <button onClick={handleCopy}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all border border-slate-200">
                        {copied ? <><Check className="w-3 h-3 text-green-600" />Skopiowano</> : <><Copy className="w-3 h-3" />Kopiuj</>}
                      </button>
                    </div>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 border border-slate-100 rounded-xl p-4">{tresc}</pre>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════ NARZĘDZIA */}

          <section id="generator" className="scroll-mt-20 mb-14">
            <SectionTitle icon={FilePen} chapter="Narzędzia — 1" title="Generator upoważnień RODO" color="rose" />
            <p className="text-slate-600 text-sm mb-5">{nb('Wypełnij formularz, aby wygenerować upoważnienie do przetwarzania danych osobowych. Upoważnienie nadawane jest przez Członka Zarządu ds. Administracji w imieniu Administratora (UEW), zgodnie z § 7 Instrukcji.')}</p>
            <Card className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Imię i nazwisko', key: 'imieNazwisko', placeholder: 'Jan Kowalski' },
                  { label: 'Funkcja w SSUEW', key: 'funkcja', placeholder: 'Sekretarz Zarządu' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
                    <input type="text" value={genForm[key]} onChange={e => setGenForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Upoważnienie obowiązuje do</label>
                  <input type="date" value={genForm.dataDo} onChange={e => setGenForm(p => ({ ...p, dataDo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all" />
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Zakres dostępu</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { key: 'dostepCRA',      label: 'System CRA' },
                    { key: 'dostepDrive',    label: 'Google Drive SSUEW' },
                    { key: 'dostepPoczta',   label: 'Poczta samorządowa' },
                    { key: 'dostepFizyczny', label: 'Dokumentacja papierowa' },
                    { key: 'dostepArchiwum', label: 'Archiwum dokumentów' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setGenForm(p => ({ ...p, [key]: !p[key] }))}
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
                <textarea value={genForm.uwagi} onChange={e => setGenForm(p => ({ ...p, uwagi: e.target.value }))} placeholder="Np. dostęp ograniczony do projektów X i Y"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none h-16" />
              </div>

              <button onClick={generateUpowaznienie} disabled={!genForm.imieNazwisko.trim() || !genForm.funkcja.trim()}
                className="w-full py-3 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest shadow-md shadow-rose-600/20 disabled:shadow-none">
                <Download className="w-4 h-4" />
                Generuj upoważnienie PDF
              </button>
              {(!genForm.imieNazwisko.trim() || !genForm.funkcja.trim()) && (
                <p className="text-center text-xs text-slate-400">Wypełnij imię, nazwisko i funkcję, aby odblokować generator.</p>
              )}
            </Card>
          </section>

          <section id="checklista" className="scroll-mt-20 mb-14">
            <SectionTitle icon={CheckCircle} chapter="Narzędzia — 2" title="Checklista przekazania kadencji" color="green" />
            <p className="text-slate-600 text-sm mb-5">{nb('Zrób tę checklistę przed każdą zmianą składu Zarządu. Postęp jest zapisywany w sesji przeglądarki. Po zakończeniu sporządź Protokół Przekazania Kadencji (Zał. 5 do Instrukcji).')}</p>
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
                  <CheckCircle className="w-4 h-4" /> Wszystkie kroki ukończone — sporządź Protokół Przekazania Kadencji (Zał. 5).
                </div>
              )}

              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const done = checks.includes(item.id);
                  return (
                    <button key={item.id} onClick={() => toggleCheck(item.id)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                      {done
                        ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        : <Square className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-slate-300 mr-1.5">#{String(idx + 1).padStart(2, '0')}</span>
                        <span className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>

          <section id="incydent" className="scroll-mt-20 mb-14">
            <SectionTitle icon={Flame} chapter="Narzędzia — 3" title="Formularz zgłoszenia incydentu" color="red" />
            <p className="text-slate-600 text-sm mb-2">{nb('Gdy wykryjesz naruszenie ochrony danych, wypełnij ten formularz krok po kroku. Wygenerowany PDF stanowi podstawę do wypełnienia Karty Incydentu (Zał. 4A) i wpisu do Rejestru naruszeń (Zał. 7).')}</p>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
              Po wykryciu naruszenia — niezwłocznie zawiadom IOD UEW: <strong>iod@ue.wroc.pl</strong>. IOD podejmuje decyzję o zgłoszeniu do UODO. Termin zgłoszenia do UODO: <strong>72 godziny</strong> od wykrycia (art. 33 RODO).
            </div>

            {incDone ? (
              <Card className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-slate-800 text-lg">PDF pobrany</h3>
                <p className="text-sm text-slate-500">{nb('Wpisz dane do Rejestru naruszeń (Zał. 7). Skontaktuj się z IOD UEW (iod@ue.wroc.pl) i sprawdź, czy wymagane jest zgłoszenie do UODO.')}</p>
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
                    {INCIDENT_STEPS.map((_, i) => (
                      <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i < incStep ? 'bg-rose-400' : i === incStep ? 'bg-rose-600' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                <h3 className="font-black text-slate-800 text-base mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 bg-rose-100 text-rose-700 rounded-full text-xs font-black flex items-center justify-center">{incStep + 1}</span>
                  {INCIDENT_STEPS[incStep].label}
                </h3>

                {incStep === INCIDENT_STEPS.length - 1 ? (
                  <div className="space-y-3 mb-5">
                    <p className="text-sm text-slate-600 font-medium">{nb('Sprawdź dane przed wygenerowaniem PDF i wpisem do rejestru naruszeń.')}</p>
                    {INCIDENT_STEPS.slice(0, -1).map((s, si) => (
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
                        <textarea
                          value={incAnswers[`${incStep}_${field}`] || ''}
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
                      <Download className="w-4 h-4" />
                      Wygeneruj PDF i zapisz
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

          {/* FOOTER */}
          <div className="border-t border-slate-200 pt-8 pb-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] text-center">
              Hub RODO · Samorząd Studentów UEW · Administrator: Uniwersytet Ekonomiczny we Wrocławiu · IOD: iod@ue.wroc.pl
            </p>
          </div>

        </main>
      </div>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-6 z-50 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:shadow-xl transition-all"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
