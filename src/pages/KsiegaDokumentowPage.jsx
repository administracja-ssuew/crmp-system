import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ksiegaMeta, preambula, czesci, katalog, strategie, sidebarSections } from '../data/ksiega';

const ACCENT = '#1477b5';
const TEXT_DARK = '#1a1a2e';
const BG_LIGHT = '#f8fafc';

// ─── Scroll progress bar ─────────────────────────────────────
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setProgress(Math.min(100, Math.max(0, scrolled * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5" style={{ background: '#e2e8f0' }}>
      <div
        className="h-full transition-all duration-75"
        style={{ width: `${progress}%`, background: ACCENT }}
      />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    'Obowiązujący': { bg: '#dcfce7', color: '#166534', label: 'Obowiązujący' },
    'W przygotowaniu': { bg: '#fef3c7', color: '#92400e', label: 'W przygotowaniu' },
    'Do uzupełnienia': { bg: '#f1f5f9', color: '#475569', label: 'Do uzupełnienia' },
  };
  const s = map[status] || map['Do uzupełnienia'];
  return (
    <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Placeholder Field ────────────────────────────────────────
function PlaceholderField({ label }) {
  return (
    <div className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg" style={{ background: '#f1f5f9' }}>
      <span className="text-slate-400 font-bold">{label}:</span>
      <span className="flex items-center gap-1 text-slate-400 italic">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Do uzupełnienia przez właściciela działu
      </span>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────
function DocumentCard({ doc, kolor }) {
  const [open, setOpen] = useState(false);
  const isPlaceholder = (val) => !val || val === null;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{ borderLeft: `4px solid ${kolor}` }}
    >
      <button
        className="w-full text-left px-5 py-4 flex justify-between items-start gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: `${kolor}15`, color: kolor }}>
              {doc.kod}
            </span>
            <StatusBadge status={doc.status} />
          </div>
          <p className="font-bold text-sm leading-snug" style={{ color: TEXT_DARK }}>{doc.nr}. {doc.nazwa}</p>
          {!open && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{doc.cel}</p>
          )}
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: kolor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2 border-t border-slate-50 pt-4 animate-fadeIn">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cel i opis</p>
            <p className="text-xs text-slate-700 leading-relaxed">{doc.cel}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1">
            {[
              ['Tryb autoryzacji', doc.autoryzacja],
              ['Adresat / obieg', doc.obieg],
              ['Archiwizacja', doc.archiwizacja],
              ['Szablon', doc.szablon],
              ['Powiązane dokumenty', doc.powiazane],
            ].map(([label, val]) => (
              isPlaceholder(val)
                ? <PlaceholderField key={label} label={label} />
                : (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="font-bold text-slate-500 shrink-0 w-32">{label}:</span>
                    <span className="text-slate-700 leading-relaxed">{val}</span>
                  </div>
                )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Document Section (Dział A/B/C) ──────────────────────────
function DocumentSection({ dzial, search, statusFilter }) {
  const filtered = dzial.dokumenty.filter(doc => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || doc.nazwa.toLowerCase().includes(q)
      || doc.kod.toLowerCase().includes(q)
      || (doc.cel || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all'
      || doc.status === statusFilter
      || (statusFilter === 'Do uzupełnienia' && !doc.autoryzacja);
    return matchSearch && matchStatus;
  });

  return (
    <section id={dzial.id} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 rounded-full" style={{ background: dzial.kolor }} />
        <h3 className="text-xl font-black" style={{ color: TEXT_DARK }}>{dzial.tytul}</h3>
        <span className="text-xs font-bold text-slate-400 ml-1">{filtered.length} dokumentów</span>
      </div>

      {dzial.nota && (
        <div className="mb-5 p-4 rounded-xl border text-xs text-slate-600 leading-relaxed"
          style={{ background: `${dzial.kolor}08`, borderColor: `${dzial.kolor}30` }}>
          <span className="font-bold" style={{ color: dzial.kolor }}>Nota redakcyjna: </span>
          {dzial.nota}
        </div>
      )}

      {dzial.dokumenty.length === 0 ? (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <div className="text-3xl mb-2">🗂️</div>
          <p className="font-bold text-slate-500 text-sm">Dział zarezerwowany</p>
          <p className="text-xs text-slate-400 mt-1">Karty dokumentów wymagają uzupełnienia przez właściciela działu.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm font-bold text-slate-400 text-center py-10">Brak wyników dla podanych filtrów.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} kolor={dzial.kolor} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Paragraph Accordion ─────────────────────────────────────
function KsiegaParagraph({ par }) {
  const [open, setOpen] = useState(false);
  const renderText = (text) => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: TEXT_DARK }}>{part}</strong>
        : part
    );
  };

  return (
    <div className="relative border-b border-slate-100 last:border-0">
      {/* Big number background */}
      <div
        className="absolute right-4 top-2 font-black text-7xl select-none pointer-events-none leading-none"
        style={{ color: '#1a1a2e', opacity: 0.03 }}
      >
        {par.numer.replace('§', '')}
      </div>

      <button
        className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors relative z-10"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: `${ACCENT}12`, color: ACCENT }}>
            {par.numer}
          </span>
          <span className="font-bold text-sm" style={{ color: TEXT_DARK }}>{par.tytul}</span>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 animate-fadeIn">
          {par.tresc.map((item, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed pl-2 border-l-2 border-slate-100">
              {renderText(item)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Strategy Timeline ────────────────────────────────────────
function StrategyTimeline({ fazy }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5" style={{ background: '#e2e8f0' }} />
      <div className="space-y-8">
        {fazy.map((faza, idx) => (
          <div key={idx} className="relative flex gap-6">
            {/* Node */}
            <div
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg font-black text-white text-sm"
              style={{ background: faza.kolor }}
            >
              {faza.nr}
            </div>
            {/* Content */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <div>
                  <h4 className="font-black text-base" style={{ color: TEXT_DARK }}>Faza {faza.nr} — {faza.tytul}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{faza.podtytul}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {faza.dzialania.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: faza.kolor }} />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: faza.kolor }}>Miernik sukcesu</p>
                <p className="text-xs text-slate-700 leading-relaxed italic">{faza.miernik}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
function KsiegaSidebar({ activeSection, onNav, mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed lg:sticky top-0 lg:top-20 z-40 lg:z-auto
        w-72 lg:w-auto lg:min-w-[240px] h-screen lg:h-auto max-h-screen overflow-y-auto
        bg-white lg:bg-transparent
        shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="lg:sticky lg:top-20 bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nawigacja</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 hidden lg:block">Spis Treści</h3>
          <nav className="space-y-0.5">
            {sidebarSections.map(section => (
              <div key={section.id}>
                <button
                  onClick={() => { onNav(section.id); onClose(); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSection === section.id
                      ? 'text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  style={activeSection === section.id ? { background: ACCENT } : {}}
                >
                  {section.label}
                </button>
                {section.sub && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    {section.sub.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => { onNav(sub.id); onClose(); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          activeSection === sub.id
                            ? 'text-white'
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                        style={activeSection === sub.id ? { background: ACCENT } : {}}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {sub.label.replace(/Dział [A-C] — /, '')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

// ─── Hero / Preambuła ─────────────────────────────────────────
function KsiegaHero() {
  const renderText = (text) => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };
  const quotes = preambula.filter(Boolean).filter((_, i) => i >= 3 && i <= 5);
  const rest = preambula.filter(Boolean).filter((_, i) => i < 3 || i > 5);

  return (
    <section id="preambuła" className="scroll-mt-28 mb-16">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-10 md:p-14"
        style={{ background: TEXT_DARK }}>
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-black text-white tracking-[0.3em] uppercase"
            style={{ fontSize: '10vw', opacity: 0.03, whiteSpace: 'nowrap' }}>
            SSUEW
          </span>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Preambuła</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Księga Identyfikacji Wizualnej Dokumentów
          </h2>
          <p className="text-slate-300 font-bold text-sm tracking-widest uppercase">
            Samorządu Studentów UEW
          </p>

          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-slate-700">
            <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Wersja</p><p className="text-xs font-bold text-slate-300 mt-0.5">{ksiegaMeta.wersja}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Data</p><p className="text-xs font-bold text-slate-300 mt-0.5">{ksiegaMeta.data}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</p><p className="text-xs font-bold text-slate-300 mt-0.5">{ksiegaMeta.status}</p></div>
          </div>
        </div>
      </div>

      {/* Intro paragraphs */}
      <div className="space-y-5 mb-8">
        {rest.slice(0, 2).map((p, i) => (
          <p key={i} className="text-base text-slate-700 leading-relaxed">{renderText(p)}</p>
        ))}
      </div>

      {/* Quoted convictions */}
      <div className="space-y-4 mb-8">
        {quotes.map((q, i) => (
          <blockquote key={i} className="pl-5 py-2 text-sm text-slate-700 leading-relaxed"
            style={{ borderLeft: `3px solid ${ACCENT}` }}>
            {renderText(q)}
          </blockquote>
        ))}
      </div>

      {/* Final paragraph */}
      {rest.slice(2).map((p, i) => (
        <p key={i} className="text-base text-slate-700 leading-relaxed italic">{renderText(p)}</p>
      ))}
    </section>
  );
}

// ─── Part Section (Część I, II, IV, VI) ──────────────────────
function CzescSection({ czesc }) {
  return (
    <section id={czesc.id} className="scroll-mt-28 mb-14">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Część {czesc.numer}</span>
        <h2 className="text-2xl font-black" style={{ color: TEXT_DARK, fontFamily: 'Georgia, serif' }}>
          {czesc.tytul}
        </h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {czesc.paragrafy.map(par => (
          <KsiegaParagraph key={par.id} par={par} />
        ))}
      </div>
    </section>
  );
}

// ─── Katalog Section ──────────────────────────────────────────
function KatalogSection({ search, statusFilter, setSearch, setStatusFilter }) {
  return (
    <section id="katalog" className="scroll-mt-28 mb-14">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Część III</span>
        <h2 className="text-2xl font-black" style={{ color: TEXT_DARK, fontFamily: 'Georgia, serif' }}>
          Katalog Dokumentów
        </h2>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Szukaj dokumentu po nazwie lub kodzie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 font-medium w-full placeholder-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border-0 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 outline-none"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="Obowiązujący">Obowiązujący</option>
          <option value="W przygotowaniu">W przygotowaniu</option>
          <option value="Do uzupełnienia">Do uzupełnienia</option>
        </select>
      </div>

      <div className="space-y-12">
        {Object.values(katalog).map(dzial => (
          <DocumentSection
            key={dzial.id}
            dzial={dzial}
            search={search}
            statusFilter={statusFilter}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Strategie Section ────────────────────────────────────────
function StrategieSection() {
  const { par18, par19 } = strategie;

  return (
    <section id="czesc5" className="scroll-mt-28 mb-14">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Część V</span>
        <h2 className="text-2xl font-black" style={{ color: TEXT_DARK, fontFamily: 'Georgia, serif' }}>
          Strategie
        </h2>
      </div>

      {/* §18 */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: `${ACCENT}12`, color: ACCENT }}>{par18.numer}</span>
          <h3 className="font-black text-xl" style={{ color: TEXT_DARK }}>{par18.tytul}</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{par18.cel}</p>

        {/* Zasady */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {par18.zasady.map((z, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white">
              <p className="font-black text-xs uppercase tracking-widest mb-1.5" style={{ color: ACCENT }}>{z.nazwa}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{z.tresc}</p>
            </div>
          ))}
        </div>

        <h4 className="font-black text-base mb-6" style={{ color: TEXT_DARK }}>Plan wdrożenia fazowego</h4>
        <StrategyTimeline fazy={par18.fazy} />
      </div>

      {/* §19 */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: `${ACCENT}12`, color: ACCENT }}>{par19.numer}</span>
          <h3 className="font-black text-xl" style={{ color: TEXT_DARK }}>{par19.tytul}</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{par19.cel}</p>

        <div className="space-y-4">
          {par19.poziomy.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0"
                style={{ background: ACCENT }}
              >
                {p.nr}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-black text-sm" style={{ color: TEXT_DARK }}>{p.tytul}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: '#e0f2fe', color: '#0369a1' }}>{p.czestotliwosc}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{p.opis}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function KsiegaDokumentowPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [activeSection, setActiveSection] = useState('preambuła');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('all');
  const observerRef = useRef(null);

  // Intersection Observer for active section highlighting
  useEffect(() => {
    const ids = ['preambuła', 'czesc1', 'czesc2', 'katalog', 'dzialA', 'dzialB', 'dzialC', 'czesc4', 'czesc5', 'czesc6'];
    const elements = ids.map(id => document.getElementById(id)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    elements.forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const handleNav = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  }, []);

  return (
    <div className="min-h-screen pt-16 pb-20" style={{ background: BG_LIGHT, color: TEXT_DARK }}>
      <ScrollProgress />

      {/* Inject font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        .ks-serif { font-family: 'Playfair Display', Georgia, serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeInUp 0.25s ease forwards; }
      `}</style>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-20 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          style={{ color: ACCENT }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Spis treści
        </button>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KIWID SSUEW</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="pt-6 lg:pt-8 mb-8">
          <Link to="/dokumenty"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            ← Wróć do Modułu Lex SSUEW
          </Link>
        </div>

        <div className="flex gap-8 lg:gap-12">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <KsiegaSidebar
              activeSection={activeSection}
              onNav={handleNav}
              mobileOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <KsiegaSidebar
              activeSection={activeSection}
              onNav={handleNav}
              mobileOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 mt-8 lg:mt-0">
            <KsiegaHero />

            {/* Część I–II */}
            {czesci.filter(c => ['czesc1', 'czesc2'].includes(c.id)).map(czesc => (
              <CzescSection key={czesc.id} czesc={czesc} />
            ))}

            {/* Katalog */}
            <KatalogSection
              search={catalogSearch}
              statusFilter={catalogStatusFilter}
              setSearch={setCatalogSearch}
              setStatusFilter={setCatalogStatusFilter}
            />

            {/* Część IV */}
            {czesci.filter(c => c.id === 'czesc4').map(czesc => (
              <CzescSection key={czesc.id} czesc={czesc} />
            ))}

            {/* Strategie */}
            <StrategieSection />

            {/* Część VI */}
            {czesci.filter(c => c.id === 'czesc6').map(czesc => (
              <CzescSection key={czesc.id} czesc={czesc} />
            ))}

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate-200 text-center">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">
                *** Koniec Dokumentu ***
              </p>
              <p className="text-[10px] text-slate-300 mt-2">
                KIWID SSUEW v{ksiegaMeta.wersja} · {ksiegaMeta.data}
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
