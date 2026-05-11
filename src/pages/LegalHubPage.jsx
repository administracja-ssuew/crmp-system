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
    context: "Regulaminy wyjazdów — LWK, WWK, JWK, Adapciak",
    desc: "Dwie odmienne formy przedpłaty w prawie cywilnym, często błędnie stosowane zamiennie. Zaliczka zawsze podlega zwrotowi w przypadku rezygnacji. Zadatek natomiast (zgodnie z art. 394 Kodeksu Cywilnego) pełni funkcję zabezpieczającą i może zostać zatrzymany przez Organizatora w razie niewykonania umowy przez uczestnika.",
    badExample: "Warunkiem rezerwacji miejsca jest wpłata zaliczki. W przypadku rezygnacji uczestnika, zaliczka nie podlega zwrotowi.",
    goodExample: "Warunkiem rezerwacji miejsca jest wpłata zadatku. W przypadku rezygnacji uczestnika z winy leżącej po jego stronie, wpłacony zadatek przepada na rzecz Organizatora.",
    lawyerAdvice: "Przy organizacji wyjazdów komisji (LWK, WWK, JWK) oraz Adapciaka, gdzie Samorząd z wyprzedzeniem ponosi udokumentowane, bezzwrotne koszty (np. rezerwacja bazy noclegowej, najem autokarów), należy bezwzględnie operować pojęciem 'zadatku'. Użycie słowa 'zaliczka' wymusza jej bezwzględny zwrot rezygnującemu uczestnikowi, co może stanowić bezpośrednie zagrożenie dla płynności budżetu projektu."
  },
  {
    id: 12,
    term: "Siła Wyższa (Vis Maior)",
    context: "Odwoływanie wydarzeń — Bal UEW, GradUEtion, TEDxUEW, Wyjazdy",
    desc: "Zdarzenie o charakterze zewnętrznym, niemożliwe do przewidzenia oraz do zapobieżenia przy zachowaniu należytej staranności (np. klęska żywiołowa, nagłe rozporządzenia władz państwowych, żałoba narodowa). Stanowi obiektywną podstawę prawną do zwolnienia z odpowiedzialności za niewykonanie zobowiązania.",
    badExample: "W przypadku odwołania imprezy z jakiegokolwiek powodu leżącego poza kontrolą Organizatora, wpłacone za bilet środki nie podlegają zwrotowi pod żadnym pozorem.",
    goodExample: "Organizator zastrzega sobie prawo do odwołania Wydarzenia z powodu zaistnienia Siły Wyższej. W takim przypadku koszty uczestnictwa podlegają zwrotowi w kwocie pomniejszonej o proporcjonalną część udokumentowanych wydatków bezzwrotnych.",
    lawyerAdvice: "Regulamin każdego wydarzenia o podwyższonym ryzyku finansowym (Bal UEW, GradUEtion, wynajem autokarów na wyjazdy) musi bezwzględnie zawierać dobrze sformułowaną klauzulę siły wyższej. Mechanizm ten chroni Samorząd przed zarzutami niegospodarności i roszczeniami cywilnymi w sytuacji np. nagłego administracyjnego zamknięcia obiektów Uczelni przez Rektora."
  },
  {
    id: 5,
    term: "Umowa o Dzieło vs Umowa Zlecenie",
    context: "TEDxUEW, Gala Samorządu, Bal UEW — Prelegenci, Fotografowie, DJ, Graficy, Konferansjerzy",
    desc: "Dwa fundamentalnie różne typy umów cywilnoprawnych. Umowa zlecenia (art. 734 KC) zobowiązuje do starannego działania — wynagrodzenie należy się niezależnie od efektu końcowego. Umowa o dzieło (art. 627 KC) zobowiązuje do osiągnięcia konkretnego rezultatu — zamawiający może odmówić zapłaty lub żądać poprawek, jeśli dzieło ma wady.",
    badExample: "Zawarto z fotografem 'Umowę zlecenie' na wykonanie sesji zdjęciowej z Balu UEW. Fotograf dostarczył 30 rozmazanych zdjęć niskiej jakości i żąda pełnego wynagrodzenia.",
    goodExample: "Zawarto 'Umowę o dzieło' z fotografem, określając przedmiot dzieła: 'minimum 200 zdjęć w rozdzielczości co najmniej 3000px, obrobionych, dostarczonych w ciągu 7 dni od zakończenia wydarzenia'. Przy nienależytym wykonaniu zamawiającemu przysługuje rękojmia.",
    lawyerAdvice: "Przy umowach z konferansjerami, DJ-ami czy grafikami — zawsze stosuj umowę o dzieło z precyzyjnie określonym rezultatem. Przy wolontariuszach pełniących dyżury na stoisku (czynność, nie efekt) — umowa zlecenia lub porozumienie wolontariackie. Błędna klasyfikacja może skutkować zakwestionowaniem przez ZUS i koniecznością odprowadzenia zaległych składek wraz z odsetkami."
  },
  {
    id: 6,
    term: "Majątkowe Prawa Autorskie i Licencja",
    context: "TEDxUEW, Gala SSUEW, Fotografia, Filmy z wydarzeń, Materiały graficzne",
    desc: "Autorskie prawa majątkowe (art. 17 ustawy o prawie autorskim i prawach pokrewnych) to wyłączne prawo twórcy do korzystania z utworu i rozporządzania nim. Prawa te mogą być przeniesione (na polach eksploatacji) lub objęte licencją. Bez odrębnej klauzuli umownej organizator wydarzenia nie nabywa automatycznie żadnych praw do materiałów stworzonych przez zatrudnionego fotografa czy prelegenta.",
    badExample: "W umowie z fotografem brak jakiejkolwiek wzmianki o prawach autorskich. Po Balu UEW fotograf wyraża sprzeciw wobec opublikowania zdjęć w mediach społecznościowych i żąda dodatkowego wynagrodzenia za 'licencję'.",
    goodExample: "§ X umowy: 'Twórca niniejszym przenosi na Zamawiającego autorskie prawa majątkowe do dzieła na następujących polach eksploatacji: publiczne wyświetlanie, rozpowszechnianie w internecie (w tym mediach społecznościowych), zamieszczenie w materiałach promocyjnych i sprawozdaniach. Przeniesienie praw następuje w ramach wynagrodzenia określonego w § Y.'",
    lawyerAdvice: "Każda umowa o dzieło dotycząca materiałów wizualnych (zdjęcia, filmy, projekty graficzne, prezentacje prelegentów TEDxUEW) MUSI zawierać klauzulę przeniesienia majątkowych praw autorskich lub licencji na wskazanych polach eksploatacji. Uwaga dodatkowa wynikająca z ZR 71/2025: wszelkie materiały z wydarzeń objętych Patronatem Rektora UEW muszą być przekazane do Biura Komunikacji i Promocji wraz z zgodą na ich nieodpłatne wykorzystanie na wszystkich polach eksploatacji z art. 50 PAIPP."
  },
  {
    id: 7,
    term: "Zgoda na Wizerunek (Art. 81 PAIPP)",
    context: "Wszystkie projekty — fotografia, transmisje live, materiały promocyjne",
    desc: "Art. 81 ustawy o prawie autorskim i prawach pokrewnych stanowi, że rozpowszechnianie wizerunku osoby fizycznej wymaga jej zezwolenia. Wyjątek stanowią osoby publiczne w związku z pełnioną funkcją lub wizerunek stanowiący jedynie element większej całości (np. tłum na koncercie). Naruszenie prawa do wizerunku może skutkować roszczeniami cywilnymi o zaprzestanie, usunięcie materiałów i zadośćuczynienie.",
    badExample: "Na stronie SSUEW opublikowano zdjęcia z Adapciaka bez uzyskania zgód od uczestników. Jeden z uczestników wniósł żądanie usunięcia swojego wizerunku i zadośćuczynienia.",
    goodExample: "[Checkbox w formularzu rejestracyjnym]: 'Wyrażam zgodę na nieodpłatne fotografowanie/filmowanie mojej osoby podczas Wydarzenia oraz na publikację tych materiałów w mediach społecznościowych i materiałach promocyjnych SSUEW. Zgoda jest dobrowolna i może być cofnięta.'",
    lawyerAdvice: "Zgoda na wizerunek powinna być oddzielną klauzulą — nie wplatać jej w ogólne 'akceptuję regulamin'. Przy Adapciaku i Wyjazdach Komisji zbieraj zgody przy rejestracji (checkbox w formularzu). Dla uczestników niepełnoletnich (np. UEWellcome) wymagana jest zgoda rodzica/opiekuna prawnego. Cofnięcie zgody po publikacji zobowiązuje do usunięcia materiałów."
  },
  {
    id: 8,
    term: "Wolontariat i Porozumienie Wolontariackie",
    context: "Animalia, Juwenalia Wrocławskie, Konferencje, każdy projekt angażujący wolontariuszy",
    desc: "Wolontariat reguluje ustawa z dnia 24 kwietnia 2003 r. o działalności pożytku publicznego i wolontariacie. Wolontariusz wykonuje świadczenia nieodpłatnie, dobrowolnie i na rzecz organizacji pożytku publicznego. Z wolontariuszem zawiązuje się pisemne porozumienie wolontariackie (przy współpracy dłuższej niż 30 dni — obowiązkowo na piśmie). Organizacja jest zobowiązana do ubezpieczenia wolontariusza od NNW oraz zapewnienia warunków BHP.",
    badExample: "SSUEW organizuje akcję zbiórkową Animalia. Kilkudziesięciu wolontariuszy pracuje bez żadnego porozumienia i bez ubezpieczenia NNW. Jeden z nich ulega wypadkowi przy przenoszeniu materiałów.",
    goodExample: "Przed każdym projektem angażującym wolontariuszy podpisuje się porozumienie wolontariackie z klauzulą o ubezpieczeniu NNW, określające zakres zadań, czas trwania i zasady odpowiedzialności. Porozumienie archiwizuje się zgodnie z JRWA.",
    lawyerAdvice: "Samorząd Studentów UEW działa w oparciu o struktury Uczelni, dlatego kwestia ubezpieczenia wolontariuszy wymaga każdorazowego uzgodnienia z Pełnomocnikiem Rektora ds. Ubezpieczeń. Nie zakładaj automatycznie, że wolontariusze są objęci jakimkolwiek ubezpieczeniem — zweryfikuj to przed projektem. Brak porozumienia wolontariackiego może być zakwalifikowany przez ZUS jako stosunek pracy lub zlecenia i skutkować obowiązkiem odprowadzenia składek."
  },
  {
    id: 9,
    term: "Odpowiedzialność Deliktowa vs. Kontraktowa",
    context: "Wypadki na eventach, Szkody w mieniu UEW, Roszczenia uczestników",
    desc: "Dwa reżimy odpowiedzialności cywilnej w polskim prawie. Odpowiedzialność kontraktowa (art. 471 KC) powstaje z niewykonania lub nienależytego wykonania umowy. Odpowiedzialność deliktowa (art. 415 KC) to odpowiedzialność za czyn niedozwolony — może jej dochodzić każda osoba poszkodowana, nawet bez umowy z organizatorem.",
    badExample: "Regulamin wydarzenia wyłącza 'wszelką odpowiedzialność organizatora'. Uczestnik wywraca się na mokrej podłodze i doznaje urazu. Klauzula wyłączenia odpowiedzialności jest bezskuteczna wobec deliktów.",
    goodExample: "Regulamin precyzyjnie odróżnia zobowiązania kontraktowe od sfery deliktowej. Zapewnienie bezpiecznych warunków i dostosowanie terenu do wymagań BHP jest traktowane jako priorytet, a nie opcja.",
    lawyerAdvice: "Całkowite wyłączenie odpowiedzialności za szkody na osobie w regulaminie to klauzula abuzywna — bezskuteczna z mocy prawa. Skuteczna ochrona Uczelni to faktyczne zabezpieczenie terenu, ubezpieczenie OC organizatora oraz prowadzenie dokumentacji zdarzeń. W przypadku poważnego wypadku priorytetem jest niezwłoczne powiadomienie Działu Bezpieczeństwa i Higieny Pracy UEW."
  },
  {
    id: 13,
    term: "Obowiązek Informacyjny RODO",
    context: "Formularze zapisów (Google Forms), Konkursy (TWE), Rekrutacje do Komisji",
    desc: "Ustawowy obowiązek nałożony na Administratora Danych Osobowych. Polega na konieczności czytelnego poinformowania podmiotu danych o tożsamości administratora, celach przetwarzania, podstawie prawnej, okresie przechowywania oraz przysługujących prawach (wglądu, usunięcia).",
    badExample: "[W formularzu Google Forms na zapisy na Adapciak znajduje się wyłącznie miejsce na podanie Imienia, Nazwiska i E-maila, bez dodania żadnej klauzuli informacyjnej i akceptacji RODO].",
    goodExample: "[Wymagany Checkbox]: Oświadczam, że zapoznałem/am się z Regulaminem Projektu oraz akceptuję treść klauzuli informacyjnej RODO stanowiącej Załącznik nr 1 do Regulaminu.",
    lawyerAdvice: "Samorząd Studentów UEW nie posiada własnej osobowości prawnej — wszelkie zbierane dane administratuje prawnie Uniwersytet Ekonomiczny we Wrocławiu. Formularze muszą linkować do klauzul informacyjnych zatwierdzonych przez Inspektora Ochrony Danych (IOD) Uczelni (iod@ue.wroc.pl). Dotyczy to każdego projektu: od rekrutacji do komisji, przez zapisy na wyjazdy, po formularze konkursowe TWE i rejestrację na TEDxUEW."
  }
];

const EVENT_REGULATIONS = {
  internal: [
    {
      title: "Letni Wyjazd Komisji (LWK)",
      desc: "Regulamin szkoleniowo-integracyjnego wyjazdu letniego dla działaczy SSUEW. Obejmuje zasady rezerwacji miejsca, klauzule zadatku i odpowiedzialności solidarnej za szkody w obiekcie.",
      tags: ["Zadatek", "Odpowiedzialność Solidarna", "BHP", "RODO", "Samochody UEW"],
      templateId: 'TRIP_TEMPLATE'
    },
    {
      title: "Wiosenny Wyjazd Komisji (WWK)",
      desc: "Regulamin wyjazdu wiosennego — wariant aktualizowany co edycję o specyfikę obiektu i program merytoryczny. Klauzule analogiczne do LWK z uwzględnieniem zmiennych dat i kosztów.",
      tags: ["Zadatek", "Odpowiedzialność Solidarna", "BHP", "RODO", "Samochody UEW"],
      templateId: 'TRIP_TEMPLATE'
    },
    {
      title: "Jesienny Wyjazd Komisji (JWK)",
      desc: "Regulamin wyjazdu jesiennego, najczęściej o charakterze inauguracyjnym dla nowych działaczy. Szczególny nacisk na klauzule dotyczące reżimu porządkowego i zasad integracji.",
      tags: ["Zadatek", "Odpowiedzialność Solidarna", "BHP", "RODO", "Samochody UEW"],
      templateId: 'TRIP_TEMPLATE'
    },
    {
      title: "Rekrutacja Wiosenna / Jesienna",
      desc: "Regulamin naboru do Komisji Samorządu. Obejmuje zasady poufności oceny aplikacji (klauzula NDA dla rekruterów), kryteria oceny oraz RODO w procesie przetwarzania danych aplikantów.",
      tags: ["Poufność (NDA)", "RODO", "Zasada równego traktowania", "Prawa aplikanta"]
    },
    {
      title: "Przydziałki",
      desc: "Regulamin przyznawania wewnętrznych wyróżnień dla działaczy SSUEW. Reguluje procedurę głosowania kapituły, kryteria kwalifikacyjne oraz zasady nominacji.",
      tags: ["Procedura głosowania", "Kapituła", "Nagrody wewnętrzne"]
    },
    {
      title: "Gala Samorządu Studentów",
      desc: "Regulamin corocznej uroczystości podsumowującej działalność SSUEW. Obejmuje zasady uczestnictwa, umowy z obsługą techniczną, fotograficzną i cateringową oraz prawa autorskie do materiałów.",
      tags: ["Umowa o dzieło", "Prawa autorskie", "Wizerunek", "Catering", "Organizacja imprezy"]
    },
    {
      title: "Wigilia Samorządu Studentów",
      desc: "Regulamin spotkania wigilijnego dla działaczy. Kwestie organizacyjne rezerwacji przestrzeni UEW, zasady cateringu oraz odpowiedzialność za stan pomieszczeń po zakończeniu.",
      tags: ["Rezerwacja sali UEW", "Catering", "BHP", "Organizacja imprezy"]
    },
  ],
  external: [
    {
      title: "TEDxUEW",
      desc: "Regulamin konferencji licencjonowanej przez TED. Obejmuje umowy z prelegentami (dzieło + prawa autorskie do nagrań), zasady biletowania, regulamin uczestnika i obowiązki związane z licencją TEDx.",
      tags: ["Licencja TEDx", "Umowa o dzieło", "Prawa autorskie", "Ticketing", "Patronat Rektora"],
      templateId: 'TEDX_TEMPLATE'
    },
    {
      title: "Animalia",
      desc: "Regulamin projektu charytatywnego na rzecz zwierząt. Zasady zbiórki publicznej, licytacji, rozliczania przekazanych środków z fundacjami docelowymi oraz angażowania wolontariuszy.",
      tags: ["Zbiórka publiczna", "Darowizny", "Wolontariat", "RODO", "Rozliczenia z fundacjami"]
    },
    {
      title: "Bal UEW",
      desc: "Regulamin imprezy biletowanej dla środowiska studenckiego UEW. Polityka wejścia (+18, weryfikacja statusu studenta), zasady sprzedaży biletów, odpowiedzialność OC organizatora oraz siła wyższa.",
      tags: ["Impreza masowa", "Biletowanie", "Wiek +18", "Odpowiedzialność OC", "Siła wyższa"]
    },
    {
      title: "Adapciak UEW",
      desc: "Kompleksowy regulamin obozu adaptacyjnego dla studentów pierwszego roku. Oświadczenia medyczne, zakwaterowanie, zasady porządkowe i dyscyplinarne, zadatek oraz RODO (dane wrażliwe dot. stanu zdrowia).",
      tags: ["Wyjazd zorganizowany", "Zadatek", "Dane wrażliwe", "Oświadczenie medyczne", "RODO"]
    },
    {
      title: "GradUEtion",
      desc: "Regulamin uroczystości absolwentów UEW. Warunki uczestnictwa, prawa do wizerunku i materiałów z ceremonii, zasady korzystania z Systemu Identyfikacji Wizualnej UEW w materiałach eventu.",
      tags: ["Wizerunek", "Prawa autorskie", "SIW UEW", "Organizacja ceremonii"]
    },
    {
      title: "Test Wiedzy Ekonomicznej (TWE)",
      desc: "Regulamin konkursu wiedzy ekonomicznej. Zasady uczestnictwa (w tym uczestników niepełnoletnich — wymagana zgoda rodziców), tryb wyłaniania zwycięzców, nagrody i prawa uczestnika do odwołania.",
      tags: ["Regulamin konkursu", "Uczestnicy niepełnoletni", "Nagrody", "RODO", "Procedura odwoławcza"]
    },
    {
      title: "Transekonomik",
      desc: "Regulamin projektu studenckiego o charakterze logistyczno-ekonomicznym. Zasady uczestnictwa, klauzule odpowiedzialności w ramach działań praktycznych oraz prawa autorskie do opracowań.",
      tags: ["Regulamin projektu", "Prawa autorskie", "RODO", "Umowa o dzieło"]
    },
    {
      title: "Konferencja Polskich Uczelni Ekonomicznych (KPUE)",
      desc: "Regulamin ogólnopolskiej konferencji organizowanej przez SSUEW jako gospodarz. Umowy z prelegentami z innych uczelni, zasady biletowania, prawa autorskie do nagrań i materiałów konferencyjnych.",
      tags: ["Konferencja ogólnopolska", "Patronat Rektora", "Umowa o dzieło", "Prawa autorskie", "Ticketing"]
    },
    {
      title: "Mosty Ekonomiczne",
      desc: "Regulamin projektu networkingowego łączącego uczelnie ekonomiczne. Zasady udziału, ochrona danych osobowych uczestników z zewnętrznych uczelni jako podmiotów trzecich oraz zasady współpracy między organizacjami.",
      tags: ["Networking", "RODO (podmioty zewnętrzne)", "Współorganizacja", "Umowy partnerskie"]
    },
    {
      title: "Juwenalia Wrocławskie",
      desc: "Regulamin udziału SSUEW jako współorganizatora ogólnowrocławskich Juwenaliów. Zasady koordynacji z URSA i innymi samorządami studenckimi, podział odpowiedzialności i kosztów, zasady bezpieczeństwa imprezy masowej.",
      tags: ["Impreza masowa", "Współorganizacja (URSA)", "Odpowiedzialność OC", "Podział kosztów", "BHP"]
    },
  ]
};

// Zarządzenia — zweryfikowane (na podstawie rzeczywistych dokumentów UEW) i robocze (wymagają weryfikacji numeru)
const RECTOR_ORDERS = [
  {
    id: 'patronat',
    type: 'Zarządzenie Rektora',
    number: 'ZR nr 71/2025',
    verified: true,
    title: 'Regulamin przyznawania Honorowego Patronatu Rektora UEW oraz przyjmowania przez Rektora UEW członkostwa w Komitecie Honorowym',
    relevance: 'TEDxUEW, KPUE, Mosty Ekonomiczne, Juwenalia Wrocławskie — każde wydarzenie, przy którym SSUEW ubiega się o Patronat Rektora',
    keyPoints: [
      'Wniosek o Patronat składa wyłącznie Organizator wydarzenia — za pośrednictwem Biura Rektora (biuro.rektora@ue.wroc.pl), według wzoru dostępnego na uew.pl/kontakt/. Do wniosku obowiązkowo dołącza się szczegółowy program wydarzenia.',
      'Termin złożenia wniosku: nie później niż 30 dni przed dniem rozpoczęcia wydarzeniem oraz nie wcześniej niż 6 miesięcy przed. Wniosek podpisany kwalifikowanym podpisem elektronicznym lub w formie skanu z podpisem własnoręcznym.',
      'Patronat nie jest stały — przy projektach cyklicznych (TEDxUEW, KPUE) wniosek składa się każdorazowo przed każdą edycją. Złożenie wniosku nie jest równoznaczne z jego przyznaniem.',
      'Przyznanie Patronatu nie oznacza deklaracji wsparcia finansowego ani zobowiązuje Rektora do uczestnictwa w wydarzeniu. Nie obejmuje wydarzeń o charakterze lobbystycznym, reklamowym, komercyjnym ani marketingowym.',
      'Po uzyskaniu Patronatu: logo UEW umieszcza się wyłącznie po akceptacji Biura Komunikacji i Promocji, zgodnie z SIW UEW. Po zakończeniu: materiały (zdjęcia, filmy, info prasowe) należy niezwłocznie przekazać na contentmarketing@ue.wroc.pl wraz z zgodą na nieodpłatne wykorzystanie na wszystkich polach eksploatacji z art. 50 PAIPP.',
    ],
    warning: 'Posługiwanie się informacją o Patronacie Rektora UEW bez uzyskania pozytywnej odpowiedzi z Biura Rektora stanowi nieuprawnione wykorzystanie dóbr osobistych i wizerunku Uczelni. Rektor UEW może cofnąć przyznany Patronat — wówczas Organizator ma obowiązek niezwłocznego usunięcia wszystkich oznaczeń z materiałów.',
    contactUnit: 'Biuro Rektora UEW — biuro.rektora@ue.wroc.pl',
    note: 'Formularz wniosku dostępny na stronie uew.pl/kontakt/. Zarządzenie weszło w życie jako ZR nr 71/2025 — treść potwierdzona.',
  },
  {
    id: 'pojazdy',
    type: 'Zarządzenie Kanclerza',
    number: 'ZKA nr 5/2025 (w mocy od 01.01.2026)',
    verified: true,
    title: 'Instrukcja korzystania z samochodów służbowych Uniwersytetu Ekonomicznego we Wrocławiu',
    relevance: 'Transport na wyjazdy komisji (LWK, WWK, JWK), przewóz sprzętu SSUEW, logistyka eventów wymagająca pojazdu UEW',
    keyPoints: [
      'Samochodem służbowym UEW kieruje wyłącznie pracownik UEW zatrudniony na stanowisku kierowcy. Studenci i działacze Samorządu nie mogą samodzielnie prowadzić pojazdów służbowych UEW — żadnych wyjątków.',
      'Zapotrzebowania SSUEW na samochód służbowy obsługuje Sekretariat Prorektora ds. Studenckich i Kształcenia (§ 1 ust. 6 Instrukcji). Zamówienie składa się w systemie EZD, druk: Zamówienie.na.przydział.samochodu.służbowego.',
      'Wymagane wyprzedzenie: 3 dni robocze — jazda lokalna; 7 dni — wyjazd poza miasto; 10 dni — wyjazd zagraniczny. W sytuacjach wyjątkowych dopuszczalne zamówienie telefoniczne, z obowiązkiem złożenia formalnego wniosku w EZD w ciągu 3 dni roboczych.',
      'Koszty rozliczane według liczby faktycznie przejechanych kilometrów i stawki za 1 km ustalonej przez Dział Controllingu. Kosztami obciążana jest jednostka wskazana w Zamówieniu (centrum kosztów projektu SSUEW).',
      'Dodatkowa akceptacja Kanclerza wymagana przy: wyjazdach za granicę, korzystaniu z pojazdu po godz. 15:00 / w dni wolne / niedziele i święta, oraz wyjazdach do miejscowości z dogodnym transportem zbiorowym (z wyjątkiem spraw zaopatrzeniowych).',
    ],
    warning: 'Samowolne użycie pojazdu służbowego przez osobę nieupoważnioną (tj. osobę niebędącą pracownikiem UEW na stanowisku kierowcy) może zostać zakwalifikowane jako przywłaszczenie mienia Uczelni (art. 284 KK). Podpisanie Zamówienia oznacza automatyczną zgodę na obciążenie budżetu jednostki wnioskującej kosztami przejazdu.',
    contactUnit: 'Sekretariat Prorektora ds. Studenckich i Kształcenia (zapotrzebowania SSUEW) / Dział Logistyki UEW',
    note: 'Zarządzenie Kanclerza nr 5/2025 z dnia 15 grudnia 2025 r., w mocy od 01.01.2026 r. Uchyla ZKA nr 9/2024. Sygnatura: R-CLO-DOP.021.3.5.2025.',
  },
{
    id: 'kasacja',
    type: 'Zarządzenie Rektora',
    number: 'ZR nr 24/2026 (od 26.02.2026)',
    verified: true,
    title: 'Powołanie Rektorskiej Komisji Likwidacyjno-Kasacyjnej składników rzeczowych majątku ruchomego i wartości niematerialnych i prawnych w UEW',
    relevance: 'Kasacja sprzętu SSUEW — wykreślenie zużytego, zniszczonego lub zbędnego mienia z Księgi Inwentarzowej Uczelni',
    keyPoints: [
      'Regulamin Komisji (załącznik do ZR 24/2026) wprost obejmuje mienie powierzone Samorządowi Studenckiemu (§ 1 ust. 2). SSUEW inicjuje procedurę, wysyłając zgłoszenie na adres klk1@ue.wroc.pl — wzór zgłoszenia: Załącznik nr 1 do Regulaminu. Zgłoszenie musi zawierać: nr pola spisowego, pełną nazwę jednostki, imię i nazwisko osoby odpowiedzialnej materialnie, listę numerów inwentarzowych oraz powód likwidacji każdego składnika.',
      'KLK (skład: Maciej Olejasz — przewodniczący, Krzysztof Malec — z-ca, Martyna Kunik, Jarosław Guz, Jan Trudzik) weryfikuje zasadność i sporządza Wniosek (Załącznik nr 2). Wniosek podpisuje osoba odpowiedzialna materialnie po stronie SSUEW, a następnie akceptuje go Kwestor i Kanclerz UEW.',
      'Po akceptacji wniosku KLK fizycznie odbiera mienie i sporządza Protokół Kasacyjny (Załącznik nr 3) — w trzech egzemplarzach: dla Działu Księgowości Majątkowej, dla osoby odpowiedzialnej materialnie i do dokumentacji KLK. Protokół jest podstawą wyksięgowania składnika z ewidencji.',
      'Jeśli sprzęt jest zbędny dla SSUEW, ale niezniszczony i nadający się do użycia — KLK może go przekazać innej jednostce UEW na podstawie dokumentu ZMU (Zmiana Miejsca Użytkowania), zamiast kasować. Warto to sprawdzić przed złożeniem zgłoszenia likwidacyjnego.',
      'Likwidacja fizyczna odbywa się w składzie co najmniej trzyosobowym KLK, zgodnie z ustawą o odpadach z 14.12.2012 r. — sprzęt elektroniczny obligatoryjnie przez certyfikowany recykling (dyrektywa WEEE).',
    ],
    warning: 'Fizyczne zniszczenie lub wyrzucenie sprzętu figurującego w Księdze Inwentarzowej UEW bez protokołu KLK stanowi naruszenie dyscypliny finansów publicznych i może skutkować odpowiedzialnością osoby materialnie odpowiedzialnej za mienie. Procedurę kasacyjną należy bezwzględnie inicjować przed jakimkolwiek usunięciem przedmiotu.',
    contactUnit: 'KLK — zgłoszenia na klk1@ue.wroc.pl / Dział Księgowości Majątkowej UEW (nadzór: Kanclerz)',
    note: 'Sygnatura: R-CLO-DOP.021.1.24.2026. Zarządzenie uchyla ZR 102/2021 i ZR 213/2022. Wzory druków: Załącznik nr 1 (zgłoszenie), Załącznik nr 2 (wniosek do akceptacji), Załącznik nr 3 (protokół kasacyjny).',
  },
  {
    id: 'teren',
    type: 'Zarządzenie Rektora',
    number: 'ZR nr 10/2026 (od 16.02.2026)',
    verified: true,
    title: 'Regulamin terenu Uniwersytetu Ekonomicznego we Wrocławiu',
    relevance: 'Organizacja każdego wydarzenia na kampusie UEW — eventy plenerowe, nagłośnienie, drony, działalność reklamowa, catering, sprzęt i bezpieczeństwo uczestników',
    keyPoints: [
      'Teren UEW jest obszarem autonomicznym w rozumieniu ustawy PSW. Zgody Kanclerza lub jego zastępcy wymaga każdorazowo: (1) użycie sprzętu nagłaśniającego na terenie Uczelni, (2) użycie dronów i modeli statków powietrznych, (3) prowadzenie działalności handlowej, usługowej, reklamowej, gastronomicznej lub akwizycyjnej przez podmioty trzecie.',
      'Na terenie UEW obowiązuje bezwzględny zakaz: spożywania alkoholu i zażywania środków odurzających, używania materiałów pirotechnicznych i substancji chemicznych, wyprowadzania psów, niszczenia mienia i roślinności, parkowania na drogach pożarowych oraz wjazdu pojazdów na piesze ciągi komunikacyjne (wyjątek: zgoda Kanclerza). Prędkość pojazdów ograniczona do 20 km/h.',
      'Teren Uczelni objęty jest całodobowym monitoringiem wizyjnym. Klauzula informacyjna RODO dla monitoringu dostępna jest na portierniach obiektów Uczelni — nie w dokumentach SSUEW.',
      'Uczelnia nie ponosi odpowiedzialności za szkody na terenie, chyba że co innego wynika z przepisów powszechnie obowiązujących (§ 2 ust. 7 Regulaminu). Korzystający odpowiada za szkody, które wyrządzi. Osoby niepełnoletnie niebędące studentami przebywają na terenie UEW wyłącznie pod nadzorem przedstawiciela ustawowego lub opiekuna.',
      'Służba ochrony uprawniona jest do: legitymowania osób w celu ustalenia tożsamości, wzywania do opuszczenia terenu Uczelni oraz — w przypadku bezpośredniego zagrożenia życia lub zdrowia — ujęcia osób i przekazania służbom państwowym. W nagłych sytuacjach: 112 oraz służba ochrony: 608 364 205 / 608 364 224. Portiernia Główna (całodobowa): 71 36 80 110.',
    ],
    warning: 'Organizacja eventu na terenie UEW z użyciem nagłośnienia lub dronów bez pisemnej zgody Kanclerza stanowi naruszenie Regulaminu terenu i może skutkować przerwaniem wydarzenia przez służbę ochrony. Podmioty zewnętrzne (np. cateringowe, reklamowe) działające na kampusie bez umowy z Uczelnią lub zgody Kanclerza naruszają §2 ust. 3 Regulaminu.',
    contactUnit: 'Kanclerz UEW / Zastępca Kanclerza ds. Technicznych / Służba ochrony: 608 364 205',
    note: 'Sygnatura: R-CLO-DOP.021.1.10.2026. Zarządzenie w mocy od 16.02.2026 r., podpisane przez Rektora prof. dr hab. Czesława Zająca. Pełna treść Regulaminu dostępna na wszystkich portierniach obiektów UEW.',
  },
];

const TEMPLATES_DATA = {
  TRIP_TEMPLATE: {
    title: "REGULAMIN WYJAZDU SZKOLENIOWO-INTEGRACYJNEGO",
    subtitle: "„[NAZWA WYJAZDU]”",
    intro: "Niniejszy dokument jest wzorcem regulaminowym dla wyjazdów szkoleniowo-integracyjnych komisji SSUEW (LWK, WWK, JWK). Przed każdą edycją uzupełnij pola oznaczone nawiasami kwadratowymi — są to miejsca wymagające wpisania konkretnych danych dla danej edycji. Pod każdym paragrafem dostępny jest komentarz wyjaśniający znaczenie poszczególnych zapisów i ich podstawy prawne.",
    sections: [
      {
        id: "sec-1",
        title: "§ 1. Postanowienia ogólne",
        content: [
          "1. Niniejszy Regulamin określa zasady udziału w wyjeździe szkoleniowo-integracyjnym pod nazwą „[nazwa wydarzenia]”, organizowanym w terminie od [data] do [data] w [nazwa i adres obiektu], zwanym dalej „Wydarzeniem”.",
          "2. Wydarzenie jest realizowane w ramach działalności Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu, zwanego dalej „SSUEW”, prowadzonej na rzecz społeczności studenckiej Uniwersytetu Ekonomicznego we Wrocławiu.",
          "3. Organizatorem Wydarzenia jest Uniwersytet Ekonomiczny we Wrocławiu, zwany dalej „Uczelnią” albo „Organizatorem”, przy czym czynności organizacyjne związane z przygotowaniem i przeprowadzeniem Wydarzenia wykonuje SSUEW, w zakresie wynikającym z regulacji wewnętrznych Uczelni i Samorządu Studentów.",
          "4. Udział w Wydarzeniu jest dobrowolny i wymaga uprzedniego zaakceptowania niniejszego Regulaminu.",
          "5. Regulamin jest udostępniany kandydatom na uczestników przed dokonaniem zgłoszenia udziału w Wydarzeniu.",
          "6. Ilekroć w Regulaminie jest mowa o:",
          "1) Regulaminie – należy przez to rozumieć niniejszy regulamin Wydarzenia;",
          "2) Wydarzeniu – należy przez to rozumieć wyjazd szkoleniowo-integracyjny, o którym mowa w ust. 1;",
          "3) Organizatorze – należy przez to rozumieć Uniwersytet Ekonomiczny we Wrocławiu;",
          "4) SSUEW – należy przez to rozumieć Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu;",
          "5) Uczestniku – należy przez to rozumieć osobę zakwalifikowaną do udziału w Wydarzeniu, która spełniła warunki określone w Regulaminie;",
          "6) Terenie Wydarzenia – należy przez to rozumieć obiekt, miejsce zakwaterowania, miejsca realizacji programu oraz inne przestrzenie wykorzystywane w związku z Wydarzeniem;",
          "7) Kadrze Organizacyjnej – należy przez to rozumieć osoby wskazane przez SSUEW do bieżącej koordynacji Wydarzenia."
        ],
        commentary: [
          "Ten paragraf wynika przede wszystkim z konstrukcji wzorca umownego z art. 384 Kodeksu cywilnego. Regulamin wydarzenia działa jak wzorzec umowy: wiąże uczestnika wtedy, gdy został mu doręczony albo udostępniony przed zawarciem umowy udziału w wydarzeniu. Dlatego w treści paragrafu wskazano, że Regulamin musi być udostępniony kandydatom przed dokonaniem zgłoszenia i akceptacją warunków udziału.",
          "Wskazanie Uniwersytetu Ekonomicznego we Wrocławiu jako Organizatora wynika z tego, że to Uczelnia posiada osobowość prawną i może być stroną stosunków cywilnoprawnych. Samorząd Studencki działa natomiast w ramach uczelni na podstawie ustawy Prawo o szkolnictwie wyższym i nauce. Art. 110 PSWiN stanowi, że studenci tworzą samorząd studencki, który działa przez swoje organy i jest reprezentantem ogółu studentów uczelni, ale nie oznacza to automatycznie odrębnej osobowości prawnej samorządu.",
          "Definicje pojęć w ust. 6 mają znaczenie porządkujące. Ograniczają ryzyko sporu interpretacyjnego, np. czy „Organizator” oznacza Uczelnię, SSUEW, konkretną komisję czy koordynatora projektu."
        ]
      },
      {
        id: "sec-2",
        title: "§ 2. Warunki udziału i kwalifikacja uczestników",
        content: [
          "1. Uczestnikiem Wydarzenia może być osoba, która łącznie:",
          "a) ukończyła 18 lat najpóźniej w dniu rozpoczęcia Wydarzenia;",
          "b) posiada pełną zdolność do czynności prawnych;",
          "c) posiada aktywny status studenta Uniwersytetu Ekonomicznego we Wrocławiu;",
          "d) jest członkiem albo osobą współpracującą z komisją, jednostką lub projektem SSUEW, którego dotyczy Wydarzenie;",
          "e) prawidłowo wypełniła formularz zgłoszeniowy;",
          "f) zaakceptowała Regulamin;",
          "g) uiściła opłatę udziałową, o ile została przewidziana.",
          "2. Organizator może dopuścić do udziału w Wydarzeniu osoby nieposiadające aktywnego statusu studenta UEW, w szczególności alumnów SSUEW, jeżeli jest to uzasadnione charakterem Wydarzenia, programem szkoleniowym albo potrzebami organizacyjnymi.",
          "3. Dopuszczenie osób, o których mowa w ust. 2, wymaga każdorazowo wyraźnej decyzji Organizatora albo osoby odpowiedzialnej za organizację Wydarzenia z ramienia SSUEW.",
          "4. Samo wypełnienie formularza zgłoszeniowego nie gwarantuje udziału w Wydarzeniu.",
          "5. Organizator może odmówić zakwalifikowania osoby do udziału w Wydarzeniu, jeżeli:",
          "a) liczba miejsc została wyczerpana;",
          "b) osoba nie spełnia warunków udziału;",
          "c) formularz zgłoszeniowy zawiera braki lub nieprawdziwe dane;",
          "d) udział danej osoby mógłby istotnie utrudnić bezpieczną lub prawidłową realizację Wydarzenia;",
          "e) wobec danej osoby występują uzasadnione zastrzeżenia wynikające z wcześniejszego rażącego naruszenia regulaminów wydarzeń SSUEW lub Uczelni.",
          "6. Zawarcie umowy udziału w Wydarzeniu następuje z chwilą potwierdzenia przez Organizatora zakwalifikowania osoby do udziału w Wydarzeniu oraz spełnienia przez nią warunków wskazanych w ust. 1."
        ],
        commentary: [
          "Ten paragraf opiera się na zasadzie swobody kształtowania stosunku cywilnoprawnego, wynikającej z Kodeksu cywilnego, w szczególności z konstrukcji umowy i wzorca umownego. Organizator może określić warunki udziału w wydarzeniu, o ile nie są sprzeczne z ustawą, zasadami współżycia społecznego ani naturą danego stosunku prawnego.",
          "Wymóg ukończenia 18 lat i posiadania pełnej zdolności do czynności prawnych ma znaczenie cywilnoprawne. Uczestnik akceptuje Regulamin, może ponosić odpowiedzialność za szkody, składa oświadczenia i zobowiązuje się do określonego zachowania. W przypadku osób niepełnoletnich konieczne byłyby dodatkowe zgody przedstawicieli ustawowych, co istotnie komplikuje organizację wyjazdu.",
          "Warunek posiadania statusu studenta UEW wynika z charakteru wydarzenia jako działania Samorządu Studentów. Art. 110 PSWiN wiąże samorząd studencki ze wspólnotą studentów danej uczelni, dlatego podstawową grupą adresatów powinny być osoby należące do tej wspólnoty.",
          "Zapis o alumnach ma charakter wyjątku organizacyjnego. Nie tworzy generalnego prawa byłych działaczy do udziału w wydarzeniu, tylko pozwala Organizatorowi dopuścić ich wtedy, gdy jest to uzasadnione programem, szkoleniem, mentoringiem albo potrzebami organizacyjnymi."
        ]
      },
      {
        id: "sec-3",
        title: "§ 3. Opłata udziałowa i zasady rezygnacji",
        content: [
          "1. Udział w Wydarzeniu wiąże się z obowiązkiem uiszczenia opłaty udziałowej w wysokości [kwota] zł, chyba że Organizator postanowi inaczej.",
          "2. Opłatę należy uiścić na rachunek bankowy wskazany przez Organizatora, w terminie określonym w informacji organizacyjnej.",
          "3. Za dzień zapłaty uznaje się dzień uznania rachunku bankowego Organizatora.",
          "4. Opłata udziałowa przeznaczona jest na pokrycie kosztów organizacji Wydarzenia, w szczególności kosztów zakwaterowania, wyżywienia, transportu, materiałów organizacyjnych, programu szkoleniowego lub innych kosztów bezpośrednio związanych z realizacją Wydarzenia.",
          "5. Uczestnik może zrezygnować z udziału w Wydarzeniu poprzez złożenie oświadczenia w formie dokumentowej, w szczególności za pośrednictwem wiadomości e-mail wysłanej na adres: [adres e-mail].",
          "6. W przypadku rezygnacji:",
          "1) nie później niż [np. 14] dni przed rozpoczęciem Wydarzenia – Uczestnikowi przysługuje zwrot opłaty udziałowej, z wyłączeniem kosztów już poniesionych przez Organizatora, których nie można odzyskać;",
          "2) po terminie wskazanym w pkt 1 – zwrot opłaty udziałowej może zostać ograniczony do części, która nie została jeszcze wydatkowana albo którą Organizator może odzyskać;",
          "3) w przypadku niestawienia się Uczestnika na Wydarzeniu bez wcześniejszej rezygnacji – opłata udziałowa nie podlega zwrotowi, chyba że Organizator postanowi inaczej w szczególnie uzasadnionym przypadku.",
          "7. Organizator może dopuścić wskazanie osoby zastępującej Uczestnika, który rezygnuje z udziału, jeżeli:",
          "a) osoba zastępująca spełnia warunki udziału;",
          "b) zmiana nie powoduje dodatkowych kosztów lub utrudnień organizacyjnych;",
          "c) zmiana nastąpiła w terminie umożliwiającym prawidłową aktualizację dokumentacji Wydarzenia.",
          "8. W przypadku odwołania Wydarzenia przez Organizatora Uczestnikowi przysługuje zwrot uiszczonej opłaty udziałowej, z zastrzeżeniem sytuacji, w których przepisy prawa albo warunki rozliczenia kosztów stanowią inaczej.",
          "9. Organizator nie ponosi odpowiedzialności za indywidualne koszty poniesione przez Uczestnika niezależnie od Organizatora, w szczególności koszty prywatnego dojazdu, zakupów własnych lub prywatnych rezerwacji, chyba że obowiązek ich zwrotu wynika z bezwzględnie obowiązujących przepisów prawa."
        ],
        commentary: [
          "Ten paragraf wynika z cywilnoprawnego charakteru udziału w wydarzeniu. Uczestnik otrzymuje określone świadczenia organizacyjne, np. nocleg, wyżywienie, transport lub program szkoleniowy, a w zamian może być zobowiązany do wniesienia opłaty udziałowej.",
          "Celowo zastosowano pojęcie opłaty udziałowej, a nie „zadatku”. Zadatek z art. 394 Kodeksu cywilnego ma określone skutki prawne, w szczególności możliwość zatrzymania zadatku w razie niewykonania umowy przez jedną ze stron. Przy wydarzeniach studenckich bezpieczniejsze jest jednak powiązanie zasad zwrotu z realnie poniesionymi i nieodzyskiwalnymi kosztami Organizatora, ponieważ jest to bardziej proporcjonalne i łatwiejsze do obrony.",
          "Zapis o dacie uznania rachunku bankowego Organizatora ogranicza spory dowodowe. W praktyce nie liczy się samo zlecenie przelewu przez uczestnika, lecz moment, w którym środki rzeczywiście znajdą się na rachunku wskazanym przez Organizatora.",
          "Mechanizm rezygnacji jest skonstruowany tak, aby z jednej strony chronić uczestnika, a z drugiej zabezpieczać budżet wydarzenia. Organizator nie powinien automatycznie zatrzymywać całej opłaty, jeżeli nie poniósł jeszcze kosztów albo może je odzyskać. Jednocześnie uczestnik nie powinien oczekiwać pełnego zwrotu, jeżeli jego późna rezygnacja powoduje realne koszty po stronie Organizatora."
        ]
      },
      {
        id: "sec-4",
        title: "§ 4. Zakres świadczeń Organizatora",
        content: [
          "1. W ramach Wydarzenia Organizator zapewnia Uczestnikom świadczenia wskazane w informacji organizacyjnej, w szczególności:",
          "a) zakwaterowanie;",
          "b) wyżywienie w zakresie określonym w programie;",
          "c) udział w części szkoleniowej, integracyjnej lub programowej;",
          "d) transport, jeżeli został wyraźnie przewidziany przez Organizatora;",
          "e) opiekę organizacyjną Kadry Organizacyjnej.",
          "2. Szczegółowy zakres świadczeń może zostać doprecyzowany w wiadomości organizacyjnej, formularzu zgłoszeniowym, harmonogramie albo innym dokumencie przekazanym Uczestnikom przed rozpoczęciem Wydarzenia.",
          "3. Organizator nie zapewnia Uczestnikom indywidualnego ubezpieczenia następstw nieszczęśliwych wypadków ani ubezpieczenia odpowiedzialności cywilnej, chyba że informacja organizacyjna stanowi inaczej.",
          "4. Uczestnik może we własnym zakresie zawrzeć dodatkowe ubezpieczenie NNW lub OC na czas udziału w Wydarzeniu.",
          "5. Organizator zastrzega sobie prawo do zmian w programie Wydarzenia, jeżeli jest to uzasadnione względami organizacyjnymi, bezpieczeństwa, pogodowymi, technicznymi albo innymi okolicznościami niezależnymi od Organizatora."
        ],
        commentary: [
          "Ten paragraf służy doprecyzowaniu treści zobowiązania Organizatora. W świetle Kodeksu cywilnego strony powinny wiedzieć, jakie świadczenia są objęte umową, a jakie nie. Dlatego wskazano przykładowo zakwaterowanie, wyżywienie, program, transport i opiekę organizacyjną.",
          "Zapis o ubezpieczeniu jest istotny, ponieważ brak takiej informacji mógłby prowadzić do błędnego przekonania, że udział w wydarzeniu automatycznie obejmuje NNW albo OC. Jeżeli Organizator nie zapewnia ubezpieczenia, powinno być to wskazane wprost, żeby uczestnik mógł samodzielnie podjąć decyzję o ewentualnym ubezpieczeniu.",
          "Ustęp dotyczący zmian programu wynika z potrzeby zabezpieczenia wykonania umowy w sytuacjach organizacyjnych, technicznych, pogodowych albo bezpieczeństwa. Zmiana programu nie powinna jednak prowadzić do całkowitej zmiany charakteru wydarzenia, bo wtedy mogłaby być traktowana jako istotna zmiana warunków udziału."
        ]
      },
      {
        id: "sec-5",
        title: "§ 5. Obowiązki Uczestnika",
        content: [
          "1. Uczestnik zobowiązuje się do:",
          "a) przestrzegania Regulaminu;",
          "b) stosowania się do uzasadnionych poleceń Kadry Organizacyjnej związanych z bezpieczeństwem, porządkiem i prawidłową realizacją Wydarzenia;",
          "c) przestrzegania regulaminu obiektu, w którym odbywa się Wydarzenie;",
          "d) punktualnego uczestnictwa w obowiązkowych elementach programu;",
          "e) poszanowania mienia Organizatora, Uczelni, obiektu, innych Uczestników oraz osób trzecich;",
          "f) zachowania zgodnego z zasadami współżycia społecznego, kultury osobistej i poszanowania godności innych osób;",
          "g) niezwłocznego informowania Kadry Organizacyjnej o sytuacjach mogących zagrażać bezpieczeństwu, zdrowiu, mieniu lub prawidłowej realizacji Wydarzenia.",
          "2. Uczestnik ponosi odpowiedzialność za rzeczy osobiste zabrane na Wydarzenie, chyba że szkoda powstała z przyczyn, za które odpowiedzialność ponosi Organizator lub inny podmiot.",
          "3. Uczestnik zobowiązany jest posiadać przy sobie dokument tożsamości oraz, w miarę potrzeby, dokument potwierdzający status studenta.",
          "4. Uczestnik, który przyjmuje na stałe leki, ma szczególne potrzeby zdrowotne lub posiada informacje istotne dla bezpieczeństwa jego udziału w Wydarzeniu, powinien rozważyć przekazanie Organizatorowi niezbędnych informacji w zakresie koniecznym do zapewnienia bezpieczeństwa. Podanie takich informacji jest dobrowolne."
        ],
        commentary: [
          "Ten paragraf określa obowiązki uczestnika jako strony stosunku cywilnoprawnego. Skoro uczestnik korzysta ze świadczeń Organizatora i przebywa na wydarzeniu organizowanym przez Uczelnię/SSUEW, powinien przestrzegać Regulaminu, zasad obiektu oraz poleceń organizacyjnych związanych z bezpieczeństwem i porządkiem.",
          "Sformułowanie „uzasadnione polecenia Kadry Organizacyjnej” jest celowe. Nie chodzi o dowolne podporządkowanie uczestnika organizatorom, tylko o polecenia związane z prawidłową realizacją wydarzenia, bezpieczeństwem, ochroną mienia i porządkiem. Taki zapis jest bardziej proporcjonalny i mniej narażony na zarzut arbitralności.",
          "Ustęp dotyczący informacji zdrowotnych musi być ostrożny z punktu widzenia RODO. Dane o zdrowiu, lekach, alergiach czy szczególnych potrzebach mogą stanowić szczególne kategorie danych osobowych. Ich przetwarzanie wymaga odrębnej podstawy, co do zasady wyraźnej zgody osoby, której dane dotyczą. Dlatego nie należy wpisywać bezwzględnego obowiązku podania takich informacji, lecz wskazać dobrowolność ich przekazania w zakresie niezbędnym dla bezpieczeństwa uczestnika."
        ]
      },
      {
        id: "sec-6",
        title: "§ 6. Zakazy porządkowe",
        content: [
          "1. W czasie Wydarzenia zakazuje się:",
          "a) posiadania, zażywania, udostępniania lub dystrybucji środków odurzających, substancji psychotropowych, nowych substancji psychoaktywnych lub innych substancji zabronionych przez prawo;",
          "b) wnoszenia, posiadania lub używania broni, amunicji, materiałów wybuchowych, pirotechnicznych albo innych przedmiotów lub substancji mogących stwarzać zagrożenie;",
          "c) stosowania przemocy fizycznej, psychicznej, słownej, seksualnej albo jakichkolwiek form nękania, dyskryminacji lub poniżania;",
          "d) niszczenia, uszkadzania lub przywłaszczania mienia;",
          "e) zakłócania ciszy nocnej, porządku publicznego lub zasad obowiązujących w obiekcie;",
          "f) samowolnego oddalania się z Terenu Wydarzenia w sposób uniemożliwiający kontakt z Kadrą Organizacyjną, jeżeli może to zakłócić realizację programu albo bezpieczeństwo Uczestnika;",
          "g) podejmowania zachowań narażających siebie lub inne osoby na niebezpieczeństwo.",
          "2. Spożywanie alkoholu, jeżeli nie jest zakazane przez przepisy prawa, regulamin obiektu albo decyzję Organizatora, może odbywać się wyłącznie w sposób nienaruszający bezpieczeństwa, porządku i godności innych osób.",
          "3. Organizator może wprowadzić całkowity zakaz spożywania alkoholu podczas całości albo części Wydarzenia, jeżeli uzasadnia to charakter Wydarzenia, względy bezpieczeństwa albo regulamin obiektu."
        ],
        commentary: [
          "Ten paragraf wynika z obowiązku zapewnienia bezpieczeństwa uczestników oraz ochrony mienia Organizatora, Uczelni, obiektu i osób trzecich. Zakazy dotyczą zachowań, które mogą prowadzić do odpowiedzialności cywilnej, karnej, dyscyplinarnej albo organizacyjnej.",
          "Zakaz dotyczący środków odurzających, substancji psychotropowych i nowych substancji psychoaktywnych jest uzasadniony nie tylko organizacyjnie, ale także prawnie, ponieważ obrót i posiadanie takich substancji może być objęte odpowiedzialnością na podstawie przepisów powszechnie obowiązujących.",
          "Zakaz przemocy, nękania, dyskryminacji i naruszania godności innych osób wiąże się z ochroną dóbr osobistych, o której mowa w Kodeksie cywilnym. W kontekście uczelni ma to także znaczenie z punktu widzenia wartości wspólnoty akademickiej i bezpieczeństwa uczestników.",
          "Zapis o alkoholu jest sformułowany elastycznie. Nie wprowadza automatycznie całkowitego zakazu w każdym przypadku, ale pozwala Organizatorowi taki zakaz ustanowić, jeżeli wymaga tego charakter wydarzenia, regulamin obiektu albo względy bezpieczeństwa."
        ]
      },
      {
        id: "sec-7",
        title: "§ 7. Naruszenie Regulaminu i środki porządkowe",
        content: [
          "1. W przypadku naruszenia Regulaminu Organizator może zastosować środki porządkowe adekwatne do rodzaju i skali naruszenia, w szczególności:",
          "a) upomnienie;",
          "b) zobowiązanie Uczestnika do zaprzestania naruszeń;",
          "c) wyłączenie Uczestnika z określonej części programu;",
          "d) powiadomienie właściwych organów SSUEW lub Uczelni;",
          "e) rozwiązanie umowy udziału w Wydarzeniu ze skutkiem natychmiastowym i zobowiązanie Uczestnika do opuszczenia Wydarzenia.",
          "2. Rozwiązanie umowy udziału w Wydarzeniu ze skutkiem natychmiastowym może nastąpić w szczególności w przypadku:",
          "a) naruszenia zakazów, o których mowa w § 6 ust. 1;",
          "b) zachowania zagrażającego życiu, zdrowiu, bezpieczeństwu lub mieniu;",
          "c) rażącego naruszenia regulaminu obiektu;",
          "d) uporczywego niestosowania się do uzasadnionych poleceń Kadry Organizacyjnej;",
          "e) podania nieprawdziwych danych w formularzu zgłoszeniowym;",
          "f) zachowania naruszającego godność, nietykalność, prywatność lub dobra osobiste innych osób.",
          "3. Uczestnik, wobec którego rozwiązano umowę udziału w Wydarzeniu ze skutkiem natychmiastowym, opuszcza Wydarzenie na własny koszt, chyba że Organizator postanowi inaczej albo szczególne okoliczności wymagają innego działania.",
          "4. W przypadku zagrożenia życia, zdrowia lub bezpieczeństwa Organizator może wezwać odpowiednie służby, w szczególności pogotowie ratunkowe, Policję, straż pożarową lub obsługę obiektu.",
          "5. Zastosowanie środka porządkowego nie wyłącza możliwości dochodzenia roszczeń odszkodowawczych na zasadach określonych w przepisach prawa."
        ],
        commentary: [
          "Ten paragraf wskazuje konsekwencje naruszenia Regulaminu. Jest potrzebny, ponieważ same obowiązki i zakazy byłyby niewystarczające, gdyby Regulamin nie przewidywał możliwych reakcji Organizatora.",
          "Katalog środków porządkowych jest stopniowany: od upomnienia, przez wyłączenie z części programu, aż po rozwiązanie umowy udziału ze skutkiem natychmiastowym. Takie rozwiązanie jest bardziej proporcjonalne niż automatyczne usuwanie uczestnika za każde naruszenie.",
          "Rozwiązanie umowy ze skutkiem natychmiastowym powinno być zarezerwowane dla naruszeń poważnych, np. przemocy, zagrożenia bezpieczeństwa, środków odurzających, poważnego naruszenia regulaminu obiektu albo uporczywego ignorowania poleceń organizacyjnych. Jest to cywilnoprawny odpowiednik zakończenia udziału uczestnika z powodu rażącego naruszenia warunków wydarzenia.",
          "Zapis o opuszczeniu wydarzenia na koszt uczestnika został złagodzony przez dodanie wyjątku dla szczególnych okoliczności. Jest to ważne, bo Organizator nie powinien tworzyć sytuacji zagrożenia, np. wyrzucając uczestnika w nocy bez możliwości bezpiecznego powrotu. Taki wyjątek wzmacnia zgodność zapisu z zasadami współżycia społecznego."
        ]
      },
      {
        id: "sec-8",
        title: "§ 8. Odpowiedzialność za szkody",
        content: [
          "1. Uczestnik ponosi odpowiedzialność za szkody wyrządzone z własnej winy Organizatorowi, Uczelni, obiektowi, innym Uczestnikom lub osobom trzecim, na zasadach określonych w przepisach prawa powszechnie obowiązującego.",
          "2. Uczestnik zobowiązuje się do niezwłocznego poinformowania Kadry Organizacyjnej o wyrządzonej albo zauważonej szkodzie.",
          "3. W przypadku szkody powstałej w pokoju, domku, autokarze albo innej przestrzeni wspólnie użytkowanej przez kilku Uczestników, Organizator może ustalać okoliczności powstania szkody z udziałem wszystkich osób korzystających z tej przestrzeni.",
          "4. Jeżeli nie jest możliwe ustalenie osoby bezpośrednio odpowiedzialnej za szkodę, Organizator może dochodzić roszczeń od osób odpowiedzialnych za jej powstanie wyłącznie na zasadach wynikających z przepisów prawa.",
          "5. Organizator ponosi odpowiedzialność za niewykonanie lub nienależyte wykonanie swoich zobowiązań na zasadach określonych w przepisach prawa.",
          "6. Organizator nie ponosi odpowiedzialności za szkody wynikające z:",
          "a) działania siły wyższej;",
          "b) wyłącznej winy Uczestnika;",
          "c) wyłącznej winy osoby trzeciej, za którą Organizator nie ponosi odpowiedzialności;",
          "d) naruszenia przez Uczestnika Regulaminu, regulaminu obiektu lub uzasadnionych poleceń Kadry Organizacyjnej."
        ],
        commentary: [
          "Ten paragraf opiera się na ogólnych zasadach odpowiedzialności cywilnej. W przypadku szkód wyrządzonych czynem niedozwolonym podstawowe znaczenie ma art. 415 Kodeksu cywilnego, zgodnie z którym kto z winy swojej wyrządził drugiemu szkodę, zobowiązany jest do jej naprawienia. W przypadku niewykonania albo nienależytego wykonania zobowiązania zastosowanie mogą mieć także przepisy o odpowiedzialności kontraktowej, w szczególności art. 471 KC.",
          "Celowo nie wpisano automatycznej odpowiedzialności solidarnej wszystkich osób z pokoju. Odpowiedzialność solidarna w prawie cywilnym musi wynikać z ustawy albo z czynności prawnej, ale jej zastosowanie wobec uczestników powinno być ostrożne. Automatyczne obciążanie wszystkich osób z pokoju za szkodę, bez ustalenia sprawcy i okoliczności, mogłoby być kwestionowane jako nieproporcjonalne.",
          "Zapis pozostawia Organizatorowi możliwość ustalania okoliczności szkody z udziałem osób korzystających z danej przestrzeni, ale dochodzenie roszczeń powinno następować na zasadach wynikających z prawa. To bezpieczniejsze niż tworzenie regulaminowej odpowiedzialności zbiorowej.",
          "Ustęp dotyczący odpowiedzialności Organizatora również jest celowo umiarkowany. Nie należy wpisywać, że Organizator odpowiada wyłącznie za winę umyślną, bo takie ograniczenie mogłoby być oceniane jako zbyt daleko idące. Bezpieczniejsze jest odesłanie do zasad ogólnych i wskazanie typowych wyłączeń, takich jak siła wyższa, wyłączna wina uczestnika albo wyłączna wina osoby trzeciej."
        ]
      },
      {
        id: "sec-9",
        title: "§ 9. Bezpieczeństwo i sytuacje nadzwyczajne",
        content: [
          "1. Uczestnik zobowiązany jest do zachowania ostrożności i rozsądku podczas udziału w Wydarzeniu, w szczególności podczas aktywności fizycznych, integracyjnych, transportu i przebywania poza obiektem.",
          "2. Uczestnik bierze udział w aktywnościach dodatkowych, sportowych lub rekreacyjnych dobrowolnie, z uwzględnieniem swojego stanu zdrowia, kondycji i indywidualnych ograniczeń.",
          "3. Organizator może odmówić Uczestnikowi udziału w określonej aktywności, jeżeli udział ten mógłby stwarzać zagrożenie dla Uczestnika albo innych osób.",
          "4. W razie wypadku, nagłego zachorowania, zaginięcia Uczestnika, poważnego naruszenia porządku albo innej sytuacji nadzwyczajnej Kadra Organizacyjna podejmuje działania adekwatne do sytuacji, w szczególności:",
          "a) udziela podstawowej pomocy organizacyjnej;",
          "b) wzywa odpowiednie służby;",
          "c) kontaktuje się z osobą wskazaną przez Uczestnika jako kontakt alarmowy, jeżeli jest to uzasadnione sytuacją;",
          "d) informuje właściwe osoby po stronie SSUEW albo Uczelni.",
          "5. Uczestnik zobowiązany jest niezwłocznie zgłaszać Kadrze Organizacyjnej wszelkie sytuacje mogące wymagać interwencji."
        ],
        commentary: [
          "Ten paragraf wynika z potrzeby zapewnienia należytej staranności przy organizacji wydarzenia. Organizator, przygotowując wyjazd, powinien mieć procedurę reagowania na sytuacje nadzwyczajne: wypadek, nagłe zachorowanie, zaginięcie uczestnika, konflikt, zagrożenie bezpieczeństwa albo konieczność wezwania służb.",
          "Z punktu widzenia Kodeksu cywilnego istotne jest ograniczenie ryzyka zarzutu nienależytego wykonania zobowiązania. Jeżeli Organizator określa, jakie działania podejmuje w sytuacjach nadzwyczajnych, łatwiej wykazać, że działał racjonalnie, adekwatnie i z należytą starannością.",
          "Zapis o dobrowolnym udziale w aktywnościach sportowych albo rekreacyjnych nie zwalnia Organizatora ze wszystkich obowiązków, ale porządkuje odpowiedzialność uczestnika za ocenę własnego stanu zdrowia i możliwości. Organizator może odmówić udziału w aktywności, jeżeli widzi realne zagrożenie dla uczestnika albo innych osób."
        ]
      },
      {
        id: "sec-10",
        title: "§ 10. Dane osobowe",
        content: [
          "1. Administratorem danych osobowych Uczestników jest Uniwersytet Ekonomiczny we Wrocławiu z siedzibą przy ul. Komandorskiej 118/120, 53-345 Wrocław.",
          "2. Kontakt z Inspektorem Ochrony Danych możliwy jest pod adresem: iod@ue.wroc.pl.",
          "3. Dane osobowe Uczestników są przetwarzane w celu:",
          "a) przeprowadzenia rekrutacji i kwalifikacji do udziału w Wydarzeniu;",
          "b) zawarcia i wykonania umowy udziału w Wydarzeniu;",
          "c) organizacji zakwaterowania, wyżywienia, transportu i programu Wydarzenia;",
          "d) zapewnienia bezpieczeństwa organizacyjnego Wydarzenia;",
          "e) dochodzenia lub obrony przed ewentualnymi roszczeniami;",
          "f) realizacji obowiązków dokumentacyjnych, finansowych, księgowych lub archiwalnych, jeżeli mają zastosowanie.",
          "4. Podstawą prawną przetwarzania danych jest:",
          "a) art. 6 ust. 1 lit. b RODO – w zakresie niezbędnym do zawarcia i wykonania umowy udziału w Wydarzeniu;",
          "b) art. 6 ust. 1 lit. c RODO – w zakresie realizacji obowiązków prawnych ciążących na Administratorze;",
          "c) art. 6 ust. 1 lit. f RODO – w zakresie prawnie uzasadnionego interesu Administratora, polegającego w szczególności na zapewnieniu bezpieczeństwa organizacyjnego oraz dochodzeniu lub obronie przed roszczeniami;",
          "d) art. 6 ust. 1 lit. a RODO – w zakresie danych podawanych dobrowolnie na podstawie zgody, jeżeli formularz lub odrębne oświadczenie przewiduje taką zgodę.",
          "5. Jeżeli Uczestnik dobrowolnie przekaże dane dotyczące zdrowia, alergii, szczególnych potrzeb żywieniowych lub innych szczególnych potrzeb organizacyjnych, dane te są przetwarzane wyłącznie w zakresie niezbędnym do prawidłowej i bezpiecznej organizacji Wydarzenia, na podstawie wyraźnej zgody Uczestnika, zgodnie z art. 9 ust. 2 lit. a RODO.",
          "6. Zakres przetwarzanych danych może obejmować w szczególności: imię, nazwisko, adres e-mail, numer telefonu, status studenta, kierunek lub rok studiów, przynależność do komisji lub jednostki SSUEW, dane niezbędne do zakwaterowania, informacje dotyczące płatności, dane osoby do kontaktu w nagłych wypadkach oraz inne dane podane przez Uczestnika w formularzu zgłoszeniowym.",
          "7. Odbiorcami danych mogą być podmioty zaangażowane w organizację Wydarzenia, w szczególności obiekt noclegowy, przewoźnik, dostawcy usług żywieniowych, podmioty obsługujące systemy informatyczne, a także osoby upoważnione do przetwarzania danych w ramach Uczelni lub SSUEW.",
          "8. Dane osobowe będą przechowywane przez okres niezbędny do organizacji i rozliczenia Wydarzenia, a następnie przez okres wynikający z przepisów prawa, obowiązków dokumentacyjnych, księgowych, archiwalnych albo do czasu przedawnienia ewentualnych roszczeń.",
          "9. Dane osoby wskazanej jako kontakt alarmowy będą wykorzystywane wyłącznie w przypadku zaistnienia sytuacji uzasadniającej kontakt, w szczególności zagrożenia życia, zdrowia lub bezpieczeństwa Uczestnika.",
          "10. Uczestnikowi przysługuje prawo dostępu do danych, sprostowania danych, usunięcia danych, ograniczenia przetwarzania, wniesienia sprzeciwu wobec przetwarzania, przenoszenia danych w przypadkach przewidzianych prawem oraz cofnięcia zgody w zakresie, w jakim przetwarzanie odbywa się na podstawie zgody.",
          "11. Uczestnik ma prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.",
          "12. Podanie danych jest dobrowolne, ale niezbędne do udziału w Wydarzeniu w zakresie danych koniecznych do jego organizacji. Niepodanie danych może uniemożliwić udział w Wydarzeniu."
        ],
        commentary: [
          "Ten paragraf wynika bezpośrednio z art. 13 RODO, który nakłada na administratora obowiązek poinformowania osoby, od której zbierane są dane, m.in. o tożsamości administratora, danych kontaktowych IOD, celach i podstawach przetwarzania, odbiorcach danych oraz okresie przechowywania.",
          "Podstawy przetwarzania danych rozdzielono celowo. Dane potrzebne do zgłoszenia, kwalifikacji i organizacji wyjazdu mogą być przetwarzane na podstawie art. 6 ust. 1 lit. b RODO, czyli w celu zawarcia i wykonania umowy. Dane potrzebne do rozliczeń, dokumentacji albo obowiązków prawnych mogą opierać się na art. 6 ust. 1 lit. c RODO. Dane dotyczące bezpieczeństwa organizacyjnego i ewentualnych roszczeń mogą być uzasadnione art. 6 ust. 1 lit. f RODO.",
          "Dane dotyczące zdrowia, alergii, leków albo szczególnych potrzeb żywieniowych mogą stanowić szczególne kategorie danych osobowych. Dlatego wymagają osobnego potraktowania i co do zasady wyraźnej zgody z art. 9 ust. 2 lit. a RODO. Nie powinny być zbierane na zapas, tylko w zakresie niezbędnym do organizacji wydarzenia i bezpieczeństwa uczestnika.",
          "Zapis o prawach uczestnika wynika z RODO, które wymaga przejrzystego informowania o prawach osoby, której dane dotyczą. RODO podkreśla, że informacje powinny być przekazywane w zwięzłej, przejrzystej, zrozumiałej i łatwo dostępnej formie, jasnym i prostym językiem."
        ]
      },
      {
        id: "sec-11",
        title: "§ 11. Wizerunek",
        content: [
          "1. Podczas Wydarzenia mogą być wykonywane zdjęcia lub nagrania dokumentujące jego przebieg.",
          "2. Utrwalanie i rozpowszechnianie wizerunku Uczestnika w celach promocyjnych, informacyjnych lub sprawozdawczych wymaga odrębnej podstawy prawnej, w szczególności zgody Uczestnika, chyba że przepisy prawa dopuszczają rozpowszechnienie wizerunku bez takiej zgody.",
          "3. Odmowa wyrażenia zgody na rozpowszechnianie wizerunku nie wpływa na możliwość udziału w Wydarzeniu.",
          "4. Szczegółowe zasady wykorzystania wizerunku mogą zostać określone w odrębnym oświadczeniu lub klauzuli zgody."
        ],
        commentary: [
          "Ten paragraf oddziela akceptację Regulaminu od zgody na wykorzystanie wizerunku. To ważne, ponieważ udział w wydarzeniu i zgoda na publikację zdjęć lub nagrań to dwie różne kwestie.",
          "Wizerunek może być chroniony zarówno na gruncie przepisów o dobrach osobistych w Kodeksie cywilnym, jak i na gruncie przepisów o prawie autorskim i prawach pokrewnych. Jeżeli zdjęcie lub nagranie pozwala zidentyfikować osobę, może także stanowić dane osobowe w rozumieniu RODO.",
          "Dlatego zgoda na rozpowszechnianie wizerunku powinna być odrębna, dobrowolna i możliwa do wykazania. Odmowa zgody na publikację wizerunku nie powinna blokować udziału w wydarzeniu, chyba że utrwalanie wizerunku jest absolutnie konieczne dla charakteru wydarzenia — co przy zwykłych wyjazdach szkoleniowo-integracyjnych raczej nie zachodzi."
        ]
      },
      {
        id: "sec-12",
        title: "§ 12. Zmiana Regulaminu",
        content: [
          "1. Organizator może zmienić Regulamin przed rozpoczęciem Wydarzenia, jeżeli jest to uzasadnione względami prawnymi, organizacyjnymi, bezpieczeństwa albo zmianą warunków realizacji Wydarzenia.",
          "2. O zmianie Regulaminu Uczestnicy zostaną poinformowani w formie dokumentowej, w szczególności za pośrednictwem wiadomości e-mail.",
          "3. Jeżeli zmiana Regulaminu istotnie wpływa na prawa lub obowiązki Uczestnika, Uczestnik może zrezygnować z udziału w Wydarzeniu w terminie [np. 3] dni od otrzymania informacji o zmianie, zachowując prawo do zwrotu opłaty udziałowej w zakresie, w jakim nie została ona jeszcze wydatkowana albo w jakim Organizator może odzyskać poniesione koszty.",
          "4. Zmiany porządkowe, redakcyjne lub doprecyzowujące, które nie pogarszają sytuacji Uczestnika, nie wymagają przyznania prawa rezygnacji, o którym mowa w ust. 3."
        ],
        commentary: [
          "Ten paragraf wynika z cywilnoprawnego charakteru Regulaminu jako wzorca umownego. Skoro Regulamin kształtuje prawa i obowiązki uczestnika, jego zmiana nie powinna następować dowolnie i jednostronnie bez poinformowania uczestnika.",
          "Art. 384 Kodeksu cywilnego wskazuje znaczenie doręczenia lub udostępnienia wzorca przed związaniem nim drugiej strony. Z tego powodu zmiana Regulaminu powinna być zakomunikowana uczestnikom w sposób pozwalający im zapoznać się z nową treścią.",
          "Zapis rozróżnia zmiany istotne i nieistotne. Jeżeli zmiana realnie pogarsza sytuację uczestnika albo wpływa na jego prawa i obowiązki, powinien mieć możliwość rezygnacji. Jeżeli zmiana ma charakter redakcyjny, porządkowy albo doprecyzowujący, nie ma potrzeby uruchamiania pełnej procedury rezygnacji."
        ]
      },
      {
        id: "sec-13",
        title: "§ 13. Postanowienia końcowe",
        content: [
          "1. Akceptacja Regulaminu jest warunkiem udziału w Wydarzeniu.",
          "2. W sprawach nieuregulowanych Regulaminem stosuje się przepisy prawa powszechnie obowiązującego, regulacje wewnętrzne Uniwersytetu Ekonomicznego we Wrocławiu oraz regulacje SSUEW.",
          "3. Regulamin wchodzi w życie z dniem jego udostępnienia kandydatom na uczestników Wydarzenia.",
          "4. Wszelkie pytania organizacyjne dotyczące Wydarzenia należy kierować na adres: [adres e-mail]."
        ],
        commentary: [
          "Ten paragraf pełni funkcję porządkującą. Potwierdza, że akceptacja Regulaminu jest warunkiem udziału w wydarzeniu, co jest istotne z punktu widzenia art. 384 Kodeksu cywilnego i związania uczestnika wzorcem umownym.",
          "Odesłanie do prawa powszechnie obowiązującego obejmuje przede wszystkim Kodeks cywilny, RODO, ustawę Prawo o szkolnictwie wyższym i nauce oraz inne przepisy, które mogą mieć zastosowanie w zależności od charakteru wydarzenia. Odesłanie do regulacji UEW i SSUEW jest potrzebne, ponieważ wydarzenie jest organizowane w środowisku uczelnianym i samorządowym, a samorząd studencki działa na podstawie PSWiN jako reprezentacja studentów uczelni.",
          "Zapis o wejściu Regulaminu w życie z dniem udostępnienia kandydatom ma znaczenie dowodowe i organizacyjne. Chodzi o to, aby nie było wątpliwości, że uczestnik znał warunki przed zgłoszeniem i przed potwierdzeniem udziału."
        ]
      }
    ]
  },
  TEDX_TEMPLATE: {
    title: "REGULAMIN UCZESTNICTWA W KONFERENCJI TEDXUEW 2026",
    intro: "Niżej znajdziesz kompletny regulamin TEDxUEW 2026 wraz z komentarzami prawno-organizacyjnymi przy każdym paragrafie. Przed każdą edycją uzupełnij pola oznaczone nawiasami kwadratowymi.",
    sections: [
      {
        id: "tedx-1",
        title: "§ 1. Przepisy ogólne i słowniczek pojęć",
        content: [
          "1. Niniejszy Regulamin stanowi wzorzec umowny w rozumieniu art. 384 ustawy z dnia 23 kwietnia 1964 r. – Kodeks cywilny i określa warunki udziału, prawa i obowiązki Uczestników oraz zasady odpowiedzialności w ramach Wydarzenia.",
          "2. Konferencja TEDxUEW jest organizowana na podstawie licencji udzielonej przez TED Conferences, LLC. Organizator realizuje Wydarzenie zgodnie z zasadami licencji TEDx, w tym wytycznymi dotyczącymi marki, treści i charakteru wydarzenia. Postanowienia niniejszego Regulaminu interpretuje się w sposób zgodny z wymaganiami licencji TEDx, o ile nie narusza to bezwzględnie obowiązujących przepisów prawa ani praw Uczestnika.",
          "3. TED Conferences, LLC nie jest Organizatorem Wydarzenia ani stroną stosunku prawnego pomiędzy Organizatorem a Uczestnikiem.",
          "4. Kontakt z Organizatorem: tedxuew@samorzad.ue.wroc.pl.",
          "5. Ilekroć w treści niniejszego Regulaminu używa się poniższych pojęć pisanych wielką literą, należy przez nie rozumieć:",
          "a) Regulamin – niniejszy dokument stanowiący wzorzec umowny w rozumieniu art. 384 Kodeksu cywilnego;",
          "b) Wydarzenie / Konferencja – konferencję pod nazwą „TEDxUEW 2026”, realizowaną w dniu 12.06.2026 r. na terenie Miejsca wydarzenia;",
          "c) Organizator – Uniwersytet Ekonomiczny we Wrocławiu z siedzibą we Wrocławiu przy ul. Komandorskiej 118/120, 53-345 Wrocław, NIP: 896-000-69-97, REGON: 000001497, w imieniu i na rzecz którego czynności operacyjne podejmuje Samorząd Studentów UEW;",
          "d) Miejsce wydarzenia – budynek Centrum Kształcenia Ustawicznego Uniwersytetu Ekonomicznego we Wrocławiu przy ul. Komandorskiej 118/120 we Wrocławiu;",
          "e) Grupa Projektowa – zespół organizacyjny TEDxUEW 2026 działający z upoważnienia Organizatora i odpowiedzialny za bieżącą organizację oraz prawidłowy przebieg Wydarzenia;",
          "f) Uczestnik – pełnoletnią osobę fizyczną przebywającą na terenie Wydarzenia, z wyłączeniem pracowników obiektu oraz członków Grupy Projektowej, która spełniła warunki określone w § 2 niniejszego Regulaminu i została wpisana na listę uczestników przez Organizatora;",
          "g) Impreza – wydarzenie towarzyszące pod nazwą „Cocktail Party”, odbywające się na terenie budynku CKU UEW w ramach Konferencji;",
          "h) Siła wyższa – zdarzenie zewnętrzne, niemożliwe do przewidzenia i zapobiegnięcia, niezależne od woli Stron, w szczególności: klęski żywiołowe, epidemie, pandemie, działania wojenne, akty terroryzmu, decyzje organów administracji publicznej uniemożliwiające zorganizowanie Wydarzenia, katastrofy budowlane uniemożliwiające korzystanie z Miejsca wydarzenia."
        ],
        commentary: [
          "Zostawiono konstrukię wzorca umownego, bo art. 384 Kodeksu cywilnego wprost obejmuje regulaminy jako wzorce umowne. Aktualny tekst jednolity KC jest publikowany w ISAP, a sam Kodeks reguluje stosunki cywilnoprawne między osobami fizycznymi i prawnymi.",
          "Doprecyzowano, że TED nie jest Organizatorem ani stroną umowy z uczestnikiem. To ważne, bo TEDx jest wydarzeniem licencyjnym, ale odpowiedzialność za organizację ponosi lokalny Organizator.",
          "UEW występuje jako Organizator, bo Statut UEW wskazuje, że Uniwersytet ma osobowość prawną i może występować jako strona stosunków cywilnoprawnych. Samorząd działa w strukturze Uczelni i na podstawie regulacji uczelnianych.",
          "Zmieniono „akt o charakterze wewnętrznym” na „dokument stanowiący wzorzec umowny”, bo wobec Uczestnika to nie jest typowy akt wewnętrzny, tylko regulamin udziału."
        ]
      },
      {
        id: "tedx-2",
        title: "§ 2. Uczestnictwo w TEDxUEW 2026",
        content: [
          "1. Konferencja TEDxUEW 2026 jest wydarzeniem zamkniętym. Wejście na Miejsce wydarzenia jest możliwe wyłącznie po okazaniu ważnego biletu oraz ważnego dokumentu tożsamości ze zdjęciem, w szczególności dowodu osobistego albo paszportu.",
          "2. W Wydarzeniu mogą wziąć udział wyłącznie osoby, które:",
          "a) ukończyły 18 lat najpóźniej w dniu odbywania się Konferencji;",
          "b) poprawnie przeszły proces rejestracji zgodnie z § 3 niniejszego Regulaminu;",
          "c) otrzymały potwierdzenie uczestnictwa od Organizatora drogą elektroniczną z adresu tedxuew@samorzad.ue.wroc.pl albo innego adresu wskazanego przez Organizatora.",
          "3. Za weryfikację biletów i dokumentów tożsamości odpowiedzialni są członkowie Grupy Projektowej lub inne osoby upoważnione przez Organizatora.",
          "4. Weryfikacja dokumentu tożsamości odbywa się wyłącznie w zakresie niezbędnym do potwierdzenia tożsamości i pełnoletności Uczestnika. Organizator nie kopiuje ani nie utrwala dokumentów tożsamości, chyba że obowiązek taki wynika z przepisów prawa.",
          "5. Organizator, działając przez członków Grupy Projektowej lub osoby upoważnione, może odmówić wstępu na Wydarzenie albo zobowiązać do opuszczenia Wydarzenia osoby:",
          "a) znajdujące się pod widocznym wpływem alkoholu, środków odurzających lub innych substancji wpływających na zachowanie w sposób zagrażający bezpieczeństwu lub porządkowi Wydarzenia;",
          "b) zachowujące się agresywnie, prowokacyjnie albo w inny sposób zagrażające bezpieczeństwu Uczestników, Organizatora, Grupy Projektowej, prelegentów, gości lub porządkowi Konferencji;",
          "c) nieposiadające ważnego biletu lub dokumentu tożsamości;",
          "d) naruszające niniejszy Regulamin, regulamin obiektu albo uzasadnione polecenia porządkowe Organizatora;",
          "e) w innych uzasadnionych przypadkach, jeżeli ich obecność mogłaby zagrażać sprawnemu lub bezpiecznemu przebiegowi Konferencji.",
          "6. Na teren Wydarzenia zakazuje się wnoszenia i posiadania broni, amunicji, materiałów wybuchowych, materiałów pożarowo niebezpiecznych, środków odurzających, substancji psychotropowych, nowych substancji psychoaktywnych oraz innych przedmiotów lub substancji zabronionych przez prawo albo mogących stwarzać zagrożenie dla osób lub mienia.",
          "7. Osobom posiadającym przy sobie przedmioty lub substancje, o których mowa w ust. 6, Organizator może odmówić wstępu albo nakazać opuszczenie terenu Wydarzenia."
        ],
        commentary: [
          "Weryfikacja dokumentu tożsamości ma służyć wyłącznie potwierdzeniu tożsamości i pełnoletności. To jest zgodne z zasadą minimalizacji danych z RODO — sprawdzamy, ale nie kopiujemy dokumentów.",
          "Dodano „ważny bilet” już w ust. 1, bo samo okazanie dowodu osobistego nie powinno uprawniać do wejścia.",
          "Zamiast „wyproszenia” w każdym przypadku użyto bardziej formalnego „zobowiązać do opuszczenia Wydarzenia”. Brzmi lepiej i jest bezpieczniejsze dowodowo.",
          "Zakazy porządkowe doprecyzowano terminologią ustawową, bo „narkotyki” to określenie potoczne."
        ]
      },
      {
        id: "tedx-3",
        title: "§ 3. Bilety wstępu na Konferencję TEDxUEW 2026 oraz Imprezę",
        content: [
          "1. Warunkiem skutecznego ubiegania się o bilet jest łączne spełnienie następujących czynności: dokonanie rejestracji za pośrednictwem formularza dostępnego na stronie internetowej www.tedxuew.com, uiśczenie opłaty za udział w Wydarzeniu przelewem bankowym na rachunek Organizatora oraz przesłanie potwierdzenia płatności za pośrednictwem formularza rejestracyjnego lub w inny sposób wskazany przez Organizatora.",
          "2. Formularz rejestracyjny zostanie udostępniony nie wcześniej niż [data otwarcia puli I] r. i będzie aktywny do momentu wyczerpania dostępnej puli biletów albo do wcześniejszego zakończenia sprzedaży przez Organizatora.",
          "3. Ceny biletów, jako kwoty brutto, wynoszą:",
          "Pula I – bilet na całe Wydarzenie z Imprezą, od [data]: [cena] zł",
          "Pula II – bilet na całe Wydarzenie z Imprezą, od [data]: [cena] zł",
          "Bilet ulgowy – studenci/doktoranci UEW lub posiadacze numeru IRK: [cena] zł",
          "Bilet na samą Imprezę, Cocktail Party: [cena] zł",
          "4. Organizator zastrzega sobie prawo do zmiany cen biletów w trakcie sprzedaży. Zmiana ceny nie dotyczy biletów już opłaconych.",
          "Dane do przelewu:",
          "Nazwa odbiorcy: Uniwersytet Ekonomiczny we Wrocławiu",
          "Nr rachunku: 87 1240 3464 1111 0010 4316 2601",
          "Tytuł przelewu: „TEDxUEW – imię i nazwisko Uczestnika”",
          "5. Opłatę uznaje się za uiśczoną z chwilą uznania rachunku bankowego Organizatora.",
          "6. Cena biletu obejmuje świadczenia wskazane dla danego rodzaju biletu, w szczególności:",
          "a) 3 panele 18-minutowych prelekcji — dla biletów obejmujących udział w Konferencji;",
          "b) udział w Imprezie, Cocktail Party — dla biletów obejmujących Imprezę;",
          "c) strefę okołoeventową ze standami kreatywnymi i warsztatami;",
          "d) lunch podczas Konferencji oraz poczęstunek podczas Imprezy, odpowiednio do rodzaju biletu;",
          "e) personalizowany giftpack, jeżeli został przewidziany dla danego rodzaju biletu;",
          "f) sesję Q&A z prelegentami, jeżeli została przewidziana w programie Wydarzenia.",
          "7. Bilet na Wydarzenie zostanie przesłany Uczestnikowi na adres e-mail podany w formularzu w ciągu 7 dni roboczych od zaksięgowania płatności, pod warunkiem dostępności miejsc oraz kompletności zgłoszenia.",
          "8. O kolejności przy wyczerpaniu puli biletów decyduje data i godzina zaksięgowania płatności na rachunku Organizatora oraz kompletność zgłoszenia.",
          "9. Wypełnienie formularza, dokonanie płatności i przesłanie potwierdzenia przelewu nie są równoznaczne z gwarancją otrzymania biletu. W przypadku wątpliwości Organizator weryfikuje kolejność zgłoszeń na podstawie daty i godziny zaksięgowania płatności oraz kompletności zgłoszenia.",
          "10. W przypadku braku dostępnych miejsc pomimo dokonania płatności Organizator niezwłocznie, nie później niż w terminie 7 dni roboczych, zwróci Uczestnikowi wpłaconą kwotę w całości na rachunek, z którego dokonano płatności, chyba że Uczestnik wskaże inny rachunek do zwrotu. Uczestnikowi nie przyslugują z tego tytułu dodatkowe roszczenia, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa.",
          "11. Na podstawie art. 38 ust. 1 pkt 12 ustawy z dnia 30 maja 2014 r. o prawach konsumenta prawo do odstąpienia od umowy zawartej na odległość nie przysługuje, ponieważ umowa dotyczy świadczeń związanych z wydarzeniem kulturalnym lub rozrywkowym, w którym oznaczono dzień i miejsce świadczenia usługi. Aktualny tekst ustawy o prawach konsumenta jest publikowany w ISAP.",
          "12. W przypadku rezygnacji z udziału z przyczyn leżących po stronie Uczestnika, niebędących następstwem przyczyn po stronie Organizatora ani Siły wyższej, zakupiony bilet nie podlega zwrotowi, chyba że Organizator postanowi inaczej w szczególnie uzasadnionym przypadku.",
          "13. Bilet na Wydarzenie jest imienny i nie może być odsprzedany ani przekazany innej osobie bez uprzedniej zgody Organizatora wyrażonej co najmniej w formie dokumentowej, w szczególności za pośrednictwem wiadomości e-mail.",
          "14. Warunkiem dokonania rejestracji i zakupu biletu jest złożenie przez Uczestnika oświadczenia o zapoznaniu się z Regulaminem oraz jego akceptacji.",
          "15. Pod uwagę nie będą brane zgłoszenia wygenerowane przez boty, automatyczne oprogramowanie, agencje lub pośredników sprzedaży biletów, chyba że Organizator wyraził uprzednią zgodę na taki sposób dystrybucji."
        ],
        commentary: [
          "Doprecyzowano, że płatność i formularz to jeszcze nie gwarancja biletu, dopóki są limity miejsc i kolejność księgowania.",
          "Brak prawa odstąpienia z ustawy konsumenckiej nie oznacza, że Organizator może zatrzymać pieniądze w każdym przypadku. Jeśli Uczestnik się rozmyśli — co do zasady brak zwrotu. Jeśli wydarzenie odwoła Organizator — wchodzi § 8 i zwrot.",
          "Dodano wyjątek „z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa”, żeby regulamin nie wyglądał jak próba wyłączenia wszystkiego absolutnie."
        ]
      },
      {
        id: "tedx-4",
        title: "§ 4. Cocktail Party",
        content: [
          "1. Impreza stanowi część towarzyszącą Konferencji TEDxUEW 2026.",
          "2. Na teren Imprezy wejść mogą wyłącznie osoby posiadające ważny bilet obejmujący Imprezę, które nie opuściły Wydarzenia w sposób definitywny i nie zostały wykluczone z udziału w Wydarzeniu.",
          "3. Na terenie Imprezy obowiązują odpowiednio wszystkie postanowienia niniejszego Regulaminu.",
          "4. Bilet obejmujący wyłącznie Imprezę uprawnia do uczestnictwa w Cocktail Party, poczęstunku, sesji Q&A z prelegentami oraz oprawy muzycznej, o ile elementy te zostały przewidziane w programie Imprezy.",
          "5. Bilet na Imprezę jest imienny i nie może być odsprzedany ani przekazany innej osobie bez uprzedniej zgody Organizatora wyrażonej co najmniej w formie dokumentowej.",
          "6. W zakresie zwrotu opłaty za bilet na Imprezę stosuje się odpowiednio § 3 ust. 10–12 oraz § 8 niniejszego Regulaminu."
        ],
        commentary: [
          "Zmieniono „integralną część” na „część towarzyszącą”, bo skoro można kupić bilet tylko na Imprezę, to lepiej nie tworzyć wrażenia, że każdy uczestnik Konferencji automatycznie ma dostęp do Cocktail Party.",
          "Poprawiono odesłanie do zwrotów. Wcześniej było zbyt wąskie — obejmowało brak miejsc i brak prawa odstąpienia, ale nie obejmowało jasno sytuacji odwołania albo siły wyższej. Teraz § 4 spina się z § 3 i § 8."
        ]
      },
      {
        id: "tedx-5",
        title: "§ 5. Odpowiedzialność Uczestnika",
        content: [
          "1. Uczestnik zobowiązany jest do przestrzegania niniejszego Regulaminu, regulaminu obiektu, ogólnie przyjętych norm zachowania oraz uzasadnionych poleceń Organizatora, Grupy Projektowej lub osób upoważnionych, związanych z bezpieczeństwem, porządkiem lub prawidłowym przebiegiem Wydarzenia.",
          "2. Uczestnik, który zakłóca przebieg Konferencji, nie stosuje się do uzasadnionych poleceń Organizatora lub Grupy Projektowej, zachowuje się agresywnie, niszczy mienie lub w inny sposób rażąco albo uporczywie narusza niniejszy Regulamin, może zostać zobowiązany do opuszczenia terenu Wydarzenia. Zobowiązanie do opuszczenia Wydarzenia z przyczyn leżących po stronie Uczestnika nie uprawnia do zwrotu ceny biletu.",
          "3. Każdy Uczestnik odpowiada za naprawienie szkód wyrządzonych przez niego w trakcie lub w związku z uczestnictwem w Wydarzeniu, na zasadach ogólnych wynikających z przepisów Kodeksu cywilnego.",
          "4. Organizator nie ponosi odpowiedzialności za rzeczy zgubione, porzucone lub pozostawione przez Uczestników na terenie Wydarzenia poza miejscami przeznaczonymi do ich przechowania.",
          "5. Organizator zapewnia obsługę szatni w celu przechowania odzieży wierzchniej. Za rzeczy przyjęte do szatni Organizator ponosi odpowiedzialność na zasadach określonych w Kodeksie cywilnym, w szczególności przepisach o przechowaniu. Zaleca się niepozostawianie w szatni przedmiotów o wysokiej wartości, w szczególności biżuterii, gotówki, dokumentów, sprzętu elektronicznego oraz innych wartościowych przedmiotów, ponieważ szatnia nie pełni funkcji depozytu wartościowego.",
          "6. Organizator ponosi odpowiedzialność na zasadach określonych w powszechnie obowiązujących przepisach prawa. Żadne postanowienie Regulaminu nie wyłącza ani nie ogranicza odpowiedzialności Organizatora w zakresie, w jakim wyłączenie lub ograniczenie byłoby niedopuszczalne na podstawie bezwzględnie obowiązujących przepisów prawa."
        ],
        commentary: [
          "Zmieniono automatyzm „zostanie niezwłocznie wyproszony” na „może zostać zobowiązany do opuszczenia”. To brzmi mniej agresywnie i daje Organizatorowi możliwość stopniowania reakcji.",
          "Zostawiono odpowiedzialność za szkody na zasadach ogólnych, bo to jest najbezpieczniejsze. KC obejmuje zarówno odpowiedzialność deliktową, jak i kontraktową.",
          "Szatnia została dobrze ujęta — nie można napisać po prostu „nie odpowiadamy za rzeczy w szatni”, jeśli Organizator faktycznie przyjmuje rzeczy do przechowania. Dlatego zostaje odpowiedzialność na zasadach KC, ale z zaznaczeniem, że szatnia nie jest depozytem wartościowym.",
          "Dodano klauzulę bezwzględnie obowiązujących przepisów prawa w odniesieniu do odpowiedzialności Organizatora."
        ]
      },
      {
        id: "tedx-6",
        title: "§ 6. Rejestracja audiowizualna i prawa do wizerunku",
        content: [
          "1. Wydarzenie może być filmowane i fotografowane przez Organizatora lub podmioty działające na jego zlecenie, na potrzeby dokumentacyjne, informacyjne, promocyjne i sprawozdawcze.",
          "2. Uczestnik przyjmuje do wiadomości, że jego wizerunek może zostać utrwalony jako element większej całości, jaką stanowi publiczne wydarzenie, publiczność, zgromadzenie lub scena wydarzenia. W takim przypadku rozpowszechnianie wizerunku może nastąpić na podstawie art. 81 ust. 2 pkt 2 ustawy o prawie autorskim i prawach pokrewnych, bez konieczności uzyskiwania odrębnego zezwolenia, jeżeli Uczestnik stanowi jedynie szczegół całości.",
          "3. Jeżeli Uczestnik dobrowolnie udziela wywiadu, wypowiedzi przed kamerą, pozuje do zdjęcia albo w inny sposób świadomie uczestniczy w indywidualnym materiale fotograficznym lub audiowizualnym, może zostać poproszony o udzielenie odrębnego zezwolenia na rozpowszechnianie wizerunku, określającego zakres, cele i pola wykorzystania materiału.",
          "4. Zezwolenie, o którym mowa w ust. 3, może obejmować nieodpłatne wykorzystanie wizerunku przez Organizatora w materiałach informacyjnych, promocyjnych, reklamowych, sprawozdawczych, prasowych, na stronie internetowej oraz w mediach społecznościowych Organizatora, zgodnie z treścią odrębnego oświadczenia Uczestnika.",
          "5. Jeżeli podstawą przetwarzania danych osobowych w postaci wizerunku jest zgoda Uczestnika, Uczestnik ma prawo cofnąć zgodę w dowolnym momencie, przy czym cofnięcie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem. W odniesieniu do materiałów już opublikowanych cofnięcie zgody może wymagać oceny technicznych, organizacyjnych i prawnych możliwości ich usunięcia lub ograniczenia dalszego rozpowszechniania.",
          "6. Fotografowanie i filmowanie Konferencji przez Uczestników jest dozwolone wyłącznie na użytek prywatny, z zastrzeżeniem ust. 7.",
          "7. Podczas trwania prelekcji obowiązuje zakaz filmowania i fotografowania przez Uczestników, chyba że Organizator wyraźnie i publicznie zezwoli na taką aktywność. Naruszenie tego zakazu może skutkować zobowiązaniem Uczestnika do zaprzestania naruszeń, usunięcia nagrania lub zdjęcia, a w przypadku naruszeń rażących albo uporczywych — zobowiązaniem do opuszczenia Wydarzenia.",
          "8. Komercyjne wykorzystanie lub publiczne udostępnianie nagrań lub zdjęć z prelekcji przez Uczestników jest zabronione bez uprzedniej zgody Organizatora wyrażonej co najmniej w formie dokumentowej, chyba że bezwzględnie obowiązujące przepisy prawa stanowią inaczej."
        ],
        commentary: [
          "Ten paragraf poprawiono najmocniej. Prawo autorskie przewiduje wyjątek dla osoby stanowiącej szczegół większej całości, np. publiczności lub wydarzenia, ale ten wyjątek nie działa na każde zdjęcie.",
          "Jeśli robione są z kimś wywiady albo prosi się go o pozowanie — to już nie jest tylko „szczegół całości”. Dlatego dodano osobne zezwolenie wizerunkowe.",
          "Usunięto twarde „bezterminowo i nieodwołalnie w praktyce”, bo przy RODO zgoda musi być możliwa do cofnięcia.",
          "Zakaz filmowania prelekcji to kluczowy element umowy licencyjnej TEDx — nagrania prelekcji są prawnie chronione i mogą być publikowane wyłącznie przez TED lub za zgodą Organizatora."
        ]
      },
      {
        id: "tedx-7",
        title: "§ 7. Zasady przetwarzania danych osobowych",
        content: [
          "1. Administratorem danych osobowych Uczestników jest Uniwersytet Ekonomiczny we Wrocławiu z siedzibą we Wrocławiu przy ul. Komandorskiej 118/120, 53-345 Wrocław.",
          "2. Administrator wyznaczył Inspektora Ochrony Danych, z którym można kontaktować się pisemnie na adres siedziby Administratora lub pod adresem e-mail: iod@ue.wroc.pl.",
          "3. Czynności operacyjne związane z organizacją Wydarzenia, w tym obsługę formularzy rejestracyjnych i bieżącą obsługę danych Uczestników, wykonują osoby działające z upoważnienia Administratora, w szczególności członkowie Grupy Projektowej TEDxUEW 2026 oraz osoby wspierające organizację Wydarzenia, wyłącznie w zakresie niezbędnym do realizacji powierzonych im zadań.",
          "4. W formularzu rejestracyjnym Administrator może zbierać dane osobowe obejmujące w szczególności: imię, nazwisko, adres e-mail, numer telefonu, status studenta, doktoranta lub kandydata, numer IRK, informacje niezbędne do zastosowania biletu ulgowego, informacje dotyczące płatności, dane niezbędne do wystawienia biletu oraz inne dane niezbędne do organizacji Wydarzenia.",
          "5. Administrator może zbierać dane szczególnych kategorii oraz dane osób trzecich wyłącznie w zakresie niezbędnym do organizacji Wydarzenia, w szczególności:",
          "a) dane dotyczące zdrowia, takie jak alergie pokarmowe, inne alergie lub stany zdrowotne istotne dla bezpieczeństwa Uczestnika podczas Wydarzenia — na podstawie wyraźnej zgody Uczestnika, zgodnie z art. 9 ust. 2 lit. a RODO; podanie tych danych jest dobrowolne i służy wyłącznie zapewnieniu bezpieczeństwa Uczestnika, w szczególności dostosowaniu menu lub umożliwieniu szybkiej reakcji w sytuacji zagrożenia;",
          "b) dane kontaktowe osoby do kontaktu w nagłych wypadkach (ICE), obejmujące imię, nazwisko i numer telefonu osoby wskazanej przez Uczestnika — na podstawie prawnie uzasadnionego interesu Administratora, art. 6 ust. 1 lit. f RODO, polegającego na zapewnieniu bezpieczeństwa Uczestników i możliwości reakcji w sytuacjach nagłych.",
          "6. Uczestnik, podając dane osoby ICE, powinien poinformować tę osobę o przekazaniu jej danych Organizatorowi oraz o możliwości zapoznania się z informacją o przetwarzaniu danych dostępną na stronie internetowej Wydarzenia lub przekazaną przez Organizatora.",
          "7. Dane zdrowotne oraz dane ICE przetwarzane są wyłącznie na potrzeby danej edycji Konferencji i są usuwane nie później niż 30 dni po zakończeniu Wydarzenia, chyba że ich dalsze przechowywanie jest wymagane przepisami prawa lub uzasadnione zgłoszonym wypadkiem, incydentem, roszczeniem albo koniecznością obrony przed roszczeniami.",
          "8. Dane osobowe Uczestników przetwarzane są w następujących celach i na następujących podstawach prawnych:",
          "a) zawarcie i wykonanie umowy o udział w Wydarzeniu — art. 6 ust. 1 lit. b RODO;",
          "b) obsługa rejestracji, płatności, wydania biletu i komunikacji organizacyjnej — art. 6 ust. 1 lit. b RODO;",
          "c) realizacja obowiązków prawnych ciążących na Administratorze, w szczególności obowiązków rachunkowych, podatkowych, dokumentacyjnych lub archiwalnych — art. 6 ust. 1 lit. c RODO;",
          "d) realizacja prawnie uzasadnionych interesów Administratora, w tym zapewnienie bezpieczeństwa i porządku Wydarzenia, dochodzenie roszczeń lub obrona przed roszczeniami — art. 6 ust. 1 lit. f RODO;",
          "e) ubezpieczenie Uczestników, jeżeli Organizator zapewnia takie ubezpieczenie — art. 6 ust. 1 lit. b RODO lub art. 6 ust. 1 lit. f RODO, w zakresie niezbędnym do objęcia Uczestnika ubezpieczeniem;",
          "f) przetwarzanie numeru PESEL — wyłącznie wtedy, gdy jest niezbędny do objęcia Uczestnika ubezpieczeniem zapewnianym przez Organizatora lub wymagany przez ubezpieczyciela;",
          "g) dokumentacja i promocja Organizatora, w zakresie indywidualnego wykorzystania wizerunku Uczestnika, jeżeli wymagana jest zgoda — art. 6 ust. 1 lit. a RODO.",
          "9. Dane osobowe Uczestników mogą być udostępniane:",
          "a) podmiotom przetwarzającym dane w imieniu Administratora, w szczególności dostawcom usług IT, operatorom formularzy, podmiotom obsługującym komunikację, ubezpieczycielom, podmiotom świadczącym usługi organizacyjne lub techniczne — wyłącznie w zakresie niezbędnym i na podstawie właściwych podstaw prawnych;",
          "b) organom publicznym — wyłącznie na podstawie bezwzględnie obowiązujących przepisów prawa;",
          "c) innym podmiotom zaangażowanym w organizację Wydarzenia — wyłącznie wtedy, gdy jest to niezbędne do realizacji Wydarzenia i istnieje właściwa podstawa prawna.",
          "10. Dane osobowe przechowywane są przez następujące okresy:",
          "a) dane związane z wykonaniem umowy — przez czas trwania umowy, a następnie przez okres przedawnienia ewentualnych roszczeń;",
          "b) dane rozliczeniowe, rachunkowe, podatkowe i finansowe — przez okres wymagany przepisami prawa;",
          "c) dane dla celów ubezpieczeniowych — przez okres niezbędny do realizacji ochrony ubezpieczeniowej oraz ewentualnych roszczeń związanych z ubezpieczeniem;",
          "d) dane do celów archiwalnych — zgodnie z obowiązującymi przepisami prawa i regulacjami wewnętrznymi Administratora;",
          "e) dane przetwarzane na podstawie zgody — do czasu cofnięcia zgody, chyba że istnieje inna podstawa dalszego przetwarzania.",
          "11. Uczestnikowi przysługują następujące prawa w zakresie ochrony danych osobowych: prawo dostępu do danych, prawo do sprostowania danych, prawo do usunięcia danych w zakresie dopuszczonym przepisami RODO, prawo do ograniczenia przetwarzania, prawo do przenoszenia danych, prawo do sprzeciwu, jeżeli przetwarzanie odbywa się na podstawie prawnie uzasadnionego interesu, oraz prawo do cofnięcia zgody w dowolnym momencie bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.",
          "12. W przypadku naruszenia przepisów o ochronie danych osobowych Uczestnik ma prawo wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych.",
          "13. Podanie danych osobowych jest dobrowolne, lecz niezbędne do nabycia biletu i uczestnictwa w Wydarzeniu w zakresie danych koniecznych do organizacji Wydarzenia. Odmowa podania tych danych uniemożliwia nabycie biletu lub uczestnictwo. Podanie danych zdrowotnych jest dobrowolne, a ich niepodanie nie wyklucza uczestnictwa, lecz może ograniczyć możliwość dostosowania świadczeń lub reakcji Organizatora na szczególne potrzeby Uczestnika.",
          "14. Dane osobowe Uczestników nie będą przekazywane do państw trzecich ani organizacji międzynarodowych, chyba że Uczestnik zostanie o tym odrębnie poinformowany zgodnie z RODO.",
          "15. Dane osobowe Uczestników nie będą przetwarzane w sposób zautomatyzowany ani nie będą podlegały profilowaniu."
        ],
        commentary: [
          "Ten paragraf poprawiono tak, żeby nie było automatycznego wrzucania PESEL-u pod obowiązek prawny. Jeżeli ubezpieczyciel rzeczywiście wymaga PESEL-u, można go zebrać, ale trzeba to opisać jako dane niezbędne do ubezpieczenia, a nie jako ogólny wymóg.",
          "Dane zdrowotne zostają na wyraźnej zgodzie z art. 9 ust. 2 lit. a RODO. Dane ICE zostają na uzasadnionym interesie.",
          "Dodano bardziej realną retencję danych: nie wszystko 3 lata, bo księgowość, archiwizacja, ubezpieczenia i roszczenia mogą mieć inne okresy.",
          "Dane ICE są przetwarzane na podstawie uzasadnionego interesu, a nie zgody — bo w nagłej sytuacji Organizator musi móc skontaktować się z osobą wskazaną bez konieczności ponownego pytania o zgodę."
        ]
      },
      {
        id: "tedx-8",
        title: "§ 8. Siła wyższa",
        content: [
          "1. W przypadku niemożności przeprowadzenia Konferencji lub Imprezy z powodu Siły wyższej Organizator niezwłocznie powiadomi Uczestników drogą elektroniczną, wskazując znane mu okoliczności.",
          "2. W przypadku odwołania lub przeniesienia Konferencji na inny termin z powodu Siły wyższej Organizator dołoży starań, aby zaproponować Uczestnikom uczestnictwo w zamiennym terminie. Uczestnik, który nie wyrazi zgody na uczestnictwo w zamiennym terminie, otrzyma zwrot uiścionej opłaty w ciągu 30 dni od poinformowania Organizatora o rezygnacji w formie dokumentowej, w szczególności za pośrednictwem wiadomości e-mail.",
          "3. W przypadku odwołania Konferencji z przyczyn leżących wyłącznie po stronie Organizatora, niebędących Siłą wyższą, Uczestnikowi przysługuje pełny zwrot uiścionej opłaty w ciągu 14 dni od oficjalnego ogłoszenia odwołania.",
          "4. Organizator nie ponosi odpowiedzialności odszkodowawczej za szkody poniesione przez Uczestników wskutek zaistnienia Siły wyższej, w szczególności za koszty podróży, zakwaterowania czy utracone korzyści, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa."
        ],
        commentary: [
          "Paragraf ten rozróżnia trzy scenariusze: siłę wyższą, odwołanie z winy Organizatora i brak zgody uczestnika na nowy termin. Takie rozróżnienie jest kluczowe dla jasności zasad zwrotu.",
          "Można ograniczać odpowiedzialność za siłę wyższą, ale nie warto pisać tego w sposób absolutny. Dlatego dodano bezpiecznik „z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa”."
        ]
      },
      {
        id: "tedx-9",
        title: "§ 9. Przepisy końcowe",
        content: [
          "1. Oświadczenie o akceptacji niniejszego Regulaminu stanowi warunek konieczny uczestnictwa w Wydarzeniu.",
          "2. Organizator zastrzega sobie prawo do zmiany postanowień niniejszego Regulaminu w przypadku wystąpienia obiektywnych przesłanek natury prawnej, organizacyjnej, technicznej, bezpieczeństwa lub wynikających z zasad licencji TEDx. O każdej zmianie Organizator powiadomi Uczestników drogą elektroniczną z wyprzedzeniem co najmniej 7 dni, chyba że zmiana musi zostać wprowadzona niezwłocznie ze względu na przepisy prawa, bezpieczeństwo albo decyzję właściwych organów.",
          "3. Uczestnik, który nie akceptuje zmian Regulaminu istotnie wpływających na jego prawa lub obowiązki, może odstąpić od umowy. W takim przypadku przysługuje mu zwrot uiścionej opłaty.",
          "4. Spory wynikające z niniejszego Regulaminu Strony będą starały się rozwiązać polubownie. W przypadku braku porozumienia spory podlegają rozstrzygnięciu przez sąd właściwy miejscowo i rzeczowo zgodnie z obowiązującymi przepisami prawa polskiego.",
          "5. W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności: Kodeks cywilny, ustawa z dnia 30 maja 2014 r. o prawach konsumenta, Rozporządzenie RODO oraz ustawa z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych.",
          "6. Niniejszy Regulamin wchodzi w życie z dniem jego opublikowania na stronie internetowej www.tedxuew.com."
        ],
        commentary: [
          "Dodano licencję TEDx jako jedną z możliwych przyczyn zmiany regulaminu, bo to realnie może się zdarzyć.",
          "Nie zostawiano prawa zmiany regulaminu bez ograniczeń. Dlatego Uczestnik może odstąpić, jeśli zmiana istotnie wpływa na jego prawa lub obowiązki.",
          "Dodano ustawę o prawie autorskim do katalogu przepisów, bo przy tym regulaminie wizerunek, nagrania i prelekcje są bardzo istotne.",
          "Termin 7-dniowego wyprzedzenia chroni uczestników przed arbitralnymi zmianami wprowadzanymi z dnia na dzień, jednocześnie dając elastyczność w naglinach prawnych lub związanych z licencją TEDx."
        ]
      }
    ]
  }
};

export default function LegalHubPage() {
  const [activeTab, setActiveTab] = useState('WIKI');
  const [expandedTerm, setExpandedTerm] = useState(null);
  const [regCategory, setRegCategory] = useState('external');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const filteredRegulations = EVENT_REGULATIONS[regCategory].filter(reg =>
    reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleComment = (index) => {
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          Profesjonalne repozytorium wiedzy. Zrozum i wdrażaj mechanizmy prawne chroniące struktury uczelniane podczas organizacji projektów SSUEW.
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
          <Icons.Folder /> Wzorce Dokumentacji Projektowej
        </button>
        <button
          onClick={() => { setActiveTab('ORDERS'); setSelectedTemplate(null); }}
          className={`pb-4 px-4 font-black text-[13px] uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'ORDERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Icons.Shield /> Zarządzenia i Pisma Okólne
        </button>
      </div>

      {/* ==================================================== */}
      {/* ZAKŁADKA 1: LEGAL WIKI                               */}
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
                    <p className="text-slate-700 text-[15px] leading-relaxed font-medium">{item.desc}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                    <div className="bg-white border-2 border-red-100 p-5 rounded-2xl relative shadow-sm">
                      <span className="absolute -top-3 left-5 bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Zapis Błędny (Ryzykowny)</span>
                      <p className="text-slate-700 text-sm font-medium mt-3 leading-relaxed">"{item.badExample}"</p>
                    </div>
                    <div className="bg-white border-2 border-emerald-100 p-5 rounded-2xl relative shadow-sm">
                      <span className="absolute -top-3 left-5 bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Rekomendowany Zapis</span>
                      <p className="text-slate-700 text-sm font-bold mt-3 leading-relaxed">"{item.goodExample}"</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Icons.Scale /></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Icons.Scale />
                      </div>
                      <div>
                        <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-2">Opinia i Wytyczne Prawne</h4>
                        <p className="text-slate-300 text-[15px] leading-relaxed font-medium">{item.lawyerAdvice}</p>
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
      {/* ZAKŁADKA 2: BAZA REGULAMINÓW (WIDOK LISTY)           */}
      {/* ==================================================== */}
      {activeTab === 'REGULATIONS' && !selectedTemplate && (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn">

          {/* Menu Boczne */}
          <div className="w-full md:w-72 shrink-0">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
              <button
                onClick={() => { setRegCategory('external'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-[14px] font-bold transition-all ${regCategory === 'external' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Zewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider ${regCategory === 'external' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {EVENT_REGULATIONS.external.length} proj.
                </span>
              </button>
              <button
                onClick={() => { setRegCategory('internal'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-[14px] font-bold transition-all mt-2 ${regCategory === 'internal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Projekty Wewnętrzne
                <span className={`text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider ${regCategory === 'internal' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {EVENT_REGULATIONS.internal.length} proj.
                </span>
              </button>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-5">
            {/* Wyszukiwarka */}
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

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start mb-2">
              <div className="text-amber-500 mt-0.5 shrink-0"><Icons.Alert /></div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm mb-1">Wzorce robocze — wymagają weryfikacji prawnej</h4>
                <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
                  Poniższe dokumenty to <strong>wewnętrzne wzorce organizacyjne SSUEW</strong> — nie zostały poddane formalnej weryfikacji przez Radców Prawnych Uczelni. Przed użyciem w oficjalnym obiegu każdy regulamin należy skonsultować z właściwym radcą prawnym UEW lub IOD. Struktura i klauzule oparte na ogólnych zasadach prawa cywilnego.
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
                        <span className="text-slate-400 group-hover:text-indigo-500 transition-colors mt-0.5 shrink-0"><Icons.Book /></span>
                        {project.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">{project.desc}</p>
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
      {/* TRYB CZYTNIKA: OTWARTY DOKUMENT                      */}
      {/* ==================================================== */}
      {activeTab === 'REGULATIONS' && selectedTemplate && TEMPLATES_DATA[selectedTemplate] && (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-slideUp">

          {/* Spis Treści */}
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

          {/* Tekst Dokumentu */}
          <div className="flex-grow order-1 lg:order-2">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

              <div className="bg-slate-900 p-8 md:p-10 border-b-4 border-indigo-500 relative overflow-hidden">
                <div className="absolute right-0 top-0 text-white opacity-5 text-9xl -mt-10 -mr-10">§</div>
                <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3">Wstęp do Wzorca (Dla Organizatora)</h2>
                <p className="text-slate-300 text-sm leading-relaxed font-medium max-w-3xl relative z-10">
                  {TEMPLATES_DATA[selectedTemplate].intro}
                </p>
              </div>

              <div className="p-8 pb-4 text-center border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">WZÓR</p>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">
                  {TEMPLATES_DATA[selectedTemplate].title}
                </h1>
                {TEMPLATES_DATA[selectedTemplate].subtitle && (
                  <p className="text-base font-bold text-slate-500 mt-1">{TEMPLATES_DATA[selectedTemplate].subtitle}</p>
                )}
              </div>

              <div className="p-8 md:p-12 pt-6">
                {TEMPLATES_DATA[selectedTemplate].sections.map((section, index) => (
                  <div key={index} id={section.id} className="mb-12 scroll-mt-28">
                    <div className="font-serif text-slate-900 mb-4">
                      <h3 className="text-lg font-bold mb-4">{section.title}</h3>
                      <div className="space-y-3 text-[15px] leading-loose text-justify text-slate-800">
                        {section.content.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => toggleComment(index)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-2 border ${expandedComments[index] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <Icons.Scale />
                        {expandedComments[index] ? 'Ukryj komentarz' : 'Zobacz komentarz do zapisu'}
                      </button>

                      {expandedComments[index] && (
                        <div className="mt-3 bg-indigo-50/50 border-l-4 border-indigo-400 rounded-r-xl p-5 shadow-sm animate-fadeIn space-y-3">
                          {Array.isArray(section.commentary)
                            ? section.commentary.map((p, i) => (
                                <p key={i} className="text-slate-700 text-[13px] font-medium leading-relaxed italic">{p}</p>
                              ))
                            : <p className="text-slate-700 text-[13px] font-medium leading-relaxed italic">{section.commentary}</p>
                          }
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

      {/* ==================================================== */}
      {/* ZAKŁADKA 3: ZARZĄDZENIA I PISMA OKÓLNE               */}
      {/* ==================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="max-w-6xl mx-auto animate-fadeIn">

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start mb-8">
            <div className="text-amber-500 mt-0.5 shrink-0"><Icons.Alert /></div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm mb-1">Dwa typy wpisów — zweryfikowane i robocze</h4>
              <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
                Pozycje oznaczone <strong className="text-emerald-700">✓ Zweryfikowane</strong> posiadają potwierdzony numer zarządzenia i treść zgodną z dokumentem źródłowym UEW. Pozycje oznaczone <strong>[Nr do uzupełnienia]</strong> opisują procedury obowiązujące na UEW, których numer wymaga weryfikacji.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {RECTOR_ORDERS.map(order => (
              <div key={order.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${order.verified ? 'border-emerald-200' : 'border-slate-200'}`}>

                {/* Nagłówek */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ${
                      order.type.includes('Zarządzenie Rektora') ? 'bg-indigo-100 text-indigo-700' :
                      order.type.includes('Zarządzenie Kanclerza') ? 'bg-violet-100 text-violet-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{order.type}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${order.verified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {order.verified ? '✓ ' : ''}{order.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{order.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dotyczy:</span>
                    <span className="text-[11px] font-semibold text-indigo-600">{order.relevance}</span>
                  </div>
                </div>

                {/* Kluczowe punkty */}
                <div className="px-6 py-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kluczowe zasady</p>
                  <ul className="space-y-2">
                    {order.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ostrzeżenie */}
                <div className="mx-6 mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-3 items-start">
                  <span className="text-red-500 shrink-0 mt-0.5"><Icons.Alert /></span>
                  <p className="text-xs font-semibold text-red-800 leading-relaxed">{order.warning}</p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jednostka właściwa: </span>
                    <span className="text-xs font-bold text-slate-600">{order.contactUnit}</span>
                  </div>
                  {order.note && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 max-w-md">
                      <p className="text-[11px] text-slate-500 leading-relaxed italic">{order.note}</p>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
