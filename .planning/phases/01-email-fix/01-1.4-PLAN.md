---
plan: "1.4"
phase: 1
wave: 2
depends_on:
  - "1.1"
files_modified:
  - api/request-access.js
requirements:
  - EMAIL-01
autonomous: true

must_haves:
  truths:
    - "request-access.js has zero occurrences of 'onboarding@resend.dev'"
    - "Both resend.emails.send() calls in request-access.js use from: FROM"
    - "User-supplied name is passed through esc() in the confirmation email body"
  artifacts:
    - path: "api/request-access.js"
      provides: "Access request handler with fixed sender in both email sends"
      contains: "import { FROM, esc } from './_email.js'"
  key_links:
    - from: "api/request-access.js"
      to: "api/_email.js"
      via: "named ESM import"
      pattern: "from '\\.\\/\\_email\\.js'"
---

# Plan 1.4: request-access.js Sender Fix

## Goal

Swap both hardcoded `'onboarding@resend.dev'` sender addresses in `api/request-access.js` for the shared `FROM` constant, and wrap user-supplied name in `esc()` in the confirmation email body.

## Tasks

<task id="1.4.1">
<title>Replace both onboarding@resend.dev occurrences in request-access.js with FROM</title>

<read_first>
- api/request-access.js (current file — read in full before touching anything; two send calls on lines 45 and 68)
- api/_email.js (confirm FROM and esc exports — created in Plan 1.1)
- .planning/phases/01-email-fix/01-RESEARCH.md (Gotcha 4: two sends, easy to miss the second one on line 69)
</read_first>

<action>
Make three targeted edits to `api/request-access.js`. The Firebase Admin init block, Firestore write, all validation logic, and the email HTML bodies are UNCHANGED except where noted below.

**Edit 1 — Add import at the top of the file (after existing imports, before the Firebase init block):**

```js
import { FROM, esc } from './_email.js';
```

Note: `emailShell` and `ctaButton` are NOT imported here. The existing HTML bodies in request-access.js are already adequate for the admin notification and applicant confirmation — this plan only fixes the sender address (EMAIL-01). Full body rewrites for these emails are out of scope for Phase 1.

**Edit 2 — Replace `from` in the FIRST `resend.emails.send()` call (admin notification, currently line 46):**

Change:
```js
from: 'onboarding@resend.dev',
```
To:
```js
from: FROM,
```

This is the admin notification email sent to `'administracja@samorzad.ue.wroc.pl'`.

**Edit 3 — Replace `from` in the SECOND `resend.emails.send()` call (applicant confirmation, currently line 69):**

Change:
```js
from: 'onboarding@resend.dev',
```
To:
```js
from: FROM,
```

This is the confirmation email sent to the applicant's `email` address.

**Edit 4 — Wrap name in esc() in the applicant confirmation email HTML:**

In the second send's `html` field, the current body contains:
```js
<p>Cześć <b>${name}</b>,</p>
```

Change to:
```js
<p>Cześć <b>${esc(name)}</b>,</p>
```

The admin notification email's HTML contains `${name}`, `${email}`, `${phone}`, `${index}`, `${organization}`, `${justification}` — all from `req.body`. Wrap ALL of them with `esc()`:
- `${name}` → `${esc(name)}`
- `${email}` → `${esc(email)}`
- `${phone || '—'}` → `${esc(phone || '—')}`
- `${index || '—'}` → `${esc(index || '—')}`
- `${organization}` → `${esc(organization)}`
- `${justification}` → `${esc(justification)}`

This is the same security fix as Plans 1.2 and 1.3: user-supplied strings must not be injected raw into HTML.

All other content (subject lines, HTML structure, table layout in admin email, confirmation message text, Firestore write, validation block) stays exactly as it is in the current file.
</action>

<acceptance_criteria>
- [ ] `api/request-access.js` contains `import { FROM, esc } from './_email.js'`
- [ ] `api/request-access.js` does NOT contain `onboarding@resend.dev` (zero occurrences — both replaced)
- [ ] `grep -c "from: FROM" api/request-access.js` returns `2` (both send calls updated)
- [ ] `api/request-access.js` contains `esc(name)` in at least one place
- [ ] `api/request-access.js` contains `esc(organization)` (admin email user inputs escaped)
- [ ] `api/request-access.js` contains `esc(justification)` (admin email user inputs escaped)
- [ ] `api/request-access.js` still contains `db.collection('access_requests').add(` (Firestore write unchanged)
- [ ] `api/request-access.js` still contains validation block `if (!name || !email || !organization || !justification)` (unchanged)
</acceptance_criteria>
</task>

## Verification

### Must-Haves
- [ ] Zero occurrences of `onboarding@resend.dev` in `request-access.js` — confirmed by: `grep "onboarding@resend.dev" api/request-access.js` returns nothing
- [ ] Exactly two `from: FROM` lines — confirmed by: `grep -c "from: FROM" api/request-access.js` outputs `2`
- [ ] Import line present: `grep "from './_email.js'" api/request-access.js` returns the import

### Should-Haves
- [ ] All six user-supplied fields in the admin email HTML are wrapped with `esc()`: name, email, phone, index, organization, justification
- [ ] `emailShell` is NOT imported (bodies are not rewritten in this plan — only sender fix + esc())

---

## Phase 1 Final Verification

After all four plans complete, run these checks across the entire `api/` directory:

```bash
# Must return zero results — no sandbox sender remains anywhere
grep -r "onboarding@resend.dev" api/

# Must return api/_email.js only — confirms all handlers import FROM
grep -r "from: FROM" api/

# Must confirm _email.js exists with all four exports
grep "^export" api/_email.js

# Must confirm all three handlers import from _email.js
grep "from './_email.js'" api/approve-request.js api/reject-request.js api/request-access.js
```

**Phase success criteria (all must be true):**
1. `grep -r "onboarding@resend.dev" api/` — returns no output
2. `api/_email.js` exports `FROM`, `esc`, `emailShell`, `ctaButton`
3. `api/approve-request.js` email body contains `Jak się zalogować?` and `Czym jest CRA?`
4. `api/reject-request.js` uses `emailShell()` matching visual structure of approval email
5. `grep -c "from: FROM" api/request-access.js` outputs `2`
