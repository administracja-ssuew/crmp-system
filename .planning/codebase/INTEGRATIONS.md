# External Integrations

**Analysis Date:** 2026-04-04

## APIs & External Services

**Google AI (Generative Language):**
- Service: Google Gemini 2.5 Flash
- What it's used for: AI chat assistant ("CRA Legal AI") embedded globally via `src/AIBot.jsx`. Also used directly for document summarization in `src/pages/DocumentsPage.jsx` (line 431).
- SDK/Client: Direct `fetch` to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Auth: `VITE_GEMINI_API_KEY` (client-side env var — key is exposed in browser)

**Google Apps Script (Google Sheets backends):**
- What it's used for: Multiple spreadsheet-backed APIs serving as the data layer for core features. Each sheet has its own deployed script URL.
  - Equipment/Inventory: `src/config.js` exports `CRW_API_URL`, used in `src/pages/EquipmentPage.jsx` and `src/pages/AdminEquipmentPanel.jsx`
  - Calendar (Samorząd + Universal): `src/pages/CalendarSamorzadPage.jsx` and `src/pages/UniversalCalendarPage.jsx` share one script URL
  - Dashboard (credentials + notices): `src/pages/DashboardPage.jsx` uses two separate script URLs (`CRED_API_URL`, `NOTICES_API_URL`)
  - Documents list: `src/pages/DocumentsPage.jsx` uses `DOCS_API_URL`
  - Stands register: `src/pages/StandsPage.jsx` uses `DATA_URL`
  - Map data: `src/pages/MapPage.jsx` uses `DATA_URL`
- SDK/Client: Direct `fetch` (GET/POST with JSON)
- Auth: None — public Apps Script deployments (no API key required)

## Data Storage

**Databases:**

- Firebase Firestore (primary auth-gated database)
  - Connection: Client SDK initialized in `src/firebase.js` using `VITE_FIREBASE_*` env vars
  - Admin SDK initialized in `api/*.js` using `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  - Client: `firebase` SDK (client) and `firebase-admin` SDK (server)
  - Collections used:
    - `authorized_users` — stores email + role (`member`, `admin`, `logitech`), read by `src/context/AuthContext.jsx` on every login
    - `access_requests` — stores pending/approved/rejected access requests, managed by `api/request-access.js` and `api/approve-request.js` and `api/reject-request.js`

- Supabase (file storage + room session database)
  - Connection: `src/supabaseClient.js` — URL and anon key are hardcoded in source (not env vars)
  - Client: `@supabase/supabase-js` createClient
  - Tables used (accessed in `src/pages/VerificationPage.jsx`):
    - `room_sessions` — tracks active room occupancy sessions (insert, update, select)
    - `session_handovers` — manages room key handover between users (insert, update, select)
    - `blacklist_violations` — stores active access bans with `valid_until` timestamp
  - Storage bucket: `room-photos` — stores photo evidence uploaded during room check-in/check-out

**File Storage:**
- Supabase Storage bucket `room-photos` — images uploaded via `src/pages/VerificationPage.jsx`, compressed client-side using `browser-image-compression` before upload

**Caching:**
- None (all data fetched fresh on page load)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (Google OAuth only)
  - Implementation: Google Sign-In via popup (`signInWithPopup`) in `src/firebase.js`
  - Provider: `GoogleAuthProvider`
  - Post-login authorization check: `src/context/AuthContext.jsx` queries Firestore `authorized_users` collection to verify email is on allow-list and read role. Users not in collection are immediately signed out.
  - Roles: `admin`, `logitech`, `member` — enforced via `AdminRoute` and `LogitechRoute` wrappers in `src/App.jsx`

## Monitoring & Observability

**Error Tracking:**
- None — errors are logged to `console.error` only

**Logs:**
- Browser console only (`console.error` in catch blocks throughout `src/`)

## CI/CD & Deployment

**Hosting:**
- Vercel — configured via `vercel.json`
- Production URL: `https://cra-system.vercel.app` (referenced in email templates in `api/approve-request.js` and `api/request-access.js`)
- SPA routing handled by Vercel rewrite rule: all paths rewrite to `/`
- `api/` directory automatically treated as Vercel Serverless Functions

**CI Pipeline:**
- Not detected (no GitHub Actions or other CI config present)

## Environment Configuration

**Required client-side env vars (VITE_ prefix, set in Vercel dashboard or .env.local):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY`

**Required server-side env vars (for Vercel Serverless Functions in `api/`):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (PEM format with `\n` escaping)
- `RESEND_API_KEY`

**Secrets location:**
- `.env.local` present locally (contents not read)
- Production secrets stored in Vercel environment variables

## Email

**Provider:** Resend (`resend` 6.9.4)
- Used in: `api/request-access.js`, `api/approve-request.js`, `api/reject-request.js`
- Sender: `onboarding@resend.dev` (Resend sandbox domain — not a custom domain)
- Admin notifications sent to: `administracja@samorzad.ue.wroc.pl`
- Auth: `RESEND_API_KEY` server-side env var
- Three transactional flows:
  1. New access request — notifies admin + confirms to applicant (`api/request-access.js`)
  2. Request approved — notifies applicant with login link (`api/approve-request.js`)
  3. Request rejected — notifies applicant (`api/reject-request.js`)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (Google Apps Script URLs are called synchronously via fetch, not as webhooks)

---

*Integration audit: 2026-04-04*
