import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config';

export default function AdminEquipmentPanel() {
  const { user } = useAuth();
  const [adminMode, setAdminMode] = useState('wydawanie'); 

  const [allReservations, setAllReservations] = useState([]);
  const [allWydania, setAllWydania] = useState([]); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [approvalModal, setApprovalModal] = useState(null); 
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('12:00');
  const [selectedAdminEmail, setSelectedAdminEmail] = useState(user?.email || ADMIN_EMAILS[0]);
  const [requesterEmail, setRequesterEmail] = useState('');

  const [step, setStep] = useState(1);
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // POPRAWKA: Dodano adminName i adminRole do formularza!
  const [borrower, setBorrower] = useState({
    name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: '',
    adminName: '', adminRole: 'Członek Zarządu SSUEW'
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // === PODPISY (WYSOKA ROZDZIELCZOŚĆ) ===
  const canvasBorrowerRef = useRef(null);
  const canvasAdminRef = useRef(null);
  
  const [isDrawingBorrower, setIsDrawingBorrower] = useState(false);
  const [isDrawingAdmin, setIsDrawingAdmin] = useState(false);
  
  const [sigBorrowerData, setSigBorrowerData] = useState(null);
  const [sigAdminData, setSigAdminData] = useState(null);

  const [docNumber, setDocNumber] = useState('POBIERANIE...');
  
  // ZWROTY: Potrzebujemy obu podpisów
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnStep, setReturnStep] = useState(1);

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
          setAllWydania(data.wydania || []); 
        }
      });
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
        });
    }
  }, [step, adminMode]);

  const initiateApproval = (rez) => {
    const emailMatch = rez.Kontakt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    setRequesterEmail(emailMatch ? emailMatch[1] : '');
    setApprovalModal({ id: rez.ID, organizacja: rez.Organizacja_Cel, sprzetKody: rez.Sprzet_Kody });
  };

  const confirmAndSendInvite = async () => {
    setIsUpdatingStatus(true);
    const payload = {
      action: "updateRezerwacjaStatus", id: approvalModal.id, status: "Zatwierdzone", createEvent: true, 
      pickupDateTime: `${pickupDate}T${pickupTime}`, requesterEmail: requesterEmail, adminEmail: selectedAdminEmail,
      organizacja: approvalModal.organizacja, sprzetKody: approvalModal.sprzetKody
    };
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const result = await response.json();
      alert(`Wniosek Zatwierdzony!\nKalendarz: ${result.message || 'Zapisano'}`); 
      setApprovalModal(null); fetchAllData(); 
    } catch (err) { alert("Błąd przy zatwierdzaniu."); } finally { setIsUpdatingStatus(false); }
  };

  const handleRejectReservation = async (id) => {
    setIsUpdatingStatus(true);
    try {
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "updateRezerwacjaStatus", id: id, status: "Odrzucone" }) });
      fetchAllData(); 
    } catch (err) { alert("Błąd przy odrzucaniu."); } finally { setIsUpdatingStatus(false); }
  };

  const formatResDate = (rawDate) => {
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return String(rawDate); }
  };

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    else setSelectedItems([...selectedItems, item]);
  };

  const verifyBorrower = () => {
    setIsVerifying(true); setVerificationStatus(null);
    setTimeout(() => {
      if (borrower.albumId === '123456') { setVerificationStatus('blocked'); } 
      else if (borrower.albumId.length >= 3 && borrower.name.length > 2 && borrower.adminName.length > 2) { setVerificationStatus('ok'); setStep(3); } 
      else { alert("Wypełnij poprawnie podstawowe pola (Imię, Nazwisko, Nr albumu oraz Dane Dysponenta)."); }
      setIsVerifying(false);
    }, 800);
  };

  // === RYSOWANIE ODPORNE NA PIKSELOZĘ (SKALOWANIE) ===
  const handleStartDraw = (e, ref, setDrawingState) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); const rect = c.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    const scaleX = c.width / rect.width; const scaleY = c.height / rect.height;
    ctx.beginPath(); ctx.moveTo(x * scaleX, y * scaleY); setDrawingState(true);
  };

  const handleDraw = (e, ref, isDrawingState) => {
    if (!isDrawingState) return; e.preventDefault();
    const c = ref.current; const ctx = c.getContext('2d'); const rect = c.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    const scaleX = c.width / rect.width; const scaleY = c.height / rect.height;
    ctx.lineTo(x * scaleX, y * scaleY); 
    ctx.strokeStyle = '#000080'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  const clearSignatures = () => { 
    if (canvasBorrowerRef.current) { const ctx = canvasBorrowerRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasBorrowerRef.current.width, canvasBorrowerRef.current.height); setSigBorrowerData(null); }
    if (canvasAdminRef.current) { const ctx = canvasAdminRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasAdminRef.current.width, canvasAdminRef.current.height); setSigAdminData(null); }
  };

  const finalizeProtocol = async () => {
    if(!sigBorrowerData || !sigAdminData) {
      alert("Protokół musi zostać podpisany przez obie strony (Studenta i Dysponenta)!"); return;
    }
    setIsVerifying(true);
    const equipmentList = selectedItems.map(item => item.id).join(', ');
    const payload = {
      action: "zapiszWydanie", 
      nrPorozumienia: docNumber, 
      osoba: borrower.name, 
      albumId: borrower.albumId,
      organizacja: borrower.organization, 
      sprzet: equipmentList,
      dateFrom: `${borrower.dateFrom.replace('T', ' ')}`,
      dateTo: `${borrower.dateTo.replace('T', ' ')}`,
      location: borrower.location || "Na terenie kampusu",
      address: borrower.address || "Brak",
      phone: borrower.phone || "Brak",
      email: borrower.email,
      adminName: `${borrower.adminName} (${borrower.adminRole})`, // IMIĘ ADMINA
      sigBorrower: sigBorrowerData,
      sigAdmin: sigAdminData
    };

    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const resData = await response.json();
      alert(`Wydanie sfinalizowane! \nCyfrowy PDF został zapisany na Dysku.\nLink: ${resData.link}`);
      setStep(1); setSelectedItems([]); setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: '', adminName: '', adminRole: 'Członek Zarządu SSUEW'}); clearSignatures(); setDocNumber('GENEROWANIE...');
      setTimeout(() => fetchAllData(), 500);
    } catch (error) { alert("Błąd przetwarzania umowy cyfrowej."); } finally { setIsVerifying(false); }
  };

  const processReturn = async () => {
    if(!sigBorrowerData || !sigAdminData) { alert("Podpisz protokół zwrotu (Obie strony)!"); return; }
    setIsVerifying(true);
    try {
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "zapiszZwrot", nrPorozumienia: selectedReturn['Nr_Porozumienia'] || selectedReturn['Nr Porozumienia'] || selectedReturn['Data'] }) });
      alert(`Sprzęt został poprawnie zwrócony na stan!`);
      setSelectedReturn(null); setReturnStep(1); clearSignatures(); setBorrower({...borrower, adminName: ''});
      setTimeout(() => fetchAllData(), 500);
    } catch (err) { alert("Błąd przetwarzania zwrotu."); } finally { setIsVerifying(false); }
  };

  const today = new Date().toLocaleDateString('pl-PL');
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: '....................', time: '........' };
    const [date, time] = dateTimeString.split('T'); return { date, time };
  };
  const fromDT = formatDateTime(borrower.dateFrom); const toDT = formatDateTime(borrower.dateTo);

  const activeWydania = allWydania.filter(w => {
    const status = String(w.STATUS || w.Status || w.status || '').trim().toUpperCase();
    return status === 'WYDANE';
  });

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 flex flex-col items-center pb-20 print:bg-white print:p-0">
      
      <div className="w-full max-w-4xl flex flex-wrap bg-slate-800 rounded-2xl p-2 mb-6 border border-slate-700 shadow-xl print:hidden animate-slideUp gap-1">
        <button onClick={() => {setAdminMode('wydawanie'); setStep(1);}} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'wydawanie' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📦 Wydawanie</button>
        <button onClick={() => setAdminMode('rezerwacje')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'rezerwacje' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📩 Wnioski</button>
        <button onClick={() => {setAdminMode('zwroty'); setSelectedReturn(null); setReturnStep(1);}} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'zwroty' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🔄 Zwroty</button>
        <button onClick={() => setAdminMode('windykacja')} className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'windykacja' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>⚖️ Windykacja</button>
      </div>

      {/* ========================================================= */}
      {/* TRYB 1: WYDAWANIE SPRZĘTU (DANE ADMINA + OSTRE KANWY) */}
      {/* ========================================================= */}
      {adminMode === 'wydawanie' && (
        <>
          <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-3xl border border-slate-700 print:hidden animate-fadeIn">
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Koszyk</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Formularz</div>
            <div className="h-px bg-slate-600 flex-1 mx-4"></div>
            <div className={`text-xs font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. E-Dokument</div>
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
                <h2 className="text-3xl font-black text-slate-900 mb-2">Dane do Porozumienia</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Wypełnij precyzyjnie dane obu stron</p>
                
                {/* DANE DYSPONENTA */}
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl mb-6">
                  <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-3">1. Dane Wydającego (Twoje dane)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Imię i Nazwisko Wydającego" value={borrower.adminName} onChange={e => setBorrower({...borrower, adminName: e.target.value})} className="bg-white border border-indigo-200 p-3 rounded-xl text-sm font-bold w-full" />
                    <input type="text" placeholder="Funkcja (np. Członek Zarządu)" value={borrower.adminRole} onChange={e => setBorrower({...borrower, adminRole: e.target.value})} className="bg-white border border-indigo-200 p-3 rounded-xl text-sm font-bold w-full" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">2. Dane Korzystającego (Studenta)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Imię i Nazwisko Reprezentanta" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                    <input type="text" placeholder="Nr albumu (legitymacji)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold w-full" />
                    <input type="text" placeholder="Pełna nazwa Organizacji / Projektu" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2" />
                    <input type="email" placeholder="E-mail (Do wysyłki PDF umowy)" value={borrower.email} onChange={e => setBorrower({...borrower, email: e.target.value})} className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold w-full md:col-span-2" />
                    
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                      <div><label className="text-[10px] font-bold text-slate-500 ml-1">Od kiedy</label><input type="datetime-local" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 ml-1">Do kiedy</label><input type="datetime-local" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold w-full mt-1" /></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
                  <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1">
                    {isVerifying ? 'Weryfikacja...' : 'Przejdź do Podpisów'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div id="printable-document" className="animate-fadeIn text-black font-sans text-[10px] md:text-[11px] leading-relaxed">
                <div className="flex justify-between items-start mb-6 text-[9px] text-gray-600 font-bold uppercase">
                  <div>Samorząd Studentów UEW</div>
                  <div className="text-right">Załącznik Nr 1 do Regulaminu SSUEW</div>
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-base font-black underline mb-1">POROZUMIENIE SPRZĘTOWE</h1>
                  <p className="font-bold uppercase tracking-widest">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR {docNumber}</p>
                </div>
                
                <div className="mb-6">
                  <p className="mb-3">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
                  <p className="mb-1"><strong>1. WYDAJĄCYM:</strong> Samorządem Studentów Uniwersytetu Ekonomicznego we Wrocławiu,</p>
                  <p className="ml-4 text-gray-700">reprezentowanym przez: <strong>{borrower.adminName}</strong> ({borrower.adminRole})</p>
                  <p className="font-bold my-2 text-center">a</p>
                  <p className="mb-1"><strong>2. KORZYSTAJĄCYM:</strong> <strong>{borrower.organization || '...........................................'}</strong></p>
                  <p className="ml-4 text-gray-700 mb-1">reprezentowaną przez: <strong>{borrower.name}</strong></p>
                  <p className="ml-4 text-gray-700">Nr albumu: <strong>{borrower.albumId}</strong> | E-mail: <strong>{borrower.email}</strong></p>
                </div>
                
                <div className="text-justify space-y-4 border-t border-b border-gray-300 py-6 mb-6">
                  <div>
                    <p className="font-bold">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</p>
                    <p>Wydający oddaje Korzystającemu w bezpłatne używanie na czas oznaczony Sprzęt określony szczegółowo w Protokole (Załącznik nr 2). Korzystający akceptuje Regulamin SSUEW i jego postanowienia.</p>
                  </div>
                  <div>
                    <p className="font-bold">§ 2. OKRES OBOWIĄZYWANIA</p>
                    <p>Sprzęt zostaje wydany od: <strong>{fromDT.date} {fromDT.time}</strong> do: <strong>{toDT.date} {toDT.time}</strong>.</p>
                  </div>
                  <div>
                    <p className="font-bold">§ 3. ZASADY ODPOWIEDZIALNOŚCI</p>
                    <p>Korzystający przyjmuje na siebie odpowiedzialność solidarną (art. 366 § 1 k.c.) za wszelkie zobowiązania wynikające z umowy, w tym za szkodę wynikłą z utraty lub uszkodzenia Sprzętu.</p>
                  </div>
                </div>

                <div className="mb-10 page-break-inside-avoid">
                  <h2 className="font-bold mb-3 bg-gray-100 p-2 text-center border border-black">ZAŁĄCZNIK NR 2: PROTOKÓŁ ZDAWCZO-ODBIORCZY</h2>
                  <table className="w-full border-collapse border border-black text-left">
                    <thead><tr className="bg-gray-50"><th className="border border-black p-2 w-12 text-center">L.P.</th><th className="border border-black p-2">NAZWA SPRZĘTU</th><th className="border border-black p-2">KOD INWENTARZOWY</th></tr></thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black p-2">{item.name}</td>
                          <td className="border border-black p-2 font-mono text-[9px]">{item.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-end gap-6 page-break-inside-avoid">
                  <div className="w-1/2 flex flex-col items-center">
                    <div className="w-full h-32 border-2 border-dashed border-indigo-200 relative touch-none bg-indigo-50/30 print:bg-transparent print:border-solid print:border-black rounded-xl overflow-hidden" title="Podpis Admina">
                      {/* WYSOKA ROZDZIELCZOŚĆ CANVAS! */}
                      <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                      {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-black tracking-widest pointer-events-none print:hidden text-xs text-center text-indigo-900">PODPIS WYDAJĄCEGO<br/>(ADMIN)</div>}
                    </div>
                    <p className="mt-3 font-bold text-[9px] uppercase tracking-widest text-gray-500">(Podpis WYDAJĄCEGO)</p>
                  </div>
                  
                  <div className="w-1/2 flex flex-col items-center">
                    <div className="w-full h-32 border-2 border-dashed border-emerald-200 relative touch-none bg-emerald-50/30 print:bg-transparent print:border-solid print:border-black rounded-xl overflow-hidden" title="Podpis Studenta">
                      <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                      {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-black tracking-widest pointer-events-none print:hidden text-xs text-center text-emerald-900">PODPIS KORZYSTAJĄCEGO<br/>(STUDENT)</div>}
                    </div>
                    <p className="mt-3 font-bold text-[9px] uppercase tracking-widest text-gray-500">(Podpis KORZYSTAJĄCEGO)</p>
                  </div>
                </div>

                <div className="mt-12 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                  <button onClick={clearSignatures} className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors">Wyczyść</button>
                  <button onClick={finalizeProtocol} disabled={!sigBorrowerData || !sigAdminData || isVerifying} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs flex-1 shadow-2xl transition-all">
                    {isVerifying ? 'Generowanie E-Dokumentu...' : 'Zatwierdź Wydanie (Wyślij PDF)'}
                  </button>
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
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-3 py-1 bg-indigo-900/50 rounded-lg">{formatResDate(rez.Data_Od)} ➔ {formatResDate(rez.Data_Do)}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Wniosek: {rez.ID}</span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-2">{rez.Organizacja_Cel}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic mb-6">Dane: {rez.Kontakt}</p>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Żądany sprzęt (Kody QR):</p><p className="text-xs font-bold text-emerald-400 leading-relaxed">📦 {rez.Sprzet_Kody}</p></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleRejectReservation(rez.ID)} disabled={isUpdatingStatus} className="flex-1 py-3.5 bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50">Odrzuć</button>
                  <button onClick={() => initiateApproval(rez)} disabled={isUpdatingStatus} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all disabled:opacity-50">Zatwierdź ✅</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TRYB 3: ZWROTY SPRZĘTU (ZAŁĄCZNIK 3 - DWA PODPISY) */}
      {/* ========================================================= */}
      {adminMode === 'zwroty' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {!selectedReturn ? (
            <div className="w-full bg-slate-800 p-8 rounded-[2rem] shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white mb-2">Przyjmowanie Zwrotów</h2>
              <div className="space-y-4 mt-6">
                {activeWydania.map((wyd, idx) => (
                  <div key={idx} onClick={() => {setSelectedReturn(wyd); setReturnStep(1);}} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 p-5 rounded-2xl cursor-pointer transition-all flex justify-between items-center group shadow-md">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">NR: {wyd['Nr_Porozumienia'] || wyd['Nr Porozumienia'] || wyd['Data']}</span>
                      <h3 className="text-lg font-bold text-white leading-tight">{wyd['Organizator'] || wyd['Organizacja']}</h3>
                      <p className="text-xs text-slate-300 mt-1">Osoba: {wyd['Kto_wypozyczyl'] || wyd['Wypożyczający']}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase mb-2">Sprzęt: {String(wyd['SPRZĘT'] || wyd['Sprzęt (Kody QR)'] || '').substring(0, 15)}...</p>
                      <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg group-hover:bg-emerald-500 transition-colors">Wybierz</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[210mm] bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl animate-fadeIn print:shadow-none print:w-full print:rounded-none">
              
              {returnStep === 1 && (
                <div className="animate-fadeIn">
                  <h2 className="text-3xl font-black text-slate-900 mb-6">Dane Przyjmującego Zwrot</h2>
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl mb-8">
                    <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-3">Twoje dane (Wydający SSUEW)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <input type="text" placeholder="Imię i Nazwisko Przyjmującego (Admin)" value={borrower.adminName} onChange={e => setBorrower({...borrower, adminName: e.target.value})} className="bg-white border border-indigo-200 p-4 rounded-xl text-sm font-bold w-full" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedReturn(null)} className="bg-slate-100 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Anuluj</button>
                    <button onClick={() => { if(borrower.adminName.length < 3) alert("Wpisz swoje dane!"); else setReturnStep(2); }} className="bg-slate-900 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1">Przejdź do protokołu</button>
                  </div>
                </div>
              )}

              {returnStep === 2 && (
                <div id="printable-document" className="animate-fadeIn text-black font-sans text-[10px] md:text-[11px] leading-relaxed">
                  <div className="flex justify-between items-start mb-6 text-[9px] text-gray-600 font-bold uppercase">
                    <div>Samorząd Studentów UEW</div>
                    <div className="text-right">Załącznik Nr 3 do Regulaminu SSUEW</div>
                  </div>

                  <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-lg font-black uppercase tracking-widest">Protokół Zwrotu Sprzętu</h1>
                    <p className="font-bold text-gray-600 mt-1">DO POROZUMIENIA NR {selectedReturn['Nr_Porozumienia'] || selectedReturn['Nr Porozumienia'] || selectedReturn['Data']}</p>
                  </div>

                  <div className="text-justify space-y-4 mb-8">
                    <p>W dniu <strong>{today}</strong>, następuje zwrot majątku użyczonego Organizacji/Projektowi: <strong>{selectedReturn['Organizator'] || selectedReturn['Organizacja']}</strong>.</p>
                    
                    <div className="bg-gray-50 p-6 border border-gray-300 rounded-lg my-6">
                      <p className="font-black text-xs mb-3 border-b border-gray-300 pb-2">ZWRACANY SPRZĘT (KODY INWENTARZOWE):</p>
                      <p className="font-mono text-sm tracking-wide leading-relaxed">{selectedReturn['SPRZĘT'] || selectedReturn['Sprzęt (Kody QR)']}</p>
                    </div>

                    <p><strong>OŚWIADCZENIA STRON:</strong></p>
                    <p>1. Wydający (Przedstawiciel SSUEW: {borrower.adminName}) przyjmuje wyżej wymieniony sprzęt od Korzystającego.</p>
                    <p>2. Wydający oświadcza, że w momencie fizycznego przyjęcia sprzętu:</p>
                    <p className="ml-4 font-bold">☑ Sprzęt nie nosi widocznych śladów uszkodzeń poza wynikającymi z normalnego zużycia.</p>
                    <p className="mt-4 text-[9px] text-gray-500 italic">W przypadku stwierdzenia uszkodzeń należy zaniechać podpisywania niniejszego załącznika i niezwłocznie sporządzić Załącznik nr 8 - Protokół Szkody.</p>
                    <p className="mt-4">3. Z chwilą obustronnego podpisania niniejszego protokołu ustaje odpowiedzialność materialna Korzystającego (chyba że wady ukryte zostaną wykryte podczas pełnego testu technicznego w terminie 7 dni).</p>
                  </div>

                  {/* DWA PODPISY DLA ZWROTU! */}
                  <div className="mt-12 flex justify-between items-end pt-4 gap-6 page-break-inside-avoid">
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-32 border-2 border-dashed border-indigo-200 relative touch-none bg-indigo-50/30 print:bg-transparent rounded-xl overflow-hidden" title="Podpis Przyjmującego">
                        <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                        {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-black tracking-widest pointer-events-none print:hidden text-xs text-center text-indigo-900">PRZYJMUJĄCY<br/>(SSUEW)</div>}
                      </div>
                      <p className="mt-3 font-bold text-[9px] uppercase tracking-widest text-gray-500">(Podpis PRZYJMUJĄCEGO SSUEW)</p>
                    </div>

                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-32 border-2 border-dashed border-emerald-200 relative touch-none bg-emerald-50/30 print:bg-transparent rounded-xl overflow-hidden" title="Podpis Zwracającego">
                        <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                        {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-black tracking-widest pointer-events-none print:hidden text-xs text-center text-emerald-900">ZWRACAJĄCY<br/>(STUDENT)</div>}
                      </div>
                      <p className="mt-3 font-bold text-[9px] uppercase tracking-widest text-gray-500">(Podpis ZWRACAJĄCEGO)</p>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                    <button onClick={clearSignatures} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-bold uppercase text-[10px]">Wyczyść Podpisy</button>
                    <button onClick={processReturn} disabled={!sigAdminData || !sigBorrowerData || isVerifying} className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl font-black uppercase text-xs disabled:opacity-50 shadow-xl flex-1 transition-all">Zakończ Wypożyczenie w Bazie</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* ========================================================= */}
      {/* TRYB 4: WINDYKACJA (BEZ ZMIAN) */}
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
                <input type="text" placeholder="Imię i Nazwisko Dłużnika" value={summonsData.perpetrator} onChange={e => setSummonsData({...summonsData, perpetrator: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full" />
                <input type="text" placeholder="Adres zamieszkania Dłużnika" value={summonsData.address} onChange={e => setSummonsData({...summonsData, address: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full" />
                <input type="text" placeholder="Numer Protokołu Szkody" value={summonsData.protocolNumber} onChange={e => setSummonsData({...summonsData, protocolNumber: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full md:col-span-2" />
                <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2">Zniszczony / Utracony Sprzęt</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" placeholder="Nazwa sprzętu" value={summonsData.equipmentName} onChange={e => setSummonsData({...summonsData, equipmentName: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Marka" value={summonsData.brand} onChange={e => setSummonsData({...summonsData, brand: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Model" value={summonsData.model} onChange={e => setSummonsData({...summonsData, model: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSummonsDocument(true)} disabled={!summonsData.perpetrator || !summonsData.protocolNumber} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Generuj Ostateczne Wezwanie (A4)</button>
            </div>
          ) : (
            <div id="printable-document" className="text-black font-serif text-[12px] leading-relaxed">
              <div className="text-right mb-12"><p>Wrocław, dnia {today} r.</p></div>
              <div className="text-center mb-16">
                <h1 className="text-2xl font-black underline mb-2">OSTATECZNE PRZEDSĄDOWE WEZWANIE</h1>
                <p className="text-lg font-bold tracking-widest">DO NAPRAWIENIA SZKODY W MIENIU UCZELNI</p>
              </div>
              <div className="mb-12"><p className="font-bold underline mb-2">WEZWANY (SPRAWCA):</p><p>Pan/Pani <strong>{summonsData.perpetrator}</strong></p><p>Adres: <strong>{summonsData.address}</strong></p></div>
              <div className="mb-8"><p><strong>DOTYCZY:</strong> Braku realizacji zobowiązania z Protokołu Szkody nr <strong>{summonsData.protocolNumber}</strong></p></div>
              <div className="text-justify space-y-4 mb-12">
                <p>W związku z bezskutecznym upływem terminu na naprawienie szkody polegającej na zniszczeniu/utracie sprzętu: <strong>{summonsData.equipmentName}</strong>, niniejszym <strong>WZYWAM DO NATYCHMIASTOWEGO</strong>:</p>
                <div className="pl-6 space-y-4 font-bold my-6"><p>1. Dostarczenia fabrycznie nowego urządzenia (marki: {summonsData.brand}, modelu: {summonsData.model});</p><p className="text-center">LUB</p><p>2. Przedłożenia dowodu opłacenia naprawy serwisowej.</p></div>
                <p>Wyznacza się ostateczny termin wykonania zobowiązania: <strong className="underline">7 dni</strong> od daty otrzymania niniejszego pisma.</p>
              </div>
              <div className="bg-gray-100 p-6 border border-gray-400 mb-16">
                <p className="font-black underline mb-2">POUCZENIE:</p>
                <p className="mb-2">Niewykonanie powyższego zobowiązania skutkować będzie:</p>
                <ol className="list-decimal pl-5 space-y-2 font-bold text-[11px]">
                  <li>Skierowaniem oficjalnego wniosku do Rzecznika Dyscyplinarnego dla Studentów o wszczęcie postępowania.</li>
                  <li>Przekazaniem sprawy do Działu Prawnego Uniwersytetu celem skierowania powództwa cywilnego o naprawienie szkody.</li>
                </ol>
              </div>
              <div className="flex justify-end pt-8"><div className="text-center border-t border-black w-1/2 pt-2"><p className="font-bold">(Podpis PRZEWODNICZĄCEGO SSUEW)</p></div></div>
              <div className="mt-16 flex gap-4 print:hidden"><button onClick={() => setShowSummonsDocument(false)} className="bg-slate-100 py-4 px-6 rounded-xl font-black uppercase text-xs">Wróć</button><button onClick={() => window.print()} className="bg-red-600 text-white py-4 px-6 rounded-xl font-black uppercase text-xs flex-1">Drukuj</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}