import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';
import { QrReader } from 'react-qr-reader';

export default function VerificationPage() {
  const { user } = useAuth();
  
  // UNIWERSALNY IDENTYFIKATOR - Zapobiega błędom 400 (Bad Request)
  const userIdentifier = user?.email || 'nieznajomy';

  // === STANY GŁÓWNE ===
  const [scanResult, setScanResult] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // === STANY SESJI ===
  const [activeSession, setActiveSession] = useState(null); 
  const [occupiedSession, setOccupiedSession] = useState(null); 
  const [occupantName, setOccupantName] = useState(''); 

  // === STANY FORMULARZY ===
  const [purpose, setPurpose] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [checks, setChecks] = useState({ trash: false, dishes: false, lights: false });

  // === STANY SUKCESJI (PRZEKAZYWANIA SALI) ===
  const [handoverData, setHandoverData] = useState(null); 
  const [enteredPin, setEnteredPin] = useState(''); 

  // 1. Sprawdzenie Czarnej Listy
  useEffect(() => {
    const checkBlacklist = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('blacklist_violations')
        .select('*')
        .eq('user_id', userIdentifier) // <-- POPRAWIONE
        .gte('valid_until', new Date().toISOString());
      
      if (data && data.length > 0) {
        alert("Odmowa dostępu. Masz aktywną blokadę nałożoną przez Zarząd.");
        window.location.href = '/'; 
      }
    };
    checkBlacklist();
  }, [user, userIdentifier]);

  // 2. Obsługa zeskanowania kodu
  const handleScan = async (qrHash) => {
    if (!qrHash) return;
    setIsScanning(false);
    setIsLoading(true);

    try {
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('qr_hash', qrHash)
        .single();

      if (roomErr || !room) throw new Error("Nieprawidłowy kod QR sali.");
      setRoomData(room);
      setScanResult(qrHash);

      const { data: session } = await supabase
        .from('room_sessions')
        .select('*')
        .eq('room_id', room.id)
        .eq('status', 'ONGOING')
        .maybeSingle();

      if (session) {
        if (session.host_id === userIdentifier) { // <-- POPRAWIONE
          setActiveSession(session);
        } else {
          setOccupiedSession(session);
          // Zmieniliśmy host_id na maila, więc tu po prostu wyświetlamy maila (lub wyciągamy imię z maila)
          const nameFromEmail = session.host_id.split('@')[0];
          setOccupantName(nameFromEmail);
        }
      }
    } catch (err) {
      alert(err.message);
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja kompresująca zdjęcia
  const uploadPhoto = async (file, type) => {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);
    
    // Zabezpieczenie przed znakami specjalnymi w nazwie pliku
    const safeEmail = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${roomData.id}/${safeEmail}_${type}_${Date.now()}.webp`;
    
    const { error } = await supabase.storage.from('room-photos').upload(fileName, compressedFile, { contentType: 'image/webp' });
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('room-photos').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  // === AKCJA WEJŚCIA ===
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!purpose || !photoFile) return alert("Wypełnij cel i zrób zdjęcie.");
    setIsLoading(true);

    try {
        const photoUrl = await uploadPhoto(photoFile, 'checkin');
        
        const { data, error } = await supabase.from('room_sessions').insert([{
          room_id: roomData.id, 
          host_id: userIdentifier, // <-- POPRAWIONE
          purpose: purpose, 
          check_in_photo_url: photoUrl
        }]).select().single();

      if (error) throw error;
      alert("Wejście zarejestrowane! Jesteś teraz Gospodarzem sali.");
      setActiveSession(data);
    } catch (err) { 
      console.error(err);
      alert("Błąd podczas zapisywania wejścia."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // === AKCJA WYJŚCIA ===
  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!photoFile) return alert("Musisz zrobić zdjęcie po zakończeniu pracy!");
    if (!checks.trash || !checks.dishes || !checks.lights) return alert("Zaznacz wszystkie pola kontrolne!");
    setIsLoading(true);

    try {
      const photoUrl = await uploadPhoto(photoFile, 'checkout');
      const { error } = await supabase.from('room_sessions').update({
        check_out_time: new Date().toISOString(), 
        check_out_photo_url: photoUrl, 
        checklist_completed: true, 
        status: 'COMPLETED'
      }).eq('id', activeSession.id);

      if (error) throw error;
      alert("Wyjście zarejestrowane. Dziękujemy za porządek!");
      window.location.reload(); 
    } catch (err) { 
      console.error(err);
      alert("Błąd wyjścia."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // === INICJACJA SUKCESJI ===
  const initiateHandover = async () => {
    setIsLoading(true);
    const pin = Math.floor(1000 + Math.random() * 9000).toString(); 
    
    try {
      const { data, error } = await supabase.from('session_handovers').insert([{
        original_session_id: activeSession.id, 
        from_user_id: userIdentifier, // <-- POPRAWIONE
        handover_pin: pin
      }]).select().single();

      if (error) throw error;
      setHandoverData(data);
    } catch (err) { 
      console.error(err);
      alert("Błąd generowania PINu."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // POLLING SUKCESJI
  useEffect(() => {
    let interval;
    if (handoverData && handoverData.status === 'PENDING') {
      interval = setInterval(async () => {
        const { data } = await supabase.from('session_handovers').select('status').eq('id', handoverData.id).single();
        if (data && data.status === 'ACCEPTED') {
          alert("Sukces! Twój znajomy poprawnie przejął salę. Jesteś oficjalnie zwolniony z odpowiedzialności za tę przestrzeń.");
          window.location.reload(); 
        }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [handoverData]);

  // === PRZEJĘCIE SALI ===
  const acceptHandover = async (e) => {
    e.preventDefault();
    if (enteredPin.length !== 4) return alert("PIN musi mieć 4 cyfry.");
    setIsLoading(true);

    try {
      const { data: handover, error: handoverErr } = await supabase.from('session_handovers')
        .select('*').eq('original_session_id', occupiedSession.id).eq('handover_pin', enteredPin).eq('status', 'PENDING').single();

      if (handoverErr || !handover) throw new Error("Błędny PIN lub brak aktywnej prośby o przejęcie.");

      await supabase.from('session_handovers').update({ 
        status: 'ACCEPTED', 
        to_user_id: userIdentifier, // <-- POPRAWIONE
        resolved_at: new Date().toISOString() 
      }).eq('id', handover.id);

      await supabase.from('room_sessions').update({ 
        status: 'HANDED_OVER', 
        check_out_time: new Date().toISOString() 
      }).eq('id', occupiedSession.id);

      const { data: newSession, error: newSessErr } = await supabase.from('room_sessions').insert([{
        room_id: roomData.id, 
        host_id: userIdentifier, // <-- POPRAWIONE
        purpose: `Przejęcie sali po: ${occupantName}`, 
        check_in_photo_url: occupiedSession.check_in_photo_url
      }]).select().single();

      if (newSessErr) throw newSessErr;

      alert(`Przejąłeś odpowiedzialność za salę ${roomData.name}! Jesteś nowym Gospodarzem.`);
      setOccupiedSession(null);
      setActiveSession(newSession); 
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-slate-900 fixed top-0 z-50 text-white font-black uppercase tracking-widest text-xs animate-pulse">Łączenie z serwerem CRA...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 pt-20 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
        
        {/* EKRAN 1: SKANOWANIE QR */}
        {!scanResult && (
          <div className="text-center animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 mb-2">System Weryfikacji</h2>
            <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">Zeskanuj kod QR z drzwi sali</p>
            
            {isScanning ? (
              <div className="rounded-2xl overflow-hidden mb-4 border-4 border-indigo-500 shadow-xl shadow-indigo-900/50">
                <QrReader onResult={(result) => { if (result) handleScan(result?.text); }} constraints={{ facingMode: 'environment' }} style={{ width: '100%' }} />
              </div>
            ) : (
              <button onClick={() => setIsScanning(true)} className="w-full bg-indigo-600 text-white py-5 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">📸 Uruchom Aparat</button>
            )}
            
            <button onClick={() => handleScan('SSUEW-16J-SECURE-2026')} className="w-full mt-4 bg-slate-100 text-slate-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-600">Dev: Symuluj skan (Sala 16J)</button>
          </div>
        )}

        {/* EKRAN 2: WEJŚCIE */}
        {scanResult && roomData && !activeSession && !occupiedSession && (
          <div className="animate-slideUp">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl font-black text-center uppercase tracking-widest text-sm mb-6 border border-emerald-200 shadow-sm">
              Wykryto: {roomData.name}
            </div>
            <h3 className="font-black text-slate-800 text-xl mb-4">Rejestracja Wejścia</h3>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cel wejścia (Krótko)</label>
                <input type="text" required value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" placeholder="np. Praca nad Wampiriadą" />
              </div>
              <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-3">📸 Zdjęcie stanu sali (Przed pracą)</label>
                <input type="file" accept="image/*" capture="environment" required onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">Wejdź i weź odpowiedzialność</button>
            </form>
          </div>
        )}

        {/* EKRAN 3: WYJŚCIE LUB PRZEKAZANIE */}
        {scanResult && roomData && activeSession && (
          <div className="animate-slideUp">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl font-black text-center uppercase tracking-widest text-sm mb-6 border border-blue-200 shadow-sm">
              Jesteś Gospodarzem: {roomData.name}
            </div>
            
            {handoverData ? (
              <div className="bg-slate-900 text-white p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden border border-slate-700 animate-fadeIn">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse"></div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 relative z-10">Twój kod autoryzacji:</h3>
                <div className="text-6xl font-black tracking-widest text-white mb-6 relative z-10">{handoverData.handover_pin}</div>
                <p className="text-xs font-medium text-slate-300 leading-relaxed relative z-10 bg-slate-800 p-4 rounded-xl">
                  Pokaż ten kod osobie, która przejmuje salę.<br/>Gdy go wpisze, system automatycznie zwolni Cię z odpowiedzialności.
                </p>
                <div className="mt-6 flex justify-center gap-2 items-center relative z-10">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Oczekiwanie na sieć...</span>
                </div>
                <button onClick={() => setHandoverData(null)} className="w-full mt-6 bg-slate-800 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-700 hover:bg-slate-700 relative z-10">Wróć (Anuluj przekazanie)</button>
              </div>
            ) : (
              <form onSubmit={handleCheckOut} className="space-y-5">
                <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-3">📸 Dowód porządku (Po pracy)</label>
                  <input type="file" accept="image/*" capture="environment" required onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all cursor-pointer" />
                </div>
                
                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Checklista Wyjścia (Obowiązkowa)</p>
                  <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                    <input type="checkbox" required checked={checks.trash} onChange={e => setChecks({...checks, trash: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded" />
                    Wyniosłem/am swoje śmieci
                  </label>
                  <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                    <input type="checkbox" required checked={checks.dishes} onChange={e => setChecks({...checks, dishes: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded" />
                    Umyłem/am i odłożyłem SUCHE naczynia
                  </label>
                  <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                    <input type="checkbox" required checked={checks.lights} onChange={e => setChecks({...checks, lights: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded" />
                    Zamknąłem/am okna i zgasiłem światło
                  </label>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 text-xs active:scale-95 transition-all">Zwalniam Salę</button>
                  <button type="button" onClick={initiateHandover} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2">Przekaż Salę 🔄</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* EKRAN 4: PRZEJĘCIE */}
        {scanResult && roomData && occupiedSession && (
          <div className="animate-slideUp border-t-4 border-amber-500 pt-6">
            <h3 className="font-black text-slate-800 text-2xl mb-2 leading-tight">Sala jest aktualnie zajęta</h3>
            <p className="text-sm font-medium text-slate-600 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
              Gospodarzem sali <strong>{roomData.name}</strong> jest w tym momencie <span className="font-black text-amber-700">{occupantName}</span>. 
            </p>
            
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Zostajesz w Sali?</h4>
              <p className="text-xs text-slate-500 font-medium mb-4">Jeśli {occupantName} wychodzi, musisz przejąć od niego odpowiedzialność w systemie.</p>
              <form onSubmit={acceptHandover} className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={4} 
                  required 
                  value={enteredPin} 
                  onChange={e => setEnteredPin(e.target.value.replace(/\D/g, ''))} 
                  placeholder="PIN" 
                  className="w-1/3 bg-white border border-slate-300 p-4 rounded-xl font-black text-center text-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 tracking-widest" 
                />
                <button type="submit" disabled={isLoading || enteredPin.length !== 4} className="flex-1 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">Przejmij Salę</button>
              </form>
            </div>
            
            <button onClick={() => window.location.reload()} className="w-full mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Anuluj / Zeskanuj Ponownie</button>
          </div>
        )}

      </div>
    </div>
  );
}