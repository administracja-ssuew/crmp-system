// FIRESTORE SECURITY RULES REMINDER:
// Add the following to your Firestore rules for access_submissions:
//
// match /access_submissions/{docId} {
//   allow read: if request.auth != null;
//   allow create: if request.auth != null
//     && request.resource.data.email.matches('.*@samorzad\\.ue\\.wroc\\.pl');
//   allow update: if request.auth != null
//     && get(/databases/$(database)/documents/authorized_users/$(request.auth.uid)).data.role == 'admin';
// }

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

// --- Shared helpers (ACC-03) — advisory; uses client clock ---
export const isWindowOpen = () => {
  const day = new Date().getDate()
  return day >= 1 && day <= 5
}

export const daysUntilNextWindow = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24))
}

// --- Email validator (ACC-01) ---
export const isValidEmail = (email) => /^[^@]+@samorzad\.ue\.wroc\.pl$/i.test(email)

// --- Rooms list (ACC-01, locked decision) ---
export const ROOMS = [
  '9 J',
  '16 J',
  '28 J',
  '11 J',
]

// --- Month helper ---
export const currentMonth = () => new Date().toISOString().slice(0, 7)

const EMPTY_FORM = { name: '', email: '', index: '', room: ROOMS[0], justification: '' }

export default function AccessListPage() {
  const { user } = useAuth()
  const windowOpen = isWindowOpen()

  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [approvedList, setApprovedList] = useState([])
  const [isLoadingApproved, setIsLoadingApproved] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isWindowOpen()) {
      setError('Okno zgłoszeń jest zamknięte.')
      return
    }
    if (!form.name.trim()) { setError('Podaj imię i nazwisko.'); return }
    if (!form.index.trim()) { setError('Podaj numer indeksu.'); return }
    if (!isValidEmail(form.email)) {
      setError('Adres e-mail musi być w domenie @samorzad.ue.wroc.pl')
      return
    }
    if (!form.justification.trim()) { setError('Uzasadnienie jest wymagane.'); return }

    setIsSubmitting(true)
    try {
      const month = currentMonth()
      const safeEmail = form.email.toLowerCase().replace(/[@.]/g, '_')
      const docId = `${safeEmail}_${month}`
      const ref = doc(db, 'access_submissions', docId)

      const existing = await getDoc(ref)
      if (existing.exists()) {
        setError('Już złożyłeś/aś zgłoszenie w tym miesiącu.')
        return
      }

      await setDoc(ref, {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        index: form.index.trim(),
        room: form.room,
        justification: form.justification.trim(),
        status: 'pending',
        month,
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Błąd zapisu zgłoszenia:', err)
      setError('Błąd połączenia. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchApproved = async () => {
    setIsLoadingApproved(true)
    try {
      const month = currentMonth()
      const q = query(
        collection(db, 'access_submissions'),
        where('month', '==', month)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.status === 'approved')
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pl'))
      setApprovedList(data)
    } catch (err) {
      console.error('Błąd pobierania listy zatwierdzeń:', err)
    } finally {
      setIsLoadingApproved(false)
    }
  }

  useEffect(() => {
    if (!windowOpen) fetchApproved()
  }, [windowOpen])

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">Lista Dostępowa</h1>
          <p className="text-slate-500 mt-1 text-sm">Miesięczne zgłoszenia dostępu do pomieszczeń Samorządu</p>
        </div>

        {windowOpen ? (
          submitted ? (
            /* Success state */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Zgłoszenie przyjęte!</h2>
              <p className="text-slate-500 text-sm">Twoje zgłoszenie zostało zapisane. Administrator rozpatrzy je wkrótce.</p>
            </div>
          ) : (
            /* Submission form */
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Okno zgłoszeń otwarte (dni 1–5 miesiąca)
              </div>

              {/* Imię i nazwisko */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Imię i nazwisko *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="np. Jan Kowalski"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Adres e-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Adres e-mail @samorzad.ue.wroc.pl *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="imie.nazwisko@samorzad.ue.wroc.pl"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Nr indeksu */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nr indeksu *</label>
                <input
                  type="text"
                  name="index"
                  value={form.index}
                  onChange={handleChange}
                  required
                  placeholder="np. 123456"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Wybór pomieszczenia */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pomieszczenie *</label>
                <select
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Uzasadnienie */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Uzasadnienie *</label>
                <textarea
                  name="justification"
                  value={form.justification}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Opisz powód, dla którego potrzebujesz dostępu do pomieszczenia..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
              </button>
            </form>
          )
        ) : (
          /* Window closed state */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-black text-slate-700 mb-2">Okno zgłoszeń zamknięte</h2>
              <p className="text-slate-500 text-sm mb-4">
                Zgłoszenia przyjmujemy w dniach 1–5 każdego miesiąca.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-600">
                Następne otwarcie za <span className="text-indigo-600">{daysUntilNextWindow()} dni</span>
              </div>
            </div>

            {/* Approved list (ACC-05) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-800 mb-1">
                Lista zatwierdzona — {currentMonth()}
              </h2>
              <p className="text-xs text-slate-400 mb-5">Osoby z zatwierdzonym dostępem w bieżącym miesiącu</p>

              {isLoadingApproved ? (
                <div className="text-center py-8 text-slate-400 text-sm font-bold">Ładowanie...</div>
              ) : approvedList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Brak zatwierdzonych zgłoszeń w tym miesiącu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 pr-4">Lp.</th>
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 pr-4">Imię i nazwisko</th>
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 pr-4">Nr indeksu</th>
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">Pomieszczenie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedList.map((s, i) => (
                        <tr key={s.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="py-2 pr-4 font-bold text-slate-700">{s.name}</td>
                          <td className="py-2 pr-4 text-slate-500">{s.index}</td>
                          <td className="py-2 text-slate-500">{s.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
