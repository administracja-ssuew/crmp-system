---
plan: 3.5
title: PDF generation
phase: 3
status: complete
depends_on: [3.3]
wave: 4
requirements: [ACC-04]
autonomous: true
files_modified:
  - src/pages/AdminAccessPanel.jsx
user_setup:
  - task: Install jsPDF packages
    command: "npm install jspdf jspdf-autotable"
    why: "jsPDF and jspdf-autotable are not yet in package.json; must be installed before this plan runs"
---

# Plan 3.5: PDF generation

## Goal

Add a client-side PDF export button to `src/pages/AdminAccessPanel.jsx` that generates a formatted downloadable PDF of all approved submissions for the current month using jsPDF and jspdf-autotable.

## Context

- **Install packages first:** `npm install jspdf jspdf-autotable`. As of 2026-04-05, `jspdf@4.2.1` and `jspdf-autotable@5.0.7` are the current stable versions. Verify with `npm view jspdf version` before installing.
- Import style (critical — wrong style causes runtime error):
  - `import jsPDF from 'jspdf'` (default import, NOT named `{ jsPDF }`)
  - `import autoTable from 'jspdf-autotable'` (default import)
  - Call: `autoTable(doc, { ... })` — NOT `doc.autoTable(...)` (old v2 style, removed in v3+)
- Polish characters (ą ę ó ś ź ż ń ć ł) render correctly with `doc.setFont('helvetica')` in jsPDF v3+. No custom font embedding needed.
- Plan 3.3 left a `{/* Plan 3.5: PDF export button goes here */}` comment in the header section of `AdminAccessPanel.jsx`. The PDF button is inserted at that exact comment location.
- The PDF contains only approved submissions. Filter `submissions.filter(s => s.status === 'approved')` client-side — the data is already in state.
- The PDF is triggered by the admin; there is no automatic trigger.

## Tasks

- [ ] **Task 1 — Install jsPDF packages**

  Run in the project root:
  ```bash
  npm install jspdf jspdf-autotable
  ```

  After installation, verify `package.json` lists both `jspdf` and `jspdf-autotable` under `dependencies`.

- [ ] **Task 2 — Add PDF export to `AdminAccessPanel.jsx`**

  Edit `src/pages/AdminAccessPanel.jsx`. All changes are additive except replacing the placeholder comment.

  1. Add imports at the top of the file, after the existing imports:
     ```jsx
     import jsPDF from 'jspdf'
     import autoTable from 'jspdf-autotable'
     ```

  2. Add the `handleExportPDF` function inside the `AdminAccessPanel` component, after the `handleStatusChange` function and before the `return` statement:
     ```jsx
     const handleExportPDF = () => {
       const month = currentMonth()
       const approvedSubmissions = submissions.filter(s => s.status === 'approved')

       if (approvedSubmissions.length === 0) {
         alert('Brak zatwierdzonych zgłoszeń do eksportu.')
         return
       }

       const doc = new jsPDF()

       doc.setFont('helvetica', 'bold')
       doc.setFontSize(16)
       doc.text('Lista Dostępowa', 14, 18)

       doc.setFont('helvetica', 'normal')
       doc.setFontSize(10)
       doc.text(`Miesiąc: ${month}`, 14, 27)
       doc.text('Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu', 14, 33)

       autoTable(doc, {
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

       doc.save(`lista-dostepowa-${month}.pdf`)
     }
     ```

  3. Find the `{/* Plan 3.5: PDF export button goes here */}` comment in the JSX header section (inside the `flex` row next to the "Odśwież" button) and replace it with:
     ```jsx
     <button
       onClick={handleExportPDF}
       disabled={isLoading || submissions.filter(s => s.status === 'approved').length === 0}
       className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
     >
       Eksportuj PDF
     </button>
     ```

     The button is disabled when there are no approved submissions (no empty PDF exports).

## Verification

1. Run `npm install jspdf jspdf-autotable` — exits without error. `package.json` contains both packages.
2. `npm run dev` — dev server starts without bundler errors related to jsPDF.
3. Log in as admin and navigate to `/admin-dostep`. "Eksportuj PDF" button is visible.
4. With no approved submissions: button is disabled (greyed out).
5. After approving at least one submission: button becomes active. Click it — browser downloads `lista-dostepowa-YYYY-MM.pdf`.
6. Open the downloaded PDF:
   - Title "Lista Dostępowa" is present.
   - Month string matches current month (e.g., "Miesiąc: 2026-04").
   - "Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu" is present.
   - Table has columns: Lp., Imię i nazwisko, Nr indeksu, E-mail, Pomieszczenie.
   - Only approved submissions appear (no pending or rejected rows).
   - Polish characters (ą ę ó ś ź ż ń ć ł) render correctly.
   - Header row has indigo/violet background.
7. No console errors during PDF generation (`TypeError: jsPDF is not a constructor` would indicate wrong import style — should be `import jsPDF from 'jspdf'`).
