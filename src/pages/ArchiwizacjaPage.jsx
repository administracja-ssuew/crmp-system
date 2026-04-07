import { useState, useEffect } from 'react';
import {
  Archive, ChevronRight, ArrowUp, CheckSquare, Square,
  FileText, AlertTriangle, CheckCircle, Folder, Tag,
  Users, Clock, BookOpen, Copy, Check, Filter, ExternalLink,
} from 'lucide-react';

function nb(text) {
  return text.replace(/ (i|w|z|o|a|u|do|we|ze|że|bo|na|po|od|ku|by) /g, ' $1\u00A0');
}

const NAV_ITEMS = [
  { id: 'wstep', label: 'Wstęp' },
  { id: 'ezd', label: 'EZD i model SSUEW' },
  { id: 'fundamenty', label: 'Trzy fundamenty' },
  { id: 'zasady', label: 'Zasady ogólne' },
  { id: 'slownik', label: 'Słownik pojęć' },
  { id: 'kategorie', label: 'Kategorie archiwalne' },
  { id: 'co-archiwizowac', label: 'Co (nie) archiwizować?' },
  {
    id: 'klasyfikacja',
    label: 'Klasyfikacja JRWA',
    children: [
      { id: 'klas-wybory', label: 'Wybory i przekazanie' },
      { id: 'klas-centralna', label: 'Działalność centralna' },
      { id: 'klas-promocja', label: 'Promocja i kronika' },
      { id: 'klas-wydarzenia', label: 'Wydarzenia i patronaty' },
      { id: 'klas-szkolenia', label: 'Szkolenia i konferencje' },
    ],
  },
  { id: 'decyzja', label: 'Decyzja klasyfikacyjna' },
  { id: 'teczki', label: 'Teczka aktowa' },
  { id: 'przygotowanie', label: 'Przygotowanie fizyczne' },
  { id: 'cyfrowe', label: 'Dokumentacja cyfrowa' },
  { id: 'spisy', label: 'Spisy i przekazanie' },
  { id: 'bledy', label: 'Częste błędy' },
  { id: 'przyklady', label: 'Przykłady praktyczne' },
  { id: 'checklista', label: 'Checklisty operacyjne' },
  { id: 'dokumenty', label: 'Dokumenty źródłowe' },
  { id: 'aneksy', label: 'Aneksy i matryce' },
];

const ALL_SECTION_IDS = [
  'wstep', 'ezd', 'fundamenty', 'zasady', 'slownik', 'kategorie', 'co-archiwizowac',
  'klasyfikacja', 'klas-wybory', 'klas-centralna', 'klas-promocja', 'klas-wydarzenia', 'klas-szkolenia',
  'decyzja', 'teczki', 'przygotowanie', 'cyfrowe', 'spisy', 'bledy', 'przyklady', 'checklista', 'dokumenty', 'aneksy',
];

const DOCS_SOURCE = [
  {
    group: 'Dokumenty uczelniane UEW',
    color: 'amber',
    items: [
      {
        title: 'Instrukcja kancelaryjna UEW',
        desc: 'Podstawowy dokument regulujący zasady obiegu dokumentów, zakładania spraw, opisu teczek i sporządzania spisów zdawczo-odbiorczych na Uczelni.',
        badge: 'Obowiązkowy',
        badgeColor: 'red',
        url: 'https://drive.google.com/file/d/10pRCIwONBMKAqQFc6L3Pqv8w6RZiSCyO/view?usp=sharing',
        note: 'Dokument wewnętrzny UEW — dostępny przez Archiwum UEW lub Dział Organizacyjny.',
      },
      {
        title: 'Jednolity Rzeczowy Wykaz Akt UEW (JRWA)',
        desc: 'Uczelniany wykaz klas dokumentacji wraz z symbolami JRWA, hasłami klasyfikacyjnymi, kategoriami archiwalnymi i uwagami. Punkt odniesienia przy każdej decyzji klasyfikacyjnej.',
        badge: 'Obowiązkowy',
        badgeColor: 'red',
        url: 'https://drive.google.com/file/d/1EzAtXgtTiiIXyldaXTu1A0KjupByEN3j/view?usp=sharing',
        note: 'Dokument wewnętrzny UEW — dostępny przez Archiwum UEW.',
      },
      {
        title: 'Katalog zamknięty SSUEW',
        desc: 'Wyciąg z JRWA UEW zawierający wyłącznie klasy relewantne dla działalności Samorządu Studentów UEW. Uzgodniony z Archiwum UEW. Jedyne klasy, z których korzysta SSUEW.',
        badge: 'Kluczowy dla SSUEW',
        badgeColor: 'amber',
        url: 'https://drive.google.com/file/d/1QXxmlNrN3r9m1p54ofd1nQa2a84oz8AK/view?usp=sharing',
        note: 'Dokument wewnętrzny SSUEW — przechowywany przez Członka Zarządu ds. Administracji.',
      },
    ],
  },
  {
    group: 'Akty prawne',
    color: 'slate',
    items: [
      {
        title: 'Ustawa z dnia 14 lipca 1983 r. o narodowym zasobie archiwalnym i archiwach',
        desc: 'Podstawowa ustawa regulująca zasady tworzenia, przechowywania i udostępniania materiałów archiwalnych. Definiuje pojęcia archiwum, materiałów archiwalnych i dokumentacji niearchiwalnej.',
        badge: 'Prawo powszechne',
        badgeColor: 'slate',
        url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19830380173',
        note: null,
      },
      {
        title: 'Rozporządzenie MNiSW z 2011 r. w sprawie dokumentacji przebiegu studiów',
        desc: 'Reguluje zasady prowadzenia i archiwizowania dokumentacji dotyczącej przebiegu studiów — istotne przy dokumentacji komisji wyborczej i spraw studenckich.',
        badge: 'Prawo powszechne',
        badgeColor: 'slate',
        url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20112011188',
        note: null,
      },
    ],
  },
  {
    group: 'Dokumenty wewnętrzne SSUEW',
    color: 'teal',
    items: [
      {
        title: 'Regulamin Samorządu Studentów UEW',
        desc: 'Dokument ustrojowy SSUEW określający strukturę organów, tryb wyborów i zasady działania. Kontekst konieczny przy klasyfikacji dokumentacji z grup RUSS.570 i RUSS.0052.',
        badge: 'Wewnętrzny SSUEW',
        badgeColor: 'teal',
        url: 'https://drive.google.com/file/d/1KZwp_jrbmuF2Wwxw4OMkYpfrKlczTL6h/view?usp=sharing',
        note: 'Dostępny na stronie SSUEW lub u Członka Zarządu ds. Administracji.',
      },
    ],
  },
];
const CHILD_IDS = ['klas-wybory', 'klas-centralna', 'klas-promocja', 'klas-wydarzenia', 'klas-szkolenia'];

const GLOSSARY = [
  { term: 'JRWA', def: 'Jednolity Rzeczowy Wykaz Akt — uczelniany wykaz rodzajów spraw i dokumentacji. Każda klasa ma symbol, hasło klasyfikacyjne, kategorię archiwalną i ewentualne uwagi.' },
  { term: 'Klasa końcowa', def: 'Najbardziej szczegółowy symbol w JRWA, pod którym faktycznie prowadzi się dokumentację i zakłada teczkę. Nie zakłada się teczek na poziomach nadrzędnych.' },
  { term: 'Znak akt', def: 'Oznaczenie teczki powiązane z właściwą klasą JRWA. W przypadku Samorządu ma formę RUSS.xxx — np. RUSS.570, RUSS.0631.' },
  { term: 'Znak sprawy', def: 'Pełne oznaczenie konkretnej sprawy prowadzonej w ramach danej klasy. Bardziej szczegółowe niż sam znak akt — obejmuje numer sprawy i rok.' },
  { term: 'Teczka aktowa', def: 'Fizyczna teczka lub inny nośnik zawierający uporządkowaną dokumentację jednej klasy końcowej i jednej kategorii archiwalnej.' },
  { term: 'Daty skrajne', def: 'Najwcześniejsza i najpóźniejsza data dokumentu znajdującego się w teczce. Obowiązkowy element opisu teczki.' },
  { term: 'Spis spraw', def: 'Wykaz spraw prowadzonych w ramach danej klasy w danym roku. Służy do ewidencji — nie mylić ze spisem zdawczo-odbiorczym.' },
  { term: 'Spis zdawczo-odbiorczy', def: 'Formalny dokument, na podstawie którego przekazuje się uporządkowane teczki do Archiwum UEW. Sporządza się go osobno dla kategorii A (4 egz.) i B (3 egz.).' },
  { term: 'Kategoria archiwalna', def: 'Oznaczenie informujące, jak długo przechowywać dokumentację i jaki ma ona status: A (wieczysta), B (czasowa), BE (z ekspertyzą), Bc (krótkotrwała).' },
  { term: 'EZD', def: 'Elektroniczne Zarządzanie Dokumentacją — system, w którym pracownicy Uczelni rejestrują sprawy i prowadzą obieg dokumentów. Samorząd nie archiwizuje w EZD, ale powinien rozumieć jego logikę.' },
  { term: 'Katalog zamknięty', def: 'Wyciąg z JRWA UEW zawierający tylko te klasy, które realnie dotyczą działalności SSUEW — uzgodniony z Archiwum UEW. Samorząd korzysta wyłącznie z klas w tym katalogu.' },
];

const CATEGORIES = [
  { sym: 'A', color: 'red', name: 'Materiały archiwalne', desc: 'Dokumentacja o trwałej wartości historycznej. Nie ulega zniszczeniu. Przekazywana docelowo do Archiwum Państwowego. Historia i rdzeń instytucji.' },
  { sym: 'B', color: 'blue', name: 'Dokumentacja niearchiwalna', desc: 'Dokumentacja o czasowym znaczeniu praktycznym. Po upływie okresu przechowywania może być brakowana.' },
  { sym: 'B5', color: 'teal', name: 'Przechowywana 5 lat', desc: 'Dokumentacja przechowywana przez minimum 5 lat od roku wytworzenia.' },
  { sym: 'B10', color: 'teal', name: 'Przechowywana 10 lat', desc: 'Dokumentacja przechowywana przez minimum 10 lat od roku wytworzenia.' },
  { sym: 'B50', color: 'orange', name: 'Przechowywana 50 lat', desc: 'Dokumentacja przechowywana przez minimum 50 lat. Bardzo ważna, ale nie wieczysta.' },
  { sym: 'BE', color: 'amber', name: 'Wymaga ekspertyzy', desc: 'Po upływie wskazanego okresu wymaga ekspertyzy archiwalnej przed ewentualnym zniszczeniem. Nie zakłada się automatycznie brakowania.' },
  { sym: 'Bc', color: 'slate', name: 'Krótkotrwałe znaczenie', desc: 'Dokumentacja o krótkotrwałym znaczeniu praktycznym. Nie trafia do teczek archiwalnych.' },
];

const JRWA_GROUPS = [
  {
    id: 'klas-wybory', title: 'A — Wybory i przekazanie obowiązków',
    classes: [
      {
        sym: 'RUSS.0052', title: 'Wybory do pozostałych organów wybieralnych na Uczelni',
        items: ['Ogłoszenia wyborcze', 'Listy kandydatów', 'Protokoły komisji wyborczej', 'Wyniki wyborów', 'Uchwały i rozstrzygnięcia dotyczące wyborów']
      },
      {
        sym: 'RUSS.0122', title: 'Przejmowanie jednostek organizacyjnych i stanowisk pracy',
        items: ['Protokoły zdawczo-odbiorcze Przewodniczącego', 'Protokoły przekazania obowiązków członków Zarządu', 'Protokoły przekazania funkcji koordynatorów projektów']
      },
    ],
  },
  {
    id: 'klas-centralna', title: 'B — Działalność centralna Samorządu',
    classes: [
      {
        sym: 'RUSS.570', title: 'Samorząd studentów — rdzeń ustrojowy',
        items: ['Statut i regulaminy', 'Struktura organizacyjna i składy osobowe', 'Programy i plany działania', 'Sprawozdania roczne i kadencyjne', 'Uchwały RUSS', 'Protokoły posiedzeń RUSS', 'Dokumentacja komisji samorządowych (poza wyborami)']
      },
      { sym: 'RUSS.571', title: 'Organizacje studenckie', items: ['Dokumentacja organizacji studenckich działających przy SSUEW'] },
      { sym: 'RUSS.573', title: 'Studenckie koła naukowe', items: ['Dokumentacja kół naukowych zarejestrowanych przy UEW'] },
      { sym: 'RUSS.574', title: 'Rejestr kół naukowych i organizacji studenckich', items: ['Rejestr kół naukowych i organizacji studenckich prowadzony przez Samorząd'] },
      { sym: 'RUSS.575', title: 'Finansowanie Samorządu Studentów i organizacji studenckich', items: ['Dokumentacja finansowania działalności SSUEW i organizacji studenckich'] },
    ],
  },
  {
    id: 'klas-promocja', title: 'C — Promocja, wizerunek i kronika',
    classes: [
      {
        sym: 'RUSS.0613', title: 'Koordynacja i obsługa mediów społecznościowych i portali',
        items: ['Roczne raporty mediów społecznościowych', 'Podsumowania kampanii', 'Kluczowe komunikaty publikowane w imieniu Samorządu']
      },
      {
        sym: 'RUSS.0614', title: 'System identyfikacji wizualnej',
        items: ['Księga identyfikacji wizualnej', 'Zasady używania logotypów', 'Przyjęte standardy wizualne']
      },
      {
        sym: 'RUSS.0615', title: 'Materiały promocyjne i reklamowe',
        items: ['Finalne plakaty', 'Finalne ulotki i grafiki', 'Dokumentacja gadżetów promocyjnych']
      },
      {
        sym: 'RUSS.062', title: 'Kroniki i księgi pamiątkowe',
        items: ['Kroniki Samorządu', 'Albumy kadencji', 'Księgi pamiątkowe']
      },
    ],
  },
  {
    id: 'klas-wydarzenia', title: 'D — Wydarzenia, patronaty i wyjazdy',
    classes: [
      {
        sym: 'RUSS.0631', title: 'Imprezy uczelniane — każda impreza to odrębna teczka',
        items: ['Scenariusz i program', 'Materiały promocyjne', 'Wydruk dokumentacji fotograficznej lub opis nośnika', 'Skład zespołu organizacyjnego', 'Raport końcowy lub ewaluacja']
      },
      {
        sym: 'RUSS.0634', title: 'Udział w obcych imprezach krajowych i zagranicznych',
        items: ['Decyzje o delegowaniu', 'Programy wydarzeń', 'Sprawozdania z udziału', 'Własne wystąpienia lub materiały przygotowane na wydarzenie']
      },
      {
        sym: 'RUSS.0640', title: 'Patronaty i komitety honorowe',
        items: ['Wnioski o patronat', 'Decyzje o udzieleniu patronatu', 'Dokumenty potwierdzające realizację patronatu']
      },
    ],
  },
  {
    id: 'klas-szkolenia', title: 'E — Szkolenia, konferencje i kształcenie',
    classes: [
      {
        sym: 'RUSS.581', title: 'Szkolenia i kursy dla studentów i absolwentów — każde szkolenie to odrębna teczka',
        items: ['Program i agenda', 'Dane prowadzącego', 'Listy uczestników', 'Ankiety ewaluacyjne', 'Sprawozdanie końcowe', 'Wykaz wydanych certyfikatów']
      },
      {
        sym: 'RUSS.461', title: 'Obce konferencje, zjazdy, sympozja, seminaria naukowe',
        items: ['Referaty i panele przygotowane przez Samorząd', 'Własne wystąpienia', 'Programy konferencji', 'Sprawozdania z udziału']
      },
      {
        sym: 'RUSS.460', title: 'Własne konferencje, zjazdy, sympozja, seminaria naukowe',
        items: ['Programy', 'Referaty', 'Wnioski', 'Listy uczestników i karty zgłoszeń', 'Raporty'],
        note: 'Dokumentacja organizacyjno-techniczna tych wydarzeń ma kategorię B2. Wprowadzenie tej klasy do katalogu zamkniętego wymaga uzgodnienia z Archiwum UEW — skonsultuj przed użyciem.'
      },
    ],
  },
];

const ERRORS = [
  { n: 1, title: 'Jedna teczka na wszystko', desc: 'Teczka „Samorząd 2025" nie rozwiązuje problemu — ona go tworzy.', fix: 'Jedna klasa końcowa = jedna teczka. Bez wyjątków.' },
  { n: 2, title: 'Mieszanie finalnych z roboczymi', desc: 'W teczce mają być akta, a nie cały warsztat produkcyjny projektu.', fix: 'Archiwizuj efekt, przebieg i decyzję — nie bałagan roboczy wokół nich.' },
  { n: 3, title: 'Mieszanie kilku klas JRWA w jednej teczce', desc: 'Błąd klasyfikacyjny i porządkowy jednocześnie.', fix: 'Sprawdź klasę dla każdego dokumentu przed włożeniem do teczki.' },
  { n: 4, title: 'Zbyt ogólne lub potoczne tytuły teczek', desc: '"Różne rzeczy z eventu" albo "Materiały 2025" to nie jest opis teczki.', fix: 'Tytuł musi być formalny, czytelny i zgodny z klasą JRWA.' },
  { n: 5, title: 'Brak dat skrajnych', desc: 'Bez dat skrajnych opis teczki jest niekompletny i niezgodny z wymaganiami.', fix: 'Sprawdź najwcześniejszy i najpóźniejszy dokument przed opisaniem teczki.' },
  { n: 6, title: 'Brak rozdzielenia A i B', desc: 'Akta różnych kategorii nie mogą iść jednym spisem zdawczo-odbiorczym.', fix: 'Zawsze sortuj dokumentację według kategorii przed sporządzeniem spisu.' },
  { n: 7, title: 'Spinacze, zszywki i koszulki', desc: 'Błąd techniczny, ale bardzo częsty — i niedopuszczalny przy przekazaniu do Archiwum.', fix: 'Usuń wszystkie elementy metalowe i plastikowe przed zamknięciem teczki.' },
  { n: 8, title: 'Improwizowanie nowych klas', desc: 'Samorząd nie tworzy własnych klas ani podklas JRWA.', fix: 'Jeśli katalog czegoś nie obejmuje, skonsultuj sprawę z Członkiem Zarządu ds. Administracji SSUEW.' },
  { n: 9, title: 'Archiwizacja dopiero przy zmianie kadencji', desc: 'Wtedy jest już za późno na spokojne uporządkowanie wszystkiego.', fix: 'Zakładaj teczki od początku sprawy lub projektu — nie po czasie.' },
  { n: 10, title: 'Archiwizacja jako zadanie jednej osoby', desc: 'Gdy jest "czyjaś sprawa", zazwyczaj nie ma niczyjej.', fix: 'Rozłóż odpowiedzialność: osoby prowadzące sprawy, audytor, nadzór Członka Zarządu ds. Administracji SSUEW.' },
];

const EXAMPLES = [
  { n: 1, title: 'Wybory do RUSS', docs: 'Ogłoszenie, lista kandydatów, protokół komisji, wyniki, uchwała.', klasa: 'RUSS.0052', teczka: 'RUSS.0052 – Wybory Rady Uczelnianej Samorządu Studentów – 2025' },
  { n: 2, title: 'Przekazanie obowiązków Członka Zarządu', docs: 'Protokół zdawczo-odbiorczy, wykaz spraw, lista przekazanych materiałów.', klasa: 'RUSS.0122', teczka: 'RUSS.0122 – Przejmowanie stanowisk i funkcji – przekazanie obowiązków Członka Zarządu ds. Administracji – 2025' },
  { n: 3, title: 'Wigilia Samorządu Studentów UEW', docs: 'Program, grafika promocyjna, lista organizatorów, dokumentacja zdjęciowa, raport końcowy.', klasa: 'RUSS.0631', teczka: 'RUSS.0631 – Imprezy uczelniane – Wigilia Samorządu Studentów UEW – 2025' },
  { n: 4, title: 'Szkolenie z wystąpień publicznych', docs: 'Agenda, dane prowadzącego, lista uczestników, ankiety ewaluacyjne, sprawozdanie, wykaz certyfikatów.', klasa: 'RUSS.581', teczka: 'RUSS.581 – Szkolenia i kursy dla studentów i absolwentów – Szkolenie z wystąpień publicznych – 2025' },
  { n: 5, title: 'Materiały promocyjne kadencji', docs: 'Finalne plakaty, gotowe grafiki, zestaw kampanii opublikowanych w imieniu Samorządu.', klasa: 'RUSS.0615', teczka: 'RUSS.0615 – Materiały promocyjne i reklamowe – materiały promocyjne Samorządu – 2025' },
];

const MATRIX_DATA = [
  { typ: 'Uchwały RUSS', klasa: 'RUSS.570', group: 'centralna' },
  { typ: 'Protokoły posiedzeń RUSS', klasa: 'RUSS.570', group: 'centralna' },
  { typ: 'Dokumentacja komisji niewyborczych', klasa: 'RUSS.570', group: 'centralna' },
  { typ: 'Statut i regulaminy', klasa: 'RUSS.570', group: 'centralna' },
  { typ: 'Sprawozdania roczne i kadencyjne', klasa: 'RUSS.570', group: 'centralna' },
  { typ: 'Wybory do RUSS', klasa: 'RUSS.0052', group: 'wybory' },
  { typ: 'Dokumentacja komisji wyborczej', klasa: 'RUSS.0052', group: 'wybory' },
  { typ: 'Przekazanie obowiązków / stanowisk', klasa: 'RUSS.0122', group: 'wybory' },
  { typ: 'Protokoły zdawczo-odbiorcze funkcji', klasa: 'RUSS.0122', group: 'wybory' },
  { typ: 'Raporty z social mediów', klasa: 'RUSS.0613', group: 'promocja' },
  { typ: 'System identyfikacji wizualnej', klasa: 'RUSS.0614', group: 'promocja' },
  { typ: 'Finalne plakaty i grafiki', klasa: 'RUSS.0615', group: 'promocja' },
  { typ: 'Kronika kadencji / album', klasa: 'RUSS.062', group: 'promocja' },
  { typ: 'Wydarzenie własne Samorządu', klasa: 'RUSS.0631', group: 'wydarzenia' },
  { typ: 'Udział w wydarzeniu zewnętrznym', klasa: 'RUSS.0634', group: 'wydarzenia' },
  { typ: 'Patronat', klasa: 'RUSS.0640', group: 'wydarzenia' },
  { typ: 'Szkolenie dla studentów', klasa: 'RUSS.581', group: 'szkolenia' },
  { typ: 'Czynny udział w konferencji obcej', klasa: 'RUSS.461', group: 'szkolenia' },
  { typ: 'Własna konferencja / sympozjum', klasa: 'RUSS.460', group: 'szkolenia' },
];
const MATRIX_GROUPS = [
  { id: 'all', label: 'Wszystkie' }, { id: 'centralna', label: 'Działalność centralna' },
  { id: 'wybory', label: 'Wybory i przekazanie' }, { id: 'promocja', label: 'Promocja i kronika' },
  { id: 'wydarzenia', label: 'Wydarzenia' }, { id: 'szkolenia', label: 'Szkolenia' },
];

const CL_BIEZACO = [
  { id: 'cb1', text: 'Zakładaj teczki przy rozpoczęciu spraw lub projektów' },
  { id: 'cb2', text: 'Odkładaj dokumenty do właściwych klas na bieżąco' },
  { id: 'cb3', text: 'Pilnuj wersji finalnych — oddzielaj od roboczych' },
  { id: 'cb4', text: 'Dbaj o porządek nazewnictwa plików cyfrowych' },
];
const CL_KONIEC = [
  { id: 'ck1', text: 'Sprawdź jakie klasy JRWA wystąpiły w działalności Samorządu w tym roku' },
  { id: 'ck2', text: 'Zamknij teczki roczne i projektowe' },
  { id: 'ck3', text: 'Uzupełnij opisy teczek (znak akt, tytuł, daty skrajne, kategoria)' },
  { id: 'ck4', text: 'Rozdziel dokumentację według kategorii archiwalnych (A od B)' },
  { id: 'ck5', text: 'Usuń zbędne duplikaty i materiały czysto robocze' },
  { id: 'ck6', text: 'Przygotuj spisy zdawczo-odbiorcze (osobno dla A i B)' },
  { id: 'ck7', text: 'Przeprowadź wewnętrzny audyt przed oddaniem' },
  { id: 'ck8', text: 'Ustal kontakt z Archiwum UEW i uzgodnij termin przekazania' },
];
const CL_PRZEKAZANIE = [
  { id: 'cp1', text: 'Przygotuj protokół zdawczo-odbiorczy obowiązków' },
  { id: 'cp2', text: 'Wskaż, które teczki są zamknięte, a które nadal w toku' },
  { id: 'cp3', text: 'Przekaż wiedzę o brakach, zaległościach i dokumentacji wrażliwej' },
  { id: 'cp4', text: 'Nie zostawiaj nowej osobie „archiwum w głowie" — tylko realny porządek' },
];
const CL_ODDANIE = [
  { id: 'po1', text: 'Klasa JRWA jest właściwa i pochodzi z katalogu zamkniętego' },
  { id: 'po2', text: 'Kategoria archiwalna jest poprawna' },
  { id: 'po3', text: 'Tytuł teczki jest zgodny z katalogiem i zawartością' },
  { id: 'po4', text: 'W środku są tylko dokumenty właściwe dla tej klasy' },
  { id: 'po5', text: 'Usunięto spinacze, zszywki i koszulki plastikowe' },
  { id: 'po6', text: 'Daty skrajne są prawidłowe' },
  { id: 'po7', text: 'Teczka nie jest zbyt gruba (max ok. 5 cm)' },
  { id: 'po8', text: 'Opis teczki zgadza się ze spisem zdawczo-odbiorczym' },
  { id: 'po9', text: 'Dokumentacja finalna jest oddzielona od roboczej' },
  { id: 'po10', text: 'Teczka jest gotowa do wpisania na spis zdawczo-odbiorczy' },
];

export default function ArchiwizacjaPage() {
  const [activeSection, setActiveSection] = useState('wstep');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [openJrwa, setOpenJrwa] = useState(null);
  const [openExample, setOpenExample] = useState(null);
  const [matrixFilter, setMatrixFilter] = useState('all');
  const [copied, setCopied] = useState(null);
  const [checks, setChecks] = useState(() => {
    try { const s = sessionStorage.getItem('archiwizacja_v1'); return s ? JSON.parse(s) : { biezaco: [], koniec: [], przekazanie: [], oddanie: [] }; }
    catch { return { biezaco: [], koniec: [], przekazanie: [], oddanie: [] }; }
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    ALL_SECTION_IDS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(dh > 0 ? Math.round((top / dh) * 100) : 0);
      setShowScrollTop(top > 200);
      if (dh > 0 && top >= dh - 150) setActiveSection('aneksy');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const toggleCheck = (group, id) => {
    const next = { ...checks, [group]: checks[group].includes(id) ? checks[group].filter(x => x !== id) : [...checks[group], id] };
    setChecks(next);
    sessionStorage.setItem('archiwizacja_v1', JSON.stringify(next));
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  };

  const isKlasActive = CHILD_IDS.includes(activeSection) || activeSection === 'klasyfikacja';
  const isActive = id => activeSection === id || (id === 'klasyfikacja' && isKlasActive);

  const allOpts = NAV_ITEMS.flatMap(item =>
    item.children ? [{ id: item.id, label: item.label }, ...item.children.map(c => ({ id: c.id, label: '  ' + c.label }))]
      : [{ id: item.id, label: item.label }]
  );

  // ---- sub-komponenty ----
  const SectionTitle = ({ icon: Icon, chapter, title, color = 'amber' }) => {
    const palette = {
      amber: ['bg-amber-100', 'text-amber-600', 'text-amber-500'],
      orange: ['bg-orange-100', 'text-orange-600', 'text-orange-500'],
      blue: ['bg-blue-100', 'text-blue-600', 'text-blue-500'],
      teal: ['bg-teal-100', 'text-teal-600', 'text-teal-500'],
      red: ['bg-red-100', 'text-red-600', 'text-red-500'],
      green: ['bg-green-100', 'text-green-600', 'text-green-500'],
      purple: ['bg-purple-100', 'text-purple-600', 'text-purple-500'],
      slate: ['bg-slate-100', 'text-slate-600', 'text-slate-500'],
    };
    const [bg, ic, lbl] = palette[color] || palette.amber;
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

  const Checklist = ({ group, items }) => (
    <div className="space-y-2">
      {items.map(item => {
        const checked = checks[group]?.includes(item.id);
        return (
          <button key={item.id} onClick={() => toggleCheck(group, item.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${checked ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'}`}>
            {checked ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
            <span className={`text-sm font-medium leading-snug ${checked ? 'line-through opacity-60' : ''}`}>{item.text}</span>
          </button>
        );
      })}
    </div>
  );

  const Accordion = ({ id, title, content }) => {
    const open = openAccordion === id;
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={e => { setOpenAccordion(open ? null : id); e.currentTarget.blur(); }}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left">
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100"><p className="text-sm text-slate-600 leading-relaxed pt-3">{nb(content)}</p></div>}
      </div>
    );
  };

  const JRWACard = ({ sym, title, items, note }) => {
    const open = openJrwa === sym;
    return (
      <div className="border border-amber-200 rounded-xl overflow-hidden">
        <button onClick={e => { setOpenJrwa(open ? null : sym); e.currentTarget.blur(); }}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 transition-colors text-left">
          <span className="font-black text-amber-700 text-xs font-mono bg-white border border-amber-200 px-2 py-1 rounded-lg shrink-0">{sym}</span>
          <span className="font-semibold text-slate-800 text-sm leading-snug flex-1">{title}</span>
          <ChevronRight className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && (
          <div className="px-5 pb-5 pt-3 bg-white border-t border-amber-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Co wkładamy do tej teczki:</p>
            <ul className="space-y-1 mb-3">
              {items.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{it}</li>)}
            </ul>
            {note && <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800 mb-3">{note}</div>}
            <button onClick={() => copy(sym, sym)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all border border-amber-200">
              {copied === sym ? <><Check className="w-3 h-3" />Skopiowano!</> : <><Copy className="w-3 h-3" />Kopiuj symbol</>}
            </button>
          </div>
        )}
      </div>
    );
  };

  const ExampleCard = ({ ex }) => {
    const open = openExample === ex.n;
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={e => { setOpenExample(open ? null : ex.n); e.currentTarget.blur(); }}
          className="w-full flex items-center gap-3 p-4 bg-white hover:bg-slate-50 transition-colors text-left">
          <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-black text-xs shrink-0">{ex.n}</span>
          <span className="font-semibold text-slate-800 text-sm flex-1">{ex.title}</span>
          <span className="font-mono text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">{ex.klasa}</span>
        </button>
        {open && (
          <div className="px-5 pb-5 pt-3 bg-slate-50 border-t border-slate-100 space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Dokumentacja</p>
              <p className="text-sm text-slate-700">{ex.docs}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Proponowany tytuł teczki</p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-amber-800 font-mono leading-relaxed">{ex.teczka}</code>
                <button onClick={() => copy(ex.teczka, `ex${ex.n}`)}
                  className="shrink-0 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2 rounded-lg transition-all">
                  {copied === `ex${ex.n}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filtered = matrixFilter === 'all' ? MATRIX_DATA : MATRIX_DATA.filter(r => r.group === matrixFilter);

  // ---- render ----
  return (
    <div className="min-h-screen bg-slate-50">

      {/* PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-100">
        <div className="h-0.5 bg-amber-500 transition-all duration-75" style={{ width: `${readingProgress}%` }} />
      </div>

      {/* MOBILE SELECT */}
      <div className="lg:hidden sticky top-[49px] z-30 bg-white border-b border-slate-200 px-4 py-2.5">
        <select value={activeSection} onChange={e => scrollTo(e.target.value)}
          className="w-full text-sm font-semibold text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400">
          {allOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex max-w-screen-2xl mx-auto">

        {/* SIDEBAR */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto border-r border-slate-200 bg-white pt-6 pb-32">
          <div className="px-4 mb-4 flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Przewodnik archiwizacji</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.id);
              if (item.children) return (
                <div key={item.id}>
                  <button onClick={() => scrollTo(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                    <span>{item.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isKlasActive ? 'rotate-90' : ''}`} />
                  </button>
                  {isKlasActive && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-amber-200 pl-3">
                      {item.children.map(c => (
                        <button key={c.id} onClick={() => scrollTo(c.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSection === c.id ? 'bg-amber-100 text-amber-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
              return (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* TREŚĆ */}
        <main className="flex-1 min-w-0 p-6 lg:p-10 pb-24 [&_p]:text-justify [&_p]:hyphens-auto [&_p]:text-pretty">

          {/* WSTĘP */}
          <section id="wstep" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Archive} chapter="Rozdział 1" title="Po co Samorządowi archiwizacja?" color="amber" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mb-6">
              <p className="text-slate-700 leading-relaxed">{nb('Archiwizacja nie jest dodatkiem do działalności Samorządu, tylko jej częścią. Każda kadencja zostawia po sobie dokumenty, które potwierdzają decyzje, pokazują przebieg działań, porządkują odpowiedzialność i pozwalają kolejnej kadencji nie zaczynać wszystkiego od zera - w oczach Uczelni.')}</p>
              <p className="text-slate-700 leading-relaxed">{nb('Najprościej mówiąc: dobrze ułożone archiwum sprawia, że Samorząd działa jak instytucja, a nie jak grupa studentów, która co rok wymyśla własne zasady od nowa.')}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ['text-green-600 bg-green-50 border-green-200', CheckCircle, 'Dowodowa', 'Pokazuje, co zostało ustalone, przyjęte, rozliczone lub przekazane.'],
                ['text-blue-600 bg-blue-50 border-blue-200', Folder, 'Organizacyjna', 'Pozwala odnaleźć potrzebne informacje bez odtwarzania historii z pamięci.'],
                ['text-purple-600 bg-purple-50 border-purple-200', BookOpen, 'Historyczna', 'Zachowuje pamięć instytucjonalną Samorządu między kadencjami.'],
                ['text-orange-600 bg-orange-50 border-orange-200', AlertTriangle, 'Ochronna', 'Zabezpiecza Samorząd i osoby funkcyjne w razie sporów lub kontroli.'],
                ['text-teal-600 bg-teal-50 border-teal-200', Users, 'Wdrożeniowa', 'Ułatwia przekazanie obowiązków nowej kadencji bez utraty wiedzy instytucjonalnej.'],
              ].map(([col, Icon, t, d]) => (
                <div key={t} className={`flex items-start gap-3 p-4 rounded-2xl border ${col.split(' ').slice(1).join(' ')}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${col.split(' ')[0]}`} />
                  <div>
                    <p className="font-black text-slate-800 text-sm mb-1">Funkcja {t.toLowerCase()}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EZD */}
          <section id="ezd" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Rozdział 2" title="EZD i model SSUEW" color="blue" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mb-4">
              <p className="text-slate-700 leading-relaxed">{nb('Na dużej uczelni obieg dokumentów jest uporządkowany przy pomocy EZD — Elektronicznego Zarządzania Dokumentacją. To system, w którym rejestruje się sprawy, prowadzi obieg dokumentów i dokumentuje przebieg ich załatwiania. Dla pracowników Uczelni to codzienne środowisko pracy (naszym bardzo uproszczonym odpowiednikiem jest CRED).')}</p>
              <p className="text-slate-700 leading-relaxed">{nb('Samorząd Studentów funkcjonuje jednak w modelu odmiennym. Podstawą archiwizacji SSUEW jest dokumentacja papierowa, prowadzona w teczkach aktowych zgodnie z właściwymi klasami JRWA UEW oraz z wewnętrznym katalogiem zamkniętym stosowanym przez Samorząd.')}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900 font-medium">{nb('Samorząd nie musi prowadzić archiwizacji w EZD, ale musi rozumieć uczelniane zasady kancelaryjno-archiwalne — bo ostatecznie działa w tym samym porządku instytucjonalnym co Uczelnia.')}</p>
            </div>
          </section>

          {/* TRZY FUNDAMENTY */}
          <section id="fundamenty" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookOpen} chapter="Rozdział 3" title="Trzy fundamenty archiwizacji SSUEW" color="purple" />
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { n: '3.1', title: 'Instrukcja kancelaryjna UEW', desc: nb('Podstawowy dokument określający zasady obiegu dokumentów i prowadzenia spraw na Uczelni. Wyjaśnia, jak rozumieć znak akt, teczkę, spis spraw, daty skrajne i spis zdawczo-odbiorczy. Dla Samorządu jest punktem odniesienia przy opisywaniu dokumentacji.') },
                { n: '3.2', title: 'JRWA UEW', desc: nb('Jednolity Rzeczowy Wykaz Akt — uczelniany wykaz klas spraw i dokumentacji. Odpowiada na pytanie: jakiego rodzaju jest ta dokumentacja i jak długo trzeba ją przechowywać.') },
                { n: '3.3', title: 'Katalog zamknięty SSUEW', desc: nb('Najważniejsze praktyczne narzędzie dla Samorządu. Wyciąga z JRWA tylko te klasy, które realnie dotyczą działalności SSUEW — uzgodniony z Archiwum UEW. Samorząd nie improwizuje własnych symboli.') },
              ].map(f => (
                <div key={f.n} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">{f.n}</p>
                  <h3 className="font-black text-slate-800 text-sm mb-3">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ZASADY */}
          <section id="zasady" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Tag} chapter="Rozdział 4" title="Zasady ogólne SSUEW" color="orange" />
            <p className="text-slate-600 text-sm mb-4">{nb('Jeśli osoby funkcyjne Samorządu będą pamiętać tylko te reguły, unikną większości błędów archiwizacyjnych.')}</p>
            <div className="space-y-2">
              {[
                'SSUEW stosuje JRWA UEW w brzmieniu obowiązującym.',
                'Samorząd nie tworzy własnych klas ani podklas.',
                'Znak akt przyjmuje postać: RUSS.[pełny symbol klasy końcowej JRWA UEW].',
                'Nie zakłada się teczek na poziomie haseł nadrzędnych (np. „00" czy „06").',
                'Jedna teczka = jedna klasa końcowa i jedna kategoria archiwalna.',
                'Teczka może być prowadzona rocznie albo projektowo — zależnie od charakteru dokumentacji.',
                'Dokumentacja elektroniczna może podlegać selektywnemu wydrukowi.',
                'Dokumentacja robocza i techniczna nie podlega archiwizacji.',
                'Dokumentacja finansowa i wrażliwa może być prowadzona jako archiwum wewnętrzne SSUEW, poza zakresem przekazania do Archiwum UEW.',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SŁOWNIK */}
          <section id="slownik" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookOpen} chapter="Rozdział 5" title="Słownik pojęć po ludzku" color="teal" />
            <p className="text-slate-600 text-sm mb-4">Kliknij pojęcie, żeby zobaczyć definicję.</p>
            <div className="space-y-2">
              {GLOSSARY.map(g => <Accordion key={g.term} id={`gl-${g.term}`} title={g.term} content={g.def} />)}
            </div>
          </section>

          {/* KATEGORIE */}
          <section id="kategorie" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Tag} chapter="Rozdział 6" title="Kategorie archiwalne" color="amber" />
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {CATEGORIES.map(cat => {
                const cl = { red: 'bg-red-50 border-red-200 text-red-800', blue: 'bg-blue-50 border-blue-200 text-blue-800', teal: 'bg-teal-50 border-teal-200 text-teal-800', orange: 'bg-orange-50 border-orange-200 text-orange-800', amber: 'bg-amber-50 border-amber-200 text-amber-800', slate: 'bg-slate-50 border-slate-200 text-slate-600' }[cat.color];
                return (
                  <div key={cat.sym} className={`rounded-2xl border p-4 ${cl}`}>
                    <span className="font-black text-2xl font-mono">{cat.sym}</span>
                    <p className="font-bold text-sm mt-1 mb-2">{cat.name}</p>
                    <p className="text-xs leading-relaxed opacity-80">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800"><strong>Praktyczna zapamiętanka:</strong> <strong>A</strong> — historia i rdzeń instytucji &nbsp;·&nbsp; <strong>B50</strong> — bardzo ważne, ale nie wieczyste &nbsp;·&nbsp; <strong>BE</strong> — po czasie wymaga dodatkowej oceny &nbsp;·&nbsp; <strong>Bc</strong> — nie trafia do trwałego archiwum.</p>
            </div>
          </section>

          {/* CO ARCHIWIZOWAĆ */}
          <section id="co-archiwizowac" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Folder} chapter="Rozdział 7–8" title="Co (nie) archiwizować?" color="green" />
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5 text-green-600" /><h3 className="font-black text-green-800 text-sm uppercase tracking-wide">Archiwizujemy</h3></div>
                <ul className="space-y-1.5 text-sm text-green-800">
                  {['Dokumenty potwierdzające decyzje i uchwały', 'Dokumentację składów organów i przebiegu prac', 'Dokumentację wyborów', 'Protokoły zdawczo-odbiorcze przy przekazaniu funkcji', 'Sprawozdania roczne i kadencyjne', 'Regulaminy i statut', 'Plany działań', 'Dokumentację wydarzeń, szkoleń, patronatów', 'Roczne raporty z mediów społecznościowych', 'Finalne materiały promocyjne', 'Kroniki i albumy kadencji'].map((it, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5 shrink-0">•</span><span>{it}</span></li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-600" /><h3 className="font-black text-red-800 text-sm uppercase tracking-wide">Nie archiwizujemy</h3></div>
                <ul className="space-y-1.5 text-sm text-red-800">
                  {['Roboczych wersji plakatów i grafik', 'Szkiców, notatek pomocniczych i brudnopisów', 'Powielonych kopii bez wartości dowodowej', 'Technicznych plików produkcyjnych bez znaczenia archiwalnego', 'Luźnych ustaleń logistycznych bez wpływu na wynik', 'Dokumentacji nieprzypisanej do katalogu zamkniętego', 'Materiałów o wyłącznie chwilowym znaczeniu organizacyjnym'].map((it, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-red-400 mt-0.5 shrink-0">•</span><span>{it}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-900 font-bold">{nb('Archiwizujemy efekt, przebieg i decyzję — nie cały bałagan roboczy wokół nich!')}</p>
            </div>
          </section>

          {/* KLASYFIKACJA JRWA — nagłówek */}
          <section id="klasyfikacja" className="scroll-mt-20 mb-4">
            <SectionTitle icon={Tag} chapter="Rozdział 9" title="Klasyfikacja JRWA — katalog zamknięty SSUEW" color="amber" />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-900">{nb('Kliknij klasę, żeby zobaczyć co wkładamy do teczki i skopiować symbol. Samorząd stosuje wyłącznie klasy z poniższego katalogu. Nowe klasy wymagają uzgodnienia z Archiwum UEW.')}</p>
            </div>
          </section>

          {JRWA_GROUPS.map(grp => (
            <section key={grp.id} id={grp.id} className="scroll-mt-20 mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{grp.title}</h3>
              <div className="space-y-2">{grp.classes.map(cls => <JRWACard key={cls.sym} {...cls} />)}</div>
            </section>
          ))}

          {/* DECYZJA */}
          <section id="decyzja" className="scroll-mt-20 mb-16">
            <SectionTitle icon={CheckCircle} chapter="Rozdział 10" title="Jak podjąć decyzję klasyfikacyjną?" color="blue" />
            <p className="text-slate-600 text-sm mb-4">{nb('Kiedy masz dokument i nie wiesz, gdzie go przypisać — zadaj kolejno pięć pytań:')}</p>
            <div className="space-y-3">
              {[
                { q: 'Czy to dokument finalny, czy tylko roboczy?', h: 'Wersje robocze nie trafiają do teczek archiwalnych.' },
                { q: 'Czego dotyczy ta dokumentacja?', h: 'Działalności ustrojowej, wydarzenia, promocji, wyborów, szkolenia, patronatu czy przekazania funkcji?' },
                { q: 'Czy katalog zamknięty ma klasę dla tej sprawy?', h: 'Nie twórz własnych klas. Jeśli brak — konsultuj z Członkiem Zarządu ds. Administracji SSUEW.' },
                { q: 'Czy teczka powinna być roczna czy projektowa?', h: 'Roczna: dla dokumentacji powtarzalnej. Projektowa: dla działań z wyraźnym początkiem i końcem.' },
                { q: 'Czy te materiały nie należą do innej teczki?', h: 'Sprawdź, czy nie duplikujesz dokumentacji w kilku miejscach jednocześnie.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-black text-sm flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{s.q}</p>
                    <p className="text-xs text-slate-500">{s.h}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-700">{nb('Jeżeli po tych pytaniach dalej nie ma pewności — nie twórz własnej intuicyjnej klasy. Oznacz problem do konsultacji z Archiwum UEW.')}</p>
            </div>
          </section>

          {/* TECZKA */}
          <section id="teczki" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Folder} chapter="Rozdział 11–12" title="Teczka aktowa: zakładanie i opis" color="amber" />
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3">Zasady zakładania teczek</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {['Jedna teczka = jedna klasa końcowa JRWA', 'Jedna teczka = jedna kategoria archiwalna', 'Dokumentów różnych klas nie wolno mieszać', 'Gdy dokumentów jest dużo — kolejny tom lub nowa teczka', 'Grubość jednej teczki max ok. 5 cm', 'Teczka roczna: dla dokumentacji powtarzalnej', 'Teczka projektowa: dla wydarzeń z wyraźnym początkiem i końcem'].map((it, i) => (
                    <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{it}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3">Co powinno być na okładce</h3>
                <div className="space-y-2">
                  {[['1', 'Pełna nazwa Uczelni i jednostki (najlepiej pieczątka)'], ['2', 'Znak akt — np. RUSS.570, RUSS.0631'], ['3', 'Kategoria archiwalna — np. A, B50, BE5'], ['4', 'Tytuł teczki — hasło klasyfikacyjne z doprecyzowaniem zawartości'], ['5', 'Daty skrajne — najwcześniejszy i najpóźniejszy dokument'], ['6', 'Numer tomu — jeśli dokumentacja nie mieści się w jednej teczce'], ['7', 'Sygnatura archiwalna — uzupełniana przy przekazaniu do Archiwum']].map(([n, txt]) => (
                    <div key={n} className="flex items-start gap-2 text-sm text-slate-700"><span className="font-black text-amber-600 w-4 shrink-0">{n}.</span><span>{txt}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3">Przykłady poprawnych tytułów teczek</h3>
              <div className="space-y-2">
                {['RUSS.570 – Samorząd studentów – Uchwały RUSS i protokoły posiedzeń – 2025', 'RUSS.0631 – Imprezy uczelniane – Wigilia Samorządu Studentów UEW – 2025', 'RUSS.581 – Szkolenia i kursy dla studentów i absolwentów – Szkolenie z prawa studenckiego – 2025', 'RUSS.0640 – Patronaty i komitety honorowe – Patronat nad Konferencją XYZ – 2025'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 font-mono">{ex}</code>
                    <button onClick={() => copy(ex, `tt${i}`)} className="shrink-0 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2 rounded-lg transition-all">
                      {copied === `tt${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRZYGOTOWANIE FIZYCZNE */}
          <section id="przygotowanie" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Archive} chapter="Rozdział 13" title="Przygotowanie fizyczne do archiwizacji" color="orange" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3">Co należy zrobić</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {['Usunąć zszywki, spinacze i inne elementy metalowe', 'Usunąć koszulki i elementy plastikowe', 'Ułożyć dokumenty logicznie i spójnie (wg toku sprawy)', 'Oddzielić dokumentację finalną od roboczej', 'Sprawdzić, czy wszystkie dokumenty należą do właściwej klasy', 'Sprawdzić daty skrajne', 'Ustalić, czy nie trzeba rozdzielić materiału na kilka teczek'].map((it, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />{it}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-black text-amber-800 text-sm uppercase tracking-widest mb-3">Dobra praktyka — wewnętrzny audyt</h3>
                <p className="text-sm text-amber-900 leading-relaxed">{nb('Zanim teczka zostanie uznana za gotową, niech przejrzy ją jeszcze jedna osoba, która jej nie formowała. Taki wewnętrzny audyt wyłapuje błędny symbol, niezgodny tytuł, pomieszane dokumenty, pozostawione spinacze i brakujące elementy końcowe, np. raportu lub protokołu.')}</p>
              </div>
            </div>
          </section>

          {/* DOKUMENTACJA CYFROWA */}
          <section id="cyfrowe" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Rozdział 14 + 24–25" title="Dokumentacja cyfrowa i nazewnictwo plików" color="blue" />
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
              <p className="text-slate-700 leading-relaxed mb-4">{nb('Dokumentacja elektroniczna podlega selektywnemu wydrukowi — drukujemy to, co ma znaczenie dowodowe, organizacyjne lub historyczne. Nie drukujemy całego zaplecza roboczego.')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[['Social media', 'Roczne raporty, zestawienia kampanii, kluczowe komunikaty. Nie każdy post osobno.'], ['Grafiki i plakaty', 'Wyłącznie finalne wersje opublikowanych materiałów — nie robocze warianty.'], ['Zdjęcia i filmy', 'Reprezentatywny wybór + karta opisu nośnika z informacją o miejscu przechowywania.'], ['Formularze online', 'Finalna wersja: lista uczestników, raport zbiorczy lub eksport wyników.']].map(([t, d]) => (
                  <div key={t} className="bg-slate-50 rounded-xl p-4 border border-slate-200"><p className="font-bold text-slate-800 text-sm mb-1">{t}</p><p className="text-xs text-slate-600">{d}</p></div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4">Standard nazewnictwa plików</h3>
              <div className="bg-slate-900 rounded-xl px-4 py-3 mb-4 font-mono text-sm text-slate-200">ROK_OBSZAR_TEMAT_WERSJA/STATUS</div>
              <div className="space-y-2">
                {['2025_RUSS_Wigilia_program_final', '2025_RUSS_Wybory_protokol_komisji_podpisany', '2025_RUSS_Szkolenie_prawo_studenckie_raport_koncowy', '2025_RUSS_Patronat_konferencja_XYZ_decyzja'].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono">{ex}</code>
                    <button onClick={() => copy(ex, `fn${i}`)} className="shrink-0 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg transition-all">
                      {copied === `fn${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-3 font-medium">Nie używaj nazw typu: nowy_final2_ostateczny_poprawiony</p>
            </div>
          </section>

          {/* SPISY */}
          <section id="spisy" className="scroll-mt-20 mb-16">
            <SectionTitle icon={FileText} chapter="Rozdział 15–17" title="Spisy i przekazanie do Archiwum UEW" color="teal" />
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-teal-700 text-sm uppercase tracking-widest mb-2">Spis spraw</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{nb('Służy do ewidencji spraw prowadzonych w obrębie danej klasy i danego roku. Opisuje, jakie sprawy prowadziłeś.')}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-amber-700 text-sm uppercase tracking-widest mb-2">Spis zdawczo-odbiorczy</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{nb('Formalny dowód przekazania dokumentacji do Archiwum. Opisuje, jakie teczki oddajesz. Sporządza się go osobno dla kategorii A (4 egz.) i B (3 egz.). Wypełnia się na podstawie gotowych, opisanych teczek.')}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4">Zalecany przebieg przekazania dokumentacji</h3>
              <div className="space-y-2">
                {['Uporządkuj dokumentację według właściwych klas JRWA', 'Rozdziel akta kategorii A od akt kategorii B', 'Przygotuj i opisz teczki', 'Sporządź odpowiednie spisy zdawczo-odbiorcze (osobno A i B)', 'Zrób wewnętrzny przegląd przed oddaniem', 'W razie potrzeby skonsultuj wstępny spis z Członkiem Zarządu ds. Administracji SSUEW', 'Przekaż dokumentację zgodnie z ustalonym trybem', 'Zachowaj egzemplarz spisu z potwierdzeniem przyjęcia'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full font-black text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">{nb('Kiedy masz wątpliwości — zapytaj Członka Zarządu ds. Administracji SSUEW wcześniej, niż poprawiać wszystko po zwrocie.')}</p>
            </div>
          </section>

          {/* BŁĘDY */}
          <section id="bledy" className="scroll-mt-20 mb-16">
            <SectionTitle icon={AlertTriangle} chapter="Rozdział 19" title="Najczęstsze błędy przy archiwizacji SSUEW" color="red" />
            <div className="grid md:grid-cols-2 gap-3">
              {ERRORS.map(err => (
                <div key={err.n} className="bg-white border border-red-100 rounded-2xl shadow-sm p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="w-7 h-7 bg-red-100 text-red-700 rounded-full font-black text-xs flex items-center justify-center shrink-0">{err.n}</span>
                    <p className="font-bold text-slate-800 text-sm leading-snug">{err.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 pl-10">{err.desc}</p>
                  <div className="flex items-start gap-2 pl-10">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700 font-medium">{err.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PRZYKŁADY */}
          <section id="przyklady" className="scroll-mt-20 mb-16">
            <SectionTitle icon={CheckCircle} chapter="Rozdział 21" title="Przykłady praktyczne" color="green" />
            <p className="text-sm text-slate-600 mb-4">{nb('Kliknij przykład, żeby zobaczyć szczegóły i skopiować gotowy tytuł teczki.')}</p>
            <div className="space-y-2">{EXAMPLES.map(ex => <ExampleCard key={ex.n} ex={ex} />)}</div>
          </section>

          {/* CHECKLISTY */}
          <section id="checklista" className="scroll-mt-20 mb-16">
            <SectionTitle icon={CheckSquare} chapter="Rozdział 22 + Aneks 30" title="Checklisty operacyjne" color="amber" />
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Na bieżąco w ciągu roku</h3>
                <Checklist group="biezaco" items={CL_BIEZACO} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Archive className="w-4 h-4 text-orange-500" />Pod koniec roku / przed zmianą kadencji</h3>
                <Checklist group="koniec" items={CL_KONIEC} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" />Przy przekazaniu funkcji</h3>
                <Checklist group="przekazanie" items={CL_PRZEKAZANIE} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Przed oddaniem teczki do Archiwum UEW</h3>
                <Checklist group="oddanie" items={CL_ODDANIE} />
              </div>
            </div>
          </section>

          {/* DOKUMENTY ŹRÓDŁOWE */}
          <section id="dokumenty" className="scroll-mt-20 mb-16">
            <SectionTitle icon={BookOpen} chapter="Dokumenty źródłowe" title="Kluczowe dokumenty źródłowe" color="teal" />

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-teal-900">{nb('Poniżej znajdziesz dokumenty, na których opiera się cały przewodnik. Zanim podejmiesz decyzję klasyfikacyjną lub przekażesz dokumentację do Archiwum UEW — upewnij się, że korzystasz z aktualnych wersji tych roboczych i zatwierdzonych dokumentów.')}</p>
            </div>
            <div className="space-y-8">
              {DOCS_SOURCE.map(group => {
                const groupColors = {
                  amber: { border: 'border-amber-200', head: 'bg-amber-50', headText: 'text-amber-700', dot: 'bg-amber-400' },
                  slate: { border: 'border-slate-200', head: 'bg-slate-50', headText: 'text-slate-600', dot: 'bg-slate-400' },
                  teal: { border: 'border-teal-200', head: 'bg-teal-50', headText: 'text-teal-700', dot: 'bg-teal-400' },
                }[group.color] || {};
                const badgeColors = {
                  red: 'bg-red-100 text-red-700 border-red-200',
                  amber: 'bg-amber-100 text-amber-700 border-amber-200',
                  blue: 'bg-blue-100 text-blue-700 border-blue-200',
                  slate: 'bg-slate-100 text-slate-600 border-slate-200',
                  teal: 'bg-teal-100 text-teal-700 border-teal-200',
                };
                return (
                  <div key={group.group}>
                    <div className={`flex items-center gap-2 mb-3`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${groupColors.dot}`} />
                      <h3 className={`text-xs font-black uppercase tracking-widest ${groupColors.headText}`}>{group.group}</h3>
                    </div>
                    <div className="space-y-3">
                      {group.items.map(doc => (
                        <div key={doc.title} className={`bg-white border ${groupColors.border} rounded-2xl shadow-sm p-5`}>
                          <div className="flex flex-wrap items-start gap-3 mb-2">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-bold text-slate-800 text-sm leading-snug">{doc.title}</p>
                                <span className={`text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full shrink-0 ${badgeColors[doc.badgeColor] || badgeColors.slate}`}>{doc.badge}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{nb(doc.desc)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pl-7">
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-all">
                                <ExternalLink className="w-3 h-3" />Otwórz dokument
                              </a>
                            ) : null}
                            {doc.note && (
                              <p className="text-[11px] text-slate-400 italic">{doc.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900 font-medium">{nb('Nie możesz znaleźć któregoś z dokumentów? Skontaktuj się z Członkiem Zarządu ds. Administracji SSUEW lub bezpośrednio z Archiwum UEW.')}</p>
            </div>
          </section>

          {/* ANEKSY */}
          <section id="aneksy" className="scroll-mt-20 mb-16">
            <SectionTitle icon={Archive} chapter="Aneksy 28–29" title="Aneksy i matryce klasyfikacyjne" color="amber" />

            {/* Matryca filtrowana */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Typ dokumentacji → klasa JRWA</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {MATRIX_GROUPS.map(g => (
                    <button key={g.id} onClick={() => setMatrixFilter(g.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${matrixFilter === g.id ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-amber-50'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Typ dokumentacji</th>
                      <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Klasa JRWA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(row => (
                      <tr key={row.typ} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-5 py-3 text-slate-700 font-medium">{row.typ}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => copy(row.klasa, `mx-${row.klasa}`)} className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-all">
                            {copied === `mx-${row.klasa}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}{row.klasa}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wzorcowy opis teczki */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4">Aneks 29 — miniwzór opisu teczki</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-sm text-slate-700 space-y-2">
                {[['Nazwa jednostki:', 'Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu'], ['Znak akt:', 'RUSS.0631'], ['Kategoria archiwalna:', 'A'], ['Tytuł teczki:', 'Imprezy uczelniane – Wigilia Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu'], ['Daty skrajne:', '2025'], ['Nr tomu:', '1'], ['Sygnatura archiwalna:', '(uzupełniana przy przekazaniu do Archiwum)']].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-2">
                    <span className="font-bold text-slate-500 w-48 shrink-0">{k}</span>
                    <span className="text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wnioski końcowe */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-black text-amber-900 text-sm uppercase tracking-widest mb-4">Osiem zasad na koniec</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {['Nie improwizuj klas JRWA', 'Odkładaj dokumenty od początku sprawy, nie po czasie', 'Trzymaj jedną klasę i jedną kategorię w jednej teczce', 'Archiwizuj to, co finalne i istotne', 'Opisuj teczki konsekwentnie i formalnie', 'Oddzielaj kategorię A od B', 'Rób regularny przegląd dokumentacji w ciągu roku/podczas trwania projektu', 'Nie bój się konsultować spraw z Członkiem Zarządu ds. Administracji SSUEW'].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 font-medium">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* WRÓĆ DO GÓRY */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-28 right-6 z-50 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Wróć do góry">
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
