import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const currentMonth = () => new Date().toISOString().slice(0, 7) // "YYYY-MM"

const STATUS_LABELS = {
  pending:  { label: 'Oczekuje',    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  approved: { label: 'Zatwierdzone', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Odrzucone',   bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
}

export default function AdminAccessPanel() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(new Set())

  const month = currentMonth()

  const fetchSubmissions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const q = query(
        collection(db, 'access_submissions'),
        where('month', '==', month)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setSubmissions(data)
    } catch (err) {
      console.error('Błąd pobierania zgłoszeń:', err)
      setError('Nie udało się pobrać zgłoszeń.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchSubmissions() }, [])

  const handleStatusChange = async (submission, newStatus) => {
    if (isUpdating.has(submission.id)) return
    setIsUpdating(prev => new Set(prev).add(submission.id))
    try {
      await updateDoc(doc(db, 'access_submissions', submission.id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email,
      })
      await fetchSubmissions()
    } catch (err) {
      console.error('Błąd aktualizacji:', err)
    } finally {
      setIsUpdating(prev => { const next = new Set(prev); next.delete(submission.id); return next })
    }
  }

  const approved = submissions.filter(s => s.status === 'approved')
  const pending  = submissions.filter(s => s.status === 'pending')
  const rejected = submissions.filter(s => s.status === 'rejected')

  const handleExportPDF = () => {
    const month = currentMonth()
    const approvedSubmissions = submissions.filter(s => s.status === 'approved')

    if (approvedSubmissions.length === 0) {
      alert('Brak zatwierdzonych zgłoszeń do eksportu.')
      return
    }

    const docPdf = new jsPDF()

    docPdf.setFont('helvetica', 'bold')
    docPdf.setFontSize(16)
    docPdf.text('Lista Dostępowa', 14, 18)

    docPdf.setFont('helvetica', 'normal')
    docPdf.setFontSize(10)
    docPdf.text(`Miesiąc: ${month}`, 14, 27)
    docPdf.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 14, 33)

    autoTable(docPdf, {
      startY: 42,
      head: [['Lp.', 'Imię i nazwisko', 'Nr indeksu', 'E-mail', 'Pomieszczenie']],
      body: approvedSubmissions.map((s, i) => [
        i + 1,
        s.name,
        s.index,
        s.email,
        s.room,
      ]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    docPdf.save(`lista-dostepowa-${month}.pdf`)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Panel Dostęp</h1>
            <p className="text-slate-500 text-sm mt-1">Lista dostępowa — {month}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isLoading || submissions.filter(s => s.status === 'approved').length === 0}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Eksportuj PDF
            </button>
            <button
              onClick={fetchSubmissions}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Odświeżanie...' : 'Odśwież'}
            </button>
          </div>
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

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Submissions list */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-bold">Ładowanie...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold">Brak zgłoszeń w {month}</div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const statusStyle = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending
              const busy = isUpdating.has(s.id)
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      <p className="text-xs text-slate-500">Nr indeksu: <span className="font-bold text-slate-700">{s.index}</span></p>
                      <p className="text-xs text-slate-500">Pomieszczenie: <span className="font-bold text-slate-700">{s.room}</span></p>
                      {s.justification && (
                        <p className="text-xs text-slate-400 mt-2 italic">"{s.justification}"</p>
                      )}
                      {s.reviewedBy && (
                        <p className="text-[10px] text-slate-300 mt-1">Rozpatrzył/a: {s.reviewedBy}</p>
                      )}
                    </div>

                    {/* Action buttons — only show for pending */}
                    {s.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusChange(s, 'approved')}
                          disabled={busy}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Zatwierdź
                        </button>
                        <button
                          onClick={() => handleStatusChange(s, 'rejected')}
                          disabled={busy}
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

        {/* Plan 3.4: approved list read-only view goes here (visible to all members on AccessListPage) */}

      </div>
    </div>
  )
}
