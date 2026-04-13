import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';

const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
};

const CATEGORIES = [
  { id: 'bug',        label: 'Błąd systemu',       icon: '🐛', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'question',   label: 'Pytanie',            icon: '❓', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'suggestion', label: 'Sugestia',           icon: '💡', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'technical',  label: 'Pomoc Tech.',        icon: '🔧', color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const STATUS_MAP = {
  new:         { label: 'Nowe',        dot: 'bg-rose-500',   bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  in_progress: { label: 'W trakcie',   dot: 'bg-amber-500',  bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  closed:      { label: 'Zamknięte',   dot: 'bg-emerald-500',bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function HelpdeskModal({ user, isAdmin, onClose }) {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'my' | 'all'
  const [helpdeskForm, setHelpdeskForm] = useState({ category: 'bug', title: '', description: '' });
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [adminReply, setAdminReply] = useState({});

  const hdTabs = isAdmin
    ? [{ id: 'all', label: 'Wszystkie zgłoszenia' }, { id: 'submit', label: 'Nowe zgłoszenie' }]
    : [{ id: 'submit', label: 'Nowe zgłoszenie' }, { id: 'my', label: 'Moje zgłoszenia' }];

  useEffect(() => {
    if (isAdmin && activeTab === 'my') setActiveTab('all');
  }, [isAdmin]);

  const loadTickets = useCallback(async () => {
    if (!user?.uid) return;
    setTicketsLoading(true);
    try {
      const q = isAdmin 
        ? query(collection(db, 'helpdesk_tickets'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'helpdesk_tickets'), where('userId', '==', user.uid));
        
      const snap = await getDocs(q);
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (!isAdmin) {
        fetched.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      }
      
      setTickets(fetched);
    } catch (e) { console.error(e); setTickets([]); }
    setTicketsLoading(false);
  }, [isAdmin, user?.uid]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const submitTicket = async () => {
    if (!helpdeskForm.title.trim() || !helpdeskForm.description.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'helpdesk_tickets'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        category: helpdeskForm.category,
        title: helpdeskForm.title.trim(),
        description: helpdeskForm.description.trim(),
        status: 'new',
        createdAt: Timestamp.now(),
        adminResponse: null,
      });
      setHelpdeskForm({ category: 'bug', title: '', description: '' });
      setSubmitSuccess(true);
      loadTickets();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'helpdesk_tickets', id), { status });
      setTickets(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    } catch { /* silent */ }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Czy na pewno chcesz trwale usunąć to zgłoszenie? Tej operacji nie można cofnąć.")) return;
    try {
      await deleteDoc(doc(db, 'helpdesk_tickets', id));
      setTickets(ts => ts.filter(t => t.id !== id));
    } catch { /* silent */ }
  };

  const sendAdminReply = async (id) => {
    const text = (adminReply[id] || '').trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, 'helpdesk_tickets', id), {
        adminResponse: text,
        status: 'in_progress'
      });
      setTickets(ts => ts.map(t => t.id === id ? { ...t, adminResponse: text, status: 'in_progress' } : t));
      setAdminReply(r => ({ ...r, [id]: '' }));
    } catch { /* silent */ }
  };

  const displayedTickets = activeTab === 'my' ? tickets.filter(t => t.userId === user?.uid) : tickets;

  // Renderowanie ticketu używane dla myTickets i allTickets
  const renderTicketCard = (t) => {
    const cat = CATEGORIES.find(c => c.id === t.category);
    const st  = STATUS_MAP[t.status] || STATUS_MAP.new;
    const date = t.createdAt?.toDate?.()?.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || '—';

    return (
      <div key={t.id} className="bg-white border border-slate-200/60 rounded-[1.25rem] p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${cat?.color || 'bg-slate-100 text-slate-600'}`}>
                {cat?.icon} {cat?.label || t.category}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${st.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span> {st.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">{date}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-snug">{t.title}</h3>
            {isAdmin && <p className="text-[11px] text-slate-500 mt-1 font-medium">{t.userName} · {t.userEmail}</p>}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 shrink-0">
              <select value={t.status} onChange={e => updateTicketStatus(t.id, e.target.value)}
                className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer appearance-none pr-8 relative"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px top 50%', backgroundSize: '10px auto' }}>
                <option value="new">Nowe</option>
                <option value="in_progress">W trakcie</option>
                <option value="closed">Zakończone</option>
              </select>
              <button 
                onClick={() => deleteTicket(t.id)}
                title="Usuń to zgłoszenie"
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <Icons.Trash />
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mt-3 leading-relaxed break-words">
          {t.description}
        </p>

        {t.adminResponse && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 mt-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 rounded-l-xl"></div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">Odpowiedź wsparcia</p>
            <p className="text-sm text-indigo-900 font-medium ml-1 leading-relaxed">{t.adminResponse}</p>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 mt-4 items-end">
            <div className="flex-1">
              <label className="sr-only">Napisz odpowiedź</label>
              <input
                value={adminReply[t.id] || ''}
                onChange={e => setAdminReply(r => ({ ...r, [t.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && sendAdminReply(t.id)}
                placeholder={t.adminResponse ? 'Aktualizuj odpowiedź...' : 'Odpowiedz użytkownikowi...'}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-shadow"
              />
            </div>
            <button onClick={() => sendAdminReply(t.id)} disabled={!(adminReply[t.id] || '').trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shrink-0">
              {t.adminResponse ? 'Zmień' : 'Wyślij'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
      {/* Tło z mocnym blur by nadać "premium" feel */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      {/* Kontener Modalu */}
      <div className="relative bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 w-full max-w-3xl max-h-full flex flex-col overflow-hidden animate-slideUp">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               Centrum Wsparcia
               {isAdmin && tickets.filter(t => t.status === 'new').length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 animate-pulse">Nowe zgłoszenia</span>
               )}
             </h2>
             <p className="text-[11px] text-slate-500 font-medium mt-0.5">Zgłoś problem, sugestię lub zadaj pytanie.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
            <Icons.Close />
          </button>
        </div>

        {/* TABS */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/50 shrink-0">
          <div className="flex gap-2 border border-slate-200/60 p-1 rounded-2xl bg-white/50 w-full md:w-max">
             {hdTabs.map(t => (
               <button key={t.id} onClick={() => setActiveTab(t.id)}
                 className={`flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                   activeTab === t.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                 }`}>
                 {t.label}
               </button>
             ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 scrollbar-hide">
          
          {/* NOWE ZGŁOSZENIE */}
          {activeTab === 'submit' && (
            <div className="max-w-xl space-y-6">
              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-4 animate-fadeIn">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <Icons.Check />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-sm">Zgłoszenie wysłane pomyślnie!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Administrator wkrótce się z nim zapozna. Postęp sprawdzaj w zakładce obok.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">Kategoria problemu *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map(c => {
                    const isSel = helpdeskForm.category === c.id;
                    return (
                      <button key={c.id} onClick={() => setHelpdeskForm(f => ({ ...f, category: c.id }))}
                        className={`flex flex-col flex-1 items-center justify-center p-3 sm:px-2 rounded-2xl border transition-all duration-200 ${
                          isSel ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200/60 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <span className="text-xl mb-1.5 grayscale-[0.2]">{c.icon}</span>
                        <span className={`text-[11px] font-bold text-center ${isSel ? 'text-indigo-900' : 'text-slate-600'}`}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">Tytuł *</label>
                <input
                  value={helpdeskForm.title} onChange={e => setHelpdeskForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="np. Błąd dodawania wydarzenia..."
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">Szczegółowy opis *</label>
                <textarea
                  value={helpdeskForm.description} onChange={e => setHelpdeskForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Opisz problem. Co próbowałeś/aś zrobić, jak to odtworzyć?"
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button onClick={submitTicket} disabled={submitting || !helpdeskForm.title.trim() || !helpdeskForm.description.trim()}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white rounded-2xl font-bold text-sm transition-all focus:ring-4 focus:ring-slate-900/20 flex items-center justify-center gap-2">
                  {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                </button>
              </div>
            </div>
          )}

          {/* LISTA ZGŁOSZEŃ (MOJE / WSZYSTKIE) */}
          {activeTab !== 'submit' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={loadTickets} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase">
                  <Icons.Refresh /> Odśwież listę
                </button>
              </div>

              {ticketsLoading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-200/50 animate-pulse rounded-[1.25rem]" />)}</div>
              ) : displayedTickets.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="inline-flex w-16 h-16 rounded-full bg-slate-100 items-center justify-center text-rose-300 mb-4 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-700">Nic tu nie ma</h3>
                  <p className="text-sm text-slate-500 mt-1">Lista zgłoszeń jest pusta.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedTickets.map(renderTicketCard)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
