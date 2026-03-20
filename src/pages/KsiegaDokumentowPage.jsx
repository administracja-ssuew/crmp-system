import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function KsiegaDokumentowPage() {
  const [activeTab, setActiveTab] = useState('rozdzial1');

  const scrollToSection = (id) => {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const NavButton = ({ id, number, title }) => (
    <button 
      onClick={() => scrollToSection(id)}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex gap-3 items-center
        ${activeTab === id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
    >
      <span className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] shrink-0 ${activeTab === id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
        {number}
      </span>
      <span className="truncate">{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      
      {/* GŁÓWNY NAGŁÓWEK APLIKACJI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <Link to="/dokumenty" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest mb-6 transition-colors">
          <span>← Wróć do Modułu Lex SSUEW</span>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl flex items-center justify-center text-3xl">
            🏛️
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Księga Dokumentów
            </h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">
              Dziennik Urzędowy SSUEW • Akt Normatywny Naczelny
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEWE MENU */}
        <aside className="lg:w-1/4 shrink-0">
          <div className="sticky top-24 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Spis Treści</h3>
            <nav className="space-y-1">
              <NavButton id="rozdzial1" number="I" title="Przepisy Ogólne" />
              <NavButton id="rozdzial2" number="II" title="Architektura i Typografia" />
              <NavButton id="rozdzial3" number="III" title="Pieczęcie i Autoryzacja" />
              <NavButton id="rozdzial4" number="IV" title="Lingwistyka Urzędowa" />
              <NavButton id="rozdzial5" number="V" title="Katalog: Administracja" />
              <NavButton id="rozdzial6" number="VI" title="Katalog: Finanse (Wyłączenia)" />
              <NavButton id="rozdzial7" number="VII" title="Katalog: Fundacja" />
              <NavButton id="rozdzial8" number="VIII" title="System Weryfikacji (SWD)" />
            </nav>
          </div>
        </aside>

        {/* GŁÓWNA TREŚĆ */}
        <main className="lg:w-3/4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-14 space-y-16 text-slate-800 leading-relaxed text-base">

            {/* ROZDZIAŁ I */}
            <section id="rozdzial1" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział I</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Przepisy Ogólne i Zakres Obowiązywania</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 1. Cel i istota regulacji</strong><br/>
                Istotą niniejszej Księgi Identyfikacji Wizualnej Dokumentów (zwanej dalej „Księgą”) jest zapewnienie jednolitego, spójnego, profesjonalnego oraz łatwo rozpoznawalnego standardu wizualnego i strukturalnego wszystkich dokumentów Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu. Wdrożenie przedmiotowych standardów ma na celu kategoryczne ograniczenie uchybień formalnych oraz optymalizację procesu przygotowania, publikacji i archiwizacji aktów.</p>
                
                <div className="bg-slate-100 p-5 rounded-2xl border-l-4 border-slate-800">
                  <p className="font-bold text-slate-900 mb-1">§ 2. Wymóg bezwzględny</p>
                  <p className="text-sm">Stosowanie norm określonych w niniejszej Księdze ma charakter obligatoryjny dla wszystkich organów, jednostek organizacyjnych SSUEW oraz osób fizycznych działających w ich imieniu. Akty niespełniające narzuconych wymogów podlegają bezwzględnemu zwrotowi do korekty w trybie nadzoru administracyjnego.</p>
                </div>

                <p><strong>§ 3. Nomenklatura i tożsamość prawna</strong><br/>
                1. Pełna nazwa polska: <em>Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu</em>. Pierwsze użycie nazwy w danym dokumencie musi zawsze przyjmować pełną formę.<br/>
                2. Skrócona nazwa polska: <em>SSUEW</em>. Dopuszczalna do stosowania w dalszej części tekstu, wyłącznie po uprzednim zastosowaniu pełnej nazwy.<br/>
                3. Pełna nazwa angielska: <em>Student Government of Wroclaw University of Economics and Business</em>. Stosowana w korespondencji zagranicznej oraz na dokumentach dwujęzycznych.</p>

                <p><strong>§ 4. Własność i odstępstwa</strong><br/>
                Głównym depozytariuszem i właścicielem Księgi jest Członek Zarządu ds. Administracji SSUEW. Wszelkie odstępstwa od reguł ujętych w dokumencie są z mocy prawa nieważne, chyba że wnioskodawca uzyska uprzednią, pisemną zgodę Właściciela Księgi.</p>
              </div>
            </section>

            {/* ROZDZIAŁ II */}
            <section id="rozdzial2" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział II</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Architektura Strony i Typografia</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 5. Format i marginesy robocze</strong><br/>
                Wszystkie dokumenty tekstowe SSUEW podlegają sporządzeniu na arkuszach formatu A4 (210 x 297 mm). Ustanawia się sztywne marginesy obszaru roboczego: górny (20 mm), dolny (18 mm), lewy (22 mm), prawy (18 mm). Dla aktów normatywnych (Uchwały, Zarządzenia) wymusza się stosowanie powiększonego lewego marginesu redakcyjnego o szerokości 35 mm.</p>

                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                  <p className="font-bold text-indigo-900 mb-2">§ 6. Typografia bazowa (Żelazna Reguła)</p>
                  <p className="text-indigo-800 text-sm">Urzędowym i <strong>jedynym dopuszczalnym</strong> krojem pisma dla wszelkiej dokumentacji oficjalnej SSUEW jest czcionka <strong>Times New Roman</strong>. Ustanawia się następującą hierarchię nagłówkową, którą należy implementować poprzez systemowe "Style" edytorów tekstu:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-indigo-800">
                    <li><strong>Treść właściwa:</strong> 12 pt, Standard.</li>
                    <li><strong>Nagłówek H1 (Tytuły):</strong> 18 pt, Bold.</li>
                    <li><strong>Nagłówek H2:</strong> 14 pt, Bold.</li>
                    <li><strong>Nagłówek H3:</strong> 12 pt, Bold.</li>
                    <li><strong>Metryczki i stopki:</strong> 10 pt.</li>
                  </ul>
                </div>

                <p><strong>§ 7. Skład i łamanie tekstu</strong><br/>
                Obowiązuje interlinia 1,15 (lub 1,5 w zależności od formatki) oraz odstęp po akapicie wynoszący 6 pt. Zakazuje się ręcznego i automatycznego dzielenia wyrazów. Ponadto wprowadza się kategoryczny zakaz pozostawiania pojedynczych znaków (tzw. sierot) na końcu wersów – wady te należy korygować twardą spacją (Shift+Enter).</p>
              </div>
            </section>

            {/* ROZDZIAŁ III */}
            <section id="rozdzial3" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział III</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Pieczęcie i Autoryzacja Dokumentów</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 8. Architektura bloków podpisu</strong><br/>
                Każdy oficjalny dokument uwieńczony jest blokiem podpisu w sztywnym układzie: <em>Imię Nazwisko – Funkcja – Organ</em>. W przypadku reprezentacji wieloosobowej, podpis osoby o najwyższej randze w hierarchii (np. Przewodniczącego SSUEW) składa się zawsze po prawej stronie arkusza.</p>

                <p><strong>§ 9. Gospodarka pieczęciami</strong><br/>
                1. Pieczęć nagłówkowa (podłużna) przystawiana jest w lewym górnym rogu dokumentów wychodzących oraz umów, o ile druk nie wykorzystuje cyfrowego papieru firmowego.<br/>
                2. Pieczęcie imienne lokuje się centralnie, w obszarze bloku podpisu.<br/>
                3. Akty wielostronicowe o skutkach wiążących (porozumienia, umowy) wymagają zabezpieczenia integralności poprzez parafowanie każdej strony oraz nałożenie tzw. "pieczęci na wąsie" na złączeniu zszywką.</p>
              </div>
            </section>

            {/* ROZDZIAŁ IV */}
            <section id="rozdzial4" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział IV</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Lingwistyka Urzędowa</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 10. Tone of Voice i Standardy Redakcyjne</strong><br/>
                W korespondencji zewnętrznej i oficjalnej (pisma do Władz Rektorskich, administracji uczelni, partnerów) kategorycznie wymaga się najwyższego standardu języka formalnego z uwzględnieniem odpowiednich form tytularnych (np. Jego Magnificencja, Szanowny Panie Dziekanie). Wszelkie akty normatywne winny charakteryzować się precyzją, zwięzłością i brakiem ozdobników, celem uniknięcia wielorakiej interpretacji.</p>

                <p><strong>§ 11. Zapis dat i kwot</strong><br/>
                1. W dokumentach oficjalnych obowiązuje pełny zapis daty z rozwiniętą nazwą miesiąca oraz skrótem „r.”, np.: <em>9 marca 2026 r.</em><br/>
                2. Kwoty finansowe w pismach wiążących i umowach należy podawać w formie liczbowej ze wskazaniem waluty oraz uzupełniać zapisem słownym w nawiasie, np.: <em>1500,00 PLN (słownie: jeden tysiąc pięćset złotych 00/100)</em>.</p>
              </div>
            </section>

            {/* ROZDZIAŁ V */}
            <section id="rozdzial5" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział V</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Katalog Aktów: Administracja i Projekty</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 12. Zakres dokumentacji administracyjnej</strong><br/>
                Sekcja administracyjno-operacyjna obejmuje wszelkie dokumenty regulujące wewnętrzne funkcjonowanie organizacji oraz oficjalną wymianę pism z Władzami Uczelni. Ustala się następujący katalog formularzy i aktów:</p>

                <ul className="list-[square] pl-8 space-y-3">
                  <li><strong>Podania (każdej maści):</strong> m.in. o zwolnienie z zajęć dydaktycznych, zgodę na organizację wydarzenia, darmowe udostępnienie sali UEW, rozwieszenie plakatów, ekspozycję banerów, darmowy wjazd na kampus, ustawienie stoisk promocyjnych, organizację wydarzeń plenerowych (np. grill na Zaprzęgubiu), oraz udostępnienie sprzętu/umeblowania.</li>
                  <li><strong>Akty Normatywne (wszystkie):</strong> Uchwały Zarządu SSUEW, Uchwały RUSS, Zarządzenia Przewodniczącego SSUEW, Regulaminy Wewnętrzne, Ordynacje Wyborcze.</li>
                  <li><strong>Korespondencja Oficjalna:</strong> Pisma Przewodnie, Listy Intencyjne, Zapytania formalne.</li>
                  <li><strong>Akty Operacyjne:</strong> Pełnomocnictwa, Zaświadczenia o działalności, Formularze Zgód i Oświadczeń (w tym klauzule RODO).</li>
                  <li><strong>Dokumentacja Obiegu Informacji:</strong> Protokoły z posiedzeń (RUSS, SKS, KPUE, Absolutoryjne) oraz Raporty Projektowe.</li>
                </ul>

                <div className="bg-slate-50 border border-slate-200 p-4 mt-6 rounded-xl italic text-sm text-center">
                  * Przypis redakcyjny: Szczegółowe instrukcje, wytyczne warsztatowe oraz merytoryczne zasady sporządzania Protokółów i Raportów znajdują się w odrębnym dokumencie: <strong>Akademia Protokolanta (KWP)</strong>.
                </div>
              </div>
            </section>

            {/* ROZDZIAŁ VI */}
            <section id="rozdzial6" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział VI</h2>
                <h3 className="text-2xl font-black mt-2 text-rose-800">Katalog Aktów: Finanse (Wyłączenie Spod Regulacji)</h3>
              </div>

              <div className="space-y-6">
                <div className="border-4 border-rose-100 bg-rose-50 p-6 mb-6 rounded-2xl">
                  <p className="font-bold text-rose-900 uppercase tracking-widest text-sm text-center mb-4">Klauzula Odrębności Prawnej</p>
                  <p className="text-sm text-justify text-rose-800">Dokumentacja o charakterze finansowo-księgowym podlega rygorystycznym wymogom Prawa Finansów Publicznych oraz odrębnym Zarządzeniom Rektora i Kwestora UEW. Niniejsza Księga jedynie systematyzuje poniższe akty w jeden katalog informacyjny, lecz <strong>nie narzuca im formy wizualnej</strong>. Obowiązujące, zatwierdzone wzory dokumentów finansowych należy bezwzględnie pobierać z Uczelnianego Systemu LEX lub z oficjalnych platform księgowych UEW.</p>
                </div>

                <p><strong>§ 13. Dokumentacja Budżetowa i Planistyczna</strong></p>
                <ul className="list-[square] pl-8 space-y-1">
                  <li>Budżet Główny Samorządu Studentów</li>
                  <li>Prowizoria Budżetowe</li>
                  <li>Sprawozdania Budżetowe Projektu</li>
                  <li>Plan Umów i Wynagrodzeń</li>
                  <li>Wnioski Grantowe</li>
                </ul>

                <p><strong>§ 14. Dokumentacja Zamówień i Zakupów</strong></p>
                <ul className="list-[square] pl-8 space-y-1">
                  <li>Wniosek o Zgodę na Wydatek</li>
                  <li>Zamówienie na Usługi (Zewnętrzne)</li>
                  <li>Formatka Zamówień Komputerowych</li>
                  <li>Wniosek o Zakup Oprogramowania Komputerowego / Usługi Cyfrowej</li>
                  <li>Wyjaśnienie do Zakupu (Korekty i Uzasadnienia)</li>
                </ul>

                <p><strong>§ 15. Formularze Kadrowe, Księgowe i Rozliczeniowe</strong></p>
                <ul className="list-[square] pl-8 space-y-1">
                  <li>Umowa Zlecenia / Umowa o Dzieło</li>
                  <li>Rachunki do Umowy Zlecenia oraz Potwierdzenie Przekazania Rachunku</li>
                  <li>Karta Przekazania Danych Osobowych i Nr Rachunków Bankowych (do autowypłat dla członków SSUEW i Organizacji)</li>
                  <li>Opisy Faktur i Noty Korygujące</li>
                  <li>Podanie o Zwrot Kosztów / Podanie o Wystawienie Faktury</li>
                  <li>Zlecenie Podróży dla realizacji zadań na rzecz UEW</li>
                  <li>Rozchód Wewnętrzny</li>
                </ul>

                <p><strong>§ 16. Rejestry i Zestawienia Główne</strong></p>
                <ul className="list-[square] pl-8 space-y-1">
                  <li>Centralny Rejestr Faktur</li>
                  <li>Rejestr Dokumentów Finansowych</li>
                  <li>Sprawozdania Finansowe (Syntetyczne)</li>
                  <li>Upoważnienia Finansowe i Lista Akronimów Finansowych</li>
                </ul>
              </div>
            </section>

            {/* ROZDZIAŁ VII */}
            <section id="rozdzial7" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział VII</h2>
                <h3 className="text-2xl font-black mt-2 text-indigo-800">Katalog Aktów: Fundacja (Gospodarka Zewnętrzna)</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 17. Akty Sektora Pozarządowego</strong><br/>
                W relacjach, w których podmiotem reprezentującym interesy projektowe jest Fundacja działająca przy Uniwersytecie, obieg dokumentów opiera się na odrębnej ścieżce korporacyjnej. Poniższy zbiór określa instrumenty nawiązywania współpracy sponsorskiej i barterowej.</p>

                <ul className="list-[square] pl-8 space-y-2">
                  <li><strong>Procedury Kontraktacji:</strong> Umowa Barterowa, Umowa Finansowa, Umowa Mieszana (Barterowo-Finansowa), Formularze Zamówień do ww. umów.</li>
                  <li><strong>Procedury Realizacyjne:</strong> Protokół Realizacji Świadczeń Sponsorskich.</li>
                  <li><strong>Kadry Projektowe:</strong> Umowy Zlecenia i Umowy o Dzieło realizowane ze środków Fundacji.</li>
                  <li><strong>Dowody Zaksięgowania:</strong> Opisy Faktur Fundacyjnych, Noty Korygujące.</li>
                </ul>
              </div>
            </section>

            {/* ROZDZIAŁ VIII */}
            <section id="rozdzial8" className="scroll-mt-24">
              <div className="text-center mb-10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Rozdział VIII</h2>
                <h3 className="text-2xl font-black mt-2 text-slate-900">Zasady Archiwizacji i System Weryfikacji (SWD)</h3>
              </div>

              <div className="space-y-6">
                <p><strong>§ 18. Nomenklatura Archiwalna</strong><br/>
                Zabrania się przechowywania dokumentów w chmurze organizacyjnej z wykorzystaniem potocznych nazw plików. Ustala się jednolity format nazewnictwa dla ostatecznych plików cyfrowych (.pdf, .docx):<br/>
                <code className="block bg-slate-900 text-emerald-400 p-4 rounded-xl mt-2 font-mono text-sm">
                  RRRR-MM-DD_TypDokumentu_Organ_SygnaturaWewnetrzna<br/><br/>
                  <span className="text-slate-500"># Przykład:</span><br/>
                  <span className="text-white">2026-03-09_Uchwala_Zarzad_Nr12.pdf</span>
                </code></p>

                <p><strong>§ 19. System Weryfikacji Dokumentów (SWD)</strong><br/>
                W celu zapewnienia kategorycznej bezbłędności administracyjnej, proces wydawania aktów zostaje objęty trzyetapowym Systemem Weryfikacji, stanowiącym ostateczną zaporę przed procedowaniem pism wadliwych:</p>
                
                <ol className="list-[upper-roman] pl-8 space-y-3">
                  <li><strong>Autokontrola (Wnioskodawca):</strong> Twórca dokumentu jest pierwszym gwarantem jego jakości. Weryfikuje on brak uchybień redakcyjnych, spójność dat oraz poprawność doboru wymuszonej czcionki (Times New Roman).</li>
                  <li><strong>Nadzór Formalny (Administracja):</strong> Plik w formie Projektu przedkładany jest organowi weryfikacyjnemu Zarządu. Dokument w tej fazie poddawany jest ścisłemu badaniu pod kątem zgodności z postanowieniami niniejszej Księgi. Dokument wadliwy zostaje odrzucony i wraca do punktu I.</li>
                  <li><strong>Akceptacja i Kodyfikacja:</strong> Dokument po uzyskaniu wizy formalnej jest kierowany do właściwych stron celem złożenia podpisu, a następnie podlega wpisowi do Rejestru Prawa SSUEW pod nadaną sygnaturą.</li>
                </ol>

                <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                  <p className="font-bold text-sm uppercase tracking-widest text-slate-400">
                    *** Koniec Dokumentu ***
                  </p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}