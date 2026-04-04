import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'

const currentMonth = () => new Date().toISOString().slice(0, 7)

const MONTHS_PL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
]

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
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExportPDF = async () => {
    const approvedSubmissions = submissions.filter(s => s.status === 'approved')
    setIsExporting(true)

    try {
      const now = new Date()
      const monthName = MONTHS_PL[now.getMonth()].toUpperCase()
      const year = now.getFullYear()
      const monthStr = month // "YYYY-MM"

      const docPdf = new jsPDF({ format: 'a4', unit: 'mm' })
      const pageW = 210
      const pageH = 297
      const marginL = 20
      const marginR = 20
      const marginBottom = 28   // rezerwujemy miejsce na stopkę
      const contentW = pageW - marginL - marginR
      const maxY = pageH - marginBottom

      // --- Próba załadowania logo ---
      let logoDataUrl = null
      try {
        const resp = await fetch('/logo.png')
        const blob = await resp.blob()
        logoDataUrl = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      } catch (_) { /* bez logo — kontynuuj */ }

      // ---- Helpers ----
      const setTimes = (style, size, color = [20, 20, 20]) => {
        docPdf.setFont('times', style)
        docPdf.setFontSize(size)
        docPdf.setTextColor(...color)
      }

      const drawFooter = () => {
        const fy = pageH - 14
        docPdf.setDrawColor(180, 180, 180)
        docPdf.setLineWidth(0.3)
        docPdf.line(marginL, fy - 4, pageW - marginR, fy - 4)
        docPdf.setFont('times', 'normal')
        docPdf.setFontSize(7)
        docPdf.setTextColor(120, 120, 120)
        docPdf.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', pageW / 2, fy, { align: 'center' })
        docPdf.text(
          'ul. Kamienna 43, 53-307 Wrocław   \u2022   e-mail: kontakt@samorzad.ue.wroc.pl   \u2022   samorzad.ue.wroc.pl',
          pageW / 2, fy + 4.5, { align: 'center' }
        )
      }

      const drawHeader = (small = false) => {
        let y = 12
        if (logoDataUrl) {
          const logoH = small ? 10 : 14
          const logoW = logoH
          docPdf.addImage(logoDataUrl, 'PNG', marginL, y, logoW, logoH)
          docPdf.setFont('times', 'bold')
          docPdf.setFontSize(small ? 8 : 10)
          docPdf.setTextColor(30, 30, 30)
          docPdf.text('SAMORZĄD STUDENTÓW', marginL + logoW + 3, y + (small ? 4 : 5))
          docPdf.setFont('times', 'normal')
          docPdf.setFontSize(small ? 7 : 8.5)
          docPdf.setTextColor(80, 80, 80)
          docPdf.text('Uniwersytetu Ekonomicznego we Wrocławiu', marginL + logoW + 3, y + (small ? 8.5 : 10.5))
          y += small ? 14 : 20
        } else {
          docPdf.setFont('times', 'bold')
          docPdf.setFontSize(small ? 8 : 10)
          docPdf.setTextColor(30, 30, 30)
          docPdf.text('SAMORZĄD STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU', marginL, y + 5)
          y += small ? 12 : 16
        }
        docPdf.setDrawColor(30, 30, 80)
        docPdf.setLineWidth(0.5)
        docPdf.line(marginL, y, pageW - marginR, y)
        return y + (small ? 6 : 8)
      }

      // ============================
      // STRONA TYTUŁOWA
      // ============================
      let y = drawHeader(false)

      // Data — prawy górny róg
      const dateStr = `Wrocław, ${now.getDate()} ${MONTHS_PL[now.getMonth()]} ${year} r.`
      setTimes('italic', 9, [100, 100, 100])
      docPdf.text(dateStr, pageW - marginR, y, { align: 'right' })
      y += 28

      // Tytuł — duże litery, Times Bold, wyśrodkowany, zawijany
      const titleText = `LISTA DOSTĘPOWA DO PRZESTRZENI PRZEZNACZONEJ POD DZIAŁALNOŚĆ SAMORZĄDU STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU W BUDYNKU B/J (${monthName} ${year})`
      setTimes('bold', 15)
      const titleLines = docPdf.splitTextToSize(titleText, contentW)
      docPdf.text(titleLines, pageW / 2, y, { align: 'center', lineHeightFactor: 1.5 })
      y += titleLines.length * 8.5 + 12

      // Linia pod tytułem
      docPdf.setDrawColor(180, 180, 180)
      docPdf.setLineWidth(0.3)
      docPdf.line(marginL, y, pageW - marginR, y)

      drawFooter()

      // ============================
      // STRONY Z LISTAMI
      // ============================
      docPdf.addPage()
      y = drawHeader(true)

      for (const room of ROOMS_PDF_ORDER) {
        // Czy zmieści się nagłówek + przynajmniej 2 linie?
        if (y > maxY - 20) {
          drawFooter()
          docPdf.addPage()
          y = drawHeader(true)
        }

        // Nagłówek sali
        setTimes('bold', 12)
        docPdf.text(`Lista dostępowa do pomieszczenia ${room}`, marginL, y)
        y += 1.5
        docPdf.setDrawColor(120, 120, 120)
        docPdf.setLineWidth(0.25)
        docPdf.line(marginL, y, pageW - marginR, y)
        y += 6

        // Stałe wpisy
        const permanentEntries = PERMANENT[room] ?? []
        setTimes('normal', 11)
        for (const p of permanentEntries) {
          if (y > maxY) { drawFooter(); docPdf.addPage(); y = drawHeader(true) }
          docPdf.text(`${p.name} (${p.index})`, marginL + 4, y)
          y += 6.5
        }

        // Zatwierdzone zgłoszenia do tej sali
        const roomApproved = approvedSubmissions.filter(s =>
          (s.rooms ?? (s.room ? [s.room] : [])).includes(room)
        )
        for (const s of roomApproved) {
          if (y > maxY) { drawFooter(); docPdf.addPage(); y = drawHeader(true) }
          docPdf.text(`${s.name} (${s.index})`, marginL + 4, y)
          y += 6.5
        }

        y += 8
      }

      drawFooter()

      // Numery stron
      const totalPages = docPdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        docPdf.setPage(i)
        docPdf.setFont('times', 'normal')
        docPdf.setFontSize(8)
        docPdf.setTextColor(160, 160, 160)
        docPdf.text(`${i} / ${totalPages}`, pageW - marginR, pageH - 5, { align: 'right' })
      }

      docPdf.save(`lista-dostepowa-${monthStr}.pdf`)
    } catch (err) {
      console.error('Błąd generowania PDF:', err)
      alert('Błąd podczas generowania PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const approved = submissions.filter(s => s.status === 'approved')
  const pending  = submissions.filter(s => s.status === 'pending')
  const rejected = submissions.filter(s => s.status === 'rejected')

  return (
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
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isExporting ? 'Generowanie...' : 'Eksportuj PDF'}
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
  )
}
