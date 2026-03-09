import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config';

export default function AdminEquipmentPanel() {
  const { user } = useAuth();
  const [adminMode, setAdminMode] = useState('wydawanie'); 

  const [allReservations, setAllReservations] = useState([]);
  const [allWydania, setAllWydania] = useState([]); // NOWOŚĆ: Baza wypożyczeń dla zakładki Zwroty
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // MODAL KALENDARZA
  const [approvalModal, setApprovalModal] = useState(null); 
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('12:00');
  const [selectedAdminEmail, setSelectedAdminEmail] = useState(ADMIN_EMAILS[0]);
  const [requesterEmail, setRequesterEmail] = useState('');

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
  // STANY DLA TRYBU: ZWROTY (NOWOŚĆ)
  // ==========================================
  const [selectedReturn, setSelectedReturn] = useState(null);

  // ==========================================
  // STANY DLA TRYBU: WINDYKACJA
  // ==========================================
  const [summonsData, setSummonsData] = useState({
    perpetrator: '', address: '', protocolNumber: '', equipmentName: '', brand: '', model: ''
  });
  const [showSummonsDocument, setShowSummonsDocument] = useState(false);

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

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
          setAllWydania(data.wydania || []); // Pobieranie aktywnych wydan
        }
      })
      .catch(err => console.error("Błąd ładowania danych:", err));
  };

  useEffect(() => { fetchAllData(); }, []);

  useEffect(() => {
    if (step === 2 && adminMode === 'wydawanie') {
      setDocNumber('Pobieranie...');
      fetch(`${API_URL}?action=getNextNumber`)
        .then(res => res.json())
        .then(data => {
          if (data.docNumber) setDocNumber(data.docNumber);
          else setDocNumber(`AWARYJNY/SSUEW/${new Date().getMonth()+1}/2026`);
        })
        .catch(() => setDocNumber(`BŁĄD/SSUEW/${new Date().getMonth()+1}/2026`));
    }
  }, [step, adminMode]);

  // PROCES AKCEPTACJI Z KALENDARZEM
  const initiateApproval = (rez) => {
    const emailMatch = rez.Kontakt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    setRequesterEmail(emailMatch ? emailMatch[1] : '');
    
    setApprovalModal({
      id: rez.ID,
      organizacja: rez.Organizacja_Cel,
      sprzetKody: rez.Sprzet_Kody
    });
  };

  const confirmAndSendInvite = async () => {
    setIsUpdatingStatus(true);
    
    const payload = {
      action: "updateRezerwacjaStatus",
      id: approvalModal.id,
      status: "Zatwierdzone",
      createEvent: true, 
      pickupDateTime: `${pickupDate}T${pickupTime}`,
      requesterEmail: requesterEmail,
      adminEmail: selectedAdminEmail,
      organizacja: approvalModal.organizacja,
      sprzetKody: approvalModal.sprzetKody
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      alert("Zatwierdzono! Zaproszenie na odbiór sprzętu wyleciało do kalendarza.");
      setApprovalModal(null);
      fetchAllData(); 
    } catch (err) {
      alert("Błąd przy zatwierdzaniu.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectReservation = async (id) => {
    setIsUpdatingStatus(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "updateRezerwacjaStatus", id: id, status: "Odrzucone" })
      });
      fetchAllData(); 
    } catch (err) {
      alert("Błąd przy odrzucaniu.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Ładne formatowanie daty
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

  // RYSOWANIE (CANVAS)
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

  // FINALIZACJA WYDANIA
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
      await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
      alert(`Sukces! Porozumienie ${docNumber} zapisane!`);
      setStep(1); setSelectedItems([]);
      setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: ''});
      setVerificationStatus(null); setSignatureData(null); setDocNumber('GENEROWANIE...');
      fetchAllData();
    } catch (error) {
      alert("Błąd zapisu.");
    } finally {
      setIsVerifying(false);
    }
  };

  // FINALIZACJA ZWROTU
  const processReturn = async () => {
    if(!signatureData) { alert("Podpisz protokół zwrotu!"); return; }
    setIsVerifying(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "zapiszZwrot", nrPorozumienia: selectedReturn['Nr Porozumienia'] })
      });
      alert(`Sprzęt z porozumienia ${selectedReturn['Nr Porozumienia']} został zwrócony na stan!`);
      setSelectedReturn(null);
      setSignatureData(null);
      fetchAllData();
    } catch (err) {
      alert("Błąd przetwarzania zwrotu.");
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
      
      <div className="w-full max-w-4xl flex flex-wrap bg-slate-800 rounded-2xl p-2 mb-6 border border-slate-700 shadow-xl print:hidden animate-slideUp gap-1">
        <button onClick={() => {setAdminMode('wydawanie'); setStep(1);}} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'wydawanie' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📦 Wydawanie</button>
        <button onClick={() => setAdminMode('rezerwacje')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'rezerwacje' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📩 Wnioski</button>
        <button onClick={() => {setAdminMode('zwroty'); setSelectedReturn(null);}} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'zwroty' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🔄 Zwroty</button>
        <button onClick={() => setAdminMode('windykacja')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'windykacja' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>⚖️ Windykacja</button>
      </div>

      {adminMode === 'wydawanie' && step === 1 && (
        <Link to="/skaner-ski" className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 w-full max-w-xl mb-8 print:hidden animate-fadeIn">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          </div>
          <div className="flex-1"><h3 className="text-xl font-black mb-0.5 tracking-tight drop-shadow-sm">Skaner Inwentaryzacji</h3><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Uruchom moduł SKI (QR / Barcode)</p></div>
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
                    <div><label className="text-xs font-bold text-slate-500 ml-1">Od kiedy</label><input type="datetime-local" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" /></div>
                    <div><label className="text-xs font-bold text-slate-500 ml-1">Do kiedy (zawity)</label><input type="datetime-local" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" /></div>
                  </div>
                  <input type="text" placeholder="Miejsce docelowe użytkowania sprzętu" value={borrower.location} onChange={e => setBorrower({...borrower, location: e.target.value})} className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2 mt-2" />
                </div>
                {verificationStatus === 'blocked' && (<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl"><p className="text-red-700 font-black text-sm uppercase tracking-widest">⚠️ Odmowa Wydania</p></div>)}
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
                  <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1">
                    {isVerifying ? 'Weryfikacja...' : 'Generuj Umowę'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div id="printable-document" className="animate-fadeIn text-black font-sans text-[9px] md:text-[10px] leading-tight">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-1/2 font-bold leading-tight"><p>Samorząd Studentów UEW</p></div>
                  <div className="w-1/2 text-right font-bold leading-tight"><p>ZAŁĄCZNIK NR 1</p><p>DO REGULAMINU GOSPODAROWANIA SSUEW</p></div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold underline">POROZUMIENIE SPRZĘTOWE</h1>
                  <p className="font-bold uppercase">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR {docNumber}</p>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
                  <p><strong>1. WYDAJĄCYM:</strong> Samorządem Studentów Uniwersytetu Ekonomicznego we Wrocławiu,</p>
                  <p className="font-bold mb-2 mt-2">a</p>
                  <p><strong>2. KORZYSTAJĄCYM:</strong></p>
                  <p className="font-bold uppercase border-b border-dotted border-gray-400 inline-block min-w-[300px] mb-1">{borrower.organization || '\u00A0'}</p>
                  <div className="mt-2 space-y-1">
                    <p>Reprezentowanym przez: <span className="font-bold uppercase border-b border-dotted border-gray-400 px-2">{borrower.name}</span></p>
                    <p>Nr albumu: <span className="font-bold border-b border-dotted border-gray-400 px-2">{borrower.albumId}</span></p>
                    <p>Adres: <span className="border-b border-dotted border-gray-400 px-2">{borrower.address || '...........................................'}</span></p>
                  </div>
                </div>
                
                <div className="text-justify space-y-3">
                  <p className="font-bold">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</p>
                  <p>Wydający oddaje w używanie na czas oznaczony Sprzęt określony w Protokole Zdawczo-Odbiorczym. Korzystający akceptuje Regulamin SSUEW.</p>
                  <p className="font-bold">§ 2. OKRES OBOWIĄZYWANIA I MIEJSCE</p>
                  <p>Sprzęt zostaje wydany od: <strong>{fromDT.date} {fromDT.time}</strong> do: <strong>{toDT.date} {toDT.time}</strong>.</p>
                  <p>Miejsce: <span className="font-bold">{borrower.location || '.....................................'}</span></p>
                  <p className="font-bold">§ 3. ZASADY ODPOWIEDZIALNOŚCI (SOLIDARNOŚĆ)</p>
                  <p>Reprezentant przyjmuje na siebie odpowiedzialność solidarną ze wskazanym Podmiotem za ewentualną szkodę (art. 366 § 1 k.c.).</p>
                </div>

                <div className="mt-6 page-break-inside-avoid">
                  <h2 className="font-bold mb-2">PROTOKÓŁ ZDAWCZO-ODBIORCZY</h2>
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
                      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair absolute top-0 left-0" width={300} height={96} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/>
                      {!signatureData && <div className="absolute inset-0 flex items-center justify-center opacity-20 font-black tracking-widest pointer-events-none print:hidden">PODPISZ TUTAJ</div>}
                    </div>
                    <p className="mt-2">(Podpis KORZYSTAJĄCEGO)</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
                  <button onClick={clearSignature} className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-xl font-bold uppercase text-[10px]">Wyczyść Podpis</button>
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-bold uppercase text-[10px] flex-1">🖨️ Zapisz PDF</button>
                  <button onClick={finalizeProtocol} disabled={!signatureData || isVerifying} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold uppercase text-[10px] disabled:opacity-50">Zatwierdź Umowę</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TRYB 2: SKRZYNKA WNIOSKÓW Z KALENDARZEM */}
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
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-3 py-1 bg-indigo-900/50 rounded-lg">
                      {formatResDate(rez.Data_Od)} ➔ {formatResDate(rez.Data_Do)}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Wniosek: {rez.ID}</span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-2">{rez.Organizacja_Cel}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic mb-6">Dane: {rez.Kontakt}</p>
                  
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Żądany sprzęt (Kody QR):</p>
                    <p className="text-xs font-bold text-emerald-400 leading-relaxed">📦 {rez.Sprzet_Kody}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => handleRejectReservation(rez.ID)} disabled={isUpdatingStatus} className="flex-1 py-3.5 bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50">Odrzuć</button>
                  <button onClick={() => initiateApproval(rez)} disabled={isUpdatingStatus} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all disabled:opacity-50">Zatwierdź ✅</button>
                </div>
              </div>
            ))}
            
            {allReservations.filter(r => r.Status === 'Oczekuje').length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center">
                 <span className="text-6xl mb-4 opacity-20">📭</span>
                 <p className="text-slate-400 font-black text-xl uppercase tracking-widest">Brak nowych wniosków</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL AKCEPTACJI REZERWACJI (DO KALENDARZA) */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setApprovalModal(null)} className="absolute top-6 right-6 text-slate-400 font-bold text-xl">✕</button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Ustal Termin Odbioru</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Zostanie utworzone spotkanie w Google Calendar</p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Dzień</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Godzina</label><input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wydający Zarządca</label>
                <select value={selectedAdminEmail} onChange={e => setSelectedAdminEmail(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold">
                  {ADMIN_EMAILS.map(email => <option key={email} value={email}>{email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mail Wnioskodawcy (Pobrano)</label>
                <input type="email" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 p-3 rounded-xl font-bold" />
              </div>
            </div>

            <button onClick={confirmAndSendInvite} disabled={!pickupDate || !requesterEmail || isUpdatingStatus} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50">
              {isUpdatingStatus ? 'Zatwierdzanie...' : 'Zatwierdź i Wyślij Zaproszenie'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TRYB 4: ZWROTY SPRZĘTU (NOWOŚĆ - ZAŁĄCZNIK 3) */}
      {/* ========================================================= */}
      {adminMode === 'zwroty' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {!selectedReturn ? (
            <div className="w-full bg-slate-800 p-8 rounded-[2rem] shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white mb-2">Przyjmowanie Zwrotów</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Wybierz aktywny protokół wydania</p>
              
              <div className="space-y-4">
                {allWydania.filter(w => w.Status === 'WYDANE').map((wyd, idx) => (
                  <div key={idx} onClick={() => setSelectedReturn(wyd)} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 p-5 rounded-2xl cursor-pointer transition-all flex justify-between items-center group">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">NR: {wyd['Nr Porozumienia']}</span>
                      <h3 className="text-lg font-bold text-white leading-tight">{wyd['Organizacja']}</h3>
                      <p className="text-xs text-slate-300 mt-1">Osoba: {wyd['Wypożyczający']}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase mb-2">Sprzęt: {String(wyd['Sprzęt (Kody QR)']).substring(0, 15)}...</p>
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase group-hover:bg-emerald-500">Odbierz</button>
                    </div>
                  </div>
                ))}
                {allWydania.filter(w => w.Status === 'WYDANE').length === 0 && (
                  <div className="text-center py-10 text-slate-500 font-bold">Wszystkie wydane sprzęty zostały zwrócone.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[210mm] bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl animate-fadeIn print:shadow-none print:w-full print:rounded-none">
              <button onClick={() => setSelectedReturn(null)} className="mb-6 text-slate-400 font-bold uppercase text-xs hover:text-slate-800 print:hidden">← Wróć do listy zwrotów</button>
              
              <div id="printable-document" className="text-black font-sans text-[9px] md:text-[10px] leading-tight">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-1/2 font-bold"><p>Samorząd Studentów UEW</p></div>
                  <div className="w-1/2 text-right font-bold"><p>ZAŁĄCZNIK NR 3</p><p>DO REGULAMINU GOSPODAROWANIA SSUEW</p></div>
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-sm font-bold underline">PROTOKÓŁ ZDAWCZO-ODBIORCZY - ZWROT</h1>
                  <p className="font-bold uppercase">DO POROZUMIENIA NR {selectedReturn['Nr Porozumienia']}</p>
                </div>

                <div className="text-justify space-y-4 mb-8">
                  <p>W dniu <strong>{today}</strong>, na podstawie Protokołu, następuje zwrot niżej wymienionego majątku użyczonego Organizacji/Projektowi: <strong>{selectedReturn['Organizacja']}</strong>, reprezentowanej przez: <strong>{selectedReturn['Wypożyczający']}</strong>.</p>
                  
                  <div className="bg-gray-100 p-4 border border-gray-400">
                    <p className="font-bold mb-2">ZWRACANY SPRZĘT (KODY QR):</p>
                    <p className="font-mono">{selectedReturn['Sprzęt (Kody QR)']}</p>
                  </div>

                  <p>1. Wydający (Przedstawiciel SSUEW) przyjmuje sprzęt i oświadcza, że w momencie zwrotu:</p>
                  <p className="ml-4">☐ Sprzęt nie nosi widocznych śladów uszkodzeń poza wynikającymi z normalnego zużycia.</p>
                  <p className="ml-4">☐ Stwierdzono usterki / braki (Należy niezwłocznie sporządzić Załącznik nr 8 - Protokół Szkody).</p>
                  <p>2. Z chwilą obustronnego podpisania niniejszego protokołu ustaje solidarna odpowiedzialność materialna Korzystającego, chyba że wady ukryte zostaną wykryte w ciągu 7 dni od zwrotu.</p>
                </div>

                <div className="mt-12 flex justify-between items-end pt-4 page-break-inside-avoid">
                  <div className="w-1/3 text-center border-t border-black pt-2"><p>(Podpis ZWRACAJĄCEGO)</p></div>
                  <div className="w-1/2 flex flex-col items-center">
                    <div className="w-full h-24 border-b border-black relative touch-none bg-emerald-50/30 print:bg-transparent" title="Podpisz tutaj">
                      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair absolute top-0 left-0" width={300} height={96} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/>
                      {!signatureData && <div className="absolute inset-0 flex items-center justify-center opacity-20 font-black tracking-widest pointer-events-none print:hidden">PODPISZ TUTAJ (PRZYJMUJĄCY SSUEW)</div>}
                    </div>
                    <p className="mt-2">(Podpis PRZYJMUJĄCEGO SSUEW)</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 print:hidden border-t-4 border-slate-100 pt-6">
                  <button onClick={clearSignature} className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-xl font-bold uppercase text-[10px]">Wyczyść Podpis</button>
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-bold uppercase text-[10px] flex-1">🖨️ Drukuj PDF</button>
                  <button onClick={processReturn} disabled={!signatureData || isVerifying} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold uppercase text-[10px] disabled:opacity-50">Zakończ Wypożyczenie</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TRYB 4: WINDYKACJA / WEZWANIA PRZEDSĄDOWE */}
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