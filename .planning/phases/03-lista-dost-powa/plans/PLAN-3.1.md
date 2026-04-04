---
plan: 3.1
title: Data layer & window logic
phase: 3
status: complete
depends_on: []
wave: 1
requirements: [ACC-01, ACC-03]
autonomous: true
files_modified:
  - src/App.jsx
  - src/pages/DashboardPage.jsx
---

# Plan 3.1: Data layer & window logic

## Goal

Wire routing, navigation cards, and shared Firestore + date-window utilities so that Plans 3.2 and 3.3 can build against stable interfaces without re-reading App.jsx or DashboardPage.jsx.

## Context

- `src/App.jsx` already has `ProtectedRoute` (line 54) and `AdminRoute` (line 61). No new route-guard logic is needed — just two new `<Route>` entries and two imports.
- `src/pages/DashboardPage.jsx` uses a `Card` component defined at line 150. The nav tile grid starts at line 355. An admin-only conditional card exists at line 363.
- There is no `src/pages/AccessListPage.jsx` or `src/pages/AdminAccessPanel.jsx` yet — those are created in Plans 3.2 and 3.3. This plan wires **placeholder** imports so routes resolve without errors during development, then Plans 3.2/3.3 replace the placeholder files with real components.
- Firestore collection `access_submissions` is new; no schema migration required (Firestore is schemaless).

## Tasks

- [ ] **Task 1 — Add routes to `src/App.jsx`**

  1. Add two imports near the existing page imports (after line 25):
     ```jsx
     import AccessListPage from './pages/AccessListPage'
     import AdminAccessPanel from './pages/AdminAccessPanel'
     ```
  2. Inside `<Routes>` in `AppContent` (after the `/kompendium` route, line 144), add:
     ```jsx
     <Route path="/lista-dostepowa" element={<ProtectedRoute><AccessListPage /></ProtectedRoute>} />
     <Route path="/admin-dostep" element={<AdminRoute><AdminAccessPanel /></AdminRoute>} />
     ```
  3. Create `src/pages/AccessListPage.jsx` as a minimal placeholder so the import resolves:
     ```jsx
     export default function AccessListPage() {
       return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">AccessListPage — placeholder</div>;
     }
     ```
  4. Create `src/pages/AdminAccessPanel.jsx` as a minimal placeholder:
     ```jsx
     export default function AdminAccessPanel() {
       return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">AdminAccessPanel — placeholder</div>;
     }
     ```
  5. Verify dev server builds without errors after saving.

- [ ] **Task 2 — Add nav cards to `src/pages/DashboardPage.jsx`**

  The tile grid is at line 355. The existing admin conditional block is at line 363–365.

  1. After the last unconditional `<Card>` entry (the Kompendium card, line 362) and before the `{isAdmin && ...}` block (line 363), insert a new unconditional card:
     ```jsx
     <Card to="/lista-dostepowa" icon="🗝️" title="Lista Dostępowa" subtitle="Zgłoszenia dostępu do pomieszczeń" colorFrom="from-cyan-500" colorTo="to-blue-600" buttonText="Otwórz Moduł" />
     ```
  2. Inside the existing `{isAdmin && ( <Card ... /> )}` block (lines 363–365), add a second admin card **after** the existing one. Replace the block so it renders both admin cards:
     ```jsx
     {isAdmin && (
       <>
         <Card to="/wnioski" icon="📥" title="Panel Wniosków" subtitle="Zarządzaj dostępem do CRA" colorFrom="from-rose-500" colorTo="to-pink-700" buttonText="Rozpatrz Wnioski" />
         <Card to="/admin-dostep" icon="🔐" title="Panel Dostęp" subtitle="Zarządzaj listą dostępową" colorFrom="from-violet-600" colorTo="to-purple-800" buttonText="Zarządzaj" />
       </>
     )}
     ```
     Note: the original block wraps only one `<Card>` — the replacement adds a React Fragment (`<>...</>`) so both cards are conditionally rendered.

- [ ] **Task 3 — Document shared utility patterns in code comments**

  Open `src/pages/AccessListPage.jsx` (the placeholder created in Task 1). Replace its contents with a fuller placeholder that includes the shared helper functions Plans 3.2 will use verbatim. This avoids duplication and gives Plan 3.2 a ready-to-use file:

  ```jsx
  // AccessListPage.jsx — Plan 3.2 will implement this fully
  // Shared helpers defined here; Plan 3.2 builds the full component.

  import { useState, useEffect } from 'react'
  import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
  import { db } from '../firebase'
  import { useAuth } from '../context/AuthContext'

  // --- Window helpers (ACC-03) ---
  // NOTE: uses client device clock; advisory check only
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
  export const currentMonth = () => new Date().toISOString().slice(0, 7) // "YYYY-MM"

  // --- Compound doc ID (deduplication, ACC-01) ---
  // safeEmail = email.toLowerCase().replace(/[@.]/g, '_')
  // docId     = `${safeEmail}_${month}`

  export default function AccessListPage() {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">AccessListPage — Plan 3.2 pending</div>
  }
  ```

## Verification

- Open browser (or run `npm run dev`) and navigate to `/lista-dostepowa` — placeholder renders without JS errors.
- Navigate to `/admin-dostep` as an admin user — placeholder renders without JS errors.
- Navigate to `/admin-dostep` as a non-admin user — redirects to `/`.
- Dashboard grid shows the "Lista Dostępowa" card for all authenticated users.
- Dashboard grid shows the "Panel Dostęp" card only when `isAdmin` is true.
- `src/pages/AccessListPage.jsx` exports `isWindowOpen`, `daysUntilNextWindow`, `isValidEmail`, `ROOMS`, `currentMonth` as named exports.
