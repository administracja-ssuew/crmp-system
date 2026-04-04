# Codebase Concerns

**Analysis Date:** 2026-04-04

---

## Security Considerations

**Supabase anon key hardcoded in source:**
- Risk: The Supabase `anon` key and project URL are committed as plaintext strings in `src/supabaseClient.js` (lines 4–7). While the `anon` key is intended to be public, its exposure in source code makes rotation harder and couples all environments to one key.
- Files: `src/supabaseClient.js`
- Current mitigation: None — the key is a static string literal, not an env var.
- Recommendation: Move to `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to match the Firebase pattern and allow per-environment overrides.

**Google Apps Script URLs hardcoded in multiple components:**
- Risk: Seven distinct Google Apps Script deployment URLs are scattered across six different source files as local constants. Any URL rotation requires touching multiple files and redeploying.
- Files: `src/config.js`, `src/pages/AdminEquipmentPanel.jsx` (line 50), `src/pages/EquipmentPage.jsx` (line 50), `src/pages/DashboardPage.jsx` (lines 15–16), `src/pages/DocumentsPage.jsx` (line 4), `src/pages/MapPage.jsx` (line 5), `src/pages/StandsPage.jsx` (line 5), `src/pages/CalendarSamorzadPage.jsx` (line 5), `src/pages/UniversalCalendarPage.jsx` (line 4)
- The same equipment API URL appears independently in both `src/config.js` and `src/pages/AdminEquipmentPanel.jsx` / `src/pages/EquipmentPage.jsx` — `config.js` is never imported by any component, making it dead code.
- Current mitigation: URLs are public-access Google endpoints with no auth token, limiting direct data exfiltration risk.
- Recommendation: Centralise all Google Apps Script URLs into a single `src/config.js` file using env vars (or at minimum exported constants), and import from there consistently.

**Email sender uses Resend sandbox address:**
- Risk: All three API handlers (`api/approve-request.js`, `api/reject-request.js`, `api/request-access.js`) send from `onboarding@resend.dev` — the default Resend sandbox domain. Emails sent from this domain are likely to land in spam for recipients outside the Resend sandbox allow-list, and Resend may reject delivery to arbitrary addresses on a free plan.
- Files: `api/approve-request.js` (line 35), `api/reject-request.js` (line 29), `api/request-access.js` (lines 46, 69)
- Current mitigation: None.
- Recommendation: Configure a verified custom domain in Resend and replace `from: 'onboarding@resend.dev'` with an address under that domain.

**No server-side authorisation on approve/reject API endpoints:**
- Risk: `api/approve-request.js` and `api/reject-request.js` accept POST requests and directly mutate Firestore (`authorized_users`, `access_requests`) without verifying that the caller is an authenticated admin. Anyone who can reach `POST /api/approve-request` with a valid `requestId` and `email` can grant themselves system access.
- Files: `api/approve-request.js`, `api/reject-request.js`
- Current mitigation: The endpoints are obscured (no public link), but security by obscurity is not a control.
- Recommendation: Add Firebase Admin token verification: require a Firebase ID token in the `Authorization` header and validate it server-side using `firebase-admin/auth` before performing any Firestore writes.

**Blacklist check uses user email string as `user_id`, not a UID:**
- Risk: In `src/pages/VerificationPage.jsx` the blacklist query uses `user?.email` as the `user_id` column value. If a user changes their email (or if the column is expected to hold a Firebase UID), the check silently passes for banned users.
- Files: `src/pages/VerificationPage.jsx` (lines 36–46)
- Current mitigation: Blacklist is admin-managed, reducing the attack surface, but the identifier mismatch remains.
- Recommendation: Use `user.uid` (Firebase UID) as the canonical user identifier for all Supabase session/blacklist records.

---

## Tech Debt

**`src/config.js` is dead code:**
- Issue: `src/config.js` exports `CRW_API_URL` but is never imported anywhere. `AdminEquipmentPanel.jsx` and `EquipmentPage.jsx` each define the identical URL string inline.
- Files: `src/config.js`, `src/pages/AdminEquipmentPanel.jsx` (line 50), `src/pages/EquipmentPage.jsx` (line 50)
- Impact: URL duplication — a change to the Google Apps Script deployment requires updating three places instead of one.
- Fix approach: Import `CRW_API_URL` from `src/config.js` in both components and delete the inline constants; or move all API URLs into `src/config.js`.

**Artificial 2-second loading delay on login:**
- Issue: `src/App.jsx` (lines 91–95) adds a `setTimeout` of 2 000 ms after auth resolves before showing the app, purely for a splash screen animation. This is unconditional — even on fast connections the user waits 2 seconds.
- Files: `src/App.jsx`
- Impact: Degraded perceived performance for returning users.
- Fix approach: Remove the timeout or reduce it to a short minimum (e.g. 400 ms) with a fade-out transition so the experience is polished without blocking real navigation.

**Duplicate QR scanner libraries:**
- Issue: Two different QR scanning packages are installed and used simultaneously: `react-qr-reader@^3.0.0-beta-1` (used in `src/pages/VerificationPage.jsx`) and `@yudiel/react-qr-scanner@^2.5.1` (used in `src/pages/ScannerPage.jsx`). `react-qr-reader` is a beta release and has been effectively abandoned upstream.
- Files: `package.json`, `src/pages/VerificationPage.jsx` (line 5), `src/pages/ScannerPage.jsx` (line 3)
- Impact: Increased bundle size; `react-qr-reader` may produce different scan behaviours across devices and receives no security patches.
- Fix approach: Migrate `VerificationPage.jsx` to use `@yudiel/react-qr-scanner` (the maintained library) and remove `react-qr-reader` from `package.json`.

**`firebase-admin` installed as a frontend dependency:**
- Issue: `firebase-admin@^10.3.0` is listed under `dependencies` in `package.json`, not `devDependencies`. It is a server-only SDK used exclusively in the `api/` Vercel serverless functions. Including it in the main dependency tree may cause Vite to attempt to bundle Node.js-only modules.
- Files: `package.json`
- Impact: Potential build warnings or failures if Vite encounters Node.js built-ins (e.g., `fs`, `crypto`) pulled in by `firebase-admin`; unnecessary bundle weight.
- Fix approach: Move `firebase-admin` and `resend` to `devDependencies` (Vercel functions install all dependencies server-side regardless), or isolate the `api/` directory with its own `package.json`.

**Unresolved placeholder in DashboardPage notices URL:**
- Issue: `src/pages/DashboardPage.jsx` (line 59) contains an explicit guard against a placeholder string: `if (NOTICES_API_URL === "TUTAJ_WKLEJ_LINK_DO_OGLOSZEN_Z_APPS_SCRIPT")`. The URL has been filled in, but the guard comment and pattern suggest copy-paste setup code was never cleaned up.
- Files: `src/pages/DashboardPage.jsx`
- Impact: Dead conditional branch; misleading to future contributors.
- Fix approach: Remove the guard block since the URL is now configured.

**Large monolithic page components:**
- Issue: Several page components exceed 500 lines and combine data fetching, business logic, and rendering without any sub-component or hook extraction:
  - `src/pages/DocumentsPage.jsx` — 1 113 lines
  - `src/pages/KompendiumPage.jsx` — 1 111 lines
  - `src/pages/AdminEquipmentPanel.jsx` — 826 lines
  - `src/pages/StandsPage.jsx` — 585 lines
  - `src/pages/EquipmentPage.jsx` — 549 lines
- Impact: Difficult to read, test, and modify; state mutations risk unintended side effects across distant sections of the same component.
- Fix approach: Extract custom hooks for data fetching (e.g., `useEquipmentData`, `useDocuments`) and break modal dialogs into separate components.

---

## Known Bugs

**Optimistic delete of notices not rolled back on failure:**
- Symptoms: In `src/pages/DashboardPage.jsx` `handleDeleteNoticeGlobal`, the notice is removed from local state immediately (`setNotices(notices.filter(...))`), but if the subsequent `fetch` to the Apps Script endpoint fails (caught only with `console.error`), the deleted notice is not restored to state. Users see the notice as gone even though the server deletion may have failed.
- Files: `src/pages/DashboardPage.jsx` (lines 108–124)
- Trigger: Network error or Apps Script timeout during global delete.
- Workaround: Page reload will re-fetch notices from the server.

**`window.location.reload()` bypasses React Router state:**
- Symptoms: `VerificationPage.jsx` calls `window.location.reload()` in three places (lines 171, 208, 429) after check-in/check-out and handover completion. A hard reload loses any React Router location state (e.g., `scannedCodes` passed via `navigate`) and resets the auth loading cycle including the 2-second splash.
- Files: `src/pages/VerificationPage.jsx`
- Trigger: Completing a check-in, check-out, or handover acceptance.
- Workaround: None — the reload is intentional but blunt.

**`AdminEquipmentPanel` falls back to hardcoded document number:**
- Symptoms: In `src/pages/AdminEquipmentPanel.jsx` (lines 79–85), if the `getNextNumber` API call fails or returns no `docNumber`, the document number falls back silently to the hardcoded string `"01/SSUEW/03/2026"`. This means issued equipment protocols may have duplicate numbers.
- Files: `src/pages/AdminEquipmentPanel.jsx`
- Trigger: Network error reaching the Google Apps Script endpoint, or the script returning an unexpected response shape.
- Workaround: Manual correction in the Google Sheet.

---

## Performance Bottlenecks

**Full dataset fetched on every component mount with no caching:**
- Problem: Every page that reads from Google Apps Script (`EquipmentPage`, `AdminEquipmentPanel`, `StandsPage`, `MapPage`, `DashboardPage`) issues an uncached `fetch` on mount. If two of these pages are visited in one session, the same endpoints are called multiple times.
- Files: `src/pages/EquipmentPage.jsx` (line 58), `src/pages/AdminEquipmentPanel.jsx` (line 52), `src/pages/StandsPage.jsx` (line 49), `src/pages/MapPage.jsx` (line 31)
- Cause: No shared state (Context, Zustand, React Query) and no HTTP cache headers from Google Apps Script JSONP endpoints.
- Improvement path: Introduce a data-fetching cache layer (React Query / SWR) with a reasonable stale-while-revalidate TTL, or lift equipment/stand data into a shared context.

**`knowledge.js` embeds 871 lines of regulatory text into the JS bundle:**
- Problem: `src/knowledge.js` is a single 871-line JavaScript module containing the full text of multiple student government regulations, imported directly by `src/AIBot.jsx`. This text is included in every user's initial bundle download.
- Files: `src/knowledge.js`, `src/AIBot.jsx`
- Cause: Static knowledge base embedded as a JS string literal rather than loaded on demand.
- Improvement path: Lazy-load `knowledge.js` inside `AIBot` using dynamic `import()` only when the chat widget is first opened, or fetch it as a separate asset.

---

## Fragile Areas

**`AdminEquipmentPanel` — column name guessing for `wydania` records:**
- Files: `src/pages/AdminEquipmentPanel.jsx` (lines 88–101, `getAgreementNumber`, `getRealDate`)
- Why fragile: These helpers iterate through multiple candidate field names (`Nr_Porozumienia`, `Nr Porozumienia`, `Data`) using string-contains heuristics to guess which column holds the agreement number vs. date. If the Google Sheet column naming changes, the heuristic silently returns wrong values.
- Safe modification: Standardise column names in the Google Sheet schema and update the functions to use a single canonical field name.
- Test coverage: Zero — no tests exist anywhere in the project.

**`firstAidReports` data field name guessing:**
- Files: `src/pages/AdminEquipmentPanel.jsx` (line 68)
- Why fragile: Four candidate field names are tried in sequence (`apteczkiBraki`, `braki_apteczek`, `apteczki_braki`, `firstAidReports`) to read first-aid report data from the API response. If the Apps Script returns a different key, the array silently becomes empty.
- Safe modification: Align on one canonical field name in the Apps Script output and remove the fallback chain.

**`EquipmentPage` — equipment item IDs generated from display name when QR code missing:**
- Files: `src/pages/EquipmentPage.jsx` (lines 74–77)
- Why fragile: Items without a `KOD_QR` field receive a synthetic ID in the form `SSUEW-BRAK-{NAZWA_SPRZĘTU}`. If the item name contains special characters or changes, reservation collision detection (which compares IDs) will fail silently.
- Safe modification: Ensure all equipment rows in the Google Sheet have a populated `KOD_QR` field; add a visible admin warning in the UI (not just `console.warn`) for missing QR codes.

**`VerificationPage` — handover polling at a fixed 3-second interval with no cleanup guard:**
- Files: `src/pages/VerificationPage.jsx` (lines 201–213)
- Why fragile: The `setInterval` polling Supabase for handover status runs every 3 seconds. If the component is unmounted (user navigates away) while a handover is pending, the `clearInterval` in the cleanup function should stop it — but because `window.location.reload()` is called on success rather than state update, the interval may fire one extra time after the reload begins.
- Safe modification: Replace the `setInterval` polling with a Supabase realtime subscription (`supabase.channel`) which is natively cleaned up on unsubscribe.

---

## Test Coverage Gaps

**No tests exist anywhere in the project:**
- What's not tested: All business logic, all data transformations, all role-based routing, all API handlers, all form validation.
- Files: Entire `src/` and `api/` directories.
- Risk: Any refactoring, dependency upgrade, or Google Sheet schema change can break functionality silently. The equipment collision detection, the blacklist check, the document number generation, and the role guard logic are all exercised only through manual QA.
- Priority: High — especially for `api/approve-request.js` (grants system access) and `src/context/AuthContext.jsx` (role enforcement).

**No linting or type checking configured:**
- What's not tested: Static analysis — no ESLint config file exists, no TypeScript.
- Files: `package.json` (no `eslint` in devDependencies), project root (no `.eslintrc*`, no `tsconfig.json`)
- Risk: Typos in field names, unused imports, and incorrect prop usage go undetected until runtime.
- Priority: Medium — adding ESLint with a basic React ruleset would catch a large class of errors without requiring a TypeScript migration.

---

## Scaling Limits

**Google Apps Script endpoints:**
- Current capacity: Google Apps Script has a quota of ~20 000 URL-fetch calls per day on a free Workspace account, and response times under load can exceed 5–10 seconds (cold starts).
- Limit: If user volume grows, Apps Script quotas will be hit and all data operations for equipment, stands, map, and CRED search will fail simultaneously.
- Scaling path: Migrate data to Supabase (already present in the stack) or a Cloud Function with proper indexing, removing the dependency on Google Sheets as a primary datastore.

---

## Dependencies at Risk

**`react-qr-reader@^3.0.0-beta-1`:**
- Risk: This package is a pre-release beta that has not been updated since 2022 and has known issues with iOS Safari camera access in newer versions. It has open security advisories related to upstream `jsqr`.
- Impact: QR scanning in `VerificationPage` may silently fail on newer iOS/Android browsers.
- Migration plan: Replace with `@yudiel/react-qr-scanner` (already installed and used in `ScannerPage.jsx`).

**`firebase@^12.9.0` alongside `firebase-admin@^10.3.0`:**
- Risk: `firebase-admin` version `10.x` does not support Node.js 20+ runtime officially. Vercel's default Node runtime is 20. The mismatch may cause deployment warnings and will become a hard error when `firebase-admin` 10.x reaches end-of-life.
- Impact: Serverless API handlers (`api/`) may behave inconsistently on newer Vercel runtimes.
- Migration plan: Upgrade `firebase-admin` to `^12.x` to match the client SDK major version and gain Node 20 support.

---

*Concerns audit: 2026-04-04*
