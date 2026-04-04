---
plan: "1.3"
phase: 1
wave: 2
depends_on:
  - "1.1"
files_modified:
  - api/reject-request.js
requirements:
  - EMAIL-01
  - EMAIL-03
autonomous: true

must_haves:
  truths:
    - "reject-request.js sends from FROM (not 'onboarding@resend.dev')"
    - "Rejection email uses emailShell() — same visual structure as approval email"
    - "Body tone is polite and provides admin contact address"
    - "User-supplied name is passed through esc() before HTML interpolation"
  artifacts:
    - path: "api/reject-request.js"
      provides: "Rejection handler with shell-wrapped Polish email body"
      contains: "import { FROM, emailShell, esc } from './_email.js'"
  key_links:
    - from: "api/reject-request.js"
      to: "api/_email.js"
      via: "named ESM import"
      pattern: "from '\\.\\/\\_email\\.js'"
    - from: "emailShell() call"
      to: "resend.emails.send html field"
      via: "template literal return value"
      pattern: "html: emailShell\\("
---

# Plan 1.3: Rejection Email Redesign

## Goal

Rewrite the email body in `api/reject-request.js` to use the shared `emailShell()` wrapper, giving it the same visual structure as the approval email while keeping its content short and polite.

## Tasks

<task id="1.3.1">
<title>Rewrite reject-request.js email to use emailShell() with Polish body</title>

<read_first>
- api/reject-request.js (current file — read before touching anything)
- api/_email.js (confirm FROM, emailShell, esc exports — created in Plan 1.1)
- .planning/phases/01-email-fix/01-RESEARCH.md (EMAIL-03 spec: rejection body Polish text, tone guidance)
</read_first>

<action>
Rewrite `api/reject-request.js`. The Firebase Admin initialisation block, the Firestore status update, and the error handling are UNCHANGED. Only the `resend.emails.send()` call changes.

Make two edits:

**Edit 1 — Add import at the top of the file (after existing imports):**

```js
import { FROM, emailShell, esc } from './_email.js';
```

Note: `ctaButton` is NOT imported here — the rejection email has no CTA button (the applicant is not directed to the system).

**Edit 2 — Replace the entire `resend.emails.send({...})` call (currently lines 28–38) with:**

```js
await resend.emails.send({
  from: FROM,
  to: email,
  subject: '❌ Wniosek o dostęp do CRA — odrzucony',
  html: emailShell('Wniosek odrzucony — CRA', `
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${esc(name)},</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 12px;">
      Twój wniosek o dostęp do systemu CRA nie został zatwierdzony.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">
      Jeśli masz pytania lub uważasz, że to pomyłka, skontaktuj się z administratorem:
      <a href="mailto:administracja@samorzad.ue.wroc.pl"
         style="color:#4f46e5;">administracja@samorzad.ue.wroc.pl</a>
    </p>
    <p style="color:#64748b;font-size:14px;margin-top:24px;">
      <strong>Samorząd Studentów UEW</strong>
    </p>
  `),
});
```

Important notes:
- `esc(name)` wraps the user-supplied name — same security rationale as in Plan 1.2.
- The subject line emoji (`❌`) is preserved — matches existing style and is intentional.
- The greeting ends with a comma: `Cześć ${esc(name)},` — this matches the current reject-request.js style and differs from the approval email which uses `!`. Both are correct for their context.
- Do NOT change anything above or below the `resend.emails.send()` call: the Firebase Admin init block, the Firestore `update({ status: 'rejected' })` call, `return res.status(200)`, and `catch` block all stay identical to current code.
- Only three exports from `_email.js` are needed here: `FROM`, `emailShell`, `esc`. Do not import `ctaButton` if it is not used — unused imports will cause lint warnings.
</action>

<acceptance_criteria>
- [ ] `api/reject-request.js` contains `import { FROM, emailShell, esc } from './_email.js'`
- [ ] `api/reject-request.js` contains `from: FROM` (not `from: 'onboarding@resend.dev'`)
- [ ] `api/reject-request.js` does NOT contain `onboarding@resend.dev`
- [ ] `api/reject-request.js` contains `html: emailShell(`
- [ ] `api/reject-request.js` contains `esc(name)` (user input is escaped)
- [ ] `api/reject-request.js` contains `administracja@samorzad.ue.wroc.pl` (contact address preserved)
- [ ] `api/reject-request.js` contains `nie został zatwierdzony` (rejection phrasing present)
- [ ] `api/reject-request.js` still contains `db.collection('access_requests').doc(requestId).update({ status: 'rejected' })` (Firestore update unchanged)
</acceptance_criteria>
</task>

## Verification

### Must-Haves
- [ ] No occurrence of `onboarding@resend.dev` in `api/reject-request.js` — confirmed by: `grep "onboarding@resend.dev" api/reject-request.js` returns nothing
- [ ] Import line present: `grep "from './_email.js'" api/reject-request.js` returns the import
- [ ] `esc(name)` present: `grep "esc(name)" api/reject-request.js` returns a match
- [ ] `html: emailShell(` present: `grep "emailShell(" api/reject-request.js` returns a match
- [ ] Admin contact address preserved: `grep "administracja@samorzad.ue.wroc.pl" api/reject-request.js` returns a match

### Should-Haves
- [ ] `ctaButton` is NOT imported (rejection email has no CTA): `grep "ctaButton" api/reject-request.js` returns nothing
- [ ] Visual structure matches approval email (both use `emailShell()` — parity is structural, not content)
