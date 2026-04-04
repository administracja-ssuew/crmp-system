# Architecture

**Analysis Date:** 2026-04-04

## Pattern Overview

**Overall:** Single-Page Application (SPA) with a flat page-based frontend and thin serverless backend

**Key Characteristics:**
- All UI logic lives in large, self-contained page components in `src/pages/`
- No shared component library or reusable UI layer; icons and helpers are defined inline per-file
- External data comes from three separate backends: Firebase Firestore, Supabase, and Google Apps Script REST APIs
- Authorization is enforced client-side via role-based route guards; server-side enforcement exists only in `api/` Vercel functions
- The `api/` directory contains Vercel serverless functions that act as a thin proxy layer for privileged operations (email sending, Firebase Admin writes)

## Layers

**Entry / Bootstrap Layer:**
- Purpose: Mount the React app, wrap with global auth context
- Location: `src/main.jsx`
- Contains: ReactDOM render, `AuthProvider` wrapper
- Depends on: `src/context/AuthContext.jsx`
- Used by: Nothing (top of tree)

**Routing / Shell Layer:**
- Purpose: Client-side routing, global persistent UI (back button, user profile chip, AI bot), loading splash
- Location: `src/App.jsx`
- Contains: `BrowserRouter`, all `<Route>` declarations, `ProtectedRoute`, `AdminRoute`, `LogitechRoute` guards, `BackButton`, `UserProfile`, `AIBot` overlay
- Depends on: All page components, `AuthContext`, `firebase.js`
- Used by: `main.jsx`

**Auth Context Layer:**
- Purpose: Firebase auth state subscription, Firestore role lookup, global user/role/loading state
- Location: `src/context/AuthContext.jsx`
- Contains: `AuthProvider` component, `useAuth` hook
- Depends on: `src/firebase.js`
- Used by: `App.jsx`, every page component that needs user identity or role

**Page / Feature Layer:**
- Purpose: All business logic, UI rendering, and data fetching for each module
- Location: `src/pages/`
- Contains: 17 full-page React components; each page owns its state, fetch calls, and local UI components (modals, tabs, forms)
- Depends on: `AuthContext`, `firebase.js`, `supabaseClient.js`, per-page hardcoded API URLs
- Used by: `App.jsx` routing

**AI Assistant Layer:**
- Purpose: Floating Gemini-powered chatbot available on all authenticated pages
- Location: `src/AIBot.jsx`, `src/knowledge.js`
- Contains: Chat UI, Gemini API fetch wrapper, `KNOWLEDGE_BASE` system prompt loaded from `knowledge.js`
- Depends on: `VITE_GEMINI_API_KEY` env var
- Used by: `App.jsx` (rendered globally inside `AppContent`)

**Serverless API Layer:**
- Purpose: Privileged operations requiring Firebase Admin SDK and email delivery via Resend
- Location: `api/`
- Contains: Three Vercel serverless handler functions (`request-access.js`, `approve-request.js`, `reject-request.js`)
- Depends on: `firebase-admin`, `resend`, environment variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `RESEND_API_KEY`
- Used by: `src/pages/AccessRequestPage.jsx`, `src/pages/AccessRequestsPanel.jsx` (via fetch `/api/*`)

**Client SDK Configuration:**
- Purpose: Initialize and export Firebase and Supabase clients
- Location: `src/firebase.js`, `src/supabaseClient.js`
- Contains: Firebase app init (`auth`, `db`, `loginWithGoogle`, `logout`), Supabase client singleton
- Depends on: `VITE_FIREBASE_*` env vars; Supabase URL/key hardcoded in `supabaseClient.js`
- Used by: `AuthContext`, page components directly

## Data Flow

**Authentication Flow:**

1. User visits any route; `AuthProvider` in `main.jsx` subscribes to `onAuthStateChanged` (Firebase)
2. On sign-in, `AuthContext` queries `authorized_users` Firestore collection to fetch `role`
3. If email is not in `authorized_users`, Firebase session is signed out immediately and `authError` is set
4. `user`, `userRole`, `loading`, `authError` are exposed globally via `useAuth()`
5. Route guards (`ProtectedRoute`, `AdminRoute`, `LogitechRoute`) in `App.jsx` consume these values and redirect unauthorized users

**Google Apps Script Data Flow (most pages):**

1. Page component mounts, calls `fetch(HARDCODED_GOOGLE_SCRIPT_URL)` via `useEffect`
2. Response JSON is stored in local `useState`
3. POST mutations (add/update records) also call the same or a sibling Apps Script URL
4. No caching or retry logic; each mount triggers a fresh fetch

**Supabase Data Flow (VerificationPage only):**

1. `src/pages/VerificationPage.jsx` imports `supabase` from `src/supabaseClient.js`
2. Queries `blacklist_violations` and room session tables directly via Supabase JS SDK
3. Image uploads use Supabase Storage via `imageCompression` + `supabase.storage.from(...).upload(...)`

**Access Request Flow:**

1. Unauthenticated user submits form on `/wniosek` → `AccessRequestPage` POSTs to `/api/request-access`
2. Vercel serverless function writes pending request to Firestore `access_requests` collection and sends email via Resend
3. Admin sees pending requests at `/wnioski` (Firestore read in `AccessRequestsPanel`)
4. Admin approves → `AccessRequestsPanel` POSTs to `/api/approve-request` → serverless function adds email to `authorized_users` with role `member`

**AI Bot Flow:**

1. `AIBot.jsx` renders as a fixed overlay on all authenticated pages
2. User message is appended to conversation history and sent to Gemini 2.5 Flash API (`generativelanguage.googleapis.com`) with `KNOWLEDGE_BASE` as `systemInstruction`
3. Response is appended to local message state; no server-side proxy or session persistence

## Key Abstractions

**Route Guards:**
- Purpose: Client-side role enforcement for navigation
- Examples: `ProtectedRoute`, `AdminRoute`, `LogitechRoute` in `src/App.jsx`
- Pattern: Render-prop wrappers that check `useAuth()` and return `<Navigate>` or `children`

**AuthContext:**
- Purpose: Single source of truth for identity and role
- Examples: `src/context/AuthContext.jsx`
- Pattern: React Context with Provider + `useAuth()` custom hook; gates rendering of children until loading resolves

**Per-Page API URLs:**
- Purpose: Each page contacts its own dedicated Google Apps Script deployment
- Examples: `DATA_URL` in `src/pages/StandsPage.jsx`, `GOOGLE_SHEETS_URL` in `src/pages/CalendarSamorzadPage.jsx`, `API_URL` in `src/pages/EquipmentPage.jsx`
- Pattern: Module-level `const` hardcoded URL at top of each page file

**Knowledge Base:**
- Purpose: Static domain knowledge injected as Gemini system instruction
- Examples: `src/knowledge.js` (50 KB static JS file)
- Pattern: Single exported `KNOWLEDGE_BASE` string constant imported by `AIBot.jsx`

## Entry Points

**Application Entry:**
- Location: `src/main.jsx`
- Triggers: Vite dev server or production bundle load
- Responsibilities: Mount `<AuthProvider>` + `<App>` into `#root`

**SPA Root:**
- Location: `index.html`
- Triggers: Browser request to any URL (Vercel rewrites all non-`/api/*` to `/`)
- Responsibilities: Load Vite bundle, provide `<div id="root">`

**Serverless API Entry:**
- Location: `api/request-access.js`, `api/approve-request.js`, `api/reject-request.js`
- Triggers: POST requests to `/api/request-access`, `/api/approve-request`, `/api/reject-request`
- Responsibilities: Validate input, write to Firestore via Admin SDK, send email via Resend

## Error Handling

**Strategy:** Mostly local per-component try/catch with boolean error state; no global error boundary

**Patterns:**
- API fetch errors set a local `error` or `status` state variable and render an inline error message
- `AuthContext` catches Firestore errors during role lookup, signs the user out, and sets `authError` string
- Serverless functions return HTTP 400/500 with JSON `{ error: "..." }` on failure
- `AIBot.jsx` returns a hardcoded Polish error string if `VITE_GEMINI_API_KEY` is absent

## Cross-Cutting Concerns

**Logging:** `console.error(...)` only; no structured logging or external error tracking
**Validation:** Input validation in serverless functions only (required field checks); client-side forms have no explicit validation layer
**Authentication:** Firebase Google OAuth popup (`signInWithPopup`); authorization via Firestore `authorized_users` allowlist checked on every auth state change
**Role System:** Three roles enforced in route guards — `admin` (full access), `logitech` (equipment panel), `member` (base authenticated access)

---

*Architecture analysis: 2026-04-04*
