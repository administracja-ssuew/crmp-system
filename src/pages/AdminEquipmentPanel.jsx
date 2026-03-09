import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminEquipmentPanel() {
  const [adminMode, setAdminMode] = useState('wydawanie'); 

  // ==========================================
  // STANY DLA NOWEJ ZAKŁADKI: WNIOSKI (REZERWACJE)
  // ==========================================
  const [allReservations, setAllReservations] = useState([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const [docNumber, setDocNumber] = useState('POBIERANIE...');

  // ==========================================
  // STANY DLA TRYBU: WINDYKACJA
  // ==========================================
  const [summonsData, setSummonsData] = useState({
    perpetrator: '', address: '', protocolNumber: '', equipmentName: '', brand: '', model: ''
  });
  const [showSummonsDocument, setShowSummonsDocument] = useState(false);

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  // POPRAWKA 3: TŁUMACZ DAT
  const formatResDate = (rawDate) => {
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(rawDate);
    }
  };

  // POBIERANIE BAZY SPRZĘTU ORAZ REZERWACJI Z CRW
  const fetchAllData = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const formatted = data.sprzet.map(item => ({
            id: item.KOD_QR || `BRAK-ID-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            accessories: item.INTERAKCJA || 'Brak'
          }));
          setEquipmentData(formatted);
          setAllReservations(data.rezerwacje || []); 
        }
      })
      .catch(err => console.error("Błąd ładowania danych:", err));
  };

  useEffect(() => { fetchAllData(); }, []);

  // OBSŁUGA ZMIANY STATUSU REZERWACJI PRZEZ ADMINA
  const handleUpdateReservationStatus = async (id, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "updateRezerwacjaStatus", id: id, status: newStatus })
      });
      fetchAllData(); 
    } catch (err) {
      alert("Błąd połączenia. Nie udało się zaktualizować statusu.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // POBIERANIE NOWEGO NUMERU POROZUMIENIA DLA WYDAŃ
  useEffect(() => {
    if (step === 2) {
      setDocNumber('Pobieranie...');
      fetch(`${API_URL}?action=getNextNumber`)
        .then(res => res.json())
        .then(data => {
          if (data.docNumber) setDocNumber(data.docNumber);
          else setDocNumber(`AWARYJNY/SSUEW/${new Date().getMonth()+1}/2026`);
        })
        .catch(() => setDocNumber(`BŁĄD/SSUEW/${new Date().getMonth()+1}/2026`));
    }
  }, [step]);

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
        alert("Wypełnij poprawnie podstawowe pola (Imię, Nazwisko, Nr albumu).");
      }
      setIsVerifying(false);
    }, 800);
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

  const finalizeProtocol = async () => {
    setIsVerifying(true);
    
    const equipmentList = selectedItems.map(item => item.id).join(', ');
    const payload = {
      action: "zapiszWydanie",
      nrPorozumienia: docNumber,
      osoba: borrower.name,
      organizacja: borrower.organization,
      sprzet: equipmentList
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      alert(`Sukces! Porozumienie ${docNumber} zostało zapisane w Bazie CRW! Pamiętaj wydrukować PDF!`);
      
      setStep(1);
      setSelectedItems([]);
      setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: ''});
      setVerificationStatus(null);
      setSignatureData(null);
      setDocNumber('GENEROWANIE...');
      
    } catch (error) {
      alert("Błąd zapisu. Prawdopodobnie skrypt Google zwrócił CORS, ale wniosek mógł się zapisać.");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const today = new Date().toLocaleDateString('pl-PL');
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: '....................', time: '........' };
    const [date, time] = dateTimeString.split('T');
    return { date, time };
  };

  const fromDT = formatDateTime(borrower.dateFrom);
  const toDT = formatDateTime(borrower.dateTo);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (equipmentData.length > 0 && location.state && location.state.scannedCodes) {
      const codesToFind = location.state.scannedCodes;
      const itemsToAdd = equipmentData.filter(item => codesToFind.includes(item.id) && item.status === 'available');

      if (itemsToAdd.length > 0) {
        setSelectedItems(prev => {
          const newItems = itemsToAdd.filter(newIt => !prev.find(p => p.id === newIt.id));
          return [...prev, ...newItems];
        });
        alert(`Skanowanie udane! Dodano ${itemsToAdd.length} przedmiotów do koszyka.`);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [equipmentData, location.state, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 flex flex-col items-center pb-20 print:bg-white print:p-0">
      
      <div className="w-full max-w-xl flex bg-slate-800 rounded-full p-2 mb-6 border border-slate-700 shadow-xl print:hidden animate-slideUp">
        <button 
          onClick={() => setAdminMode('wydawanie')}
          className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'wydawanie' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          📦 Wydawanie
        </button>
        <button 
          onClick={() => setAdminMode('rezerwacje')}
          className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'rezerwacje' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          📩 Wnioski
        </button>
        <button 
          onClick={() => setAdminMode('windykacja')}
          className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'windykacja' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          ⚖️ Windykacja
        </button>
      </div>

      {adminMode === 'wydawanie' && (
        <Link 
          to="/skaner-ski"
          className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-5 w-full max-w-xl hover:-translate-y-1 mb-8 print:hidden animate-fadeIn"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-0.5 tracking-tight drop-shadow-sm">Skaner Inwentaryzacji</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Uruchom moduł SKI (QR / Barcode)</p>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 group-hover:bg-white text-white group-hover:text-emerald-600 transition-all duration-300 shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      )}

      {/* ========================================================= */}
      {/* TRYB 1: WYDAWANIE SPRZĘTU */}
      {/* ========================================================= */}
      {adminMode === 'wydawanie' && (
        <>
          <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-3xl border border-slate-700 print:hidden animate-fadeIn">
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Koszyk</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Formularz</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. Dokument</div>
          </div>

          <div className={`w-full ${step === 3 ? 'max-w-[210mm] p-6 md:p-10' : 'max-w-3xl p-8'} bg-white rounded-[2rem] shadow-2xl print:shadow-none print:max-w-none print:w-full print:rounded-none`}>
            
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
                <button onClick={() => setStep(2)} disabled={selectedItems.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg">Dalej: Formularz ({selectedItems.length} szt.)</button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-6">Dane do Porozumienia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="Imię i Nazwisko Reprezentanta" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                  <input type="text" placeholder="Nr albumu (legitymacji)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                  <input type="text" placeholder="Pełna nazwa Organizacji / Projektu" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2" />
                  <input type="text" placeholder="Adres zamieszkania / korespondencyjny" value={borrower.address} onChange={e => setBorrower({...borrower, address: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2" />
                  <input type="text" placeholder="Nr telefonu" value={borrower.phone} onChange={e => setBorrower({...borrower, phone: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                  <input type="email" placeholder="E-mail" value={borrower.email} onChange={e => setBorrower({...borrower, email: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                  
                  <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Od kiedy (data i godz.)</label>
                      <input type="datetime-local" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Do kiedy (termin zawity)</label>
                      <input type="datetime-local" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" />
                    </div>
                  </div>
                  <input type="text" placeholder="Miejsce docelowe użytkowania sprzętu" value={borrower.location} onChange={e => setBorrower({...borrower, location: e.target.value})} className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2 mt-2" />
                </div>
                {verificationStatus === 'blocked' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl"><p className="text-red-700 font-black text-sm uppercase tracking-widest">⚠️ Odmowa Wydania</p></div>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
                  <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1 flex items-center justify-center gap-2">
                    {isVerifying ? <span className="animate-pulse">Weryfikacja...</span> : <span>Generuj Umowę</span>}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div id="printable-document" className="animate-fadeIn text-black font-sans text-[9px] md:text-[10px] leading-tight">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-1/2 font-bold leading-tight">
                    <p>Samorząd Studentów</p>
                    <p>Uniwersytetu Ekonomicznego</p>
                    <p>we Wrocławiu</p>
                  </div>
                  <div className="w-1/2 text-right font-bold leading-tight">
                    <p>ZAŁĄCZNIK NR 1</p>
                    <p>DO REGULAMINU GOSPODAROWANIA</p>
                    <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU</p>
                    <p>STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU</p>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold underline">POROZUMIENIE SPRZĘTOWE</h1>
                  <p className="font-bold uppercase">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR {docNumber}</p>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
                  <p><strong>1. SAMORZĄDEM STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU,</strong></p>
                  <p>reprezentowanym przez Dysponenta / Operatora Systemu:</p>
                  <p className="mb-2">........................................................................... zwanym dalej <strong>„WYDAJĄCYM"</strong>,</p>
                  <p className="font-bold mb-2">a</p>
                  <p><strong>2. PODMIOT:</strong></p>
                  <p className="font-bold uppercase border-b border-dotted border-gray-400 inline-block min-w-[300px] mb-1">{borrower.organization || '\u00A0'}</p>
                  <p className="mb-1 text-[8px] text-gray-500">(pełna nazwa Organizacji Studenckiej / Koła Naukowego i/lub Projektu) reprezentowaną przez:</p>
                  
                  <div className="mt-2 space-y-1">
                    <p>Pana/Panią: <span className="font-bold uppercase border-b border-dotted border-gray-400 px-2">{borrower.name}</span></p>
                    <p className="text-[8px] text-gray-500">(imię i nazwisko Reprezentanta)</p>
                    <p>Nr albumu (legitymacji): <span className="font-bold border-b border-dotted border-gray-400 px-2">{borrower.albumId}</span></p>
                    <p>Adres zamieszkania/korespondencyjny: <span className="border-b border-dotted border-gray-400 px-2">{borrower.address || '...................................................'}</span></p>
                    <p>Nr telefonu: <span className="border-b border-dotted border-gray-400 px-2">{borrower.phone || '......................'}</span> E-mail: <span className="border-b border-dotted border-gray-400 px-2">{borrower.email || '......................'}</span></p>
                  </div>
                  <p className="mt-2">zwanym dalej <strong>„KORZYSTAJĄCYM"</strong>.</p>
                </div>
                
                <div className="text-justify space-y-3">
                  <p className="font-bold">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</p>
                  <p>1. Wydający oddaje Korzystającemu w bezpłatne używanie na czas oznaczony Sprzęt określony szczegółowo w Protokole Zdawczo-Odbiorczym (Załącznik nr 2), stanowiącym integralną część niniejszej umowy.</p>
                  <p>2. Korzystający oświadcza, że zapoznał się z treścią "Regulaminu Gospodarowania Składnikami Majątku Ruchomego Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu" (dalej: Regulamin), w pełni akceptuje jego postanowienia, w tym zasady odpowiedzialności materialnej, i zobowiązuje się do ich ścisłego przestrzegania.</p>

                  <p className="font-bold">§ 2. OKRES OBOWIĄZYWANIA I MIEJSCE</p>
                  <p>1. Sprzęt zostaje wydany na okres:<br/>
                      OD dnia: <strong>{fromDT.date}</strong> godz. <strong>{fromDT.time}</strong><br/>
                      DO dnia: <strong>{toDT.date}</strong> godz. <strong>{toDT.time}</strong>
                  </p>
                  <p>2. Miejscem docelowym użytkowania Sprzętu jest: <span className="font-bold">{borrower.location || '..................................................................'}</span></p>
                  <p>3. Termin zwrotu określony w ust. 1 jest terminem zawitym. Przekroczenie terminu bez uprzedniej pisemnej zgody Wydającego skutkuje:<br/>
                      a. Natychmiastowym rozwiązaniem umowy;<br/>
                      b. Nałożeniem blokady na wypożyczenia (karencja);<br/>
                      c. Powstaniem roszczenia o naprawienie szkody poprzez zapłatę pełnej wartości odtworzeniowej przedmiotu (zakup fabrycznie nowego urządzenia o identycznych lub lepszych parametrach), w przypadku jego utraty, zniszczenia lub trwałego uszkodzenia w okresie po upływie terminu zwrotu.
                  </p>

                  <p className="font-bold">§ 3. ZASADY ODPOWIEDZIALNOŚCI (SOLIDARNOŚĆ)</p>
                  <p>1. Korzystający ponosi pełną odpowiedzialność materialną za powierzone mienie na zasadzie ryzyka, od momentu jego wydania do momentu zwrotu potwierdzonego przez Wydającego.</p>
                  <p>2. Reprezentant podpisujący niniejszą umowę oświadcza, iż jest umocowany do działania w imieniu wskazanego w komparycji Podmiotu.</p>
                  <p>3. Na podstawie art. 366 § 1 Kodeksu cywilnego, Reprezentant przyjmuje na siebie odpowiedzialność solidarną ze wskazany Podmiot za wszelkie zobowiązania wynikające z niniejszej umowy, w tym w szczególności za naprawienie szkody wynikłej z utraty, kradzieży lub uszkodzenia Sprzętu.</p>
                  <p>4. Wydający uprawniony jest do dochodzenia całości roszczenia od Reprezentanta z jego majątku osobistego, niezależnie od stanu finansów Podmiotu.</p>

                  <p className="font-bold">§ 4. BEZPIECZEŃSTWO I DANE OSOBOWE</p>
                  <p>1. Korzystający zobowiązuje się do używania Sprzętu zgodnie z jego przeznaczeniem oraz zasadami BHP.</p>
                  <p>2. W przypadku powstania szkody lub utraty Sprzętu, Korzystający zobowiązuje się do niezwłocznego uzupełnienia danych osobowych niezbędnych do dochodzenia roszczeń, na wezwanie Wydającego w Protokole Szkody.</p>

                  <p className="font-bold">§ 5. DORĘCZENIA I POSTANOWIENIA KOŃCOWE</p>
                  <p>1. Korzystający zobowiązuje się do informowania Wydającego o każdej zmianie adresu pod rygorem uznania doręczenia na adres wskazany w komparycji umowy za skuteczne po upływie 7 dni od nadania (fikcja doręczenia).</p>
                  <p>2. W sprawach nieuregulowanych zastosowanie mają przepisy Regulaminu oraz Kodeksu cywilnego.</p>
                  <p>3. Sądem właściwym do rozstrzygania sporów jest Sąd powszechny właściwy miejscowo dla siedziby Wydającego.</p>
                </div>

                <div className="mt-6 page-break-inside-avoid">
                  <h2 className="font-bold mb-2">ZAŁĄCZNIK NR 2: PROTOKÓŁ ZDAWCZO-ODBIORCZY</h2>
                  <table className="w-full border-collapse border border-black text-[9px] text-left">
                    <thead><tr className="bg-gray-100"><th className="border border-black p-1.5">L.P.</th><th className="border border-black p-1.5">NAZWA SPRZĘTU</th><th className="border border-black p-1.5">NR INWENTARZOWY</th></tr></thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-bold">{item.name}</td>
                          <td className="border border-black p-1.5 font-mono">{item.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 flex justify-between items-end pt-4 page-break-inside-avoid">
                  <div className="w-1/3 text-center border-t border-black pt-2"><p>(Podpis WYDAJĄCEGO)</p></div>
                  <div className="w-1/2 flex flex-col items-center">
                    <div className="w-full h-24 border-b border-black relative touch-none bg-blue-50/30 print:bg-transparent" title="Podpisz tutaj">
                      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair absolute top-0 left-0" width={300} height={96} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/>
                      {!signatureData && <div className="absolute inset-0 flex items-center justify-center opacity-20 font-black tracking-widest pointer-events-none print:hidden">PODPISZ TUTAJ</div>}
                    </div>
                    <p className="mt-2">(Czytelny podpis <strong>KORZYSTAJĄCEGO</strong>)</p>
                  </div>
                </div>
                
                <div className="mt-8 text-[7px] text-gray-400 text-center border-t border-gray-200 pt-2">
                   Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu | ul. Kamienna 43, 53-307 Wrocław | e-mail: kontakt@samorzad.ue.wroc.pl | samorzad.ue.wroc.pl
                </div>

                <div className="mt-8 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
                  <button onClick={clearSignature} className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors">Wyczyść Podpis</button>
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex-1 shadow-lg">🖨️ Zapisz jako PDF</button>
                  <button onClick={finalizeProtocol} disabled={!signatureData || isVerifying} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all">
                    {isVerifying ? 'Zapisywanie...' : 'Zatwierdź Umowę'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TRYB 2: SKRZYNKA WNIOSKÓW (ZARZĄDZANIE REZERWACJAMI) */}
      {/* ========================================================= */}
      {adminMode === 'rezerwacje' && (
        <div className="w-full max-w-5xl animate-fadeIn">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Wnioski o Rezerwację</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Zarządzanie Kalendarzem Majątku (CRW)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allReservations.filter(r => r.Status === 'Oczekuje').map(rez => (
              <div key={rez.ID} className="bg-slate-800 border border-slate-700 p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between group hover:border-indigo-500 transition-all">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    {/* === POPRAWKA 3: TŁUMACZENIE BRZYDKICH DAT NA EKRANIE ADMINA === */}
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-3 py-1 bg-indigo-900/50 rounded-lg">
                      {formatResDate(rez.Data_Od)} ➔ {formatResDate(rez.Data_Do)}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Wniosek: {rez.ID}</span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-2">{rez.Organizacja_Cel}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic mb-6">Osoba: {rez.Kontakt}</p>
                  
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Żądany sprzęt (Kody QR):</p>
                    <p className="text-xs font-bold text-emerald-400 leading-relaxed">📦 {rez.Sprzet_Kody}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleUpdateReservationStatus(rez.ID, 'Odrzucone')} 
                    disabled={isUpdatingStatus}
                    className="flex-1 py-3.5 bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all duration-300 disabled:opacity-50"
                  >
                    Odrzuć
                  </button>
                  <button 
                    onClick={() => handleUpdateReservationStatus(rez.ID, 'Zatwierdzone')} 
                    disabled={isUpdatingStatus}
                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50"
                  >
                    Zatwierdź Rezerwację
                  </button>
                </div>
              </div>
            ))}
            
            {allReservations.filter(r => r.Status === 'Oczekuje').length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center">
                 <span className="text-6xl mb-4 opacity-20">📭</span>
                 <p className="text-slate-400 font-black text-xl uppercase tracking-widest">Brak nowych wniosków</p>
                 <p className="text-slate-500 font-bold text-sm mt-2">Wszystkie rezerwacje zostały rozpatrzone.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TRYB 3: WINDYKACJA / WEZWANIA PRZEDSĄDOWE */}
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
            <div id="printable-document" className="animate-fadeIn text-black font-serif text-[12px] leading-relaxed">
              <div className="text-right mb-12"><p>Wrocław, dnia {today} r.</p></div>
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
                <p>W związku z bezskutecznym upływem terminu na naprawienie szkody polegającej na zniszczeniu/utracie sprzętu: <strong>{summonsData.equipmentName || '...........................................'}</strong>, niniejszym <strong>WZYWAM DO NATYCHMIASTOWEGO</strong>:</p>
                <div className="pl-6 space-y-4 font-bold my-6">
                  <p>1. Dostarczenia do siedziby Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu fabrycznie nowego urządzenia (marki: {summonsData.brand || '....................'}, modelu: {summonsData.model || '....................'});</p>
                  <p className="text-center">LUB</p>
                  <p>2. Przedłożenia dowodu opłacenia naprawy serwisowej.</p>
                </div>
                <p>Wyznacza się ostateczny termin wykonania zobowiązania: <strong className="underline">7 dni</strong> od daty otrzymania niniejszego pisma.</p>
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