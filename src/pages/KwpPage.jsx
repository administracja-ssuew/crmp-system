import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function KwpPage() {
  const [activeTab, setActiveTab] = useState('rozdzial1');

  // Funkcja pomocnicza do płynnego przewijania
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
      
      {/* GŁÓWNY NAGŁÓWEK */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest mb-6 transition-colors">
          <span>← Wróć do Dashboardu</span>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl flex items-center justify-center text-3xl">
            🏛️
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Księga Dokumentów <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">SSUEW</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs">
              Kompendium Wiedzy Protokolanta (KWP) • Wersja 1.0
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEWE MENU (STICKY SIDEBAR) */}
        <aside className="lg:w-1/4 shrink-0">
          <div className="sticky top-24 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Spis Treści</h3>
            <nav className="space-y-1">
              <NavButton id="rozdzial1" number="I" title="Konstytucja Dokumentów" />
              <NavButton id="rozdzial2" number="II" title="Architektura i Typografia" />
              <NavButton id="rozdzial3" number="III" title="Pieczęcie i Podpisy" />
              <NavButton id="rozdzial4" number="IV" title="Lingwistyka Urzędowa" />
              <NavButton id="rozdzial5" number="V" title="Macierz Szablonów" />
              <NavButton id="rozdzial6" number="VI" title="System Weryfikacji" />
            </nav>
          </div>
        </aside>

        {/* GŁÓWNA TREŚĆ (CZYTNIK) */}
        <main className="lg:w-3/4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-16">

            {/* ROZDZIAŁ I */}
            <section id="rozdzial1" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział I</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">Konstytucja Dokumentów (Fundamenty i Własność)</h2>
              </div>

              <div className="space-y-8 text-slate-600 leading-relaxed">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§1</span> Cel i zakres obowiązywania
                  </h3>
                  <p className="mb-3">Istotą niniejszej Księgi Identyfikacji Wizualnej Dokumentów jest zapewnienie jednolitego, spójnego, profesjonalnego oraz łatwo rozpoznawalnego wyglądu wszystkich dokumentów Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu.</p>
                  <p className="mb-3">Wdrożenie standardów ma na celu ograniczenie błędów formalnych oraz przyspieszenie procesu przygotowania, publikacji i archiwizacji dokumentów. Zakres Księgi obejmuje wszystkie dokumenty wewnętrzne oraz zewnętrzne SSUEW, w tym m.in. podania, uchwały, regulaminy, protokoły, raporty, zarządzenia, infopacki, umowy/porozumienia oraz zaświadczenia.</p>
                  
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl my-6">
                    <p className="text-rose-800 font-bold text-sm m-0">
                      <strong>Wymóg bezwzględny:</strong> Stosowanie niniejszej Księgi jest obowiązkowe dla wszystkich organów i jednostek SSUEW oraz osób działających w ich imieniu. Dokumenty niespełniające wymogów podlegają bezwzględnemu zwrotowi do poprawy lub wstrzymaniu ich publikacji i rejestracji. Aby to zagwarantować, wdrożony został obligatoryjny System Weryfikacji.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§2</span> Podstawy formalne i nazewnictwo
                  </h3>
                  <ul className="space-y-3 list-none pl-0">
                    <li className="flex gap-3"><span className="text-indigo-500 font-black">•</span> <strong>Pełna nazwa polska:</strong> Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu. Pierwsze użycie nazwy w danym dokumencie musi zawsze przyjmować pełną formę.</li>
                    <li className="flex gap-3"><span className="text-indigo-500 font-black">•</span> <strong>Skrócona nazwa polska:</strong> SSUEW. Dopuszczalna po uprzednim zastosowaniu pełnej nazwy.</li>
                    <li className="flex gap-3"><span className="text-indigo-500 font-black">•</span> <strong>Pełna nazwa angielska:</strong> Student Government of Wroclaw University of Economics and Business. Ma zastosowanie wyłącznie dla dokumentów dwujęzycznych i korespondencji zagranicznej.</li>
                  </ul>
                  <p className="mt-4 font-medium text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <strong>Zasada konsekwencji:</strong> Obowiązuje zakaz mieszania polskiej i angielskiej nazwy w jednym dokumencie bez merytorycznego uzasadnienia. Błędem krytycznym jest stosowanie nazw nieistniejących, jak np. „Przewodniczący Rady SSUEW” czy „Samorząd Studencki UEW”.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§3</span> Relacja z Księgą Znaku SSUEW
                  </h3>
                  <p className="mb-3">W kwestiach dotyczących samego znaku (logo), jego proporcji i wersji kolorystycznych, dokumentem nadrzędnym pozostaje Księga Znaku SSUEW. Niniejsza Księga Dokumentów jedynie określa ramy jego użycia.</p>
                  <p className="text-sm bg-slate-100 p-4 rounded-xl"><strong>Wyjątek angielski:</strong> Jeśli w Księdze Znaku występuje wariant graficzny bez przyimka „of”, na oficjalnych dokumentach samorządowych bezwzględnie stosujemy brzmienie z Regulaminu. Wariant bez „of” jest dopuszczalny wyłącznie w materiałach promocyjnych po zgodzie Członka Zarządu ds. Promocji.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§4</span> Własność, odpowiedzialność i odstępstwa
                  </h3>
                  <p className="mb-2"><strong>Właściciel dokumentu:</strong> Członek Zarządu ds. Administracji SSUEW. Odpowiada za aktualizację, dystrybucję oraz ostateczną interpretację zapisów.</p>
                  <p className="mb-2"><strong>Współwłaściciele:</strong> Przewodniczący SSUEW oraz Członek Zarządu ds. Promocji (oraz ds. Finansów w dokumentach majątkowych).</p>
                  <p><strong>Odstępstwa:</strong> Wszelkie wyjątki od zasad opisanych w Księdze są niedozwolone, chyba że podmiot uzyska pisemną zgodę Właściciela Księgi.</p>
                </div>
              </div>
            </section>

            {/* ROZDZIAŁ II */}
            <section id="rozdzial2" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział II</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">Architektura Strony, Typografia i WCAG</h2>
              </div>

              <div className="space-y-8 text-slate-600 leading-relaxed">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">§5. Format i siatka</h3>
                    <ul className="text-sm space-y-2">
                      <li><strong>Format:</strong> A4 (210 x 297 mm)</li>
                      <li><strong>Marginesy:</strong> Górny 20 mm, Dolny 18 mm, Lewy 22 mm, Prawy 18 mm.</li>
                      <li><strong>Układ:</strong> Jednokolumnowy. Regulaminy posiadają dodatkowy lewy margines redakcyjny (35 mm).</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">§6. Typografia</h3>
                    <ul className="text-sm space-y-2">
                      <li><strong>Font:</strong> Calibri lub Lato (11 pt).</li>
                      <li><strong>H1 (Tytuły):</strong> 18 pt, Bold.</li>
                      <li><strong>H2:</strong> 14 pt, Bold.</li>
                      <li><strong>Metryczki:</strong> 10 pt.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§7</span> Formatowanie akapitów i skład
                  </h3>
                  <p><strong>Światło tekstu:</strong> Interlinia 1,15. Odstępy między akapitami: 6 pt. Wokół nagłówków: 12 pt przed, 6 pt po.</p>
                  <p className="mt-2 text-rose-600 font-medium">Bezwzględnie zakazuje się pozostawiania pojedynczych liter ("sierot") na końcu linijki. Należy używać twardej spacji (Shift+Enter / Ctrl+Shift+Spacja).</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-sm font-black">§8</span> Dostępność cyfrowa (WCAG)
                  </h3>
                  <p>Obowiązkowa numeracja stron (Strona X z Y). Kolor tekstu: głęboka czerń/grafit. Kolory SSUEW dozwolone tylko w nagłówkach/tabelach. Każda grafika w dokumencie cyfrowym musi posiadać <strong>tekst alternatywny (alt-text)</strong>.</p>
                </div>
              </div>
            </section>

            {/* ROZDZIAŁ III */}
            <section id="rozdzial3" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział III</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">Elementy Stałe i Pieczęcie</h2>
              </div>
              <div className="space-y-6 text-slate-600">
                <p><strong>§9. Nienaruszalność szablonów:</strong> Nagłówki i stopki w oficjalnych szablonach są zablokowane do edycji. Zawierają adres korespondencyjny (ul. Komandorska 118/120) oraz logo. Zabrania się modyfikowania tych elementów.</p>
                <p><strong>§10. Bloki podpisu:</strong> Obowiązuje wyłącznie układ: <code className="bg-slate-100 px-2 py-1 rounded text-indigo-700 font-bold">Imię Nazwisko - Funkcja - Organ</code>. Podpis osoby o najwyższej randze znajduje się zawsze po prawej stronie.</p>
                <p><strong>§11. Pieczęcie:</strong> Pieczęć nagłówkowa (podłużna) w lewym górnym rogu. Pieczęcie imienne centralnie w bloku podpisu. Dokumenty wiążące wymagają "pieczęci na wąsie" łączącej strony.</p>
                <p><strong>§12. Podpisy cyfrowe:</strong> Rekomenduje się stosowanie podpisów kwalifikowanych lub ePUAP. Dokument podpisany cyfrowo nie wymaga drukowania.</p>
              </div>
            </section>

            {/* ROZDZIAŁ IV */}
            <section id="rozdzial4" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział IV</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">Lingwistyka Urzędowa</h2>
              </div>
              <div className="space-y-6 text-slate-600">
                <p><strong>§13. Tone of Voice:</strong> Pisma do Władz bezwzględnie w najwyższym standardzie formalnym (np. Jego Magnificencja). W komunikacji do studentów dopuszcza się język lżejszy i przystępny. Akty normatywne muszą cechować się tzw. suchym językiem prawniczym.</p>
                <p><strong>§14. Zapisy:</strong> Pełny zapis dat to np. <em>9 marca 2026 r.</em> Kwoty zapisujemy ze skrótem waluty (np. <em>1500,00 PLN</em>), w umowach z dopiskiem słownym.</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3">§16. Konstrukcja aktów normatywnych</h4>
                  <p className="text-sm mb-2">Żelazna reguła wstępu:</p>
                  <p className="text-sm italic text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">"Na podstawie art. [X] ust. [Y] Regulaminu Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu, uchwala się / zarządza się, co następuje:"</p>
                  <p className="text-sm mt-3">Struktura: Paragraf (§), Ustęp (ust.), Punkt (pkt), Litera (lit.).</p>
                </div>
              </div>
            </section>

            {/* ROZDZIAŁ V */}
            <section id="rozdzial5" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział V</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">Wielka Macierz Szablonów</h2>
              </div>
              <p className="text-slate-600 mb-6"><strong>§17.</strong> Używanie przestarzałych plików jest zabronione. Aktualna baza znajduje się w folderze „Księga Dokumentów – Szablony”.</p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Grupa A</span>
                  <h4 className="font-bold text-slate-800 mt-2">Akty Normatywne</h4>
                  <p className="text-xs text-slate-500 mt-1">Uchwały, Regulaminy, Zarządzenia. Posiadają lewy margines redakcyjny (35 mm).</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Grupa B & C</span>
                  <h4 className="font-bold text-slate-800 mt-2">Operacyjne i Finansowe</h4>
                  <p className="text-xs text-slate-500 mt-1">Zaświadczenia, podania, kosztorysy. Wymagają czytelnych tabel i wyodrębnienia sum.</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Grupa D</span>
                  <h4 className="font-bold text-slate-800 mt-2">Wizerunkowe</h4>
                  <p className="text-xs text-slate-500 mt-1">Pisma do Władz, infopacki. Wymagają papieru firmowego SSUEW.</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Grupa E</span>
                  <h4 className="font-bold text-slate-800 mt-2">Prawne</h4>
                  <p className="text-xs text-slate-500 mt-1">Umowy, formularze RODO. Wymagają aktualnych klauzul i podpisu IOD.</p>
                </div>
              </div>
            </section>

            {/* ROZDZIAŁ VI */}
            <section id="rozdzial6" className="scroll-mt-24">
              <div className="border-b-2 border-indigo-100 pb-4 mb-8">
                <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">Rozdział VI</span>
                <h2 className="text-3xl font-black text-slate-800 mt-1">System Weryfikacji i Cykl Życia</h2>
              </div>
              
              <div className="space-y-6 text-slate-600">
                <h3 className="text-xl font-bold text-slate-800">§21. System Weryfikacji Dokumentów (SWD)</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-white border-2 border-slate-100 p-5 rounded-2xl relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center border-4 border-white">1</div>
                    <h4 className="font-bold text-slate-800 mb-2">Autokontrola</h4>
                    <p className="text-xs text-slate-500">Twórca sprawdza literówki, daty i nazwy szablonów przed puszczeniem pliku dalej.</p>
                  </div>
                  <div className="flex-1 bg-white border-2 border-indigo-500 p-5 rounded-2xl relative shadow-lg shadow-indigo-100">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white font-black rounded-full flex items-center justify-center border-4 border-white">2</div>
                    <h4 className="font-bold text-indigo-900 mb-2">Weryfikacja Formalna</h4>
                    <p className="text-xs text-indigo-700">Plik PDF trafia do kanału. Zespół adm. weryfikuje zgodność z Księgą KWP.</p>
                  </div>
                  <div className="flex-1 bg-white border-2 border-slate-100 p-5 rounded-2xl relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center border-4 border-white">3</div>
                    <h4 className="font-bold text-slate-800 mb-2">Akceptacja i Rejestr</h4>
                    <p className="text-xs text-slate-500">Po nadaniu klauzuli, dokument trafia do podpisu i rejestru pod unikalną sygnaturą.</p>
                  </div>
                </div>

                <div className="mt-8 bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-white font-bold mb-2">§22. Nomenklatura plików cyfrowych</h3>
                  <p className="text-sm mb-4">Wprowadza się kategoryczny zakaz stosowania potocznych nazw. Obowiązuje standard:</p>
                  <code className="block bg-black/50 p-4 rounded-xl text-emerald-400 font-mono text-sm border border-slate-700 shadow-inner">
                    RRRR-MM-DD_TypDokumentu_Organ_Sygnatura<br/><br/>
                    <span className="text-slate-500"># Przykład poprawnego pliku:</span><br/>
                    <span className="text-white">2026-03-09_Uchwala_Zarzad_Nr12.pdf</span>
                  </code>
                </div>

                <p className="mt-6"><strong>§23. Archiwizacja:</strong> Zamknięte pliki PDF z podpisami przechowuje się w strukturze chmurowej Samorządu (tylko do odczytu dla ogółu).</p>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}