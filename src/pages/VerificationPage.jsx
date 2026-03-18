import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';
import { QrReader } from 'react-qr-reader';

export default function VerificationPage() {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Stany dla formularzy
  const [purpose, setPurpose] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [checks, setChecks] = useState({ trash: false, dishes: false, lights: false });

  // 1. Sprawdzenie, czy user nie ma bana
  useEffect(() => {
    const checkBlacklist = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('blacklist_violations')
        .select('*')
        .eq('user_id', user.id) // Zakładamy, że masz user.id z AuthContext dopięte do bazy
        .gte('valid_until', new Date().toISOString());
      
      if (data && data.length > 0) {
        alert("Odmowa dostępu. Masz aktywną blokadę nałożoną przez Zarząd.");
        window.location.href = '/'; 
      }
    };
    checkBlacklist();
  }, [user]);

  // 2. Obsługa po zeskanowaniu kodu QR
  const handleScan = async (qrHash) => {
    if (!qrHash) return;
    setIsScanning(false);
    setIsLoading(true);

    try {
      // Szukamy sali po zeskanowanym Hashu
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('qr_hash', qrHash)
        .single();

      if (roomErr || !room) throw new Error("Nieprawidłowy kod QR sali.");
      setRoomData(room);
      setScanResult(qrHash);

      // Sprawdzamy, czy user jest już "Gospodarzem" w tej sali (szukamy otwartej sesji)
      const { data: session } = await supabase
        .from('room_sessions')
        .select('*')
        .eq('room_id', room.id)
        .eq('host_id', user.id)
        .eq('status', 'ONGOING')
        .single();

      if (session) {
        setActiveSession(session);
      }
    } catch (err) {
      alert(err.message);
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Kompresja i Upload zdjęcia do Supabase Storage
  const uploadPhoto = async (file, type) => {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);
    
    const fileName = `${roomData.id}/${user.id}_${type}_${Date.now()}.webp`;
    
    const { data, error } = await supabase.storage
      .from('room-photos')
      .upload(fileName, compressedFile, { contentType: 'image/webp' });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from('room-photos')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  };

  // 3. Wysłanie Check-In
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!purpose || !photoFile) return alert("Wypełnij cel i zrób zdjęcie.");
    setIsLoading(true);

    try {
      const photoUrl = await uploadPhoto(photoFile, 'checkin');

      const { data, error } = await supabase
        .from('room_sessions')
        .insert([{
          room_id: roomData.id,
          host_id: user.id,
          purpose: purpose,
          check_in_photo_url: photoUrl
        }])
        .select()
        .single();

      if (error) throw error;
      alert("Wejście zarejestrowane! Jesteś teraz Gospodarzem sali.");
      setActiveSession(data);
    } catch (err) {
      alert("Błąd podczas zapisywania wejścia.");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Wysłanie Check-Out
  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!photoFile) return alert("Musisz zrobić zdjęcie po zakończeniu pracy!");
    if (!checks.trash || !checks.dishes || !checks.lights) return alert("Zaznacz wszystkie pola kontrolne!");
    setIsLoading(true);

    try {
      const photoUrl = await uploadPhoto(photoFile, 'checkout');

      const { error } = await supabase
        .from('room_sessions')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_photo_url: photoUrl,
          checklist_completed: true,
          status: 'COMPLETED'
        })
        .eq('id', activeSession.id);

      if (error) throw error;
      alert("Wyjście zarejestrowane pomyślnie. Dziękujemy za porządek!");
      setScanResult(null);
      setActiveSession(null);
      setRoomData(null);
      setPhotoFile(null);
    } catch (err) {
      alert("Błąd podczas zapisywania wyjścia.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">Komunikacja z bazą danych...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 pt-20 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
        
        {/* EKRAN 1: SKANOWANIE QR */}
        {!scanResult && (
          <div className="text-center animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 mb-2">System Weryfikacji</h2>
            <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">Zeskanuj kod QR z drzwi sali</p>
            
            {isScanning ? (
              <div className="rounded-2xl overflow-hidden mb-4 border-4 border-indigo-500">
                <QrReader
                  onResult={(result, error) => { if (result) handleScan(result?.text); }}
                  constraints={{ facingMode: 'environment' }}
                  style={{ width: '100%' }}
                />
              </div>
            ) : (
              <button onClick={() => setIsScanning(true)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700">Uruchom Aparat</button>
            )}

            {/* TYLKO DO TESTÓW - ZASTĄPIĆ PRAWDZIWYM HASHEM Z BAZY */}
            <button onClick={() => handleScan('H4SH-TEST-16J')} className="w-full mt-4 bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Dev: Symuluj skan sali 16J</button>
          </div>
        )}

        {/* EKRAN 2: CHECK-IN (WEJŚCIE) */}
        {scanResult && roomData && !activeSession && (
          <div className="animate-slideUp">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl font-black text-center uppercase tracking-widest text-sm mb-6 border border-emerald-200">
              Wykryto: {roomData.name}
            </div>
            <h3 className="font-black text-slate-800 text-xl mb-4">Rejestracja Wejścia</h3>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cel wejścia (Krótko)</label>
                <input type="text" required value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="np. Praca nad Wampiriadą" />
              </div>
              <div className="bg-slate-50 p-4 border rounded-xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">📸 Zdjęcie stanu sali (Przed pracą)</label>
                {/* Wymuszenie aparatu przez atrybut capture */}
                <input type="file" accept="image/*" capture="environment" required onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl mt-4">Wejdź do sali</button>
            </form>
          </div>
        )}

        {/* EKRAN 3: CHECK-OUT (WYJŚCIE) */}
        {scanResult && roomData && activeSession && (
          <div className="animate-slideUp">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl font-black text-center uppercase tracking-widest text-sm mb-6 border border-blue-200">
              Jesteś Gospodarzem: {roomData.name}
            </div>
            <h3 className="font-black text-slate-800 text-xl mb-4">Zwolnienie Przestrzeni</h3>
            <form onSubmit={handleCheckOut} className="space-y-5">
              <div className="bg-slate-50 p-4 border rounded-xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">📸 Dowód porządku (Zdjęcie po pracy)</label>
                <input type="file" accept="image/*" capture="environment" required onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">Checklista Wyjścia</p>
                <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" required checked={checks.trash} onChange={e => setChecks({...checks, trash: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  Wyniosłem/am swoje śmieci
                </label>
                <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" required checked={checks.dishes} onChange={e => setChecks({...checks, dishes: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  Umyłem/am i odłożyłem SUCHE naczynia
                </label>
                <label className="flex items-center gap-3 font-bold text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" required checked={checks.lights} onChange={e => setChecks({...checks, lights: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  Zamknąłem/am okna i zgasiłem światło
                </label>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl text-xs">Wychodzę</button>
                <button type="button" className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-black uppercase tracking-widest border text-xs hover:bg-slate-200">Przekaż Salę 🔄</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}