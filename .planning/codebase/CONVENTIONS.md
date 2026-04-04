# Coding Conventions

**Analysis Date:** 2026-04-04

## Naming Patterns

**Files:**
- Pages use PascalCase with `Page` suffix: `DashboardPage.jsx`, `LoginPage.jsx`, `StandsPage.jsx`
- Admin/panel pages use PascalCase with `Panel` suffix: `AdminEquipmentPanel.jsx`, `AccessRequestsPanel.jsx`
- Context files use PascalCase with `Context` suffix: `AuthContext.jsx`
- Utility/config files use camelCase: `firebase.js`, `supabaseClient.js`, `config.js`, `knowledge.js`
- All source components use `.jsx` extension, non-component modules use `.js`

**Components:**
- All React components use PascalCase: `DashboardPage`, `AuthProvider`, `BackButton`, `UserProfile`
- Route guard components use `Route` suffix: `ProtectedRoute`, `AdminRoute`, `LogitechRoute`
- Inline sub-components (defined within a parent file) use PascalCase: `Card`, `Icons`, `TabButton`

**Functions/Handlers:**
- Event handlers use `handle` prefix in camelCase: `handleSubmit`, `handleSearch`, `handleApprove`, `handleDeleteNoticeGlobal`, `handleDismiss`
- Data fetching functions named descriptively: `fetchData`, `fetchAllData`, `fetchRequests`, `fetchNotices`
- Boolean state variables use `is`/`has` prefix: `isLoading`, `isSubmitting`, `isAdmin`, `hasAcceptedTerms`

**Variables and State:**
- State variables use camelCase: `searchQuery`, `selectedItem`, `activeTab`, `userRole`
- Constants (module-level, non-component) use SCREAMING_SNAKE_CASE: `API_URL`, `DATA_URL`, `ITEMS_PER_PAGE`, `DIN_13169_ITEMS`, `BUILDING_INFO`, `CATEGORY_STYLES`
- Boolean derivations from role checks use `is` prefix: `const isAdmin = userRole === 'admin'`

**Types/Interfaces:**
- No TypeScript; project uses plain JavaScript with JSX. No type declarations.

## Code Style

**Formatting:**
- No Prettier or ESLint configuration files detected. No automated formatter enforced.
- Indentation: 2 spaces throughout all source files.
- Single quotes for string literals in JS logic; double quotes used inside JSX attributes and template strings.
- Semicolons: consistently absent (ASI-style) in component files.

**Linting:**
- No ESLint config detected. No lint rules enforced.
- Code relies on Vite's default build checks only.

## Import Organization

**Order (observed pattern):**
1. React hooks from `react`: `import { useState, useEffect, useRef } from 'react'`
2. React Router imports: `import { Link, useLocation, Navigate } from 'react-router-dom'`
3. Internal context: `import { useAuth } from '../context/AuthContext'`
4. Firebase/Supabase clients: `import { db } from '../firebase'`, `import { supabase } from '../supabaseClient'`
5. Third-party libraries: `import imageCompression from 'browser-image-compression'`
6. Internal modules: `import { KNOWLEDGE_BASE } from './knowledge.js'`

**Path Aliases:**
- None configured. All imports use relative paths (`../`, `./`).

**No barrel files (`index.js`)** exist. Every import references the file directly.

## Error Handling

**Async fetch pattern:**
```jsx
// Standard pattern used in page components (e.g., DashboardPage.jsx, StandsPage.jsx)
const fetchData = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    setData(data);
  } catch (error) {
    console.error("Descriptive error label:", error);
    setError("User-facing error message string");
  } finally {
    setIsLoading(false);
  }
};
```

**Legacy promise-chain pattern** (used in some older fetches in `StandsPage.jsx`, `EquipmentPage.jsx`):
```jsx
fetch(DATA_URL)
  .then(res => res.json())
  .then(json => { setData(json); setLoading(false); })
  .catch(err => { console.error("Błąd:", err); setError("Błąd połączenia."); setLoading(false); });
```

**User feedback for errors:**
- Simple operations: `alert("Error message")` is used directly — no toast library.
- Confirmation dialogs: `window.confirm("Are you sure?")` before destructive operations.
- Form validation errors: stored in state (`setError(...)`) and rendered inline.
- Network-level errors in catch blocks: `console.error(...)` + state update or `alert()`.

**API function errors (Vercel serverless, `api/` directory):**
```js
// Standard pattern in api/approve-request.js, api/reject-request.js
try {
  // operations
  return res.status(200).json({ success: true });
} catch (error) {
  console.error(error);
  return res.status(500).json({ error: 'Błąd serwera' });
}
```

**Supabase error handling (`VerificationPage.jsx`):**
```jsx
const { data: room, error: roomErr } = await supabase.from('rooms').select('*').eq('qr_hash', qrHash).single();
// errors checked inline: if (roomErr || !room) { ... }
```

## Logging

**Framework:** `console` (native browser/Node.js)

**Patterns:**
- `console.error("Polish label:", errorObject)` — used in all catch blocks
- `console.warn('[CRW] Polish message:', value)` — used for non-critical data integrity warnings (e.g., missing QR codes in `EquipmentPage.jsx`)
- `console.log(err)` — used inconsistently in a few places in `MapPage.jsx` where `console.error` would be more appropriate
- No structured logging or log levels beyond native console methods

## Comments

**When to Comment:**
- Section delimiters use `=== SECTION NAME ===` style inside block comments:
  ```jsx
  // === STANY OGŁOSZEŃ ===
  // === GŁÓWNA ZAWARTOŚĆ (wewnątrz BrowserRouter) ===
  ```
- Inline annotations for clarifying intent: `// Pomocnik: sprawdza czy id pasuje dokładnie`
- Placeholder/configuration markers use all-caps with exclamation: `// !!! TUTAJ WKLEJ LINK !!!`
- Change annotations: `// <--- ZMIANA: BYŁO signInWithRedirect`

**Language:** Comments are written in Polish throughout the codebase.

**JSDoc/TSDoc:**
- Not used. No function documentation annotations anywhere.

## Function Design

**Size:**
- Page components (`DashboardPage.jsx`, `DocumentsPage.jsx`, `KompendiumPage.jsx`) are very large — 441–1113 lines each. All logic (data fetching, state, sub-components, JSX) is colocated in a single file per page.
- No extraction into custom hooks. All `useEffect` and async logic lives inside the default export component.

**Parameters:**
- Functional components accept a single `props` object, typically destructured: `({ children })`, `({ userEmail })`, `({ title })`
- Event handlers are defined inline or as named functions within the component body

**Return Values:**
- Components return JSX directly or `null` for conditional non-render (e.g., `if (!user) return null`)
- Loading states return early with a full-screen loading JSX block
- Error states return early with an error JSX block

## Module Design

**Exports:**
- Every page and component file uses a single `export default function ComponentName()` pattern
- Named exports used only in `AuthContext.jsx` (`export const AuthProvider`, `export const useAuth`) and `firebase.js` (`export { auth, db, loginWithGoogle, logout }`)
- `supabaseClient.js` uses a named export: `export const supabase`

**Barrel Files:**
- None. No `index.js` files anywhere in `src/`.

## Inline Sub-Components

A recurring pattern is defining small render-only components as `const` inside a parent file or even inside the parent component function:

```jsx
// Defined at file scope in DashboardPage.jsx, DocumentsPage.jsx
const Icons = {
  Bell: () => <svg ...>,
  Close: () => <svg ...>,
};

// Defined inside component body in DashboardPage.jsx
const Card = ({ to, title, ... }) => (
  <Link ...>...</Link>
);
```

Sub-components defined inside the parent render function (like `Card` in `DashboardPage`) will be recreated on every render — this is a known performance anti-pattern in this codebase.

## Environment Variable Convention

- Vite env vars accessed via `import.meta.env.VITE_*` prefix:
  - `import.meta.env.VITE_FIREBASE_API_KEY`
  - `import.meta.env.VITE_GEMINI_API_KEY`
- Serverless API functions use `process.env.*` (Node.js convention):
  - `process.env.FIREBASE_PROJECT_ID`, `process.env.RESEND_API_KEY`

---

*Convention analysis: 2026-04-04*
