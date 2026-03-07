import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ScannerPage() {
  const [scannedItems, setScannedItems] = useState([]);
  const [lastScanned, setLastScanned] = useState(null);

  const handleScan = (text) => {
    if (text) {
      // Zapobiegamy podwójnemu skanowaniu tego samego kodu w ułamku sekundy
      if (text !== lastScanned) {
        setLastScanned(text);
        
        // Dodajemy zeskanowany kod na samą górę listy
        setScannedItems(prev => [
          { code: text, time: new Date().toLocaleTimeString(), id: Date.now() },
          ...prev
        ]);

        // Krótka wibracja (jeśli telefon to obsługuje)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col text-white font-sans overflow-hidden">
      
      {/* NAGŁÓWEK SKANERA */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <Link 
            to="/wydawanie" 
            className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
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

      {/* WIZJER APARATU */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Kontener dla biblioteki skanera */}
        <div className="absolute inset-0 w-full h-full object-cover opacity-80">
          <Scanner 
            onResult={(text) => handleScan(text)} 
            onError={(error) => console.log(error?.message)}
            options={{
              delayBetweenScanAttempts: 1000,
              delayBetweenScanSuccess: 2000,
            }}
          />
        </div>

        {/* Nakładka celownika (Design) */}
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
          <div className="w-64 h-64 relative">
            {/* Rogi celownika */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
            
            {/* Laser skanujący */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_3px_rgba(52,211,153,0.5)] animate-scanLaser"></div>
          </div>
          <p className="mt-8 text-xs font-bold text-white/70 uppercase tracking-widest bg-black/50 px-4 py-1 rounded-full backdrop-blur-sm">
            Nakieruj kod kreskowy lub QR
          </p>
        </div>
      </div>

      {/* LISTA ZESKANOWANYCH PRZEDMIOTÓW */}
      <div className="h-1/3 min-h-[250px] bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider">Historia sesji</h2>
          <button 
            onClick={() => setScannedItems([])}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
          >
            Wyczyść
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {scannedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <svg className="w-12 h-12 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" /></svg>
              <p className="text-xs uppercase tracking-widest font-bold">Brak skanów</p>
            </div>
          ) : (
            scannedItems.map((item, index) => (
              <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-2xl flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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
      </div>

    </div>
  );
}