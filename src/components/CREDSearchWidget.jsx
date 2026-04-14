import { useState, useRef, useCallback } from 'react';
import { CRED_API_URL } from '../config';

/* ═══════════════════════════════════════════════════════
   KONFIGURACJA STATUSÓW
   Każdy status dostaje: kolor, opis po polsku, etap w procesie
   ═══════════════════════════════════════════════════════ */
const STATUS_MAP = {
  'NOWA':         { badge: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500',    label: 'Nowa',             stage: 0, desc: 'Wniosek wpłynął do systemu i oczekuje na przypisanie prowadzącego.' },
  'W TRAKCIE':    { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'W trakcie',        stage: 1, desc: 'Sprawa jest aktywnie procedowana przez prowadzącego w Komisji ds. Administracji.' },
  'POPRAWKI':     { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   label: 'Wymaga poprawek',  stage: 1, desc: 'Dokumenty wymagają uzupełnienia lub korekty. Sprawdź skrzynkę mailową.' },
  'WSTRZYMANE':   { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   label: 'Wstrzymana',       stage: 1, desc: 'Procedowanie zostało czasowo wstrzymane. Oczekujemy na dodatkowe informacje.' },
  'OCZEKUJE':     { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   label: 'Oczekuje',         stage: 1, desc: 'Sprawa oczekuje na odpowiedź lub decyzję zewnętrzną.' },
  'PODPIS WŁADZ': { badge: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500', label: 'Podpis Władz',     stage: 2, desc: 'Dokumenty zostały przekazane do podpisu Władz Uczelni. To ostatni etap przed zamknięciem.' },
  'ZAKOŃCZONE':   { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Zakończona',   stage: 3, desc: 'Sprawa została pomyślnie zakończona. Sprawdź skrzynkę mailową po dokumenty.' },
  'ZAKONCZONE':   { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Zakończona',   stage: 3, desc: 'Sprawa została pomyślnie zakończona. Sprawdź skrzynkę mailową po dokumenty.' },
  'ZREALIZOWANE': { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Zrealizowana', stage: 3, desc: 'Wniosek został zrealizowany. Sprawdź skrzynkę mailową po dokumenty.' },
  'ODRZUCONE':    { badge: 'bg-rose-100 text-rose-700 border-rose-200',      dot: 'bg-rose-500',    label: 'Odrzucona',        stage: 3, desc: 'Wniosek został odrzucony. Skontaktuj się z Administracją SSUEW w celu uzyskania wyjaśnień.' },
  'ANULOWANE':    { badge: 'bg-slate-100 text-slate-500 border-slate-200',   dot: 'bg-slate-400',   label: 'Anulowana',        stage: 3, desc: 'Sprawa została anulowana. W razie potrzeby złóż wniosek ponownie.' },
};

const getStatusCfg = (status) =>
  STATUS_MAP[(status || '').toUpperCase().trim()] ?? {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400', label: status || '—', stage: 0,
    desc: 'Skontaktuj się z Administracją SSUEW, aby uzyskać informacje o statusie sprawy.',
  };

const STAGES = [
  { label: 'Złożona',      icon: '📋' },
  { label: 'W procedurze', icon: '⚙️' },
  { label: 'Podpisy',      icon: '✍️' },
  { label: 'Zamknięta',    icon: '✅' },
];

const FINAL_STATUSES = new Set(['ZAKOŃCZONE', 'ZAKONCZONE', 'ZREALIZOWANE', 'ODRZUCONE', 'ANULOWANE']);
const isFinalStatus  = (s) => FINAL_STATUSES.has((s || '').toUpperCase().trim());
const isPositiveEnd  = (s) => ['ZAKOŃCZONE', 'ZAKONCZONE', 'ZREALIZOWANE'].includes((s || '').toUpperCase().trim());

// Walidacja podstawowego formatu znaku sprawy
const ZNAK_RE = /^[A-Z.]+\d{2}\/\d{2}\/\d{4}\//i;
const isValidZnak = (s) => ZNAK_RE.test(s.trim());

/* ═══════════════════════════════════════════════════════
   IKONY (inline SVG — bez zewnętrznych zależności)
   ═══════════════════════════════════════════════════════ */
const ChevronDown = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${className}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════
   PODKOMPONENTY
   ═══════════════════════════════════════════════════════ */

/** Skeleton placeholder podczas ładowania */
const Skeleton = ({ className = '' }) => (
  <div className={`bg-slate-100 animate-pulse rounded-xl ${className}`} />
);

/** Progress stepper */
const StageBar = ({ currentStage, isFinal, isPositive }) => {
  if (isFinal) {
    return (
      <div className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-black border ${
        isPositive
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
          : 'bg-rose-50 border-rose-100 text-rose-700'
      }`}>
        <span className="text-base">{isPositive ? '✅' : '⛔'}</span>
        {isPositive ? 'Sprawa zakończona pomyślnie' : 'Sprawa zamknięta — skontaktuj się z Administracją SSUEW'}
      </div>
    );
  }

  return (
    <div className="px-1">
      <div className="flex items-start">
        {STAGES.slice(0, 3).map((stage, idx) => {
          const isDone   = idx < currentStage;
          const isActive = idx === currentStage;
          return (
            <div key={stage.label} className="flex items-start flex-1">
              {/* Węzeł */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-300
                  ${isDone   ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' :
                    isActive ? 'bg-white border-blue-500 text-blue-600 shadow-md shadow-blue-100 ring-4 ring-blue-100' :
                               'bg-white border-slate-200 text-slate-300'}`}
                >
                  {isDone ? <CheckIcon /> : stage.icon}
                </div>
                <p className={`text-[9px] font-black mt-1.5 uppercase tracking-wider text-center leading-tight px-1
                  ${isDone ? 'text-blue-600' : isActive ? 'text-slate-700' : 'text-slate-300'}`}>
                  {stage.label}
                </p>
              </div>
              {/* Linia łącząca */}
              {idx < 2 && (
                <div className={`h-0.5 flex-1 mt-4 mx-1 transition-colors duration-500
                  ${isDone ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Pojedyncze zdarzenie na osi czasu */
const TimelineEvent = ({ event, isLast }) => (
  <div className="flex gap-3">
    {/* Linia pionowa + ikona */}
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-sm shrink-0 shadow-sm">
        {event.ikona || '📌'}
      </div>
      {!isLast && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
    </div>
    {/* Treść */}
    <div className={`flex-1 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm ${isLast ? 'mb-0' : 'mb-3'}`}>
      <p className="text-xs font-bold text-slate-700 leading-snug">{event.zdarzenie}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{event.timestamp}</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   GŁÓWNY KOMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CREDSearchWidget() {
  const [query,            setQuery]            = useState('');
  const [result,           setResult]           = useState(null);   // basic status
  const [timeline,         setTimeline]         = useState(null);   // oś czasu
  const [isSearching,      setIsSearching]      = useState(false);
  const [isLoadingTL,      setIsLoadingTL]      = useState(false);
  const [showTimeline,     setShowTimeline]     = useState(false);
  const [error,            setError]            = useState('');
  const [formatError,      setFormatError]      = useState('');
  const [copied,           setCopied]           = useState(false);

  const inputRef = useRef(null);

  /* ── Wyszukiwanie statusu ── */
  const handleSearch = useCallback(async (overrideQuery) => {
    const q = (overrideQuery ?? query).trim().toUpperCase();
    if (!q) { inputRef.current?.focus(); return; }

    if (!isValidZnak(q)) {
      setFormatError('Nieprawidłowy format znaku sprawy. Przykład: P.P.01/04/2026/SSUEW');
      return;
    }

    setFormatError('');
    setIsSearching(true);
    setError('');
    setResult(null);
    setTimeline(null);
    setShowTimeline(false);

    try {
      const res  = await fetch(`${CRED_API_URL}?znak=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else            setResult(data);
    } catch {
      setError('Błąd połączenia z bazą CRED. Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  /* ── Oś czasu (lazy — ładowana po kliknięciu) ── */
  const handleToggleTimeline = useCallback(async () => {
    if (timeline) {
      setShowTimeline(v => !v);
      return;
    }
    setShowTimeline(true);
    setIsLoadingTL(true);
    try {
      const res  = await fetch(`${CRED_API_URL}?znak=${encodeURIComponent(result.znak)}&timeline=1`);
      const data = await res.json();
      if (!data.error) setTimeline(data);
    } catch {
      // cicha obsługa — oś czasu jest opcjonalna
    } finally {
      setIsLoadingTL(false);
    }
  }, [result, timeline]);

  /* ── Kopiowanie znaku do schowka ── */
  const handleCopy = useCallback(() => {
    if (!result?.znak) return;
    navigator.clipboard.writeText(result.znak).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [result]);

  /* ── Obsługa inputa ── */
  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    if (formatError) setFormatError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  /* ── Dane pochodne ── */
  const cfg       = result ? getStatusCfg(result.status) : null;
  const isFinal   = result ? isFinalStatus(result.status) : false;
  const isPositive = result ? isPositiveEnd(result.status) : false;

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white mb-10 overflow-hidden">

      {/* ── NAGŁÓWEK ── */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-lg shrink-0">🔎</div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
            Sprawdź status sprawy CRED
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            System CRED — Administracja SSUEW
          </p>
        </div>
      </div>

      {/* ── POLE WYSZUKIWANIA ── */}
      <div className="px-6 py-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="NP. P.G.01/04/2026/NZS"
              spellCheck={false}
              autoCapitalize="characters"
              className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-mono font-bold text-slate-800
                placeholder:text-slate-300 placeholder:font-normal tracking-wide uppercase
                focus:outline-none focus:ring-4 focus:bg-white transition-all
                ${formatError
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'}`}
            />
            {/* Walidacja formatu */}
            {formatError && (
              <p className="absolute -bottom-5 left-1 text-[10px] font-bold text-rose-500 whitespace-nowrap">
                {formatError}
              </p>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              text-white rounded-2xl font-black uppercase tracking-wider text-xs
              shadow-lg shadow-blue-200 transition-all whitespace-nowrap
              flex items-center gap-2"
          >
            {isSearching ? <><Spinner /> Szukam…</> : 'Szukaj'}
          </button>
        </div>

        <p className="text-[10px] font-medium text-slate-400 mt-4 leading-relaxed">
          * Planowany dzień zakończenia uwzględnia czas niezbędny na uzyskanie podpisów Władz Uczelni.
        </p>
      </div>

      {/* ── LOADING SKELETON ── */}
      {isSearching && (
        <div className="px-6 pb-6 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-12" />
        </div>
      )}

      {/* ── BŁĄD POŁĄCZENIA ── */}
      {error && !isSearching && (
        <div className="mx-6 mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
          <span className="text-xl shrink-0">❌</span>
          <p className="text-sm font-bold text-rose-600 leading-snug">{error}</p>
        </div>
      )}

      {/* ── WYNIK ── */}
      {result && !isSearching && (
        <div className="px-6 pb-6 space-y-3">

          {/* Karta główna — znak + status + daty */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">

            {/* Nagłówek karty */}
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Znak sprawy
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-slate-800 text-base font-mono break-all leading-tight">
                    {result.znak}
                  </p>
                  <button
                    onClick={handleCopy}
                    title="Skopiuj znak do schowka"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200
                      text-slate-400 hover:text-blue-600 hover:border-blue-300
                      text-[10px] font-bold uppercase tracking-wider
                      transition-all active:scale-95 shrink-0"
                  >
                    {copied ? <><CheckIcon /> Skopiowano</> : <><CopyIcon /> Kopiuj</>}
                  </button>
                </div>
              </div>

              {/* Badge statusu */}
              <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${cfg.badge}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                {cfg.label}
              </span>
            </div>

            {/* Opis statusu — ludzki język */}
            <div className="px-4 pb-3 -mt-1">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{cfg.desc}</p>
            </div>

            {/* Daty */}
            <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
              <div className="p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Data wpłynięcia
                </p>
                <p className="font-black text-slate-700 text-sm">
                  {result.data_zlozenia || '—'}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Planowane zakończenie
                </p>
                <p className="font-black text-slate-700 text-sm">
                  {result.planowane_zakonczenie || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress stepper */}
          <StageBar
            currentStage={cfg.stage}
            isFinal={isFinal}
            isPositive={isPositive}
          />

          {/* Przycisk oś czasu */}
          <button
            onClick={handleToggleTimeline}
            className="w-full flex items-center justify-between px-4 py-3
              rounded-2xl bg-white border border-slate-200
              hover:border-blue-300 hover:bg-blue-50/50
              text-sm font-bold text-slate-500 hover:text-blue-600
              transition-all group"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">📜</span>
              <span>Historia zdarzeń</span>
              {timeline?.timeline?.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                  {timeline.timeline.length}
                </span>
              )}
            </span>
            <ChevronDown className={`text-slate-400 group-hover:text-blue-400 transition-transform duration-200 ${showTimeline ? 'rotate-180' : ''}`} />
          </button>

          {/* Oś czasu — lazy loaded */}
          {showTimeline && (
            <div className="overflow-hidden">
              {isLoadingTL ? (
                <div className="space-y-2 pl-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : timeline?.timeline?.length ? (
                <div className="pl-2 pt-1">
                  {timeline.timeline.map((evt, i) => (
                    <TimelineEvent
                      key={i}
                      event={evt}
                      isLast={i === timeline.timeline.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-bold">Brak historii zdarzeń dla tej sprawy.</p>
                </div>
              )}
            </div>
          )}

          {/* Kontakt pomocniczy */}
          <p className="text-[10px] text-center text-slate-400 font-medium pt-1">
            Masz pytanie?{' '}
            <a
              href="mailto:administracja@samorzad.ue.wroc.pl"
              className="font-bold text-blue-500 hover:text-blue-700 transition-colors"
            >
              administracja@samorzad.ue.wroc.pl
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
