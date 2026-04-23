import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function ScannerPage() {
  const [scannedItems, setScannedItems] = useState([]);
  const [lastScanned, setLastScanned] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [mode, setMode] = useState('camera');
  const [decoding, setDecoding] = useState(false);
  const [photoResults, setPhotoResults] = useState([]); // { name, ok, code }
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const addItem = useCallback((text) => {
    if (!text) return;
    setLastScanned(prev => {
      if (text === prev) return prev;
      setScannedItems(s => [
        { code: text, time: new Date().toLocaleTimeString(), id: Date.now() },
        ...s,
      ]);
      if (navigator.vibrate) navigator.vibrate(50);
      return text;
    });
  }, []);

  const handleScan = (text) => addItem(text);

  const handleCameraError = (err) => {
    const msg = err?.message || String(err);
    setCameraError(msg);
    setMode('photo');
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (!files.length) return;
    setDecoding(true);
    setPhotoResults([]);

    const reader = new BrowserMultiFormatReader();
    const results = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const result = await reader.decodeFromImageUrl(url);
        const code = result.getText();
        results.push({ name: file.name, ok: true, code });
        addItem(code);
      } catch {
        results.push({ name: file.name, ok: false, code: null });
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    setPhotoResults(results);
    setDecoding(false);
    e.target.value = '';
  };

  const handleFinishScanning = () => {
    const extractedCodes = scannedItems.map(item => item.code);
    navigate('/sprzet', { state: { scannedCodes: extractedCodes } });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col text-white font-sans overflow-hidden">

      {/* NAGŁÓWEK */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleFinishScanning}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-black text-lg tracking-wide text-slate-100">Moduł SKI</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Skaner Aktywny
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Zeskanowano</p>
          <p className="text-xl font-black text-indigo-400 leading-none">{scannedItems.length}</p>
        </div>
      </div>

      {/* TRYB: KAMERA / ZDJĘCIE */}
      <div className="bg-slate-900 border-b border-slate-800 flex shrink-0">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${mode === 'camera' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Kamera
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${mode === 'photo' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Wgraj zdjęcia
        </button>
      </div>

      {/* GŁÓWNA STREFA */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {mode === 'camera' ? (
          <>
            {cameraError ? (
              <div className="flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-300">Kamera niedostępna</p>
                <p className="text-xs text-slate-500 leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => setMode('photo')}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-colors"
                >
                  Przejdź do wgrywania zdjęć
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <Scanner
                  onResult={(text) => handleScan(text)}
                  onError={handleCameraError}
                  options={{ delayBetweenScanAttempts: 1000, delayBetweenScanSuccess: 2000 }}
                />
              </div>
            )}

            {/* ramka celownika */}
            {!cameraError && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_3px_rgba(52,211,153,0.5)] animate-scanLaser"></div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* TRYB ZDJĘĆ */
          <div className="w-full h-full flex flex-col items-center justify-center px-8 gap-6">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="text-center">
              <p className="font-black text-slate-200 text-base mb-1">Wgraj zdjęcia z kodami QR</p>
              <p className="text-xs text-slate-500 leading-relaxed">Możesz wgrać do 3 zdjęć naraz.<br/>System automatycznie odczyta kody QR.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={decoding}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors shadow-lg shadow-blue-900/50"
            >
              {decoding ? 'Odczytuję kody...' : 'Wybierz zdjęcia (maks. 3)'}
            </button>

            {/* wyniki dekodowania zdjęć */}
            {photoResults.length > 0 && (
              <div className="w-full space-y-2">
                {photoResults.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.ok ? 'bg-emerald-500/10 border-emerald-700/50' : 'bg-red-500/10 border-red-700/50'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${r.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {r.ok ? '✓' : '✕'}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-slate-400 truncate">{r.name}</p>
                      {r.ok
                        ? <p className="text-xs font-black text-emerald-300 truncate">{r.code}</p>
                        : <p className="text-xs text-red-400">Nie znaleziono kodu QR</p>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LISTA SKANÓW I PRZYCISK FINALIZACJI */}
      <div className="h-1/3 min-h-[250px] bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider">Historia sesji</h2>
          <button onClick={() => setScannedItems([])} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors">Wyczyść</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {scannedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <svg className="w-12 h-12 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs uppercase tracking-widest font-bold">Brak skanów</p>
            </div>
          ) : (
            scannedItems.map((item) => (
              <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-2xl flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-black text-slate-200 truncate">{item.code}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.time}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handleFinishScanning}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-900/50 transition-colors"
          >
            Zatwierdź i przejdź do koszyka
          </button>
        </div>
      </div>
    </div>
  );
}
