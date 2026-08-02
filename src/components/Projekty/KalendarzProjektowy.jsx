// src/components/Projekty/KalendarzProjektowy.jsx
// Kalendarz projektowy SSUEW — widoki Miesiąc / Lista, z edycją przez admina CRA.
// Styl: Tailwind CSS (spójny z resztą panelu — karty rounded-2xl, paleta slate).

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Save,
  CalendarDays, List, AlertTriangle, RotateCw, CalendarClock,
} from 'lucide-react';
import { buildCalGrid, groupUpcoming, MONTHS_PL, DAYS_PL } from './kalendarzUtils';

const AS_URL = import.meta.env.VITE_AS_URL || import.meta.env.VITE_AS_SALA_URL;

// ————————————————————————————————————————
// KONFIGURACJA — statusy (5) i typy (3). Zachowana tożsamość wizualna.
// ————————————————————————————————————————
const STATUS_CONFIG = {
  'Planowany':   { icon: '📅', dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',       badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  'W toku':      { icon: '⚡', dot: 'bg-amber-500',  pill: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',    badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Finalizacja': { icon: '🔧', dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  'Zakończony':  { icon: '✅', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Odwołany':    { icon: '❌', dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',           badge: 'bg-red-50 text-red-700 border-red-200' },
};

const TYP_CONFIG = {
  'Samorząd':              { badge: 'bg-blue-100 text-blue-800' },
  'Organizacja Studencka': { badge: 'bg-violet-100 text-violet-800' },
  'Koło Naukowe':          { badge: 'bg-cyan-100 text-cyan-800' },
};

const statusOf = (s) => STATUS_CONFIG[s] || STATUS_CONFIG['Planowany'];

// ————————————————————————————————————————
// GŁÓWNY KOMPONENT
// ————————————————————————————————————————
export default function KalendarzProjektowy({ isAdmin = false }) {
  const today = new Date();
  const [view, setView] = useState('miesiac'); // 'miesiac' | 'lista'
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Filtry
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTyp,    setFilterTyp]    = useState('');

  // Modale / interakcje
  const [detailEvent, setDetailEvent] = useState(null);
  const [editEvent,   setEditEvent]   = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Feedback (toast/banner zamiast alert)
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const flash = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ——— Pobierz eventy ———
  const loadEvents = () => {
    setLoading(true);
    setError(null);
    fetch(`${AS_URL}?action=getProjekty`)
      .then(r => r.json())
      .then(j => { if (j.success) setEvents(j.data); else setError(j.error || 'Nie udało się pobrać danych.'); })
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
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // ——— Filtrowane eventy ———
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterTyp    && e.typ    !== filterTyp)    return false;
      return true;
    });
  }, [events, filterStatus, filterTyp]);

  const calGrid = useMemo(
    () => buildCalGrid(year, month, filteredEvents),
    [year, month, filteredEvents]
  );
  const groups = useMemo(() => groupUpcoming(filteredEvents), [filteredEvents]);

  // ——— Zapis eventu (GET z body w param — backend obsługuje) ———
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const action  = formData.id ? 'updateProjekt' : 'addProjekt';
      const encoded = encodeURIComponent(JSON.stringify(formData));
      const res     = await fetch(`${AS_URL}?action=${action}&body=${encoded}`);
      const j       = await res.json();
      if (!j.success) throw new Error(j.error || 'Zapis nie powiódł się.');
      setShowForm(false);
      setEditEvent(null);
      loadEvents();
      flash('success', formData.id ? 'Wydarzenie zaktualizowane.' : 'Wydarzenie dodane.');
    } catch (e) {
      flash('error', 'Błąd zapisu: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ——— Usuń event (potwierdzenie w aplikacji, nie window.confirm) ———
  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${AS_URL}?action=deleteProjekt&id=${id}`);
      const j   = await res.json();
      if (!j.success) throw new Error(j.error || 'Usuwanie nie powiodło się.');
      setDetailEvent(null);
      setConfirmDelete(false);
      loadEvents();
      flash('success', 'Wydarzenie usunięte.');
    } catch (e) {
      flash('error', 'Błąd usuwania: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const openAdd  = () => { setEditEvent(null); setShowForm(true); };
  const openEdit = (ev) => { setEditEvent(ev); setDetailEvent(null); setConfirmDelete(false); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditEvent(null); };
  const closeDetail = () => { setDetailEvent(null); setConfirmDelete(false); };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ——— NAGŁÓWEK ——— */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">Kalendarz projektowy SSUEW</h1>
            <p className="text-slate-500 text-sm mt-1">Planowane finały i kluczowe daty wydarzeń w roku akademickim</p>
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Dodaj wydarzenie
            </button>
          )}
        </div>

        {/* ——— PASEK: przełącznik widoku + filtry ——— */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Toggle Miesiąc / Lista */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 shrink-0">
            {[
              { key: 'miesiac', label: 'Miesiąc', Icon: CalendarDays },
              { key: 'lista',   label: 'Lista',   Icon: List },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  view === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Filtry */}
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto w-full lg:w-auto">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
            >
              <option value="">Wszystkie statusy</option>
              {Object.keys(STATUS_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select
              value={filterTyp}
              onChange={e => setFilterTyp(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
            >
              <option value="">Wszystkie typy</option>
              {Object.keys(TYP_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="text-sm font-bold text-slate-400 sm:ml-1">
              {filteredEvents.length} {plural(filteredEvents.length)}
            </span>
          </div>
        </div>

        {/* ——— STANY: ładowanie / błąd ——— */}
        {loading ? (
          <LoadingCard />
        ) : error ? (
          <ErrorCard message={error} onRetry={loadEvents} />
        ) : view === 'miesiac' ? (
          <MonthView
            year={year} month={month} calGrid={calGrid}
            onPrev={prevMonth} onNext={nextMonth} onToday={goToday}
            onEventClick={setDetailEvent}
          />
        ) : (
          <ListView groups={groups} onEventClick={setDetailEvent} />
        )}

        {/* ——— LEGENDA ——— */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Legenda statusów</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${v.badge}`}>
                <span aria-hidden>{v.icon}</span> {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ——— TOAST ——— */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ——— MODAL SZCZEGÓŁÓW ——— */}
      {detailEvent && (
        <Modal onClose={closeDetail} title="Szczegóły wydarzenia">
          <EventDetail
            event={detailEvent}
            isAdmin={isAdmin}
            confirmDelete={confirmDelete}
            saving={saving}
            onEdit={() => openEdit(detailEvent)}
            onAskDelete={() => setConfirmDelete(true)}
            onCancelDelete={() => setConfirmDelete(false)}
            onConfirmDelete={() => handleDelete(detailEvent.id)}
          />
        </Modal>
      )}

      {/* ——— MODAL FORMULARZA ——— */}
      {showForm && (
        <Modal onClose={closeForm} title={editEvent ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}>
          <EventForm initial={editEvent} onSave={handleSave} onCancel={closeForm} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Widok: Miesiąc
// ————————————————————————————————————————
function MonthView({ year, month, calGrid, onPrev, onNext, onToday, onEventClick }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Nawigacja */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <button onClick={onPrev} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Poprzedni miesiąc">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={onNext} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Następny miesiąc">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-black text-slate-800 ml-1">
          {MONTHS_PL[month]} <span className="text-slate-400 font-bold">{year}</span>
        </h2>
        <button onClick={onToday} className="ml-auto px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Dziś
        </button>
      </div>

      {/* Siatka — przewijana poziomo na małych ekranach */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Nagłówki dni */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {DAYS_PL.map(d => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">{d}</div>
            ))}
          </div>
          {/* Komórki */}
          <div className="grid grid-cols-7">
            {calGrid.map((cell, idx) => (
              <CalCell
                key={idx}
                cell={cell}
                isCurrentMonth={cell.month === month}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalCell({ cell, isCurrentMonth, onEventClick }) {
  const { isToday } = cell;
  return (
    <div className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 flex flex-col ${
      isCurrentMonth ? 'bg-white' : 'bg-slate-50/60'
    } ${isToday ? 'ring-2 ring-inset ring-indigo-400' : ''}`}>
      <span className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
        isToday ? 'bg-indigo-600 text-white'
        : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
      }`}>
        {cell.day}
      </span>
      <div className="flex flex-col gap-1">
        {cell.events.slice(0, 3).map(ev => {
          const sc = statusOf(ev.status);
          return (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              title={ev.nazwa}
              className={`w-full text-left text-[11px] font-semibold px-1.5 py-0.5 rounded border truncate transition-colors ${sc.pill}`}
            >
              <span aria-hidden>{sc.icon}</span> {ev.nazwa}
            </button>
          );
        })}
        {cell.events.length > 3 && (
          <span className="text-[10px] font-bold text-slate-400 px-1">+{cell.events.length - 3} więcej</span>
        )}
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Widok: Lista / agenda
// ————————————————————————————————————————
function ListView({ groups, onEventClick }) {
  if (!groups.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 font-bold">Brak nadchodzących wydarzeń</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.key}>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-1">{group.label}</h2>
          <div className="space-y-2.5">
            {group.events.map(ev => {
              const sc = statusOf(ev.status);
              const tc = TYP_CONFIG[ev.typ] || { badge: 'bg-slate-100 text-slate-700' };
              return (
                <button
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow transition-all flex items-center gap-4"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-2xl font-black text-slate-800 leading-none">{dayNum(ev.data_finalu)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{dayName(ev.data_finalu)}</p>
                  </div>
                  <div className="w-px self-stretch bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{ev.nazwa}</p>
                    {ev.organizacja && <p className="text-xs text-slate-500 truncate mt-0.5">{ev.organizacja}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>
                        <span aria-hidden>{sc.icon}</span> {ev.status}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}>{ev.typ}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————
// Szczegóły eventu
// ————————————————————————————————————————
function EventDetail({ event, isAdmin, confirmDelete, saving, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }) {
  const sc = statusOf(event.status);
  const tc = TYP_CONFIG[event.typ] || { badge: 'bg-slate-100 text-slate-700' };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${tc.badge}`}>{event.typ}</span>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${sc.badge}`}>
          <span aria-hidden>{sc.icon}</span> {event.status}
        </span>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-4">{event.nazwa}</h3>
      <dl className="space-y-3 text-sm">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 font-bold text-slate-400">Organizacja</dt>
          <dd className="text-slate-700">{event.organizacja || '—'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 font-bold text-slate-400">Data finału</dt>
          <dd className="text-slate-700 font-semibold">{formatDate(event.data_finalu)}</dd>
        </div>
        {event.opis && (
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 font-bold text-slate-400">Opis</dt>
            <dd className="text-slate-700 whitespace-pre-wrap">{event.opis}</dd>
          </div>
        )}
      </dl>

      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          {confirmDelete ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm font-bold text-red-700 flex-1">Na pewno usunąć to wydarzenie?</p>
              <div className="flex gap-2">
                <button
                  onClick={onConfirmDelete} disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Usuwam…' : 'Tak, usuń'}
                </button>
                <button onClick={onCancelDelete} disabled={saving}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
                <Pencil className="w-4 h-4" /> Edytuj
              </button>
              <button onClick={onAskDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" /> Usuń
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————
// Formularz dodawania / edycji
// ————————————————————————————————————————
function EventForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id:          initial?.id          || '',
    nazwa:       initial?.nazwa       || '',
    organizacja: initial?.organizacja || '',
    typ:         initial?.typ         || 'Samorząd',
    data_finalu: initial?.data_finalu ? String(initial.data_finalu).slice(0, 10) : '',
    opis:        initial?.opis        || '',
    status:      initial?.status      || 'Planowany',
    kolor:       initial?.kolor       || '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const next = {};
    if (!form.nazwa.trim())       next.nazwa = 'Podaj nazwę wydarzenia.';
    if (!form.data_finalu.trim()) next.data_finalu = 'Podaj datę finału.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(form);
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200';

  return (
    <div className="space-y-4">
      <Field label="Nazwa wydarzenia" required error={errors.nazwa}>
        <input className={inputCls} value={form.nazwa} onChange={e => set('nazwa', e.target.value)} placeholder="np. Finał Gali Wolontariatu" />
      </Field>
      <Field label="Organizacja">
        <input className={inputCls} value={form.organizacja} onChange={e => set('organizacja', e.target.value)} placeholder="np. Koło Naukowe Finanse" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Typ organizatora">
          <select className={inputCls + ' cursor-pointer'} value={form.typ} onChange={e => set('typ', e.target.value)}>
            {Object.keys(TYP_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls + ' cursor-pointer'} value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.keys(STATUS_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Data finału" required error={errors.data_finalu}>
        <input type="date" className={inputCls + ' cursor-pointer'} value={form.data_finalu} onChange={e => set('data_finalu', e.target.value)} />
      </Field>
      <Field label="Opis (opcjonalnie)">
        <textarea
          className={inputCls + ' min-h-[88px] resize-y'}
          value={form.opis}
          onChange={e => set('opis', e.target.value)}
          placeholder="Krótki opis, uwagi, koordynator, sala…"
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button onClick={handleSubmit} disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" /> {saving ? 'Zapisuję…' : 'Zapisz'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">
          Anuluj
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-semibold text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ————————————————————————————————————————
// Modal wrapper
// ————————————————————————————————————————
function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Zamknij">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Stany: ładowanie / błąd
// ————————————————————————————————————————
function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
      <RotateCw className="w-7 h-7 text-indigo-500 animate-spin" />
      <p className="text-slate-400 font-bold text-sm">Ładowanie kalendarza…</p>
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="w-8 h-8 text-red-500" />
      <p className="text-slate-700 font-bold">Nie udało się wczytać kalendarza</p>
      {message && <p className="text-sm text-slate-400 max-w-sm">{String(message)}</p>}
      <button onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors">
        <RotateCw className="w-4 h-4" /> Spróbuj ponownie
      </button>
    </div>
  );
}

// ————————————————————————————————————————
// Helpers (formatowanie)
// ————————————————————————————————————————
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return String(str);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}
function dayNum(str) {
  const d = new Date(String(str).slice(0, 10));
  return isNaN(d) ? '?' : d.getDate();
}
function dayName(str) {
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return '';
  const idx = (d.getDay() + 6) % 7; // Pon=0
  return DAYS_PL[idx];
}
function plural(n) {
  if (n === 1) return 'wydarzenie';
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'wydarzenia';
  return 'wydarzeń';
}
