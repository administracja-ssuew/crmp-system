import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config';

export default function EquipmentPage() {
  const { user } = useAuth();
  const isAdmin = user && user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());

  const [equipmentData, setEquipmentData] = useState([]);
  const [allReservations, setAllReservations] = useState([]); // NOWOŚĆ: Stan na rezerwacje z bazy
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystko');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // NOWOŚĆ: Blokada przycisku podczas wysyłania
  
  const [reservationData, setReservationData] = useState({
    dateFrom: '', dateTo: '', purpose: '', contactInfo: ''
  });

  // === STANY DLA MODUŁU SZKODY (ZAŁĄCZNIK NR 8) ===
  const [isDamageReportOpen, setIsDamageReportOpen] = useState(false);
  const [damageData, setDamageData] = useState({
    perpetrator: '',
    albumId: '',
    type: 'Mechaniczne',
    description: '',
    photoUrl: null
  });

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  const fetchData = () => {
    setIsLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        
        // NOWOŚĆ: Zmiana w mapowaniu danych (ZDJĘCIA i LOKALIZACJA)
        const formattedData = data.sprzet.map(item => {
          let icon = '📦';
          if (item.TYP === 'OŚW') icon = '💡';
          if (item.TYP === 'AUD') icon = '🔊';
          if (item.TYP === 'WIZ') icon = '📷';
          if (item.TYP === 'ADM') icon = '🚧';

          return {
            id: item.KOD_QR || `SSUEW-BRAK-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            category: `${item.RODZAJ || ''} / ${item.TYP || ''}`.trim(),
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            // POPRAWKA: Używamy LOKALIZACJI zamiast POLA SPISOWEGO
            locationPath: item.LOKALIZACJA || 'Magazyn SSUEW',
            description: item.INTERAKCJA ? `Wymagane akcesoria: ${item.INTERAKCJA}` : 'Brak powiązanych akcesoriów.',
            value: 'Zgodnie z ewidencją księgową',
            warranty: 'Sprawdź protokół zakupu',
            // NOWOŚĆ: Priorytet ma link do zdjęcia, jeśli brak -> ikona
            image: item.ZDJĘCIE || icon,
            isRealImage: !!item.ZDJĘCIE,
            link: item.LINK || null
          };
        });
        setEquipmentData(formattedData);
        setAllReservations(data.rezerwacje || []); // Zapisujemy rezerwacje do osi czasu
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Błąd pobierania bazy CRW:", err);
        setError("Nie udało się pobrać bazy sprzętu z CRW. Sprawdź połączenie lub link.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allCategories = ['Wszystko', ...new Set(equipmentData.map(item => item.category))];

  const filteredEquipment = equipmentData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Wszystko' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCart = (item) => {
    if (cart.find(c => c.id === item.id)) setCart(cart.filter(c => c.id !== item.id));
    else setCart([...cart, item]);
  };
  const isInCart = (id) => cart.some(c => c.id === id);

  // === NOWOŚĆ: AUTOMATYCZNA WYSYŁKA DO BAZY ZAMIAST E-MAILA ===
  const handleReservationSubmit = async () => {
    // Prosta walidacja przed wysyłką
    if(!reservationData.dateFrom || !reservationData.dateTo || !reservationData.purpose || !reservationData.contactInfo) {
      alert("Proszę wypełnić wszystkie pola formularza rezerwacji.");
      return;
    }

    setIsSubmitting(true);
    
    // Lista KODÓW QR wybranych przedmiotów
    let itemsCodes = cart.map(item => item.id).join(', ');
    
    const payload = {
      action: "nowaRezerwacja",
      sprzetKody: itemsCodes,
      dataOd: reservationData.dateFrom,
      dataDo: reservationData.dateTo,
      cel: reservationData.purpose,
      kontakt: reservationData.contactInfo
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if(result.success) {
        alert("Wniosek o rezerwację został przekazany do akceptacji Zarządu!");
        setCart([]); // Czyszczenie koszyka
        setIsCheckoutOpen(false); // Zamknięcie modala
        setReservationData({dateFrom: '', dateTo: '', purpose: '', contactInfo: ''});
        fetchData(); // Odświeżenie danych z CRW
      } else {
        alert("Błąd po stronie serwera: " + result.error);
      }
    } catch(err) {
      alert("Błąd połączenia. Spróbuj ponownie później.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span></span>Dostępny</span>;
      case 'rented': return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">🔵 Wypożyczony</span>;
      case 'maintenance': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">🔴 Serwis</span>;
      default: return null;
    }
  };

  // === NOWOŚĆ: SPRAWDZANIE OSI CZASU Z BAZY REZERWACJI ===
  const isDateReserved = (itemId, dateObj) => {
    const checkDate = dateObj.setHours(0,0,0,0);
    
    return allReservations.some(res => {
      // Szukamy tylko zatwierdzonych wniosków zawierających ten sprzęt
      if (res.Sprzet_Kody && res.Sprzet_Kody.includes(itemId) && res.Status === 'Zatwierdzone') {
        const start = new Date(res.Data_Od).setHours(0,0,0,0);
        const end = new Date(res.Data_Do).setHours(0,0,0,0);
        return checkDate >= start && checkDate <= end;
      }
      return false;
    });
  };

  // OBSŁUGA APARATU
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setDamageData({ ...damageData, photoUrl: imageUrl });
    }
  };

  const submitDamageReport = () => {
    alert("Protokół Szkody został wygenerowany. W przyszłości system wyśle to zdjęcie i formularz bezpośrednio do bazy CRW i Zarządu!");
    setIsDamageReportOpen(false);
    setDamageData({ perpetrator: '', albumId: '', type: 'Mechaniczne', description: '', photoUrl: null });
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div><h2 className="text-xl font-black text-slate-800">Łączenie z bazą CRW...</h2></div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center"><div className="text-6xl mb-4">⚠️</div><h2 className="text-2xl font-black text-red-600 mb-2">Błąd synchronizacji</h2><p className="text-sm font-bold text-slate-600">{error}</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center pb-32">
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-indigo-50/50 pointer-events-none z-0"></div>

      {/* PRZYCISK ADMINISTRATORA */}
      {isAdmin && (
        <div className="absolute top-6 right-6 z-50 animate-fadeIn">
          <Link to="/wydawanie" className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-400 hover:bg-slate-800 hover:scale-105 transition-all">
            <span>🔐</span> Panel Wydawania (Admin)
          </Link>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl pt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Katalog Majątku</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Centralny Rejestr Wypożyczeń (CRW)</p>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-6 max-w-xl mx-auto flex items-center">
          <span className="pl-4 pr-2 text-xl opacity-50">🔍</span>
          <input type="text" placeholder="Szukaj po nazwie lub sygnaturze..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-3 px-2 outline-none"/>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
          {allCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* SIATKA SPRZĘTU */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
            <div key={item.id} className={`bg-white rounded-3xl p-6 shadow-lg border transition-all duration-300 group flex flex-col h-full ${isInCart(item.id) ? 'border-indigo-500 shadow-indigo-200 ring-4 ring-indigo-50' : 'border-slate-100 shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="flex justify-between items-start mb-4">
                {/* NOWOŚĆ: Zdjęcie (jeśli jest) lub ikona */}
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                   {item.isRealImage ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.image}
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category}</span>
                <h2 className="text-lg font-black text-slate-800 leading-tight mt-1">{item.name}</h2>
                <span className="text-[10px] font-bold text-slate-400 font-mono mt-1 block bg-slate-50 inline-block px-2 py-1 rounded-md">{item.id}</span>
              </div>
              <div className="mt-auto pt-6 flex gap-2">
                <button onClick={() => {setSelectedItem(item); setActiveTab('info');}} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">Paszport</button>
                <button onClick={() => toggleCart(item)} disabled={item.status === 'maintenance'} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all ${isInCart(item.id) ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'}`}>
                  {isInCart(item.id) ? '✓ Wybrano' : '+ Rezerwuj'}
                </button>
              </div>
            </div>
          )) : <div className="col-span-full text-center py-12"><p className="text-slate-400 font-bold text-lg">Brak sprzętu w tej kategorii.</p></div>}
        </div>
      </div>

      {/* BELKA REZERWACJI */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl flex items-center justify-between z-40 animate-slideUp">
          <div className="flex items-center gap-4 pl-2">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-xl shadow-inner">📅</div>
            <div>
              <p className="text-white font-black leading-tight">Wniosek o Rezerwację</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Wybrano: {cart.length} szt.</p>
            </div>
          </div>
          <button onClick={() => setIsCheckoutOpen(true)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">Dalej →</button>
        </div>
      )}

      {/* MODAL REZERWACJI - ZMIENIONY NA WYSYŁANIE POST DO GOOGLE SHEETS */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Formularz Rezerwacji</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Wniosek trafi prosto do Zarządu</p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Od</label><input type="date" value={reservationData.dateFrom} onChange={e => setReservationData({...reservationData, dateFrom: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Do</label><input type="date" value={reservationData.dateTo} onChange={e => setReservationData({...reservationData, dateTo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cel rezerwacji (Nazwa wydarzenia)</label><input type="text" placeholder="np. Dni Otwarte UEW..." value={reservationData.purpose} onChange={e => setReservationData({...reservationData, purpose: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Organizacja / Osoba Kontaktowa</label><input type="text" placeholder="np. SKN Zarządzania - Jan Kowalski, 123456789" value={reservationData.contactInfo} onChange={e => setReservationData({...reservationData, contactInfo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Rezerwowane przedmioty:</p>
              <ul className="text-sm font-bold text-indigo-900 space-y-1">{cart.map((item, idx) => <li key={item.id}>{idx + 1}. {item.name}</li>)}</ul>
            </div>

            <button onClick={handleReservationSubmit} disabled={isSubmitting} className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all">
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij Wniosek'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PASZPORTU */}
      {selectedItem && !isDamageReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp border border-white/20">
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold">✕</button>
            <div className="flex items-center gap-4 mb-6 pr-10">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner shrink-0 overflow-hidden">
                 {selectedItem.isRealImage ? <img src={selectedItem.image} className="w-full h-full object-cover" /> : selectedItem.image}
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paszport Majątku</span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">{selectedItem.name}</h2>
              </div>
            </div>
            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto">
              {['info', 'lokalizacja', 'terminarz', 'serwis'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
              ))}
            </div>
            <div className="min-h-[200px] mb-8">
              {activeTab === 'info' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sygnatura INW</span><span className="font-mono text-sm font-black text-slate-700 break-all">{selectedItem.id}</span></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status CRW</span><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
                  </div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Zestaw / Akcesoria</span><p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedItem.description}</p></div>
                  {selectedItem.link && (<div className="pt-2 text-center"><a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest underline transition-colors">🔗 Zobacz sprzęt w katalogu/sklepie</a></div>)}
                </div>
              )}
              {activeTab === 'lokalizacja' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📍</div><span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Drzewo Lokalizacji</span><div className="font-bold text-indigo-900 text-sm leading-relaxed flex flex-col gap-2">{selectedItem.locationPath.split(' > ').map((step, i, arr) => (<div key={i} className="flex items-center gap-2"><span className="text-indigo-300">{'↳'.padStart(i + 1, ' ')}</span><span className={i === arr.length - 1 ? 'bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100' : ''}>{step}</span></div>))}</div></div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stan Fizyczny (Uwagi)</span><span className="font-black text-slate-700 text-sm block">{selectedItem.condition}</span></div>
                </div>
              )}
              {activeTab === 'terminarz' && (
                <div className="space-y-4 animate-fadeIn">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dostępność (Najbliższe 28 dni)</span>
                  {/* NOWOŚĆ: INTERAKTYWNY KALENDARZ 28 DNI */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({length: 28}).map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      const isBooked = isDateReserved(selectedItem.id, d); 
                      return (
                        <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${isBooked ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                          <span className="text-[8px] font-black uppercase">{d.toLocaleDateString('pl-PL', {weekday: 'short'})}</span>
                          <span className="text-sm font-black">{d.getDate()}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-600 flex justify-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Rezerwacja</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Wolne</span>
                  </div>
                </div>
              )}
              {activeTab === 'serwis' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wartość Księgowa</span><span className="font-black text-slate-700 text-sm">{selectedItem.value}</span></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gwarancja do</span><span className="font-black text-slate-700 text-sm">{selectedItem.warranty}</span></div>
                  </div>
                  
                  <button 
                    onClick={() => setIsDamageReportOpen(true)} 
                    className="mt-4 w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>⚠️</span> Zgłoś uszkodzenie (Załącznik nr 8)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL PROTOKOŁU SZKODY (ZAŁĄCZNIK 8) - TWOJA LOGIKA I APARAT === */}
      {isDamageReportOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsDamageReportOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🚨</span>
              <div>
                <h2 className="text-2xl font-black text-red-600 leading-tight">Protokół Szkody</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Załącznik nr 8 do Regulaminu SSUEW</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Przedmiot Szkody</span>
              <p className="font-black text-slate-800 text-sm">{selectedItem.name}</p>
              <p className="font-mono text-slate-500 text-[10px] mt-1">{selectedItem.id}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sprawca / Ostatni Wypożyczający</label>
                <input type="text" placeholder="Imię, Nazwisko, Organizacja..." value={damageData.perpetrator} onChange={e => setDamageData({...damageData, perpetrator: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nr Albumu Sprawcy</label>
                <input type="text" placeholder="Wymagane do postępowania regresowego" value={damageData.albumId} onChange={e => setDamageData({...damageData, albumId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rodzaj Zdarzenia</label>
                <select value={damageData.type} onChange={e => setDamageData({...damageData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none">
                  <option value="Mechaniczne">Uszkodzenie Mechaniczne (np. uderzenie, pęknięcie)</option>
                  <option value="Zalanie">Zalanie cieczą</option>
                  <option value="Kradzież">Zagubienie / Kradzież</option>
                  <option value="Braki">Brak okablowania / akcesoriów</option>
                  <option value="Inne">Inne uszkodzenie</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Szczegółowy Opis Szkody</label>
                <textarea rows="3" placeholder="Opisz dokładnie co zostało zniszczone i w jakich okolicznościach..." value={damageData.description} onChange={e => setDamageData({...damageData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"></textarea>
              </div>

              {/* INTEGRACJA Z APARATEM (DOKUMENTACJA FOTOGRAFICZNA) */}
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-red-600 uppercase mb-2">Dokumentacja Fotograficzna</span>
                
                {!damageData.photoUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-red-200 border-dashed rounded-lg cursor-pointer bg-white hover:bg-red-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="text-2xl mb-1">📷</span>
                      <p className="text-xs font-bold text-red-500">Zrób zdjęcie usterki</p>
                    </div>
                    {/* Ten input wywołuje aparat na urządzeniach mobilnych! */}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={damageData.photoUrl} alt="Podgląd usterki" className="w-full h-40 object-cover rounded-lg border border-red-200 shadow-sm" />
                    <button onClick={() => setDamageData({...damageData, photoUrl: null})} className="absolute top-2 right-2 bg-slate-900/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-slate-900">✕</button>
                    <p className="text-[9px] font-bold text-red-500 uppercase mt-2 text-center">Zdjęcie załączone do protokołu</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={submitDamageReport} 
              disabled={!damageData.perpetrator || !damageData.description}
              className="block text-center w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 transition-all"
            >
              Zatwierdź Protokół Szkody
            </button>
          </div>
        </div>
      )}

    </div>
  );
}