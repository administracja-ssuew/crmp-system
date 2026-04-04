---
plan: 3.2
title: Submission form (AccessListPage)
phase: 3
status: complete
depends_on: [3.1]
wave: 2
requirements: [ACC-01, ACC-03]
autonomous: true
files_modified:
  - src/pages/AccessListPage.jsx
---

# Plan 3.2: Submission form (AccessListPage)

## Goal

Replace the Plan 3.1 placeholder in `src/pages/AccessListPage.jsx` with a full page component that gates the submission form behind the 5-day window check, validates input, writes to Firestore with deduplication, and shows a read-only "window closed" state outside the window.

## Context

- Plan 3.1 already created `src/pages/AccessListPage.jsx` with the following named exports ready to use without re-implementing: `isWindowOpen`, `daysUntilNextWindow`, `isValidEmail`, `ROOMS`, `currentMonth`.
- Plan 3.1 already registered the route `/lista-dostepowa` in `src/App.jsx` pointing to this component.
- Firestore `db` is exported from `src/firebase.js`. `useAuth` is from `src/context/AuthContext.jsx` and provides `{ user }`.
- The approved list view (read-only, outside window) is implemented in Plan 3.4. In this plan, the outside-window state shows only a "window closed" banner with the days-until countdown — the approved list section is left as a `{/* Plan 3.4 approved list goes here */}` placeholder comment.
- Do NOT use `orderBy` in Firestore queries (no composite index exists). Sort client-side instead.
- Firestore Security Rules note: the `access_submissions` collection currently has no explicit client-write rules. Include a comment block at the top of the file reminding the developer to add Firestore rules. The recommended rule snippet is:
  ```
  match /access_submissions/{docId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null
      && request.resource.data.email.matches('.*@samorzad\\.ue\\.wroc\\.pl');
    allow update: if request.auth != null
      && get(/databases/$(database)/documents/authorized_users/$(request.auth.uid)).data.role == 'admin';
  }
  ```
  This comment belongs at the top of the file so the next developer knows to apply it in the Firebase Console.

## Tasks

- [ ] **Task 1 — Implement the form UI and window gate**

  Fully replace `src/pages/AccessListPage.jsx` with the complete component below. Keep all named exports from Plan 3.1 (they are re-exported from within this file).

  The component renders two distinct states:
  - **Window open (days 1–5):** Show the submission form with all 5 fields and a submit button. If `submitted === true`, replace the form with a success card.
  - **Window closed (days 6–end of month):** Show a muted banner stating the window is closed and listing the days until next opening. Include the `{/* Plan 3.4: approved list */}` placeholder.

  Full implementation:

  ```jsx
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

  import { useState } from 'react'
  import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
    'Sala posiedzeń',
    'Biuro Zarządu',
    'Sala projektowa',
    'Pomieszczenie gospodarcze',
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

              {/* Plan 3.4: approved list for current month goes here */}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

## Verification

1. On a day 1–5 of the month: navigate to `/lista-dostepowa` — the form with all 5 fields is visible.
2. Submit with a non-`@samorzad.ue.wroc.pl` email — inline error message appears, no Firestore write occurs.
3. Submit with all valid fields — success card replaces the form; check Firebase Console that a document exists in `access_submissions` with the correct `docId` pattern (`safeEmail_YYYY-MM`) and all fields.
4. Submit again with the same email in the same month — "Już złożyłeś/aś zgłoszenie w tym miesiącu." error appears.
5. On a day 6+ of the month (or temporarily change `isWindowOpen()` to return `false`): the "Okno zgłoszeń zamknięte" banner renders; the form is hidden.
6. No console errors.
