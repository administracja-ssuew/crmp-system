---
plan: "1.2"
phase: 1
wave: 2
depends_on:
  - "1.1"
files_modified:
  - api/approve-request.js
requirements:
  - EMAIL-01
  - EMAIL-02
autonomous: true

must_haves:
  truths:
    - "approve-request.js sends from FROM (not 'onboarding@resend.dev')"
    - "Approval email greets user by name with Polish onboarding content"
    - "Email body includes numbered login steps and a CTA button to cra-system.vercel.app"
    - "User-supplied name is passed through esc() before HTML interpolation"
  artifacts:
    - path: "api/approve-request.js"
      provides: "Approval handler with full onboarding email body"
      contains: "import { FROM, emailShell, ctaButton, esc } from './_email.js'"
  key_links:
    - from: "api/approve-request.js"
      to: "api/_email.js"
      via: "named ESM import"
      pattern: "from '\\.\\/\\_email\\.js'"
    - from: "emailShell() call"
      to: "resend.emails.send html field"
      via: "template literal return value"
      pattern: "html: emailShell\\("
---

# Plan 1.2: Approval Onboarding Email

## Goal

Rewrite the email body in `api/approve-request.js` to a full Polish onboarding message that welcomes the new member, explains CRA, walks through the Google login process, and links to the system — using the shared `emailShell()` and `ctaButton()` helpers from Plan 1.1.

## Tasks

<task id="1.2.1">
<title>Rewrite approve-request.js email to full Polish onboarding template</title>

<read_first>
- api/approve-request.js (current file — read before touching anything)
- api/_email.js (confirm FROM, emailShell, ctaButton, esc exports exist — created in Plan 1.1)
- .planning/phases/01-email-fix/01-RESEARCH.md (Polish content spec, HTML structure, esc() rationale)
</read_first>

<action>
Rewrite `api/approve-request.js`. The Firebase Admin initialisation block, Firestore writes, and error handling are UNCHANGED. Only the `resend.emails.send()` call changes.

Make two edits:

**Edit 1 — Add import at the top of the file (after existing imports):**

```js
import { FROM, emailShell, ctaButton, esc } from './_email.js';
```

**Edit 2 — Replace the entire `resend.emails.send({...})` call (currently lines 34–47) with:**

```js
await resend.emails.send({
  from: FROM,
  to: email,
  subject: '✅ Dostęp do CRA przyznany!',
  html: emailShell('Dostęp przyznany — CRA', `
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${esc(name)}!</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 12px;">
      Twój wniosek o dostęp do systemu CRA został <strong>zatwierdzony</strong>.
      Witamy Cię w gronie aktywnych członków Samorządu Studentów UEW!
    </p>

    <h3 style="color:#4f46e5;font-size:16px;margin:24px 0 8px;">Czym jest CRA?</h3>
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">
      CRA (Centralny Rejestr Administracyjny) to wewnętrzna platforma Samorządu Studentów
      Uniwersytetu Ekonomicznego we Wrocławiu. Znajdziesz tu katalog sprzętu i rezerwacje,
      rejestr stanowisk, dokumenty organizacyjne oraz mapę kampusu — wszystko w jednym miejscu.
    </p>

    <h3 style="color:#4f46e5;font-size:16px;margin:24px 0 8px;">Jak się zalogować?</h3>
    <ol style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
      <li>Wejdź na stronę: <a href="https://cra-system.vercel.app"
          style="color:#4f46e5;">cra-system.vercel.app</a></li>
      <li>Kliknij przycisk <strong>„Zaloguj się przez Google"</strong></li>
      <li>Wybierz swoje konto Google przypisane do organizacji</li>
    </ol>

    ${ctaButton('Przejdź do CRA →', 'https://cra-system.vercel.app')}

    <p style="color:#64748b;font-size:14px;margin-top:24px;">
      Do zobaczenia w systemie!<br>
      <strong>Samorząd Studentów UEW</strong>
    </p>
  `),
});
```

Important notes:
- `esc(name)` wraps the user-supplied name — required because `name` comes from `req.body` and could contain HTML characters.
- `email` in `to: email` does NOT need escaping — Resend handles the `to` field as a plain string address, not interpolated into HTML.
- The subject line emoji (`✅`) is preserved — matches existing style and is intentional.
- Do NOT change anything above or below the `resend.emails.send()` call: the Firebase Admin init block, Firestore writes, `return res.status(200)`, and `catch` block all stay identical to current code.
- The template literal passed to `emailShell` as the second argument starts with a backtick — the outer `emailShell(...)` call is inside the `html:` field of the send object.
</action>

<acceptance_criteria>
- [ ] `api/approve-request.js` contains `import { FROM, emailShell, ctaButton, esc } from './_email.js'`
- [ ] `api/approve-request.js` contains `from: FROM` (not `from: 'onboarding@resend.dev'`)
- [ ] `api/approve-request.js` does NOT contain `onboarding@resend.dev`
- [ ] `api/approve-request.js` contains `html: emailShell(`
- [ ] `api/approve-request.js` contains `esc(name)` (user input is escaped)
- [ ] `api/approve-request.js` contains `ctaButton('Przejdź do CRA →', 'https://cra-system.vercel.app')`
- [ ] `api/approve-request.js` contains `Jak się zalogować?` (login steps section present)
- [ ] `api/approve-request.js` contains `Czym jest CRA?` (CRA description section present)
- [ ] `api/approve-request.js` still contains `db.collection('authorized_users').add(` (Firebase write unchanged)
- [ ] `api/approve-request.js` still contains `db.collection('access_requests').doc(requestId).update({ status: 'approved' })` (status update unchanged)
</acceptance_criteria>
</task>

## Verification

### Must-Haves
- [ ] No occurrence of `onboarding@resend.dev` in `api/approve-request.js` — confirmed by: `grep "onboarding@resend.dev" api/approve-request.js` returns nothing
- [ ] Import line present: `grep "from './_email.js'" api/approve-request.js` returns the import
- [ ] `esc(name)` present: `grep "esc(name)" api/approve-request.js` returns a match
- [ ] `html: emailShell(` present: `grep "emailShell(" api/approve-request.js` returns a match
- [ ] Polish login steps present: `grep "Jak się zalogować" api/approve-request.js` returns a match

### Should-Haves
- [ ] `ctaButton` call uses exact URL `https://cra-system.vercel.app`
- [ ] CRA description paragraph mentions "katalog sprzętu", "rejestr stanowisk", "mapę kampusu"
- [ ] Closing line "Do zobaczenia w systemie!" is present
