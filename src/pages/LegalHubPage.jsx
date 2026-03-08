import { useState } from 'react';

const Icons = {
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// ==========================================
// 🧠 BAZA WIEDZY PRAWNEJ (LEGAL WIKI)
// Wcielam się w Radcę Prawnego UEW.
// ==========================================
const LEGAL_WIKI = [
  {
    id: 1,
    term: "Klauzula Abuzywna (Niedozwolona)",
    context: "Regulaminy Wydarzeń, Konkursy",
    desc: "Zapisy w regulaminie, które rażąco naruszają interesy uczestnika (konsumenta), zdejmując z Organizatora całą odpowiedzialność. Jeśli wstawisz klauzulę abuzywną, z mocy prawa jest ona NIEWAŻNA.",
    badExample: "Organizator nie ponosi absolutnie żadnej odpowiedzialności za szkody na mieniu i zdrowiu uczestników powstałe w trakcie imprezy.",
    goodExample: "Organizator nie ponosi odpowiedzialności za szkody na mieniu uczestników, chyba że szkoda powstała z winy umyślnej Organizatora.",
    lawyerAdvice: "Nigdy nie możesz wyłączyć odpowiedzialności za szkody na osobie (np. złamana noga z powodu złej organizacji). Możesz natomiast wyłączyć odpowiedzialność za rzeczy pozostawione bez nadzoru (np. zgubiony telefon na parkiecie)."
  },
  {
    id: 2,
    term: "Prawo do wizerunku (Art. 81 Prawa Autorskiego)",
    context: "Zdjęcia z wydarzeń, UE Party, Bale",
    desc: "Uczestnik musi wyrazić zgodę na publikację swojego wizerunku na social mediach Samorządu. Bez zgody fotografowanie z bliska jest nielegalne.",
    badExample: "Wejście na wydarzenie oznacza automatyczną zgodę na robienie zdjęć każdej osobie i wrzucanie ich do internetu.",
    goodExample: "Wyjątek stanowienia 'szczegółu całości' (zdjęcia tłumu).",
    lawyerAdvice: "Zgoda NIE JEST wymagana, jeśli osoba stanowi jedynie 'szczegół całości' (np. ogólne zdjęcie bawiącego się tłumu na UE Party lub widownia TEDx). Jeśli jednak robisz komuś 'portret' lub zbliżenie, musisz mieć zgodę (często załatwia to akceptacja regulaminu przy zakupie biletu)."
  },
  {
    id: 3,
    term: "Dyskryminacja i Ageizm",
    context: "Zasady wstępu, Rekrutacje, Konkursy",
    desc: "Bezpodstawne ograniczanie praw określonej grupie osób (np. ze względu na wiek, płeć, kierunek studiów), co stanowi naruszenie zasady równego traktowania.",
    badExample: "Osoby powyżej 26 roku życia nie mogą wejść na wydarzenie (bez uzasadnienia).",
    goodExample: "Udział w imprezie 'Bal UEW' mają wyłącznie osoby pełnoletnie (uzasadnienie: serwowany jest alkohol).",
    lawyerAdvice: "Ograniczenia wiekowe lub dotyczące statusu studenta są legalne TYLKO, jeśli wynikają ze specyfiki projektu (np. Adapciak jest logicznie tylko dla pierwszorocznych). Nie możesz wykluczyć studentów zaocznych z wydarzeń ogólnouczelnianych bez twardych powodów organizacyjnych."
  },
  {
    id: 4,
    term: "Siła Wyższa (Force Majeure)",
    context: "Odwoływanie wydarzeń (Gala, Bal, Wyjazdy)",
    desc: "Zdarzenie zewnętrzne, niemożliwe do przewidzenia i zapobieżenia (np. powódź, pandemia, żałoba narodowa), które uniemożliwia realizację projektu.",
    badExample: "W przypadku odwołania imprezy z jakiegokolwiek powodu, nie zwracamy pieniędzy.",
    goodExample: "Organizator zastrzega sobie prawo do odwołania Wydarzenia z powodu działania Siły Wyższej. W takim przypadku koszty uczestnictwa podlegają zwrotowi w kwocie pomniejszonej o udokumentowane wydatki bezzwrotne Organizatora.",
    lawyerAdvice: "Zawsze miej w regulaminie Balu czy Adapciaka klauzulę o Sile Wyższej. Chroni ona budżet Samorządu przed pozwami studentów, jeśli Rektor nagle zamknie uczelnię w dniu wydarzenia."
  },
  {
    id: 5,
    term: "Obowiązek Informacyjny RODO",
    context: "Formularze zapisów (Forms), Konkursy",
    desc: "Zawsze gdy zbierasz dane (Imię, Nazwisko, Mail, Dieta), musisz powiedzieć ludziom, kto jest administratorem danych, w jakim celu je zbiera i jak długo będzie trzymał.",
    badExample: "[Tylko pole: Imię i Nazwisko]",
    goodExample: "[Checkbox]: Akceptuję Regulamin i klauzulę informacyjną RODO stanowiącą załącznik do regulaminu.",
    lawyerAdvice: "Zarząd nie jest administratorem danych w sensie prawnym – jest nim Uczelnia. W regulaminach piszcie: 'Administratorem danych osobowych uczestników jest Uniwersytet Ekonomiczny we Wrocławiu, reprezentowany przez Samorząd Studentów UEW na potrzeby realizacji projektu'."
  }
];

// ==========================================
// 📁 BAZA REGULAMINÓW WYDARZEŃ (Szablony i zasady)
// ==========================================
const EVENT_REGULATIONS = {
  internal: [
    { title: "Wyjazdy Szkoleniowe (Wyjazdy Komisji)", desc: "Regulaminy wyjazdów integracyjno-szkoleniowych dla działaczy SSUEW. Klauzule dot. odpowiedzialności majątkowej za szkody w ośrodkach wypoczynkowych.", tags: ["Ubezpieczenia", "Transport", "BHP"] },
    { title: "Rekrutacje Wewnętrzne", desc: "Zasady naboru do Komisji Samorządu. Klauzule poufności (NDA) dla rekruterów oraz RODO dla kandydatów aplikujących.", tags: ["Poufność", "RODO"] },
    { title: "Przydziałki i Gala Samorządu", desc: "Regulamin przyznawania nagród wewnętrznych, mechanika głosowania kapituły i zasady uczestnictwa w wydarzeniu.", tags: ["Procedura Głosowania", "Event"] },
    { title: "UE Party (Projekty Imprezowe)", desc: "Zasady wejścia na imprezy, wnoszenia własnych napojów, zasady współpracy z klubami (selekcja, bramka) oraz prawo do wizerunku.", tags: ["Regulamin Imprezy", "Wizerunek"] },
  ],
  external: [
    { title: "Projekty Charytatywne (m.in. Animalia)", desc: "Regulaminy zbiórek publicznych, licytacji charytatywnych oraz zasady rozliczania z fundacjami docelowymi.", tags: ["Finanse", "Darowizny"] },
    { title: "Konferencje (np. TEDxUEW, Prelekcje)", desc: "Regulaminy sprzedaży i dystrybucji biletów, prawa autorskie do nagrań prelegentów oraz zasady wejścia na aulę.", tags: ["Ticketing", "Prawa Autorskie"] },
    { title: "Adapciak UEW", desc: "Kompleksowy regulamin obozu dla pierwszorocznych. Obejmuje oświadczenia medyczne, zakwaterowanie, kary dyscyplinarne i politykę zwrotów.", tags: ["Wyjazd zorganizowany", "Oświadczenia"] },
    { title: "Bal UEW / Półmetek", desc: "Regulaminy imprez masowych i zamkniętych. Polityka +18, weryfikacja statusu studenta, odpowiedzialność za garderobę (szatnia).", tags: ["Event Biletowany", "Ageizm"] },
  ]
};

export default function LegalHubPage() {
  const [activeTab, setActiveTab] = useState('WIKI'); // 'WIKI' | 'REGULATIONS'
  const [expandedTerm, setExpandedTerm] = useState(null);
  const [regCategory, setRegCategory] = useState('external'); // 'internal' | 'external'

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
        <p className="text-base font-medium text-slate-500 mt-3 max-w-2xl">
          Miejsce dedykowane organizatorom wydarzeń. Naucz się pisać bezpieczne regulaminy, zrozummy żargon prawniczy i przeglądaj struktury dla konkretnych projektów UEW.
        </p>
      </div>

      {/* GŁÓWNA NAWIGACJA ZAKŁADEK */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('WIKI')}
          className={`pb-4 px-4 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'WIKI' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Icons.Book /> Słownik Organizatora (Jak nie popełniać błędów)
        </button>
        <button 
          onClick={() => setActiveTab('REGULATIONS')}
          className={`pb-4 px-4 font-black text-sm uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'REGULATIONS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Icons.Folder /> Baza Regulaminów Wydarzeń SSUEW
        </button>
      </div>

      {/* ==================================================== */}
      {/* ZAKŁADKA 1: LEGAL WIKI (EDUKACJA) */}
      {/* ==================================================== */}
      {activeTab === 'WIKI' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-1 gap-4 animate-slideUp">
          {LEGAL_WIKI.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${expandedTerm === item.id ? 'border-indigo-200 shadow-xl shadow-indigo-900/5' : 'border-slate-200 hover:border-indigo-300 cursor-pointer'}`}
            >
              {/* Główny pasek (Klikalny) */}
              <div 
                onClick={() => setExpandedTerm(expandedTerm === item.id ? null : item.id)}
                className="p-6 flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Występuje przy: {item.context}</span>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.term}</h3>
                </div>
                <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform duration-300 ${expandedTerm === item.id ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
                  <Icons.ChevronDown />
                </div>
              </div>

              {/* Rozwinięta Treść */}
              {expandedTerm === item.id && (
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-slate-600 text-sm leading-relaxed mt-6 mb-6">
                    {item.desc}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl relative">
                      <span className="absolute -top-3 left-4 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Źle napisane (Błąd)</span>
                      <p className="text-red-900 text-sm italic font-medium mt-2">"{item.badExample}"</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl relative">
                      <span className="absolute -top-3 left-4 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Dobrze napisane</span>
                      <p className="text-emerald-900 text-sm font-medium mt-2">"{item.goodExample}"</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex gap-4 items-start shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                      <Icons.Shield />
                    </div>
                    <div>
                      <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">Główny Radca Prawny Radzi:</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{item.lawyerAdvice}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* ZAKŁADKA 2: BAZA REGULAMINÓW WYDARZEŃ */}
      {/* ==================================================== */}
      {activeTab === 'REGULATIONS' && (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn">
          
          {/* Menu Boczne */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
              <button 
                onClick={() => setRegCategory('external')}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-sm font-bold transition-all ${regCategory === 'external' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Zewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg ${regCategory === 'external' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Ogólnouczelniane</span>
              </button>
              <button 
                onClick={() => setRegCategory('internal')}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-sm font-bold transition-all mt-1 ${regCategory === 'internal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Wewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg ${regCategory === 'internal' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Tylko SSUEW</span>
              </button>
            </div>
          </div>

          {/* Główna lista projektów */}
          <div className="flex-grow grid grid-cols-1 gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-2">
              <div className="text-blue-500 mt-0.5"><Icons.Alert /></div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Zanim napiszesz regulamin swojego wydarzenia...</h4>
                <p className="text-blue-800/80 text-xs mt-1 leading-relaxed">
                  Poniżej znajduje się struktura kluczowych zapisów prawnych dla danego typu projektu. Znajdź swój typ projektu, aby upewnić się, jakie paragrafy są wymagane przez Dział Radców Prawnych UEW.
                </p>
              </div>
            </div>

            {EVENT_REGULATIONS[regCategory].map((project, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Icons.Folder /> {project.title}
                  </h3>
                  <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                    Otwórz archiwum
                  </button>
                </div>
                
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {project.desc}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block w-full mb-1">Kluczowe paragrafy dla tego projektu:</span>
                  {project.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      # {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}