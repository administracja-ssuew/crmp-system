import { useState } from 'react';

export default function AccessRequestPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', index: '', organization: '', justification: ''
  });
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-12 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Wniosek wysłany!</h1>
          <p className="text-slate-500 text-sm">Otrzymasz maila gdy administrator rozpatrzy Twój wniosek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 max-w-xl w-full">
        
        <div className="text-center mb-8">
          <img src="/logo.png" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-800">Wniosek o dostęp do CRA</h1>
          <p className="text-slate-500 text-sm mt-1">Samorząd Studentów UEW</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Imię i nazwisko *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="Jan Kowalski" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">E-mail uczelniany *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="jan.kowalski@samorzad.ue.wroc.pl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nr telefonu</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="+48 123 456 789" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nr indeksu</label>
              <input name="index" value={form.index} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder="123456" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Komisja / Organizacja *</label>
            <input name="organization" value={form.organization} onChange={handleChange} required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              placeholder="np. Komisja ds. Administracji" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Uzasadnienie *</label>
            <textarea name="justification" value={form.justification} onChange={handleChange} required rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none"
              placeholder="Dlaczego potrzebujesz dostępu do systemu CRA?" />
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl">
              ⛔ Wystąpił błąd. Spróbuj ponownie.
            </div>
          )}

          <button onClick={handleSubmit} disabled={status === 'loading'}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition disabled:bg-slate-300">
            {status === 'loading' ? 'Wysyłanie...' : 'Wyślij wniosek →'}
          </button>
        </div>

      </div>
    </div>
  );
}