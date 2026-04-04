import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

// TODO: zmień na właściwy link do wzoru listy dostępowej na Google Drive
const DRIVE_TEMPLATE_URL = 'https://drive.google.com/file/d/ZMIEN_NA_WLASCIWY_ID/view'

const currentMonth = () => new Date().toISOString().slice(0, 7)


const STATUS_LABELS = {
  pending:  { label: 'Oczekuje',    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  approved: { label: 'Zatwierdzone', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Odrzucone',   bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
}

// Stałe wpisy — nie wymagają zgłoszenia
const CORE_MEMBERS = [
  { name: 'Emilia Ćwiklińska',    index: '188086' },
  { name: 'Magdalena Skoczylas',  index: '187691' },
  { name: 'Jakub Panas',          index: '187103' },
  { name: 'Daria Szewczyk',       index: '194192' },
  { name: 'Mikołaj Radliński',    index: '193471' },
  { name: 'Hubert Stachowski',    index: '194609' },
  { name: 'Karolina Smereczniak', index: '187608' },
  { name: 'Karol Vogel',          index: '194535' },
  { name: 'Marcel Tyrakowski',    index: '193563' },
  { name: 'Julia Pytel',          index: '194174' },
]

const PERMANENT = {
  '9 J':  CORE_MEMBERS,
  '16 J': CORE_MEMBERS,
  '28 J': CORE_MEMBERS,
  '11 J': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
    { name: 'Karol Vogel',       index: '194535' },
  ],
  '24 J': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
  ],
}

// Sale w kolejności dla PDF (24J jest tylko stała — brak rekrutacji)
const ROOMS_PDF_ORDER = ['9 J', '16 J', '28 J', '11 J', '24 J']

export default function AdminAccessPanel() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(new Set())
  const [listModal, setListModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const month = currentMonth()

  // Real-time listener
  useEffect(() => {
    setIsLoading(true)
    const q = query(collection(db, 'access_submissions'), where('month', '==', month))
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        setSubmissions(data)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Błąd nasłuchu zgłoszeń:', err)
        setError('Nie udało się pobrać zgłoszeń.')
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [month])

  const handleStatusChange = async (submission, newStatus) => {
    if (isUpdating.has(submission.id)) return
    setIsUpdating(prev => new Set(prev).add(submission.id))
    try {
      await updateDoc(doc(db, 'access_submissions', submission.id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email,
      })
      // onSnapshot automatycznie odświeży listę
    } catch (err) {
      console.error('Błąd aktualizacji:', err)
    } finally {
      setIsUpdating(prev => { const next = new Set(prev); next.delete(submission.id); return next })
    }
  }

  const generateListText = () => {
    const approvedSubmissions = submissions.filter(s => s.status === 'approved')
    const lines = []
    for (const room of ROOMS_PDF_ORDER) {
      lines.push(`Lista dostępowa do pomieszczenia ${room}`)
      lines.push('')
      for (const p of (PERMANENT[room] ?? [])) {
        lines.push(`${p.name} (${p.index})`)
      }
      const roomApproved = approvedSubmissions.filter(s =>
        (s.rooms ?? (s.room ? [s.room] : [])).includes(room)
      )
      for (const s of roomApproved) {
        lines.push(`${s.name} (${s.index})`)
      }
      lines.push('')
      lines.push('')
    }
    return lines.join('\n')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateListText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const approved = submissions.filter(s => s.status === 'approved')
  const pending  = submissions.filter(s => s.status === 'pending')
  const rejected = submissions.filter(s => s.status === 'rejected')

  return (
    <>
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Panel Dostęp</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-500 text-sm">Aktualizacje na żywo — {month}</p>
            </div>
          </div>
          <button
            onClick={() => setListModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            Generuj listę
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Oczekuje',     count: pending.length,  color: 'text-amber-600' },
            { label: 'Zatwierdzone', count: approved.length, color: 'text-emerald-600' },
            { label: 'Odrzucone',   count: rejected.length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-black ${color}`}>{count}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">{error}</div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-bold">Ładowanie...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold">Brak zgłoszeń w {month}</div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const statusStyle = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending
              const busy = isUpdating.has(s.id)
              const rooms = s.rooms ?? (s.room ? [s.room] : [])
              const has11J = rooms.includes('11 J')

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {statusStyle.label}
                        </span>
                        {has11J && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            11J ⚠️
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      <p className="text-xs text-slate-500">Nr indeksu: <span className="font-bold text-slate-700">{s.index}</span></p>
                      <p className="text-xs text-slate-500">Sale: <span className="font-bold text-slate-700">{rooms.join(', ') || '—'}</span></p>
                      {s.justification && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{s.justification}"</p>
                      )}

                      {/* Dodatkowe pola 11J */}
                      {has11J && (s.projectName || s.projectRole || s.justification11J) && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 space-y-0.5">
                          {s.projectName && <p className="text-xs text-amber-800"><span className="font-bold">Projekt:</span> {s.projectName}</p>}
                          {s.projectRole && <p className="text-xs text-amber-800"><span className="font-bold">Rola:</span> {s.projectRole}</p>}
                          {s.justification11J && <p className="text-xs text-amber-700 italic">"{s.justification11J}"</p>}
                        </div>
                      )}

                      {s.comment && (
                        <p className="text-xs text-indigo-600 mt-1">💬 {s.comment}</p>
                      )}
                      {s.reviewedBy && (
                        <p className="text-[10px] text-slate-300 mt-1">Rozpatrzył/a: {s.reviewedBy}</p>
                      )}
                    </div>

                    {s.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusChange(s, 'approved')} disabled={busy}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Zatwierdź
                        </button>
                        <button
                          onClick={() => handleStatusChange(s, 'rejected')} disabled={busy}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* Modal z listą do skopiowania */}
    {/* eslint-disable-next-line */}
    {listModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">Lista dostępowa — {month}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Skopiuj tekst i wklej do wzoru na Dysku</p>
            </div>
            <button onClick={() => setListModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <textarea
            readOnly
            value={generateListText()}
            className="flex-1 font-mono text-xs text-slate-700 p-5 resize-none outline-none overflow-y-auto min-h-0"
          />

          <div className="p-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? '✓ Skopiowano!' : 'Kopiuj do schowka'}
            </button>
            <a
              href={DRIVE_TEMPLATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Otwórz wzór na Dysku →
            </a>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
