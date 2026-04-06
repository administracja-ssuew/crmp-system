import { useState, useEffect } from 'react';

const Icons = {
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Scale: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c1.4-1.4 4.059-1.4 5.559 0 1.069.99 2.464.99 3.534 0V5.25C19.64 6.65 16.98 6.65 15.53 5.25m-3.53 15c-1.4-1.4-4.059-1.4-5.559 0-1.069.99-2.464.99-3.534 0V5.25C4.36 6.65 7.02 6.65 8.47 5.25" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
};

const LEGAL_WIKI = [
  {
    id: 1,
    term: "Klauzula Abuzywna (Niedozwolona)",
    context: "Regulaminy wydarzeń, Oświadczenia, Konkursy",
    desc: "Postanowienie wzorca umowy (np. regulaminu wydarzenia), które nie zostało uzgodnione indywidualnie i rażąco narusza interesy uczestnika (konsumenta). Z mocy prawa (zgodnie z art. 385(1) Kodeksu Cywilnego) klauzule abuzywne są z gruntu nieważne i nie wywołują żadnych skutków prawnych, a ich stosowanie może narazić Organizatora na konsekwencje ze strony UOKiK.",
    badExample: "Organizator nie ponosi absolutnie żadnej odpowiedzialności za szkody na mieniu i zdrowiu uczestników powstałe w trakcie trwania Wydarzenia.",
    goodExample: "Organizator nie ponosi odpowiedzialności za szkody na mieniu uczestników pozostawionym bez nadzoru, chyba że szkoda powstała z winy umyślnej Organizatora.",
    lawyerAdvice: "Z punktu widzenia ochrony prawnej Uczelni, niedopuszczalne jest całkowite wyłączenie odpowiedzialności za szkody na osobie (np. uszczerbek na zdrowiu wynikający ze złego zabezpieczenia terenu). Skuteczne i dozwolone jest natomiast ograniczenie odpowiedzialności za mienie, pod warunkiem wskazania uczestnikom jasnych wytycznych (np. regulaminu korzystania z szatni)."
  },
  {
    id: 2,
    term: "Zadatek a Zaliczka (Rozliczenia)",
    context: "Regulaminy wyjazdów - Adapciak, Wyjazdy Komisji",
    desc: "Dwie odmienne formy przedpłaty w prawie cywilnym, często błędnie stosowane zamiennie. Zaliczka zawsze podlega zwrotowi w przypadku rezygnacji. Zadatek natomiast (zgodnie z art. 394 Kodeksu Cywilnego) pełni funkcję zabezpieczającą i może zostać zatrzymany przez Organizatora w razie niewykonania umowy przez uczestnika.",
    badExample: "Warunkiem rezerwacji miejsca jest wpłata zaliczki. W przypadku rezygnacji uczestnika, zaliczka nie podlega zwrotowi.",
    goodExample: "Warunkiem rezerwacji miejsca jest wpłata zadatku. W przypadku rezygnacji uczestnika z winy leżącej po jego stronie, wpłacony zadatek przepada na rzecz Organizatora.",
    lawyerAdvice: "Przy organizacji wyjazdów, w których Samorząd z wyprzedzeniem ponosi udokumentowane, bezzwrotne koszty (np. rezerwacja bazy noclegowej, najem autokarów), należy bezwzględnie operować pojęciem 'zadatku'. Użycie słowa 'zaliczka' wymusza jej bezwzględny zwrot rezygnującemu studentowi, co może stanowić bezpośrednie zagrożenie dla płynności budżetu projektu."
  },
  {
    id: 12,
    term: "Siła Wyższa (Vis Maior)",
    context: "Odwoływanie wydarzeń (Bal UEW, Wyjazdy, TEDxUEW)",
    desc: "Zdarzenie o charakterze zewnętrznym, niemożliwe do przewidzenia oraz do zapobieżenia przy zachowaniu należytej staranności (np. klęska żywiołowa, powódź, nagłe rozporządzenia władz państwowych, żałoba narodowa). Stanowi obiektywną podstawę prawną do zwolnienia z odpowiedzialności za niewykonanie zobowiązania.",
    badExample: "W przypadku odwołania imprezy z jakiegokolwiek powodu leżącego poza kontrolą Organizatora, wpłacone za bilet środki nie podlegają zwrotowi pod żadnym pozorem.",
    goodExample: "Organizator zastrzega sobie prawo do odwołania Wydarzenia z powodu zaistnienia Siły Wyższej. W takim przypadku koszty uczestnictwa podlegają zwrotowi w kwocie pomniejszonej o proporcjonalną część udokumentowanych wydatków bezzwrotnych.",
    lawyerAdvice: "Regulamin każdego wydarzenia o podwyższonym ryzyku finansowym (projekty biletowane, wynajem autokarów, wynajem sali) musi bezwzględnie zawierać dobrze sformułowaną klauzulę siły wyższej. Mechanizm ten chroni Samorząd przed zarzutami niegospodarności i pozwami cywilnymi w sytuacji np. nagłego, administracyjnego zamknięcia obiektów Uczelni przez Rektora."
  },
  {
    id: 13,
    term: "Obowiązek Informacyjny RODO",
    context: "Formularze zapisów (Google Forms), Konkursy, Rekrutacje",
    desc: "Ustawowy obowiązek nałożony na Administratora Danych Osobowych. Polega na konieczności czytelnego poinformowania podmiotu danych o tożsamości administratora, celach przetwarzania, podstawie prawnej, okresie przechowywania oraz przysługujących prawach (wglądu, usunięcia).",
    badExample: "[W formularzu Google Forms znajduje się wyłącznie miejsce na podanie Imienia, Nazwiska, E-maila i telefonu, bez dodania żadnej klauzuli i akceptacji].",
    goodExample: "[Wymagany Checkbox]: Oświadczam, że zapoznałem/am się z Regulaminem Projektu oraz akceptuję treść klauzuli informacyjnej RODO stanowiącej Załącznik nr 1 do Regulaminu.",
    lawyerAdvice: "Należy pamiętać, że Samorząd Studentów UEW nie posiada własnej osobowości prawnej, a co za tym idzie – nie jest samodzielnym Administratorem Danych. Wszelkie zbierane przez was informacje administratuje prawnie Uniwersytet Ekonomiczny we Wrocławiu. Formularze muszą linkować do klauzul informacyjnych zatwierdzonych przez Inspektora Ochrony Danych (IOD) Uczelni."
  }
];

const EVENT_REGULATIONS = {
  internal: [
    { 
      title: "Wyjazdy Szkoleniowe (Wyjazdy Komisji)", 
      desc: "Regulaminy wyjazdów integracyjno-szkoleniowych dla działaczy SSUEW. Klauzule dot. odpowiedzialności majątkowej za szkody w ośrodkach wypoczynkowych.", 
      tags: ["Ubezpieczenia", "Transport", "BHP", "Odpowiedzialność Solidarna"],
      templateId: 'TRIP_TEMPLATE'
    },
    { title: "Rekrutacje Wewnętrzne", desc: "Zasady naboru do Komisji Samorządu. Klauzule poufności (NDA) dla rekruterów oraz RODO.", tags: ["Poufność (NDA)", "RODO", "Prawa aplikanta"] },
    { title: "Przydziałki i Gala Samorządu", desc: "Regulamin przyznawania nagród wewnętrznych, mechanika głosowania kapituły.", tags: ["Procedura Głosowania", "Kapituła", "Event"] },
    { title: "UE Party (Projekty Imprezowe)", desc: "Zasady wejścia na imprezy, wnoszenia własnych napojów, zasady współpracy z klubami.", tags: ["Regulamin Imprezy", "Selekcja", "Wizerunek"] },
  ],
  external: [
    { title: "Projekty Charytatywne (m.in. Animalia)", desc: "Regulaminy zbiórek publicznych, licytacji charytatywnych oraz zasady rozliczania z fundacjami docelowymi.", tags: ["Finanse", "Zbiórka publiczna", "Darowizny"] },
    { title: "Konferencje (np. TEDxUEW, Prelekcje)", desc: "Regulaminy sprzedaży i dystrybucji biletów, prawa autorskie do nagrań prelegentów oraz zasady zachowania na auli.", tags: ["Ticketing", "Prawa Autorskie", "Umowa o Dzieło"] },
    { title: "Adapciak UEW", desc: "Kompleksowy regulamin obozu dla pierwszorocznych. Obejmuje oświadczenia medyczne, zakwaterowanie, kary dyscyplinarne.", tags: ["Wyjazd zorganizowany", "Dane wrażliwe", "Zadatek"] },
    { title: "Bal UEW / Półmetek", desc: "Regulaminy imprez masowych i zamkniętych. Polityka +18, weryfikacja statusu studenta.", tags: ["Event Biletowany", "Ageizm", "Impreza Masowa"] },
  ]
};

const TEMPLATES_DATA = {
  TRIP_TEMPLATE: {
    title: "WZÓR: REGULAMIN WYJAZDU SZKOLENIOWO-INTEGRACYJNEGO",
    intro: "Poniższy dokument został skonstruowany zgodnie z zasadami profesjonalnej techniki prawodawczej. Nie znajdziesz tu luźnych wypunktowań ani potocznego języka. Regulamin to w istocie umowa cywilnoprawna (umowa adhezyjna) zawierana pomiędzy Organizatorem a Uczestnikiem. Pod spodem każdego paragrafu znajdziesz komentarz wyjaśniający, dlaczego dany przepis został sformułowany w tak rygorystyczny sposób.",
    sections: [
      {
        id: "sec-1",
        title: "§ 1. Przepisy ogólne i słowniczek pojęć",
        content: [
          "Niniejszy Regulamin stanowi wzorzec umowny w rozumieniu art. 384 ustawy z dnia 23 kwietnia 1964 r. – Kodeks cywilny i określa wiążące warunki udziału, prawa i obowiązki stron oraz zasady odpowiedzialności odszkodowawczej w ramach Wydarzenia.",
          "Ilekroć w tekście niniejszego Regulaminu stosuje się poniższe pojęcia pisane wielką literą, należy przez nie rozumieć:",
          "a) Regulamin – niniejszy akt normatywny o charakterze wewnętrznym;",
          "b) Wydarzenie – zorganizowany wyjazd szkoleniowo-integracyjny pod nazwą „[Wiosenny/Jesienny/Letni] Wyjazd Komisji [Rok]”, realizowany w terminie od [Data] do [Data] na terenie obiektu [Nazwa Ośrodka i adres];",
          "c) Organizator – Uniwersytet Ekonomiczny we Wrocławiu, w imieniu i na rzecz którego działania operacyjne podejmuje Samorząd Studentów UEW;",
          "d) Uczestnik – osobę fizyczną, która kumulatywnie spełniła przesłanki określone w § 2 niniejszego Regulaminu i wobec której Organizator potwierdził wpis na listę uczestników."
        ],
        commentary: "Wskazanie art. 384 Kodeksu cywilnego z miejsca informuje, że ten dokument to \"wzorzec umowy\" narzucony przez jedną ze stron. Definicje legalne (ust. 2) tworzą zamknięty katalog pojęć. Słowo \"kumulatywnie\" oznacza, że trzeba spełnić WSZYSTKIE warunki naraz, a nie tylko wybrane. Dzięki temu nikt nie zarzuci dokumentowi niejednoznaczności."
      },
      {
        id: "sec-2",
        title: "§ 2. Kryteria kwalifikacyjne i tryb naboru",
        content: [
          "1. Prawo skutecznego ubiegania się o status Uczestnika przysługuje wyłącznie osobie fizycznej, która w dacie skutecznego złożenia oświadczenia woli o udziale w Wydarzeniu spełnia łącznie następujące przesłanki:",
          "a) posiada pełną zdolność do czynności prawnych oraz ukończyła 18. rok życia;",
          "b) posiada aktywny status studenta Uniwersytetu Ekonomicznego we Wrocławiu;",
          "c) jest zrzeszona w strukturach Komisji Samorządu Studentów.",
          "2. Organizator zastrzega sobie prawo weryfikacji przesłanek, o których mowa w ust. 1, za pośrednictwem zautomatyzowanego Systemu Weryfikacji.",
          "3. Dopuszcza się partycypację w Wydarzeniu osób posiadających status Alumna Samorządu Studentów UEW. W stosunku do podmiotów określonych w zdaniu poprzedzającym, przesłanka wskazana w ust. 1 lit. b nie znajduje zastosowania.",
          "4. Zawarcie umowy o udział w Wydarzeniu następuje z chwilą kumulatywnego: prawidłowego wypełnienia formularza rejestracyjnego oraz uiszczenia świadczenia pieniężnego, o którym mowa w § 3 ust. 1."
        ],
        commentary: "Zamiast pisać \"musisz mieć 18 lat i być studentem\", używamy pojęcia \"zdolności do czynności prawnych\" oraz \"skutecznego złożenia oświadczenia woli\" (czyli wysłania formularza). Określenie momentu \"zawarcia umowy\" (ust. 4) jest kluczowe z perspektywy prawa zobowiązań – od tego ułamka sekundy obie strony są związane regulaminem."
      },
      {
        id: "sec-3",
        title: "§ 3. Świadczenia pieniężne i warunki odstąpienia od umowy",
        content: [
          "1. Z tytułu udziału w Wydarzeniu Uczestnik zobowiązuje się do uiszczenia na rzecz Organizatora świadczenia pieniężnego w zryczałtowanej kwocie [Kwota] PLN. Świadczenie uważa się za spełnione z chwilą uznania rachunku bankowego Organizatora o numerze: [Numer konta].",
          "2. Świadczenie, o którym mowa w ust. 1, wyczerpuje roszczenia Organizatora z tytułu kosztów zakwaterowania, wyżywienia oraz programu merytorycznego. Organizator nie zapewnia ochrony ubezpieczeniowej z tytułu odpowiedzialności cywilnej (OC) ani następstw nieszczęśliwych wypadków (NNW).",
          "3. W przypadku opuszczenia Terenu Wydarzenia przed upływem terminu jego zakończenia z przyczyn nieleżących po stronie Organizatora, Uczestnikowi nie przysługuje roszczenie o zwrot uiszczonego świadczenia w całości ani w części.",
          "4. Uczestnikowi przysługuje prawo odstąpienia od umowy bez podawania przyczyny, pod warunkiem złożenia stosownego oświadczenia w formie dokumentowej (wiadomość e-mail) nie później niż na [Liczba np. 14] dni przed datą rozpoczęcia Wydarzenia. Niezachowanie wskazanego terminu skutkuje bezwarunkowym przepadkiem uiszczonego świadczenia na rzecz Organizatora z tytułu poniesionych kosztów organizacyjnych."
        ],
        commentary: "W prawie cywilnym wpłata to \"świadczenie pieniężne\", a rezygnacja to \"odstąpienie od umowy\". Zapis o dacie \"uznania rachunku bankowego\" chroni przed sytuacją, w której ktoś wysyła przelew w ostatniej minucie i twierdzi, że zapłacił w terminie, choć pieniądze doszły dwa dni później. Ustęp 4 to klasyczna klauzula ochrony kosztów utraconych."
      },
      {
        id: "sec-4",
        title: "§ 4. Reżim porządkowy i sankcje regulaminowe",
        content: [
          "1. W czasie trwania Wydarzenia wprowadza się bezwzględny zakaz:",
          "a) posiadania, zażywania oraz dystrybucji jakichkolwiek środków odurzających i substancji psychotropowych w rozumieniu ustawy o przeciwdziałaniu narkomanii;",
          "b) podejmowania działań noszących znamiona agresji fizycznej, słownej oraz naruszających dobra osobiste osób trzecich;",
          "c) wnoszenia i posiadania broni, amunicji oraz materiałów niebezpiecznych.",
          "2. Naruszenie któregokolwiek z zakazów określonych w ust. 1 stanowi rażące naruszenie postanowień Regulaminu. W takiej sytuacji Organizatorowi przysługuje prawo do rozwiązania umowy ze skutkiem natychmiastowym, co jest równoznaczne z obligatoryjnym wydaleniem Uczestnika z Wydarzenia na jego wyłączny koszt i ryzyko."
        ],
        commentary: "W języku prawnym wyrzucenie z wyjazdu to \"rozwiązanie umowy ze skutkiem natychmiastowym z powodu rażącego naruszenia postanowień\". Odniesienie się wprost do \"ustawy o przeciwdziałaniu narkomanii\" zamyka drogę do dyskusji, czy dana substancja jest nielegalna, czy nie."
      },
      {
        id: "sec-5",
        title: "§ 5. Reżim odpowiedzialności odszkodowawczej",
        content: [
          "1. Uczestnik ponosi pełną i wyłączną odpowiedzialność odszkodowawczą (na zasadzie winy) za wszelkie szkody majątkowe i niemajątkowe wyrządzone Organizatorowi oraz podmiotom trzecim (w tym właścicielowi obiektu hotelowego) w związku ze swoim uczestnictwem w Wydarzeniu.",
          "2. W przypadku wyrządzenia szkody w infrastrukturze noclegowej przez grupę Uczestników zajmujących wspólne pomieszczenie, przy jednoczesnym braku możliwości indywidualizacji winy, Uczestnicy ci ponoszą odpowiedzialność solidarną w rozumieniu art. 366 Kodeksu cywilnego.",
          "3. Odpowiedzialność Organizatora z tytułu niewykonania lub nienależytego wykonania zobowiązania ogranicza się wyłącznie do szkód wyrządzonych z winy umyślnej (klauzula egzoneracyjna). Uczestnik podejmuje aktywności fizyczne przewidziane w programie Wydarzenia na własne ryzyko."
        ],
        commentary: "Zastosowano tu najsilniejsze instrumenty prawa cywilnego. \"Odpowiedzialność solidarna\" (ust. 2) oznacza, że Organizator może zażądać pełnej kwoty za zniszczony pokój od jednego wybranego studenta, a to on musi potem domagać się zwrotu od swoich współlokatorów (tzw. roszczenie regresowe). \"Klauzula egzoneracyjna\" (ust. 3) maksymalnie zawęża odpowiedzialność Uczelni za wypadki losowe."
      },
      {
        id: "sec-6",
        title: "§ 6. Zasady przetwarzania danych osobowych",
        content: [
          "1. Zgodnie z art. 13 ust. 1 i 2 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO), administratorem danych osobowych Uczestników jest Uniwersytet Ekonomiczny we Wrocławiu.",
          "2. Dane osobowe (w tym dane identyfikacyjne oraz informacje o osobie do kontaktu w nagłych wypadkach – tzw. ICE) przetwarzane są wyłącznie w celu zawarcia i wykonania umowy o udział w Wydarzeniu (art. 6 ust. 1 lit. b RODO) oraz realizacji prawnie uzasadnionych interesów Administratora (art. 6 ust. 1 lit. f RODO).",
          "3. Dane osobowe ulegają trwałemu usunięciu lub procesowi anonimizacji niezwłocznie po wygaśnięciu roszczeń cywilnoprawnych wynikających z organizacji Wydarzenia, nie później jednak niż w terminie [Liczba] dni od daty jego zakończenia."
        ],
        commentary: "Zamiast ogólników (\"przetwarzamy dane żeby było bezpiecznie\"), wskazujemy konkretne artykuły i litery z Rozporządzenia RODO. Określamy retencję danych z odniesieniem do \"wygaśnięcia roszczeń cywilnoprawnych\", co jest jedynym w 100% legalnym powodem trzymania dokumentów po wyjeździe."
      },
      {
        id: "sec-7",
        title: "§ 7. Przepisy końcowe",
        content: [
          "1. Oświadczenie o akceptacji niniejszego Regulaminu stanowi wymóg sine qua non (warunek konieczny) dopuszczenia Uczestnika do udziału w Wydarzeniu.",
          "2. Organizator zastrzega sobie uprawnienie do jednostronnej zmiany postanowień niniejszego Regulaminu w przypadku wystąpienia obiektywnych przesłanek natury prawnej lub organizacyjnej. Zmieniony Regulamin wiąże Uczestnika, o ile nie wypowie on umowy w terminie 3 dni od daty doręczenia powiadomienia o zmianie.",
          "3. W sprawach nieuregulowanych zastosowanie znajdują odpowiednie przepisy powszechnie obowiązującego prawa polskiego, ze szczególnym uwzględnieniem przepisów ustawy – Kodeks cywilny."
        ],
        commentary: "Użycie łacińskiej paremii \"sine qua non\" podkreśla wagę oświadczenia. Ustęp 2. rozwiązuje odwieczny problem \"czy można zmienić regulamin w trakcie gry?\". Można, ale zgodnie z prawem cywilnym trzeba dać uczestnikowi prawo do rezygnacji, jeśli nowe zasady mu się nie podobają."
      }
    ]
  }
};

export default function LegalHubPage() {
  const [activeTab, setActiveTab] = useState('WIKI'); 
  const [expandedTerm, setExpandedTerm] = useState(null);
  
  const [regCategory, setRegCategory] = useState('external'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // STAN DO OBSŁUGI WIDOKU INTERAKTYWNEGO WZORCA
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // Stan do kontrolowania widoczności komentarzy w czytniku
  const [expandedComments, setExpandedComments] = useState({});

  // Funkcja filtrująca regulaminy po wpisanym tekście
  const filteredRegulations = EVENT_REGULATIONS[regCategory].filter(reg => 
    reg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    reg.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleComment = (index) => {
    setExpandedComments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-24 pt-24 relative overflow-x-hidden">
      
      {/* NAGŁÓWEK */}
      <div className="max-w-6xl mx-auto mb-10 text-center md:text-left animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <Icons.Shield /> Zaplecze Prawne Organizatora
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Akademia <span className="text-indigo-600">Prawa Samorządowego</span>
        </h1>
        <p className="text-lg font-medium text-slate-500 mt-3 max-w-3xl leading-relaxed">
          Profesjonalne repozytorium wiedzy. Zrozum i wdrażaj mechanizmy prawne chroniące struktury uczelniane podczas organizacji kluczowych projektów.
        </p>
      </div>

      {/* GŁÓWNA NAWIGACJA ZAKŁADEK */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-wrap gap-4 border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('WIKI'); setSelectedTemplate(null); }}
          className={`pb-4 px-4 font-black text-[13px] uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'WIKI' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Icons.Book /> Słownik Norm i Praktyk Prawnych
        </button>
        <button 
          onClick={() => { setActiveTab('REGULATIONS'); setSelectedTemplate(null); }}
          className={`pb-4 px-4 font-black text-[13px] uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'REGULATIONS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Icons.Folder /> Baza Struktur Regulaminowych
        </button>
      </div>

      {/* ==================================================== */}
      {/* ZAKŁADKA 1: LEGAL WIKI (EDUKACJA) */}
      {/* ==================================================== */}
      {activeTab === 'WIKI' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 animate-slideUp">
          {LEGAL_WIKI.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${expandedTerm === item.id ? 'border-indigo-300 shadow-2xl shadow-indigo-900/10' : 'border-slate-200 hover:border-indigo-300 cursor-pointer hover:shadow-md'}`}
            >
              <div 
                onClick={() => setExpandedTerm(expandedTerm === item.id ? null : item.id)}
                className="p-6 md:p-8 flex items-center justify-between cursor-pointer group bg-white"
              >
                <div className="pr-6">
                  <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                    <Icons.Folder /> Zakres zastosowania: {item.context}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                    {item.term}
                  </h3>
                </div>
                <div className={`shrink-0 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 transition-all duration-300 ${expandedTerm === item.id ? 'rotate-180 bg-indigo-50 border-indigo-200 text-indigo-600' : 'group-hover:bg-slate-100'}`}>
                  <Icons.ChevronDown />
                </div>
              </div>

              {expandedTerm === item.id && (
                <div className="p-6 md:p-8 pt-0 border-t border-slate-100 bg-slate-50/50">
                  <div className="mb-8 pt-6">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-200 pb-2">Istota Zagadnienia Prawnego</h4>
                    <p className="text-slate-700 text-[15px] leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                    <div className="bg-white border-2 border-red-100 p-5 rounded-2xl relative shadow-sm">
                      <span className="absolute -top-3 left-5 bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Zapis Błędny (Ryzykowny)
                      </span>
                      <p className="text-slate-700 text-sm font-medium mt-3 leading-relaxed">"{item.badExample}"</p>
                    </div>
                    <div className="bg-white border-2 border-emerald-100 p-5 rounded-2xl relative shadow-sm">
                      <span className="absolute -top-3 left-5 bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Rekomendowany Zapis
                      </span>
                      <p className="text-slate-700 text-sm font-bold mt-3 leading-relaxed">"{item.goodExample}"</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Icons.Scale />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Icons.Scale />
                      </div>
                      <div>
                        <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-2">Opinia i Wytyczne Prawne</h4>
                        <p className="text-slate-300 text-[15px] leading-relaxed font-medium">
                          {item.lawyerAdvice}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* ZAKŁADKA 2: BAZA REGULAMINÓW WYDARZEŃ (WIDOK LISTY) */}
      {/* ==================================================== */}
      {activeTab === 'REGULATIONS' && !selectedTemplate && (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn">
          
          {/* Menu Boczne z Kategoriami */}
          <div className="w-full md:w-72 shrink-0">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
              <button 
                onClick={() => { setRegCategory('external'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-[14px] font-bold transition-all ${regCategory === 'external' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Zewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider ${regCategory === 'external' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Masowe</span>
              </button>
              <button 
                onClick={() => { setRegCategory('internal'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-[14px] font-bold transition-all mt-2 ${regCategory === 'internal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Wewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider ${regCategory === 'internal' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Dla SSUEW</span>
              </button>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-5">
            {/* Wyszukiwarka Regulaminów */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center mb-2">
              <span className="pl-4 pr-2 text-slate-400"><Icons.Search /></span>
              <input 
                type="text" 
                placeholder="Znajdź regulamin po tytule lub tagu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 py-3 px-2"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 items-start mb-2">
              <div className="text-blue-500 mt-1"><Icons.Alert /></div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">Struktury dokumentacji eventowej</h4>
                <p className="text-blue-800/80 text-xs leading-relaxed font-medium">
                  Zanim przystąpisz do redagowania regulaminu, zapoznaj się z wymaganą dla niego strukturą. 
                  Baza jest regularnie aktualizowana o nowe wzorce akceptowane przez Dział Radców Prawnych UEW.
                </p>
              </div>
            </div>

            {/* Lista Dokumentów */}
            {filteredRegulations.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredRegulations.map((project, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 group flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-start gap-2 leading-tight mb-2">
                        <span className="text-slate-400 group-hover:text-indigo-500 transition-colors mt-0.5"><Icons.Book /></span> 
                        {project.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {project.desc}
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-4 mb-5 flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      {project.templateId ? (
                        <button 
                          onClick={() => { setSelectedTemplate(project.templateId); setExpandedComments({}); }}
                          className="w-full text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Otwórz Interaktywny Wzór
                        </button>
                      ) : (
                        <button className="w-full text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-200 py-3 rounded-xl transition-all cursor-not-allowed">
                          W Opracowaniu (Wkrótce)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                <p className="text-slate-400 font-bold text-lg">Nie znaleziono wzorców spełniających kryteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TRYB CZYTNIKA: OTWARTY DOKUMENT INTERAKTYWNY */}
      {/* ==================================================== */}
      {activeTab === 'REGULATIONS' && selectedTemplate && TEMPLATES_DATA[selectedTemplate] && (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-slideUp">
          
          {/* Kolumna Lewa: Spis Treści (Przyklejony) */}
          <div className="w-full lg:w-1/4 shrink-0 order-2 lg:order-1">
            <div className="sticky top-28 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="w-full mb-6 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-widest transition-colors rounded-xl flex items-center justify-center gap-2"
              >
                ← Wróć do bazy
              </button>
              
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Spis Paragrafów</h4>
              <ul className="space-y-1">
                {TEMPLATES_DATA[selectedTemplate].sections.map((section, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kolumna Prawa: Twardy Tekst Prawny */}
          <div className="flex-grow order-1 lg:order-2">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Wstęp do Wzorca */}
              <div className="bg-slate-900 p-8 md:p-10 border-b-4 border-indigo-500 relative overflow-hidden">
                <div className="absolute right-0 top-0 text-white opacity-5 text-9xl -mt-10 -mr-10">
                  §
                </div>
                <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3">Wstęp do Wzorca (Dla Organizatora)</h2>
                <p className="text-slate-300 text-sm leading-relaxed font-medium max-w-3xl relative z-10">
                  {TEMPLATES_DATA[selectedTemplate].intro}
                </p>
              </div>

              {/* Nagłówek Dokumentu */}
              <div className="p-8 pb-4 text-center border-b border-slate-100 bg-slate-50">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">
                  {TEMPLATES_DATA[selectedTemplate].title}
                </h1>
              </div>

              {/* Sekcje dokumentu */}
              <div className="p-8 md:p-12 pt-6">
                {TEMPLATES_DATA[selectedTemplate].sections.map((section, index) => (
                  <div key={index} id={section.id} className="mb-12 scroll-mt-28">
                    
                    {/* Treść Paragrafu */}
                    <div className="font-serif text-slate-900 mb-4">
                      <h3 className="text-lg font-bold mb-4">{section.title}</h3>
                      <div className="space-y-3 text-[15px] leading-loose text-justify text-slate-800">
                        {section.content.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    {/* Akordeon: Komentarz Prawniczy */}
                    <div className="mt-4">
                      <button 
                        onClick={() => toggleComment(index)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2 border ${expandedComments[index] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <Icons.Scale />
                        {expandedComments[index] ? 'Ukryj wskazówkę' : 'Zobacz komentarz do zapisu'}
                      </button>

                      {expandedComments[index] && (
                        <div className="mt-3 bg-indigo-50/50 border-l-4 border-indigo-400 rounded-r-xl p-5 shadow-sm animate-fadeIn">
                          <p className="text-slate-700 text-[13px] font-medium leading-relaxed italic">
                            {section.commentary}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}