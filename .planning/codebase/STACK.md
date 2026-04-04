# Technology Stack

**Analysis Date:** 2026-04-04

## Languages

**Primary:**
- JavaScript (JSX) - All frontend React components in `src/`
- JavaScript (ESM) - Serverless API handlers in `api/`

**Secondary:**
- CSS - Global styles in `src/index.css`

## Runtime

**Environment:**
- Node.js (lockfileVersion 3 — requires Node 16+)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- React 18.2.0 - UI rendering, `src/main.jsx` entry point
- React Router DOM 7.13.1 - Client-side routing defined in `src/App.jsx`

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS, configured in `tailwind.config.js`
- PostCSS 8.4.35 - CSS processing, configured in `postcss.config.js`
- Autoprefixer 10.4.17 - Vendor prefix handling
- Inter font via CSS (referenced in `tailwind.config.js` fontFamily)

**Build/Dev:**
- Vite 8.0.3 - Dev server and production bundler, config in `vite.config.js`
- @vitejs/plugin-react 4.0.0 - React JSX transform for Vite

## Key Dependencies

**Critical:**
- `firebase` 12.9.0 - Google Auth + Firestore database (client SDK), initialized in `src/firebase.js`
- `firebase-admin` 10.3.0 - Firestore write access in serverless API handlers (`api/*.js`)
- `@supabase/supabase-js` 2.99.2 - File storage and room session database, initialized in `src/supabaseClient.js`
- `resend` 6.9.4 - Transactional email delivery, used in all three `api/` handlers
- `react-router-dom` 7.13.1 - Routing for 15+ pages defined in `src/App.jsx`

**UI & Utilities:**
- `lucide-react` 1.7.0 - Icon library
- `browser-image-compression` 2.0.2 - Client-side image compression before upload in `src/pages/VerificationPage.jsx`
- `@yudiel/react-qr-scanner` 2.5.1 - QR scanner used in `src/pages/ScannerPage.jsx`
- `react-qr-reader` 3.0.0-beta-1 - Legacy QR reader used in `src/pages/VerificationPage.jsx`

## Configuration

**Environment:**
- Development: `VITE_` prefixed variables loaded from `.env.local` (file present — never read)
- Production: Environment variables set in Vercel dashboard
- Client-side vars (accessed via `import.meta.env`):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_GEMINI_API_KEY`
- Server-side vars (accessed via `process.env` in `api/` handlers):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `RESEND_API_KEY`

**Build:**
- `vite.config.js` — minimal config, React plugin only
- `tailwind.config.js` — scans `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`, safelists Tailwind color classes used dynamically (from Google Sheets data)
- `postcss.config.js` — runs tailwindcss and autoprefixer

## Platform Requirements

**Development:**
- Node.js 16+ (npm lockfileVersion 3)
- Run with: `npm run dev` (Vite dev server)

**Production:**
- Deployed to Vercel (`vercel.json` present)
- SPA rewrites: all non-API routes rewrite to `/`
- API routes (`/api/*`) served as Vercel Serverless Functions from `api/` directory
- Static frontend built with `npm run build` (output to `dist/`)
- `.npmrc` present (may contain registry config)

---

*Stack analysis: 2026-04-04*
