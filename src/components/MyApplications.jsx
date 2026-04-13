// MyApplications — sekcja "Moje Wnioski" na Dashboardzie
// Agreguje wnioski zalogowanego użytkownika z 4 źródeł:
//   1. Rezerwacje sprzętu (GAS — allReservations, filtr po email w polu Kontakt)
//   2. Zgłoszenia apteczek (GAS — allFirstAidReports, filtr po Osoba === email)
//   3. Wniosek o dostęp do systemu (Firestore access_requests, filtr po email)
//   4. Lista dostępowa (Firestore access_submissions, filtr po email + bieżący miesiąc)

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useGASFetch } from '../hooks/useGASFetch';
import { CRW_API_URL, CALENDAR_API_URL } from '../config';

// === HELPERS ===

const EMAIL_REGEX = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const STATUS_STYLE = {
  pending:   { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Oczekuje'    },
  approved:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Zatwierdzone' },
  rejected:  { dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-200',         label: 'Odrzucone'   },
  resolved:  { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',      label: 'Zrealizowane' },
  unknown:   { dot: 'bg-slate-300',  badge: 'bg-slate-50 text-slate-500 border-slate-200',   label: 'Nieznany'    },
};

function mapStatus(raw) {
  if (!raw) return 'unknown';
  const r = String(raw).toLowerCase();
  if (r.includes('zatwierdz') || r.includes('approv') || r === 'approved') return 'approved';
  if (r.includes('odrzuc') || r.includes('reject'))  return 'rejected';
  if (r.includes('zrealizow') || r.includes('resolved') || r.includes('zakończ')) return 'resolved';
  if (r.includes('oczekuje') || r.includes('pending') || r.includes('zaopiniow') || r.includes('zgłoszono')) return 'pending';
  return 'unknown';
}

function StatusBadge({ raw }) {
  const s = STATUS_STYLE[mapStatus(raw)] ?? STATUS_STYLE.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Row({ icon, type, title, detail, status, date }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="shrink-0 w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-base">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{type}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
        {detail && <p className="text-xs text-slate-400 truncate">{detail}</p>}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <StatusBadge raw={status} />
        {date && <span className="text-[10px] text-slate-400 font-bold">{date}</span>}
      </div>
    </div>
  );
}

// === GŁÓWNY KOMPONENT ===

export default function MyApplications({ userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // GAS data — cache z useGASFetch (ten sam URL co EquipmentPage, więc cache trafienie)
  const { data: gasData } = useGASFetch(CRW_API_URL);
  const { data: calendarData } = useGASFetch(CALENDAR_API_URL);

  const gasItems = useMemo(() => {
    const result = [];
    if (!userEmail) return result;

    if (gasData) {
      // 1. Rezerwacje sprzętu — email ukryty w polu Kontakt
      const rezerwacje = gasData.rezerwacje || [];
      rezerwacje.forEach(r => {
        const match = EMAIL_REGEX.exec(r.Kontakt || '');
        const rezEmail = match ? match[1].toLowerCase() : null;
        if (rezEmail === userEmail.toLowerCase()) {
          result.push({
            key: `rez-${r.ID}`,
            icon: '📦',
            type: 'Rezerwacja sprzętu',
            title: r.Organizacja_Cel || r.Cel || 'Rezerwacja sprzętu',
            detail: r.Sprzet_Kody ? `Kody: ${r.Sprzet_Kody}` : null,
            status: r.Status,
            date: r.Data_Od ? r.Data_Od.slice(0, 10) : null,
            ts: r.Data_Od || '',
          });
        }
      });

      // 2. Zgłoszenia braków apteczek — Osoba === email
      const apteczki = gasData.apteczkiBraki || gasData.braki_apteczek || gasData.apteczki_braki || gasData.firstAidReports || [];
      apteczki.forEach(r => {
        if (!r.Osoba) return;
        if (r.Osoba.toLowerCase() !== userEmail.toLowerCase()) return;
        result.push({
          key: `aid-${r.ID || r.Data_Zgloszenia}`,
          icon: '🚑',
          type: 'Zgłoszenie apteczki',
          title: r.Apteczka_Nazwa || 'Zgłoszenie braków',
          detail: r.Powod || null,
          status: r.Status || 'Oczekuje',
          date: r.Data_Zgloszenia ? String(r.Data_Zgloszenia).slice(0, 10) : null,
          ts: r.Data_Zgloszenia || '',
        });
      });
    }

    if (calendarData) {
      // 3. Rezerwacje sal i przestrzeni
      const sale = calendarData.sale || [];
      const pending = calendarData.pending || [];
      const rejected = calendarData.rejected || []; // Dodane wsparcie dla odrzuconych, jeśli GAS to obsłuży
      
      const processEvent = (ev, statusLabel) => {
        const eventEmail = ev.email || ev.applicantName; 
        if (eventEmail && eventEmail.toLowerCase() === userEmail.toLowerCase()) {
          result.push({
            key: `cal-${ev.id || Math.random()}`,
            icon: '📅',
            type: 'Rezerwacja sali',
            title: `${ev.room} — ${ev.title}`,
            detail: `${ev.start} - ${ev.end}`,
            status: statusLabel,
            date: ev.date ? String(ev.date).substring(0, 10) : null,
            ts: ev.date || '',
          });
        }
      };

      sale.forEach(ev => processEvent(ev, 'approved'));
      pending.forEach(ev => processEvent(ev, ev.status || 'pending'));
      rejected.forEach(ev => processEvent(ev, 'rejected'));
    }

    return result;
  }, [gasData, calendarData, userEmail]);

  // Firestore items — ładowane dopiero gdy sekcja otwarta
  const fetchFirestore = async () => {
    if (!userEmail || fetched) return;
    setIsLoading(true);
    try {
      const firestoreItems = [];

      // 3. Wnioski o dostęp do systemu
      const reqQ = query(
        collection(db, 'access_requests'),
        where('email', '==', userEmail.toLowerCase())
      );
      const reqSnap = await getDocs(reqQ);
      reqSnap.docs.forEach(d => {
        const data = d.data();
        firestoreItems.push({
          key: `req-${d.id}`,
          icon: '🔑',
          type: 'Wniosek o dostęp do CRA',
          title: data.name || 'Wniosek o dostęp',
          detail: data.organization || null,
          status: data.status,
          date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0, 10) : null,
          ts: data.createdAt?.seconds || 0,
        });
      });

      // 4. Lista dostępowa — bieżący miesiąc
      const month = currentMonth();
      const accQ = query(
        collection(db, 'access_submissions'),
        where('email', '==', userEmail.toLowerCase()),
        where('month', '==', month)
      );
      const accSnap = await getDocs(accQ);
      accSnap.docs.forEach(d => {
        const data = d.data();
        firestoreItems.push({
          key: `acc-${d.id}`,
          icon: '🗝️',
          type: 'Lista dostępowa',
          title: data.room ? `Pomieszczenie: ${data.room}` : 'Zgłoszenie dostępu',
          detail: month,
          status: data.status || 'pending',
          date: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString().slice(0, 10) : null,
          ts: data.submittedAt?.seconds || 0,
        });
      });

      setItems(firestoreItems);
      setFetched(true);
    } catch (err) {
      console.error('[MyApplications] Firestore fetch error:', err);
      setFetched(true); // nie blokujemy przy błędzie
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !fetched) fetchFirestore();
  };

  // Połącz GAS + Firestore, posortuj od najnowszego
  const allItems = useMemo(() => {
    return [...gasItems, ...items].sort((a, b) => {
      if (!a.ts && !b.ts) return 0;
      if (!a.ts) return 1;
      if (!b.ts) return -1;
      return String(b.ts).localeCompare(String(a.ts));
    });
  }, [gasItems, items]);

  const pendingCount = useMemo(
    () => allItems.filter(i => mapStatus(i.status) === 'pending').length,
    [allItems]
  );

  return (
    <div className="w-full max-w-3xl mb-8">
      {/* NAGŁÓWEK SEKCJI — klikalny */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <span className="text-sm font-black text-slate-800 tracking-tight">Moje Wnioski</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200">
              {pendingCount} oczekuje
            </span>
          )}
        </div>
        <span className={`text-slate-400 text-xs font-bold transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* ZAWARTOŚĆ ROZWIJANA */}
      {isOpen && (
        <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-2 animate-fadeIn">
          {(isLoading && !fetched) ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold">Ładowanie wniosków...</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 font-bold">Brak złożonych wniosków w systemie.</p>
            </div>
          ) : (
            allItems.map(item => (
              <Row
                key={item.key}
                icon={item.icon}
                type={item.type}
                title={item.title}
                detail={item.detail}
                status={item.status}
                date={item.date}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
