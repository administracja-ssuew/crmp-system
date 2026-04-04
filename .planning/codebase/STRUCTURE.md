# Codebase Structure

**Analysis Date:** 2026-04-04

## Directory Layout

```
stand-dashboard-main/
├── api/                    # Vercel serverless functions (Node.js, Firebase Admin + Resend)
│   ├── approve-request.js  # POST /api/approve-request
│   ├── reject-request.js   # POST /api/reject-request
│   └── request-access.js   # POST /api/request-access
├── public/                 # Static assets served at root
│   ├── logo.png            # App logo (used in splash screen and login page)
│   └── mapa.jpg            # Campus map image (used in MapPage)
├── src/                    # All React application source
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state (user, userRole, loading, authError)
│   ├── pages/              # One file per route/feature module
│   │   ├── AccessRequestPage.jsx       # /wniosek — public access request form
│   │   ├── AccessRequestsPanel.jsx     # /wnioski — admin approval panel
│   │   ├── AdminEquipmentPanel.jsx     # /wydawanie — logitech/admin equipment issuing
│   │   ├── CalendarSamorzadPage.jsx    # /kalendarz/samorzad — SSUEW room booking calendar
│   │   ├── CalendarSelectionPage.jsx   # /kalendarz-wybor — calendar type selection
│   │   ├── DashboardPage.jsx           # / — main dashboard with notices and CRED search
│   │   ├── DocumentsPage.jsx           # /dokumenty — document library and petition generator
│   │   ├── EquipmentPage.jsx           # /sprzet — equipment catalog and reservation
│   │   ├── KompendiumPage.jsx          # /kompendium — protocol writing guide
│   │   ├── KsiegaDokumentowPage.jsx    # /ksiega-dokumentow — document registry
│   │   ├── LegalHubPage.jsx            # /legal-hub — legal terms wiki
│   │   ├── LoginPage.jsx               # /login — Google OAuth login
│   │   ├── MapPage.jsx                 # /mapa — campus posting locations map
│   │   ├── ScannerPage.jsx             # /skaner-ski — QR scanner (admin only)
│   │   ├── StandsPage.jsx              # /rejestr — stands/booths registry
│   │   ├── UniversalCalendarPage.jsx   # /kalendarz/organizacje — organizations calendar
│   │   └── VerificationPage.jsx        # /skaner — room check-in/check-out with QR and Supabase
│   ├── AIBot.jsx           # Floating Gemini AI assistant overlay (all authenticated pages)
│   ├── App.jsx             # BrowserRouter, all routes, route guards, persistent shell UI
│   ├── config.js           # Exports CRW_API_URL (Google Apps Script URL constant)
│   ├── firebase.js         # Firebase app init; exports auth, db, loginWithGoogle, logout
│   ├── index.css           # Global Tailwind base styles and custom animations
│   ├── knowledge.js        # KNOWLEDGE_BASE string — system prompt for AIBot (50 KB)
│   ├── main.jsx            # ReactDOM.createRoot entry point, wraps App in AuthProvider
│   └── supabaseClient.js   # Supabase client singleton export
├── dist/                   # Vite production build output (generated, committed)
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis documents
├── index.html              # HTML shell with <div id="root">
├── package.json            # Dependencies and npm scripts
├── postcss.config.js       # PostCSS config (Tailwind plugin)
├── tailwind.config.js      # Tailwind theme configuration
├── vercel.json             # Vercel deployment rewrites (SPA fallback + /api/* pass-through)
└── vite.config.js          # Vite config with React plugin
```

## Directory Purposes

**`api/`:**
- Purpose: Vercel serverless functions for privileged server-side operations
- Contains: Three Node.js handler modules using `firebase-admin` and `resend`
- Key files: `api/request-access.js`, `api/approve-request.js`, `api/reject-request.js`

**`src/context/`:**
- Purpose: React context providers for global application state
- Contains: Only `AuthContext.jsx` — the single shared context in the app
- Key files: `src/context/AuthContext.jsx`

**`src/pages/`:**
- Purpose: Feature modules — one file per route, containing all UI, state, and data logic for that feature
- Contains: 17 `.jsx` files, each a default-exported React component
- Key files: `src/pages/DashboardPage.jsx` (home), `src/pages/EquipmentPage.jsx` (largest module), `src/pages/DocumentsPage.jsx` (largest file at 77 KB)

**`public/`:**
- Purpose: Static files served verbatim at `/`
- Contains: `logo.png`, `mapa.jpg`
- Generated: No — manually managed assets

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (`npm run build`)
- Committed: Yes (present in repo)

## Key File Locations

**Entry Points:**
- `src/main.jsx`: React app bootstrap
- `index.html`: HTML shell
- `api/request-access.js`: Access request serverless handler
- `api/approve-request.js`: Approval serverless handler
- `api/reject-request.js`: Rejection serverless handler

**Configuration:**
- `vite.config.js`: Vite build configuration
- `vercel.json`: Deployment rewrites (SPA fallback, API routing)
- `tailwind.config.js`: Tailwind CSS theme
- `postcss.config.js`: PostCSS pipeline
- `src/config.js`: Single exported `CRW_API_URL` constant

**Core Logic:**
- `src/App.jsx`: All routes and route guards
- `src/context/AuthContext.jsx`: Auth state and role resolution
- `src/firebase.js`: Firebase client init and auth helpers
- `src/supabaseClient.js`: Supabase client init
- `src/knowledge.js`: AI chatbot knowledge base (large static string)

**Individual Feature Modules:**
- `src/pages/DashboardPage.jsx`: Home with Google Apps Script announcements and CRED search
- `src/pages/EquipmentPage.jsx`: Equipment catalog backed by Google Apps Script
- `src/pages/AdminEquipmentPanel.jsx`: Equipment issuance with canvas signatures
- `src/pages/VerificationPage.jsx`: QR room check-in backed by Supabase
- `src/pages/DocumentsPage.jsx`: Document library + petition document generator
- `src/pages/CalendarSamorzadPage.jsx`: SSUEW room booking calendar
- `src/pages/StandsPage.jsx`: Campus stands/booths registry
- `src/pages/AccessRequestsPanel.jsx`: Admin panel for approving/rejecting access requests

## Naming Conventions

**Files:**
- Pages: `PascalCase` with `Page` suffix — e.g., `DashboardPage.jsx`, `LoginPage.jsx`
- Admin/panel variants: `PascalCase` with `Panel` suffix — e.g., `AdminEquipmentPanel.jsx`, `AccessRequestsPanel.jsx`
- Context files: `PascalCase` with `Context` suffix — e.g., `AuthContext.jsx`
- Utility/config: `camelCase` — e.g., `firebase.js`, `supabaseClient.js`, `config.js`

**Directories:**
- All lowercase: `src/`, `api/`, `public/`, `context/`, `pages/`

**Components within files:**
- `PascalCase` React components
- `camelCase` helper functions and constants (e.g., `formatDate`, `fetchData`)
- `SCREAMING_SNAKE_CASE` for module-level data constants (e.g., `DIN_13169_ITEMS`, `BUILDING_INFO`, `LEGAL_WIKI`, `KNOWLEDGE_BASE`)
- `SCREAMING_SNAKE_CASE` for API URL constants at module level (e.g., `DATA_URL`, `API_URL`, `DOCS_API_URL`)

## Where to Add New Code

**New Feature Page (new route):**
- Create: `src/pages/NewFeaturePage.jsx` — default export, PascalCase with `Page` suffix
- Register route: Add `<Route>` in the appropriate section of `src/App.jsx`
- Protect: Wrap with `<ProtectedRoute>`, `<AdminRoute>`, or `<LogitechRoute>` as needed
- Tests: No test directory exists; no testing infrastructure is set up

**New Serverless API Endpoint:**
- Create: `api/new-endpoint.js` — export `default async function handler(req, res)`
- Add method guard (`if (req.method !== 'POST') return res.status(405).end()`)
- Init Firebase Admin using the same pattern as `api/request-access.js` (check `getApps().length` before `initializeApp`)
- Vercel will automatically expose it at `/api/new-endpoint`

**New Global Context:**
- Create: `src/context/NewContext.jsx`
- Wrap in `src/main.jsx` alongside `AuthProvider`

**New External API Integration:**
- Define URL as a module-level `const` at the top of the consuming page file (follow existing pattern)
- Or add to `src/config.js` if shared across multiple pages

**Shared Utility Functions:**
- No `utils/` or `helpers/` directory exists; shared utilities would need a new directory
- Suggested location for new shared helpers: `src/utils/` (create directory)

**Static Assets:**
- Place in `public/` to serve at `/filename`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: Production build artifacts
- Generated: Yes (`npm run build`)
- Committed: Yes (currently tracked in repo — unusual for build output)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-04-04*
