# Testing Patterns

**Analysis Date:** 2026-04-04

## Test Framework

**Runner:** None

No testing framework is installed or configured. The `package.json` contains no test runner (`jest`, `vitest`, `@testing-library/react`, `cypress`, `playwright`, etc.) in either `dependencies` or `devDependencies`. There is no `jest.config.*`, `vitest.config.*`, or any other test configuration file in the project root.

**Run Commands:**
```bash
# No test commands exist. package.json scripts:
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
```

## Test File Organization

**Test files:** None found. No `*.test.js`, `*.test.jsx`, `*.spec.js`, or `*.spec.jsx` files exist anywhere in the codebase.

**No test directory** (`__tests__/`, `tests/`, `test/`) exists under `src/` or project root.

## What Exists Instead of Tests

The project has no automated testing of any kind. All validation is manual or runtime-only:

**Runtime guards in production code:**
- Auth checks via `ProtectedRoute`, `AdminRoute`, `LogitechRoute` in `src/App.jsx`
- Role verification in `src/context/AuthContext.jsx` via Firestore lookup on every auth state change
- Blacklist check in `src/pages/VerificationPage.jsx` via Supabase query on mount
- Input validation using HTML `required` attributes on form fields
- Manual `if (!field.trim()) return` guards before submitting forms

**Error feedback:**
- `alert()` dialogs for user-facing errors (not assertions)
- `console.error()` for developer visibility of caught exceptions

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**Current state:** 0% automated test coverage across all files.

## Files That Would Benefit Most from Tests

Listed by risk and complexity:

**Critical business logic (no tests):**
- `src/context/AuthContext.jsx` — authentication and role resolution; failure here locks out all users
- `src/firebase.js` — `loginWithGoogle`, `logout` functions
- `src/pages/VerificationPage.jsx` — QR scan, session management, blacklist check (496 lines)
- `src/pages/AdminEquipmentPanel.jsx` — equipment issuance protocol, signature collection (826 lines)
- `src/pages/DocumentsPage.jsx` — document management, AI-assisted petition generation (1113 lines)
- `api/approve-request.js` — Firestore write + Resend email on user approval
- `api/reject-request.js` — Firestore write + Resend email on user rejection
- `api/request-access.js` — access request submission

**Utility functions with testable pure logic:**
- `formatDate()` in `src/pages/DashboardPage.jsx` — date formatting with edge cases
- `codeMatches()` in `src/pages/EquipmentPage.jsx` — QR code exact-match parsing
- Role-based visibility logic (`isAdmin`, `isLogitech`) scattered across multiple page components

## If Tests Were Added — Recommended Setup

**Recommended framework for this stack (React + Vite):**

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Vitest config to add to `vite.config.js`:**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
```

**Setup file (`src/test/setup.js`):**
```js
import '@testing-library/jest-dom';
```

**Naming convention to adopt:**
- Co-locate test files: `src/pages/DashboardPage.test.jsx` next to `src/pages/DashboardPage.jsx`
- Or use a `__tests__/` directory under `src/`

**Example test structure for a utility function:**
```js
// src/pages/DashboardPage.test.jsx
import { describe, it, expect } from 'vitest';

// extracted from DashboardPage.jsx for testability
describe('formatDate', () => {
  it('returns "Brak" for falsy input', () => {
    expect(formatDate(null)).toBe('Brak');
    expect(formatDate('')).toBe('Brak');
  });

  it('passes through "Dzisiaj" and "Wczoraj" unchanged', () => {
    expect(formatDate('Dzisiaj')).toBe('Dzisiaj');
    expect(formatDate('Wczoraj')).toBe('Wczoraj');
  });

  it('formats a valid ISO date string to Polish locale', () => {
    expect(formatDate('2026-04-04')).toBe('04.04.2026');
  });

  it('returns raw value for unparseable date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
```

**Example component test structure:**
```jsx
// src/pages/LoginPage.test.jsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LoginPage from './LoginPage';

// Mock dependencies
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ authError: null }),
}));
vi.mock('../firebase', () => ({
  loginWithGoogle: vi.fn(),
}));

describe('LoginPage', () => {
  it('renders the Google login button', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Zaloguj przez Google/i)).toBeInTheDocument();
  });

  it('shows access request link when authError is set', () => {
    vi.mocked(require('../context/AuthContext').useAuth).mockReturnValue({
      authError: 'Brak uprawnień.',
    });
    render(<LoginPage />);
    expect(screen.getByText(/Złóż wniosek o dostęp/i)).toBeInTheDocument();
  });
});
```

## Mocking Requirements (for future tests)

**What to mock:**
- `src/firebase.js` exports (`loginWithGoogle`, `logout`, `auth`, `db`) — Firebase SDK requires network
- `src/supabaseClient.js` export (`supabase`) — Supabase requires network
- `src/context/AuthContext.jsx` (`useAuth`) — simplify component tests that depend on auth state
- `fetch` calls — all Google Apps Script and external API calls in page components
- `import.meta.env` — Vite environment variables for API keys

**What NOT to mock:**
- Pure utility functions (`formatDate`, `codeMatches`) — test these directly
- React state logic inside components — use `@testing-library/react` to test behaviour, not internals

## Serverless API Testing

The three files in `api/` (`approve-request.js`, `reject-request.js`, `request-access.js`) are Vercel serverless functions. They have no tests.

To test them, use a handler-test pattern:
```js
// api/approve-request.test.js
import { vi, describe, it, expect } from 'vitest';

// Mock firebase-admin and resend before importing handler
vi.mock('firebase-admin/app', ...);
vi.mock('firebase-admin/firestore', ...);
vi.mock('resend', ...);

import handler from './approve-request.js';

describe('approve-request handler', () => {
  it('returns 405 for non-POST requests', async () => {
    const req = { method: 'GET' };
    const res = { status: vi.fn().mockReturnThis(), end: vi.fn() };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
```

---

*Testing analysis: 2026-04-04*
