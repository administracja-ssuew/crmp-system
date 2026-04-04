import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminEquipmentPanel() {
  const { user, userRole } = useAuth();
  const [adminMode, setAdminMode] = useState('wydawanie'); 

  const [allReservations, setAllReservations] = useState([]);
  const [allWydania, setAllWydania] = useState([]); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [approvalModal, setApprovalModal] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('12:00');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [issuingEmail, setIssuingEmail] = useState('');

  const [step, setStep] = useState(1);
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [borrower, setBorrower] = useState({
    name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: '', adminName: '', adminRole: 'Członek Zarządu SSUEW'
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const canvasBorrowerRef = useRef(null);
  const canvasAdminRef = useRef(null);
  const [isDrawingBorrower, setIsDrawingBorrower] = useState(false);
  const [isDrawingAdmin, setIsDrawingAdmin] = useState(false);
  const [sigBorrowerData, setSigBorrowerData] = useState(null);
  const [sigAdminData, setSigAdminData] = useState(null);

  const [docNumber, setDocNumber] = useState('POBIERANIE...');
  
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnStep, setReturnStep] = useState(1);

  const [summonsData, setSummonsData] = useState({
    perpetrator: '', albumId: '', organization: '', address: '', protocolNumber: '', equipmentName: '', brand: '', model: '', damageType: 'Mechaniczne', description: ''
  });
  const [showSummonsDocument, setShowSummonsDocument] = useState(false);

  const [firstAidReports, setFirstAidReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [resolvedReports, setResolvedReports] = useState([]);
  const [showResolvedHistory, setShowResolvedHistory] = useState(false);

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  const fetchAllData = () => {
    setIsLoadingReports(true);
    setReportsError(null);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const formatted = data.sprzet.map(item => ({
            id: item.KOD_QR || `SSUEW-BRAK-${item.NAZWA_SPRZĘTU || 'X'}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            accessories: item.INTERAKCJA || 'Brak',
            isFirstAid: String(item.RODZAJ || '').trim().toLowerCase() === 'apteczka'
          }));
          setEquipmentData(formatted);
          setAllReservations(data.rezerwacje || []);
          setAllWydania(data.wydania || []);
          const allReports = data.apteczkiBraki || data.braki_apteczek || data.apteczki_braki || data.firstAidReports || [];
          console.log('[CRW] apteczkiBraki count:', allReports.length, 'first keys:', allReports[0] ? Object.keys(allReports[0]) : 'brak');
          // Normalize field names — GAS may return different column headers depending on sheet state
          const normalize = (r) => {
            const vals = Object.values(r);
            // If expected keys exist, return as-is
            if (r.ID !== undefined || r.Apteczka_Nazwa !== undefined || r.Powod !== undefined) return r;
            // Otherwise map by column position: ID, Data_Zgloszenia, Apteczka_ID, Apteczka_Nazwa, Osoba, Powod, Zuzyte_Materialy, Status
            if (vals.length >= 7) {
              return { ID: vals[0], Data_Zgloszenia: vals[1], Apteczka_ID: vals[2], Apteczka_Nazwa: vals[3], Osoba: vals[4], Powod: vals[5], Zuzyte_Materialy: vals[6], Status: vals[7] || 'Oczekuje' };
            }
            return r;
          };
          const normalized = allReports.map(normalize);
          setFirstAidReports(normalized.filter(r => !String(r.Status || '').startsWith('Zrealizowane')));
          setResolvedReports(normalized.filter(r => String(r.Status || '').startsWith('Zrealizowane')));
        }
      })
      .catch(() => {
        setReportsError("Nie udało się pobrać zgłoszeń apteczek.");
      })
      .finally(() => {
        setIsLoadingReports(false);
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
          else setDocNumber('BŁĄD — odśwież');
        });
    }
  }, [step, adminMode]);

  const getAgreementNumber = (wyd) => {
    const val1 = String(wyd['Nr_Porozumienia'] || wyd['Nr Porozumienia'] || '');
    const val2 = String(wyd['Data'] || '');
    if (val1.includes('SSUEW')) return val1;
    if (val2.includes('SSUEW')) return val2;
    return val1 || 'Brak numeru';
  };

  const getRealDate = (wyd) => {
    const val1 = String(wyd['Data'] || '');
    const val2 = String(wyd['Nr_Porozumienia'] || wyd['Nr Porozumienia'] || '');
    let dateStr = val1;
    if (val2.includes('202') && !val2.includes('SSUEW')) dateStr = val2; 
    else if (val1.includes('202') && !val1.includes('SSUEW')) dateStr = val1;
    
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const initiateApproval = (rez) => {
    const emailMatch = (rez.Kontakt || '').match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    setRequesterEmail(emailMatch ? emailMatch[1] : '');
    setIssuingEmail(user?.email || '');
    setPickupDate('');
    setPickupTime('12:00');
    setApprovalModal({ id: rez.ID, organizacja: rez.Organizacja_Cel, sprzetKody: rez.Sprzet_Kody });
  };

  const confirmAndSendInvite = async () => {
    setIsUpdatingStatus(true);
    const allAdminEmails = [issuingEmail, 'administracja@samorzad.ue.wroc.pl']
      .map(e => e.trim()).filter(Boolean).join(',');
    const payload = {
      action: "updateRezerwacjaStatus", id: approvalModal.id, status: "Zatwierdzone", createEvent: true,
      pickupDateTime: `${pickupDate}T${pickupTime}`, requesterEmail: requesterEmail, adminEmail: allAdminEmails,
      organizacja: approvalModal.organizacja, sprzetKody: approvalModal.sprzetKody
    };
    try {
      const response = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`Wniosek Zatwierdzony!\nKalendarz: ${result.message || 'Zapisano'}`);
      } else {
        alert(`Błąd serwera: ${result.message || 'Nieznany błąd'}. Wniosek NIE został zatwierdzony.`);
      }
    } catch (err) {
      alert("Błąd połączenia — wniosek NIE został zatwierdzony. Spróbuj ponownie.");
    }
    finally { setApprovalModal(null); fetchAllData(); setIsUpdatingStatus(false); }
  };

  const handleRejectReservation = async (id) => {
    setIsUpdatingStatus(true);
    try {
      await fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "updateRezerwacjaStatus", id: id, status: "Odrzucone" }) });
    } catch (err) { alert("Błąd połączenia — odrzucenie NIE zostało zapisane. Spróbuj ponownie."); } finally { fetchAllData(); setIsUpdatingStatus(false); }
  };

  const resolveFirstAidReport = async (reportId) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "zamknijZgloszenieApteczki", id: reportId, adminOsoba: user?.email })
      });
      const result = await response.json();
      if (result.success) {
        alert("Zgłoszenie zamknięte! Dziękujemy za uzupełnienie apteczki.");
        fetchAllData();
      } else {
        alert(`Błąd serwera: ${result.message || 'Nieznany błąd'}. Zgłoszenie NIE zostało zamknięte.`);
      }
    } catch (err) {
      alert("Błąd połączenia — zgłoszenie NIE zostało zamknięte. Spróbuj ponownie.");
    } finally {
      setIsUpdatingStatus(false);
    }
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
    if (!borrower.adminName || borrower.adminName.length < 3) {
      alert("Wpisz dane Dysponenta (Imię i Nazwisko Wydającego)."); return;
    }
    if (!borrower.name || borrower.name.length < 3 || !borrower.albumId || borrower.albumId.length < 3) {
      alert("Wypełnij poprawnie dane Korzystającego (Imię, Nazwisko, Nr albumu)."); return;
    }
    setIsVerifying(true);
    setTimeout(() => { setStep(3); setIsVerifying(false); }, 400);
  };

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
    if(!sigBorrowerData || !sigAdminData) { alert("Protokół musi zostać podpisany przez obie strony!"); return; }
    setIsVerifying(true);
    const equipmentList = selectedItems.map(item => item.id).join(', ');
    const payload = {
      action: "zapiszWydanie", nrPorozumienia: docNumber, osoba: borrower.name, albumId: borrower.albumId, organizacja: borrower.organization, sprzet: equipmentList, dateFrom: `${borrower.dateFrom.replace('T', ' ')}`, dateTo: `${borrower.dateTo.replace('T', ' ')}`, location: borrower.location || "Brak", address: borrower.address || "Brak", phone: borrower.phone || "Brak", email: borrower.email, adminName: `${borrower.adminName} (${borrower.adminRole})`, sigBorrower: sigBorrowerData, sigAdmin: sigAdminData
    };
    try {
      const response = await fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const resData = await response.json();
      alert(`Wydanie sfinalizowane! \nCyfrowy PDF został zapisany na Dysku.\nLink: ${resData.link}`);
    } catch (error) { alert("Pomyślnie przetworzono procedurę wydania."); } finally { 
      setStep(1); setSelectedItems([]); setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: '', dateFrom: '', dateTo: '', location: '', adminName: '', adminRole: 'Członek Zarządu SSUEW'}); clearSignatures(); setDocNumber('GENEROWANIE...');
      setTimeout(() => fetchAllData(), 500); setIsVerifying(false); 
    }
  };

  const processReturn = async () => {
    if(!sigBorrowerData || !sigAdminData) { alert("Podpisz protokół zwrotu!"); return; }
    setIsVerifying(true);
    const targetId = getAgreementNumber(selectedReturn);
    try {
      await fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "zapiszZwrot", nrPorozumienia: targetId }) });
      alert(`Sprzęt z porozumienia ${targetId} został poprawnie zwrócony na stan!`);
    } catch (err) { alert("Zakończono proces zwrotu."); } finally { 
      setSelectedReturn(null); setReturnStep(1); clearSignatures(); setBorrower({...borrower, adminName: ''});
      setTimeout(() => fetchAllData(), 500); setIsVerifying(false); 
    }
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

  const issuedItemIds = new Set(
    activeWydania.flatMap(w =>
      String(w['SPRZĘT'] || w['Sprzęt (Kody QR)'] || '').split(',').map(s => s.trim()).filter(Boolean)
    )
  );

  return (
    <div className="min-h-screen bg-slate-900 p-3 md:p-4 flex flex-col items-center pb-16 print:bg-white print:p-0">
      
      <div className="w-full max-w-5xl mb-2 flex justify-start print:hidden">
        <Link to="/sprzet" className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl hover:bg-slate-800 transition-all">← Wróć do katalogu</Link>
      </div>

      <div className="w-full max-w-5xl flex flex-wrap bg-slate-800 rounded-xl p-1.5 mb-4 border border-slate-700 shadow-xl print:hidden animate-slideUp gap-1">
        <button onClick={() => {setAdminMode('wydawanie'); setStep(1);}} className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'wydawanie' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📦 Wydawanie</button>
        <button onClick={() => setAdminMode('rezerwacje')} className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'rezerwacje' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📩 Wnioski</button>
        <button onClick={() => {setAdminMode('zwroty'); setSelectedReturn(null); setReturnStep(1);}} className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'zwroty' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🔄 Zwroty</button>
        <button onClick={() => setAdminMode('windykacja')} className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'windykacja' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>⚖️ Windykacja</button>
        <button onClick={() => setAdminMode('apteczki')} className={`relative flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminMode === 'apteczki' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          🚑 Apteczki
          {firstAidReports.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
              {firstAidReports.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 5. APTECZKI ZARZĄDZANIE */}
      {/* ========================================================= */}
      {adminMode === 'apteczki' && (
        <div className="w-full max-w-5xl animate-fadeIn">
          <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚑</span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Zgłoszenia Braków w Apteczkach</h2>
                <p className="text-rose-400 font-bold uppercase tracking-widest text-[10px]">Uzupełnianie wg normy DIN 13169</p>
              </div>
            </div>
            <button
              onClick={() => setShowResolvedHistory(h => !h)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-all"
            >
              {showResolvedHistory ? 'Otwarte' : `Historia (${resolvedReports.length})`}
            </button>
          </div>

          {isLoadingReports && (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-sm">Pobieranie zgłoszeń...</p>
            </div>
          )}

          {reportsError && !isLoadingReports && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 mb-4 text-center">
              <p className="text-rose-300 font-bold text-sm">{reportsError}</p>
              <button onClick={fetchAllData} className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-200 border border-rose-700 px-3 py-1 rounded-lg transition-all">Spróbuj ponownie</button>
            </div>
          )}

          {!isLoadingReports && !reportsError && !showResolvedHistory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {firstAidReports.map(report => (
                <div key={report.ID || report.id} className="bg-slate-800 border border-rose-500/30 p-4 rounded-2xl shadow-lg flex flex-col justify-between group hover:border-rose-500 transition-all">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest px-2 py-0.5 bg-rose-900/50 rounded">{report.Data_Zgloszenia}</span>
                      <span className="text-[9px] font-black text-slate-500 opacity-60">ID: {report.ID || report.id}</span>
                    </div>
                    <h3 className="text-base font-black text-white leading-tight mb-1">{report.Apteczka_Nazwa}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic mb-3">Zgłosił: {report.Osoba}</p>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-3"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Opis zdarzenia:</p><p className="text-xs font-medium text-slate-300 italic">"{report.Powod || report['Powód'] || report.powod || '—'}"</p></div>
                    <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-900/50"><p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Zużyte materiały:</p><ul className="text-[10px] font-bold text-rose-200 leading-relaxed list-disc list-inside">{(report.Zuzyte_Materialy || report['Zużyte Materiały'] || report.zuzyte_materialy || report.Zuzyte || '').split(',').filter(Boolean).map((mat, i) => <li key={i}>{mat.trim()}</li>)}</ul></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resolveFirstAidReport(report.ID || report.id)} disabled={isUpdatingStatus} className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow hover:bg-rose-500 transition-all disabled:opacity-50">Zatwierdź uzupełnienie ✅</button>
                  </div>
                </div>
              ))}
              {firstAidReports.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center"><span className="text-4xl mb-3 opacity-20">🏥</span><p className="text-slate-400 font-black text-base uppercase tracking-widest">Wszystkie apteczki są pełne</p></div>
              )}
            </div>
          )}

          {!isLoadingReports && !reportsError && showResolvedHistory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resolvedReports.map((report, idx) => (
                <div key={report.ID || report.id || idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-700 rounded">{report.Data_Zgloszenia}</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-900/30 rounded border border-emerald-700/50">Zamknięte</span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-tight mb-1">{report.Apteczka_Nazwa}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic mb-2">Zgłosił: {report.Osoba}</p>
                  <p className="text-[10px] text-slate-500 italic">"{report.Powod || report['Powód'] || report.powod || '—'}"</p>
                </div>
              ))}
              {resolvedReports.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center"><span className="text-4xl mb-3 opacity-20">📋</span><p className="text-slate-400 font-black text-base uppercase tracking-widest">Brak historii zgłoszeń</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. WYDAWANIE (Z URZĘDOWYM DESIGNEM PDF - ZAŁ 1, ZAŁ 2A, ZAŁ 11) */}
      {/* ========================================================= */}
      {adminMode === 'wydawanie' && (
        <>
          <div className="w-full max-w-4xl flex justify-between items-center mb-4 bg-slate-800 p-3 rounded-2xl border border-slate-700 print:hidden animate-fadeIn">
            <div className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Koszyk</div>
            <div className="h-px bg-slate-600 flex-1 mx-3"></div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Formularz</div>
            <div className="h-px bg-slate-600 flex-1 mx-3"></div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. Protokół</div>
          </div>

          <div className={`w-full ${step === 3 ? 'max-w-[210mm] p-6 md:p-10' : 'max-w-3xl p-5'} bg-white rounded-2xl shadow-xl print:shadow-none print:max-w-none print:w-full print:rounded-none print:p-0`}>
            
            {step === 1 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-black text-slate-900 mb-3">Wydanie z Magazynu</h2>
                <input type="text" placeholder="Skanuj Kod QR lub wpisz nazwę..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="max-h-72 overflow-y-auto bg-slate-50 border border-slate-100 rounded-xl p-2 mb-4">
                  {equipmentData.filter(i =>
                    i.status === 'available' &&
                    !issuedItemIds.has(i.id) &&
                    (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(item => (
                    <div key={item.id} onClick={() => toggleItem(item)} className={`flex justify-between items-center p-3 mb-1.5 rounded-lg cursor-pointer transition-colors ${selectedItems.find(i => i.id === item.id) ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}>
                      <div><p className="text-sm font-black text-slate-800">{item.name}</p><p className="text-[10px] font-mono text-slate-500">{item.id}</p></div>
                      <div className="text-base">{selectedItems.find(i => i.id === item.id) ? '✅' : '☐'}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(2)} disabled={selectedItems.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg text-xs">Dalej: Formularz ({selectedItems.length} szt.)</button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-black text-slate-900 mb-1">Dane do Porozumienia</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Wypełnij precyzyjnie dane obu stron</p>
                
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                  <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-2">1. Dane Wydającego (SSUEW)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Imię i Nazwisko Wydającego" value={borrower.adminName} onChange={e => setBorrower({...borrower, adminName: e.target.value})} className="bg-white border border-indigo-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Funkcja (np. Członek Zarządu)" value={borrower.adminRole} onChange={e => setBorrower({...borrower, adminRole: e.target.value})} className="bg-white border border-indigo-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">2. Dane Korzystającego (Studenta/Organizacji)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Imię i Nazwisko Reprezentanta" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Nr albumu (legitymacji)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Pełna nazwa Organizacji / Projektu" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full md:col-span-2" />
                    <input type="text" placeholder="Adres zamieszkania / korespondencyjny" value={borrower.address} onChange={e => setBorrower({...borrower, address: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full md:col-span-2" />
                    <input type="text" placeholder="Nr Telefonu" value={borrower.phone} onChange={e => setBorrower({...borrower, phone: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                    <input type="email" placeholder="E-mail" value={borrower.email} onChange={e => setBorrower({...borrower, email: e.target.value})} className="bg-white border border-slate-200 p-2.5 rounded-lg text-sm font-bold w-full" />
                    <div className="md:col-span-2 grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-bold text-slate-500 ml-1">Od kiedy</label><input type="datetime-local" value={borrower.dateFrom} onChange={e => setBorrower({...borrower, dateFrom: e.target.value})} className="bg-white border border-slate-300 p-2.5 rounded-lg text-sm font-bold w-full mt-1" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 ml-1">Do kiedy</label><input type="datetime-local" value={borrower.dateTo} onChange={e => setBorrower({...borrower, dateTo: e.target.value})} className="bg-white border border-slate-300 p-2.5 rounded-lg text-sm font-bold w-full mt-1" /></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-5 rounded-xl font-black uppercase tracking-widest text-xs w-1/3">Wróć</button>
                  <div className="flex-1 flex flex-col">
                    <button onClick={verifyBorrower} disabled={selectedItems.length === 0 || docNumber === 'BŁĄD — odśwież' || docNumber === 'Pobieranie...'} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-2.5 px-5 rounded-xl font-black uppercase tracking-widest text-xs w-full">
                      {isVerifying ? 'Weryfikacja...' : 'Generuj PDF'}
                    </button>
                    {docNumber === 'BŁĄD — odśwież' && (
                      <p className="text-rose-400 text-[10px] font-bold mt-2 text-center">
                        Nie udało się pobrać numeru protokołu. Odśwież stronę i spróbuj ponownie.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div id="printable-document" className="animate-fadeIn text-black font-serif text-[11px] leading-snug">
                
                {/* --- STRONA 1: UMOWA UŻYCZENIA (ZAŁ 1) --- */}
                <div className="print:min-h-[297mm] print:break-after-page">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-1/2">
                      <p className="font-bold">Samorząd Studentów</p>
                      <p className="font-bold">Uniwersytetu Ekonomicznego</p>
                      <p className="font-bold">we Wrocławiu</p>
                    </div>
                    <div className="text-right text-[10px] font-bold uppercase w-1/2">
                      <p>ZAŁĄCZNIK NR 1</p>
                      <p>DO REGULAMINU GOSPODAROWANIA</p>
                      <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU</p>
                      <p>STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU</p>
                    </div>
                  </div>

                  <div className="text-center mb-6 mt-8">
                    <h1 className="text-xl font-black uppercase tracking-widest mb-1">POROZUMIENIE SPRZĘTOWE</h1>
                    <p className="font-bold text-gray-800">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR {docNumber}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="mb-4">Zawarte w dniu <strong>{today}</strong> we Wrocławiu, pomiędzy:</p>
                    <p className="font-bold">1. SAMORZĄDEM STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU,</p>
                    <p className="ml-4 mb-2">reprezentowanym przez Dysponenta / Operatora Systemu:</p>
                    <p className="ml-4"><strong>{borrower.adminName}, {borrower.adminRole}</strong></p>
                    <p className="ml-4">zwanym dalej „WYDAJĄCYM",</p>
                    
                    <p className="font-bold text-center my-4">a</p>
                    
                    <p className="font-bold">2. PODMIOT:</p>
                    <p className="ml-4 mb-2"><strong>{borrower.organization || '...........................................'}</strong></p>
                    <p className="ml-4">reprezentowaną przez Pana/Panią: <strong>{borrower.name}</strong></p>
                    <p className="ml-4">Nr albumu (legitymacji): <strong>{borrower.albumId}</strong></p>
                    <p className="ml-4">Adres zamieszkania/korespondencyjny: <strong>{borrower.address}</strong></p>
                    <p className="ml-4">Nr telefonu: <strong>{borrower.phone}</strong> | E-mail: <strong>{borrower.email}</strong></p>
                    <p className="ml-4 mt-2">zwanym dalej „KORZYSTAJĄCYM".</p>
                  </div>
                  
                  <div className="text-justify space-y-4 border-t-2 border-black pt-6 mb-6">
                    <div>
                      <p className="font-bold mb-1 text-center uppercase">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</p>
                      <p>1. Wydający oddaje Korzystającemu w bezpłatne używanie na czas oznaczony Sprzęt określony szczegółowo w Protokole Zdawczo-Odbiorczym (Załącznik nr 2), stanowiącym integralną część niniejszej umowy.</p>
                      <p>2. Korzystający oświadcza, że zapoznał się z treścią "Regulaminu Gospodarowania Składnikami Majątku Ruchomego SSUEW" (dalej: Regulamin), w pełni akceptuje jego postanowienia, w tym zasady odpowiedzialności materialnej, i zobowiązuje się do ich ścisłego przestrzegania.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-center uppercase mt-4">§ 2. OKRES OBOWIĄZYWANIA I MIEJSCE</p>
                      <p>1. Sprzęt zostaje wydany na okres:</p>
                      <p className="ml-4">OD dnia: <strong>{fromDT.date}</strong> godz. <strong>{fromDT.time}</strong></p>
                      <p className="ml-4">DO dnia: <strong>{toDT.date}</strong> godz. <strong>{toDT.time}</strong></p>
                      <p>2. Miejscem docelowym użytkowania Sprzętu jest: <strong>{borrower.location || 'Zgodnie z celem statutowym'}</strong>.</p>
                      <p>3. Termin zwrotu określony w ust. 1 jest terminem zawitym. Przekroczenie terminu bez uprzedniej pisemnej zgody Wydającego skutkuje: a) Natychmiastowym rozwiązaniem umowy; b) Nałożeniem blokady na wypożyczenia; c) Powstaniem roszczenia o naprawienie szkody poprzez zapłatę pełnej wartości odtworzeniowej przedmiotu.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-center uppercase mt-4">§ 3. ZASADY ODPOWIEDZIALNOŚCI (SOLIDARNOŚĆ)</p>
                      <p>1. Korzystający ponosi pełną odpowiedzialność materialną za powierzone mienie na zasadzie ryzyka, od momentu jego wydania do momentu zwrotu.</p>
                      <p>2. Reprezentant podpisujący niniejszą umowę oświadcza, iż jest umocowany do działania w imieniu wskazanego Podmiotu.</p>
                      <p>3. Na podstawie art. 366 § 1 Kodeksu cywilnego, Reprezentant przyjmuje na siebie odpowiedzialność solidarną za wszelkie zobowiązania wynikające z niniejszej umowy, w tym w szczególności za naprawienie szkody wynikłej z utraty, kradzieży lub uszkodzenia Sprzętu.</p>
                      <p>4. Wydający uprawniony jest do dochodzenia całości roszczenia od Reprezentanta z jego majątku osobistego, niezależnie od stanu finansów Podmiotu.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-center uppercase mt-4">§ 4. BEZPIECZEŃSTWO I DANE OSOBOWE</p>
                      <p>1. Korzystający zobowiązuje się do używania Sprzętu zgodnie z jego przeznaczeniem oraz zasadami BHP.</p>
                      <p>2. W przypadku powstania szkody lub utraty Sprzętu, Korzystający zobowiązuje się do niezwłocznego uzupełnienia danych osobowych niezbędnych do dochodzenia roszczeń, na wezwanie Wydającego w Protokole Szkody.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-center uppercase mt-4">§ 5. DORĘCZENIA I POSTANOWIENIA KOŃCOWE</p>
                      <p>1. Korzystający zobowiązuje się do informowania Wydającego o każdej zmianie adresu pod rygorem uznania doręczenia na adres wskazany w komparycji umowy za skuteczne po upływie 7 dni od nadania (fikcja doręczenia).</p>
                      <p>2. W sprawach nieuregulowanych zastosowanie mają przepisy Regulaminu oraz Kodeksu cywilnego.</p>
                      <p>3. Sądem właściwym do rozstrzygania sporów jest Sąd powszechny właściwy miejscowo dla siedziby Wydającego.</p>
                    </div>
                  </div>
                </div>

                {/* --- STRONA 2: PROTOKÓŁ WYDANIA I RODO (ZAŁ 2A i ZAŁ 11) --- */}
                <div className="print:min-h-[297mm] pt-8">
                  <div className="flex justify-end mb-6 text-[10px] font-bold uppercase">
                    <div className="text-right border-b border-black pb-2 w-1/2">
                      <p>ZAŁĄCZNIK NR 2</p>
                      <p>DO REGULAMINU GOSPODAROWANIA</p>
                      <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SSUEW</p>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-widest mb-1">PROTOKÓŁ ZDAWCZO-ODBIORCZY</h2>
                    <p className="font-bold text-gray-700">(INTEGRALNA CZĘŚĆ POROZUMIENIA SPRZĘTOWEGO NR {docNumber})</p>
                  </div>

                  <h3 className="font-black underline mb-2 text-sm">CZĘŚĆ A: WYDANIE SPRZĘTU</h3>
                  <p className="mb-4">Data wydania: <strong>{today}</strong> Godzina: <strong>{new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}</strong></p>

                  <div className="mb-6">
                    <p className="font-bold mb-2 text-xs">TABELA WYDANIA:</p>
                    <table className="w-full border-collapse border border-black text-left text-[10px]">
                      <thead><tr className="bg-gray-100"><th className="border border-black p-2 w-8 text-center">Lp.</th><th className="border border-black p-2">NAZWA SPRZĘTU</th><th className="border border-black p-2">NR INWENTARZOWY</th><th className="border border-black p-2">OPIS STANU WIZUALNEGO</th><th className="border border-black p-2">AKCESORIA W ZESTAWIE</th></tr></thead>
                      <tbody>
                        {selectedItems.map((item, idx) => (
                          <tr key={item.id}>
                            <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black p-2 font-bold">{item.name}</td>
                            <td className="border border-black p-2 font-mono">{item.id}</td>
                            <td className="border border-black p-2">{item.condition}</td>
                            <td className="border border-black p-2">{item.accessories}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-8">
                    <p className="font-bold mb-2">OŚWIADCZENIE KORZYSTAJĄCEGO (DOMNIEMANIE SPRAWNOŚCI):</p>
                    <p>1. Potwierdzam odbiór wyżej wymienionego Sprzętu.</p>
                    <p>2. Oświadczam, że w obecności Wydającego dokonałem oględzin Sprzętu oraz weryfikacji jego działania.</p>
                    <p>3. Stwierdzam, że Sprzęt jest kompletny, czysty, w pełni sprawny technicznie i nie wnoszę do jego stanu żadnych zastrzeżeń (z wyłączeniem wad wyraźnie opisanych w kolumnie "Opis stanu wizualnego").</p>
                    <p>4. Zobowiązuję się do zwrotu Sprzętu w stanie niepogorszonym.</p>
                  </div>

                  <div className="border-t border-black pt-6 mb-8 mt-6 text-[10px]">
                    <p className="font-black text-center mb-2">ZAŁĄCZNIK NR 11 - KLAUZULA INFORMACYJNA RODO</p>
                    <p className="text-center mb-4">(DLA KORZYSTAJĄCYCH ZE SPRZĘTU SSUEW)</p>
                    <p>Zgodnie z art. 13 RODO informujemy, że:</p>
                    <p>1. Administratorem Twoich danych osobowych jest Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu.</p>
                    <p>2. Dane (Imię, Nazwisko, Nr albumu, a w przypadku wystąpienia szkody - PESEL) przetwarzane są w celu realizacji umowy użyczenia sprzętu oraz ewentualnego dochodzenia roszczeń z tytułu zniszczenia mienia publicznego (prawnie uzasadniony interes art. 6 ust. 1 lit. f RODO) - przez czas trwania umowy użyczenia i dochodzenia roszczeń z tytułu zniszczenia mienia publicznego.</p>
                    <p>3. Dane mogą być przekazywane organom Uczelni (Rzecznik Dyscyplinarny) oraz organom ścigania.</p>
                    <p>4. Masz prawo wglądu do danych i ich sprostowania. Podanie danych jest warunkiem wydania sprzętu.</p>
                  </div>

                  <div className="flex justify-between items-end gap-6 mt-16 page-break-inside-avoid">
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Admina">
                        <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                        {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs">PODPIS WYDAJĄCEGO</div>}
                      </div>
                      <p className="mt-2 font-bold text-[10px] uppercase text-center">(Podpis WYDAJĄCEGO SSUEW)</p>
                    </div>
                    
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Studenta">
                        <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                        {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs">PODPIS KORZYSTAJĄCEGO</div>}
                      </div>
                      <p className="mt-2 font-bold text-[10px] uppercase text-center">(Podpis KORZYSTAJĄCEGO - Akceptacja Umowy, Protokołu A i RODO)</p>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                    <button onClick={clearSignatures} className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors">Wyczyść Podpisy</button>
                    <button onClick={finalizeProtocol} disabled={!sigBorrowerData || !sigAdminData || isVerifying} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest text-xs flex-1 shadow-2xl transition-all">
                      {isVerifying ? 'Generowanie...' : 'Zatwierdź Wydanie (Wyślij PDF)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TRYB REZERWACJI Z KALENDARZA */}
      {/* ========================================================= */}
      {adminMode === 'rezerwacje' && (
        <div className="w-full max-w-5xl animate-fadeIn">
          <h2 className="text-xl font-black text-white mb-1 tracking-tight">Wnioski o Rezerwację</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">Zarządzanie Kalendarzem Majątku (CRW)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allReservations.filter(r => r.Status === 'Oczekuje').map(rez => (
              <div key={rez.ID} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg flex flex-col justify-between group hover:border-indigo-500 transition-all">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-2 py-0.5 bg-indigo-900/50 rounded">{formatResDate(rez.Data_Od)} ➔ {formatResDate(rez.Data_Do)}</span>
                    <span className="text-[9px] font-black text-slate-500 opacity-60">#{rez.ID}</span>
                  </div>
                  <h3 className="text-base font-black text-white leading-tight mb-1">{rez.Organizacja_Cel}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic mb-3">Dane: {rez.Kontakt}</p>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Żądany sprzęt:</p><p className="text-xs font-bold text-emerald-400 leading-relaxed">📦 {rez.Sprzet_Kody}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRejectReservation(rez.ID)} disabled={isUpdatingStatus} className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50">Odrzuć</button>
                  <button onClick={() => initiateApproval(rez)} disabled={isUpdatingStatus} className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow hover:bg-indigo-500 transition-all disabled:opacity-50">Zatwierdź ✅</button>
                </div>
              </div>
            ))}
            {allReservations.filter(r => r.Status === 'Oczekuje').length === 0 && (
              <div className="col-span-full py-12 text-center flex flex-col items-center"><span className="text-4xl mb-3 opacity-20">📭</span><p className="text-slate-400 font-black text-base uppercase tracking-widest">Brak nowych wniosków</p></div>
            )}
          </div>
        </div>
      )}

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
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mail Wnioskodawcy</label><input type="email" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 p-3 rounded-xl font-bold" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mail Osoby Wydającej Sprzęt</label><input type="email" value={issuingEmail} onChange={e => setIssuingEmail(e.target.value)} placeholder={user?.email || ''} className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl font-bold" /><p className="text-[9px] text-slate-400 mt-1">+ administracja@samorzad.ue.wroc.pl zawsze w gościach</p></div>
            </div>
            <button onClick={confirmAndSendInvite} disabled={!pickupDate || !requesterEmail || isUpdatingStatus} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50">{isUpdatingStatus ? 'Tworzenie wydarzenia...' : 'Zatwierdź i Wyślij Zaproszenie'}</button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TRYB 3: ZWROTY SPRZĘTU (ZAŁĄCZNIK 2B - SAFE WIPE) */}
      {/* ========================================================= */}
      {adminMode === 'zwroty' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {!selectedReturn ? (
            <div className="w-full bg-slate-800 p-5 rounded-2xl shadow-xl animate-fadeIn">
              <h2 className="text-xl font-black text-white mb-1">Przyjmowanie Zwrotów</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">Wybierz aktywny protokół z bazy</p>

              <div className="space-y-2">
                {activeWydania.map((wyd, idx) => (
                  <div key={idx} onClick={() => {setSelectedReturn(wyd); setReturnStep(1);}} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group shadow">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">NR: {getAgreementNumber(wyd)}</span>
                      <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{wyd['Organizator'] || wyd['Organizacja']}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Osoba: {wyd['Kto_wypozyczyl'] || wyd['Wypożyczający']} | Pobrane: {getRealDate(wyd)}</p>
                    </div>
                    <div className="text-right">
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase shadow group-hover:bg-emerald-500 transition-colors">Odbierz Sprzęt</button>
                    </div>
                  </div>
                ))}
                {activeWydania.length === 0 && (
                  <div className="text-center py-12"><span className="text-4xl mb-3 opacity-20">✅</span><p className="text-slate-400 font-black text-base uppercase tracking-widest mt-3">Magazyn pełny</p></div>
                )}
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
                <div id="printable-document" className="animate-fadeIn text-black font-serif text-[11px] leading-relaxed">
                  <div className="flex justify-between mb-4 text-[9px] text-gray-600 font-bold uppercase border-b border-black pb-2">
                    <div className="w-1/2">
                      <p>Samorząd Studentów</p>
                      <p>Uniwersytetu Ekonomicznego we Wrocławiu</p>
                    </div>
                    <div className="w-1/2 text-right">
                      <p>ZAŁĄCZNIK NR 2</p>
                      <p>DO REGULAMINU GOSPODAROWANIA</p>
                      <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SSUEW</p>
                    </div>
                  </div>

                  <div className="text-center mb-8 mt-6">
                    <h1 className="text-lg font-black uppercase tracking-widest mb-1">CZĘŚĆ B: ZWROT SPRZĘTU</h1>
                    <p className="font-bold text-gray-700 mt-1">DO POROZUMIENIA NR {getAgreementNumber(selectedReturn)}</p>
                  </div>

                  <p className="mb-6">Data zwrotu: <strong>{today}</strong> Godzina: <strong>{new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}</strong></p>

                  <div className="mb-6">
                    <p className="font-bold mb-2 text-xs">TABELA ZWROTU:</p>
                    <table className="w-full border-collapse border border-black text-left text-[10px]">
                      <thead><tr className="bg-gray-100"><th className="border border-black p-2 w-8 text-center">Lp.</th><th className="border border-black p-2 w-1/3">NAZWA SPRZĘTU</th><th className="border border-black p-2 w-1/3">STAN PRZY ZWROCIE (OPIS)</th><th className="border border-black p-2">DECYZJA WYDAJĄCEGO</th></tr></thead>
                      <tbody>
                        {String(selectedReturn['SPRZĘT'] || selectedReturn['Sprzęt (Kody QR)'] || '').split(',').filter(Boolean).map((itemCode, idx) => {
                          const code = itemCode.trim();
                          const resolvedName = equipmentData.find(e => e.id === code)?.name;
                          return (
                          <tr key={idx}>
                            <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black p-2">{resolvedName || code}</td>
                            <td className="border border-black p-2">.....................................</td>
                            <td className="border border-black p-2 leading-tight">
                              ☐ PRZYJĘTO BEZ ZASTRZEŻEŃ<br/>
                              ☐ BRUDNY (DO CZYSZCZENIA)<br/>
                              ☐ USZKODZONY (PROTOKÓŁ SZKODY)
                            </td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-8 border border-black p-4 bg-gray-50">
                    <p className="font-bold mb-2 text-xs uppercase underline">KLAUZULA DANYCH (SAFE-WIPE):</p>
                    <p>Oświadczam, że ze zwracanych nośników pamięci (laptopy, dyski, pendrive'y, karty SD) usunąłem trwale wszelkie dane.</p>
                    <p>Przyjmuję do wiadomości, że SSUEW dokona niezwłocznego formatowania nośników. Zrzekam się wszelkich roszczeń z tytułu utraty pozostawionych danych.</p>
                  </div>

                  <div className="mt-12 flex justify-between items-end pt-4 gap-6 page-break-inside-avoid">
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Przyjmującego">
                        <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                        {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">PRZYJMUJĄCY<br/>(SSUEW)</div>}
                      </div>
                      <p className="mt-3 font-bold text-[10px] uppercase">(Podpis PRZYJMUJĄCEGO SSUEW)</p>
                    </div>

                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Zwracającego">
                        <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                        {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">ZWRACAJĄCY<br/>(STUDENT)</div>}
                      </div>
                      <p className="mt-3 font-bold text-[10px] uppercase">(Podpis ZWRACAJĄCEGO)</p>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                    <button onClick={clearSignatures} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-bold uppercase text-[10px]">Wyczyść Podpisy</button>
                    <button onClick={processReturn} disabled={!sigAdminData || !sigBorrowerData || isVerifying} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase text-xs disabled:opacity-50 shadow-xl flex-1 transition-all">Zatwierdź Zwrot (Wyślij PDF)</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* ========================================================= */}
      {/* TRYB 4: WINDYKACJA / SZKODA (ZAŁĄCZNIK 8) */}
      {/* ========================================================= */}
      {adminMode === 'windykacja' && (
        <div className={`w-full ${showSummonsDocument ? 'max-w-[210mm] p-8 md:p-16' : 'max-w-3xl p-8'} bg-white rounded-[2rem] shadow-2xl print:shadow-none print:max-w-none print:w-full print:rounded-none animate-fadeIn`}>
          {!showSummonsDocument ? (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">🚨</span>
                <div>
                  <h2 className="text-3xl font-black text-red-600">Protokół Szkody / Incydentu</h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generator Załącznika Nr 8</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <input type="text" placeholder="Imię i Nazwisko Sprawcy" value={summonsData.perpetrator} onChange={e => setSummonsData({...summonsData, perpetrator: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full" />
                <input type="text" placeholder="Nr albumu" value={summonsData.albumId} onChange={e => setSummonsData({...summonsData, albumId: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full" />
                <input type="text" placeholder="Organizacja Studencka / Projekt" value={summonsData.organization} onChange={e => setSummonsData({...summonsData, organization: e.target.value})} className="bg-slate-50 border p-4 rounded-xl font-bold w-full md:col-span-2" />
                
                <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2">Przedmiot Szkody i Opis</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <input type="text" placeholder="Nazwa sprzętu" value={summonsData.equipmentName} onChange={e => setSummonsData({...summonsData, equipmentName: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                    <input type="text" placeholder="Nr inwentarzowy (KOD QR)" value={summonsData.brand} onChange={e => setSummonsData({...summonsData, brand: e.target.value})} className="bg-white border border-red-200 p-3 rounded-lg text-sm font-bold w-full" />
                  </div>
                  <select value={summonsData.damageType} onChange={e => setSummonsData({...summonsData, damageType: e.target.value})} className="w-full bg-white border border-red-200 p-3 rounded-lg text-sm font-bold mb-3">
                    <option value="Uszkodzenie mechaniczne">Uszkodzenie mechaniczne</option>
                    <option value="Zalanie">Zalanie</option>
                    <option value="Zgubienie/Kradzież">Zgubienie / Kradzież</option>
                    <option value="Inne">Inne</option>
                  </select>
                  <textarea rows="2" placeholder="Szczegółowy opis uszkodzeń..." value={summonsData.description} onChange={e => setSummonsData({...summonsData, description: e.target.value})} className="w-full bg-white border border-red-200 p-3 rounded-lg text-sm font-medium resize-none"></textarea>
                </div>
              </div>
              <button onClick={() => setShowSummonsDocument(true)} disabled={!summonsData.perpetrator || !summonsData.equipmentName} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg">Generuj Protokół (PDF)</button>
            </div>
          ) : (
            <div id="printable-document" className="text-black font-serif text-[12px] leading-relaxed">
              <div className="flex justify-between mb-8 text-[10px] font-bold uppercase border-b border-black pb-2">
                <div className="w-1/2">
                  <p>Samorząd Studentów</p>
                  <p>Uniwersytetu Ekonomicznego we Wrocławiu</p>
                </div>
                <div className="w-1/2 text-right">
                  <p>ZAŁĄCZNIK NR 8</p>
                  <p>DO REGULAMINU GOSPODAROWANIA</p>
                  <p>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SSUEW</p>
                </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-xl font-black uppercase tracking-widest mb-1">PROTOKÓŁ SZKODY / INCYDENTU</h1>
                <p className="font-bold text-gray-700 mt-1">(WRAZ Z UZNANIEM DŁUGU I ZOBOWIĄZANIEM DO NAPRAWIENIA SZKODY)</p>
                <p className="font-bold mt-2">NR SZKODA/....../2026</p>
              </div>

              <div className="space-y-4 text-justify">
                <p><strong>1. DATA I MIEJSCE ZDARZENIA:</strong> {today}, Wrocław, Kampus UEW</p>
                
                <div>
                  <p className="font-bold">2. SPRAWCA / OSOBA ODPOWIEDZIALNA:</p>
                  <p className="ml-4">Imię i Nazwisko: <strong>{summonsData.perpetrator}</strong></p>
                  <p className="ml-4">Nr albumu: <strong>{summonsData.albumId}</strong></p>
                  <p className="ml-4">Organizacja: <strong>{summonsData.organization}</strong></p>
                </div>

                <div>
                  <p className="font-bold">3. PRZEDMIOT SZKODY:</p>
                  <p className="ml-4">Nazwa: <strong>{summonsData.equipmentName}</strong></p>
                  <p className="ml-4">Nr inwentarzowy: <strong>{summonsData.brand}</strong></p>
                </div>

                <div>
                  <p className="font-bold">4. OPIS STANU FAKTYCZNEGO:</p>
                  <p className="ml-4">Rodzaj: <strong>☑ {summonsData.damageType}</strong></p>
                  <p className="ml-4">Opis uszkodzeń: <em>{summonsData.description}</em></p>
                </div>

                <div>
                  <p className="font-bold">5. SPOSÓB NAPRAWIENIA SZKODY (UZGODNIENIE STRON):</p>
                  <p className="mb-2">Strony ustalają, że naprawienie szkody nastąpi poprzez (zaznaczyć właściwe):</p>
                  <p className="ml-4">☐ Zakup i dostarczenie przez Sprawcę fabrycznie nowego urządzenia (ten sam model lub nowszy o nie gorszych parametrach) w terminie do 7 dni.</p>
                  <p className="ml-4">☐ Oddanie sprzętu do autoryzowanego serwisu i bezpośrednie pokrycie kosztów naprawy (opłacenie faktury serwisu) przez Sprawcę.</p>
                  <p className="ml-4">☐ Zakup i dostarczenie niezbędnych części zamiennych wskazanych przez Dysponenta.</p>
                </div>

                <div className="bg-gray-100 p-4 border border-black mt-6">
                  <p className="font-bold underline mb-2">6. UZNANIE DŁUGU (OŚWIADCZENIE SPRAWCY):</p>
                  <p>Ja, niżej podpisany, działając świadomie i dobrowolnie, <strong>UZNAJĘ SWOJĄ ODPOWIEDZIALNOŚĆ</strong> za wyżej opisaną szkodę w mieniu Uniwersytetu Ekonomicznego we Wrocławiu.</p>
                  <p className="mt-2">Zobowiązuję się do naprawienia szkody w sposób wskazany w pkt 5, w nieprzekraczalnym terminie do dnia: .................................. Oświadczam, że w przypadku niedotrzymania tego terminu, wyrażam zgodę na skierowanie sprawy na drogę postępowania dyscyplinarnego lub sądowego.</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end pt-4 gap-6 mt-16 page-break-inside-avoid">
                <div className="w-1/2 flex flex-col items-center">
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent">
                    {/* Miejsce na fizyczny lub cyfrowy podpis Admina */}
                  </div>
                  <p className="mt-3 font-bold text-[10px] uppercase">(Podpis DYSPONENTA - SSUEW)</p>
                </div>
                <div className="w-1/2 flex flex-col items-center">
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent">
                    {/* Miejsce na podpis Sprawcy */}
                  </div>
                  <p className="mt-3 font-bold text-[10px] uppercase">(Podpis SPRAWCY - UZNANIE DŁUGU)</p>
                </div>
              </div>

              <div className="mt-16 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                <button onClick={() => setShowSummonsDocument(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase text-xs">Wróć</button>
                <button onClick={() => window.print()} className="bg-red-600 text-white py-4 px-6 rounded-xl font-black uppercase text-xs flex-1">🖨️ Podpisz i Zapisz (PDF)</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}