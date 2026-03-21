import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config';

const DIN_13169_ITEMS = [
  "Przylepiec na szpuli (5m x 2,5cm) - 2 szt.",
  "Zestaw plastrów (różne rozmiary) - 28 szt.",
  "Opatrunek indywidualny K (mały) - 2 szt.",
  "Opatrunek indywidualny M (średni) - 4 szt.",
  "Opatrunek indywidualny G (duży) - 2 szt.",
  "Chusta opatrunkowa (60 x 80 cm) - 2 szt.",
  "Kompresy (10 x 10 cm) - 12 szt.",
  "Koc termiczny (ratunkowy) - 2 szt.",
  "Opaska elastyczna (6 cm) - 4 szt.",
  "Opaska elastyczna (8 cm) - 4 szt.",
  "Chusta trójkątna - 4 szt.",
  "Nożyczki ratownicze - 1 szt.",
  "Rękawiczki jednorazowe - 4 pary"
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const isAdmin = user && user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());

  const [equipmentData, setEquipmentData] = useState([]);
  const [allReservations, setAllReservations] = useState([]); 
  const [allWydania, setAllWydania] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystko');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const [reservationData, setReservationData] = useState({
    dateFrom: '', dateTo: '', purpose: '', contactName: '', contactPhone: '', contactEmail: ''
  });

  const [isFirstAidModalOpen, setIsFirstAidModalOpen] = useState(false);
  const [usedItems, setUsedItems] = useState([]);
  const [firstAidDesc, setFirstAidDesc] = useState('');

  const API_URL = "https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec";

  const fetchData = () => {
    setIsLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const formattedData = data.sprzet.map(item => {
          let icon = '📦';
          if (item.TYP === 'OŚW') icon = '💡';
          if (item.TYP === 'AUD') icon = '🔊';
          if (item.TYP === 'WIZ') icon = '📷';
          if (item.TYP === 'ADM') icon = '🚧';
          if (item.RODZAJ === 'Apteczka') icon = '🚑';

          return {
            id: item.KOD_QR || `SSUEW-BRAK-${Math.floor(Math.random()*1000)}`,
            name: item.NAZWA_SPRZĘTU || 'Nieznany sprzęt',
            category: item.RODZAJ === 'Apteczka' ? 'Apteczki' : `${item.RODZAJ || ''} / ${item.TYP || ''}`.trim(),
            isFirstAid: item.RODZAJ === 'Apteczka',
            status: (item.UWAGI && item.UWAGI.toLowerCase().includes('uszkodz')) ? 'maintenance' : 'available',
            condition: item.UWAGI || 'Brak zastrzeżeń',
            locationPath: item.LOKALIZACJA || 'Magazyn SSUEW',
            description: item.INTERAKCJA ? `Wymagane akcesoria: ${item.INTERAKCJA}` : 'Brak powiązanych akcesoriów.',
            value: 'Zgodnie z ewidencją księgową',
            warranty: 'Sprawdź protokół zakupu',
            image: item.ZDJĘCIE || icon,
            isRealImage: !!item.ZDJĘCIE,
            link: item.LINK || null
          };
        });
        setEquipmentData(formattedData);
        setAllReservations(data.rezerwacje || []); 
        setAllWydania(data.wydania || []); 
        setIsLoading(false);
      })
      .catch(err => {
        setError("Nie udało się pobrać bazy sprzętu z CRW.");
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

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

  const checkForCollisions = () => {
    const startReq = new Date(reservationData.dateFrom).setHours(0,0,0,0);
    const endReq = new Date(reservationData.dateTo).setHours(0,0,0,0);
    for (let item of cart) {
      const itemReservations = allReservations.filter(r => r.Sprzet_Kody && r.Sprzet_Kody.includes(item.id) && r.Status === 'Zatwierdzone');
      for (let res of itemReservations) {
        const resStart = new Date(res.Data_Od).setHours(0,0,0,0);
        const resEnd = new Date(res.Data_Do).setHours(0,0,0,0);
        if (startReq <= resEnd && resStart <= endReq) { return item.name; }
      }
    }
    return null; 
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    if(!reservationData.dateFrom || !reservationData.dateTo || !reservationData.purpose || !reservationData.contactName || !reservationData.contactEmail) {
      alert("Proszę wypełnić wszystkie wymagane pola formularza rezerwacji."); return;
    }
    const collidingItemName = checkForCollisions();
    if (collidingItemName) {
      alert(`⛔ BŁĄD KOLIZJI!\nSprzęt: "${collidingItemName}" jest już zarezerwowany w tym terminie.`); return;
    }
    setIsSubmitting(true);
    let itemsCodes = cart.map(item => item.id).join(', ');
    const formattedContact = `${reservationData.contactName} | Tel: ${reservationData.contactPhone} | Email: ${reservationData.contactEmail}`;
    const payload = { action: "nowaRezerwacja", sprzetKody: itemsCodes, dataOd: reservationData.dateFrom, dataDo: reservationData.dateTo, cel: reservationData.purpose, kontakt: formattedContact };
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if(result.success) {
        alert("Wniosek został wysłany do Zarządu! Numer wniosku: " + result.id);
        setCart([]); setIsCheckoutOpen(false); setReservationData({dateFrom: '', dateTo: '', purpose: '', contactName: '', contactPhone: '', contactEmail: ''}); fetchData(); 
      } else { alert("Błąd po stronie serwera."); }
    } catch(err) { alert("Błąd połączenia."); } finally { setIsSubmitting(false); }
  };

  const handleFirstAidToggle = (item) => {
    if (usedItems.includes(item)) setUsedItems(usedItems.filter(i => i !== item));
    else setUsedItems([...usedItems, item]);
  };

  const submitFirstAidReport = async () => {
    if (usedItems.length === 0) return alert("Zaznacz, jakich materiałów użyłeś/aś.");
    if (!firstAidDesc) return alert("Podaj krótki powód (np. skaleczenie w palec).");
    setIsSubmitting(true);
    
    const payload = {
      action: "zglosBrakiApteczki",
      apteczkaId: selectedItem.id,
      apteczkaName: selectedItem.name,
      zuzyteMaterialy: usedItems.join(', '),
      powod: firstAidDesc,
      osoba: user?.email || "Anonimowy zgłaszający"
    };

    try {
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      alert("Zgłoszono braki w apteczce. Dziękujemy!");
      setIsFirstAidModalOpen(false); setUsedItems([]); setFirstAidDesc(''); setSelectedItem(null);
    } catch(err) {
      alert("Błąd połączenia.");
    } finally { setIsSubmitting(false); }
  };

  const getDynamicStatus = (item) => {
    if (item.status === 'maintenance') return 'maintenance';
    const isPhysicallyOut = allWydania.some(w => {
      const wStatus = String(w.STATUS || w.Status || w.status || '').trim().toUpperCase();
      const codes = String(w['SPRZĘT'] || w['Sprzęt (Kody QR)'] || '');
      return wStatus === 'WYDANE' && codes.includes(item.id);
    });
    if (isPhysicallyOut) return 'rented';
    const today = new Date().setHours(0,0,0,0);
    const isRentedToday = allReservations.some(res => {
      if (res.Sprzet_Kody && res.Sprzet_Kody.includes(item.id) && res.Status === 'Zatwierdzone') {
        const start = new Date(res.Data_Od).setHours(0,0,0,0);
        const end = new Date(res.Data_Do).setHours(0,0,0,0);
        return today >= start && today <= end;
      }
      return false;
    });
    return isRentedToday ? 'rented' : 'available';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span></span>Dostępny</span>;
      case 'rented': return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">🔵 Wypożyczony</span>;
      case 'maintenance': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">🔴 Serwis</span>;
      default: return null;
    }
  };

  const isDateReserved = (itemId, dateObj) => {
    const checkDate = dateObj.setHours(0,0,0,0);
    return allReservations.some(res => {
      if (res.Sprzet_Kody && res.Sprzet_Kody.includes(itemId) && res.Status === 'Zatwierdzone') {
        const start = new Date(res.Data_Od).setHours(0,0,0,0);
        const end = new Date(res.Data_Do).setHours(0,0,0,0);
        return checkDate >= start && checkDate <= end;
      }
      return false;
    });
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div><h2 className="text-xl font-black text-slate-800">Łączenie z bazą CRW...</h2></div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center"><div className="text-6xl mb-4">⚠️</div><h2 className="text-2xl font-black text-red-600 mb-2">Błąd synchronizacji</h2><p className="text-sm font-bold text-slate-600">{error}</p></div>;

  const dzisiaj = new Date().toLocaleDateString('pl-PL');

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center pb-32">
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-indigo-50/50 pointer-events-none z-0"></div>

      {isAdmin && (
        <div className="absolute top-6 right-6 z-50 animate-fadeIn">
          <Link to="/wydawanie" className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-400 hover:bg-slate-800 hover:scale-105 transition-all">
            <span>🔐</span> Panel Administracji (CRW)
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
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${selectedCategory === cat ? (cat === 'Apteczki' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-indigo-600 text-white shadow-indigo-200') : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.length > 0 ? filteredEquipment.map((item) => {
            const currentStatus = getDynamicStatus(item); 
            return (
              <div key={item.id} className={`bg-white rounded-3xl p-6 shadow-lg border transition-all duration-300 group flex flex-col h-full ${isInCart(item.id) ? 'border-indigo-500 shadow-indigo-200 ring-4 ring-indigo-50' : 'border-slate-100 shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shadow-inner group-hover:scale-110 transition-transform overflow-hidden ${item.isFirstAid ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                     {item.isRealImage ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.image}
                  </div>
                  {getStatusBadge(currentStatus)}
                </div>
                <div className="mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.isFirstAid ? 'text-rose-500' : 'text-indigo-500'}`}>{item.category}</span>
                  <h2 className="text-lg font-black text-slate-800 leading-tight mt-1">{item.name}</h2>
                  <span className="text-[10px] font-bold text-slate-400 font-mono mt-1 block bg-slate-50 inline-block px-2 py-1 rounded-md">{item.id}</span>
                </div>
                <div className="mt-auto pt-6 flex gap-2">
                  <button onClick={() => {setSelectedItem(item); setActiveTab('info');}} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">Paszport</button>
                  <button onClick={() => toggleCart(item)} disabled={currentStatus === 'maintenance'} className={`flex-[2] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all ${isInCart(item.id) ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'}`}>
                    {isInCart(item.id) ? '✓ Wybrano' : '+ Rezerwuj'}
                  </button>
                </div>
              </div>
            )
          }) : <div className="col-span-full text-center py-12"><p className="text-slate-400 font-bold text-lg">Brak sprzętu w tej kategorii.</p></div>}
        </div>
      </div>

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

      {/* FORMULARZ KOSZYKA */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Formularz Rezerwacji</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Zaklep sprzęt na swoje wydarzenie</p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Od</label><input type="date" value={reservationData.dateFrom} onChange={e => setReservationData({...reservationData, dateFrom: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Do</label><input type="date" value={reservationData.dateTo} onChange={e => setReservationData({...reservationData, dateTo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cel rezerwacji (Nazwa wydarzenia)</label><input type="text" placeholder="np. Dni Otwarte UEW..." value={reservationData.purpose} onChange={e => setReservationData({...reservationData, purpose: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Imię i Nazwisko / Organizacja</label><input type="text" placeholder="Jan Kowalski (SKN Zarządzania)" value={reservationData.contactName} onChange={e => setReservationData({...reservationData, contactName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</label><input type="email" placeholder="jan@student.ue.wroc.pl" value={reservationData.contactEmail} onChange={e => setReservationData({...reservationData, contactEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefon</label><input type="text" placeholder="123 456 789" value={reservationData.contactPhone} onChange={e => setReservationData({...reservationData, contactPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Rezerwowane przedmioty:</p>
              <ul className="text-sm font-bold text-indigo-900 space-y-1">{cart.map((item, idx) => <li key={item.id}>{idx + 1}. {item.name}</li>)}</ul>
            </div>

            <button onClick={handleReservationSubmit} disabled={isSubmitting} className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all">
              {isSubmitting ? 'Weryfikacja...' : 'Wyślij Wniosek do Biura'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL ZGŁASZANIA BRAKÓW W APTECZCE */}
      {isFirstAidModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-slideUp max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsFirstAidModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚑</span>
              <div>
                <h2 className="text-2xl font-black text-rose-600 leading-tight">Użyto Apteczki</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedItem.name}</p>
              </div>
            </div>
            
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-6">
              <p className="text-xs text-rose-800 font-medium text-justify">
                Zgodnie z Zarządzeniem, masz obowiązek zgłosić zużycie materiałów ratunkowych (Norma DIN 13169), aby Administracja mogła je niezwłocznie uzupełnić.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Zaznacz zużyte elementy:</label>
                <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 scrollbar-thin">
                  {DIN_13169_ITEMS.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                      <input type="checkbox" checked={usedItems.includes(item)} onChange={() => handleFirstAidToggle(item)} className="w-5 h-5 accent-rose-600 rounded" />
                      <span className="text-xs font-bold text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Krótki opis zdarzenia</label>
                <input type="text" placeholder="np. Skaleczenie palca papierem..." value={firstAidDesc} onChange={e => setFirstAidDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none" />
              </div>
            </div>

            <button onClick={submitFirstAidReport} disabled={isSubmitting} className="block text-center w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-200 transition-all">
              {isSubmitting ? 'Wysyłanie zgłoszenia...' : 'Zgłoś Braki Administracji'}
            </button>
          </div>
        </div>
      )}

      {/* PASZPORT MAJĄTKU (Z ZAKŁADKĄ DIN DLA APTECZEK) */}
      {selectedItem && !isFirstAidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative animate-slideUp overflow-hidden flex flex-col md:flex-row">
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-900/10 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-colors font-bold z-10">✕</button>
            
            <div className={`md:w-2/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ${selectedItem.isFirstAid ? 'bg-rose-900' : 'bg-slate-900'}`}>
               <div className={`absolute inset-0 blur-[100px] rounded-full ${selectedItem.isFirstAid ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}></div>
               <div className={`w-32 h-32 bg-white rounded-3xl flex items-center justify-center text-5xl border-4 shadow-2xl shrink-0 overflow-hidden mb-6 z-10 ${selectedItem.isFirstAid ? 'border-rose-700' : 'border-slate-700'}`}>
                 {selectedItem.isRealImage ? <img src={selectedItem.image} className="w-full h-full object-cover" /> : selectedItem.image}
              </div>
              <div className="z-10 w-full">
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${selectedItem.isFirstAid ? 'text-rose-400' : 'text-indigo-400'}`}>{selectedItem.category}</span>
                <h2 className="text-2xl font-black text-white leading-tight mb-4">{selectedItem.name}</h2>
                <div className={`p-3 rounded-xl border w-full ${selectedItem.isFirstAid ? 'bg-rose-800 border-rose-700' : 'bg-slate-800 border-slate-700'}`}>
                   <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Sygnatura CRW</p>
                   <p className="font-mono text-sm font-black text-white break-all">{selectedItem.id}</p>
                </div>
                <div className="mt-6 flex justify-center">{getStatusBadge(getDynamicStatus(selectedItem))}</div>
              </div>
            </div>

            <div className="md:w-3/5 p-8 bg-slate-50 flex flex-col">
              <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
                <button onClick={() => setActiveTab('info')} className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Karta</button>
                <button onClick={() => setActiveTab('lokalizacja')} className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lokalizacja' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Lokalizacja</button>
                <button onClick={() => setActiveTab('kalendarz')} className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'kalendarz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Kalendarz</button>
                {selectedItem.isFirstAid && (
                  <button onClick={() => setActiveTab('din')} className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'din' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-500 hover:text-rose-800'}`}>Norma DIN</button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'info' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Akcesoria w zestawie / Interakcje</span>
                      <p className="text-sm font-medium text-slate-700 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">{selectedItem.description}</p>
                    </div>
                    {selectedItem.link && (
                      <a href={selectedItem.link} target="_blank" rel="noreferrer" className="block text-center bg-indigo-50 border border-indigo-100 text-indigo-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                        🔗 Zobacz specyfikację
                      </a>
                    )}
                    {selectedItem.isFirstAid && (
                      <a href="#" className="block text-center bg-rose-50 border border-rose-100 text-rose-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors mt-4">
                        🔗 Zarządzenie ws. Apteczek (PDF)
                      </a>
                    )}
                  </div>
                )}

                {activeTab === 'lokalizacja' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Drzewo Magazynowe</span>
                      <div className="font-bold text-slate-800 text-sm leading-loose">
                        {selectedItem.locationPath.split(' > ').map((step, i, arr) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-indigo-300 opacity-50">{'↳'.padStart(i + 1, ' ')}</span>
                            <span className={i === arr.length - 1 ? 'bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100' : ''}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stan Fizyczny wg CRW</span>
                      <span className="font-black text-slate-800 text-sm block">{selectedItem.condition}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'kalendarz' && (
                  <div className="animate-fadeIn">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Grafik rezerwacji (28 dni w przód)</span>
                    <div className="grid grid-cols-7 gap-1.5 mb-6">
                      {Array.from({length: 28}).map((_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + i);
                        const isBooked = isDateReserved(selectedItem.id, d); 
                        return (
                          <div key={i} className={`flex flex-col items-center justify-center p-2.5 rounded-lg border ${isBooked ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                            <span className="text-[8px] font-black uppercase opacity-60 mb-0.5">{d.toLocaleDateString('pl-PL', {weekday: 'short'})}</span>
                            <span className="text-sm font-black leading-none">{d.getDate()}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div> Zajęte</span>
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></div> Wolne</span>
                    </div>
                  </div>
                )}

                {activeTab === 'din' && selectedItem.isFirstAid && (
                  <div className="animate-fadeIn border border-slate-300 bg-white p-6 relative">
                    <div className="text-center border-b border-black pb-4 mb-4">
                      <h3 className="font-black text-lg">PROTOKÓŁ WYPOSAŻENIA APTECZKI</h3>
                      <p className="font-bold text-slate-600 text-sm">Zgodność z Normą DIN 13169</p>
                      <p className="text-xs mt-1">Stan na dzień: <strong>{dzisiaj}</strong></p>
                    </div>
                    <table className="w-full text-left text-[10px] mb-8 border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100"><th className="p-2 border border-slate-300">Składnik</th><th className="p-2 border border-slate-300 text-center">Stan</th></tr>
                      </thead>
                      <tbody>
                        {DIN_13169_ITEMS.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border border-slate-300">{item}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-emerald-600">ZGODNY</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between mt-12 pt-4 border-t border-dashed border-slate-300 text-[10px] text-center">
                      <div className="w-1/2">
                        <p className="mb-8">..........................................</p>
                        <p className="font-bold">ZATWIERDZIŁ</p>
                        <p className="text-slate-500">Zarząd SSUEW</p>
                      </div>
                      <div className="w-1/2">
                        <p className="mb-8">..........................................</p>
                        <p className="font-bold">ZATWIERDZIŁ</p>
                        <p className="text-slate-500">Sekcja BHP UEW</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}