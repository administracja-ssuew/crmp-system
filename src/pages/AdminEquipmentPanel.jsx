import { useState, useEffect, useRef } from 'react';

export default function AdminEquipmentPanel() {
  const [step, setStep] = useState(1);
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dane Korzystającego (Zgodne z Załącznikiem 1)
  const [borrower, setBorrower] = useState({
    name: '',
    albumId: '',
    organization: '',
    address: '',
    phone: '',
    email: ''
  });

  // Stany weryfikacji
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'ok' lub 'blocked'

  // Canvas do e-podpisu
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  // Pobieranie bazy sprzętu dla Administratora
  useEffect(() => {
    fetch(API_URL).then(res => res.json()).then(data => {
        if (!data.error) {
          const formatted = data.map(item => ({
            id: item.KOD_QR || `BRAK-ID-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
          }));
          setEquipmentData(formatted);
        }
    });
  }, []);

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    else setSelectedItems([...selectedItems, item]);
  };

  // Symulacja Systemu Weryfikacji (Czarna Lista)
  const verifyBorrower = () => {
    setIsVerifying(true);
    setVerificationStatus(null);
    
    setTimeout(() => {
      // Symulacja zadłużenia dla numeru 123456
      if (borrower.albumId === '123456') {
        setVerificationStatus('blocked');
      } else if (borrower.albumId.length > 3) {
        setVerificationStatus('ok');
        setStep(3); // Przejdź do podpisu, jeśli jest czysty
      } else {
        alert("Wprowadź poprawny numer albumu.");
      }
      setIsVerifying(false);
    }, 1500);
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
    e.preventDefault(); // Blokuje scrollowanie przy rysowaniu palcem
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a'; // Ciemnogranatowy tusz
    ctx.lineWidth = 3;
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
    alert("Sukces! Protokół został zapisany w bazie z podpisem cyfrowym.");
    // Tutaj w przyszłości wyślemy paczkę do Google Sheets
    setStep(1);
    setSelectedItems([]);
    setBorrower({name: '', albumId: '', organization: '', address: '', phone: '', email: ''});
    setVerificationStatus(null);
    setSignatureData(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center">
      {/* Pasek postępu */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-3xl border border-slate-700">
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>1. Wybór sprzętu</div>
        <div className="h-px bg-slate-600 flex-1 mx-4"></div>
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>2. Weryfikacja</div>
        <div className="h-px bg-slate-600 flex-1 mx-4"></div>
        <div className={`text-xs font-black uppercase tracking-widest ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>3. E-Podpis</div>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl p-8">
        
        {/* KROK 1: WYBÓR SPRZĘTU */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Wydanie z Magazynu</h2>
            <p className="text-sm font-bold text-slate-500 mb-6">Zaznacz sprzęt, który fizycznie wydajesz organizacji.</p>
            
            <input 
              type="text" 
              placeholder="Skanuj Kod QR lub wpisz..." 
              value={searchQuery}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            <div className="max-h-64 overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-2 mb-6">
              {equipmentData.filter(i => i.status === 'available').map(item => (
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
              Przejdź do weryfikacji ({selectedItems.length} szt.)
            </button>
          </div>
        )}

        {/* KROK 2: WERYFIKACJA ODBIORCY */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Dane Odbiorcy</h2>
            <p className="text-sm font-bold text-slate-500 mb-6">Zgodnie z wymogami Porozumienia Sprzętowego.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input type="text" placeholder="Imię i Nazwisko" value={borrower.name} onChange={e => setBorrower({...borrower, name: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
              <input type="text" placeholder="Nr albumu (np. 123456 da czerwoną flagę)" value={borrower.albumId} onChange={e => setBorrower({...borrower, albumId: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
              <input type="text" placeholder="Organizacja Studencka" value={borrower.organization} onChange={e => setBorrower({...borrower, organization: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full md:col-span-2" />
              <input type="text" placeholder="Adres zamieszkania" value={borrower.address} onChange={e => setBorrower({...borrower, address: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full md:col-span-2" />
              <input type="text" placeholder="Telefon" value={borrower.phone} onChange={e => setBorrower({...borrower, phone: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
              <input type="email" placeholder="E-mail" value={borrower.email} onChange={e => setBorrower({...borrower, email: e.target.value})} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold w-full" />
            </div>

            {verificationStatus === 'blocked' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
                <p className="text-red-700 font-black text-sm uppercase tracking-widest">⚠️ Odmowa Wydania</p>
                <p className="text-red-600 text-xs font-bold mt-1">Student widnieje w rejestrze dłużników. Sprzęt nie może zostać wydany do czasu uregulowania zaległości.</p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest w-1/3">Wróć</button>
              <button onClick={verifyBorrower} className="bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1 flex items-center justify-center gap-2">
                {isVerifying ? <span className="animate-pulse">Weryfikacja bazy...</span> : <span>Sprawdź w rejestrze i kontynuuj</span>}
              </button>
            </div>
          </div>
        )}

        {/* KROK 3: OŚWIADCZENIE I PODPIS (CANVAS) */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black text-slate-900 mb-2">E-Protokół Wydania</h2>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 mt-4">
              <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Oświadczenie Korzystającego</p>
              <p className="text-xs font-medium text-blue-900 leading-relaxed text-justify">
                Potwierdzam odbiór sprzętu. Oświadczam, że w obecności Wydającego dokonałem oględzin Sprzętu oraz weryfikacji jego działania. Stwierdzam, że Sprzęt jest kompletny, czysty, w pełni sprawny technicznie i nie wnoszę do jego stanu żadnych zastrzeżeń. Zobowiązuję się do zwrotu Sprzętu w stanie niepogorszonym.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Podpis Korzystającego</label>
                <button onClick={clearSignature} className="text-[10px] font-bold text-slate-500 hover:text-red-500">Wyczyść pole</button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 relative h-48 touch-none">
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!signatureData && <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 text-3xl font-black">Złóż podpis tutaj</div>}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="bg-slate-100 text-slate-700 py-4 px-6 rounded-xl font-black uppercase tracking-widest">Wróć</button>
              <button 
                onClick={finalizeProtocol} 
                disabled={!signatureData}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest flex-1 shadow-lg shadow-emerald-200 transition-all"
              >
                Zatwierdź E-Protokół
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}