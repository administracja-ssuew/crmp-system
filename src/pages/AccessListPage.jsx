// FIRESTORE SECURITY RULES REMINDER:
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

// --- Window helpers (ACC-03) ---
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

// --- Rooms available in form (24J is permanent-only — no recruitment) ---
export const ROOMS = ['9 J', '16 J', '28 J', '11 J']

// --- Month helper ---
export const currentMonth = () => new Date().toISOString().slice(0, 7)

// TODO: zmień na właściwy link do klauzuli RODO na Google Drive
const RODO_URL = 'https://drive.google.com/file/d/ZMIEN_NA_WLASCIWY_ID/view'

const EMPTY_FORM = {
  name: '',
  email: '',
  index: '',
  rooms: [],
  justification: '',
  projectName: '',
  projectRole: '',
  justification11J: '',
  comment: '',
  rodoAccepted: false,
}

export default function AccessListPage() {
  const { user } = useAuth()
  const windowOpen = isWindowOpen()

  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [approvedList, setApprovedList] = useState([])
  const [isLoadingApproved, setIsLoadingApproved] = useState(false)

  const needs11J = form.rooms.includes('11 J')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const handleRoomToggle = (room) => {
    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.includes(room)
        ? prev.rooms.filter(r => r !== room)
        : [...prev.rooms, room],
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isWindowOpen()) { setError('Okno zgłoszeń jest zamknięte.'); return }
    if (!form.name.trim()) { setError('Podaj imię i nazwisko.'); return }
    if (!form.index.trim()) { setError('Podaj numer indeksu.'); return }
    if (!isValidEmail(form.email)) { setError('Adres e-mail musi być w domenie @samorzad.ue.wroc.pl'); return }
    if (form.rooms.length === 0) { setError('Wybierz co najmniej jedno pomieszczenie.'); return }
    if (!form.justification.trim()) { setError('Uzasadnienie jest wymagane.'); return }
    if (needs11J) {
      if (!form.projectName.trim()) { setError('Podaj nazwę projektu (wymagane dla sali 11J).'); return }
      if (!form.projectRole.trim()) { setError('Podaj swoją rolę w projekcie (wymagane dla sali 11J).'); return }
      if (!form.justification11J.trim()) { setError('Podaj uzasadnienie dostępu do sali 11J.'); return }
    }
    if (!form.rodoAccepted) { setError('Wymagana akceptacja klauzuli informacyjnej RODO.'); return }

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
        rooms: form.rooms,
        justification: form.justification.trim(),
        ...(needs11J && {
          projectName: form.projectName.trim(),
          projectRole: form.projectRole.trim(),
          justification11J: form.justification11J.trim(),
        }),
        comment: form.comment.trim(),
        rodoAccepted: true,
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
      const q = query(collection(db, 'access_submissions'), where('month', '==', month))
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
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Zgłoszenie przyjęte!</h2>
              <p className="text-slate-500 text-sm">Twoje zgłoszenie zostało zapisane. Administrator rozpatrzy je wkrótce.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Okno zgłoszeń otwarte (dni 1–5 miesiąca)
              </div>

              {/* Imię i nazwisko */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Imię i nazwisko *</label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder="np. Jan Kowalski"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Adres e-mail @samorzad.ue.wroc.pl *</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="imie.nazwisko@samorzad.ue.wroc.pl"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Nr indeksu */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nr indeksu *</label>
                <input
                  type="text" name="index" value={form.index} onChange={handleChange} required
                  placeholder="np. 193471"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Pomieszczenia — checkboxy */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pomieszczenia * <span className="normal-case font-normal">(można wybrać kilka)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {ROOMS.map(room => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => handleRoomToggle(room)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                        form.rooms.includes(room)
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                        form.rooms.includes(room) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                      }`}>
                        {form.rooms.includes(room) && <span className="text-white text-[10px]">✓</span>}
                      </span>
                      Sala {room}
                      {room === '11 J' && <span className="ml-auto text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">SPECJALNA</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uzasadnienie ogólne */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Uzasadnienie *</label>
                <textarea
                  name="justification" value={form.justification} onChange={handleChange} required rows={3}
                  placeholder="Opisz powód, dla którego potrzebujesz dostępu do wybranych pomieszczeń..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              {/* Dodatkowe pytania dla sali 11J */}
              {needs11J && (
                <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <p className="text-sm font-black text-amber-800">Sala 11J — dodatkowe informacje</p>
                  </div>
                  <p className="text-xs text-amber-700">Dostęp do sali 11J wymaga podania dodatkowych informacji o projekcie.</p>

                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Nazwa projektu *</label>
                    <input
                      type="text" name="projectName" value={form.projectName} onChange={handleChange}
                      placeholder="np. Konferencja Inspiracje 2026"
                      className="w-full bg-white border border-amber-200 p-3 rounded-xl text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Rola w projekcie *</label>
                    <input
                      type="text" name="projectRole" value={form.projectRole} onChange={handleChange}
                      placeholder="np. Koordynator, Członek zespołu..."
                      className="w-full bg-white border border-amber-200 p-3 rounded-xl text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Uzasadnienie dostępu do sali 11J *</label>
                    <textarea
                      name="justification11J" value={form.justification11J} onChange={handleChange} rows={3}
                      placeholder="Opisz szczegółowo, dlaczego Twój projekt wymaga dostępu do sali 11J..."
                      className="w-full bg-white border border-amber-200 p-3 rounded-xl text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Komentarz / pytanie */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Komentarz / pytanie <span className="normal-case font-normal">(opcjonalnie)</span></label>
                <textarea
                  name="comment" value={form.comment} onChange={handleChange} rows={2}
                  placeholder="Masz pytanie do administratora? Możesz je tutaj wpisać..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              {/* RODO */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="rodoAccepted" checked={form.rodoAccepted} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 flex-shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Zapoznałem/am się z{' '}
                    <a
                      href={RODO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline hover:text-indigo-800 font-bold"
                      onClick={e => e.stopPropagation()}
                    >
                      klauzulą informacyjną RODO
                    </a>{' '}
                    i wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi listy dostępowej Samorządu Studentów UEW. *
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
              </button>
            </form>
          )
        ) : (
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

            {/* Lista zatwierdzona */}
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
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedList.map((s, i) => (
                        <tr key={s.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="py-2 pr-4 font-bold text-slate-700">{s.name}</td>
                          <td className="py-2 pr-4 text-slate-500">{s.index}</td>
                          <td className="py-2 text-slate-500">{(s.rooms ?? [s.room]).join(', ')}</td>
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
