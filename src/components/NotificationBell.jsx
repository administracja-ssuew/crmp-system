import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_META } from '../notifications/modules';
import { currentPushState, enablePush } from '../notifications/client';

const RESOLUTION = { approved: 'zatwierdzono', rejected: 'odrzucono', auto: 'zamknięto' };
const when = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const hasLocalToken = () => { try { return Boolean(localStorage.getItem('cra_push_token')); } catch { return false; } };

export default function NotificationBell({ total, recent }) {
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState(() => currentPushState());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleEnable = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await enablePush();
      if (r.ok) setMsg('Powiadomienia włączone na tym urządzeniu.');
      else if (r.reason === 'denied') setMsg('Powiadomienia są zablokowane w ustawieniach przeglądarki.');
      else setMsg('To urządzenie nie obsługuje powiadomień push.');
    } catch {
      setMsg('Nie udało się włączyć powiadomień. Spróbuj ponownie.');
    } finally {
      setPushState(currentPushState()); setBusy(false);
    }
  };

  const enabledHere = pushState === 'granted' && hasLocalToken();

  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Powiadomienia${total ? ` (${total} oczekujących)` : ''}`}
        className="relative w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md border border-white/60 shadow-lg rounded-xl text-xl hover:scale-105 transition-all"
      >
        🔔
        {total > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow">{total}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">Powiadomienia</p>
            {total > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">{total} oczekuje</span>}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {recent.length === 0 && <li className="px-5 py-6 text-sm text-slate-400 text-center">Brak powiadomień</li>}
            {recent.map((n) => (
              <li key={n.id}>
                <Link to={n.url || MODULE_META[n.module]?.url || '/'} onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-black ${n.status === 'open' ? 'text-slate-900' : 'text-slate-400'}`}>{n.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{when(n.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  {n.status === 'resolved' && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">
                      {RESOLUTION[n.resolution] || 'rozpatrzono'}{n.actor ? ` · ${n.actor}` : ''}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-xs">
            {pushState === 'ios-install' && (
              <p className="text-slate-600">Na iPhonie: <b>Udostępnij → Do ekranu początkowego</b>, otwórz CRA z ikony i włącz powiadomienia tutaj.</p>
            )}
            {pushState === 'unsupported' && <p className="text-slate-500">Ta przeglądarka nie obsługuje powiadomień push.</p>}
            {pushState === 'denied' && <p className="text-slate-500">Powiadomienia są zablokowane — odblokuj je w ustawieniach przeglądarki dla tej strony.</p>}
            {(pushState === 'default' || (pushState === 'granted' && !enabledHere)) && (
              <button onClick={handleEnable} disabled={busy} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50">
                {busy ? 'Włączanie…' : 'Włącz powiadomienia na tym urządzeniu'}
              </button>
            )}
            {enabledHere && <p className="text-emerald-700 font-bold">✓ Powiadomienia włączone na tym urządzeniu</p>}
            {msg && <p className="mt-2 text-slate-600">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
