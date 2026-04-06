import { useState, useEffect } from 'react';
import {
  BookOpen, CheckSquare, Square, ChevronRight, ArrowUp,
  Clock, AlertTriangle, CheckCircle, XCircle, Users, FileText
} from 'lucide-react';

// ===================== DANE NAWIGACJI =====================
const NAV_ITEMS = [
  { id: 'wstep', label: 'Wstęp' },
  { id: 'slownik', label: 'Słownik pojęć i osób' },
  { id: 'przed', label: 'Przed spotkaniem' },
  { id: 'podczas', label: 'Podczas spotkania' },
  { id: 'po', label: 'Po spotkaniu' },
  {
    id: 'typy',
    label: 'Typy protokołów',
    children: [
      { id: 'typ-sks', label: 'SKS' },
      { id: 'typ-russ', label: 'RUSS' },
      { id: 'typ-absolutoryjny', label: 'Absolutoryjny' },
      { id: 'typ-komisyjny', label: 'Komisyjny' },
      { id: 'typ-projektowy', label: 'Projektowy' },
      { id: 'typ-roboczy', label: 'Roboczy' },
      { id: 'typ-kpue', label: 'KPUE' },
    ],
  },
  { id: 'bledy', label: 'Częste błędy' },
  { id: 'wzory-szablony', label: 'Wzory i szablony' },
];

const ALL_SECTION_IDS = [
  'wstep', 'slownik', 'przed', 'podczas', 'po',
  'typy', 'typ-sks', 'typ-russ', 'typ-absolutoryjny',
  'typ-komisyjny', 'typ-projektowy', 'typ-roboczy', 'typ-kpue',
  'bledy',
  'wzory-szablony',
];

const TYPE_CHILD_IDS = ['typ-sks', 'typ-russ', 'typ-absolutoryjny', 'typ-komisyjny', 'typ-projektowy', 'typ-roboczy', 'typ-kpue'];

// ===================== CHECKLISTY =====================
const BEFORE_ITEMS = [
  { id: 'b1', text: 'Pobierz wzór protokołu właściwy dla danego typu spotkania' },
  { id: 'b2', text: 'Uzupełnij nagłówek — numer spotkania, data, miejsce, godzina rozpoczęcia, numer sprawy (zostaw puste), prowadzący, protokolant' },
  { id: 'b3', text: 'Przepisz porządek obrad do protokołu (otrzymasz od Członka Zarządu ds. Administracji)' },
  { id: 'b4', text: 'Przygotuj listę obecności z pełnymi imionami, nazwiskami i funkcjami uczestników' },
  { id: 'b5', text: 'Dla RUSS: sprawdź pełen skład Rady, policz wymagane quorum (minimum 8 Radnych)' },
  { id: 'b6', text: 'Dla absolutorium: sprawdź kto prowadzi (SKW, nie Zarząd) i skład Komisji Rewizyjnej pełniącej funkcję Komisji Skrutacyjnej' },
  { id: 'b7', text: 'Naładuj urządzenie — laptop lub tablet do notatek' },
  { id: 'b8', text: 'Jeśli planujesz nagrywać — przygotuj komunikat, który przekażesz przewodniczącemu na początku spotkania' },
];

const AFTER_ITEMS = [
  { id: 'a1', text: 'Sporządź protokół na podstawie notatek (i nagrania, jeśli robiłeś)' },
  { id: 'a2', text: 'Sprawdź wszystkie tytuły i funkcje osób — korzystaj z tabeli w Rozdziale 1' },
  { id: 'a3', text: 'Sprawdź interpunkcję i ortografię — zwróć uwagę na przecinki i wielkie litery' },
  { id: 'a4', text: 'Sprawdź czy wszystkie wyniki głosowań są kompletne (za / przeciw / wstrzymujący się)' },
  { id: 'a5', text: 'Sprawdź czy godziny otwarcia i zamknięcia są wpisane' },
  { id: 'a6', text: 'Sprawdź czy nie ma nieformalnych notatek redakcyjnych w treści' },
  { id: 'a7', text: 'Wyślij do Członka Zarządu ds. Administracji SSUEW do weryfikacji' },
  { id: 'a8', text: 'Po akceptacji — przekaż do archiwum zgodnie z procedurami SSUEW' },
  { id: 'a9', text: 'Usuń nagranie, jeśli robiłeś' },
];

// ===================== SZABLONY DOKUMENTÓW =====================
const TEMPLATE_ITEMS = [
  { id: 't1',  name: 'Protokół SKS',                      driveUrl: 'https://docs.google.com/document/d/1jQCDYvkrSUBu1Vr6m6QghX0wdduFVcEZ/edit?usp=sharing&ouid=110583282577275893044&rtpof=true&sd=true' },
  { id: 't2',  name: 'Protokół RUSS',                     driveUrl: 'https://docs.google.com/document/d/1AH6Nu16V05Rr6V6SZq93003iwxcy9hU0/edit?usp=sharing&ouid=110583282577275893044&rtpof=true&sd=true' },
  { id: 't3',  name: 'Protokół Absolutoryjny',            driveUrl: 'https://docs.google.com/document/d/1h8oJKbXDsppRHjfV9R5uy7klHMFFcK5GBrCaptZihdo/edit?usp=sharing' },
  { id: 't4',  name: 'Protokół Komisyjny',                driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't5',  name: 'Protokół Projektowy',               driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't6',  name: 'Protokół Roboczy',                  driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't7',  name: 'Protokół KPUE',                     driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't8',  name: 'Lista obecności (SKS)',              driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't9',  name: 'Lista obecności (RUSS)',             driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't10', name: 'Wzór uchwały',                      driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't11', name: 'Wzór wniosku formalnego',           driveUrl: 'TODO: wstaw_link_google_drive' },
  { id: 't12', name: 'Wzór karty do głosowania',          driveUrl: 'TODO: wstaw_link_google_drive' },
];

// ===================== ORGANY (Akordeony 1C) =====================
const ORGANS = [
  {
    id: 'org-russ',
    title: 'RUSS — Rada Uczelniana Samorządu Studentów',
    content: 'Najwyższy organ uchwałodawczy Samorządu Studentów UEW. Radę tworzy 15 studentów wybranych zgodnie z Ordynacją Wyborczą. Obraduje na posiedzeniach zwyczajnych oraz nadzwyczajnych, a jej posiedzenia co do zasady mają charakter otwarty. To RUSS podejmuje uchwały, opiniuje i zatwierdza sprawy przypisane jej w Regulaminie Samorządu Studentów.',
  },
  {
    id: 'org-sks',
    title: 'Spotkanie Komisji Samorządu',
    content: 'Otwarte spotkanie Komisji Samorządu Studentów zwoływane przez Przewodniczącego Samorządu Studentów z własnej inicjatywy albo na wniosek uprawnionych osób. Na Spotkaniach Samorządu Studentów prezentowane są wyniki prac Rady, Przewodniczącego, Wiceprzewodniczących, Członków Zarządu oraz inne istotne informacje dla społeczności akademickiej.',
  },
  {
    id: 'org-skw',
    title: 'SKW — Studencka Komisja Wyborcza',
    content: 'Trzyosobowy organ wyborczy Samorządu Studentów oraz działalności studenckiej na UEW. Odpowiada za organizację i przeprowadzanie wyborów przewidzianych w Regulaminie tudzież Ordynacji Wyborczej. Posiedzenie Rady, na którym dokonywany jest wybór Przewodniczącego Samorządu Studentów, zwołuje i prowadzi właśnie SKW.',
  },
  {
    id: 'org-kr',
    title: 'Komisja Rewizyjna',
    content: 'Trzyosobowy organ kontrolny Samorządu Studentów. Do jej zadań należy m.in. kontrola realizacji budżetu Samorządu, rozpatrywanie skarg studentów na działania organów Samorządu oraz rozstrzyganie ważności wyborów i głosowań w sprawach wskazanych w Regulaminie.',
  },
  {
    id: 'org-ke',
    title: 'Kolegium Elektorów',
    content: 'Organ wyborczy Uniwersytetu Ekonomicznego we Wrocławiu. To Kolegium Elektorów dokonuje wyboru Rektora UEW i działa na podstawie przepisów uczelnianych, a nie regulacji Samorządu Studentów.',
  },
  {
    id: 'org-kd',
    title: 'Komisja Dyscyplinarna dla Studentów',
    content: 'Organ uczelniany właściwy w sprawach odpowiedzialności dyscyplinarnej studentów. Student ponosi odpowiedzialność dyscyplinarną za postępowanie uchybiające godności studenta oraz za naruszenie przepisów obowiązujących w Uczelni, podlegając Komisji Dyscyplinarnej dla Studentów.',
  },
  {
    id: 'org-kwest',
    title: 'Kwestor / Kwestura',
    content: 'Kwestor pełni funkcję głównego księgowego Uczelni i odpowiada za prowadzenie oraz organizację obsługi finansowo-księgowej działalności UEW, a także za gospodarkę finansową w zakresie zadań realizowanych przez podległe komórki. W praktyce jest to kluczowy obszar uczelnianej administracji finansowej.',
  },
  {
    id: 'org-dzn',
    title: 'Dział Zarządzania Nieruchomościami',
    content: 'Jednostka administracyjna UEW podległa Zastępcy Kanclerza ds. Technicznych. Zajmuje się zarządzaniem nieruchomościami, w tym m.in. utrzymaniem czystości, obsługą szatni i portierni, ochroną Uczelni oraz najmem sal, powierzchni i terenu.',
  },
  {
    id: 'org-dss',
    title: 'Dział Świadczeń Stypendialnych',
    content: 'Jednostka UEW odpowiedzialna za całokształt procesu związanego ze świadczeniami stypendialnymi dla studentów I i II stopnia oraz za wypłatę stypendiów NAWA dla cudzoziemców.',
  },
  {
    id: 'org-cods',
    title: 'Centrum Obsługi Dydaktyki i Spraw Studenckich',
    content: 'Jednostka UEW odpowiadająca za inicjowanie, koordynowanie i prowadzenie procesów związanych z organizacją dydaktyki — od kandydata do absolwenta. W jego strukturze działają m.in. Dziekanat, Biuro Planowania i Rozliczania Dydaktyki, Biuro Rekrutacji oraz Sekcja ds. Relacji z Otoczeniem Edukacyjnym.',
  },
  {
    id: 'org-cku',
    title: 'Centrum Kształcenia Ustawicznego (CKU)',
    content: 'Pozawydziałowa jednostka organizacyjna UEW realizująca ofertę edukacyjną w formule uczenia się przez całe życie. CKU prowadzi przede wszystkim studia podyplomowe, kursy oraz szkolenia, odpowiadając na potrzeby rozwoju zawodowego różnych grup odbiorców. Sama nazawa "CKU" może być również odwołaniem do budynku o tym samym akronimie - znajduje się na Kampusie B, a także mieści w sobie Aule Audytoryjną (1 CKU), która jest uważana za najbardziej reprezentatywną salę na Uczelni i mieści 406 osób.',
  },
  {
    id: 'org-fue',
    title: 'FUE — Forum Uczelni Ekonomicznych',
    content: 'Autonomiczne porozumienie samorządów studenckich uczelni ekonomicznych w Polsce i jednocześnie komisja branżowa Parlamentu Studentów Rzeczypospolitej Polskiej. Jego celem jest reprezentowanie interesów studentów uczelni ekonomicznych oraz rozwijanie współpracy i integracji między samorządami. W skład FUE wchodzą: Uniwersytet Ekonomiczny w Poznaniu, Uniwersytet Ekonomiczny w Katowicach, Uniwersytet Ekonomiczny w Krakowie, Szkoła Główna Handlowa w Warszawie oraz Uniwersytet Ekonomiczny we Wrocławiu.',
  },
  {
    id: 'org-kpue',
    title: 'KPUE — Konferencja Polskich Uczelni Ekonomicznych',
    content: 'Cykliczne spotkanie organizowane w ramach Forum Uczelni Ekonomicznych. To przestrzeń obrad, wymiany doświadczeń i podejmowania decyzji dotyczących dalszego funkcjonowania FUE oraz wspólnych projektów środowiska uczelni ekonomicznych.',
  },
  {
    id: 'org-joss',
    title: 'JOSS — Jednostki Organizacyjne Samorządu Studentów',
    content: 'Jednostki organizacyjne działające w strukturze Samorządu Studentów UEW. Regulamin Samorządu przewiduje ich istnienie jako elementu struktury SSUEW, a szczegółowe zasady ich działania określają właściwe akty wewnętrzne. Stanowią nierozłączną część Samorządu, a są to: IKSS — Informacja Kulturalno-Sportowa Studentów oraz BIT - Klub Podróżników "Because I Travel".',
  },
];

// ===================== CZĘSTE BŁĘDY =====================
const ERRORS = [
  {
    n: 1,
    title: 'Błędne tytuły i funkcje osób',
    desc: 'Pisanie "Rektor Okruszek" zamiast "Prorektor ds. Studenckich i Kształcenia dr hab. inż. Andrzej Okruszek, prof. UEW". To nie jest kwestia uprzejmości — to błąd merytoryczny. Protokół z błędnym tytułem osoby jest dokumentem z wadą.',
    fix: 'Zawsze korzystaj z tabeli w Rozdziale 1 przed oddaniem protokołu.',
  },
  {
    n: 2,
    title: 'Niekompletne wyniki głosowań',
    desc: '"Uchwała została przyjęta" lub "przyjęto jednogłośnie" bez podania ile osób głosowało za, przeciw i wstrzymało się. To błąd krytyczny — uchwała może być podważona.',
    fix: 'Zawsze zapisuj trzy liczby oddzielnie: za / przeciw / wstrzymujących się.',
  },
  {
    n: 3,
    title: 'Zbyt wąski opis punktów',
    desc: '"Omówiono sprawy bieżące" lub "dyskutowano o projekcie X". To nagłówek, nie protokół.',
    fix: 'Każdy punkt musi mieć treść — kto co powiedział, jakie ustalenia, jakie decyzje.',
  },
  {
    n: 4,
    title: 'Zbyt szeroki opis — stenografia dyskusji',
    desc: 'Zapisywanie każdego zdania każdej osoby sprawia że protokół jest nieczytelny i nikt przez niego nie przebrnął.',
    fix: 'Wyodrębniaj decyzje, ustalenia i zobowiązania — resztę syntetyzuj w kilku zdaniach.',
  },
  {
    n: 5,
    title: 'Nieformalny ton językowy',
    desc: '"Ćwikła stwierdziła że to nie ma sensu" zamiast "Przewodnicząca SSUEW Emilia Ćwiklińska wyraziła sprzeciw wobec proponowanego rozwiązania". Protokół jest dokumentem urzędowym — zdrobnienia, pseudonimy i wykrzykniki go dyskwalifikują.',
    fix: 'Przed oddaniem przeczytaj protokół i zamień każde imiesłowo, zdrobnienie i potoczne określenie na formę urzędową.',
  },
  {
    n: 6,
    title: 'Informacje prywatne w treści',
    desc: '"Karlos → był u fryzjera" lub "Madzia zdała excela na czwórkę" — informacje prywatne uczestników nie mają miejsca w żadnym protokole, nawet roboczym.',
    fix: 'Zapisuj tylko to, co dotyczy przedmiotu spotkania.',
  },
  {
    n: 7,
    title: 'Brak godzin otwarcia i zamknięcia',
    desc: 'Godziny są obowiązkowym elementem każdego protokołu bez wyjątku. Protokół bez godzin jest niekompletny.',
    fix: 'Zapisz godziny od razu na początku spotkania i na końcu — nie polegaj na pamięci!',
  },
  {
    n: 8,
    title: 'Brak podpisów i daty sporządzenia',
    desc: 'Protokół bez podpisu protokolanta (i Członka Zarządu ds. Administracji SSUEW w przypadku RUSS) nie jest dokumentem.',
    fix: 'Dodaj podpis i datę sporządzenia, zanim wyślesz do weryfikacji.',
  },
  {
    n: 9,
    title: 'Spóźnione oddanie',
    desc: 'Protokół oddany po terminie traci swoją wartość. Ustalenia "wychładzają się" — po dwóch tygodniach trudno odtworzyć kontekst.',
    fix: 'Traktuj termin z Rozdziału 4 jako nieprzekraczalny! Sporządzaj protokół najlepiej w ciągu 24–48h od spotkania kiedy pamięć jest świeża.',
  },
  {
    n: 10,
    title: 'Notatki redakcyjne w treści',
    desc: '"tu sprawdzić", "uzupełnić później", "WAŻNE!!!" lub "PRZEKAZANO GORĄCE ZAPROSZENIE!" w treści protokołu.',
    fix: 'Jeśli czegoś nie jesteś pewien — zostaw pusty nawias [???] i zapytaj Członka Zarządu ds. Administracji przed oddaniem. Żadne osobiste notatki nie mogą trafić do finalnego dokumentu.',
  },
  {
    n: 11,
    title: 'Niespójność formalna w obrębie dokumentu',
    desc: 'Raz "Przewodnicząca SSUEW", raz "Ćwikła", raz "Pani Przewodnicząca" — w odniesieniu do tej samej osoby w tym samym protokole.',
    fix: 'Wybierz jeden sposób i stosuj go konsekwentnie. Standard: pełna funkcja + imię i nazwisko przy pierwszym użyciu, sama funkcja przy kolejnych.',
  },
];

// ===================== HELPER: niełamliwa spacja po polskich spójnikach =====================
// Zapobiega czarnym wdowom: "i", "w", "z", "o", "a", "u", "do", "we", "ze", "że", "bo", "na", "po", "od"
function nb(text) {
  return text.replace(/ (i|w|z|o|a|u|do|we|ze|że|bo|na|po|od|ku|by) /g, ' $1\u00A0');
}

// ===================== GŁÓWNY KOMPONENT =====================
export default function KompendiumPage() {
  const [activeSection, setActiveSection] = useState('wstep');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kompendium_checklist_v1');
      return saved ? JSON.parse(saved) : { before: [], after: [] };
    } catch {
      return { before: [], after: [] };
    }
  });

  // Scroll na górę przy wejściu
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // IntersectionObserver — aktywna sekcja
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    ALL_SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Scroll to top detector + reading progress + last-section highlight fix
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0);
      setShowScrollTop(scrollTop > 200);
      // Ostatnia sekcja (wzory-szablony) jest zbyt blisko końca strony, żeby IntersectionObserver ją wyłapał
      // — aktywujemy ją ręcznie gdy jesteśmy w ciągu 150px od dołu dokumentu
      if (docHeight > 0 && scrollTop >= docHeight - 150) {
        setActiveSection('wzory-szablony');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleCheck = (group, itemId) => {
    const newState = { ...checklistState };
    const arr = newState[group] || [];
    newState[group] = arr.includes(itemId) ? arr.filter((x) => x !== itemId) : [...arr, itemId];
    setChecklistState(newState);
    sessionStorage.setItem('kompendium_checklist_v1', JSON.stringify(newState));
  };

  const isTypActive = TYPE_CHILD_IDS.includes(activeSection) || activeSection === 'typy';
  const isActive = (id) => activeSection === id || (id === 'typy' && isTypActive);

  // Wszystkie sekcje dla mobile select
  const allSelectOptions = NAV_ITEMS.flatMap((item) =>
    item.children
      ? [{ id: item.id, label: item.label, depth: 0 }, ...item.children.map((c) => ({ id: c.id, label: '  ' + c.label, depth: 1 }))]
      : [{ id: item.id, label: item.label, depth: 0 }]
  );

  // ===================== SUB-KOMPONENTY =====================
  const DeadlineBadge = ({ text, color }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border border-blue-200',
      orange: 'bg-orange-100 text-orange-700 border border-orange-200',
      red: 'bg-red-100 text-red-700 border border-red-200',
      green: 'bg-green-100 text-green-700 border border-green-200',
      gray: 'bg-slate-100 text-slate-600 border border-slate-200',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors[color] || colors.gray}`}>
        <Clock className="w-3 h-3" />
        {text}
      </span>
    );
  };

  const Checklist = ({ group, items }) => (
    <div className="space-y-2">
      {items.map((item) => {
        const checked = (checklistState[group] || []).includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => toggleCheck(group, item.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              checked
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-white border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50/30'
            }`}
          >
            {checked ? (
              <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm font-medium leading-snug ${checked ? 'line-through opacity-60' : ''}`}>
              {item.text}
            </span>
          </button>
        );
      })}
    </div>
  );

  const Accordion = ({ id, title, content }) => {
    const open = openAccordion === id;
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={(e) => { setOpenAccordion(open ? null : id); e.currentTarget.blur(); }}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
        >
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </button>
        {open && (
          <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed pt-3">{nb(content)}</p>
          </div>
        )}
      </div>
    );
  };

  const ProtocolCard = ({ id, title, deadline, deadlineColor, children }) => (
    <section id={id} className="scroll-mt-20 mb-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800">{title}</h3>
          </div>
          <DeadlineBadge text={deadline} color={deadlineColor} />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </section>
  );

  const SectionTitle = ({ icon: Icon, chapter, title, color = 'violet' }) => {
    const colors = {
      violet: { bg: 'bg-violet-100', icon: 'text-violet-600', label: 'text-violet-500' },
      blue:   { bg: 'bg-blue-100',   icon: 'text-blue-600',   label: 'text-blue-500'   },
      purple: { bg: 'bg-purple-100', icon: 'text-purple-600', label: 'text-purple-500' },
      teal:   { bg: 'bg-teal-100',   icon: 'text-teal-600',   label: 'text-teal-500'   },
      green:  { bg: 'bg-green-100',  icon: 'text-green-600',  label: 'text-green-500'  },
      amber:  { bg: 'bg-amber-100',  icon: 'text-amber-600',  label: 'text-amber-500'  },
      indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', label: 'text-indigo-500' },
      red:    { bg: 'bg-red-100',    icon: 'text-red-600',    label: 'text-red-500'    },
    };
    const c = colors[color] || colors.violet;
    return (
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        )}
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${c.label} mb-0.5`}>{chapter}</p>
          <h2 className="text-2xl font-black text-slate-800">{title}</h2>
        </div>
      </div>
    );
  };

  const SectionIntro = ({ items }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Co znajdziesz w tej sekcji</p>
      <ul className="space-y-1">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="text-slate-400 shrink-0 mt-0.5">•</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const TemplateCard = ({ name, url }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-start gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all"
    >
      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
        <FileText className="w-5 h-5 text-violet-600" />
      </div>
      <p className="text-sm font-bold text-slate-800 leading-snug flex-1">{name}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 text-white text-xs font-black rounded-xl group-hover:bg-violet-700 transition-colors">
        Otwórz
      </span>
    </a>
  );

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-slate-50">

      {/* PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-100">
        <div
          className="h-0.5 bg-violet-600 transition-all duration-75"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* MOBILE SELECT */}
      <div className="lg:hidden sticky top-[49px] z-30 bg-white border-b border-slate-200 px-4 py-2.5">
        <select
          value={activeSection}
          onChange={(e) => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400"
        >
          {allSelectOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* GŁÓWNY UKŁAD */}
      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto border-r border-slate-200 bg-white py-6">
          <nav className="px-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.id);
              if (item.children) {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        active
                          ? 'bg-violet-100 text-violet-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <span>Typy protokołów</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isTypActive ? 'rotate-90' : ''}`} />
                    </button>
                    {isTypActive && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-violet-200 pl-3">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => scrollTo(child.id)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              activeSection === child.id
                                ? 'bg-violet-100 text-violet-700 font-bold'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* TREŚĆ GŁÓWNA */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-24 [&_p]:text-justify [&_p]:hyphens-auto [&_p]:text-pretty">

          {/* ===== ROZDZIAŁ 0 — WSTĘP ===== */}
          <section id="wstep" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookOpen} chapter="Rozdział 0" title="Wstęp" color="blue" />
            <SectionIntro items={['Dlaczego protokół jest ważny dla instytucji - jaką jest Samorząd', 'Rola protokolanta — co uchwycić, co pominąć', 'Jak korzystać z tego Kompendium']} />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <p className="text-slate-700 leading-relaxed">
                Protokół to nie biurokratyczny obowiązek — to <strong>pamięć instytucjonalna Samorządu</strong>. Za trzy lata ktoś sięgnie po protokół z ostatniego posiedzenia RUSS i będzie chciał wiedzieć co dokładnie postanowiono i dlaczego. Jeśli protokół jest źle napisany — tej wiedzy nie dostanie. Przepada razem z kadencją...
              </p>
              <p className="text-slate-700 leading-relaxed">
                Rolą protokolanta jest nie stenografować każde słowo, ale <strong>uchwycić to co ważne</strong>: decyzje, głosowania, zobowiązania, aktualne stanowiska. Reszta to zwykły szum!
              </p>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mt-2">
                <p className="text-sm text-violet-800 leading-relaxed">
                  Niniejsze Kompendium zostało opracowane przez <strong>Członka Zarządu ds. Administracji SSUEW</strong> jako jedyne rzetelne źródło wiedzy protokolantów Samorządu Studentów UEW. Znajdziesz tu wszystko — od słownika pojęć przez checklisty aż po omówienie każdego typu protokołu z osobna. Jeśli masz wątpliwości, których tu nie rozstrzygamy — skontaktuj się z Członkiem Zarządu ds. Administracji SSUEW.
                </p>
              </div>
            </div>
          </section>

          {/* ===== ROZDZIAŁ 1 — SŁOWNIK ===== */}
          <section id="slownik" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Users} chapter="Rozdział 1" title="Słownik pojęć i osób" color="purple" />
            <SectionIntro items={['Pełne nazwy organów SSUEW i UEW', 'Tytuły i funkcje osób w protokołach', 'Kiedy używać skrótów, a kiedy pełnych nazw']} />

            {/* 1A */}
            <div className="mb-8">
              <h3 className="text-base font-black text-slate-700 uppercase tracking-widest mb-3">1A — Władze UEW: jak pisać poprawnie</h3>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Jak się mówi potocznie</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Jak należy pisać w protokole</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ['"Rektor Zając"', 'prof. dr hab. Czesław Zając — Rektor Uniwersytetu Ekonomicznego we Wrocławiu'],
                        ['"Prorektor Okruszek" lub "Rektor Okruszek"', 'dr hab. inż. Andrzej Okruszek, prof. UEW — Prorektor ds. Studenckich i Kształcenia'],
                        ['"Prorektor Bednarek"', 'dr hab. Piotr Bednarek, prof. UEW — Prorektor ds. Finansów'],
                        ['"Pani Prorektor Drelich"', 'prof. dr hab. Bogusława Drelich-Skulska — Prorektor ds. Współpracy Międzynarodowej'],
                        ['"Prorektor Kośny"', 'prof. dr hab. Marek Kośny — Prorektor ds. Nauki'],
                        ['"Pani Kanclerz"', 'dr Agnieszka Strońska-Rembisz — Kanclerz UEW'],
                        ['"Pan Kwestor"', 'dr Wojciech Krzeszowski — Kwestor UEW'],
                        ['"Zastępca Kanclerza Witter"', 'Mgr inż. Wiesław Witter — Zastępca Kanclerza ds. Technicznych'],
                        ['"RPS" lub "Rzecznik"', 'Jakub Buchta — Rzecznik Praw Studenta SSUEW'],
                      ].map(([potocznie, oficjalnie], i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-slate-500 italic">{potocznie}</td>
                          <td className="px-5 py-3 text-slate-800 font-medium">{oficjalnie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>Uwaga:</strong> Przy pierwszym użyciu w protokole zawsze podaj pełną formę. Przy kolejnych użyciach możesz stosować samą funkcję (np. "Prorektor ds. Studenckich i Kształcenia").
                  </p>
                </div>
              </div>
            </div>

            {/* 1B */}
            <div className="mb-8">
              <h3 className="text-base font-black text-slate-700 uppercase tracking-widest mb-3">1B — Władze SSUEW: aktualne funkcje</h3>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Imię i nazwisko</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Pełna funkcja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ['Emilia Ćwiklińska', 'Przewodnicząca Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu'],
                        ['Magdalena Skoczylas', 'Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych'],
                        ['Daria Szewczyk', 'Wiceprzewodnicząca ds. Projektów'],
                        ['Jakub Panas', 'Wiceprzewodniczący ds. Public Relations'],
                        ['Marcel Tyrakowski', 'Członek Zarządu ds. Human Resources'],
                        ['Hubert Stachowski', 'Członek Zarządu ds. Finansów'],
                        ['Karol Vogel', 'Członek Zarządu ds. Kontaktów Zewnętrznych'],
                        ['Julia Pytel', 'Członek Zarządu ds. Promocji'],
                        ['Karolina Smereczniak', 'Członek Zarządu ds. Dydaktyki i Jakości Kształcenia'],
                        ['Mikołaj Radliński', 'Członek Zarządu ds. Administracji'],
                      ].map(([name, func], i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-800">{name}</td>
                          <td className="px-5 py-3 text-slate-600">{func}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 1C */}
            <div>
              <h3 className="text-base font-black text-slate-700 uppercase tracking-widest mb-3">1C — Organy i jednostki: co to właściwie jest?</h3>
              <div className="space-y-2">
                {ORGANS.map((org) => (
                  <Accordion key={org.id} id={org.id} title={org.title} content={org.content} />
                ))}
              </div>
            </div>
          </section>

          {/* ===== ROZDZIAŁ 2 — PRZED SPOTKANIEM ===== */}
          <section id="przed" className="scroll-mt-20 mb-16">
            <SectionTitle icon={CheckCircle} chapter="Rozdział 2" title="Przed spotkaniem" color="teal" />
            <SectionIntro items={['Checklista czynności przed każdym posiedzeniem', 'Jak przygotować listę obecności i nagłówek', 'Uwagi dla protokołów RUSS i absolutoryjnych']} />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <p className="text-slate-700 leading-relaxed">
                Dobry protokół zaczyna się <strong>przed spotkaniem</strong>! Protokolant który przychodzi nieprzygotowany skazuje się na chaos notatek i błędy merytoryczne. Im lepiej się przygotujesz, tym łatwiej będzie Ci wyłapać co jest ważne — a pominąć to co ważne nie jest.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-violet-500" />
                Checklista przed spotkaniem
              </h3>
              <Checklist group="before" items={BEFORE_ITEMS} />
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Czy można nagrywać?
              </h3>
              <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                <p>Nagrywanie posiedzeń jest <strong>dopuszczalne</strong> jako pomoc techniczna przy sporządzaniu protokołu. Wymaga jednak poinformowania wszystkich uczestników na samym początku spotkania — przed rozpoczęciem merytorycznej części obrad.</p>
                <p>Nagranie jest wyłącznie narzędziem roboczym protokolanta. Nie jest oficjalnym dokumentem, nie może być udostępniane osobom trzecim, publikowane ani archiwizowane. <strong>Po sporządzeniu i zatwierdzeniu protokołu nagranie należy usunąć.</strong></p>
                <p>Na KPUE nagrywanie jest wręcz zalecane przez FUE jako standard. W przypadku wątpliwości prawnych skonsultuj się z Członkiem Zarządu ds. Administracji SSUEW.</p>
              </div>
            </div>
          </section>

          {/* ===== ROZDZIAŁ 3 — PODCZAS SPOTKANIA ===== */}
          <section id="podczas" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Rozdział 3" title="Podczas spotkania" color="green" />
            <SectionIntro items={['Co zapisywać na bieżąco, a co można uzupełnić po', 'Jak rejestrować głosowania i wnioski formalne', 'Wskazówki dotyczące nagrywania']} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <p className="text-slate-700 leading-relaxed">
                Na sali obrad masz jedno zadanie: <strong>uchwycić to co ważne</strong>. Nie prowadzisz dyskusji, nie głosujesz (chyba, że jesteś Radnym), nie komentujesz. Jesteś obserwatorem i rejestratorem. To wymaga skupienia — dlatego warto siedzieć w miejscu z dobrą widocznością i słyszalnością.
              </p>
            </div>

            {/* Co zapisywać */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-black text-green-800 text-sm uppercase tracking-wide">Zawsze zapisuj</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-green-800">
                  {[
                    'Dokładną godzinę otwarcia i zamknięcia obrad',
                    'Liczbę obecnych i stwierdzenie quorum (obowiązkowo dla RUSS)',
                    'Każdą podjętą decyzję lub uchwałę — dosłownie, z numerem',
                    'Wyniki głosowań: za / przeciw / wstrzymujących się — zawsze trzy liczby',
                    'Zgłoszone wnioski formalne i ich los (przyjęty/odrzucony)',
                    'Zobowiązania podjęte przez konkretne osoby — kto, co, do kiedy',
                    'Sprzeciwy i zdania odrębne, jeśli ktoś je formalnie zgłosi',
                    'Godziny przerw i wznowień obrad',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-black text-red-800 text-sm uppercase tracking-wide">Nie musisz zapisywać</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-red-800">
                  {[
                    'Każdego zdania wypowiedzianego w dyskusji',
                    'Prywatnych komentarzy i dygresji niezwiązanych z porządkiem',
                    'Szczegółów technicznych bez znaczenia dla decyzji',
                    'Powtórzeń i "myślenia na głos"',
                    'Żartów, atmosfery sali, emocji uczestników',
                    'Treści nieformalnych ogłoszeń (zaproszenia na integrację itp.)',
                    'Informacji prywatnych uczestników niezwiązanych z tematem spotkania',
                    'Aspektów wyniesionych poza protokół za sprawą stwierdzenia: "Poza porotokołem"',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tabela dobrze vs źle */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Przykłady — dobrze vs źle</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs w-1/4">Sytuacja</th>
                      <th className="text-left px-4 py-3 font-bold text-red-500 uppercase tracking-wider text-xs w-[37.5%]">❌ Źle</th>
                      <th className="text-left px-4 py-3 font-bold text-green-600 uppercase tracking-wider text-xs w-[37.5%]">✅ Dobrze</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        'Wymienienie osoby funkcyjnej',
                        '"Rektor Okruszek powiedział coś o stypendiach"',
                        '"Prorektor ds. Studenckich i Kształcenia dr hab. inż. Andrzej Okruszek, prof. UEW poinformował o planowanych zmianach w Regulaminie świadczeń dla studentów, wchodzących w życie od 1 października 2025 r."',
                      ],
                      [
                        'Wynik głosowania',
                        '"Głosowanie przeszło"',
                        '"Uchwała nr X/2025 została przyjęta stosunkiem głosów: 10 za, 0 przeciw, 1 wstrzymujący się."',
                      ],
                      [
                        'Zobowiązanie',
                        '"Przewo powiedziała że trzeba to zrobić"',
                        '"Przewodnicząca SSUEW Emilia Ćwiklińska zobowiązała się do przygotowania projektu uchwały do dnia 15.11.2025 r."',
                      ],
                      [
                        'Omówienie punktu',
                        '"Omówiono sprawy finansowe"',
                        '"Członek Zarządu ds. Finansów Hubert Stachowski przedstawił stan realizacji budżetu SSUEW za III kwartał 2025 r. Saldo wynosi X zł. Wskazano na konieczność zwiększenia kontroli wydatków w projektach."',
                      ],
                      [
                        'Notatka nieformalna',
                        '"PRZEKAZANO GORĄCE ZAPROSZENIE NA INTEGRACJĘ!"',
                        '"Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych Magdalena Skoczylas zaprosiła obecnych na spotkanie integracyjne w budynku B/J."',
                      ],
                      [
                        'Informacja prywatna',
                        '"Karlos → był w sushi HUB, pół godziny w Jotce"',
                        '[w protokole projektowym: "Karol Szewczuk — omówił postęp kontaktów z partnerami zewnętrznymi (Sushi Hub)"]',
                      ],
                    ].map(([sytuacja, zle, dobrze], i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-700 bg-slate-50 align-top">{sytuacja}</td>
                        <td className="px-4 py-3 text-red-700 align-top italic" style={{ backgroundColor: '#fef2f2' }}>{zle}</td>
                        <td className="px-4 py-3 text-green-800 align-top" style={{ backgroundColor: '#f0fdf4' }}>{dobrze}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zasada złotego środka */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
              <h3 className="font-black text-violet-800 text-sm uppercase tracking-widest mb-3">Zasada złotego środka</h3>
              <p className="text-sm text-violet-900 leading-relaxed">
                Protokół ma być <strong>pełny, ale nie stenograficzny</strong>. Dobry test: <em>"czy osoba która nie była na spotkaniu zrozumie z tego protokołu co postanowiono i dlaczego — bez konieczności pytania kogokolwiek?"</em> Jeśli tak — protokół jest dobry. Jeśli nie — czegoś brakuje. Zbyt wąski protokół (lista punktów bez treści) jest równie zły, jak zbyt szeroki (stenogram każdej wypowiedzi). Oba są bezużyteczne...
              </p>
            </div>
          </section>

          {/* ===== ROZDZIAŁ 4 — PO SPOTKANIU ===== */}
          <section id="po" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Clock} chapter="Rozdział 4" title="Po spotkaniu" color="amber" />
            <SectionIntro items={['Checklista kontrolna po sporządzeniu protokołu', 'Komu wysłać do weryfikacji i jak archiwizować', 'Co zrobić z nagraniem']} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <p className="text-slate-700 leading-relaxed">
                Spotkanie skończyło się — ale praca protokolanta jeszcze nie! Masz określony czas na sporządzenie i przekazanie protokołu. Spóźniony protokół to protokół który stracił swoją wartość operacyjną — ustalenia "wychładzają się", szczegóły uciekają z pamięci uczestników, a decyzje trudno odtworzyć bez kontekstu.
              </p>
            </div>

            {/* Terminy oddania */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-4">Terminy oddania protokołów</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { type: 'SKS', deadline: '7 dni', color: 'blue' },
                  { type: 'RUSS', deadline: '7-14 dni', color: 'orange' },
                  { type: 'Absolutoryjny', deadline: '1 miesiąc', color: 'red' },
                  { type: 'KPUE', deadline: '~1 miesiąc (ruchomy)', color: 'red' },
                  { type: 'Komisyjny', deadline: '3–5 dni', color: 'green' },
                  { type: 'Projektowy', deadline: '1–3 dni', color: 'green' },
                  { type: 'Roboczy', deadline: 'ustal z organizatorem', color: 'gray' },
                ].map(({ type, deadline, color }) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 text-sm">{type}</span>
                    <DeadlineBadge text={deadline} color={color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Checklista po */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-violet-500" />
                Checklista po spotkaniu
              </h3>
              <Checklist group="after" items={AFTER_ITEMS} />
            </div>
          </section>

          {/* ===== ROZDZIAŁ 5 — TYPY PROTOKOŁÓW ===== */}
          <section id="typy" className="scroll-mt-20 mb-4">
            <SectionTitle icon={FileText} chapter="Rozdział 5" title="Typy protokołów" color="indigo" />
            <SectionIntro items={['Omówienie wszystkich 7 typów protokołów SSUEW', 'Wymagania formalne specyficzne dla każdego typu', 'Terminy i wzory do pobrania']} />
          </section>

          {/* 5.1 SKS */}
          <ProtocolCard id="typ-sks" title="5.1 SKS — Spotkanie Komisji Samorządu" deadline="7 dni" deadlineColor="blue">
            <div className="grid md:grid-cols-3 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'informacyjno-roboczy, nie uchwałodawczy'],
                ['Częstotliwość', 'comiesięcznie'],
                ['Prowadzi', 'Przewodnicząca SSUEW'],
                ['Quorum', 'nie wymagane formalnie'],
                ['Termin oddania', '7 dni od spotkania'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <h4 className="font-bold text-slate-700 text-sm mb-2 mt-4">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              {[
                'Nagłówek: numer SKS, data, miejsce, godziny, prowadzący, protokolant',
                'Spis treści z numerami stron',
                'Treść kolejnych punktów porządku obrad',
                'Ważne daty i zapowiedzi, jeśli padły',
                'Podsumowania projektowe, jeśli były prezentowane — z metrykami: koordynator, liczba uczestników, oceny, wnioski, rekomendacje',
                'Sprawy różne i wolne wnioski — każda osoba z pełnego imienia i nazwiska oraz funkcji',
                'Godzina zamknięcia spotkania',
                'Podpis protokolanta i data sporządzenia',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
            <div className="mt-4 bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-sm text-blue-800"><strong>Specyfika SKS:</strong> To najbardziej "żywy" protokół — mogą w nim pojawić się podsumowania projektowe z konkretnymi metrykami (koszt jednostkowy, liczba uczestników, średnia ocena). Styl może być nieco mniej formalny niż RUSS, ale nadal urzędowy — bez żargonu, skrótów i nieformalnych wtrąceń. Nie zapomnij że SKS jest otwarty — mogą pojawić się osoby spoza Samorządu, które też należy wpisać.</p>
            </div>
          </ProtocolCard>

          {/* 5.2 RUSS */}
          <ProtocolCard id="typ-russ" title="5.2 RUSS — Posiedzenie Rady Uczelnianej" deadline="7-14 dni" deadlineColor="orange">
            <div className="grid md:grid-cols-3 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'uchwałodawczy — najważniejszy organ SSUEW'],
                ['Prowadzi', 'Przewodnicząca SSUEW lub wyznaczony Przewodniczący obrad'],
                ['Quorum', 'OBOWIĄZKOWE — minimum 8 Radnych'],
                ['Termin oddania', 'do 14 dni od posiedzenia'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <h4 className="font-bold text-slate-700 text-sm mb-2 mt-4">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700 mb-4">
              {[
                'Nagłówek: numer posiedzenia RUSS, data, miejsce, godziny, protokolant',
                'Spis treści z numerami stron',
                'Lista obecności — pełna, z zaznaczeniem obecny/nieobecny dla każdego Radnego.',
                'Stwierdzenie prawomocności obrad (stwierdzono / nie stwierdzono quorum)',
                'Treść kolejnych punktów porządku obrad',
                'Pełna treść każdej uchwały — dosłownie, z numerem uchwały w formacie [numer]/[rok akademicki]',
                'Wyniki każdego głosowania: za / przeciw / wstrzymujących się — zawsze trzy liczby',
                'Sprawy różne i wolne wnioski — każda osoba z pełnej funkcji i imienia oraz nazwiska',
                'Godzina zamknięcia posiedzenia',
                'Podpis protokolanta i Członka Zarzadu ds. Administracji SSUEW',
                'Lista załączników (lista obecności, uchwały, inne dokumenty)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-red-800 uppercase tracking-wide mb-1">Uwaga krytyczna</p>
                <p className="text-sm text-red-700">Wyniki głosowań muszą być kompletne — zawsze <strong>trzy liczby</strong> (za / przeciw / wstrzymujących się). Nigdy samo "jednogłośnie" bez podania ile osób głosowało. <strong>Uchwała bez kompletnego wyniku głosowania może być podważona.</strong></p>
              </div>
            </div>
          </ProtocolCard>

          {/* 5.3 Absolutoryjny */}
          <ProtocolCard id="typ-absolutoryjny" title="5.3 Absolutoryjny" deadline="1 miesiąc" deadlineColor="red">
            <div className="grid md:grid-cols-2 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'szczególny typ posiedzenia RUSS — formalna ocena działalności całego Zarządu SSUEW'],
                ['Prowadzi', 'Przewodnicząca SKW (nie Zarząd — byłby konflikt interesów)'],
                ['Komisja Skrutacyjna', 'Komisja Rewizyjna — ogłasza wyniki głosowań'],
                ['Tryb głosowania', 'tajny (przez formularz jednorazowego głosowania)'],
                ['Termin oddania', '1 miesiąc'],
                ['Uwaga', 'może trwać 2 dni — protokół dla każdego dnia osobno'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <h4 className="font-bold text-slate-700 text-sm mb-2 mt-4">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700 mb-4">
              {[
                'Strona tytułowa',
                'Przedmowa (metodologia sporządzania, styl informacyjno-sprawozdawczy, definicja absolutorium)',
                'Nagłówek: numer posiedzenia RUSS, dzień, data, miejsce, godziny, tryb, prowadzący, protokolant, komisja skrutacyjna, quorum, tryb głosowania',
                'Spis treści z numerami stron',
                'Lista obecności Radnych',
                'Rozpoczęcie i kwestie proceduralne — zasady ogłoszone przez SKW',
                'Dla każdej osoby sprawozdającej: Prezentacja sprawozdawcza + Pytania od Radnych (parami: pytanie + odpowiedź) + Głosowanie z wynikiem',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800"><strong>Warunek uzyskania absolutorium:</strong> bezwzględna większość głosów "za" (ponad 50%) przy quorum. Każdy członek Zarządu głosowany jest osobno — wyniki zapisujemy osobno dla każdej osoby. Absolutorium jest najobszerniejszym protokołem w SSUEW. Zachowaj neutralność — nie oceniaj sprawozdających.</p>
            </div>
          </ProtocolCard>

          {/* 5.4 Komisyjny */}
          <ProtocolCard id="typ-komisyjny" title="5.4 Komisyjny" deadline="3–5 dni" deadlineColor="green">
            <div className="grid md:grid-cols-3 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'roboczy, wewnętrzny dla danej komisji SSUEW'],
                ['Quorum', 'nie wymagane'],
                ['Termin oddania', '3–5 dni'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <h4 className="font-bold text-slate-700 text-sm mb-2 mt-4">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              {[
                'Nagłówek: nazwa komisji, numer spotkania, data, miejsce, godziny, prowadzący, protokolant',
                'Lista uczestników z imionami i nazwiskami',
                'Cel spotkania',
                'Omawiane tematy z treścią — nie skróty, ale pełne zdania z kontekstem',
                'Podjęte decyzje',
                'Zadania z przypisaniem do konkretnych osób i terminami wykonania',
                'Godzina zakończenia',
                'Podpis protokolanta',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
          </ProtocolCard>

          {/* 5.5 Projektowy */}
          <ProtocolCard id="typ-projektowy" title="5.5 Projektowy" deadline="1–3 dni" deadlineColor="green">
            <div className="grid md:grid-cols-3 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'roboczy — dokumentuje postęp konkretnego projektu. Najbardziej elastyczny pod względem stylu.'],
                ['Quorum', 'nie wymagane'],
                ['Termin oddania', '1–3 dni'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-black text-green-700 uppercase tracking-wide mb-2">Dopuszczalne (styl roboczy)</p>
                <ul className="space-y-1 text-sm text-green-800">
                  {[
                    'Styl punktowy zamiast pełnych zdań',
                    'Podział na "co zrobiono" i "plany na przyszły tydzień"',
                    'Metryki projektu: liczby, daty, koszty, oceny uczestników',
                    'Rekomendacje i wnioski po projekcie (plusy/minusy)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-black text-red-700 uppercase tracking-wide mb-2">Niedopuszczalne nawet w roboczym</p>
                <ul className="space-y-1 text-sm text-red-800">
                  {[
                    'Pseudonimy i zdrobnienia ("Junior", "Karlos", "Magda") — zawsze pełne imię i nazwisko',
                    'Informacje prywatne niezwiązane z projektem',
                    'Brak podmiotu — zawsze wiadomo kto, co zrobił',
                    'Brak godziny zakończenia i podpisu protokolanta',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">✗</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h4 className="font-bold text-slate-700 text-sm mb-2">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              {[
                'Nagłówek: nazwa projektu, numer spotkania, data, miejsce, godziny, koordynator, protokolant',
                'Lista uczestników z imionami i nazwiskami',
                'Podsumowanie działań od poprzedniego spotkania — per osoba',
                'Status projektu',
                'Plany i zadania do kolejnego spotkania — per osoba z terminami',
                'Ustalenia ogólne i ryzyka, jeśli omawiane',
                'Godzina zakończenia',
                'Podpis protokolanta i data sporządzenia',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
          </ProtocolCard>

          {/* 5.6 Roboczy */}
          <ProtocolCard id="typ-roboczy" title="5.6 Roboczy" deadline="ustal z organizatorem" deadlineColor="gray">
            <div className="grid md:grid-cols-3 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'najbardziej elastyczny — dostosowany do celu spotkania'],
                ['Quorum', 'nie wymagane'],
                ['Termin oddania', 'ustal z organizatorem przed spotkaniem'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 mb-3">Nie ma jednego obowiązującego wzoru. Minimum które musi zawierać każdy protokół roboczy:</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {[
                'Data i miejsce spotkania',
                'Lista uczestników z imionami i nazwiskami',
                'Cel spotkania',
                'Ustalenia i decyzje',
                'Zadania z przypisaniem do osób',
                'Godzina zakończenia',
                'Podpis protokolanta',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>
          </ProtocolCard>

          {/* 5.7 KPUE */}
          <ProtocolCard id="typ-kpue" title="5.7 KPUE — Konferencja Polskich Uczelni Ekonomicznych" deadline="ok. 1 miesiąc" deadlineColor="red">
            <div className="grid md:grid-cols-2 gap-3 text-xs mb-4">
              {[
                ['Charakter', 'zewnętrzny — reprezentacja SSUEW na forum ogólnopolskim FUE'],
                ['Termin oddania', 'około miesiąca od KPUE. Termin może być ruchomy ze względu na datę kolejnego posiedzenia FUE — ustal dokładny termin z Członkiem Prezydium ds. Administracji FUE.'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <span className="block font-bold text-slate-500 uppercase tracking-wide mb-1">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-black text-violet-700 uppercase tracking-wide mb-2">Formatowanie wymagane przez FUE</p>
              <ul className="grid grid-cols-2 gap-1 text-sm text-violet-800">
                {[
                  'Czcionka: Roboto, rozmiar 12',
                  'Wyrównanie: justowanie',
                  'Odstępy między wierszami: 1,5',
                  'Imiona, nazwiska, funkcje i organizacje: pogrubione',
                  'Nazwy punktów porządku obrad: pogrubione',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">•</span>{item}</li>
                ))}
              </ul>
            </div>

            <h4 className="font-bold text-slate-700 text-sm mb-2">Co musi zawierać:</h4>
            <ul className="space-y-1 text-sm text-slate-700 mb-4">
              {[
                'Nagłówek: numer KPUE, organizator (uczelnia gospodarz), data, miejsce',
                'Lista wszystkich delegacji z pełnymi nazwami uczelni i funkcjami reprezentantów',
                'Porządek obrad konferencji',
                'Treść każdego omawianego tematu — syntetycznie, sens wypowiedzi bez stenografii',
                'Stanowiska poszczególnych uczelni, jeśli były rozbieżne',
                'Ustalenia i decyzje konferencji',
                'Głosowania w formacie tabeli: Liczba głosujących | Głosy ważne | Za | Wstrzymane | Przeciw',
                'Komentarze redakcyjne (przerwy itp.): wyśrodkowane + kursywa, z godzinami',
                'Termin i miejsce kolejnej KPUE, jeśli ustalono',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{item}</li>
              ))}
            </ul>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-black text-slate-600 uppercase tracking-wide mb-2">Specyfika KPUE</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Używaj pełnych oficjalnych nazw uczelni — nie skrótów. Na przykład: <em>"Samorząd Studentów Szkoły Głównej Handlowej w Warszawie"</em>.</li>
                <li>• Przed wypowiedzią każdej osoby: imię i nazwisko + uczelnia. Dla osób funkcyjnych (Przewodnicząca FUE, Prezydium, zaproszeni goście): imię, nazwisko i pełna funkcja.</li>
                <li>• Nagrywanie na KPUE: zalecane przez FUE jako standard — ułatwia sporządzenie protokołu.</li>
              </ul>
            </div>
          </ProtocolCard>

          {/* ===== ROZDZIAŁ 6 — CZĘSTE BŁĘDY ===== */}
          <section id="bledy" className="scroll-mt-20 mb-16">
            <SectionTitle icon={AlertTriangle} chapter="Rozdział 6" title="Częste błędy" color="red" />
            <SectionIntro items={['11 najczęstszych błędów z opisem i sposobem poprawy', 'Błędy dotyczące quorum, dat, głosowań i spójności', 'Jak sprawdzić protokół przed wysyłką']} />
            <div className="space-y-4">
              {ERRORS.map((err) => (
                <div key={err.n} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-sm shrink-0">
                    {err.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <h3 className="font-black text-slate-800 text-sm">{err.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{err.desc}</p>
                    <div className="flex items-start gap-2 bg-green-50 rounded-xl p-3 border border-green-100">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-800 font-medium leading-relaxed"><strong>Jak to naprawić:</strong> {err.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== ROZDZIAŁ 7 — WZORY I SZABLONY ===== */}
          <section id="wzory-szablony" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Rozdział 7" title="Wzory i szablony" color="violet" />
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600">Gotowe wzory protokołów, listy obecności i szablony dokumentów — otwierane bezpośrednio w Google Drive.</p>
            </div>
            {/* TODO: Zastąp wartości driveUrl w tablicy TEMPLATE_ITEMS rzeczywistymi linkami Google Drive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATE_ITEMS.map((t) => (
                <TemplateCard key={t.id} name={t.name} url={t.driveUrl} />
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* PRZYCISK WRÓĆ DO GÓRY */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 left-7 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Wróć do góry"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
