import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function AccessRequestsPanel() {
  const { userRole } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const q = query(collection(db, 'access_requests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (request) => {
    const res = await fetch('/api/approve-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: request.id, email: request.email, name: request.name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Błąd zatwierdzania: ${data.error || res.status}`);
    }
    fetchRequests();
  };

  const handleReject = async (request) => {
    const res = await fetch('/api/reject-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: request.id, email: request.email, name: request.name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Błąd odrzucania: ${data.error || res.status}`);
    }
    fetchRequests();
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      rejected: 'bg-red-50 text-red-600 border-red-200',
    };
    const labels = { pending: '⏳ Oczekuje', approved: '✅ Zatwierdzono', rejected: '❌ Odrzucono' };
    return (
      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Panel Wniosków</h1>
        <p className="text-slate-500 text-sm mb-8">Zarządzaj wnioskami o dostęp do systemu CRA</p>

        {loading ? (
          <div className="text-center text-slate-400 py-20">Ładowanie...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-400 py-20">Brak wniosków</div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-black text-slate-800">{req.name}</h2>
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-sm text-slate-500">{req.email}</p>
                    {req.phone && <p className="text-sm text-slate-500">📞 {req.phone}</p>}
                    {req.index && <p className="text-sm text-slate-500">🎓 Indeks: {req.index}</p>}
                    <p className="text-sm text-slate-500">🏛️ {req.organization}</p>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl">{req.justification}</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprove(req)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 transition">
                        ✅ Zatwierdź
                      </button>
                      <button onClick={() => handleReject(req)}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-red-600 transition">
                        ❌ Odrzuć
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}