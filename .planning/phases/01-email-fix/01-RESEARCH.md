# Phase 1: Email Fix — Research

**Researched:** 2026-04-04
**Domain:** Resend transactional email, Vercel serverless functions (frameworkless ESM)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EMAIL-01 | Change `from` in all three api/ handlers from `onboarding@resend.dev` to a verified custom domain address | Shared `FROM` constant in `api/_email.js`, consumed by all three handlers; domain set via `RESEND_FROM_EMAIL` env var |
| EMAIL-02 | Approval email: full onboarding block — welcome, CRA description, Google login steps, system link | Complete HTML template with inline styles designed for this phase; content structure defined in Polish Onboarding section below |
| EMAIL-03 | Rejection email visually and tonally consistent with approval email | Shared `emailShell()` wrapper in `_email.js` makes structural parity automatic; rejection body is a simpler variant of the same shell |
</phase_requirements>

---

## Summary

**The email problem is straightforward: three files, each with a hardcoded sandbox sender address, and two of them with thin HTML bodies.** The fix requires one shared helper module and two rewritten HTML templates.

The current codebase sends all emails from `onboarding@resend.dev` — Resend's testing domain, which bypasses domain verification but is rejected by many real inboxes (or silently filtered as spam) when the recipient is not on Resend's sandbox allowlist. Switching to a verified custom domain is a Resend dashboard action (outside code) plus a single code change across three handlers.

The three API handlers (`approve-request.js`, `reject-request.js`, `request-access.js`) are standalone ESM files with no shared utilities. Each duplicates the Firebase Admin SDK initialisation block, and each hardcodes the sender address independently. The plan to introduce `api/_email.js` as a shared helper is the correct architectural move: Vercel's documented convention is that files prefixed with `_` inside `api/` are not turned into serverless function endpoints, but can be imported freely by sibling files using relative ESM imports.

Plain HTML template strings are the right choice for this codebase — no new dependencies, no build step, works identically in Vercel's Node.js serverless runtime, and the email bodies are short enough that maintainability is not a concern. React Email would add a dependency and a compilation step for no material gain at this scale.

**Primary recommendation:** Create `api/_email.js` with the `FROM` constant and an `emailShell(title, bodyHtml)` helper. Rewrite approve and reject bodies using that shell. Swap the sender in all three files.

---

## Technical Approach

### Current state — what needs changing

| File | From line | Change needed |
|------|-----------|---------------|
| `api/approve-request.js` | line 35: `from: 'onboarding@resend.dev'` | Use `FROM` from `_email.js`; replace HTML body with full onboarding template |
| `api/reject-request.js` | line 29: `from: 'onboarding@resend.dev'` | Use `FROM`; wrap existing content in shared shell |
| `api/request-access.js` | lines 46 and 69: both `'onboarding@resend.dev'` | Use `FROM` only (two sends — admin notification + applicant confirmation); admin notification body is already adequate |

### Plan execution order

- Plans 1.1 and 1.2 can run in parallel (as noted in ROADMAP.md): 1.1 creates the helper, 1.2 rewrites the approval body — neither blocks the other.
- Plan 1.3 depends on 1.1 (imports the shell).
- Plan 1.4 is a two-line swap that is independent of all others.

---

## Shared Helper Pattern

### File: `api/_email.js`

**Why underscore prefix works:** Vercel's documented convention (confirmed in official GitHub discussion vercel/vercel#4983) states that files and directories starting with `_` inside `api/` are excluded from being turned into serverless function endpoints. They can be imported by sibling handlers using standard relative ESM imports.

**Confirmed import pattern for ESM modules in the same directory:**

```js
// In api/approve-request.js
import { FROM, emailShell } from './_email.js';
```

The existing handlers already use ESM (`import`/`export default`) and the project `package.json` has `"type": "module"`, so no module-system changes are needed.

### What `api/_email.js` should export

```js
// api/_email.js

// FROM address — read from env var, fall back to a placeholder so the
// handler fails loudly at deploy time if the env var is missing.
export const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

/**
 * Wraps a content block in the standard SSUEW email shell.
 * @param {string} title    — Preheader / heading text (shown in inbox preview)
 * @param {string} bodyHtml — Inner HTML for the email body (paragraphs, lists, button)
 * @returns {string}        — Complete HTML string ready for resend.emails.send()
 */
export function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">
              Samorząd Studentów UEW
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:16px 32px;text-align:center;">
            <span style="color:#94a3b8;font-size:12px;">
              Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu — System CRA
            </span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a CTA button.
 * @param {string} href  — Destination URL
 * @param {string} label — Button text
 * @returns {string}
 */
export function ctaButton(href, label) {
  return `<a href="${href}"
     style="display:inline-block;background:#4f46e5;color:#ffffff;
            padding:12px 24px;border-radius:8px;text-decoration:none;
            font-weight:bold;font-size:16px;margin-top:24px;">
    ${label}
  </a>`;
}
```

**Design decisions:**
- Table-based layout (outer wrapper table, inner content table) — maximum email client compatibility. Confirmed as standard practice across multiple HTML email sources (2024–2026).
- Inline styles everywhere — `<style>` blocks are stripped by Gmail and Outlook. No external CSS.
- `font-family: Arial, Helvetica, sans-serif` — safe web-safe stack for all clients.
- Brand color `#4f46e5` — already used in existing email buttons in all three handlers.
- `border-radius` on cards will be ignored by Outlook (uses VML), which is acceptable for an internal student org tool.

---

## HTML Email Template Strategy

**Decision: Plain HTML template strings in `api/_email.js`. Do not use React Email.**

### Why plain HTML wins for this project

| Factor | Plain HTML | React Email |
|--------|-----------|-------------|
| New dependencies | 0 | `@react-email/components`, `@react-email/render` |
| Build step needed | No | Yes (render to HTML string at send time) |
| Works in Vercel Node.js runtime | Yes (native) | Yes, but adds ~200ms cold-start overhead for render |
| Maintenance burden at 3 templates | Low | Adds meaningful overhead |
| Inline style enforcement | Manual (but trivial) | Handled automatically |
| Live preview server | No | Yes (not relevant for serverless-only workflow) |

React Email is worth the tradeoff when managing 10+ templates. For three short transactional emails, the build overhead and additional dependency outweigh the DX gains. The project has no existing React Email setup.

**Inline style requirement (HIGH confidence):** Gmail strips `<style>` blocks. All critical layout and typography styles must be in `style=""` attributes. This is confirmed by current email client compatibility data (2024–2026 sources).

**Table layout requirement (HIGH confidence):** Outlook does not support CSS Flexbox or Grid for email layouts. Table-based column structure is still required for reliable multi-client rendering. For this project's simple single-column layout, a single centered table is sufficient and safe.

---

## Polish Onboarding Email Content

### EMAIL-02 — Approval / onboarding email (`approve-request.js`)

**Purpose:** Welcome the new member, explain what CRA is, guide first login, link to the system.

**Tone:** Friendly but professional. Use "Cześć [imię]" opener (matches current style). Use "Ty" forms (direct address), not formal "Pan/Pani". Consistent with the existing partial content.

**Recommended structure:**

```
1. Greeting:           "Cześć [name]!"
2. Approval news:      One sentence — access granted, membership confirmed.
3. What is CRA:        2–3 sentences. Central Administrative Register for SSUEW.
                       Access to equipment catalog, stands roster, documents, campus map.
4. How to log in:      Numbered steps:
                         1. Wejdź na stronę: https://cra-system.vercel.app
                         2. Kliknij "Zaloguj się przez Google"
                         3. Wybierz konto Google przypisane do organizacji
5. CTA button:         "Przejdź do CRA →" → https://cra-system.vercel.app
6. Closing:            "Do zobaczenia w systemie!"
                       "Samorząd Studentów UEW"
```

**Polish body text (ready to use):**

```html
<h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${name}!</h2>
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

<!-- CTA button via ctaButton() helper -->

<p style="color:#64748b;font-size:14px;margin-top:24px;">
  Do zobaczenia w systemie!<br>
  <strong>Samorząd Studentów UEW</strong>
</p>
```

### EMAIL-03 — Rejection email (`reject-request.js`)

**Purpose:** Inform the applicant politely. Provide a contact. Match the visual shell.

**Tone:** Neutral, polite. No aggressive language. Short.

**Recommended structure:**

```
1. Greeting:   "Cześć [name],"
2. News:       One sentence — request not approved at this time.
3. Next step:  Contact the admin email for questions.
4. Closing:    "Samorząd Studentów UEW"
```

**Polish body text (ready to use):**

```html
<h2 style="color:#1e293b;font-size:22px;margin:0 0 16px;">Cześć ${name},</h2>
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
```

**Note on subject lines:** The current emoji-prefixed subjects (`✅`, `❌`) are fine for internal org email. No change needed to subject lines — only the `from` address and body.

---

## Environment Variables

### Recommended pattern

Add one new server-side environment variable:

| Variable | Value | Where set |
|----------|-------|-----------|
| `RESEND_FROM_EMAIL` | `noreply@cra.samorzad.ue.wroc.pl` (or whatever domain is verified in Resend) | Vercel dashboard → Project → Settings → Environment Variables |

**In `api/_email.js`:**

```js
export const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
```

The fallback to `'noreply@example.com'` is intentional: if the env var is missing, Resend will reject the send (domain not verified), producing a clear error in Vercel function logs rather than silently sending from the sandbox address.

### Why a dedicated env var (not hardcoding the domain in code)

- A single edit in the Vercel dashboard changes the sender domain for all three handlers simultaneously.
- The domain address may change if the organisation changes its email domain.
- Consistent with the existing `RESEND_API_KEY` pattern already in the codebase.
- No code change required if the domain is updated post-deploy.

### Existing env vars (no change needed)

`RESEND_API_KEY` is already used in all three handlers via `process.env.RESEND_API_KEY`. The `new Resend(...)` initialisation pattern does not need to move into `_email.js` — each handler initialises its own client. This keeps the handlers independent and avoids shared state across serverless invocations.

**Domain verification:** This is a Resend dashboard + DNS action. The user must:
1. Go to Resend dashboard → Domains → Add Domain
2. Add the required DNS records (MX, SPF, DKIM, DMARC) at their DNS provider
3. Wait for verification (usually minutes to hours)
4. Set `RESEND_FROM_EMAIL` in Vercel with a verified address under that domain

This is out of scope for code changes but is a prerequisite for EMAIL-01 to work in production.

---

## Gotchas & Risks

### Gotcha 1: `from` display name format
**What:** Resend supports friendly name format: `'Samorząd Studentów UEW <noreply@yourdomain.com>'`. Some email clients display only the display name, some show both.
**Risk:** If the display name contains non-ASCII characters (e.g., "ą", "ó"), some legacy SMTP relays may mishandle it.
**Mitigation:** Use ASCII in the display name portion, or use `'SSUEW CRA <noreply@yourdomain.com>'`. The Polish characters in body HTML are fine — it's specifically the `from` header that can be sensitive. Test with the actual domain before committing to a display name.

### Gotcha 2: Vercel cold-start and shared module imports
**What:** Each Vercel serverless function is bundled independently. `api/_email.js` is not a shared in-memory singleton — it is bundled into each function separately.
**Risk:** None functionally. The `FROM` constant is re-evaluated from `process.env` on each invocation, which is correct behaviour.
**Note:** No global mutable state in `_email.js`, so cross-invocation contamination is impossible.

### Gotcha 3: `RESEND_FROM_EMAIL` not set in local dev
**What:** Vercel CLI local dev (`vercel dev`) reads `.env.local` or `.env`. The project uses `.env.local` for client-side VITE_ vars.
**Risk:** Running `vercel dev` locally without setting `RESEND_FROM_EMAIL` will cause `FROM` to be `'noreply@example.com'`, and Resend will reject the send.
**Mitigation:** Add `RESEND_FROM_EMAIL=your-address@yourdomain.com` to `.env.local` for local testing. Note: `.env.local` is already gitignored.

### Gotcha 4: Two sends in `request-access.js`
**What:** `request-access.js` calls `resend.emails.send()` twice — once to the admin (`administracja@samorzad.ue.wroc.pl`) and once to the applicant. Both currently use `onboarding@resend.dev`.
**Risk:** Easy to miss the second send on line 69 when updating line 46.
**Mitigation:** Plan 1.4 must update both occurrences. Using `FROM` from `_email.js` handles both automatically since they share the same constant.

### Gotcha 5: HTML entity encoding in template literals
**What:** The `emailShell` function uses template literals. If `bodyHtml` or `title` contains user-supplied content (e.g., `name` from `req.body`), unescaped `<`, `>`, `&` characters would break the HTML and could allow HTML injection.
**Risk:** MEDIUM — `name` and `email` from `req.body` are interpolated directly into HTML in the current code. A user submitting `name = "<script>alert(1)</script>"` would inject into the email HTML.
**Mitigation:** Add a minimal escape helper in `_email.js`:
```js
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```
Use `esc(name)` wherever user input is interpolated. This is a security improvement the plan should include.

### Gotcha 6: `firebase-admin` version risk (existing, not new)
**What:** CONCERNS.md notes that `firebase-admin@^10.3.0` may be incompatible with Vercel's Node 20 runtime. This is a pre-existing issue, not introduced by Phase 1.
**Risk:** LOW for Phase 1 — the email handlers already work despite this; Phase 1 does not change the Firebase Admin initialisation pattern.
**Action:** Document in the plan as a known risk; do not fix in Phase 1.

---

## Recommendation

**Create `api/_email.js` with three exports: `FROM`, `emailShell()`, `ctaButton()`, and `esc()`.** Update all three handlers to import `FROM` and use `esc()` around user inputs. Rewrite the approval body using `emailShell()` with the Polish onboarding content defined above. Rewrite the rejection body using the same shell with the shorter body. The `request-access.js` admin and confirmation emails need only the sender swap — their existing HTML bodies are adequate.

The four plans map cleanly to four atomic commits:
- 1.1 — Create `api/_email.js` (no handler changes)
- 1.2 — Rewrite `approve-request.js` email body (imports from 1.1)
- 1.3 — Rewrite `reject-request.js` email body (imports from 1.1)
- 1.4 — Swap sender in `request-access.js` (imports `FROM` from 1.1)

Plans 1.1 and 1.2 can be written in parallel since 1.2 only needs the `FROM` constant and the shell function which are defined in 1.1 before 1.2 imports them.

---

## Standard Stack

### Core (no additions needed)
| Library | Version (installed) | Purpose |
|---------|-------------------|---------|
| `resend` | 6.9.4 (latest: 6.10.0) | Email send API — already installed |

**No new npm packages required for this phase.** Plain HTML strings are used; React Email is explicitly not adopted.

**Version note:** Latest Resend is 6.10.0 vs installed 6.9.4. The API used in this phase (`resend.emails.send()`) is stable between these versions. No upgrade required.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Email delivery | Custom SMTP integration | Resend (already installed) |
| HTML-to-text fallback | Manual text generation | Resend auto-generates plain text from `html` if `text` is omitted |
| Email template engine | Handlebars / Mustache | Template literals with `emailShell()` helper are sufficient for 3 short templates |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is code-only changes to existing serverless functions. No new external services, CLIs, or runtimes are introduced. Resend is already installed and authenticated via `RESEND_API_KEY`.

**Prerequisite outside code (must be done by user before testing):**
- Verify a custom domain in the Resend dashboard
- Add `RESEND_FROM_EMAIL` to Vercel environment variables

---

## Sources

### Primary (HIGH confidence)
- Vercel GitHub Discussion vercel/vercel#4983 — confirms underscore prefix convention for non-endpoint files in `api/` directory
- Resend official docs (resend.com/docs/send-with-nodejs) — `emails.send()` API, `from` friendly name format, `html` field, auto `text` generation
- npm registry — verified resend@6.9.4 installed, 6.10.0 current

### Secondary (MEDIUM confidence)
- HTML email client compatibility data (designmodo.com, emailonacid.com) — inline styles required, table layout for Outlook
- WebSearch: Vercel ESM shared module patterns — corroborated by official GitHub discussion

### Tertiary (LOW confidence — not used for critical decisions)
- Community blog posts on React Email vs plain HTML tradeoffs

---

## Metadata

**Confidence breakdown:**
- Shared helper (`_email.js`) pattern: HIGH — confirmed by official Vercel docs/discussion
- Resend API (`emails.send`, `from` format): HIGH — official Resend docs
- Plain HTML over React Email decision: HIGH — justified by project constraints (3 templates, no existing setup, no build step)
- Polish content structure: MEDIUM — based on standard transactional email patterns; final Polish copy should be reviewed by a native speaker from SSUEW
- HTML injection risk (Gotcha 5): MEDIUM — pattern visible in existing code; standard web security knowledge

**Research date:** 2026-04-04
**Valid until:** 2026-07-04 (Resend API is stable; Vercel serverless conventions change slowly)

---

## RESEARCH COMPLETE
