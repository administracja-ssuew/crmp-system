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
    badExample: "Zawarto z fotografem 'Umowę zlecenie' na wykonanie sesji zdjęciowej z Gali SSUEW. Fotograf dostarczył 30 rozmazanych zdjęć niskiej jakości i żąda pełnego wynagrodzenia.",
    goodExample: "Zawarto 'Umowę o dzieło' z fotografem, określając przedmiot dzieła: 'minimum 200 zdjęć w rozdzielczości co najmniej 3000px, obrobionych, dostarczonych w ciągu 7 dni od zakończenia wydarzenia'. Przy nienależytym wykonaniu zamawiającemu przysługuje rękojmia.",
    lawyerAdvice: "Przy umowach z konferansjerami, DJ-ami czy grafikami wykonującymi projekt plakatu — zawsze stosuj umowę o dzieło z precyzyjnie określonym rezultatem. Przy wolontariuszach pełniących dyżury na stoisku (czynność, nie efekt) — umowa zlecenia lub porozumienie wolontariackie. Błędna klasyfikacja może skutkować zakwestionowaniem przez ZUS i koniecznością odprowadzenia zaległych składek wraz z odsetkami."
  },
  {
    id: 6,
    term: "Majątkowe Prawa Autorskie i Licencja",
    context: "TEDxUEW, Gala SSUEW, Fotografia, Filmy z wydarzeń, Materiały graficzne",
    desc: "Autorskie prawa majątkowe (art. 17 ustawy o prawie autorskim i prawach pokrewnych) to wyłączne prawo twórcy do korzystania z utworu i rozporządzania nim. Prawa te mogą być przeniesione (na polach eksploatacji) lub objęte licencją. Bez odrębnej klauzuli umownej organizator eventu nie nabywa automatycznie żadnych praw do materiałów stworzonych przez zatrudnionego fotografa czy prelegenta.",
    badExample: "W umowie z fotografem brak jakiejkolwiek wzmianki o prawach autorskich. Po Gali SSUEW fotograf wyraża sprzeciw wobec opublikowania zdjęć w mediach społecznościowych i żąda dodatkowego wynagrodzenia za 'licencję'.",
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
    lawyerAdvice: "Zgoda na wizerunek powinna być oddzielną klauzulą — nie wplatać jej w ogólne 'akceptuję regulamin'. Przy Adapciaku i wyjazdach komisji zbieraj zgody przy rejestracji (checkbox w formularzu). Dla uczestników niepełnoletnich (jeśli organizujesz projekty dla licealistów, np. TWE) wymagana jest zgoda rodzica/opiekuna prawnego. Cofnięcie zgody po publikacji zobowiązuje do usunięcia materiałów."
  },
  {
    id: 8,
    term: "Wolontariat i Porozumienie Wolontariackie",
    context: "Animalia, Juwenalia Wrocławskie, Konferencje, każdy projekt angażujący wolontariuszy",
    desc: "Wolontariat reguluje ustawa z dnia 24 kwietnia 2003 r. o działalności pożytku publicznego i wolontariacie. Wolontariusz wykonuje świadczenia nieodpłatnie, dobrowolnie i na rzecz organizacji pożytku publicznego. Z wolontariuszem zawiązuje się pisemne porozumienie wolontariackie (przy współpracy dłuższej niż 30 dni — obowiązkowo na piśmie). Organizacja jest zobowiązana do ubezpieczenia wolontariusza od NNW oraz zapewnienia warunków BHP.",
    badExample: "SSUEW organizuje akcję zbiórkową Animalia. Kilkudziesięciu wolontariuszy pracuje bez żadnego porozumienia i bez ubezpieczenia NNW. Jeden z nich ulega wypadkowi przy przenoszeniu materiałów.",
    goodExample: "Przed każdym projektem angażującym wolontariuszy podpisuje się porozumienie wolontariackie z klauzulą o ubezpieczeniu NNW, określające zakres zadań, czas trwania i zasady odpowiedzialności. Porozumienie archiwizuje się zgodnie z JRWA.",
    lawyerAdvice: "Samorząd Studentów UEW działa w oparciu o struktury Uczelni, dlatego kwestia ubezpieczenia wolontariuszy wymaga każdorazowego uzgodnienia z Działem Administracji UEW. Nie zakładaj automatycznie, że wolontariusze są objęci jakimkolwiek ubezpieczeniem — zweryfikuj to przed projektem. Brak porozumienia wolontariackiego może być zakwalifikowany przez ZUS jako stosunek pracy lub zlecenia i skutkować obowiązkiem odprowadzenia składek."
  },
  {
    id: 9,
    term: "Odpowiedzialność Deliktowa vs. Kontraktowa",
    context: "Wypadki na eventach, Szkody w mieniu UEW, Roszczenia uczestników",
    desc: "Dwa reżimy odpowiedzialności cywilnej w polskim prawie. Odpowiedzialność kontraktowa (art. 471 KC) powstaje z niewykonania lub nienależytego wykonania umowy. Odpowiedzialność deliktowa (art. 415 KC) to odpowiedzialność za czyn niedozwolony — może jej dochodzić każda osoba poszkodowana, nawet bez umowy z organizatorem.",
    badExample: "Regulamin eventu wyłącza 'wszelką odpowiedzialność organizatora'. Uczestnik wywraca się na mokrej podłodze i doznaje urazu. Klauzula wyłączenia odpowiedzialności jest bezskuteczna wobec deliktów.",
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
      tags: ["Licencja TEDx", "Umowa o dzieło", "Prawa autorskie", "Ticketing", "Patronat Rektora"]
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
    number: '[Nr do uzupełnienia]',
    verified: false,
    title: 'Powołanie i tryb działania Rektorskiej Komisji Likwidacyjno-Kasacyjnej (RKLiK)',
    relevance: 'Wykreślanie wyposażenia z Księgi Inwentarzowej SSUEW — kasacja sprzętu zniszczonego, przestarzałego lub skradzionego',
    keyPoints: [
      'Komisja Likwidacyjno-Kasacyjna jest organem kolegialnym powoływanym przez Rektora, upoważnionym do wydania decyzji o kasacji (trwałym wykreśleniu) składnika majątkowego Uczelni.',
      'Samorząd Studentów inicjuje procedurę kasacji poprzez złożenie wniosku do Kwestury UEW, wskazując numer inwentarzowy, opis stanu technicznego oraz uzasadnienie konieczności kasacji.',
      'Komisja wizualnie ocenia stan sprzętu i wydaje Protokół Kasacyjny — jest to dokument źródłowy dla wykreślenia pozycji z Księgi Inwentarzowej.',
      'Po wydaniu protokołu przedmiot trafia do utylizacji zgodnej z przepisami (np. sprzęt elektroniczny — certyfikowany recykling WEEE) lub może zostać przekazany innej jednostce. Bez protokołu RKLiK wykreślenie z Księgi Inwentarzowej jest nieważne.',
    ],
    warning: 'Fizyczne zniszczenie lub wyrzucenie sprzętu figurującego w Księdze Inwentarzowej bez protokołu kasacyjnego stanowi naruszenie dyscypliny finansów publicznych.',
    contactUnit: 'Kwestura UEW — Sekcja ds. Majątku',
    note: 'Numer zarządzenia do weryfikacji w BIP UEW lub Sekretariacie Rektora. Procedurę kasacyjną należy inicjować przed fizycznym usunięciem przedmiotu.',
  },
  {
    id: 'zakupy',
    type: 'Pismo Okólne Kwestora',
    number: '[Nr do uzupełnienia]',
    verified: false,
    title: 'Zasady dokonywania zakupów ze środków Uczelni — tryb zamówień do progu bagatelności',
    relevance: 'Zakup sprzętu, materiałów promocyjnych, usług cateringowych na projekty SSUEW finansowane z budżetu Uczelni',
    keyPoints: [
      'Zakupy do kwoty progu bagatelności (aktualnie 130 000 PLN netto) mogą być dokonywane bez stosowania ustawy Prawo zamówień publicznych, jednak wciąż obowiązuje zasada gospodarności.',
      'Wymagane są co najmniej trzy oferty cenowe (rozeznanie rynku) dla zakupów przekraczających próg wewnętrzny Uczelni — skonsultuj aktualny próg z Kwesturą.',
      'Faktura musi być wystawiona na Uniwersytet Ekonomiczny we Wrocławiu z podaniem centrum kosztów lub projektu. Faktury wystawione na osobę prywatną lub SSUEW bez NIP Uczelni nie mogą być zaksięgowane.',
      'Zakup nie może nastąpić przed uzyskaniem stosownej akceptacji — faktury za wydatki dokonane bez uprzedniej zgody mogą nie zostać zatwierdzone do zapłaty.',
    ],
    warning: 'Naruszenie zasad zamówień publicznych, w tym celowe dzielenie zamówień w celu ominięcia progów, jest przestępstwem z art. 231 KK (nadużycie uprawnień).',
    contactUnit: 'Kwestura UEW — Dział Finansowy',
    note: 'Numer pisma okólnego do weryfikacji. Każdy projekt SSUEW z budżetem Uczelni powinien mieć przydzielony numer centrum kosztów — ustal go z opiekunem Samorządu przed pierwszym zakupem.',
  },
  {
    id: 'imprezy',
    type: 'Zarządzenie Rektora',
    number: '[Nr do uzupełnienia]',
    verified: false,
    title: 'Organizacja imprez i wydarzeń na terenie Uczelni — zasady udzielania zgody i odpowiedzialności',
    relevance: 'Każde wydarzenie organizowane w obiektach UEW: sale, aule, korytarze, teren kampusu — dotyczy m.in. Gali SSUEW, Wigilii, GradUEtion, eventów komisji',
    keyPoints: [
      'Organizacja każdego wydarzenia na terenie UEW wymaga pisemnej zgody właściwego Prorektora lub Dziekana — wniosek powinien wpłynąć minimum 14 dni przed planowaną datą.',
      'Wniosek powinien zawierać: tytuł i charakter wydarzenia, szacunkową liczbę uczestników, plan rozmieszczenia, informacje o nagłośnieniu i oświetleniu, deklarację sprzątania po evencie.',
      'Organizator odpowiada za stan pomieszczeń po zakończeniu. Wszelkie uszkodzenia infrastruktury obciążają organizującą jednostkę.',
      'Przy imprezach z alkoholem wymagana jest odrębna zgoda i każdorazowe stosowanie przepisów ustawy o wychowaniu w trzeźwości.',
    ],
    warning: 'Brak zgody na organizację imprezy może skutkować jej przerwaniem przez Ochronę UEW oraz odpowiedzialnością dyscyplinarną organizatorów. Każdy lokal/sala ma własny limit pojemności określony przez Straż Pożarną — jego przekroczenie jest naruszeniem przepisów ochrony przeciwpożarowej.',
    contactUnit: 'Biuro Prorektora ds. Studenckich / Administracja właściwego obiektu',
    note: 'Numer zarządzenia do weryfikacji w BIP UEW. Przy rezerwacji sali na wydarzenie zewnętrzne (z udziałem osób spoza UEW) może być wymagana odrębna zgoda Kanclerza.',
  },
  {
    id: 'sale',
    type: 'Pismo Okólne Kanclerza',
    number: '[Nr do uzupełnienia]',
    verified: false,
    title: 'Zasady udostępniania sal i przestrzeni Uczelni podmiotom zewnętrznym i organizacjom studenckim',
    relevance: 'Rezerwacje sal na potrzeby SSUEW — spotkania komisji, próby, szkolenia, warsztaty projektowe',
    keyPoints: [
      'Organizacje studenckie działające przy UEW korzystają z sal co do zasady nieodpłatnie, z pierwszeństwem dla działalności dydaktycznej.',
      'Rezerwacji dokonuje się przez wyznaczony system — skontaktuj się z Biurem Obsługi Studenta lub Administracją właściwego budynku.',
      'Sala powinna być zwrócona w stanie niepogorszonym — meble ustawione standardowo, sprzęt nagłośnieniowy odłączony, śmieci wyniesione.',
      'W przypadku uszkodzenia wyposażenia sali organizacja studencka ponosi pełną odpowiedzialność materialną.',
    ],
    warning: 'Rezerwacja sali drogą nieformalną (np. tylko SMS do konserwatora) nie jest podstawą prawną do jej zajęcia — w przypadku konfliktu pierwszeństwo ma działalność dydaktyczna.',
    contactUnit: 'Biuro Obsługi Studenta / Administracja właściwego budynku',
    note: 'Numer pisma okólnego do weryfikacji. Przy rezerwacji sali na wydarzenie zewnętrzne (z udziałem osób spoza UEW) może być wymagana odrębna zgoda Kanclerza oraz opłata za najem.',
  },
];

const TEMPLATES_DATA = {
  TRIP_TEMPLATE: {
    title: "WZÓR: REGULAMIN WYJAZDU SZKOLENIOWO-INTEGRACYJNEGO",
    intro: "Niniejszy dokument jest wzorcem regulaminowym dla wyjazdów komisji SSUEW (LWK, WWK, JWK). Został skonstruowany zgodnie z zasadami profesjonalnej techniki prawodawczej — regulamin jest w istocie umową cywilnoprawną (umową adhezyjną) zawieraną pomiędzy Organizatorem a Uczestnikiem. Przed każdą edycją uzupełnij pola oznaczone nawiasami kwadratowymi. Pod każdym paragrafem znajdziesz komentarz wyjaśniający znaczenie konkretnych sformułowań.",
    sections: [
      {
        id: "sec-1",
        title: "§ 1. Przepisy ogólne i słowniczek pojęć",
        content: [
          "Niniejszy Regulamin stanowi wzorzec umowny w rozumieniu art. 384 ustawy z dnia 23 kwietnia 1964 r. – Kodeks cywilny i określa wiążące warunki udziału, prawa i obowiązki stron oraz zasady odpowiedzialności odszkodowawczej w ramach Wydarzenia.",
          "Ilekroć w tekście niniejszego Regulaminu stosuje się poniższe pojęcia pisane wielką literą, należy przez nie rozumieć:",
          "a) Regulamin – niniejszy akt normatywny o charakterze wewnętrznym;",
          "b) Wydarzenie – zorganizowany wyjazd szkoleniowo-integracyjny pod nazwą „[Letni / Wiosenny / Jesienny] Wyjazd Komisji [Rok]”, realizowany w terminie od [Data] do [Data] na terenie obiektu [Nazwa Ośrodka, adres];",
          "c) Organizator – Uniwersytet Ekonomiczny we Wrocławiu, w imieniu i na rzecz którego działania operacyjne podejmuje Samorząd Studentów UEW;",
          "d) Uczestnik – osobę fizyczną, która kumulatywnie spełniła przesłanki określone w § 2 niniejszego Regulaminu i wobec której Organizator potwierdził wpis na listę uczestników."
        ],
        commentary: "Wskazanie art. 384 Kodeksu cywilnego informuje, że ten dokument to 'wzorzec umowy' narzucony przez jedną ze stron. Definicje legalne tworzą zamknięty katalog pojęć. Słowo 'kumulatywnie' oznacza, że trzeba spełnić WSZYSTKIE warunki naraz. Organizatorem jest zawsze UEW — SSUEW nie posiada osobowości prawnej i nie może być stroną umowy we własnym imieniu."
      },
      {
        id: "sec-2",
        title: "§ 2. Kryteria kwalifikacyjne i tryb naboru",
        content: [
          "1. Prawo skutecznego ubiegania się o status Uczestnika przysługuje wyłącznie osobie fizycznej, która w dacie złożenia oświadczenia woli o udziale w Wydarzeniu spełnia łącznie następujące przesłanki:",
          "a) posiada pełną zdolność do czynności prawnych oraz ukończyła 18. rok życia;",
          "b) posiada aktywny status studenta Uniwersytetu Ekonomicznego we Wrocławiu;",
          "c) jest zrzeszona w strukturach Komisji Samorządu Studentów.",
          "2. Organizator zastrzega sobie prawo weryfikacji przesłanek, o których mowa w ust. 1.",
          "3. Dopuszcza się partycypację w Wydarzeniu osób posiadających status Alumna Samorządu Studentów UEW. W stosunku do podmiotów określonych w zdaniu poprzedzającym przesłanka wskazana w ust. 1 lit. b nie znajduje zastosowania.",
          "4. Zawarcie umowy o udział w Wydarzeniu następuje z chwilą kumulatywnego: prawidłowego wypełnienia formularza rejestracyjnego oraz uiszczenia świadczenia pieniężnego, o którym mowa w § 3 ust. 1."
        ],
        commentary: "Zamiast 'musisz mieć 18 lat i być studentem' używamy pojęcia 'zdolności do czynności prawnych' i 'skutecznego złożenia oświadczenia woli'. Określenie momentu 'zawarcia umowy' (ust. 4) jest kluczowe — od tego momentu obie strony są związane regulaminem. Klauzula o Alumna (ust. 3) pozwala zaprosić byłych działaczy bez potrzeby tworzenia odrębnego dokumentu."
      },
      {
        id: "sec-3",
        title: "§ 3. Świadczenia pieniężne i warunki odstąpienia od umowy",
        content: [
          "1. Z tytułu udziału w Wydarzeniu Uczestnik zobowiązuje się do uiszczenia na rzecz Organizatora świadczenia pieniężnego w zryczałtowanej kwocie [Kwota] PLN tytułem zadatku, w rozumieniu art. 394 Kodeksu cywilnego. Świadczenie uważa się za spełnione z chwilą uznania rachunku bankowego Organizatora o numerze: [Numer konta].",
          "2. Świadczenie, o którym mowa w ust. 1, wyczerpuje roszczenia Organizatora z tytułu kosztów zakwaterowania, wyżywienia oraz programu merytorycznego. Organizator nie zapewnia ochrony ubezpieczeniowej z tytułu odpowiedzialności cywilnej (OC) ani następstw nieszczęśliwych wypadków (NNW).",
          "3. W przypadku opuszczenia Terenu Wydarzenia przed upływem terminu jego zakończenia z przyczyn nieleżących po stronie Organizatora, Uczestnikowi nie przysługuje roszczenie o zwrot uiszczonego świadczenia w całości ani w części.",
          "4. Uczestnikowi przysługuje prawo odstąpienia od umowy bez podawania przyczyny, pod warunkiem złożenia stosownego oświadczenia w formie dokumentowej (wiadomość e-mail) nie później niż na [Liczba np. 14] dni przed datą rozpoczęcia Wydarzenia. Niezachowanie wskazanego terminu skutkuje bezwarunkowym przepadkiem uiszczonego zadatku na rzecz Organizatora z tytułu poniesionych kosztów organizacyjnych."
        ],
        commentary: "Słowo 'zadatek' (nie 'zaliczka'!) jest tu absolutnie kluczowe. Zadatek chroni budżet projektu: jeśli uczestnik rezygnuje z własnej winy, wpłacone środki przepadają na rzecz Organizatora. Gdyby napisać 'zaliczka', istniałby bezwarunkowy obowiązek zwrotu. Zapis o dacie 'uznania rachunku bankowego' eliminuje spory o to, czy przelew 'w ostatniej chwili' dotarł w terminie."
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
        commentary: "Wydalenie z wyjazdu to w języku prawnym 'rozwiązanie umowy ze skutkiem natychmiastowym z powodu rażącego naruszenia postanowień'. Odniesienie wprost do 'ustawy o przeciwdziałaniu narkomanii' eliminuje dyskusję, czy dana substancja jest nielegalna. Wyrażenie 'wyłączny koszt i ryzyko' oznacza, że Organizator nie jest zobowiązany do organizowania powrotu wydalanemu uczestnikowi."
      },
      {
        id: "sec-5",
        title: "§ 5. Reżim odpowiedzialności odszkodowawczej",
        content: [
          "1. Uczestnik ponosi pełną i wyłączną odpowiedzialność odszkodowawczą (na zasadzie winy) za wszelkie szkody majątkowe i niemajątkowe wyrządzone Organizatorowi oraz podmiotom trzecim (w tym właścicielowi obiektu) w związku ze swoim uczestnictwem w Wydarzeniu.",
          "2. W przypadku wyrządzenia szkody w infrastrukturze noclegowej przez grupę Uczestników zajmujących wspólne pomieszczenie, przy jednoczesnym braku możliwości indywidualizacji winy, Uczestnicy ci ponoszą odpowiedzialność solidarną w rozumieniu art. 366 Kodeksu cywilnego.",
          "3. Odpowiedzialność Organizatora z tytułu niewykonania lub nienależytego wykonania zobowiązania ogranicza się wyłącznie do szkód wyrządzonych z winy umyślnej. Uczestnik podejmuje aktywności fizyczne przewidziane w programie Wydarzenia na własne ryzyko."
        ],
        commentary: "'Odpowiedzialność solidarna' (ust. 2) to najsilniejszy instrument prawa cywilnego: Organizator może żądać pełnej kwoty za zniszczony pokój od jednego wybranego uczestnika, a to on potem dochodzi zwrotu od współlokatorów (roszczenie regresowe). 'Klauzula egzoneracyjna' (ust. 3) maksymalnie zawęża odpowiedzialność Uczelni — ale tylko za zdarzenia bez winy umyślnej po stronie Organizatora."
      },
      {
        id: "sec-6",
        title: "§ 6. Zasady przetwarzania danych osobowych",
        content: [
          "1. Zgodnie z art. 13 ust. 1 i 2 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO), administratorem danych osobowych Uczestników jest Uniwersytet Ekonomiczny we Wrocławiu.",
          "2. Dane osobowe (w tym dane identyfikacyjne oraz informacje o osobie do kontaktu w nagłych wypadkach — tzw. ICE) przetwarzane są wyłącznie w celu zawarcia i wykonania umowy o udział w Wydarzeniu (art. 6 ust. 1 lit. b RODO) oraz realizacji prawnie uzasadnionych interesów Administratora (art. 6 ust. 1 lit. f RODO).",
          "3. Dane osobowe ulegają trwałemu usunięciu lub procesowi anonimizacji niezwłocznie po wygaśnięciu roszczeń cywilnoprawnych wynikających z organizacji Wydarzenia, nie później jednak niż w terminie [Liczba] dni od daty jego zakończenia."
        ],
        commentary: "Administratorem danych jest zawsze UEW — nie SSUEW (brak osobowości prawnej). Zamiast ogólnikowych sformułowań wskazujemy konkretne artykuły RODO. Retencja danych powiązana z 'wygaśnięciem roszczeń cywilnoprawnych' jest jedynym w pełni uzasadnionym powodem przechowywania dokumentów po wyjeździe — np. w przypadku roszczenia o szkodę w ośrodku."
      },
      {
        id: "sec-7",
        title: "§ 7. Przepisy końcowe",
        content: [
          "1. Oświadczenie o akceptacji niniejszego Regulaminu stanowi wymóg sine qua non (warunek konieczny) dopuszczenia Uczestnika do udziału w Wydarzeniu.",
          "2. Organizator zastrzega sobie uprawnienie do jednostronnej zmiany postanowień niniejszego Regulaminu w przypadku wystąpienia obiektywnych przesłanek natury prawnej lub organizacyjnej. Zmieniony Regulamin wiąże Uczestnika, o ile nie wypowie on umowy w terminie 3 dni od daty doręczenia powiadomienia o zmianie.",
          "3. W sprawach nieuregulowanych zastosowanie znajdują odpowiednie przepisy powszechnie obowiązującego prawa polskiego, ze szczególnym uwzględnieniem przepisów ustawy – Kodeks cywilny."
        ],
        commentary: "Łacińska paremia 'sine qua non' podkreśla absolutny charakter wymogu. Ust. 2 rozwiązuje problem zmiany regulaminu w trakcie — można, ale uczestnik musi mieć prawo do rezygnacji, jeśli nowe warunki mu nie odpowiadają. Ust. 3 to standardowe odesłanie do KC jako prawa ogólnego — bez niego każda luka w regulaminie byłaby źródłem sporu."
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
                  Poniższe dokumenty to <strong>wewnętrzne wzorce organizacyjne SSUEW</strong> — nie zostały poddane formalnej weryfikacji przez Dział Radców Prawnych Uczelni. Przed użyciem w oficjalnym obiegu każdy regulamin należy skonsultować z właściwym radcą prawnym UEW lub IOD. Struktura i klauzule oparte na ogólnych zasadach prawa cywilnego.
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
                <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">
                  {TEMPLATES_DATA[selectedTemplate].title}
                </h1>
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
                Pozycje oznaczone <strong className="text-emerald-700">✓ Zweryfikowane</strong> posiadają potwierdzony numer zarządzenia i treść zgodną z dokumentem źródłowym UEW. Pozycje oznaczone <strong>[Nr do uzupełnienia]</strong> opisują procedury obowiązujące na UEW, których numer wymaga weryfikacji w Biurze Prawnym lub Sekretariacie Rektora / BIP UEW.
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
