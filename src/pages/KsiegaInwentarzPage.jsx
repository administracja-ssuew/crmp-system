import { useState, useEffect } from 'react';
import {
  BookMarked, CheckSquare, Square, ChevronRight, ArrowUp,
  Hash, ClipboardList, Scale, Table2, GitCompare, Edit3, AlertOctagon, FileText
} from 'lucide-react';

// === NAV DATA ===
const NAV_ITEMS = [
  { id: 'czym-jest',       label: 'Czym jest Księga' },
  { id: 'podstawa-prawna', label: 'Podstawa prawna' },
  { id: 'struktura',       label: 'Struktura — 15 kolumn' },
  { id: 'inwentaryzacja',  label: 'Inwentaryzacja otwarcia' },
  { id: 'relacja',         label: 'Relacja z ewidencją' },
  { id: 'procedura-wpisu', label: 'Procedura dodawania wpisu' },
  { id: 'bledy',           label: 'Częste błędy' },
];

const ALL_SECTION_IDS = [
  'czym-jest', 'podstawa-prawna', 'struktura',
  'inwentaryzacja', 'relacja', 'procedura-wpisu', 'bledy',
];

// === STATIC DATA ARRAYS ===

const COLUMN_ITEMS = [
  { id: 'kol-1',  title: 'Kolumna 1 — Liczba porządkowa',           description: 'Kolejny numer wpisu w księdze, nadawany chronologicznie.', tips: 'Nie można usuwać ani pomijać numerów — wykreślone pozycje zostawiamy z adnotacją o wykreśleniu.', example: '1, 2, 3 …' },
  { id: 'kol-2',  title: 'Kolumna 2 — Data wpisu',                  description: 'Data wprowadzenia przedmiotu do ewidencji (wpisania go do Księgi).', tips: 'Format: DD.MM.RRRR. Data wpisu nie musi być równa dacie zakupu.', example: '12.03.2025' },
  { id: 'kol-3',  title: 'Kolumna 3 — Miejsce użytkowania',         description: 'Pomieszczenie lub jednostka, w której przedmiot jest na stałe użytkowany.', tips: 'Stosuj kody sal zgodnie z wewnętrznym słownikiem SSUEW (np. D-105, Biuro SSUEW).', example: 'Biuro SSUEW, D-105' },
  { id: 'kol-4',  title: 'Kolumna 4 — Symbol i nr dowodu zakupu',   description: 'Numer faktury, rachunku lub innego dokumentu finansowego potwierdzającego nabycie.', tips: 'Wpisuj dokładnie tak jak na dokumencie źródłowym. Dla darowizn: numer umowy darowizny.', example: 'FV 2025/03/0042' },
  { id: 'kol-5',  title: 'Kolumna 5 — Nr fabryczny (S/N)',          description: 'Numer seryjny urządzenia nadany przez producenta.', tips: 'Jeśli sprzęt nie posiada numeru seryjnego — wpisz "BRAK S/N" i opisz to w protokole przyjęcia.', example: 'SN-C02ZM0XJMD6T' },
  { id: 'kol-6',  title: 'Kolumna 6 — Nazwa z kodem SSUEW',         description: 'Pełna nazwa modelu sprzętu poprzedzona unikalnym kodem SSUEW.', tips: 'Format kodu: SSUEW-YYY-XXX-NNN gdzie YYY = kategoria (np. KOM, AUD, MON), XXX = podtyp, NNN = numer kolejny w kategorii.', example: 'SSUEW-KOM-NTB-001 Apple MacBook Pro 14" M3' },
  { id: 'kol-7',  title: 'Kolumna 7 — Cena jednostkowa (zł)',       description: 'Cena zakupu netto (bez VAT) lub wartość rynkowa w przypadku darowizn.', tips: 'Zaokrąglaj do dwóch miejsc po przecinku. Dla darowizn: wycena rynkowa w dniu przyjęcia.', example: '7 499,00' },
  { id: 'kol-8',  title: 'Kolumna 8 — Ilość',                       description: 'Liczba egzemplarzy danego przedmiotu objętych jednym wpisem.', tips: 'Zalecane: jeden wpis = jeden egzemplarz. Grupowe wpisy utrudniają późniejsze wykreślenie.', example: '1' },
  { id: 'kol-9',  title: 'Kolumna 9 — Wartość łączna (zł)',         description: 'Iloczyn ceny jednostkowej (kol. 7) i ilości (kol. 8).', tips: 'Wartość wyliczana automatycznie: kol.7 × kol.8. Sprawdź arytmetykę przed podpisaniem.', example: '7 499,00' },
  { id: 'kol-10', title: 'Kolumna 10 — Osoba odpowiedzialna',       description: 'Imię, nazwisko i funkcja osoby materialnie odpowiedzialnej za dany przedmiot.', tips: 'Aktualizuj przy każdej zmianie odpowiedzialności (przekazanie, zmiana kadencji).', example: 'Jan Kowalski, Przewodniczący SSUEW' },
  { id: 'kol-11', title: 'Kolumna 11 — Data wydania/przyjęcia',     description: 'Data faktycznego wydania sprzętu osobie odpowiedzialnej lub przyjęcia go z powrotem.', tips: 'Format: DD.MM.RRRR. Ważne dla ustalenia ciągłości odpowiedzialności.', example: '15.03.2025' },
  { id: 'kol-12', title: 'Kolumna 12 — Uwagi dotyczące stanu',      description: 'Opis stanu technicznego, uszkodzeń, braków lub innych uwag o przedmiocie.', tips: 'Wpisuj obiektywnie. Przy przyjęciu: zaznacz widoczne uszkodzenia przed podpisaniem protokołu.', example: 'Zarysowana obudowa — stan na dzień przyjęcia' },
  { id: 'kol-13', title: 'Kolumna 13 — Data wykreślenia',           description: 'Data usunięcia pozycji z ewidencji (kasacja, kradzież, zniszczenie, darowizna na zewnątrz).', tips: 'Pozycji nie wymazujemy — przekreślamy i wpisujemy datę wykreślenia oraz powód.', example: '20.11.2025' },
  { id: 'kol-14', title: 'Kolumna 14 — Podstawa wykreślenia',       description: 'Numer protokołu kasacyjnego, decyzji lub innego dokumentu uzasadniającego wykreślenie.', tips: 'Wykreślenie bez podstawy dokumentowej jest błędem formalnym.', example: 'Protokół kasacyjny nr 2/2025' },
  { id: 'kol-15', title: 'Kolumna 15 — Podpis',                     description: 'Podpis osoby dokonującej wpisu lub wykreślenia.', tips: 'Wpis bez podpisu nie jest ważny. Podpis musi być odręczny — nie inicjały.', example: '(podpis odręczny)' },
];

const COMPARISON_ROWS = [
  { cecha: 'Charakter',        ksiega: 'Dokument prawny (księga rachunkowa)',       ewidencja: 'Narzędzie operacyjne (baza danych)' },
  { cecha: 'Funkcja',          ksiega: 'Potwierdza przynależność majątkową SSUEW',  ewidencja: 'Zarządza stanem bieżącym i dostępnością' },
  { cecha: 'Forma',            ksiega: 'Fizyczna — papierowa, z podpisami',         ewidencja: 'Cyfrowa — wpisy w systemie CRA' },
  { cecha: 'Podstawa wpisu',   ksiega: 'Dokument finansowy (FV, rachunek)',         ewidencja: 'Wpis ręczny lub import z Księgi' },
  { cecha: 'Odpowiedzialność', ksiega: 'Osoba materialnie odpowiedzialna',          ewidencja: 'Administrator systemu CRA' },
  { cecha: 'Archiwizacja',     ksiega: 'Obowiązkowo — min. 5 lat (ustawa)',         ewidencja: 'Wg regulaminu SSUEW' },
];

const WPIS_CHECKLIST_ITEMS = [
  { id: 'w1',  text: 'Przygotuj dokument zakupu (faktura, rachunek) — sprawdź czy zawiera numer i datę' },
  { id: 'w2',  text: 'Odczytaj numer seryjny (S/N) ze sprzętu lub opakowania' },
  { id: 'w3',  text: 'Nadaj sprzętowi kod SSUEW wg schematu SSUEW-YYY-XXX-NNN' },
  { id: 'w4',  text: 'Otwórz Księgę Inwentarzową K-205/60 na pierwszej wolnej linii' },
  { id: 'w5',  text: 'Wpisz kolejny numer porządkowy (kol. 1) — sprawdź poprzednią linię' },
  { id: 'w6',  text: 'Wpisz dzisiejszą datę jako datę wpisu (kol. 2)' },
  { id: 'w7',  text: 'Wpisz miejsce użytkowania: kod sali lub "Biuro SSUEW" (kol. 3)' },
  { id: 'w8',  text: 'Przepisz symbol i numer dokumentu zakupu (kol. 4)' },
  { id: 'w9',  text: 'Wpisz numer seryjny S/N (kol. 5) — lub "BRAK S/N" jeśli go nie ma' },
  { id: 'w10', text: 'Wpisz pełną nazwę z kodem SSUEW (kol. 6)' },
  { id: 'w11', text: 'Wpisz cenę jednostkową z faktury (kol. 7)' },
  { id: 'w12', text: 'Wpisz ilość (kol. 8) i oblicz wartość łączną (kol. 9)' },
  { id: 'w13', text: 'Wpisz imię, nazwisko i funkcję osoby odpowiedzialnej (kol. 10)' },
  { id: 'w14', text: 'Wpisz datę wydania sprzętu tej osobie (kol. 11)' },
  { id: 'w15', text: 'Złóż podpis w kolumnie 15 — wpis bez podpisu jest nieważny' },
];

const FAQ_ITEMS = [
  { id: 'f1', q: 'Brak numeru seryjnego (S/N) — co wpisać?', a: 'Wpisz "BRAK S/N" w kolumnie 5 i dołącz adnotację w kolumnie 12 (Uwagi) wyjaśniającą powód (np. "Sprzęt nie posiada S/N — zakup uzywany"). Bez żadnego wpisu kolumna 5 pozostaje luka — to błąd formalny.' },
  { id: 'f2', q: 'Błędna data wpisu — jak poprawić?', a: 'Przekreśl błędną datę jedną linią (tak żeby była czytelna), wpisz obok prawidłową i złóż parafkę. Nie używaj korektora — każda zamazana wartość podważa wiarygodność dokumentu.' },
  { id: 'f3', q: 'Brak kodu SSUEW — czy można wpisać samą nazwę?', a: 'Nie. Kod SSUEW jest obowiązkową częścią kolumny 6. Bez kodu nie można jednoznacznie powiązać wpisu z rekordem w ewidencji cyfrowej. Nadaj kod przed wpisem — skonsultuj z Komisją ds. Administracji jeśli nie wiesz jaką kategorię użyć.' },
  { id: 'f4', q: 'Czy można wymazać błędny wpis korektorem?', a: 'Nie. Księga Inwentarzowa jest dokumentem rachunkowym — korekty wyłącznie metodą przekreślenia z parafką. Użycie korektora lub białego tuszu dyskwalifikuje wpis jako fałszerstwo dokumentu.' },
  { id: 'f5', q: 'Sprzęt skradziony lub zniszczony — co zrobić z wpisem?', a: 'Nie usuwaj wpisu. Wypełnij kolumny 13 (data wykreślenia) i 14 (podstawa wykreślenia — numer protokołu policyjnego lub protokołu kasacyjnego). Przekreśl wiersz jedną linią. Wpis musi pozostać czytelny.' },
  { id: 'f6', q: 'Zmieniła się osoba odpowiedzialna — jak to odnotować?', a: 'Zaktualizuj kolumnę 10 (osoba odpowiedzialna) i 11 (data wydania/przyjęcia). Jeśli nie ma miejsca w wierszu — sporządź aneks w Uwagach (kol. 12) i wstaw odsyłacz do protokołu przekazania sprzętu.' },
];

// === MAIN COMPONENT ===
export default function KsiegaInwentarzPage() {
  const [activeSection, setActiveSection] = useState('czym-jest');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ksiega_checklist_v1');
      return saved ? JSON.parse(saved) : { wpis: [] };
    } catch { return { wpis: [] }; }
  });
  const [simForm, setSimForm] = useState({ kol4: '', kol5: '', kol6: '', kol7: '' });
  const [simSubmitted, setSimSubmitted] = useState(false);

  // Scroll na górę przy wejściu
  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    ALL_SECTION_IDS.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggleCheck = (group, itemId) => {
    const newState = { ...checklistState };
    const arr = newState[group] || [];
    newState[group] = arr.includes(itemId) ? arr.filter(x => x !== itemId) : [...arr, itemId];
    setChecklistState(newState);
    sessionStorage.setItem('ksiega_checklist_v1', JSON.stringify(newState));
  };
  const fieldError = (val) => simSubmitted && !val.trim();
  const allSelectOptions = NAV_ITEMS.map(item => ({ id: item.id, label: item.label }));

  // === SUB-COMPONENTS ===

  const Checklist = ({ group, items }) => (
    <div className="space-y-2">
      {items.map(item => {
        const checked = (checklistState[group] || []).includes(item.id);
        return (
          <button key={item.id} onClick={() => toggleCheck(group, item.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              checked ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>
            {checked ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                     : <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
            <span className={`text-sm font-medium leading-snug ${checked ? 'line-through opacity-60' : ''}`}>{item.text}</span>
          </button>
        );
      })}
    </div>
  );

  const KsiegaAccordion = ({ id, title, description, tips, example }) => {
    const open = openAccordion === id;
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => setOpenAccordion(open ? null : id)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left">
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && (
          <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100 space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed pt-3">{description}</p>
            {tips && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className="text-amber-500 text-xs font-black uppercase tracking-wide shrink-0 mt-0.5">Wskazówka</span>
                <p className="text-xs text-amber-800">{tips}</p>
              </div>
            )}
            {example && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Przykład:</span>
                <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">{example}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SectionTitle = ({ icon: Icon, chapter, title, color = 'emerald' }) => {
    const colors = {
      emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'text-emerald-500' },
      blue:    { bg: 'bg-blue-100',    icon: 'text-blue-600',    label: 'text-blue-500'    },
      green:   { bg: 'bg-green-100',   icon: 'text-green-600',   label: 'text-green-500'   },
      teal:    { bg: 'bg-teal-100',    icon: 'text-teal-600',    label: 'text-teal-500'    },
      amber:   { bg: 'bg-amber-100',   icon: 'text-amber-600',   label: 'text-amber-500'   },
      indigo:  { bg: 'bg-indigo-100',  icon: 'text-indigo-600',  label: 'text-indigo-500'  },
      red:     { bg: 'bg-red-100',     icon: 'text-red-600',     label: 'text-red-500'     },
      purple:  { bg: 'bg-purple-100',  icon: 'text-purple-600',  label: 'text-purple-500'  },
    };
    const c = colors[color] || colors.emerald;
    return (
      <div className="flex items-center gap-3 mb-6">
        {Icon && <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>}
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${c.label} mb-0.5`}>{chapter}</p>
          <h2 className="text-2xl font-black text-slate-800">{title}</h2>
        </div>
      </div>
    );
  };

  // === RETURN JSX ===
  return (
    <div className="min-h-screen bg-slate-50">

      {/* MOBILE SELECT */}
      <div className="lg:hidden sticky top-[49px] z-30 bg-white border-b border-slate-200 px-4 py-2.5">
        <select value={activeSection} onChange={e => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400">
          {allSelectOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </div>

      {/* FLEX LAYOUT */}
      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR (desktop) */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto border-r border-slate-200 bg-white py-6">
          <nav className="px-3 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSection === item.id ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-24">

          {/* SECTION 1 — Czym jest Księga Inwentarzowa */}
          <section id="czym-jest" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookMarked} chapter="Sekcja 1" title="Czym jest Księga Inwentarzowa?" color="emerald" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <p className="text-slate-700 leading-relaxed">
                Księga Inwentarzowa SSUEW (symbol <strong>K-205/60</strong>) to fizyczny, papierowy rejestr wszystkich środków trwałych będących własnością Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Jest to dokument <strong>rachunkowy</strong> w rozumieniu ustawy z dnia 29 września 1994 r. o rachunkowości — każdy wpis i każde wykreślenie muszą być poparte dokumentem źródłowym (fakturą, rachunkiem lub protokołem kasacyjnym) i opatrzone podpisem osoby dokonującej wpisu.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                  Księga potwierdza <strong>przynależność majątkową</strong> każdego sprzętu do SSUEW i stanowi podstawę do dochodzenia odpowiedzialności materialnej. Nie jest narzędziem do zarządzania stanem bieżącym (tą funkcję pełni ewidencja cyfrowa w CRA) — jest dokumentem prawnym.
                </p>
              </div>
              {/* TODO: replace with actual photo after user uploads to /public/ksiega/ */}
              <div className="mt-4">
                <img
                  src="/ksiega/placeholder.jpg"
                  alt="Wzór strony Księgi Inwentarzowej K-205/60"
                  className="rounded-xl border border-slate-200 shadow-sm w-full max-w-xl"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <p className="text-xs text-slate-400 mt-2">Wzór strony Księgi Inwentarzowej — zdjęcie zostanie dodane po dostarczeniu pliku do /public/ksiega/</p>
              </div>
            </div>
          </section>

          {/* SECTION 2 — Podstawa prawna */}
          <section id="podstawa-prawna" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Scale} chapter="Sekcja 2" title="Podstawa prawna" color="blue" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Ustawa z dnia 29 września 1994 r. o rachunkowości</p>
                    <p className="text-sm text-slate-600 mt-1">Art. 17 ust. 1 — obowiązek prowadzenia ewidencji składników majątkowych. SSUEW jako jednostka korzystająca ze środków Uczelni jest zobowiązana do prowadzenia Księgi Inwentarzowej jako elementu dokumentacji rachunkowej.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Przepisy wewnętrzne Kwestury UEW</p>
                    <p className="text-sm text-slate-600 mt-1">Kwestura Uniwersytetu Ekonomicznego we Wrocławiu wydaje wytyczne dotyczące sposobu prowadzenia ewidencji majątkowej przez jednostki organizacyjne Uczelni, w tym przez Samorząd Studentów.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Regulaminy wewnętrzne SSUEW</p>
                    <p className="text-sm text-slate-600 mt-1">Regulamin Zarządu SSUEW nakłada obowiązek prowadzenia i aktualizacji Księgi Inwentarzowej na Zarząd — w praktyce realizowany przez Komisję ds. Administracji lub wyznaczonego administratora sprzętu.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* SECTION 3 — Struktura — 15 kolumn */}
          <section id="struktura" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Table2} chapter="Sekcja 3" title="Struktura Księgi — 15 kolumn" color="indigo" />
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">Każda strona Księgi Inwentarzowej K-205/60 zawiera tabelę z 15 kolumnami. Kliknij kolumnę, aby zobaczyć opis, wskazówki i przykład.</p>
            <div className="space-y-2">
              {COLUMN_ITEMS.map(col => (
                <KsiegaAccordion key={col.id} id={col.id} title={col.title} description={col.description} tips={col.tips} example={col.example} />
              ))}
            </div>
          </section>

          {/* SECTION 4 — Inwentaryzacja otwarcia */}
          <section id="inwentaryzacja" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Sekcja 4" title="Inwentaryzacja otwarcia" color="teal" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <p className="text-slate-700 leading-relaxed text-sm">Inwentaryzacja otwarcia to procedura stosowana na początku nowej kadencji Zarządu SSUEW lub po przejęciu prowadzenia Księgi. Jej celem jest ustalenie stanu ewidencji i potwierdzenie zgodności fizycznej.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-black text-sm flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Gruba kreska — oddzielenie kadencji</p>
                    <p className="text-sm text-slate-600 mt-1">Po ostatnim wpisie poprzedniej kadencji narysuj poziomą linię przez całą szerokość tabeli i wpisz: "Koniec inwentaryzacji — [data] — [imię, nazwisko, funkcja]". Nowa kadencja zaczyna nowe wpisy od następnej linii.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-black text-sm flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Nagłówek nowej inwentaryzacji</p>
                    <p className="text-sm text-slate-600 mt-1">Pod linią wpisz: "Inwentaryzacja otwarcia — [data] — Kadencja [rok] — Osoba prowadząca: [imię, nazwisko, funkcja]".</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-black text-sm flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Weryfikacja starych wpisów</p>
                    <p className="text-sm text-slate-600 mt-1">Każdy istniejący wpis sprawdź fizycznie — sprzęt musi być na stanie. Brakujące pozycje wykreśl z adnotacją "Brak na stanie — inwentaryzacja otwarcia [data]" i załącz protokół różnicy inwentaryzacyjnej.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-black text-sm flex items-center justify-center shrink-0">4</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Nowe wpisy</p>
                    <p className="text-sm text-slate-600 mt-1">Sprzęt nabyty od poprzedniej inwentaryzacji, a nieujęty w Księdze, wpisuj normalnie — jako nowe wiersze z aktualną datą wpisu i dokumentem zakupu.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 — Relacja z ewidencją cyfrową */}
          <section id="relacja" className="scroll-mt-20 mb-16">
            <SectionTitle icon={GitCompare} chapter="Sekcja 5" title="Relacja z ewidencją cyfrową" color="purple" />
            <p className="text-slate-600 text-sm mb-4">Księga Inwentarzowa i cyfrowa ewidencja w CRA to dwa różne systemy z różnymi celami — obydwa są obowiązkowe.</p>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Cecha</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Księga Inwentarzowa</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Ewidencja cyfrowa (CRA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-700">{row.cecha}</td>
                      <td className="px-5 py-3 text-slate-600">{row.ksiega}</td>
                      <td className="px-5 py-3 text-slate-600">{row.ewidencja}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 6 — Procedura dodawania wpisu */}
          <section id="procedura-wpisu" className="scroll-mt-20 mb-16">
            <SectionTitle icon={ClipboardList} chapter="Sekcja 6" title="Procedura dodawania wpisu" color="green" />
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3">Checklista — krok po kroku</h3>
                <Checklist group="wpis" items={WPIS_CHECKLIST_ITEMS} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3">Symulator wpisu — wypróbuj przed pierwszym wpisem</h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm text-slate-500 mb-5">Wypełnij pola, a zobaczysz jak wyglądałby wiersz w prawdziwej Księdze. Dane nie są zapisywane.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kol. 4 — Symbol i nr dowodu zakupu</label>
                      <input
                        type="text"
                        placeholder="np. FV 2026/04/001"
                        value={simForm.kol4}
                        onChange={e => setSimForm({...simForm, kol4: e.target.value})}
                        className={`w-full p-3 rounded-xl border text-sm font-medium text-slate-800 outline-none transition-all ${fieldError(simForm.kol4) ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kol. 5 — Nr fabryczny (S/N)</label>
                      <input
                        type="text"
                        placeholder="np. SN-C02ZM0XJ"
                        value={simForm.kol5}
                        onChange={e => setSimForm({...simForm, kol5: e.target.value})}
                        className={`w-full p-3 rounded-xl border text-sm font-medium text-slate-800 outline-none transition-all ${fieldError(simForm.kol5) ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kol. 6 — Nazwa z kodem SSUEW</label>
                      <input
                        type="text"
                        placeholder="np. SSUEW-KOM-NTB-001 Apple MacBook Pro"
                        value={simForm.kol6}
                        onChange={e => setSimForm({...simForm, kol6: e.target.value})}
                        className={`w-full p-3 rounded-xl border text-sm font-medium text-slate-800 outline-none transition-all sm:col-span-2 ${fieldError(simForm.kol6) ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kol. 7 — Cena jednostkowa (zł)</label>
                      <input
                        type="text"
                        placeholder="np. 7 499,00"
                        value={simForm.kol7}
                        onChange={e => setSimForm({...simForm, kol7: e.target.value})}
                        className={`w-full p-3 rounded-xl border text-sm font-medium text-slate-800 outline-none transition-all ${fieldError(simForm.kol7) ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setSimSubmitted(true)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all mb-6"
                  >
                    Generuj podgląd
                  </button>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="px-3 py-2 font-bold text-left">Lp.</th>
                          <th className="px-3 py-2 font-bold text-left">Kol. 4 — Dowód</th>
                          <th className="px-3 py-2 font-bold text-left">Kol. 5 — S/N</th>
                          <th className="px-3 py-2 font-bold text-left">Kol. 6 — Nazwa (kod SSUEW)</th>
                          <th className="px-3 py-2 font-bold text-left">Kol. 7 — Cena</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white border-t border-slate-200">
                          <td className="px-3 py-3 text-slate-500 font-mono">1</td>
                          <td className="px-3 py-3">{simForm.kol4 || <span className="text-slate-300 italic">FV 2026/04/001</span>}</td>
                          <td className="px-3 py-3">{simForm.kol5 || <span className="text-slate-300 italic">SN-XXXX</span>}</td>
                          <td className="px-3 py-3">{simForm.kol6 || <span className="text-slate-300 italic">SSUEW-YYY-XXX-000 Nazwa modelu</span>}</td>
                          <td className="px-3 py-3">{simForm.kol7 || <span className="text-slate-300 italic">0,00 zł</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7 — Częste błędy */}
          <section id="bledy" className="scroll-mt-20 mb-16">
            <SectionTitle icon={AlertOctagon} chapter="Sekcja 7" title="Częste błędy ewidencyjne" color="red" />
            <div className="space-y-3">
              {FAQ_ITEMS.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-start gap-3 p-5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-2">{item.q}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>{/* end flex layout */}

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-all hover:scale-110"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
