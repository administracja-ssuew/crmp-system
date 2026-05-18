import { useState, useEffect, useMemo, useRef } from 'react';

const AS_URL = import.meta.env.VITE_AS_SALA_URL || import.meta.env.VITE_AS_URL;

const HOURS = [
  '8:00','9:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'
];
const DAY_NAMES = ['Pon','Wt','Śr','Cz','Pi','So','Nd'];

const SLOT_STYLE = {
  wolna:  { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46', label: 'Wolna'  },
  zajeta: { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f', label: 'Zajęta' },
  rsa:    { bg: '#fffbeb', border: '#fbbf24', text: '#92400e', label: 'RSA — rezerwacja adm.' },
};

export default function SalaKalendar() {
  const [rooms, setRooms]           = useState([]);
  const [search, setSearch]         = useState('');
  const [selectedRoom, setSelected] = useState(null);
  const [tyg, setTyg]               = useState(null);
  const [schedule, setSchedule]     = useState(null);
  const [loading, setLoading]       = useState({ rooms: false, schedule: false });
  const [error, setError]           = useState(null);
  const [tooltip, setTooltip]       = useState(null);
  const [showDebug, setShowDebug]   = useState(false);
  const tooltipRef = useRef();

  const gasJson = async (url) => {
    const r = await fetch(url);
    const text = await r.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error('Backend zwrócił HTML zamiast JSON — sprawdź czy Apps Script jest wdrożony i URL poprawny.');
    }
    return JSON.parse(text);
  };

  useEffect(() => {
    if (!AS_URL) {
      setError('Brak VITE_AS_SALA_URL. Skonfiguruj zmienną środowiskową i wdróż Apps Script.');
      return;
    }
    setLoading(l => ({ ...l, rooms: true }));
    gasJson(`${AS_URL}?action=getSalaList`)
      .then(j => { if (j.success) setRooms(j.data); else setError(j.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({ ...l, rooms: false })));
  }, []);

  useEffect(() => {
    if (!selectedRoom || !AS_URL) return;
    setLoading(l => ({ ...l, schedule: true }));
    setError(null);
    const url = `${AS_URL}?action=getSalaSchedule&id=${selectedRoom.id}${tyg ? `&tyg=${tyg}` : ''}`;
    gasJson(url)
      .then(j => { if (j.success) setSchedule(j.data); else setError(j.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({ ...l, schedule: false })));
  }, [selectedRoom, tyg]);

  const handleRoomSelect = (room) => {
    if (selectedRoom?.id === room.id) return;
    setSelected(room);
    setTyg(null);
    setSchedule(null);
    setShowDebug(false);
  };

  const filteredRooms = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter(r =>
      r.name.toLowerCase().includes(q) || r.building.toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const roomsByBuilding = useMemo(() => {
    const map = {};
    filteredRooms.forEach(r => {
      if (!map[r.building]) map[r.building] = [];
      map[r.building].push(r);
    });
    return map;
  }, [filteredRooms]);

  useEffect(() => {
    const handler = () => setTooltip(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Obsługa obu formatów GAS: nowy ({ week }) i stary ({ weeks: [...] })
  const currentWeek = schedule?.week ?? schedule?.weeks?.[0];
  const prevTyg = schedule?.prevTyg ?? null;
  const nextTyg = schedule?.nextTyg ?? null;

  // Statystyki slotów do debugowania
  const slotStats = useMemo(() => {
    if (!currentWeek?.days) return null;
    const stats = {};
    for (const [day, data] of Object.entries(currentWeek.days)) {
      const slots = data.slots || [];
      stats[day] = {
        wolna:  slots.filter(s => s.status === 'wolna').length,
        zajeta: slots.filter(s => s.status === 'zajeta').length,
        rsa:    slots.filter(s => s.status === 'rsa').length,
        total:  slots.length,
      };
    }
    return stats;
  }, [currentWeek]);

  return (
    <div style={styles.root}>
      {/* NAGŁÓWEK */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Kalendarz sal UEW</h2>
          <p style={styles.subtitle}>Sprawdź dostępność sal dydaktycznych na podstawie planu zajęć</p>
        </div>
        <a
          href="https://www.ue.wroc.pl/studenci/3044/rezerwacja_sal.html"
          target="_blank"
          rel="noreferrer"
          style={styles.ctaBtn}
        >
          Złóż podanie do Prorektora →
        </a>
      </div>

      <div style={styles.layout}>
        {/* PANEL BOCZNY */}
        <aside style={styles.sidebar}>
          <input
            style={styles.searchInput}
            placeholder="Szukaj sali… (np. E101, CKU)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {loading.rooms && <p style={styles.info}>Ładowanie sal…</p>}
          <div style={styles.roomList}>
            {Object.entries(roomsByBuilding).sort().map(([building, roomsInBuilding]) => (
              <div key={building}>
                <div style={styles.buildingLabel}>Budynek {building}</div>
                {roomsInBuilding.map(room => (
                  <button
                    key={room.id}
                    style={{ ...styles.roomBtn, ...(selectedRoom?.id === room.id ? styles.roomBtnActive : {}) }}
                    onClick={() => handleRoomSelect(room)}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            ))}
            {filteredRooms.length === 0 && !loading.rooms && (
              <p style={styles.info}>Brak wyników</p>
            )}
          </div>
        </aside>

        {/* GŁÓWNA ZAWARTOŚĆ */}
        <main style={styles.main}>
          {!selectedRoom && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>🏛️</span>
              <p>Wybierz salę z listy po lewej, aby zobaczyć jej plan zajęć</p>
            </div>
          )}

          {selectedRoom && loading.schedule && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>⏳</span>
              <p>Pobieranie planu sali <strong>{selectedRoom.name}</strong>…</p>
            </div>
          )}

          {selectedRoom && !loading.schedule && schedule && (
            <>
              {/* Nagłówek */}
              <div style={styles.planHeader}>
                <h3 style={styles.planTitle}>
                  Sala {schedule.roomName || selectedRoom.name}
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>
                    ID: {selectedRoom.id}
                  </span>
                </h3>
                <div style={styles.weekNav}>
                  <button
                    style={{ ...styles.navBtn, opacity: prevTyg ? 1 : 0.35 }}
                    disabled={!prevTyg}
                    onClick={() => setTyg(prevTyg)}
                    title="Poprzedni tydzień"
                  >‹</button>
                  <span style={styles.weekLabel}>
                    {currentWeek?.label ?? 'Brak danych'}
                  </span>
                  <button
                    style={{ ...styles.navBtn, opacity: nextTyg ? 1 : 0.35 }}
                    disabled={!nextTyg}
                    onClick={() => setTyg(nextTyg)}
                    title="Następny tydzień"
                  >›</button>
                </div>
              </div>

              {/* Legenda */}
              <div style={styles.legend}>
                {Object.entries(SLOT_STYLE).map(([key, s]) => (
                  <span key={key} style={{ ...styles.legendItem, background: s.bg, borderColor: s.border, color: s.text }}>
                    {s.label}
                  </span>
                ))}
                <button
                  onClick={() => setShowDebug(v => !v)}
                  style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                >
                  {showDebug ? 'Ukryj diagnostykę' : 'Diagnostyka'}
                </button>
              </div>

              {/* Panel diagnostyczny */}
              {showDebug && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 11 }}>
                  <strong style={{ color: '#475569' }}>Diagnostyka parsowania</strong>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slotStats ? Object.entries(slotStats).map(([day, s]) => (
                      <span key={day} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '3px 8px' }}>
                        <strong>{day}</strong>: {s.wolna}W {s.zajeta}Z {s.rsa}R (razem {s.total})
                      </span>
                    )) : <span style={{ color: '#94a3b8' }}>Brak danych do wyświetlenia</span>}
                  </div>
                  <div style={{ marginTop: 6, color: '#64748b' }}>
                    Format GAS: <strong>{schedule.week ? 'nowy (week)' : schedule.weeks ? 'stary (weeks[])' : 'nieznany'}</strong>
                    {' | '}prevTyg: <strong>{prevTyg ?? '—'}</strong>
                    {' | '}nextTyg: <strong>{nextTyg ?? '—'}</strong>
                  </div>
                  {slotStats && Object.values(slotStats).every(s => s.zajeta === 0 && s.rsa === 0) && (
                    <div style={{ marginTop: 8, color: '#dc2626', fontWeight: 700 }}>
                      ⚠ Wszystkie sloty są wolne — sprawdź czy GAS jest zaktualizowany i ponownie wdrożony (Deploy).
                      Możliwe że parsowanie HTML planu nie wykrywa klas CSS zajęć.
                    </div>
                  )}
                </div>
              )}

              {/* Tabela tygodniowa */}
              {currentWeek ? (
                <TimetableWeek
                  week={currentWeek}
                  onSlotClick={(content, e) => {
                    e.stopPropagation();
                    if (!content) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ content, x: rect.left, y: rect.bottom + 8 });
                  }}
                />
              ) : (
                <p style={styles.info}>Brak danych dla tego tygodnia</p>
              )}

              <p style={styles.source}>
                Dane z{' '}
                <a href={`https://plan.ue.wroc.pl/l_plan_sali.php?id=${selectedRoom.id}`} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                  plan.ue.wroc.pl
                </a>
                {' '}(ID sali: {selectedRoom.id}).{' '}
                Aby zarezerwować wolną salę, złóż podanie do Prorektora ds. Studenckich i Kształcenia.
              </p>
            </>
          )}

          {error && (
            <div style={{ color: '#dc2626', padding: 16, background: '#fef2f2', borderRadius: 8, margin: 16, fontSize: 13 }}>
              <strong>Błąd:</strong> {error}
            </div>
          )}
        </main>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          style={{ ...styles.tooltip, top: tooltip.y, left: Math.min(tooltip.x, window.innerWidth - 320) }}
          onClick={e => e.stopPropagation()}
        >
          <strong>Szczegóły zajęć:</strong>
          <pre style={{ margin: '4px 0 0', fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {tooltip.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function TimetableWeek({ week, onSlotClick }) {
  const days = DAY_NAMES.filter(d => week.days?.[d]);

  if (days.length === 0) {
    return <p style={styles.info}>Brak danych o zajęciach w tym tygodniu (dni: {Object.keys(week.days || {}).join(', ') || 'brak'})</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thDay}>Dzień</th>
            {HOURS.map(h => (
              <th key={h} style={styles.thHour}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(dayName => {
            const dayData = week.days[dayName];
            return (
              <tr key={dayName}>
                <td style={styles.tdDay}>
                  <div style={{ fontWeight: 700 }}>{dayName}</div>
                  {dayData.date && (
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                      {dayData.date.slice(5).replace('-', '.')}
                    </div>
                  )}
                </td>
                <DaySlots slots={dayData.slots} onSlotClick={onSlotClick} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DaySlots({ slots, onSlotClick }) {
  const grid = [];
  let hourIdx = 0;

  for (const slot of (slots || [])) {
    if (hourIdx >= HOURS.length) break;
    grid.push({ ...slot, _idx: hourIdx });
    for (let k = 1; k < slot.colspan; k++) {
      grid.push(null);
    }
    hourIdx += slot.colspan;
  }

  while (hourIdx < HOURS.length) {
    grid.push({ status: 'brak', content: null, colspan: 1, _idx: hourIdx });
    hourIdx++;
  }

  return (
    <>
      {grid.map((slot, idx) => {
        if (slot === null) return null;
        const s = SLOT_STYLE[slot.status] || { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' };
        return (
          <td
            key={idx}
            colSpan={slot.colspan}
            style={{
              ...styles.tdSlot,
              background: s.bg,
              borderColor: s.border,
              color: s.text,
              cursor: slot.content ? 'pointer' : 'default',
            }}
            title={slot.content || (slot.status === 'wolna' ? 'Wolna' : '')}
            onClick={e => slot.content && onSlotClick(slot.content, e)}
          >
            {slot.status === 'wolna'  && <span style={styles.dotFree}>●</span>}
            {slot.status === 'rsa'    && <span style={{ fontSize: 10 }}>RSA</span>}
            {slot.status === 'zajeta' && slot.content && (
              <span style={styles.slotText}>{truncate(slot.content, slot.colspan)}</span>
            )}
          </td>
        );
      })}
    </>
  );
}

function truncate(text, colspan) {
  const limit = colspan <= 1 ? 12 : colspan <= 2 ? 28 : 60;
  return text.length > limit ? text.slice(0, limit) + '…' : text;
}

const styles = {
  root: { fontFamily: "'Lato', sans-serif", color: '#111827', minHeight: '100vh', padding: '0 0 48px' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12, padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb',
    background: '#fff'
  },
  title:    { margin: 0, fontSize: 22, fontWeight: 800 },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#6b7280' },
  ctaBtn: {
    display: 'inline-block', background: '#1d4ed8', color: '#fff',
    padding: '10px 18px', borderRadius: 8, textDecoration: 'none',
    fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', alignSelf: 'center'
  },
  layout:  { display: 'flex', gap: 0, minHeight: 'calc(100vh - 100px)' },
  sidebar: {
    width: 200, minWidth: 180, maxWidth: 220, flexShrink: 0,
    borderRight: '1px solid #e5e7eb', padding: 12,
    background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8
  },
  searchInput: {
    width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #d1d5db',
    fontSize: 12, boxSizing: 'border-box', outline: 'none'
  },
  roomList:      { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  buildingLabel: { fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '8px 4px 2px', letterSpacing: '0.05em' },
  roomBtn: {
    display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px',
    border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer',
    fontSize: 12, color: '#374151', transition: 'background 0.15s'
  },
  roomBtnActive: { background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 },
  main:       { flex: 1, padding: 24, overflow: 'auto' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 300, color: '#9ca3af', textAlign: 'center' },
  planHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  planTitle:  { margin: 0, fontSize: 18, fontWeight: 800 },
  weekNav:    { display: 'flex', alignItems: 'center', gap: 10 },
  navBtn: {
    background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6,
    width: 32, height: 32, cursor: 'pointer', fontSize: 20, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s'
  },
  weekLabel:  { fontSize: 13, fontWeight: 600, minWidth: 180, textAlign: 'center' },
  legend:     { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 },
  legendItem: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '1px solid', fontWeight: 600 },
  table:      { borderCollapse: 'collapse', width: '100%', fontSize: 11, minWidth: 700 },
  thDay:      { padding: '6px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', width: 68, textAlign: 'left', fontSize: 11, fontWeight: 700 },
  thHour:     { padding: '6px 4px', background: '#f9fafb', border: '1px solid #e5e7eb', minWidth: 52, textAlign: 'center', fontWeight: 600 },
  tdDay: {
    padding: '6px 8px', border: '1px solid #e5e7eb', background: '#f9fafb',
    fontWeight: 600, fontSize: 12, verticalAlign: 'middle', width: 68
  },
  tdSlot: {
    padding: '4px 3px', border: '1px solid', verticalAlign: 'middle',
    textAlign: 'center', transition: 'filter 0.1s', minHeight: 40, height: 44,
  },
  dotFree:  { color: '#6ee7b7', fontSize: 14 },
  slotText: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 },
  info:     { color: '#6b7280', fontSize: 13, padding: '8px 0' },
  source:   { marginTop: 16, fontSize: 11, color: '#9ca3af', lineHeight: 1.5 },
  tooltip: {
    position: 'fixed', zIndex: 9999, background: '#1f2937', color: '#f9fafb',
    padding: '10px 14px', borderRadius: 8, fontSize: 12, maxWidth: 300,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', lineHeight: 1.5, pointerEvents: 'auto'
  }
};
