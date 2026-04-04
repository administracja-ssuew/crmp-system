---
plan: 3.4
title: Approved list view
phase: 3
status: complete
depends_on: [3.3]
wave: 3
requirements: [ACC-05]
autonomous: true
files_modified:
  - src/pages/AccessListPage.jsx
---

# Plan 3.4: Approved list view

## Goal

Add a read-only approved list section to `src/pages/AccessListPage.jsx` that is visible to all authenticated users when the submission window is closed, showing the approved submissions for the current month fetched from Firestore.

## Context

- `src/pages/AccessListPage.jsx` was last fully written by Plan 3.2. It currently renders a "window closed" section that contains the comment `{/* Plan 3.4: approved list for current month goes here */}`. This plan replaces that comment with the actual approved list component.
- Plan 3.3 established the Firestore query pattern: `collection(db, 'access_submissions')` + `where('month', '==', month)`, client-side sort by `createdAt.seconds`. This plan reuses the same pattern but additionally filters `where('status', '==', 'approved')`. Two separate `where` clauses on two different fields require a Firestore composite index. To avoid this, fetch all submissions for the month and filter client-side: `.filter(s => s.status === 'approved')`.
- The approved list is read-only — no approve/reject buttons, no admin actions.
- This section should appear ONLY in the "window closed" state branch of the component (when `isWindowOpen()` returns false). When the window is open, the form is shown; after submission, the success card is shown. There is no requirement to show the approved list during the open window.
- The `db` import and the `currentMonth` / `isWindowOpen` helpers are already in the file. Do not duplicate them.

## Tasks

- [ ] **Task 1 — Add approved list state and fetch to `AccessListPage`**

  Edit `src/pages/AccessListPage.jsx`. The changes are additive — do not touch the form/success/window-open branches.

  1. Add two new state variables after the existing state declarations (after line declaring `submitted`):
     ```jsx
     const [approvedList, setApprovedList] = useState([])
     const [isLoadingApproved, setIsLoadingApproved] = useState(false)
     ```

  2. Add a `useEffect` import if not already present (it should be — it is in the file from Plan 3.2). Also add the Firestore query imports: `collection`, `query`, `where`, `getDocs` (add to the existing `firebase/firestore` import line if not already listed).

  3. Add a `fetchApproved` function and a `useEffect` that calls it when `windowOpen` is false. Place this after the `handleSubmit` function and before the `return` statement:
     ```jsx
     const fetchApproved = async () => {
       setIsLoadingApproved(true)
       try {
         const { collection, query, where, getDocs } = await import('firebase/firestore')
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
     ```

     Note on dynamic import: since `collection`, `query`, `where`, `getDocs` may already be statically imported at the top of the file from Plan 3.2 (they were not needed there but may have been added). If they are already top-level imports, remove the `await import(...)` destructuring and use the static imports directly. Prefer static imports if already present.

- [ ] **Task 2 — Render the approved list in the window-closed branch**

  In the JSX, find the window-closed section's `{/* Plan 3.4: approved list for current month goes here */}` comment and replace it with:

  ```jsx
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
  ```

## Verification

1. On a day 6+ of the month (or temporarily set `isWindowOpen()` to return `false`): navigate to `/lista-dostepowa` — the "Okno zgłoszeń zamknięte" banner is shown AND below it the approved list section renders.
2. With no approved submissions for the current month: the section shows "Brak zatwierdzonych zgłoszeń w tym miesiącu."
3. After approving a submission via the admin panel (Plan 3.3): refresh `/lista-dostepowa` — the approved person appears in the list table with their name, index number, and room.
4. The table is sorted alphabetically by name (`localeCompare` with `'pl'` locale).
5. No console errors. The `orderBy` Firestore clause is NOT used.
6. Email addresses are NOT shown in this read-only view (only name, index, room — no privacy leak).
