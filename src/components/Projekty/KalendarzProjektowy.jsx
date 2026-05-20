// src/components/Projekty/KalendarzProjektowy.jsx
// Komponent: Kalendarz projektowy SSUEW — widok miesięczny
// z możliwością edycji przez admina CRA.

import { useState, useEffect, useMemo } from 'react';

const AS_URL = import.meta.env.VITE_AS_URL || import.meta.env.VITE_AS_SALA_URL;

// ————————————————————————————————————————
// KONFIGURACJA
// ————————————————————————————————————————
const STATUS_CONFIG = {
  'Planowany':   { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📅' },
  'W toku':      { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⚡' },
  'Finalizacja': { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🔧' },
  'Zakończony':  { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
  'Odwołany':    { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
};

const TYP_CONFIG = {
  'Samorząd':              { badge: '#1d4ed8', bg: '#dbeafe' },
  'Organizacja Studencka': { badge: '#7c3aed', bg: '#ede9fe' },
  'Koło Naukowe':          { badge: '#0891b2', bg: '#cffafe' },
};

const MONTHS_PL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];
const DAYS_PL = ['Pon','Wt','Śr','Cz','Pt','So','Nd'];

// ————————————————————————————————————————
// GŁÓWNY KOMPONENT
// ————————————————————————————————————————
export default function KalendarzProjektowy({ isAdmin = false }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Filtry
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTyp,    setFilterTyp]    = useState('');

  // Modal
  const [detailEvent, setDetailEvent]   = useState(null);
  const [editEvent,   setEditEvent]     = useState(null);
  const [showForm,    setShowForm]       = useState(false);
  const [saving,      setSaving]         = useState(false);

  // ——— Pobierz eventy ———
  const loadEvents = () => {
    setLoading(true);
    fetch(`${AS_URL}?action=getProjekty`)
      .then(r => r.json())
      .then(j => { if (j.success) setEvents(j.data); else setError(j.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadEvents, []);

  // ——— Nawigacja miesięcy ———
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ——— Filtrowane eventy ———
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterTyp    && e.typ    !== filterTyp)    return false;
      return true;
    });
  }, [events, filterStatus, filterTyp]);

  // ——— Generuj siatkę kalendarza ———
  const calGrid = useMemo(() => {
    return buildCalGrid(year, month, filteredEvents);
  }, [year, month, filteredEvents]);

  // ——— Zapis eventu ———
  // GAS web apps redirect POST→GET i gubią body; przekazujemy dane jako param URL
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const action  = formData.id ? 'updateProjekt' : 'addProjekt';
      const encoded = encodeURIComponent(JSON.stringify(formData));
      const url     = `${AS_URL}?action=${action}&body=${encoded}`;
      const res     = await fetch(url);
      const j       = await res.json();
      if (!j.success) throw new Error(j.error);
      setShowForm(false);
      setEditEvent(null);
      loadEvents();
    } catch(e) {
      alert('Błąd zapisu: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ——— Usuń event ———
  const handleDelete = async (id) => {
    if (!confirm('Usunąć to wydarzenie?')) return;
    setSaving(true);
    try {
      const res = await fetch(`${AS_URL}?action=deleteProjekt&id=${id}`);
      const j   = await res.json();
      if (!j.success) throw new Error(j.error);
      setDetailEvent(null);
      loadEvents();
    } catch(e) {
      alert('Błąd usuwania: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.root}>

      {/* ——— NAGŁÓWEK ——— */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Kalendarz projektowy SSUEW</h2>
          <p style={s.subtitle}>Planowane finały i kluczowe daty wydarzeń w roku akademickim</p>
        </div>
        {isAdmin && (
          <button style={s.addBtn} onClick={() => { setEditEvent(null); setShowForm(true); }}>
            + Dodaj wydarzenie
          </button>
        )}
      </div>

      {/* ——— FILTRY ——— */}
      <div style={s.filters}>
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Wszystkie statusy</option>
          {Object.keys(STATUS_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select style={s.select} value={filterTyp} onChange={e => setFilterTyp(e.target.value)}>
          <option value="">Wszystkie typy</option>
          {Object.keys(TYP_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <span style={s.eventCount}>{filteredEvents.length} wydarzeń</span>
      </div>

      {/* ——— NAWIGACJA MIESIĄCA ——— */}
      <div style={s.monthNav}>
        <button style={s.navBtn} onClick={prevMonth}>‹</button>
        <span style={s.monthLabel}>{MONTHS_PL[month]} {year}</span>
        <button style={s.navBtn} onClick={nextMonth}>›</button>
        <button style={s.todayBtn} onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>
          Dziś
        </button>
      </div>

      {/* ——— SIATKA KALENDARZA ——— */}
      {loading ? (
        <div style={s.loading}>Ładowanie kalendarza…</div>
      ) : error ? (
        <div style={{ color: '#dc2626', padding: 16 }}>Błąd: {error}</div>
      ) : (
        <div style={s.cal}>
          {DAYS_PL.map(d => (
            <div key={d} style={s.calHead}>{d}</div>
          ))}
          {calGrid.map((cell, idx) => (
            <CalCell
              key={idx}
              cell={cell}
              isCurrentMonth={cell.month === month}
              isToday={cell.isToday}
              onEventClick={ev => setDetailEvent(ev)}
            />
          ))}
        </div>
      )}

      {/* ——— LEGENDA ——— */}
      <div style={s.legend}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} style={{ ...s.legendItem, background: v.bg, borderColor: v.border, color: v.color }}>
            {v.icon} {k}
          </span>
        ))}
      </div>

      {/* ——— MODAL SZCZEGÓŁÓW ——— */}
      {detailEvent && (
        <Modal onClose={() => setDetailEvent(null)}>
          <EventDetail
            event={detailEvent}
            isAdmin={isAdmin}
            onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); setShowForm(true); }}
            onDelete={() => handleDelete(detailEvent.id)}
            saving={saving}
          />
        </Modal>
      )}

      {/* ——— MODAL FORMULARZA ——— */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditEvent(null); }}>
          <EventForm
            initial={editEvent}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditEvent(null); }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Sub: Komórka kalendarza
// ————————————————————————————————————————
function CalCell({ cell, isCurrentMonth, isToday, onEventClick }) {
  return (
    <div style={{
      ...s.cell,
      background: isToday ? '#eff6ff' : isCurrentMonth ? '#fff' : '#f9fafb',
      border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    }}>
      <span style={{
        ...s.cellDate,
        color: isToday ? '#1d4ed8' : isCurrentMonth ? '#111827' : '#d1d5db',
        fontWeight: isToday ? 800 : 400,
      }}>
        {cell.day}
      </span>
      <div style={s.cellEvents}>
        {cell.events.slice(0, 3).map(ev => {
          const sc = STATUS_CONFIG[ev.status] || STATUS_CONFIG['Planowany'];
          return (
            <button
              key={ev.id}
              style={{ ...s.eventPill, background: sc.bg, borderColor: sc.border, color: sc.color }}
              onClick={() => onEventClick(ev)}
              title={ev.nazwa}
            >
              {sc.icon} {ev.nazwa}
            </button>
          );
        })}
        {cell.events.length > 3 && (
          <span style={s.moreEvents}>+{cell.events.length - 3} więcej</span>
        )}
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Sub: Szczegóły eventu
// ————————————————————————————————————————
function EventDetail({ event, isAdmin, onEdit, onDelete, saving }) {
  const sc = STATUS_CONFIG[event.status] || STATUS_CONFIG['Planowany'];
  const tc = TYP_CONFIG[event.typ]       || {};
  return (
    <div style={{ minWidth: 320 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ ...s.badge, background: tc.bg, color: tc.badge }}>{event.typ}</span>
        <span style={{ ...s.badge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
          {sc.icon} {event.status}
        </span>
      </div>
      <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>{event.nazwa}</h3>
      <dl style={s.dl}>
        <dt>Organizacja</dt><dd>{event.organizacja || '—'}</dd>
        <dt>Data finału</dt><dd>{formatDate(event.data_finalu)}</dd>
        {event.opis && <><dt>Opis</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{event.opis}</dd></>}
      </dl>
      {isAdmin && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button style={s.editBtn} onClick={onEdit}>✏️ Edytuj</button>
          <button style={s.deleteBtn} onClick={onDelete} disabled={saving}>
            {saving ? '…' : '🗑️ Usuń'}
          </button>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Sub: Formularz dodawania/edycji
// ————————————————————————————————————————
function EventForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id:           initial?.id           || '',
    nazwa:        initial?.nazwa        || '',
    organizacja:  initial?.organizacja  || '',
    typ:          initial?.typ          || 'Samorząd',
    data_finalu:  initial?.data_finalu  || '',
    opis:         initial?.opis         || '',
    status:       initial?.status       || 'Planowany',
    kolor:        initial?.kolor        || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.nazwa.trim())       return alert('Podaj nazwę wydarzenia');
    if (!form.data_finalu.trim()) return alert('Podaj datę finału');
    onSave(form);
  };

  return (
    <div style={{ minWidth: 340 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>
        {initial ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
      </h3>
      <FormField label="Nazwa wydarzenia *">
        <input style={s.input} value={form.nazwa} onChange={e => set('nazwa', e.target.value)} />
      </FormField>
      <FormField label="Organizacja">
        <input style={s.input} value={form.organizacja} onChange={e => set('organizacja', e.target.value)} placeholder="np. Koło Naukowe Finanse" />
      </FormField>
      <FormField label="Typ organizatora">
        <select style={s.input} value={form.typ} onChange={e => set('typ', e.target.value)}>
          {Object.keys(TYP_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </FormField>
      <FormField label="Data finału *">
        <input style={s.input} type="date" value={form.data_finalu} onChange={e => set('data_finalu', e.target.value)} />
      </FormField>
      <FormField label="Status">
        <select style={s.input} value={form.status} onChange={e => set('status', e.target.value)}>
          {Object.keys(STATUS_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </FormField>
      <FormField label="Opis (opcjonalnie)">
        <textarea
          style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
          value={form.opis}
          onChange={e => set('opis', e.target.value)}
          placeholder="Krótki opis, uwagi, koordynator, sala…"
        />
      </FormField>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button style={s.saveBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Zapisuję…' : '💾 Zapisz'}
        </button>
        <button style={s.cancelBtn} onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ————————————————————————————————————————
// Sub: Modal wrapper
// ————————————————————————————————————————
function Modal({ children, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.modalClose} onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Helpers
// ————————————————————————————————————————
function buildCalGrid(year, month, events) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: month - 1, year, events: [], isToday: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = (
      today.getFullYear() === year &&
      today.getMonth()    === month &&
      today.getDate()     === d
    );
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = events.filter(ev => {
      if (!ev.data_finalu) return false;
      return String(ev.data_finalu).slice(0, 10) === dateStr;
    });
    cells.push({ day: d, month, year, events: dayEvents, isToday });
  }

  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: day++, month: month + 1, year, events: [], isToday: false });
  }

  return cells;
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ————————————————————————————————————————
// Style
// ————————————————————————————————————————
const s = {
  root:        { fontFamily: "'Lato', sans-serif", color: '#111827', padding: '0 0 48px' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' },
  title:       { margin: 0, fontSize: 22, fontWeight: 800 },
  subtitle:    { margin: '4px 0 0', fontSize: 13, color: '#6b7280' },
  addBtn:      { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  filters:     { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', background: '#fafafa', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' },
  select:      { padding: '6px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, background: '#fff', cursor: 'pointer' },
  eventCount:  { fontSize: 12, color: '#6b7280', marginLeft: 'auto' },
  monthNav:    { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px' },
  navBtn:      { background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 7, width: 34, height: 34, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  monthLabel:  { fontSize: 20, fontWeight: 800, minWidth: 200 },
  todayBtn:    { background: '#fff', border: '1px solid #d1d5db', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, marginLeft: 4 },
  loading:     { padding: 40, textAlign: 'center', color: '#6b7280' },
  cal: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 1, background: '#e5e7eb', margin: '0 24px',
    border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden'
  },
  calHead:     { background: '#f9fafb', padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cell:        { minHeight: 100, padding: '6px 6px 4px', position: 'relative', cursor: 'default' },
  cellDate:    { fontSize: 13, display: 'block', marginBottom: 4 },
  cellEvents:  { display: 'flex', flexDirection: 'column', gap: 2 },
  eventPill: {
    display: 'block', width: '100%', textAlign: 'left',
    border: '1px solid', borderRadius: 4, padding: '2px 5px',
    fontSize: 10, fontWeight: 600, cursor: 'pointer', background: 'none',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    lineHeight: 1.4,
  },
  moreEvents:  { fontSize: 10, color: '#6b7280', padding: '1px 4px' },
  legend:      { display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 24px' },
  legendItem:  { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '1px solid', fontWeight: 600 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal:       { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalClose:  { position: 'absolute', top: 14, right: 14, background: '#f3f4f6', border: 'none', borderRadius: 999, width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge:       { display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: '1px solid transparent' },
  dl:          { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 },
  editBtn:     { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  deleteBtn:   { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  input:       { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  saveBtn:     { background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  cancelBtn:   { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, padding: '10px 16px', cursor: 'pointer', fontSize: 13 },
};
