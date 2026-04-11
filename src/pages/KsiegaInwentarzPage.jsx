import { useState, useEffect } from 'react';
import {
  BookMarked, ChevronRight, ArrowUp,
  ClipboardList, Table2, FileText, AlertOctagon, Package
} from 'lucide-react';

// === NAV DATA ===
const NAV_ITEMS = [
  { id: 'czym-jest',       label: 'Czym jest Księga?' },
  { id: 'zanim-zaczniesz', label: 'Zanim zaczniesz' },
  { id: 'budowa',          label: 'Budowa strony' },
  { id: 'lewa-strona',     label: 'Lewa strona (kol. 1–7)' },
  { id: 'prawa-strona',    label: 'Prawa strona (kol. 8–15)' },
  { id: 'inwentaryzacja',  label: 'Inwentaryzacja otwarcia' },
  { id: 'czego-nie',       label: 'Czego nie wpisywać' },
  { id: 'relacja',         label: 'Relacja z ewidencją' },
];

const ALL_SECTION_IDS = [
  'czym-jest', 'zanim-zaczniesz', 'budowa',
  'lewa-strona', 'prawa-strona', 'inwentaryzacja', 'czego-nie', 'relacja',
];

// === DANE — LEWA STRONA (KOL. 1–7) ===
const LEWA_KOLUMNY = [
  {
    id: 'kol-1',
    nr: '1',
    tytul: 'Nr kolejny (Przychód)',
    opis: 'Wpisujesz kolejny wolny numer: 1, 2, 3... Ten numer staje się numerem inwentarzowym przedmiotu.',
    wskazowka: 'Naklej hologram lub nalepkę z tym numerem bezpośrednio na sprzęt — to jedyna fizyczna łączność między przedmiotem a Księgą. Nie pomijaj tej kolumny, nawet jeśli poprzednicy tak robili.',
    przyklad: '1, 2, 3 …',
  },
  {
    id: 'kol-2',
    nr: '2',
    tytul: 'Nr kolejny (Rozchód)',
    opis: 'Pozostaw pustą. Wypełniasz ją wyłącznie wtedy, gdy przedmiot jest trwale wykreślany z ewidencji.',
    wskazowka: 'Uzupełniasz tylko przy kasacji, kradzieży lub przekazaniu przedmiotu na zewnątrz.',
    przyklad: '— (zostawiasz puste przy przyjęciu)',
  },
  {
    id: 'kol-3',
    nr: '3',
    tytul: 'Data przychodu',
    opis: 'Data zdarzenia będącego podstawą wpisu. Przy zakupie — data faktury lub odbioru. Przy inwentaryzacji starych przedmiotów — data sporządzenia protokołu spisu z natury.',
    wskazowka: 'Nie wpisuj daty dzisiejszej jeśli zakup był wcześniej — wpisuj datę zdarzenia, nie datę wypełniania Księgi.',
    przyklad: '15.04.2026',
  },
  {
    id: 'kol-4',
    nr: '4',
    tytul: 'Symbol i nr dowodu',
    opis: 'Numer dokumentu, który uzasadnia wpis. Dla zakupu: numer faktury VAT. Dla spisu z natury: numer protokołu.',
    wskazowka: 'Bez tego pola wpis jest gołosłowny i niemożliwy do zweryfikowania.',
    przyklad: 'FV/45/2025 lub Spis z natury 04.2026',
  },
  {
    id: 'kol-5',
    nr: '5★',
    tytul: 'Nr fabryczny przedmiotu (S/N)',
    opis: 'Numer seryjny odczytany bezpośrednio ze sprzętu. Dla urządzeń elektronicznych jest to pole obowiązkowe — numer seryjny to jedyny sposób odróżnienia dwóch identycznych modeli.',
    wskazowka: 'Gwiazdka w nagłówku tej kolumny sygnalizuje: dla przedmiotów bez numeru seryjnego z natury (meble, wieszaki, akcesoria) pole pozostaw puste.',
    przyklad: 'SN-C02ZM0XJMD6T lub — (meble)',
  },
  {
    id: 'kol-6',
    nr: '6',
    tytul: 'Nazwa przedmiotu, opis i stan',
    opis: 'Pełna nazwa, model i stan techniczny. Format: [KOD JEDNOSTKI] Pełna nazwa modelu, stan: dobry / używany / zużyty',
    wskazowka: 'Wpisanie kodu wewnętrznego jednostki w tej kolumnie jest kluczowe — to w tym miejscu papierowy dokument łączy się z ewidencją cyfrową. Przykład dla SSUEW: SSUEW-LOG-001 Projektor Epson EB-X05, stan: dobry',
    przyklad: 'SSUEW-LOG-001 Projektor Epson EB-X05, stan: dobry',
  },
  {
    id: 'kol-7',
    nr: '7',
    tytul: 'Cena jednostkowa (zł / gr)',
    opis: 'Cena jednej sztuki wynikająca z dokumentu zakupu. Jeśli prowadzisz inwentaryzację starych przedmiotów bez dokumentacji, wartość ustala się komisyjnie lub na podstawie aktualnych cen rynkowych.',
    wskazowka: 'Okrągłe liczby bez podstawy dokumentowej to błąd — odnotuj wtedy w kolumnie 15, skąd pochodzi wycena.',
    przyklad: '1 299,00',
  },
];

// === DANE — PRAWA STRONA (KOL. 8–15) ===
const PRAWA_KOLUMNY = [
  {
    id: 'kol-8-10',
    nr: '8–10',
    tytul: 'Ilość (Przychód / Rozchód / Stan)',
    opis: 'Przy przyjęciu jednej sztuki: Przychód = 1, Rozchód = puste, Stan = 1. Przy kilku sztukach jednym dokumentem — odpowiednia liczba w każdej kolumnie.',
    wskazowka: 'Przy wykreśleniu: Rozchód = liczba wykreślanych sztuk, Stan = zaktualizowany stan po wykreśleniu.',
    przyklad: 'Przychód: 1 / Rozchód: — / Stan: 1',
  },
  {
    id: 'kol-11-13',
    nr: '11–13',
    tytul: 'Wartość (Przychód / Rozchód / Stan, zł / gr)',
    opis: 'Dokładnie to samo co ilość, ale wyrażone w złotówkach. Przy jednej sztuce wartość w kolumnie Przychód równa jest cenie jednostkowej z kolumny 7.',
    wskazowka: 'Wszystkie trzy pola muszą być spójne — błąd arytmetyczny tu jest błędem formalnym.',
    przyklad: 'Przychód: 1 299,00 / Rozchód: — / Stan: 1 299,00',
  },
  {
    id: 'kol-14',
    nr: '14',
    tytul: 'Przeciwstawny numer kolejny',
    opis: 'Numer pozycji powiązanej — używany przy przeniesieniach i odpisach. W standardowej codziennej ewidencji wyposażenia rzadko wypełniany.',
    wskazowka: 'Pozostaw puste przy standardowym przyjęciu na stan.',
    przyklad: '— (rzadko używane)',
  },
  {
    id: 'kol-15',
    nr: '15',
    tytul: 'Uwagi',
    opis: 'Tutaj wpisujesz wszystko, czego nie zmieściłeś w poprzednich kolumnach: lokalizację przedmiotu, informację o nadanym kodzie wewnętrznym, źródło wyceny przy inwentaryzacji, datę i podpis przy korekcie.',
    wskazowka: 'Błędnych wpisów nie wolno wymazywać ani zaklejać korektorem. Należy je przekreślić jedną linią tak, żeby treść pozostała czytelna, a w kolumnie 15 wpisać datę korekty i czytelny podpis osoby korygującej.',
    przyklad: 'Lokalizacja: Biuro SSUEW, D-105. Wycena rynkowa z dn. 10.04.2026.',
  },
];

// === DANE — TABELA PORÓWNAWCZA ===
const COMPARISON_ROWS = [
  { cecha: 'Charakter',      ksiega: 'Dokument prawny',                           ewidencja: 'Narzędzie operacyjne' },
  { cecha: 'Co potwierdza',  ksiega: 'Że przedmiot należy do jednostki',          ewidencja: 'Gdzie jest i kto go ma' },
  { cecha: 'Co łączy oba',   ksiega: 'Kod wewnętrzny jednostki w kol. 6',        ewidencja: 'Ten sam kod w bazie danych' },
];

// === MAIN COMPONENT ===
export default function KsiegaInwentarzPage() {
  const [activeSection, setActiveSection] = useState('czym-jest');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);

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
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0);
      setShowScrollTop(scrollTop > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // === SUB-COMPONENTS ===

  const SectionTitle = ({ icon: Icon, chapter, title, color = 'emerald' }) => {
    const colors = {
      emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'text-emerald-500' },
      blue:    { bg: 'bg-blue-100',    icon: 'text-blue-600',    label: 'text-blue-500'    },
      teal:    { bg: 'bg-teal-100',    icon: 'text-teal-600',    label: 'text-teal-500'    },
      amber:   { bg: 'bg-amber-100',   icon: 'text-amber-600',   label: 'text-amber-500'   },
      indigo:  { bg: 'bg-indigo-100',  icon: 'text-indigo-600',  label: 'text-indigo-500'  },
      purple:  { bg: 'bg-purple-100',  icon: 'text-purple-600',  label: 'text-purple-500'  },
      red:     { bg: 'bg-red-100',     icon: 'text-red-600',     label: 'text-red-500'     },
      slate:   { bg: 'bg-slate-100',   icon: 'text-slate-600',   label: 'text-slate-500'   },
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

  const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>{children}</div>
  );

  const KolumnaAccordion = ({ id, nr, tytul, opis, wskazowka, przyklad }) => {
    const open = openAccordion === id;
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => setOpenAccordion(open ? null : id)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">Kol. {nr}</span>
            <span className="font-semibold text-slate-800 text-sm">{tytul}</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && (
          <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100 space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed pt-3">{opis}</p>
            {wskazowka && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className="text-amber-600 text-xs font-black uppercase tracking-wide shrink-0 mt-0.5">Wskazówka</span>
                <p className="text-xs text-amber-800 leading-relaxed">{wskazowka}</p>
              </div>
            )}
            {przyklad && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Przykład:</span>
                <code className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-700">{przyklad}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // === RETURN JSX ===
  return (
    <div className="min-h-screen bg-slate-50">

      {/* PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-100">
        <div className="h-0.5 bg-emerald-600 transition-all duration-75" style={{ width: `${readingProgress}%` }} />
      </div>

      {/* MOBILE SELECT */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5">
        <select value={activeSection} onChange={e => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400">
          {NAV_ITEMS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* FLEX LAYOUT */}
      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white pt-20 pb-32">
          <div className="px-4 mb-4 flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Księga Inwentarzowa</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSection === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-32 [&_p]:leading-relaxed">

          {/* ═══ CZYM JEST KSIĘGA ═══ */}
          <section id="czym-jest" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookMarked} chapter="Sekcja 1" title="Czym jest Księga Inwentarzowa?" color="emerald" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">
                Księga Inwentarzowa (<strong>format K-205/60</strong>) to papierowy rejestr wyposażenia będącego własnością jednostki — w tym przypadku SSUEW lub Twojej organizacji. Ewidencjonuje się w niej wszystkie składniki majątkowe, które nie kwalifikują się jako środki trwałe: sprzęt biurowy, AGD, wyposażenie sal, akcesoria.
              </p>
              <p className="text-slate-700">
                Księga ma charakter <strong>dokumentu źródłowego</strong> — jest nadrzędna wobec wszelkich arkuszy, baz danych i systemów cyfrowych. To ona jest dowodem prawnym na to, że dany przedmiot należy do majątku jednostki.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                  Podstawą prawną prowadzenia ewidencji wyposażenia jest <strong>ustawa z dnia 29 września 1994 r. o rachunkowości</strong> (t.j. Dz.U. 2023 poz. 120) oraz wewnętrzne regulacje Kwestury Uniwersytetu Ekonomicznego we Wrocławiu.
                </p>
              </div>
            </Card>
          </section>

          {/* ═══ ZANIM ZACZNIESZ ═══ */}
          <section id="zanim-zaczniesz" className="scroll-mt-20 mb-16">
            <SectionTitle icon={ClipboardList} chapter="Sekcja 2" title="Zanim zaczniesz — co musisz mieć przy sobie" color="blue" />
            <Card>
              <p className="text-slate-700 mb-5">Przed pierwszym wpisem przygotuj:</p>
              <div className="space-y-3">
                {[
                  ['Fizyczny przedmiot', 'lub protokół jego przyjęcia'],
                  ['Dokument źródłowy', 'faktura VAT, protokół darowizny lub protokół spisu z natury — potwierdzający nabycie'],
                  ['Numer seryjny urządzenia (S/N)', 'odczytany bezpośrednio ze sprzętu'],
                  ['Nadany kod wewnętrzny jednostki', 'np. SSUEW-LOG-001'],
                  ['Hologram lub nalepka z numerem inwentarzowym', 'do naklejenia na sprzęt po wpisaniu do Księgi'],
                ].map(([tytul, opis], i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tytul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ═══ BUDOWA STRONY ═══ */}
          <section id="budowa" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Table2} chapter="Sekcja 3" title="Budowa strony — dwie połówki, jeden wiersz" color="indigo" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">
                Każda pozycja inwentarzowa zajmuje jeden wiersz, który jest rozłożony na dwie strony. <strong>Lewa strona (kolumny 1–7)</strong> identyfikuje przedmiot, <strong>prawa strona (kolumny 8–15)</strong> rejestruje ilości, wartości i uwagi.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium">
                  Obie strony muszą być wypełnione — sam wpis nazwy bez danych liczbowych to błąd ewidencyjny.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="font-black text-blue-800 text-sm mb-2">Lewa strona — identyfikacja</p>
                  <p className="text-xs text-blue-700">Kolumny 1–7: kto, co, skąd, numer seryjny, nazwa, cena</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="font-black text-teal-800 text-sm mb-2">Prawa strona — ilości i wartości</p>
                  <p className="text-xs text-teal-700">Kolumny 8–15: ilość, wartość, stan, uwagi</p>
                </div>
              </div>
            </Card>
          </section>

          {/* ═══ LEWA STRONA ═══ */}
          <section id="lewa-strona" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Sekcja 4" title="Wypełnianie — lewa strona (kolumny 1–7)" color="teal" />
            <p className="text-slate-600 text-sm mb-4">Kliknij kolumnę, aby zobaczyć opis, wskazówkę i przykład.</p>
            <div className="space-y-2">
              {LEWA_KOLUMNY.map(k => <KolumnaAccordion key={k.id} {...k} />)}
            </div>
          </section>

          {/* ═══ PRAWA STRONA ═══ */}
          <section id="prawa-strona" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Sekcja 5" title="Wypełnianie — prawa strona (kolumny 8–15)" color="purple" />
            <p className="text-slate-600 text-sm mb-4">Kliknij kolumnę, aby zobaczyć opis, wskazówkę i przykład.</p>
            <div className="space-y-2">
              {PRAWA_KOLUMNY.map(k => <KolumnaAccordion key={k.id} {...k} />)}
            </div>
          </section>

          {/* ═══ INWENTARYZACJA OTWARCIA ═══ */}
          <section id="inwentaryzacja" className="scroll-mt-20 mb-16">
            <SectionTitle icon={ClipboardList} chapter="Sekcja 6" title="Inwentaryzacja otwarcia — gdy przejmujesz zaniedbany sprzęt" color="amber" />
            <Card className="space-y-5 mb-4">
              <p className="text-slate-700">
                Jeśli przejmujesz organizację, której Księga była prowadzona niedbale lub wcale, <strong>nie dopisujesz kolejnych pozycji na koniec istniejących wpisów</strong>. Zamiast tego:
              </p>
              <div className="space-y-4">
                {[
                  ['Gruba kreska', 'Pod ostatnim istniejącym wpisem rysuj wyraźną poziomą linię.'],
                  ['Nagłówek nowej sekcji', 'Bezpośrednio nad nową sekcją wpisz nagłówek: INWENTARYZACJA OTWARCIA — NOWY SYSTEM [DATA].'],
                  ['Protokół spisu z natury', 'Dla każdego przedmiotu znalezionego w magazynie sporządź protokół spisu z natury — to on staje się dokumentem źródłowym dla kolumny 4.'],
                  ['Nowe wpisy poniżej kreski', 'Każdy przedmiot wpisz jako nową pozycję, tym razem wypełniając wszystkie kolumny.'],
                  ['Adnotacje w starej części', 'W starej części Księgi, w kolumnie 15 przy każdym odnalezionym przedmiocie, dopisz ołówkiem nowo nadany kod wewnętrzny.'],
                  ['Przedmioty nieodnalezione', 'Przedmiotów, których nie udało się odnaleźć fizycznie, nie wykreślaj pochopnie — odnotuj jako „nieodnaleziony podczas inwentaryzacji [data]" i wyjaśnij odrębnym protokołem.'],
                ].map(([tytul, opis], i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center shrink-0">{i + 1}</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tytul}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{opis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ═══ CZEGO NIE WPISYWAĆ ═══ */}
          <section id="czego-nie" className="scroll-mt-20 mb-16">
            <SectionTitle icon={AlertOctagon} chapter="Sekcja 7" title="Czego nie wpisywać do Księgi" color="red" />
            <Card className="space-y-4">
              <p className="text-slate-700">
                Do Księgi Inwentarzowej <strong>nie wpisuje się przedmiotów należących do innego podmiotu</strong> — nawet jeśli fizycznie znajdują się w Twoim lokalu.
              </p>
              <p className="text-slate-700">
                Sprzęt użyczony przez uczelnię, fundację lub inną organizację ewidencjonuje właściciel, a nie użytkownik. Jego obecność w Twojej Księdze może stwarzać nieporozumienia prawne i komplikować rozliczenia przy zwrocie.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800 font-medium">
                  Przykład: projektor użyczony przez Kwesturę UEW powinien być w ewidencji UEW — nie SSUEW. Możesz odnotować jego obecność w swoim lokalu jako informację w systemie CRA, ale nie wpisujesz go do Księgi.
                </p>
              </div>
            </Card>
          </section>

          {/* ═══ RELACJA Z EWIDENCJĄ CYFROWĄ ═══ */}
          <section id="relacja" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Package} chapter="Sekcja 8" title="Jak Księga współpracuje z systemem cyfrowym" color="slate" />
            <Card className="space-y-4 mb-4">
              <p className="text-slate-700">
                Księga i ewidencja cyfrowa działają równolegle i muszą być ze sobą spójne. Niezgodność między nimi — np. przedmiot w systemie, którego nie ma w Księdze, lub odwrotnie — to <strong>błąd wymagający wyjaśnienia i korekty w obu miejscach</strong>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-5 py-3 font-black text-slate-500 uppercase tracking-wider text-xs">Cecha</th>
                      <th className="text-left px-5 py-3 font-black text-slate-500 uppercase tracking-wider text-xs">Księga Inwentarzowa</th>
                      <th className="text-left px-5 py-3 font-black text-slate-500 uppercase tracking-wider text-xs">Ewidencja cyfrowa (CRA)</th>
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
              <div className="bg-slate-800 text-white rounded-xl p-4">
                <p className="text-sm font-medium leading-relaxed">
                  Zasada jest prosta: jeśli czegoś nie ma w Księdze, <strong>prawnie nie istnieje w majątku jednostki</strong> — niezależnie od tego, co pokazuje system cyfrowy.
                </p>
              </div>
            </Card>
          </section>

          <div className="border-t border-slate-200 pt-8 pb-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] text-center">
              Księga Inwentarzowa · Samorząd Studentów UEW · Przewodnik prowadzenia ewidencji
            </p>
          </div>

        </main>
      </div>

      {/* SCROLL TO TOP — powyżej AIBota (fixed bottom-6 right-6) */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-50 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:shadow-xl transition-all">
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
