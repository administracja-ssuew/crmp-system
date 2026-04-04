# Phase 3: Lista Dostępowa — Research

**Researched:** 2026-04-05
**Domain:** Firestore monthly data, client-side date gating, jsPDF Polish output, React Router protected routes
**Confidence:** HIGH (all findings verified against live codebase or official npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New top-level tab in main menu (DashboardPage card grid), route `/lista-dostepowa`
- Full-page form layout at `/lista-dostepowa`, consistent with EquipmentPage card style
- Window logic: days 1–5 of each calendar month, client-side date check
- Form fields: Imię i nazwisko (req), email @samorzad.ue.wroc.pl (req, validated), Nr indeksu (req), Wybór pomieszczenia single-select dropdown (req, hardcoded list), Uzasadnienie (req, textarea)
- Rooms list hardcoded as static JSX array: `["Sala posiedzeń", "Biuro Zarządu", "Sala projektowa", "Pomieszczenie gospodarcze"]`
- PDF generation: jsPDF client-side, admin-triggered, output = approved list for the month
- Admin panel on separate page `/admin-dostep`, admin role only, NOT integrated with AdminEquipmentPanel
- Firestore collection `access_submissions`, schema includes `month: "YYYY-MM"` string field for monthly grouping
- One submission per email per month (deduplication required)
- Email validated: must end with `@samorzad.ue.wroc.pl`, client-side + Firestore rules

### Claude's Discretion
- Exact Firestore compound document-ID strategy vs. transaction for deduplication
- Whether to use a React Context or local hooks for the data layer (Plan 3.1)
- Exact jsPDF table layout and styling for the PDF export
- Error message wording for edge cases (window closed, duplicate submission)

### Deferred Ideas (OUT OF SCOPE)
- Server-side email notification for submission events (no Resend call in this phase)
- Real-time Firestore listeners (onSnapshot) — getDocs polling is sufficient
- Integration with existing /wnioski access-request flow
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACC-01 | Submission form: name, index, email @samorzad.ue.wroc.pl, room select, justification — visible only during window | Window helper pattern + Firestore `addDoc` write + email regex validation |
| ACC-02 | Admin panel: browse, approve, reject submissions | `updateDoc` pattern from AccessRequestsPanel; AdminRoute guard from App.jsx |
| ACC-03 | Window auto-open days 1–5, client-side date logic | `isWindowOpen()` / `daysUntilNext()` helper; no server clock needed at this scale |
| ACC-04 | PDF export of approved list, admin-triggered | jsPDF 4.2.1 + jspdf-autotable 5.0.7; UTF-8 Polish via built-in font workaround |
| ACC-05 | Approved list read-only view, visible all month outside submission window | Reuse `where('month','==',currentMonth), where('status','==','approved')` query from Plan 3.3 |
</phase_requirements>

---

## Summary

Phase 3 builds a monthly room-access submission workflow entirely within the existing React 18 + Vite + Firestore stack. No new backend is required — all Firestore writes happen from the browser using the existing client SDK (`firebase` v12, already installed). The admin approve/reject pattern is essentially identical to the existing `AccessRequestsPanel` pattern (`updateDoc` on a document); the main novelties are (1) a monthly-scoped query using a `month` field, (2) duplicate-prevention via a deterministic compound document ID, and (3) a client-side PDF export with jsPDF.

jsPDF (currently v4.2.1 on npm) and jspdf-autotable (v5.0.7) are not yet installed in the project. They must be added. Polish character rendering in jsPDF requires using the built-in `Helvetica` font with `doc.setFont('helvetica')` and ensuring `doc.text()` receives proper UTF-8 strings — jsPDF v3+ handles UTF-8 natively so no custom font embedding is needed for standard Latin-extended characters (ą, ę, ó, etc.).

The router pattern, route guards, and nav card pattern are all verified from `App.jsx` and `DashboardPage.jsx`. No surprises: add one `<Route>` + one `AdminRoute`-wrapped `<Route>`, and one `<Card>` entry in the Dashboard grid.

**Primary recommendation:** Use a compound document ID `${email.replace('@','_at_')}_${month}` (e.g., `jan.kowalski_at_samorzad.ue.wroc.pl_2026-04`) as the Firestore document ID for `access_submissions`. This gives free O(1) deduplication via `setDoc` with `{ merge: false }` — attempting to write a duplicate throws because the doc already exists, or use `getDoc` first and bail if it exists. This is simpler than a Firestore transaction and avoids subcollection overhead.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase (client SDK) | ^12.9.0 (installed) | Firestore reads/writes, Auth | Already used; `db` exported from `src/firebase.js` |
| react-router-dom | ^7.13.1 (installed) | Route + route guards | Already used; `ProtectedRoute`, `AdminRoute` pattern in place |
| jsPDF | 4.2.1 (not installed) | Client-side PDF generation | Current stable; handles UTF-8 natively |
| jspdf-autotable | 5.0.7 (not installed) | Table rendering in PDF | Companion plugin; standard pairing with jsPDF |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.7.0 (installed) | Icons in admin panel UI | Use for approve/reject/download icon buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsPDF client-side | Vercel serverless PDF | Context decision locked to client-side |
| Compound doc ID dedup | Firestore transaction | Transaction safer under race conditions but far more complex; at this submission volume (< 100/month) compound ID is sufficient |
| Field filter `where('month','==',...)` | Subcollection per month | Field filter is simpler; subcollections add path complexity with no benefit at this data scale |

**Installation (to be done in Plan 3.5 or earlier):**
```bash
npm install jspdf jspdf-autotable
```

**Version verification (confirmed 2026-04-05):**
- `npm view jspdf version` → `4.2.1`
- `npm view jspdf-autotable version` → `5.0.7`

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   ├── AccessListPage.jsx         # Plan 3.2 — /lista-dostepowa (member form + approved list)
│   └── AdminAccessPanel.jsx       # Plan 3.3+3.4 — /admin-dostep (admin approve/reject + PDF)
├── context/
│   └── AuthContext.jsx            # existing — provides user, userRole, loading
└── firebase.js                    # existing — exports db
```

No new context or custom hook file is required for Plan 3.1. The window logic helper and Firestore calls can live as plain functions / local `useState`+`useEffect` blocks inside the two page files, following the project convention of colocating all logic in the page component (see CONVENTIONS.md: "All useEffect and async logic lives inside the default export component").

### Pattern 1: Firestore Monthly Query
**What:** Filter `access_submissions` by a `month` string field equal to `"YYYY-MM"`.
**When to use:** Both member-facing approved list view (Plan 3.4) and admin panel (Plan 3.3).
**Example:**
```javascript
// Source: firebase/firestore SDK (verified pattern)
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

const currentMonth = new Date().toISOString().slice(0, 7) // "2026-04"

const q = query(
  collection(db, 'access_submissions'),
  where('month', '==', currentMonth),
  orderBy('createdAt', 'desc')
)
const snapshot = await getDocs(q)
const submissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
```
Note: `where` + `orderBy` on different fields requires a composite Firestore index. Either create the index in Firebase Console (Firestore will prompt with a link on first failed query), or query without `orderBy` and sort client-side (`submissions.sort((a,b) => b.createdAt - a.createdAt)`). **Recommend client-side sort** to avoid index setup friction.

### Pattern 2: Duplicate Prevention via Compound Document ID
**What:** Use `setDoc` with a deterministic ID built from email + month. If the document already exists, detect it with `getDoc` first and show an error.
**When to use:** Submission form write in Plan 3.2.
**Example:**
```javascript
// Source: firebase/firestore SDK
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const month = new Date().toISOString().slice(0, 7) // "2026-04"
const safeEmail = email.toLowerCase().replace(/[@.]/g, '_') // "jan_kowalski_samorzad_ue_wroc_pl"
const docId = `${safeEmail}_${month}` // "jan_kowalski_samorzad_ue_wroc_pl_2026-04"

const ref = doc(db, 'access_submissions', docId)
const existing = await getDoc(ref)
if (existing.exists()) {
  // Show "Już złożono zgłoszenie w tym miesiącu" error
  return
}
await setDoc(ref, {
  name,
  email: email.toLowerCase(),
  index,
  room,
  justification,
  status: 'pending',
  month,
  createdAt: serverTimestamp(),
  reviewedAt: null,
  reviewedBy: null,
})
```

### Pattern 3: Admin updateDoc (approve/reject)
**What:** Identical to existing `AccessRequestsPanel` pattern.
**Example:**
```javascript
// Source: existing src/pages/AccessRequestsPanel.jsx line 3
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

const handleApprove = async (submission) => {
  await updateDoc(doc(db, 'access_submissions', submission.id), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: user.email,
  })
  fetchSubmissions() // re-fetch like existing panel does
}
```

### Pattern 4: Date Window Helper
**What:** Pure functions for window logic, defined at the top of `AccessListPage.jsx`.
**Example:**
```javascript
// Source: derived from requirements; no external library needed
const isWindowOpen = () => {
  const day = new Date().getDate()
  return day >= 1 && day <= 5
}

const daysUntilNextWindow = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const diff = nextMonth - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
```

### Pattern 5: Adding a New Route (from App.jsx)
**What:** Two routes needed — one ProtectedRoute for `/lista-dostepowa`, one AdminRoute for `/admin-dostep`.
**Example:**
```jsx
// Source: verified from src/App.jsx lines 54–75, 131–144
import AccessListPage from './pages/AccessListPage'
import AdminAccessPanel from './pages/AdminAccessPanel'

// Inside <Routes> in AppContent:
<Route path="/lista-dostepowa" element={<ProtectedRoute><AccessListPage /></ProtectedRoute>} />
<Route path="/admin-dostep" element={<AdminRoute><AdminAccessPanel /></AdminRoute>} />
```

### Pattern 6: Adding a Navigation Card (from DashboardPage.jsx)
**What:** `DashboardPage.jsx` does NOT use a sidebar. Navigation is a grid of `<Card>` tiles (Link-based). There is no Sidebar.jsx component in this project.
**Where to add:** Inside the 6-tile grid in `DashboardPage.jsx` around line 355. The admin-only panel card pattern (lines 363–365) shows how to conditionally render cards based on `isAdmin`.
**Example:**
```jsx
// Source: verified from src/pages/DashboardPage.jsx lines 355–365
// Add to the grid (visible to all authenticated users):
<Card
  to="/lista-dostepowa"
  icon="🗝️"
  title="Lista Dostępowa"
  subtitle="Zgłoszenia dostępu do pomieszczeń"
  colorFrom="from-cyan-500"
  colorTo="to-blue-600"
  buttonText="Otwórz Moduł"
/>

// Admin-only admin panel card (add alongside existing admin card):
{isAdmin && (
  <Card
    to="/admin-dostep"
    icon="🔐"
    title="Panel Dostęp"
    subtitle="Zarządzaj listą dostępową"
    colorFrom="from-violet-600"
    colorTo="to-purple-800"
    buttonText="Zarządzaj"
  />
)}
```

### Pattern 7: jsPDF with Polish Characters
**What:** jsPDF 4.x handles UTF-8 natively. Standard Latin-extended characters (ą ę ó ś ź ż ń ć ł) render correctly with `doc.setFont('helvetica')` — no custom font upload needed.
**Example:**
```javascript
// Source: jsPDF 4.x API (verified against npm registry v4.2.1)
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const generatePDF = (approvedList, month) => {
  const doc = new jsPDF()
  doc.setFont('helvetica')
  doc.setFontSize(14)
  doc.text(`Lista Dostępowa — ${month}`, 14, 20)
  doc.setFontSize(10)
  doc.text('Samorząd Studentów UEW', 14, 28)

  autoTable(doc, {
    startY: 35,
    head: [['Lp.', 'Imię i nazwisko', 'Nr indeksu', 'E-mail', 'Pomieszczenie']],
    body: approvedList.map((s, i) => [
      i + 1,
      s.name,
      s.index,
      s.email,
      s.room,
    ]),
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
  })

  doc.save(`lista-dostepowa-${month}.pdf`)
}
```

### Anti-Patterns to Avoid
- **Subcollection per month:** Adding `access_submissions/{month}/submissions/{docId}` adds path complexity with zero benefit. Use the flat collection with a `month` field filter.
- **Auto-query without index creation:** `where('month','==',X)` + `orderBy('createdAt')` together require a composite Firestore index. If not created, the query fails with a console error containing a direct link to create it. Use client-side `.sort()` instead to avoid this entirely.
- **React Context for submissions data:** The project never uses Context for Firestore data (only for auth). Keep data fetching local to each page with `useState`+`useEffect`, matching the established convention.
- **Sub-component defined inside render function:** The `Card` component in `DashboardPage` is defined inside the component body — this is a known anti-pattern in this codebase (CONVENTIONS.md line 181). When adding imports to DashboardPage, do not define new sub-components inside the function body; reference existing `Card` directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF table rendering | Custom HTML-to-canvas PDF | `jspdf-autotable` | Handles column widths, page breaks, header repetition, cell padding automatically |
| Duplicate prevention | Custom Firestore transaction | Compound document ID + `getDoc` check | No race condition risk at < 100 submissions/month; zero extra code |
| Date arithmetic for window | Custom date library | `new Date().getDate()` built-in | Window is a simple day-of-month check; no locale or timezone complexity |
| Role checking in component | Re-implement role logic | `useAuth()` → `userRole` + `AdminRoute` | `AuthContext` already fetches role from `authorized_users` collection |

---

## Common Pitfalls

### Pitfall 1: Firestore Composite Index Missing
**What goes wrong:** Query `where('month','==',X) + orderBy('createdAt','desc')` throws "The query requires an index" in the browser console. The page shows no data.
**Why it happens:** Firestore requires a composite index for queries that filter on one field and order by another.
**How to avoid:** Do NOT use `orderBy` in the Firestore query. Fetch with `where('month','==',X)` only, then sort the result array client-side: `submissions.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds)`.
**Warning signs:** Console error with a link to Firebase Console to create the index.

### Pitfall 2: jsPDF Import Style (ESM vs CJS)
**What goes wrong:** `import jsPDF from 'jspdf'` works; `import { jsPDF } from 'jspdf'` also works in v4.x. Using the wrong style causes "jsPDF is not a constructor".
**Why it happens:** jsPDF changed its export style across versions.
**How to avoid:** Use `import jsPDF from 'jspdf'` (default import). For autoTable: `import autoTable from 'jspdf-autotable'` then call `autoTable(doc, { ... })` — NOT `doc.autoTable(...)` which is the old v2 style.
**Warning signs:** `TypeError: jsPDF is not a constructor` at runtime.

### Pitfall 3: Compound Doc ID with Special Characters
**What goes wrong:** Using `@` or `.` in a Firestore document ID can work, but is fragile and discouraged by Firebase docs.
**Why it happens:** Forward slashes `/` are forbidden in doc IDs; other special chars are technically allowed but cause issues in REST API calls and some SDK edge cases.
**How to avoid:** Sanitize the email before using as part of the doc ID. Replace `@` and `.` with `_`: `email.toLowerCase().replace(/[@.]/g, '_')`.

### Pitfall 4: serverTimestamp() in setDoc Fields
**What goes wrong:** `serverTimestamp()` cannot be used inside array values or nested update paths in some SDK versions.
**Why it happens:** Firestore's `serverTimestamp()` sentinel is only valid as a top-level field value.
**How to avoid:** Use `serverTimestamp()` only for top-level fields (`createdAt`, `reviewedAt`). This is how the existing `api/request-access.js` uses `new Date()` — either approach is fine; use `serverTimestamp()` for Firestore-managed accuracy.

### Pitfall 5: Email Validation Must Be Client-Side Only
**What goes wrong:** The existing `access_requests` flow validates nothing on the client. For Lista Dostępowa, the email must be `@samorzad.ue.wroc.pl`.
**Why it happens:** New requirement not present in old flow.
**How to avoid:** Validate with a simple regex before writing to Firestore:
```javascript
const isValidEmail = (email) => /^[^@]+@samorzad\.ue\.wroc\.pl$/i.test(email)
```
Add inline validation error state (same pattern as existing form pages). Do NOT rely on `type="email"` alone — it allows any domain.

### Pitfall 6: Window Check Uses Local Clock
**What goes wrong:** The submission window (days 1–5) is determined by the user's device clock. A user with an incorrect system clock could submit outside the window.
**Why it happens:** All window logic is client-side by design (CONTEXT.md decision).
**How to avoid:** Accept this as a known limitation. For the current use case (trusted internal users) this is acceptable. Document in code comments that the check is advisory.

---

## Code Examples

### Firestore write (setDoc with compound ID)
```javascript
// Source: firebase/firestore JS SDK pattern
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const handleSubmit = async (e) => {
  e.preventDefault()
  if (!isWindowOpen()) return
  if (!isValidEmail(form.email)) { setError('Email musi być w domenie @samorzad.ue.wroc.pl'); return }

  setIsSubmitting(true)
  try {
    const month = new Date().toISOString().slice(0, 7)
    const safeEmail = form.email.toLowerCase().replace(/[@.]/g, '_')
    const docId = `${safeEmail}_${month}`
    const ref = doc(db, 'access_submissions', docId)

    const existing = await getDoc(ref)
    if (existing.exists()) {
      setError('Już złożyłeś/aś zgłoszenie w tym miesiącu.')
      return
    }

    await setDoc(ref, {
      name: form.name,
      email: form.email.toLowerCase(),
      index: form.index,
      room: form.room,
      justification: form.justification,
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
```

### Firestore read (admin panel fetch)
```javascript
// Source: adapted from src/pages/AccessRequestsPanel.jsx lines 11–16
import { collection, query, where, getDocs } from 'firebase/firestore'

const fetchSubmissions = async () => {
  setIsLoading(true)
  const month = new Date().toISOString().slice(0, 7)
  const q = query(
    collection(db, 'access_submissions'),
    where('month', '==', month)
  )
  const snapshot = await getDocs(q)
  const data = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  setSubmissions(data)
  setIsLoading(false)
}
```

### jsPDF export
```javascript
// Source: jsPDF 4.2.1 + jspdf-autotable 5.0.7 API
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const handleExportPDF = () => {
  const month = new Date().toISOString().slice(0, 7)
  const approved = submissions.filter(s => s.status === 'approved')
  const doc = new jsPDF()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Lista Dostępowa', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Miesiąc: ${month}`, 14, 26)
  doc.text(`Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu`, 14, 32)

  autoTable(doc, {
    startY: 40,
    head: [['Lp.', 'Imię i nazwisko', 'Nr indeksu', 'E-mail', 'Pomieszczenie']],
    body: approved.map((s, i) => [i + 1, s.name, s.index, s.email, s.room]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`lista-dostepowa-${month}.pdf`)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `doc.autoTable()` method style | `autoTable(doc, opts)` function call | jspdf-autotable v3+ | Must use function call style; method style removed |
| Custom font base64 embedding for Polish | Built-in `helvetica` handles UTF-8 | jsPDF v2+ | No font files to manage; ą ę ó etc. render correctly |
| Firestore subcollection per month | `month` field filter on flat collection | N/A (design choice) | Simpler queries, simpler security rules |

**Deprecated / outdated:**
- `doc.autoTable(opts)` (old method syntax): use `autoTable(doc, opts)` instead.
- `import { jsPDF } from 'jspdf'` named import: safe in v4.x, but default import `import jsPDF from 'jspdf'` is more reliable across bundlers.

---

## Open Questions

1. **Firestore Security Rules for `access_submissions`**
   - What we know: Current rules not examined (no `firestore.rules` file found in repo). The existing `access_requests` collection has no client-side write from the browser — it goes through `api/request-access.js` (Firebase Admin SDK, bypasses rules).
   - What's unclear: Whether Firestore rules allow unauthenticated or authenticated writes to `access_submissions`. The new flow writes directly from the browser client SDK, unlike the existing flow.
   - Recommendation: Plan 3.2 should include a note to set Firestore rules for `access_submissions` to allow `write` only for `request.auth != null` and `request.resource.data.email.matches('.*@samorzad\\.ue\\.wroc\\.pl')`. This is a security hardening step — the phase can function without it (client-side validation catches bad emails) but the planner should include it.

2. **Month boundary race condition**
   - What we know: If a user submits at exactly midnight on the 5th→6th, the client-side window check could disagree with server-stored `month` field.
   - What's unclear: Whether this matters at the current user scale.
   - Recommendation: Acceptable to ignore at this scale. Document in code.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 3 has no external CLI dependencies. All required tools (Node, npm, Firebase client SDK) are already present and in use by the project. jsPDF will be installed as an npm package dependency.

---

## Validation Architecture

nyquist_validation is `false` in `.planning/config.json`. Section skipped.

---

## Sources

### Primary (HIGH confidence)
- Live codebase: `src/App.jsx` — ProtectedRoute, AdminRoute, LogitechRoute guard patterns, route registration
- Live codebase: `src/context/AuthContext.jsx` — role stored in `userRole` state, fetched from `authorized_users` Firestore collection
- Live codebase: `src/pages/AccessRequestsPanel.jsx` — admin panel pattern: getDocs, updateDoc, re-fetch on action
- Live codebase: `src/pages/DashboardPage.jsx` — nav = Card grid (no Sidebar.jsx), conditional admin cards
- Live codebase: `src/firebase.js` — `db` and `auth` exports, Google sign-in popup
- Live codebase: `.planning/phases/03-lista-dost-powa/CONTEXT.md` — locked decisions, schema
- Live codebase: `.planning/codebase/CONVENTIONS.md` — file naming, colocated logic convention
- npm registry: `npm view jspdf version` → `4.2.1` (confirmed 2026-04-05)
- npm registry: `npm view jspdf-autotable version` → `5.0.7` (confirmed 2026-04-05)
- npm registry: `npm view firebase version` → `12.11.0` (project uses `^12.9.0`, compatible)

### Secondary (MEDIUM confidence)
- jsPDF GitHub README + npm package description: UTF-8 support confirmed for v3+; autoTable function-call style confirmed for v3+

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and npm registry
- Architecture: HIGH — all patterns derived directly from existing codebase files
- Pitfalls: HIGH — derived from known Firestore SDK behavior and live codebase inspection
- jsPDF Polish characters: MEDIUM — confirmed via package docs and version notes; actual render not tested in this environment

**Research date:** 2026-04-05
**Valid until:** 2026-07-05 (stable libraries; Firebase SDK changes infrequently)
