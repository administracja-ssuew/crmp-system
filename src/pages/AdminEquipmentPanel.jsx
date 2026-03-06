import { useState, useEffect, useRef } from 'react';

export default function AdminEquipmentPanel() {
  const [step, setStep] = useState(1);
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dane Korzystającego i Rezerwacji (Zgodne z Załącznikiem 1)
  const [borrower, setBorrower] = useState({
    name: '',
    albumId: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
    dateFrom: '', // Nowe pole do §2
    dateTo: '',   // Nowe pole do §2
    location: ''  // Nowe pole do §2
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Canvas do e-podpisu
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  useEffect(() => {
    fetch(API_URL).then(res => res.json()).then(data => {
        if (!data.error) {
          const formatted = data.map(item => ({
            id: item.KOD_QR || `BRAK-ID-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            accessories: item.INTERAKCJA || 'Brak'
          }));
          setEquipmentData(formatted);
        }
    });
  }, []);

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    else setSelectedItems([...selectedItems, item]);
  };

  const verifyBorrower = () => {
    setIsVerifying(true);
    setVerificationStatus(null);
    setTimeout(() => {
      if (borrower.albumId === '123456') {
        setVerificationStatus('blocked');
      } else if (borrower.albumId.length >= 3 && borrower.name.length > 2 && borrower.dateFrom && borrower.dateTo) {
        setVerificationStatus('ok');
        setStep(3);
      } else {
        alert("Wypełnij poprawnie wszystkie pola, w tym Daty i Miejsce.");
      }
      setIsVerifying(false);
    }, 1200);
  };

  // === OBSŁUGA CANVAS (PODPIS) ===
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setSignatureData(canvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const finalizeProtocol = () => {
    alert("Protokół prawnie wiążący został wygenerowany i zabezpieczony E-Podpisem!");
    setStep(1);
    setSelectedItems([]);
    setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: ''});
    setVerificationStatus(null);
    setSignatureData(null);
  };

  const today = new Date().toLocaleDateString('pl-PL');
  const docNumber = `Wyd/${Math.floor(Math.random() * 9000) + 1000}/2026`;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 flex flex-col items-center pb-20 print:bg-white print:p-0">
      
      {/* Pasek postępu (ukryty przy drukowaniu) */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-3xl border border-slate-700 print:hidden">
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Koszyk</div>
        <div className="h-px bg-slate-600 flex-1 mx-4"></div>
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Weryfikacja</div>
        <div className="h-px bg-slate-600 flex-1 mx-4"></div>
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. Dokument A4</div>
      </div>

      <div className={`w-full ${step === 3 ? 'max-w-[210mm] p-8 md:p-12' : 'max-w-3xl p-8'} bg-white rounded-[2rem] shadow-2xl print:shadow-none print:max-w-none print:w-full print:rounded-none`}>
        
        {/* === KROK 1: WYBÓR SPRZĘTU === */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Wydanie z Magazynu</h2>
            <p className="text-sm font-bold text-slate-500 mb-6">Zaznacz sprzęt, który fizycznie wydajesz organizacji.</p>
            
            <input 
              type="text" 
              placeholder="Skanuj Kod QR lub wpisz..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            <div className="max-h-80 overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-2 mb-6">
              {equipmentData.filter(i => i.status === 'available' && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item)}
                  className={`flex justify-between items-center p-4 mb-2 rounded-xl cursor-pointer transition-colors ${selectedItems.find(i => i.id === item.id) ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
                >
                  <div>
                    <p className="text-sm font-black text-slate-800">{item.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{item.id}</p>
                  </div>
                  <div className="text-xl">{selectedItems.find(i => i.id === item.id) ? '✅' : '⬜'}</div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Dalej: Weryfikacja ({selectedItems.length} szt.)
            </button>
          </div>
        )}

        {/* === KROK 2: WERYFIKACJA I SZCZEGÓŁY === */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Dane do Porozumienia</h2>
            <p className="text-sm font-bold text-slate-500 mb-6">Wypełnij dane zgodne z wymogami Załącznika nr 1.</p>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
              <p className="text-xs font-black text-blue-800 uppercase mb-2">1. Szczegóły wynajmu (§ 2 Umowy)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="datetime-local" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" title="Data Od" />
                <input type="datetime-local" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" title="Data Do" />
                <input type="text" placeholder="Miejsce docelowe użytkowania" value={borrower.location} onChange={e => setBorrower({...borrower, location: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full md:col-span-2" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <p className="text-xs font-black text-slate-700 uppercase mb-2">2. Dane Korzystającego</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Imię i Nazwisko Reprezentanta" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" />
                <input type="text" placeholder="Nr albumu (np. 123456 = ban)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" />
                <input type="text" placeholder="Nazwa Organizacji / Koła" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full md:col-span-2" />
                <input type="text" placeholder="Adres zamieszkania / korespondencyjny" value={borrower.address} onChange={e => setBorrower({...borrower, address: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full md:col-span-2" />
                <input type="text" placeholder="Telefon" value={borrower.phone} onChange={e => setBorrower({...borrower, phone: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" />
                <input type="email" placeholder="E-mail" value={borrower.email} onChange={e => setBorrower({...borrower, email: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-bold w-full" />
              </div>
            </div>

            {verificationStatus === 'blocked' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
                <p className="text-red-700 font-black text-sm uppercase tracking-widest">⚠️ Odmowa Wydania</p>
                <p className="text-red-600 text-xs font-bold mt-1">Student znajduje się w Rejestrze Dłużników. Zablokowano możliwość zawarcia umowy.</p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
              <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1 flex items-center justify-center gap-2">
                {isVerifying ? <span className="animate-pulse">Weryfikacja...</span> : <span>Generuj Dokument A4</span>}
              </button>
            </div>
          </div>
        )}

        {/* === KROK 3: WIDOK DOKUMENTU (A4) === */}
        {step === 3 && (
          <div className="animate-fadeIn text-black font-serif text-[11px] md:text-[12px] leading-relaxed">
            
            {/* Nagłówek Dokumentu */}
            <div className="flex justify-between items-start mb-10">
              <div className="w-1/2 text-[10px] leading-tight text-gray-600">
                <p className="font-bold">Samorząd Studentów</p>
                <p>Uniwersytetu Ekonomicznego</p>
                <p>we Wrocławiu</p>
              </div>
              <div className="w-1/2 text-right text-[10px] leading-tight text-gray-800">
                <p className="font-bold">ZAŁĄCZNIK NR 1</p>
                <p>DO REGULAMINU GOSPODAROWANIA</p>
                <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU</p>
                <p>STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU</p>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-lg md:text-xl font-bold underline">POROZUMIENIE SPRZĘTOWE</h1>
              <p className="font-bold uppercase">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR {docNumber}</p>
            </div>

            {/* Komparycja */}
            <div className="text-justify mb-6">
              <p className="mb-4">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
              
              <p className="mb-2">
                <strong>1. SAMORZĄDEM STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU</strong>, reprezentowanym przez Dysponenta / Operatora Systemu:
              </p>
              <p className="mb-2 border-b border-dotted border-gray-400 inline-block min-w-[300px] text-center">
                Administrator CRW (System Zautomatyzowany)
              </p>
              <p className="mb-4">(imię i nazwisko, funkcja) zwanym dalej <strong>„WYDAJĄCYM”</strong>,</p>
              
              <p className="mb-4 font-bold">a</p>
              
              <p className="mb-2"><strong>2. PODMIOT:</strong></p>
              <p className="mb-2 border-b border-dotted border-gray-400 font-bold uppercase">{borrower.organization || '\u00A0'}</p>
              <p className="mb-4 text-[9px]">(pełna nazwa Organizacji Studenckiej / Koła Naukowego i/lub Projektu) reprezentowaną przez:</p>
              
              <div className="pl-4 space-y-2 mb-4">
                <p>Pana/Panią: <span className="font-bold uppercase border-b border-dotted border-gray-400 px-2">{borrower.name}</span> <span className="text-[9px]">(imię i nazwisko Reprezentanta)</span></p>
                <p>Nr albumu (legitymacji): <span className="font-bold border-b border-dotted border-gray-400 px-2">{borrower.albumId}</span></p>
                <p>Adres zamieszkania/korespondencyjny: <span className="border-b border-dotted border-gray-400 px-2">{borrower.address || '___________________________'}</span></p>
                <p>Nr telefonu: <span className="border-b border-dotted border-gray-400 px-2">{borrower.phone || '_________________'}</span></p>
                <p>E-mail: <span className="border-b border-dotted border-gray-400 px-2">{borrower.email || '_________________'}</span></p>
              </div>
              <p className="mb-6">zwanym dalej <strong>„KORZYSTAJĄCYM”</strong>.</p>
            </div>

            {/* Paragrafy Prawne */}
            <div className="text-justify space-y-6 mb-10">
              
              {/* Paragraf 1 */}
              <div>
                <h3 className="font-bold text-center mb-2">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Wydający oddaje Korzystającemu w bezpłatne używanie na czas oznaczony Sprzęt określony szczegółowo w Protokole Zdawczo-Odbiorczym (Załącznik nr 2), stanowiącym integralną część niniejszej umowy.</li>
                  <li>Korzystający oświadcza, że zapoznał się z treścią "Regulaminu Gospodarowania Składnikami Majątku Ruchomego Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu" (dalej: Regulamin), w pełni akceptuje jego postanowienia, w tym zasady odpowiedzialności materialnej, i zobowiązuje się do ich ścisłego przestrzegania.</li>
                </ol>
              </div>

              {/* Paragraf 2 */}
              <div>
                <h3 className="font-bold text-center mb-2">§ 2. OKRES OBOWIĄZYWANIA I MIEJSCE</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Sprzęt zostaje wydany na okres:<br/>
                      OD dnia: <strong>{borrower.dateFrom ? new Date(borrower.dateFrom).toLocaleString('pl-PL') : '___________'}</strong><br/>
                      DO dnia: <strong>{borrower.dateTo ? new Date(borrower.dateTo).toLocaleString('pl-PL') : '___________'}</strong>
                  </li>
                  <li>Miejscem docelowym użytkowania Sprzętu jest: <strong>{borrower.location || '___________________________'}</strong></li>
                  <li>Termin zwrotu określony w ust. 1 jest terminem zawitym. Przekroczenie terminu bez uprzedniej pisemnej zgody Wydającego skutkuje:
                    <ol className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                      <li>Natychmiastowym rozwiązaniem umowy;</li>
                      <li>Nałożeniem blokady na wypożyczenia (karencja);</li>
                      <li>Powstaniem roszczenia o naprawienie szkody poprzez zapłatę pełnej wartości odtworzeniowej przedmiotu (zakup fabrycznie nowego urządzenia o identycznych lub lepszych parametrach), w przypadku jego utraty, zniszczenia lub trwałego uszkodzenia w okresie po upływie terminu zwrotu.</li>
                    </ol>
                  </li>
                </ol>
              </div>

              {/* Paragraf 3 */}
              <div>
                <h3 className="font-bold text-center mb-2">§ 3. ZASADY ODPOWIEDZIALNOŚCI (SOLIDARNOŚĆ)</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Korzystający ponosi pełną odpowiedzialność materialną za powierzone mienie na zasadzie ryzyka, od momentu jego wydania do momentu zwrotu potwierdzonego przez Wydającego.</li>
                  <li>Reprezentant podpisujący niniejszą umowę oświadcza, iż jest umocowany do działania w imieniu wskazanego w komparycji Podmiotu.</li>
                  <li>Na podstawie art. 366 § 1 Kodeksu cywilnego, Reprezentant przyjmuje na siebie odpowiedzialność solidarną ze wskazany Podmiot za wszelkie zobowiązania wynikające z niniejszej umowy, w tym w szczególności za naprawienie szkody wynikłej z utraty, kradzieży lub uszkodzenia Sprzętu.</li>
                  <li>Wydający uprawniony jest do dochodzenia całości roszczenia od Reprezentanta z jego majątku osobistego, niezależnie od stanu finansów Podmiotu.</li>
                </ol>
              </div>

              {/* Paragraf 4 */}
              <div className="break-before-auto">
                <h3 className="font-bold text-center mb-2">§ 4. BEZPIECZEŃSTWO I DANE OSOBOWE</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Korzystający zobowiązuje się do używania Sprzętu zgodnie z jego przeznaczeniem oraz zasadami BHP.</li>
                  <li>W przypadku powstania szkody lub utraty Sprzętu, Korzystający zobowiązuje się do niezwłocznego uzupełnienia danych osobowych niezbędnych do dochodzenia roszczeń, na wezwanie Wydającego w Protokole Szkody.</li>
                </ol>
              </div>

              {/* Paragraf 5 */}
              <div>
                <h3 className="font-bold text-center mb-2">§ 5. DORĘCZENIA I POSTANOWIENIA KOŃCOWE</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Korzystający zobowiązuje się do informowania Wydającego o każdej zmianie adresu pod rygorem uznania doręczenia na adres wskazany w komparycji umowy za skuteczne po upływie 7 dni od nadania (fikcja doręczenia).</li>
                  <li>W sprawach nieuregulowanych zastosowanie mają przepisy Regulaminu oraz Kodeksu cywilnego.</li>
                  <li>Sądem właściwym do rozstrzygania sporów jest Sąd powszechny właściwy miejscowo dla siedziby Wydającego.</li>
                </ol>
              </div>
            </div>

            {/* Protokół Wydania (Tabela - Załącznik nr 2 wbudowany) */}
            <div className="mb-10 page-break-inside-avoid">
              <h2 className="font-bold text-center mb-2">ZAŁĄCZNIK: PROTOKÓŁ ZDAWCZO-ODBIORCZY (WYDANIE SPRZĘTU)</h2>
              <table className="w-full border-collapse border border-black text-[10px] text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 text-center w-8">Lp.</th>
                    <th className="border border-black p-1.5">NAZWA SPRZĘTU</th>
                    <th className="border border-black p-1.5">NR INWENTARZOWY</th>
                    <th className="border border-black p-1.5">STAN WIZUALNY / UWAGI</th>
                    <th className="border border-black p-1.5">AKCESORIA W ZESTAWIE</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{item.name}</td>
                      <td className="border border-black p-1.5 font-mono">{item.id}</td>
                      <td className="border border-black p-1.5 text-gray-700">{item.condition}</td>
                      <td className="border border-black p-1.5 text-gray-700">{item.accessories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Miejsce na Podpis */}
            <div className="mt-12 flex justify-between items-end pt-8 page-break-inside-avoid">
              <div className="w-1/3 text-center border-t border-black pt-2">
                <p>(Podpis WYDAJĄCEGO)</p>
              </div>
              <div className="w-1/2 flex flex-col items-center">
                {/* CANVAS */}
                <div className="w-full h-32 border-b border-black relative touch-none bg-blue-50/30 print:bg-transparent" title="Podpisz tutaj">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair absolute top-0 left-0"
                    width={400} height={128}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                  />
                  {!signatureData && <div className="absolute inset-0 flex items-center justify-center opacity-20 font-black tracking-widest pointer-events-none print:hidden">PODPISZ TUTAJ (RYSYK)</div>}
                </div>
                <p className="mt-2">(Czytelny podpis <strong>KORZYSTAJĄCEGO</strong>)</p>
                <button onClick={clearSignature} className="text-[9px] text-red-500 mt-2 print:hidden hover:underline">Wyczyść podpis</button>
              </div>
            </div>

            {/* Stopka Dokumentu */}
            <div className="mt-16 pt-4 border-t border-gray-300 text-center text-[9px] text-gray-500">
              <p className="font-bold text-gray-700">Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu</p>
              <p>ul. Kamienna 43, 53-307 Wrocław</p>
              <p>e-mail: kontakt@samorzad.ue.wroc.pl | samorzad.ue.wroc.pl</p>
            </div>

            {/* Panel Akcji (ukryty na wydruku) */}
            <div className="mt-10 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
              <button onClick={() => setStep(2)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs">Wróć</button>
              <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-900 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs flex-1 shadow-lg"
              >
                🖨️ Zapisz jako PDF / Drukuj
              </button>
              <button 
                onClick={finalizeProtocol} 
                disabled={!signatureData}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 transition-all"
              >
                Zatwierdź E-Protokół w Systemie
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}