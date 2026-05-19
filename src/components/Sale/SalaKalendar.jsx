import { useState, useEffect, useMemo, useRef } from 'react';

const AS_URL = import.meta.env.VITE_AS_SALA_URL || import.meta.env.VITE_AS_URL;
const HOURS     = ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const DAY_NAMES = ['Pon','Wt','Śr','Cz','Pi','So','Ni'];

const STATUS = {
  wolna:  { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46', label: 'Wolna' },
  zajeta: { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f', label: 'Zajęta' },
  rsa:    { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', label: 'RSA' },
};

/* ── helpers ── */
function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function thisMonday() {
  const t = new Date(); const m = new Date(t);
  m.setDate(t.getDate() - ((t.getDay()+6)%7));
  return localISO(m);
}
function shiftWeek(iso, delta) {
  const [y,mo,d] = iso.split('-').map(Number);
  const dt = new Date(y, mo-1, d); dt.setDate(dt.getDate() + delta*7);
  return localISO(dt);
}
function fmtShortDate(iso) {
  if (!iso) return '';
  const [,m,d] = iso.split('-'); return `${d}.${m}`;
}
function buildTimeline(slots) {
  let h = 8;
  return (slots||[]).map(s => { const r = {...s, startH: h, endH: h+s.colspan}; h += s.colspan; return r; });
}

/* ── RoomCombobox ── */
function RoomCombobox({ rooms, selected, loadingRooms, onSelect }) {
  const [open, setOpen]     = useState(false);
  const [q, setQ]           = useState('');
  const wrapRef = useRef(); const inputRef = useRef();

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const byBuilding = useMemo(() => {
    const lq = q.toLowerCase();
    const filtered = rooms.filter(r => r.name.toLowerCase().includes(lq) || r.building.toLowerCase().includes(lq));
    const map = {};
    filtered.forEach(r => { (map[r.building] ??= []).push(r); });
    return Object.entries(map).sort();
  }, [rooms, q]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl hover:border-violet-400 transition-colors text-left shadow-sm"
      >
        <span className={`text-sm font-semibold truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {loadingRooms ? 'Ładowanie sal…' : selected ? `🏛 ${selected.name}` : 'Wybierz salę dydaktyczną…'}
        </span>
        <svg className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2.5 border-b border-slate-100">
            <input
              ref={inputRef}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-violet-400 bg-slate-50"
              placeholder="Szukaj po nazwie lub budynku…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {byBuilding.map(([building, bRooms]) => (
              <div key={building}>
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/80 sticky top-0">
                  Budynek {building}
                </div>
                {bRooms.map(room => (
                  <button
                    key={room.id}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      selected?.id === room.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => { onSelect(room); setOpen(false); setQ(''); }}
                  >
                    {room.name}
                    {selected?.id === room.id && <span className="text-violet-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            ))}
            {byBuilding.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-6">Brak wyników dla „{q}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DayTimeline ── */
function DayTimeline({ dayData, dayName, dayDate }) {
  const timeline = buildTimeline(dayData.slots);
  if (!timeline.length) return <p className="text-slate-400 text-sm py-6 text-center">Brak danych</p>;

  return (
    <div className="space-y-2">
      {timeline.map((item, idx) => {
        const s = STATUS[item.status] || { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' };
        const isFree = item.status === 'wolna';
        return (
          <div key={idx}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all ${isFree ? 'opacity-50' : ''}`}
            style={{ background: s.bg, borderColor: s.border }}
          >
            <div className="text-xs text-slate-500 w-16 shrink-0 font-mono leading-relaxed pt-0.5">
              {item.startH}:00<br /><span className="text-slate-400">–{item.endH}:00</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {isFree ? (
                <span className="text-sm font-semibold" style={{ color: s.text }}>● Wolna</span>
              ) : item.status === 'rsa' ? (
                <span className="text-sm font-semibold" style={{ color: s.text }}>RSA — rezerwacja administracyjna</span>
              ) : (
                <>
                  <span className="text-sm font-bold leading-tight block break-words" style={{ color: s.text }}>
                    {item.content || '(zajęcia)'}
                  </span>
                  <span className="text-xs opacity-60 mt-0.5 block" style={{ color: s.text }}>
                    {item.colspan} {item.colspan === 1 ? 'godz.' : 'godz.'}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── WeekTable ── */
function WeekTable({ week, onSlotClick, hours = HOURS }) {
  const days = DAY_NAMES.filter(d => week.days?.[d]);
  if (!days.length) return (
    <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
      <span className="text-3xl">📅</span>
      <p className="text-sm">Brak zajęć w tym tygodniu</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={ts.thDay}>Dzień</th>
            {hours.map(h => <th key={h} style={ts.thHour}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(dayName => {
            const dd = week.days[dayName];
            return (
              <tr key={dayName}>
                <td style={ts.tdDay}>
                  <div style={{ fontWeight: 700 }}>{dayName}</div>
                  {dd.date && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{fmtShortDate(dd.date)}</div>}
                </td>
                <DaySlots slots={dd.slots} onSlotClick={onSlotClick} hours={hours} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DaySlots({ slots, onSlotClick, hours = HOURS }) {
  const grid = []; let hIdx = 0;
  for (const s of (slots||[])) {
    if (hIdx >= hours.length) break;
    grid.push({...s});
    for (let k=1; k<s.colspan; k++) grid.push(null);
    hIdx += s.colspan;
  }
  while (hIdx < hours.length) { grid.push({ status:'brak', content:null, colspan:1 }); hIdx++; }

  return (
    <>
      {grid.map((slot, idx) => {
        if (!slot) return null;
        const s = STATUS[slot.status] || { bg:'#f9fafb', border:'#e5e7eb', text:'#6b7280' };
        const lim = slot.colspan<=1?12:slot.colspan<=2?28:60;
        return (
          <td key={idx} colSpan={slot.colspan}
            style={{ padding:'4px 3px', border:'1px solid', verticalAlign:'middle', textAlign:'center', height:44,
              background:s.bg, borderColor:s.border, color:s.text, cursor: slot.content?'pointer':'default' }}
            title={slot.content||(slot.status==='wolna'?'Wolna':'')}
            onClick={e => slot.content && onSlotClick(slot.content, e)}
          >
            {slot.status==='wolna'  && <span style={{color:'#6ee7b7',fontSize:14}}>●</span>}
            {slot.status==='rsa'    && <span style={{fontSize:10}}>RSA</span>}
            {slot.status==='zajeta' && slot.content && (
              <span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>
                {slot.content.length>lim ? slot.content.slice(0,lim)+'…' : slot.content}
              </span>
            )}
          </td>
        );
      })}
    </>
  );
}

const ts = {
  thDay:  { padding:'5px 6px', background:'#f9fafb', border:'1px solid #e5e7eb', width:54, textAlign:'left', fontSize:10, fontWeight:700 },
  thHour: { padding:'5px 2px', background:'#f9fafb', border:'1px solid #e5e7eb', width:42, textAlign:'center', fontWeight:600, fontSize:10 },
  tdDay:  { padding:'5px 6px', border:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:600, fontSize:11, verticalAlign:'middle', width:54 },
};

/* ── helpers ── */
function fmtPolishDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function roomLabel(room) {
  // "205A" + building "A" → "205 w budynku A"; "102CKU" → "102 w budynku CKU"
  const stripped = room.name.replace(new RegExp(room.building.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'), '').trim();
  return `${stripped || room.name} w budynku ${room.building}`;
}

/* ── ReservationModal ── */
function ReservationModal({ room, selectedDay, dayDates, onClose }) {
  const today  = new Date();
  const todayFmt = `${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
  const preDate  = selectedDay && dayDates[selectedDay] ? dayDates[selectedDay] : '';
  const [eventDate, setEventDate] = useState(preDate);
  const [startTime, setStartTime] = useState('');
  const [endTime,   setEndTime]   = useState('');
  const [copied,    setCopied]    = useState(false);
  const textRef = useRef();

  const dateFmt  = eventDate ? fmtPolishDate(eventDate) : '[DD.MM.YYYY]';
  const startFmt = startTime || '__:__';
  const endFmt   = endTime   || '__:__';
  const rLabel   = roomLabel(room);

  const template =
`Wrocław, ${todayFmt} r.

[Twoje imię i nazwisko]
[Twój adres e-mail]
[Twój numer telefonu]

Dr hab. inż. Andrzej Okruszek, prof. UEW
Prorektor ds. Studenckich i Kształcenia


PODANIE

\tW imieniu Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu zwracam się z uprzejmą prośbą o bezpłatne udostępnienie nam sali ${rLabel} w dniu ${dateFmt} r., w godzinach ${startFmt} – ${endFmt}.

\t[Opis celu rezerwacji — czemu potrzebujesz tej sali i co będzie się odbywać]

\tKoordynatorem spotkania i osobą odpowiedzialną za klucz i salę jest [Imię i Nazwisko] (nr indeksu: [XXXXXX], tel. [XXX XXX XXX]).

Uprzejmie proszę o pozytywne rozpatrzenie niniejszego podania.

Z wyrazami szacunku,


[Twoje imię i nazwisko]
[Twoja funkcja] Samorządu Studentów
Uniwersytetu Ekonomicznego we Wrocławiu`;

  const mailSubject = `Podanie o rezerwację sali ${room.name} – ${dateFmt}`;
  const mailHref    = `mailto:prorektor@samorzad.ue.wroc.pl?subject=${encodeURIComponent(mailSubject)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(template); }
    catch { textRef.current?.select(); document.execCommand('copy'); }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-0.5">Rezerwacja sali</p>
            <h3 className="text-lg font-black text-slate-900">{room.name} · budynek {room.building}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xl font-bold transition-colors shrink-0">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <span className="text-base mt-0.5 shrink-0">⏰</span>
            <p className="text-xs text-amber-900"><strong>Złóż podanie min. 4 dni robocze wcześniej.</strong> Adresat to Prorektor ds. Studenckich i Kształcenia — nie Dziekanat.</p>
          </div>

          {/* Date + time */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Data i godziny rezerwacji</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400"
              />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" placeholder="od" />
              <span className="text-slate-400 font-bold text-sm">–</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" placeholder="do" />
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Jak złożyć podanie</p>
            <div className="space-y-2.5">
              {[
                ['Skopiuj wzór poniżej', 'Uzupełnij pola w nawiasach kwadratowych własnymi danymi'],
                ['Sformatuj na papierze firmowym SSUEW', 'Użyj szablonu Word/PDF dostępnego w chmurze organizacji'],
                ['Wyślij do Prorektora', 'Dołącz podpisany plik PDF na adres prorektor@samorzad.ue.wroc.pl'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wzór treści podania</p>
              <button
                onClick={copy}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {copied ? '✓ Skopiowano!' : '📋 Kopiuj'}
              </button>
            </div>
            <textarea
              ref={textRef}
              readOnly
              value={template}
              className="w-full h-44 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none outline-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <a
            href={mailHref}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            ✉ Wyślij podanie e-mailem →
          </a>
          <p className="text-center text-[11px] text-slate-400 mt-2">prorektor@samorzad.ue.wroc.pl</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function SalaKalendar({ onBack }) {
  const [rooms, setRooms]         = useState([]);
  const [selectedRoom, setSelected] = useState(null);
  const [weekMonday, setWeekMonday] = useState(thisMonday);
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule, setSchedule]   = useState(null);
  const [loading, setLoading]     = useState({ rooms: false, schedule: false });
  const [error, setError]         = useState(null);
  const [tooltip, setTooltip]               = useState(null);
  const [showReservationModal, setShowModal] = useState(false);
  const tooltipRef = useRef();

  const gasJson = async url => {
    const r = await fetch(url), text = await r.text();
    if (text.trimStart().startsWith('<')) throw new Error('Backend zwrócił HTML — sprawdź wdrożenie Apps Script.');
    return JSON.parse(text);
  };

  useEffect(() => {
    if (!AS_URL) { setError('Brak VITE_AS_SALA_URL.'); return; }
    setLoading(l => ({...l, rooms:true}));
    gasJson(`${AS_URL}?action=getSalaList`)
      .then(j => { if (j.success) setRooms(j.data); else setError(j.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({...l, rooms:false})));
  }, []);

  useEffect(() => {
    if (!selectedRoom || !AS_URL) return;
    setLoading(l => ({...l, schedule:true})); setError(null);
    gasJson(`${AS_URL}?action=getSalaSchedule&id=${selectedRoom.id}&mon=${weekMonday}`)
      .then(j => { if (j.success) setSchedule(j.data); else setError(j.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({...l, schedule:false})));
  }, [selectedRoom, weekMonday]);

  const handleRoomSelect = room => {
    if (selectedRoom?.id === room.id) return;
    setSelected(room); setSchedule(null); setSelectedDay(null); setWeekMonday(thisMonday());
  };

  useEffect(() => {
    const fn = () => setTooltip(null);
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  const currentWeek   = schedule?.week ?? schedule?.weeks?.[0];
  const isCurrentWeek = weekMonday === thisMonday();
  const availableDays = DAY_NAMES.filter(d => currentWeek?.days?.[d]);

  // Przycinaj kolumny do faktycznego zakresu godzin w danych (bez pustych na końcu)
  const effectiveHours = useMemo(() => {
    if (!currentWeek?.days) return HOURS;
    let maxEndH = 9; // minimum: show at least to 9:00
    for (const dayData of Object.values(currentWeek.days)) {
      for (const item of buildTimeline(dayData.slots || [])) {
        maxEndH = Math.max(maxEndH, item.endH);
      }
    }
    const cap = Math.min(22, maxEndH + 1);
    return Array.from({ length: cap - 8 }, (_, i) => `${8 + i}:00`);
  }, [currentWeek]);
  const dayDates = useMemo(() => {
    const map = {};
    if (currentWeek?.days) for (const [d, v] of Object.entries(currentWeek.days)) map[d] = v.date;
    return map;
  }, [currentWeek]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Plan zajęć UEW</p>
            {onBack && (
              <button
                onClick={onBack}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                ← Wróć do wyboru kalendarza
              </button>
            )}
          </div>
          <RoomCombobox rooms={rooms} selected={selectedRoom} loadingRooms={loading.rooms} onSelect={handleRoomSelect} />
        </div>
      </div>

      {/* ── Sticky week + day nav (only when room selected) ── */}
      {selectedRoom && (
        <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-3xl mx-auto">
            {/* Week nav */}
            <div className="flex items-center justify-between px-4 py-2 gap-2">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors disabled:opacity-30"
                onClick={() => setWeekMonday(w => shiftWeek(w, -1))}
                disabled={loading.schedule}
                title="Poprzedni tydzień"
              >‹</button>

              <div className="text-center flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 leading-snug truncate">
                  {currentWeek?.label ?? weekMonday.replace(/-/g,'.')}
                </div>
                {!isCurrentWeek && (
                  <button
                    className="text-[11px] text-violet-500 hover:text-violet-700 transition-colors"
                    onClick={() => setWeekMonday(thisMonday())}
                  >
                    ↩ bieżący tydzień
                  </button>
                )}
              </div>

              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors disabled:opacity-30"
                onClick={() => setWeekMonday(w => shiftWeek(w, 1))}
                disabled={loading.schedule}
                title="Następny tydzień"
              >›</button>

              {/* Skok do konkretnej daty — opacity-0 overlay działa na iOS/Safari */}
              <div className="relative w-8 h-8 shrink-0" title="Skocz do tygodnia">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-base select-none pointer-events-none">📅</div>
                <input
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={e => {
                    if (!e.target.value) return;
                    const [y,m,d] = e.target.value.split('-').map(Number);
                    const dt = new Date(y, m-1, d);
                    setWeekMonday(localISO(new Date(y, m-1, d - ((dt.getDay()+6)%7))));
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Day tabs */}
            {availableDays.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !selectedDay ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cały tydzień
                </button>
                {availableDays.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDay === day ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                    {dayDates[day] && <span className="ml-1 opacity-60 font-normal">{fmtShortDate(dayDates[day])}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 space-y-4">

        {/* Empty state */}
        {!selectedRoom && !loading.rooms && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <span className="text-5xl">🏛️</span>
            <p className="text-sm font-medium text-center max-w-xs">Wybierz salę dydaktyczną powyżej, aby sprawdzić jej plan zajęć</p>
          </div>
        )}

        {/* Loading */}
        {selectedRoom && loading.schedule && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Ładowanie planu <strong className="text-slate-600">{selectedRoom.name}</strong>…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <strong>Błąd:</strong> {error}
          </div>
        )}

        {/* Schedule */}
        {selectedRoom && !loading.schedule && currentWeek && (
          <>
            {/* Legend */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS).map(([k, s]) => (
                <span key={k} className="text-xs px-3 py-1 rounded-full border font-semibold" style={{ background:s.bg, borderColor:s.border, color:s.text }}>
                  {k==='wolna'?'● ':''}{s.label}
                </span>
              ))}
            </div>

            {/* Main card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {selectedDay && currentWeek.days[selectedDay] ? (
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    {selectedDay} {dayDates[selectedDay] ? `· ${fmtShortDate(dayDates[selectedDay])}` : ''}
                  </p>
                  <DayTimeline dayData={currentWeek.days[selectedDay]} dayName={selectedDay} dayDate={dayDates[selectedDay]} />
                </div>
              ) : (
                <WeekTable week={currentWeek} hours={effectiveHours} onSlotClick={(content, e) => {
                  e.stopPropagation();
                  if (!content) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ content, x: rect.left, y: rect.bottom + 8 });
                }} />
              )}
            </div>
          </>
        )}

        {selectedRoom && !loading.schedule && schedule && !currentWeek && (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 flex flex-col items-center gap-2 text-slate-400">
            <span className="text-3xl">📅</span>
            <p className="text-sm">Brak danych dla tego tygodnia</p>
          </div>
        )}
      </div>

      {/* ── CTA Card ── */}
      {selectedRoom && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-4">
          <div className="rounded-2xl p-4 text-white flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <span className="text-2xl shrink-0">📋</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm mb-0.5">Chcesz zarezerwować wolną salę?</p>
              <p className="text-white/70 text-xs">Sala {selectedRoom.name} · złóż podanie do Prorektora</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 bg-white font-black text-xs px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow"
              style={{ color: '#6d28d9' }}
            >
              Złóż podanie →
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', zIndex: 9999,
            top: Math.min(tooltip.y, window.innerHeight - 160),
            left: Math.min(tooltip.x, window.innerWidth - 320),
            background: '#1f2937', color: '#f9fafb',
            padding: '12px 16px', borderRadius: 12, fontSize: 12, maxWidth: 300,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)', lineHeight: 1.5,
          }}
        >
          <strong>Szczegóły zajęć:</strong>
          <pre style={{ margin: '4px 0 0', fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {tooltip.content}
          </pre>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedRoom && (
        <ReservationModal
          room={selectedRoom}
          selectedDay={selectedDay}
          dayDates={dayDates}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
