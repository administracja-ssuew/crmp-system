import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

// ─── DANE ────────────────────────────────────────────────────────────────────

const KOMPENDIUM = [
  {
    id: 'podstawy',
    icon: '⚖️',
    title: 'Podstawy prawne przetwarzania danych',
    content: `Przetwarzanie danych osobowych jest zgodne z prawem wyłącznie wtedy, gdy spełniona jest co najmniej jedna z przesłanek art. 6 RODO. W przypadku Samorządu Studentów UEW najczęściej stosowane są:

**Art. 6 ust. 1 lit. a** – zgoda osoby, której dane dotyczą (np. zgoda na wizerunkowe materiały promocyjne)
**Art. 6 ust. 1 lit. b** – niezbędność do wykonania umowy lub podjęcia działań na żądanie osoby (np. rejestracja na wydarzenie)
**Art. 6 ust. 1 lit. c** – niezbędność do wypełnienia obowiązku prawnego ciążącego na administratorze
**Art. 6 ust. 1 lit. e** – niezbędność do wykonania zadania realizowanego w interesie publicznym lub w ramach sprawowania władzy publicznej

Dla danych szczególnych kategorii (art. 9 RODO — zdrowie, poglądy polityczne, religia itd.) wymagana jest przesłanka z art. 9 ust. 2, najczęściej wyraźna zgoda lub interes publiczny.

**Pamiętaj:** Brak wyraźnej podstawy prawnej = niedopuszczalne przetwarzanie. Przed każdym nowym procesem przetwarzania należy zidentyfikować właściwą przesłankę i odnotować ją w Rejestrze Czynności Przetwarzania.`
  },
  {
    id: 'prawa',
    icon: '🧑‍⚖️',
    title: 'Prawa osób, których dane dotyczą',
    content: `RODO przyznaje osobom fizycznym szereg praw, które administrator (SSUEW) musi szanować i umożliwiać ich realizację:

**Prawo dostępu (art. 15)** – osoba może żądać informacji o tym, jakie jej dane są przetwarzane, w jakim celu, jak długo i komu są udostępniane.

**Prawo do sprostowania (art. 16)** – osoba może żądać poprawienia błędnych lub uzupełnienia niekompletnych danych.

**Prawo do usunięcia danych («prawo do bycia zapomnianym», art. 17)** – osoba może żądać usunięcia danych, gdy nie są już potrzebne, zgoda została wycofana lub dane były przetwarzane niezgodnie z prawem.

**Prawo do ograniczenia przetwarzania (art. 18)** – osoba może żądać, by dane były przechowywane, ale nie przetwarzane (np. na czas rozpatrzenia sprzeciwu).

**Prawo do przenoszenia danych (art. 20)** – dotyczy danych przetwarzanych automatycznie na podstawie zgody lub umowy; osoba może żądać ich w ustrukturyzowanym, powszechnie używanym formacie.

**Prawo sprzeciwu (art. 21)** – osoba może wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie lub interesie publicznym.

**Termin odpowiedzi:** bez zbędnej zwłoki, nie później niż w ciągu **jednego miesiąca** od otrzymania żądania (z możliwością przedłużenia o 2 miesiące w złożonych przypadkach, po uprzednim poinformowaniu wnioskodawcy).`
  },
  {
    id: 'obowiazki',
    icon: '📋',
    title: 'Obowiązki administratora danych',
    content: `Samorząd Studentów UEW jako administrator danych osobowych jest zobowiązany do przestrzegania następujących zasad (art. 5 RODO):

**1. Zgodność z prawem, rzetelność i przejrzystość** – dane muszą być przetwarzane na podstawie jasnej przesłanki prawnej, a osoby muszą być o tym poinformowane.

**2. Ograniczenie celu** – dane zbierane w określonym celu nie mogą być przetwarzane w sposób niezgodny z tym celem.

**3. Minimalizacja danych** – zbierane są wyłącznie dane adekwatne, stosowne i ograniczone do tego, co niezbędne.

**4. Prawidłowość** – dane muszą być aktualne; nieprawidłowe dane należy niezwłocznie usunąć lub sprostować.

**5. Ograniczenie przechowywania** – dane przechowywane są przez czas nie dłuższy niż niezbędny do realizacji celu.

**6. Integralność i poufność** – dane muszą być chronione przed nieuprawnionym dostępem, utratą i zniszczeniem (środki techniczne i organizacyjne).

**7. Rozliczalność** – administrator jest w stanie wykazać przestrzeganie wszystkich powyższych zasad (dokumentacja, rejestr, polityki).

**Kluczowe obowiązki praktyczne:** prowadzenie Rejestru Czynności Przetwarzania, stosowanie klauzul informacyjnych, upoważnianie pracowników, zgłaszanie naruszeń do UODO w ciągu 72 godzin.`
  },
  {
    id: 'rejestr',
    icon: '📊',
    title: 'Rejestr Czynności Przetwarzania (RCP)',
    content: `Rejestr Czynności Przetwarzania (RCP) to obowiązkowy dokument wewnętrzny (art. 30 RODO), który administrator prowadzi w formie pisemnej lub elektronicznej.

**Co musi zawierać każdy wpis RCP?**
- Nazwa i cel czynności przetwarzania
- Kategorie osób, których dane dotyczą
- Kategorie danych osobowych
- Odbiorcy danych (podmioty, którym dane są lub będą ujawniane)
- Transfery danych do państw trzecich (poza UE/EOG) — jeśli dotyczy
- Planowane terminy usunięcia danych
- Ogólny opis technicznych i organizacyjnych środków bezpieczeństwa

**Kiedy aktualizować RCP?**
Przy każdej zmianie zakresu, celu lub podstawy przetwarzania, przy wdrożeniu nowego narzędzia cyfrowego lub zawarciu umowy powierzenia przetwarzania.

**Dostępność:** RCP musi być dostępny na żądanie organu nadzorczego (Prezesa UODO).

Przykładowe czynności przetwarzania w SSUEW: lista uczestników wydarzeń, rejestr wniosków studenckich, ewidencja wolontariuszy, baza kontaktów członków samorządu.`
  },
  {
    id: 'naruszenia',
    icon: '🚨',
    title: 'Naruszenia ochrony danych osobowych',
    content: `Naruszenie ochrony danych osobowych to każde zdarzenie prowadzące do przypadkowego lub niezgodnego z prawem zniszczenia, utracenia, zmodyfikowania, nieuprawnionego ujawnienia lub dostępu do danych (art. 4 pkt 12 RODO).

**Przykłady naruszeń:**
- Wysłanie maila z danymi osobowymi do nieuprawnionego odbiorcy
- Utrata pendrive'a z listą uczestników
- Włamanie do systemu informatycznego
- Udostępnienie hasła do konta osobom trzecim
- Zgubienie dokumentów zawierających dane

**Procedura po wykryciu naruszenia:**

1. **Natychmiastowe działanie** – ogranicz szkody (zmień hasła, odizoluj zainfekowany sprzęt)
2. **Dokumentacja** – zanotuj datę, godzinę, okoliczności, zakres naruszenia
3. **Ocena ryzyka** – czy naruszenie może skutkować ryzykiem dla praw i wolności osób?
4. **Zgłoszenie do UODO** – jeśli ryzyko jest prawdopodobne: **obowiązkowo w ciągu 72 godzin** (art. 33 RODO)
5. **Powiadomienie osób** – jeśli ryzyko jest wysokie: niezwłocznie poinformuj osoby, których dane dotyczą (art. 34 RODO)
6. **Rejestr naruszeń** – każde naruszenie odnotowuj w wewnętrznym rejestrze (art. 33 ust. 5 RODO)

**Sankcje:** Niezgłoszenie naruszenia grozi karą administracyjną do 10 mln EUR lub 2% rocznego obrotu.`
  },
  {
    id: 'powierzenie',
    icon: '🤝',
    title: 'Powierzenie przetwarzania danych',
    content: `Powierzenie przetwarzania danych (art. 28 RODO) ma miejsce, gdy administrator korzysta z usług zewnętrznego podmiotu (procesora), który przetwarza dane w jego imieniu.

**Przykłady powierzenia w działalności SSUEW:**
- Korzystanie z platformy do obsługi zapisów na wydarzenia
- Usługi przechowywania danych w chmurze (Google Drive, Dropbox)
- Dostawcy systemów komunikacji (mailing, CRM)
- Drukarnia otrzymująca listy adresatów

**Umowa powierzenia — co musi zawierać?**
- Przedmiot i czas trwania przetwarzania
- Charakter i cel przetwarzania
- Rodzaj danych i kategorie osób
- Obowiązki i prawa administratora
- Zakaz dalszego powierzania bez zgody administratora
- Obowiązek zachowania poufności przez personel procesora
- Prawa do audytu administratora
- Zobowiązanie do usunięcia lub zwrotu danych po zakończeniu usług

**Ważne:** Bez umowy powierzenia korzystanie z zewnętrznych narzędzi do przetwarzania danych osobowych jest niezgodne z RODO. Przed podpisaniem umowy z dostawcą należy sprawdzić, czy oferuje on standardową umowę DPA (Data Processing Agreement).`
  },
  {
    id: 'zgody',
    icon: '✅',
    title: 'Zgody na przetwarzanie danych',
    content: `Zgoda na przetwarzanie danych osobowych (art. 7 i motyw 32 RODO) musi spełniać ścisłe wymagania, by być prawnie skuteczna.

**Wymogi ważnej zgody RODO:**
1. **Dobrowolna** – nie może być warunkiem dostępu do usługi, jeśli przetwarzanie nie jest niezbędne do jej świadczenia
2. **Konkretna** – dla każdego celu odrębna zgoda; nie wolno łączyć kilku celów w jednej klauzuli
3. **Świadoma** – przed wyrażeniem zgody osoba musi otrzymać jasne informacje (kto przetwarza, w jakim celu, jak długo)
4. **Jednoznaczna** – wyraźne działanie potwierdzające (kliknięcie, podpis); domniemana zgoda = brak zgody

**Zgoda na wizerunek** – szczególny przypadek: każdorazowo przed zrobieniem zdjęcia/nagrania należy poinformować uczestników i uzyskać zgodę; formularz zgody powinien wskazywać, gdzie materiały będą publikowane.

**Wycofanie zgody:** Osoba może wycofać zgodę w dowolnym momencie, bez podania przyczyny, z efektem na przyszłość (przetwarzanie przed wycofaniem pozostaje zgodne z prawem). Procedura wycofania musi być równie prosta jak udzielenie zgody.

**Przechowywanie dowodów:** Zgody należy archiwować przez cały okres przetwarzania + czas na ewentualne roszczenia.`
  },
  {
    id: 'retencja',
    icon: '🗑️',
    title: 'Retencja i usuwanie danych',
    content: `Zasada ograniczenia przechowywania (art. 5 ust. 1 lit. e RODO) nakazuje, by dane były przechowywane przez okres nie dłuższy niż niezbędny dla celów, w których są przetwarzane.

**Okresy retencji typowe dla SSUEW:**

| Kategoria danych | Podstawa | Okres przechowywania |
|---|---|---|
| Listy uczestników wydarzeń | Zgoda | Do końca roku akademickiego + 1 rok |
| Wnioski studenckie | Obowiązek prawny | 5 lat (Archiwum B5) |
| Umowy i porozumienia | Obowiązek prawny | 10 lat (Archiwum B10) |
| Zdjęcia z wydarzeń | Zgoda | Do wycofania zgody |
| Baza kontaktów do mailingu | Zgoda | Do wycofania zgody |
| Protokoły posiedzeń | Archiwum | Kat. A – wieczyste |

**Jak prawidłowo usuwać dane?**
- Dokumenty papierowe: niszczarka (co najmniej 4-cio krzyżowe cięcie, poziom P-4 lub wyższy)
- Pliki elektroniczne: trwałe usunięcie z dysku + opróżnienie kosza + usunięcie z kopii zapasowych
- Nośniki fizyczne (pendrive, dysk): fizyczne zniszczenie lub certyfikowane zerowanie danych

**Dobra praktyka:** raz w roku (np. na początku kadencji) przeprowadź przegląd wszystkich zbiorów danych i usuń te, których termin retencji minął. Odnotuj ten fakt w rejestrze.`
  }
];

const DOKUMENTY = [
  {
    id: 'polityka',
    icon: '📄',
    title: 'Polityka Ochrony Danych Osobowych',
    subtitle: 'Główny dokument RODO — prawa, obowiązki, zasady',
    badge: 'Wewnętrzny',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'instrukcja',
    icon: '📘',
    title: 'Instrukcja Zarządzania Systemem Informatycznym',
    subtitle: 'Hasła, dostępy, incydenty, kopia zapasowa',
    badge: 'Procedura',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'rcp',
    icon: '📊',
    title: 'Rejestr Czynności Przetwarzania',
    subtitle: 'Tabela wszystkich procesów przetwarzania danych w SSUEW',
    badge: 'Rejestr',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'klauzule',
    icon: '📝',
    title: 'Klauzule Informacyjne',
    subtitle: 'Standardowe klauzule RODO do formularzy i dokumentów',
    badge: 'Wzory',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

const RCP_DANE = [
  { lp: '1', nazwa: 'Ewidencja członków Samorządu', cel: 'Zarządzanie członkostwem', kategoria: 'Imię, nazwisko, email, nr indeksu, funkcja', podstawa: 'art. 6 ust. 1 lit. e', retencja: 'Czas kadencji + 5 lat' },
  { lp: '2', nazwa: 'Lista uczestników wydarzeń', cel: 'Organizacja wydarzeń, bezpieczeństwo', kategoria: 'Imię, nazwisko, email, nr indeksu', podstawa: 'art. 6 ust. 1 lit. a (zgoda)', retencja: 'Do końca roku akademickiego + 1 rok' },
  { lp: '3', nazwa: 'Wnioski studenckie (CRED)', cel: 'Obsługa wniosków administracyjnych', kategoria: 'Imię, nazwisko, email, nr indeksu, treść wniosku', podstawa: 'art. 6 ust. 1 lit. e', retencja: '5 lat (kat. B5)' },
  { lp: '4', nazwa: 'Protokoły posiedzeń', cel: 'Dokumentacja organów samorządu', kategoria: 'Imię, nazwisko, stanowisko, opinia', podstawa: 'art. 6 ust. 1 lit. e', retencja: 'Wieczyste (kat. A)' },
  { lp: '5', nazwa: 'Rezerwacje sprzętu', cel: 'Zarządzanie wypożyczalnią', kategoria: 'Imię, nazwisko, email, kontakt', podstawa: 'art. 6 ust. 1 lit. b', retencja: '1 rok od zwrotu' },
  { lp: '6', nazwa: 'Lista dostępowa do pomieszczeń', cel: 'Bezpieczeństwo, kontrola dostępu', kategoria: 'Imię, nazwisko, nr indeksu, email @samorzad', podstawa: 'art. 6 ust. 1 lit. c i e', retencja: 'Dany miesiąc + 1 rok' },
  { lp: '7', nazwa: 'Mailing informacyjny', cel: 'Komunikacja z członkami i sympatykami', kategoria: 'Email, imię', podstawa: 'art. 6 ust. 1 lit. a (zgoda)', retencja: 'Do wycofania zgody' },
  { lp: '8', nazwa: 'Materiały fotograficzne i wideo', cel: 'Promocja, dokumentacja działalności', kategoria: 'Wizerunek', podstawa: 'art. 6 ust. 1 lit. a (zgoda)', retencja: 'Do wycofania zgody' },
  { lp: '9', nazwa: 'Wnioski o dostęp do CRA', cel: 'Zarządzanie dostępem do systemu', kategoria: 'Imię, nazwisko, email uczelniany', podstawa: 'art. 6 ust. 1 lit. e', retencja: '1 rok' },
  { lp: '10', nazwa: 'Faktury i dokumenty finansowe', cel: 'Rozliczenia, rachunkowość', kategoria: 'Imię, nazwisko, adres, NIP (os. fizyczne)', podstawa: 'art. 6 ust. 1 lit. c', retencja: '5 lat od końca roku podatkowego' },
  { lp: '11', nazwa: 'Umowy wolontariackie', cel: 'Formalizacja współpracy wolontariuszy', kategoria: 'Imię, nazwisko, PESEL, adres, podpis', podstawa: 'art. 6 ust. 1 lit. b', retencja: '10 lat (kat. B10)' },
  { lp: '12', nazwa: 'Rejestr naruszeń ochrony danych', cel: 'Dokumentacja incydentów RODO', kategoria: 'Dane identyfikacyjne osób, których dotyczyło naruszenie', podstawa: 'art. 6 ust. 1 lit. c (art. 33 ust. 5 RODO)', retencja: '3 lata' },
  { lp: '13', nazwa: 'Korespondencja z UODO', cel: 'Obsługa kontroli i postępowań', kategoria: 'Dane zawarte w pismach', podstawa: 'art. 6 ust. 1 lit. c', retencja: '10 lat' },
];

const KLAUZULE = [
  {
    id: 'ogolna',
    title: 'Klauzula informacyjna — ogólna (formularz/rejestracja)',
    tresc: `Zgodnie z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (RODO), informuję, że:

1. Administratorem Pani/Pana danych osobowych jest Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu (SSUEW), ul. Komandorska 118/120, 53-345 Wrocław.

2. Dane osobowe są przetwarzane w celu [CEL PRZETWARZANIA] na podstawie art. 6 ust. 1 lit. [LITERA] RODO.

3. Dane osobowe będą przechowywane przez okres [OKRES PRZECHOWYWANIA].

4. Odbiorcami danych mogą być podmioty przetwarzające dane w imieniu Administratora na podstawie umów powierzenia (dostawcy usług IT, systemów elektronicznych).

5. Posiada Pani/Pan prawo do: dostępu do swoich danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, wniesienia sprzeciwu wobec przetwarzania, przenoszenia danych (jeśli dotyczy), cofnięcia zgody w dowolnym momencie (jeśli przetwarzanie odbywa się na podstawie zgody).

6. Ma Pani/Pan prawo wniesienia skargi do organu nadzorczego – Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.

7. Podanie danych jest [dobrowolne / obowiązkowe — uzupełnić]. [W przypadku obowiązkowego: Niepodanie danych uniemożliwi [skutek].]`
  },
  {
    id: 'wizerunek',
    title: 'Klauzula informacyjna — zgoda na wizerunek',
    tresc: `Zgodnie z art. 13 RODO informuję, że:

1. Administratorem danych jest Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu (SSUEW), ul. Komandorska 118/120, 53-345 Wrocław.

2. Podstawą przetwarzania wizerunku jest art. 6 ust. 1 lit. a RODO — dobrowolna zgoda osoby, której dane dotyczą.

3. Celem przetwarzania jest dokumentacja działalności Samorządu oraz promocja SSUEW w materiałach: [strona internetowa / media społecznościowe / materiały drukowane — uzupełnić].

4. Dane w postaci wizerunku będą przetwarzane do momentu wycofania zgody.

5. Przysługuje Pani/Panu prawo do cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania, które miało miejsce przed cofnięciem zgody. W celu wycofania zgody prosimy o kontakt: [adres email].

6. Przysługuje Pani/Panu prawo wniesienia skargi do Prezesa UODO (www.uodo.gov.pl).

7. Podanie danych jest dobrowolne. Odmowa wyrażenia zgody nie skutkuje żadnymi negatywnymi konsekwencjami.`
  },
];

const CHECKLIST_ITEMS = [
  { id: 'c1', text: 'Przekazano dostępy do systemów (CRA, Google Drive, poczta samorządowa)' },
  { id: 'c2', text: 'Zmieniono hasła po przekazaniu (wszystkie konta samorządowe)' },
  { id: 'c3', text: 'Odebrano sprzęt samorządowy (laptopy, dyski, nośniki z danymi)' },
  { id: 'c4', text: 'Przekazano dokumentację papierową zawierającą dane osobowe' },
  { id: 'c5', text: 'Usunięto dane z urządzeń prywatnych ustępujących członków' },
  { id: 'c6', text: 'Zaktualizowano Rejestr Czynności Przetwarzania (nowe osoby upoważnione)' },
  { id: 'c7', text: 'Podpisano nowe upoważnienia do przetwarzania danych przez nowy skład' },
  { id: 'c8', text: 'Poinformowano dostawców usług o zmianie osób kontaktowych' },
  { id: 'c9', text: 'Przeprowadzono szkolenie RODO dla nowego składu samorządu' },
  { id: 'c10', text: 'Sporządzono protokół przekazania dokumentacji i uprawnień' },
];

const INCIDENT_STEPS = [
  { label: 'Co się stało?', fields: ['Opis zdarzenia', 'Data i godzina wykrycia', 'Kto wykrył naruszenie?'] },
  { label: 'Zakres danych', fields: ['Rodzaj danych (imiona, emaile, nr ind. itd.)', 'Szacunkowa liczba osób', 'Szacunkowa liczba rekordów'] },
  { label: 'Przyczyna', fields: ['Prawdopodobna przyczyna naruszenia', 'Czy naruszenie jest ciągłe?'] },
  { label: 'Skutki', fields: ['Możliwe skutki dla osób, których dane dotyczą', 'Czy istnieje ryzyko dla praw i wolności?'] },
  { label: 'Działania', fields: ['Podjęte działania naprawcze', 'Planowane działania zapobiegawcze'] },
  { label: 'Powiadomienia', fields: ['Czy zgłoszono do UODO (72h)?', 'Czy poinformowano osoby?', 'Data i sposób zgłoszenia'] },
  { label: 'Podsumowanie', fields: [] },
];

// ─── KOMPONENTY ──────────────────────────────────────────────────────────────

function SidebarNav({ active, onChange }) {
  const items = [
    { id: 'kompendium', label: 'Kompendium RODO', icon: '📚' },
    { id: 'dokumenty', label: 'Dokumenty', icon: '📁' },
    { id: 'narzedzia', label: 'Narzędzia', icon: '🔧' },
  ];
  return (
    <nav className="flex flex-col gap-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
            active === item.id
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function KompendiumSection() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Kompendium RODO</h2>
        <p className="text-sm text-slate-500">Praktyczny przewodnik po ochronie danych osobowych dla członków SSUEW. Kliknij temat, aby rozwinąć.</p>
      </div>
      <div className="space-y-3">
        {KOMPENDIUM.map(topic => (
          <div key={topic.id} className={`rounded-2xl border transition-all overflow-hidden ${open === topic.id ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <button
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
              onClick={() => setOpen(open === topic.id ? null : topic.id)}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{topic.icon}</span>
                <span className="font-black text-slate-800 text-sm md:text-base">{topic.title}</span>
              </div>
              <span className={`shrink-0 text-slate-400 transition-transform text-lg ${open === topic.id ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {open === topic.id && (
              <div className="px-5 pb-5">
                <div className="border-t border-rose-100 pt-4">
                  {topic.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-700 leading-relaxed mb-3 last:mb-0 whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentModal({ doc, onClose }) {
  if (!doc) return null;

  const renderContent = () => {
    if (doc.id === 'rcp') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {['Lp.', 'Czynność przetwarzania', 'Cel', 'Kategorie danych', 'Podstawa prawna', 'Retencja'].map(h => (
                  <th key={h} className="border border-slate-200 p-2 text-left font-bold text-slate-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RCP_DANE.map(row => (
                <tr key={row.lp} className="even:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-bold text-center">{row.lp}</td>
                  <td className="border border-slate-200 p-2 font-semibold">{row.nazwa}</td>
                  <td className="border border-slate-200 p-2">{row.cel}</td>
                  <td className="border border-slate-200 p-2">{row.kategoria}</td>
                  <td className="border border-slate-200 p-2 whitespace-nowrap">{row.podstawa}</td>
                  <td className="border border-slate-200 p-2 whitespace-nowrap">{row.retencja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (doc.id === 'klauzule') {
      return (
        <div className="space-y-6">
          {KLAUZULE.map(k => (
            <div key={k.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-black text-slate-800 mb-3 text-sm">{k.title}</h4>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{k.tresc}</pre>
            </div>
          ))}
        </div>
      );
    }
    if (doc.id === 'polityka') {
      return (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">Polityka Ochrony Danych Osobowych Samorządu Studentów UEW</p>
          <p><strong>§ 1. Postanowienia ogólne</strong><br />Niniejsza Polityka Ochrony Danych Osobowych (dalej: Polityka) określa zasady przetwarzania i ochrony danych osobowych przez Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu (SSUEW), zwany dalej Administratorem.</p>
          <p><strong>§ 2. Administrator danych</strong><br />Administratorem danych osobowych jest Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu, ul. Komandorska 118/120, 53-345 Wrocław. Kontakt w sprawach RODO: rodo@samorzad.ue.wroc.pl</p>
          <p><strong>§ 3. Zakres i cele przetwarzania</strong><br />Administrator przetwarza dane osobowe wyłącznie w zakresie i celach niezbędnych do realizacji działalności statutowej SSUEW, w tym organizacji wydarzeń, obsługi wniosków studenckich, zarządzania zasobami i komunikacji wewnętrznej.</p>
          <p><strong>§ 4. Podstawy prawne</strong><br />Dane przetwarzane są na podstawie art. 6 RODO (w szczególności: zgoda, wykonanie umowy, obowiązek prawny, interes publiczny) oraz art. 9 RODO w odniesieniu do danych szczególnych kategorii.</p>
          <p><strong>§ 5. Prawa osób</strong><br />Każdej osobie przysługuje prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych i sprzeciwu. Wnioski należy kierować na adres: rodo@samorzad.ue.wroc.pl. Odpowiedź udzielana jest w ciągu 30 dni.</p>
          <p><strong>§ 6. Bezpieczeństwo</strong><br />Administrator stosuje odpowiednie środki techniczne i organizacyjne zapewniające ochronę danych przed nieuprawnionym dostępem, utratą lub zniszczeniem, w tym: kontrolę dostępu, szyfrowanie, politykę haseł i szkolenia personelu.</p>
          <p><strong>§ 7. Retencja danych</strong><br />Dane przechowywane są przez okresy określone w Rejestrze Czynności Przetwarzania. Po upływie okresu retencji dane są trwale usuwane zgodnie z procedurą bezpiecznego usuwania.</p>
          <p><strong>§ 8. Postanowienia końcowe</strong><br />Niniejsza Polityka podlega przeglądowi co najmniej raz w roku akademickim oraz każdorazowo przy istotnych zmianach w sposobie przetwarzania danych. Obowiązuje od dnia uchwalenia przez Zarząd SSUEW.</p>
        </div>
      );
    }
    if (doc.id === 'instrukcja') {
      return (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">Instrukcja Zarządzania Systemem Informatycznym służącym do przetwarzania danych osobowych w SSUEW</p>
          <p><strong>Rozdział 1. Cel i zakres</strong><br />Niniejsza Instrukcja określa zasady bezpiecznego użytkowania systemów informatycznych przetwarzających dane osobowe w Samorządzie Studentów UEW.</p>
          <p><strong>Rozdział 2. Hasła i uwierzytelnianie</strong><br />Wymagania: min. 12 znaków, wielkie i małe litery, cyfry, znaki specjalne. Zakaz używania tych samych haseł w różnych serwisach. Obowiązkowe uwierzytelnianie dwuskładnikowe (2FA) dla kont samorządowych. Zmiana haseł co 6 miesięcy lub natychmiast po podejrzeniu kompromitacji.</p>
          <p><strong>Rozdział 3. Kontrola dostępu</strong><br />Dostęp do danych osobowych wyłącznie dla upoważnionych osób (podpisane upoważnienie). Zasada minimalnych uprawnień — dostęp tylko do danych niezbędnych do wykonywanych zadań. Po zakończeniu kadencji: natychmiastowe odebranie dostępów.</p>
          <p><strong>Rozdział 4. Kopie zapasowe</strong><br />Krytyczne dane (protokoły, rejestry, umowy): kopia tygodniowa na zewnętrznym nośniku. Nośniki z kopiami przechowywane w zamkniętym pomieszczeniu. Testowanie odtworzenia kopii co najmniej raz na kwartał.</p>
          <p><strong>Rozdział 5. Urządzenia mobilne i praca zdalna</strong><br />Zakaz przechowywania danych osobowych na prywatnych urządzeniach bez szyfrowania. Obowiązkowe blokowanie ekranu po 5 minutach bezczynności. W miejscach publicznych: ekran prywatyzujący lub zakaz pracy z danymi.</p>
          <p><strong>Rozdział 6. Incydenty bezpieczeństwa</strong><br />Każdy incydent należy niezwłocznie zgłosić osobie odpowiedzialnej za RODO w SSUEW. Dokumentacja: data, godzina, opis, podjęte działania. W przypadku naruszenia: procedura zgłoszenia do UODO w ciągu 72 godzin.</p>
          <p><strong>Rozdział 7. Usuwanie danych</strong><br />Dokumenty papierowe: niszczarka (min. P-4). Nośniki elektroniczne: certyfikowane zerowanie lub fizyczne zniszczenie. Chmura: trwałe usunięcie z konta + potwierdzenie usunięcia od dostawcy.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-bounceIn">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-slate-900 text-lg">{doc.title}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{doc.subtitle}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition-colors text-lg font-bold">✕</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}

function DokumentySection() {
  const [activeDoc, setActiveDoc] = useState(null);
  const selectedDoc = DOKUMENTY.find(d => d.id === activeDoc);
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Dokumenty RODO</h2>
        <p className="text-sm text-slate-500">Polityki, instrukcje, rejestry i wzory klauzul obowiązujące w SSUEW.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOKUMENTY.map(doc => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-300 hover:shadow-md hover:shadow-rose-100 transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${doc.badgeColor}`}>{doc.badge}</span>
                </div>
                <h3 className="font-black text-slate-800 text-sm leading-snug group-hover:text-rose-700 transition-colors">{doc.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{doc.subtitle}</p>
              </div>
              <span className="shrink-0 text-slate-300 group-hover:text-rose-500 transition-colors text-lg">→</span>
            </div>
          </button>
        ))}
      </div>
      {selectedDoc && <DocumentModal doc={selectedDoc} onClose={() => setActiveDoc(null)} />}
    </div>
  );
}

// ─── NARZĘDZIE 1: Generator upoważnień ───────────────────────────────────────

function GeneratorUpowaznien() {
  const [form, setForm] = useState({
    imieNazwisko: '',
    funkcja: '',
    dataDo: '',
    dostepCRA: false,
    dostepDrive: false,
    dostepPoczta: false,
    dostepFizyczny: false,
    dostepArchiwum: false,
    uwagiDodatkowe: '',
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pl-PL');
    const margin = 20;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('UPOWAŻNIENIE DO PRZETWARZANIA DANYCH OSOBOWYCH', 105, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(11);
    doc.text(`Wrocław, dnia ${today}`, margin, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('UPOWAŻNIENIE NR ___/RODO/' + new Date().getFullYear(), margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const bodyLines = [
      `Na podstawie art. 29 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679`,
      `z dnia 27 kwietnia 2016 r. (RODO) upoważniam:`,
      '',
      `Imię i nazwisko: ${form.imieNazwisko}`,
      `Funkcja: ${form.funkcja}`,
      '',
      `do przetwarzania danych osobowych w zakresie niezbędnym do pełnienia`,
      `powierzonej funkcji w Samorządzie Studentów UEW, w szczególności:`,
    ];
    bodyLines.forEach(line => { doc.text(line, margin, y); y += 6; });
    y += 2;

    const dostepy = [
      form.dostepCRA && '- dostęp do systemu CRA (Centralny Rejestr Administracyjny)',
      form.dostepDrive && '- dostęp do zasobów Google Drive SSUEW',
      form.dostepPoczta && '- dostęp do poczty elektronicznej samorządu',
      form.dostepFizyczny && '- dostęp do fizycznej dokumentacji zawierającej dane osobowe',
      form.dostepArchiwum && '- dostęp do archiwum dokumentów samorządu',
    ].filter(Boolean);

    dostepy.forEach(d => { doc.text(d, margin + 4, y); y += 6; });
    y += 4;

    const endLines = [
      `Upoważnienie obowiązuje do dnia: ${form.dataDo || '_______________'}`,
      '',
      form.uwagiDodatkowe ? `Uwagi: ${form.uwagiDodatkowe}` : null,
      '',
      'Osoba upoważniona zobowiązuje się do zachowania przetwarzanych danych',
      'oraz sposobów ich zabezpieczenia w ścisłej tajemnicy.',
      '',
      '',
      '..................................          ..................................',
      'Zarząd SSUEW (podpis i pieczęć)          Osoba upoważniona (podpis)',
    ].filter(l => l !== null);

    endLines.forEach(line => { doc.text(line, margin, y); y += 6; });

    doc.save(`upowaznienie_rodo_${form.imieNazwisko.replace(/\s+/g, '_') || 'brak_nazwy'}.pdf`);
  };

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all"
      />
    </div>
  );

  const Check = ({ name, label }) => (
    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors">
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form[name] ? 'bg-rose-600 border-rose-600' : 'border-slate-300 group-hover:border-slate-400'}`}
        onClick={() => setForm({ ...form, [name]: !form[name] })}>
        {form[name] && <span className="text-white text-xs font-black">✓</span>}
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );

  const canGenerate = form.imieNazwisko.trim() && form.funkcja.trim();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg">📜</div>
        <div>
          <h3 className="font-black text-slate-800">Generator Upoważnień RODO</h3>
          <p className="text-xs text-slate-400">Wypełnij formularz i wygeneruj dokument PDF</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Imię i nazwisko" name="imieNazwisko" placeholder="Jan Kowalski" />
        <Field label="Funkcja / stanowisko" name="funkcja" placeholder="Sekretarz Zarządu" />
        <Field label="Upoważnienie obowiązuje do" name="dataDo" type="date" />
        <div />
      </div>
      <div className="mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Zakres dostępu</p>
        <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-100 rounded-xl divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="divide-y divide-slate-100">
            <Check name="dostepCRA" label="System CRA" />
            <Check name="dostepDrive" label="Google Drive SSUEW" />
            <Check name="dostepPoczta" label="Poczta samorządowa" />
          </div>
          <div className="divide-y divide-slate-100">
            <Check name="dostepFizyczny" label="Dokumentacja fizyczna" />
            <Check name="dostepArchiwum" label="Archiwum dokumentów" />
          </div>
        </div>
      </div>
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Uwagi dodatkowe (opcjonalnie)</label>
        <textarea
          value={form.uwagiDodatkowe}
          onChange={e => setForm({ ...form, uwagiDodatkowe: e.target.value })}
          placeholder="Np. dostęp ograniczony do projektów X i Y"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none h-16"
        />
      </div>
      <button
        onClick={generatePDF}
        disabled={!canGenerate}
        className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest shadow-md shadow-rose-600/20 disabled:shadow-none"
      >
        Generuj upoważnienie PDF
      </button>
      {!canGenerate && <p className="text-center text-xs text-slate-400 mt-2">Wypełnij imię, nazwisko i funkcję</p>}
    </div>
  );
}

// ─── NARZĘDZIE 2: Checklista przekazania kadencji ────────────────────────────

const CHECKLIST_KEY = 'ssuew_rodo_checklist_v1';

function ChecklistaKadencji() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CHECKLIST_KEY) || '[]'); }
    catch { return []; }
  });

  const toggle = (id) => {
    const next = checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id];
    setChecked(next);
    sessionStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  };

  const reset = () => {
    if (!window.confirm('Zresetować postęp checklisty?')) return;
    setChecked([]);
    sessionStorage.removeItem(CHECKLIST_KEY);
  };

  const progress = Math.round((checked.length / CHECKLIST_ITEMS.length) * 100);
  const allDone = checked.length === CHECKLIST_ITEMS.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">🔄</div>
          <div>
            <h3 className="font-black text-slate-800">Checklista Przekazania Kadencji</h3>
            <p className="text-xs text-slate-400">Postęp zapisywany w sesji przeglądarki</p>
          </div>
        </div>
        <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">Resetuj</button>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Postęp</span>
          <span className={`text-sm font-black ${allDone ? 'text-emerald-600' : 'text-slate-700'}`}>{checked.length}/{CHECKLIST_ITEMS.length}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {allDone && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold text-center">
          ✅ Wszystkie kroki ukończone! Przekazanie kadencji zakończone zgodnie z RODO.
        </div>
      )}

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item, idx) => (
          <label key={item.id} className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all group ${checked.includes(item.id) ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50 border border-transparent'}`}>
            <div
              className={`w-6 h-6 shrink-0 mt-0.5 rounded-lg border-2 flex items-center justify-center transition-all ${checked.includes(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-slate-400'}`}
              onClick={() => toggle(item.id)}
            >
              {checked.includes(item.id) && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black text-slate-300 mr-2">#{String(idx + 1).padStart(2, '0')}</span>
              <span className={`text-sm font-medium ${checked.includes(item.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── NARZĘDZIE 3: Formularz zgłoszenia incydentu ─────────────────────────────

function FormularzIncydentu() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentStep = INCIDENT_STEPS[step];
  const isLastStep = step === INCIDENT_STEPS.length - 1;

  const setAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [`${step}_${field}`]: value }));
  };

  const getAnswer = (field) => answers[`${step}_${field}`] || '';

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    let y = 20;
    const margin = 20;
    const pageWidth = 170;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('REJESTR NARUSZEŃ OCHRONY DANYCH OSOBOWYCH', 105, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 105, y, { align: 'center' });
    y += 12;
    doc.setFontSize(10);
    doc.text(`Data sporządzenia: ${today}`, margin, y);
    y += 10;

    INCIDENT_STEPS.slice(0, -1).forEach((s, sIdx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${sIdx + 1}. ${s.label}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      s.fields.forEach(field => {
        const val = answers[`${sIdx}_${field}`] || '—';
        doc.text(`${field}:`, margin + 4, y);
        y += 5;
        const wrapped = doc.splitTextToSize(val, pageWidth - 10);
        wrapped.forEach(line => { doc.text(line, margin + 8, y); y += 5; });
        y += 2;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 3;
    });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Podpis osoby sporządzającej: ..............................', margin, y);
    y += 8;
    doc.text('Podpis osoby odpowiedzialnej za RODO: ..............................', margin, y);

    doc.save(`incydent_rodo_${new Date().toISOString().slice(0, 10)}.pdf`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h3 className="font-black text-slate-800 text-lg mb-2">Formularz zapisany!</h3>
        <p className="text-sm text-slate-500 mb-5">Plik PDF został pobrany. Zachowaj go w wewnętrznym rejestrze naruszeń.</p>
        <button onClick={() => { setStep(0); setAnswers({}); setSubmitted(false); }} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all">Nowe zgłoszenie</button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg">🚨</div>
        <div>
          <h3 className="font-black text-slate-800">Formularz Zgłoszenia Incydentu</h3>
          <p className="text-xs text-slate-400">Krok {step + 1} z {INCIDENT_STEPS.length}</p>
        </div>
      </div>

      {/* Pasek kroków */}
      <div className="flex gap-1 mb-6">
        {INCIDENT_STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? 'bg-rose-400' : i === step ? 'bg-rose-600' : 'bg-slate-100'}`} />
        ))}
      </div>

      <div className="mb-6">
        <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-full text-xs font-black flex items-center justify-center">{step + 1}</span>
          {currentStep.label}
        </h4>
        {isLastStep ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-600">Podsumowanie wpisu do rejestru. Sprawdź dane przed wygenerowaniem PDF.</p>
            {INCIDENT_STEPS.slice(0, -1).map((s, sIdx) => (
              <div key={sIdx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                {s.fields.map(field => (
                  <div key={field} className="flex gap-2 text-xs mb-1">
                    <span className="font-bold text-slate-500 shrink-0">{field}:</span>
                    <span className="text-slate-700">{answers[`${sIdx}_${field}`] || '—'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentStep.fields.map(field => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{field}</label>
                <textarea
                  value={getAnswer(field)}
                  onChange={e => setAnswer(field, e.target.value)}
                  placeholder="Opisz szczegółowo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none h-20"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-30"
        >
          ← Wstecz
        </button>
        {isLastStep ? (
          <button
            onClick={generatePDF}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all active:scale-95 uppercase tracking-wide"
          >
            Wygeneruj PDF i zapisz
          </button>
        ) : (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all active:scale-95"
          >
            Dalej →
          </button>
        )}
      </div>
    </div>
  );
}

function NarzedziaSection() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Narzędzia RODO</h2>
        <p className="text-sm text-slate-500">Interaktywne generatory i formularze dla administratorów danych i zarządu SSUEW.</p>
      </div>
      <div className="space-y-6">
        <GeneratorUpowaznien />
        <ChecklistaKadencji />
        <FormularzIncydentu />
      </div>
    </div>
  );
}

// ─── STRONA GŁÓWNA ────────────────────────────────────────────────────────────

export default function RodoPage() {
  const [activeSection, setActiveSection] = useState('kompendium');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    if (activeSection === 'kompendium') return <KompendiumSection />;
    if (activeSection === 'dokumenty') return <DokumentySection />;
    if (activeSection === 'narzedzia') return <NarzedziaSection />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAGŁÓWEK */}
      <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🔒</div>
            <div>
              <p className="text-rose-200 text-xs font-black uppercase tracking-widest">Samorząd Studentów UEW</p>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Hub RODO</h1>
            </div>
          </div>
          <p className="text-rose-100 text-sm md:text-base max-w-2xl font-medium mt-2">
            Kompendium wiedzy, dokumenty i narzędzia do ochrony danych osobowych w SSUEW — wszystko w jednym miejscu.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="flex gap-8">

          {/* SIDEBAR — desktop */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-6 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Nawigacja</p>
              <SidebarNav active={activeSection} onChange={setActiveSection} />
            </div>
          </aside>

          {/* MOBILNA NAWIGACJA */}
          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl">
              {[
                { id: 'kompendium', icon: '📚', label: 'Kompendium' },
                { id: 'dokumenty', icon: '📁', label: 'Dokumenty' },
                { id: 'narzedzia', icon: '🔧', label: 'Narzędzia' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === item.id ? 'bg-rose-600 text-white' : 'text-slate-500'}`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* TREŚĆ */}
          <main className="flex-1 min-w-0 pb-24 md:pb-0">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}
