import { useState, useEffect, useRef } from 'react';

export default function AdminEquipmentPanel() {
  // === NOWOŚĆ: TRYB PRACY PANELU (WYDAWANIE vs WINDYKACJA) ===
  const [adminMode, setAdminMode] = useState('wydawanie'); 

  // ==========================================
  // STANY DLA TRYBU: WYDAWANIE SPRZĘTU
  // ==========================================
  const [step, setStep] = useState(1);
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [borrower, setBorrower] = useState({
    name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: ''
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  // ==========================================
  // STANY DLA TRYBU: WINDYKACJA (WEZWANIA)
  // ==========================================
  const [summonsData, setSummonsData] = useState({
    perpetrator: '',
    address: '',
    protocolNumber: '',
    equipmentName: '',
    brand: '',
    model: ''
  });
  const [showSummonsDocument, setShowSummonsDocument] = useState(false);

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

  // Funkcje Wydawania
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
      } else if (borrower.albumId.length >= 3 && borrower.name.length > 2) {
        setVerificationStatus('ok');
        setStep(3);
      } else {
        alert("Wypełnij poprawnie podstawowe pola.");
      }
      setIsVerifying(false);
    }, 1200);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    if(canvasRef.current) setSignatureData(canvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
      
      {/* === PRZEŁĄCZNIK TRYBÓW ADMINISTRATORA === */}
      <div className="w-full max-w-xl flex bg-slate-800 rounded-full p-2 mb-8 border border-slate-700 shadow-xl print:hidden animate-slideUp">
        <button 
          onClick={() => setAdminMode('wydawanie')}
          className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${adminMode === 'wydawanie' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          📦 Wydawanie Sprzętu
        </button>
        <button 
          onClick={() => setAdminMode('windykacja')}
          className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${adminMode === 'windykacja' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          ⚖️ Windykacja / Wezwania
        </button>
      </div>

      {/* ========================================================= */}
      {/* TRYB: WYDAWANIE SPRZĘTU */}
      {/* ========================================================= */}
      {adminMode === 'wydawanie' && (
        <>
          <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-3xl border border-slate-700 print:hidden animate-fadeIn">
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Koszyk</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Weryfikacja</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. Dokument A4</div>
          </div>

          <div className={`w-full ${step === 3 ? 'max-w-[210mm] p-8 md:p-12' : 'max-w-3xl p-8'} bg-white rounded-[2rem] shadow-2xl print:shadow-none print:max-w-none print:w-full print:rounded-none`}>
            {/* KROK 1 */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Wydanie z Magazynu</h2>
                <input type="text" placeholder="Skanuj Kod QR lub wpisz..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mb-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="max-h-80 overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-2 mb-6">
                  {equipmentData.filter(i => i.status === 'available' && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => (
                    <div key={item.id} onClick={() => toggleItem(item)} className={`flex justify-between items-center p-4 mb-2 rounded-xl cursor-pointer transition-colors ${selectedItems.find(i => i.id === item.id) ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}>
                      <div><p className="text-sm font-black text-slate-800">{item.name}</p><p className="text-[10px] font-mono text-slate-500">{item.id}</p></div>
                      <div className="text-xl">{selectedItems.find(i => i.id === item.id) ? '✅' : '⬜'}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(2)} disabled={selectedItems.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg">Dalej: Weryfikacja ({selectedItems.length} szt.)</button>
              </div>
            )}

            {/* KROK 2 */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-6">Dane do Porozumienia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="Imię i Nazwisko Reprezentanta" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
                  <input type="text" placeholder="Nr albumu (np. 123456 = ban)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
                  <input type="text" placeholder="Nazwa Organizacji / Koła" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full md:col-span-2" />
                  <input type="text" placeholder="Adres zamieszkania / korespondencyjny" value={borrower.address} onChange={e => setBorrower({...borrower, address: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full md:col-span-2" />
                  <input type="date" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" title="Data Od" />
                  <input type="date" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" title="Data Do" />
                </div>
                {verificationStatus === 'blocked' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl"><p className="text-red-700 font-black text-sm uppercase tracking-widest">⚠️ Odmowa Wydania</p></div>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
                  <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1 flex items-center justify-center gap-2">
                    {isVerifying ? <span className="animate-pulse">Weryfikacja...</span> : <span>Generuj Dokument A4</span>}
                  </button>
                </div>
              </div>
            )}

            {/* KROK 3: A4 */}
            {step === 3 && (
              <div className="animate-fadeIn text-black font-serif text-[11px] md:text-[12px] leading-relaxed">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-1/2 text-[10px] leading-tight text-gray-600"><p className="font-bold">Samorząd Studentów</p><p>Uniwersytetu Ekonomicznego we Wrocławiu</p></div>
                  <div className="w-1/2 text-right text-[10px] leading-tight text-gray-800"><p className="font-bold">ZAŁĄCZNIK NR 1</p></div>
                </div>
                <div className="text-center mb-8"><h1 className="text-lg md:text-xl font-bold underline">POROZUMIENIE SPRZĘTOWE</h1><p className="font-bold uppercase">NR {docNumber}</p></div>
                
                <div className="text-justify mb-6">
                  <p className="mb-4">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
                  <p className="mb-2"><strong>1. SAMORZĄDEM STUDENTÓW UEW</strong>, reprezentowanym przez Administratora CRW, zwanym dalej <strong>„WYDAJĄCYM”</strong>,</p>
                  <p className="mb-4 font-bold">a</p>
                  <p className="mb-2"><strong>2. PODMIOT:</strong> <span className="font-bold uppercase border-b border-dotted border-gray-400 px-2">{borrower.organization || '\u00A0'}</span></p>
                  <div className="pl-4 space-y-2 mb-4">
                    <p>Pana/Panią: <span className="font-bold uppercase border-b border-dotted border-gray-400 px-2">{borrower.name}</span></p>
                    <p>Nr albumu: <span className="font-bold border-b border-dotted border-gray-400 px-2">{borrower.albumId}</span></p>
                    <p>Adres: <span className="border-b border-dotted border-gray-400 px-2">{borrower.address || '___________________________'}</span></p>
                  </div>
                  <p className="mb-6">zwanym dalej <strong>„KORZYSTAJĄCYM”</strong>.</p>
                </div>
                
                {/* Tabela skrócona na potrzeby widoku */}
                <div className="mb-10 page-break-inside-avoid">
                  <h2 className="font-bold text-center mb-2">ZAŁĄCZNIK: PROTOKÓŁ ZDAWCZO-ODBIORCZY</h2>
                  <table className="w-full border-collapse border border-black text-[10px] text-left">
                    <thead><tr className="bg-gray-100"><th className="border border-black p-1.5">NAZWA SPRZĘTU</th><th className="border border-black p-1.5">NR INWENTARZOWY</th></tr></thead>
                    <tbody>{selectedItems.map((item) => (<tr key={item.id}><td className="border border-black p-1.5 font-bold">{item.name}</td><td className="border border-black p-1.5 font-mono">{item.id}</td></tr>))}</tbody>
                  </table>
                </div>

                {/* Miejsce na Podpis */}
                <div className="mt-12 flex justify-between items-end pt-8 page-break-inside-avoid">
                  <div className="w-1/3 text-center border-t border-black pt-2"><p>(Podpis WYDAJĄCEGO)</p></div>
                  <div className="w-1/2 flex flex-col items-center">
                    <div className="w-full h-32 border-b border-black relative touch-none bg-blue-50/30 print:bg-transparent" title="Podpisz tutaj">
                      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair absolute top-0 left-0" width={400} height={128} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/>
                      {!signatureData && <div className="absolute inset-0 flex items-center justify-center opacity-20 font-black tracking-widest pointer-events-none print:hidden">PODPISZ TUTAJ (RYSYK)</div>}
                    </div>
                    <p className="mt-2">(Czytelny podpis <strong>KORZYSTAJĄCEGO</strong>)</p>
                  </div>
                </div>

                <div className="mt-10 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs flex-1 shadow-lg">🖨️ Zapisz jako PDF</button>
                  <button onClick={finalizeProtocol} disabled={!signatureData} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all">Zatwierdź w Systemie</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TRYB: WINDYKACJA / WEZWANIA PRZEDSĄDOWE */}
      {/* ========================================================= */}
      {adminMode === 'windykacja' && (
        <div className={`w-full ${showSummonsDocument ? 'max-w-[210mm] p-8 md:p-16' : 'max-w-3xl p-8'} bg-white rounded-[2rem] shadow-2xl print:shadow-none print:max-w-none print:w-full print:rounded-none animate-fadeIn`}>
          
          {!showSummonsDocument ? (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">⚖️</span>
                <div>
                  <h2 className="text-3xl font-black text-red-600">Generator Wezwań</h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Procedura przedsądowa</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <input type="text" placeholder="Imię i Nazwisko Dłużnika" value={summonsData.perpetrator} onChange={e => setSummonsData({...summonsData, perpetrator: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
                <input type="text" placeholder="Adres zamieszkania Dłużnika" value={summonsData.address} onChange={e => setSummonsData({...summonsData, address: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
                <input type="text" placeholder="Numer Protokołu Szkody (np. PS/12/2026)" value={summonsData.protocolNumber} onChange={e => setSummonsData({...summonsData, protocolNumber: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full md:col-span-2" />
                <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2">Zniszczony / Utracony Sprzęt</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nazwa sprzętu" value={summonsData.equipmentName} onChange={e => setSummonsData({...summonsData, equipmentName: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Marka" value={summonsData.brand} onChange={e => setSummonsData({...summonsData, brand: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Model" value={summonsData.model} onChange={e => setSummonsData({...summonsData, model: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSummonsDocument(true)}
                disabled={!summonsData.perpetrator || !summonsData.protocolNumber}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg"
              >
                Generuj Ostateczne Wezwanie (A4)
              </button>
            </div>
          ) : (
            /* WIDOK DOKUMENTU A4 - OSTATECZNE WEZWANIE */
            <div className="animate-fadeIn text-black font-serif text-[12px] leading-relaxed">
              
              <div className="text-right mb-12">
                <p>Wrocław, dnia {today} r.</p>
              </div>

              <div className="text-center mb-16">
                <h1 className="text-2xl font-black underline mb-2">OSTATECZNE PRZEDSĄDOWE WEZWANIE</h1>
                <p className="text-lg font-bold tracking-widest">DO NAPRAWIENIA SZKODY W MIENIU UCZELNI</p>
              </div>

              <div className="mb-12">
                <p className="font-bold underline mb-2">WEZWANY (SPRAWCA):</p>
                <p>Pan/Pani <strong>{summonsData.perpetrator || '...................................................'}</strong></p>
                <p>Adres: <strong>{summonsData.address || '...................................................'}</strong></p>
              </div>

              <div className="mb-8">
                <p><strong>DOTYCZY:</strong> Braku realizacji zobowiązania z Protokołu Szkody nr <strong>{summonsData.protocolNumber || '.........................'}</strong></p>
              </div>

              <div className="text-justify space-y-4 mb-12">
                <p>
                  W związku z bezskutecznym upływem terminu na naprawienie szkody polegającej na zniszczeniu/utracie sprzętu: <strong>{summonsData.equipmentName || '...........................................'}</strong>, niniejszym <strong>WZYWAM DO NATYCHMIASTOWEGO</strong>:
                </p>
                
                <div className="pl-6 space-y-4 font-bold my-6">
                  <p>1. Dostarczenia do siedziby Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu fabrycznie nowego urządzenia (marki: {summonsData.brand || '....................'}, modelu: {summonsData.model || '....................'});</p>
                  <p className="text-center">LUB</p>
                  <p>2. Przedłożenia dowodu opłacenia naprawy serwisowej.</p>
                </div>

                <p>
                  Wyznacza się ostateczny termin wykonania zobowiązania: <strong className="underline">7 dni</strong> od daty otrzymania niniejszego pisma.
                </p>
              </div>

              <div className="bg-gray-100 p-6 border border-gray-400 mb-16">
                <p className="font-black underline mb-2">POUCZENIE:</p>
                <p className="mb-2">Niewykonanie powyższego zobowiązania skutkować będzie:</p>
                <ol className="list-decimal pl-5 space-y-2 font-bold text-[11px]">
                  <li>Skierowaniem oficjalnego wniosku do Rzecznika Dyscyplinarnego dla Studentów o wszczęcie postępowania (co może skutkować zawieszeniem w prawach studenta lub wydaleniem z Uczelni).</li>
                  <li>Przekazaniem sprawy do Działu Prawnego Uniwersytetu celem skierowania powództwa cywilnego o naprawienie szkody.</li>
                </ol>
              </div>

              <div className="flex justify-end pt-8">
                <div className="text-center border-t border-black w-1/2 pt-2">
                  <p className="font-bold">(Podpis PRZEWODNICZĄCEGO SSUEW)</p>
                </div>
              </div>

              {/* Panel Akcji */}
              <div className="mt-16 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
                <button onClick={() => setShowSummonsDocument(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs">Wróć do edycji</button>
                <button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs flex-1 shadow-lg shadow-red-200">
                  🖨️ Drukuj / Zapisz Wezwanie (PDF)
                </button>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}