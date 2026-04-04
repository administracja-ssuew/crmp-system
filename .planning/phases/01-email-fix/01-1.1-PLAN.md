---
plan: "1.1"
phase: 1
wave: 1
depends_on: []
files_modified:
  - api/_email.js
requirements:
  - EMAIL-01
autonomous: true

must_haves:
  truths:
    - "api/_email.js exists and exports FROM, esc, emailShell, ctaButton"
    - "FROM reads from process.env.RESEND_FROM_EMAIL with fallback to 'noreply@example.com'"
    - "emailShell() returns a complete HTML document string with inline styles"
    - "ctaButton() returns an <a> tag styled as a button with background #4f46e5"
    - "esc() escapes &, <, >, \" characters to HTML entities"
  artifacts:
    - path: "api/_email.js"
      provides: "Shared email helper: FROM constant, esc(), emailShell(), ctaButton()"
      exports: ["FROM", "esc", "emailShell", "ctaButton"]
  key_links:
    - from: "api/_email.js"
      to: "process.env.RESEND_FROM_EMAIL"
      via: "FROM constant"
      pattern: "process\\.env\\.RESEND_FROM_EMAIL"
---

# Plan 1.1: Shared Email Helper

## Goal

Create `api/_email.js` — the single source of truth for the sender address and reusable HTML shell that all three transactional email handlers will import.

## Tasks

<task id="1.1.1">
<title>Create api/_email.js with FROM, esc, emailShell, ctaButton exports</title>

<read_first>
- api/approve-request.js (see current HTML pattern and brand color usage)
- api/reject-request.js (see current from address and HTML pattern)
- api/request-access.js (see current from address — two occurrences)
- .planning/phases/01-email-fix/01-RESEARCH.md (full helper spec and design rationale)
</read_first>

<action>
Create the file `api/_email.js` with exactly this content. The underscore prefix tells Vercel not to expose this file as a serverless endpoint — it is an importable helper only.

```js
// api/_email.js
// Shared email utilities for all Resend transactional email handlers.
// Imported by: approve-request.js, reject-request.js, request-access.js

/**
 * Verified sender address.
 * Set RESEND_FROM_EMAIL in Vercel environment variables to a domain that has
 * been verified in the Resend dashboard. Falls back to 'noreply@example.com'
 * so that a missing env var causes Resend to reject loudly (logged error)
 * rather than silently sending from the sandbox address.
 */
export const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

/**
 * Escapes user-supplied strings for safe HTML interpolation.
 * Prevents HTML injection when name/email from req.body is embedded in
 * the email body template literal.
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wraps a content block in the standard SSUEW email shell.
 * Uses table-based layout for Outlook compatibility.
 * All styles are inline — Gmail strips <style> blocks.
 * @param {string} title    — Shown in the header and inbox preview
 * @param {string} bodyHtml — Inner HTML for the email body
 * @returns {string}        — Complete HTML document string
 */
export function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
</head>
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
              Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu &bull; cra-system.vercel.app
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
 * Renders a CTA button as an inline-styled <a> tag.
 * @param {string} label — Button text
 * @param {string} href  — Destination URL
 * @returns {string}
 */
export function ctaButton(label, href) {
  return `<a href="${href}"
   style="display:inline-block;background:#4f46e5;color:#ffffff;
          padding:12px 24px;border-radius:8px;text-decoration:none;
          font-weight:bold;font-size:16px;margin-top:24px;">
  ${label}
</a>`;
}
```

Key decisions (from RESEARCH.md):
- `FROM` fallback is `'noreply@example.com'` — not the sandbox address, so Resend will reject and log clearly if `RESEND_FROM_EMAIL` is unset.
- `emailShell` signature is `(title, bodyHtml)` — title goes in both the `<title>` tag and is HTML-escaped there; bodyHtml is injected raw (callers must use `esc()` on user input within bodyHtml).
- `ctaButton` signature is `(label, href)` — label first, href second (matches natural reading order in call sites).
- Table-based layout: outer table sets background + centering, inner table is the 600px card with header/body/footer rows.
- No `<style>` block: Gmail strips them; all styles are `style=""` attributes.
</action>

<acceptance_criteria>
- [ ] File `api/_email.js` exists
- [ ] `api/_email.js` contains `export const FROM = process.env.RESEND_FROM_EMAIL`
- [ ] `api/_email.js` contains `export function esc(`
- [ ] `api/_email.js` contains `export function emailShell(`
- [ ] `api/_email.js` contains `export function ctaButton(`
- [ ] `api/_email.js` contains `.replace(/&/g, '&amp;')` (first esc replacement)
- [ ] `api/_email.js` contains `.replace(/</g, '&lt;')` (second esc replacement)
- [ ] `api/_email.js` contains `background:#4f46e5` (brand color present in at least one place)
- [ ] `api/_email.js` contains `cra-system.vercel.app` (footer link present)
- [ ] `api/_email.js` does NOT contain `onboarding@resend.dev`
- [ ] `api/_email.js` does NOT contain `export default` (this is a helper, not an endpoint)
</acceptance_criteria>
</task>

## Verification

### Must-Haves
- [ ] `api/_email.js` exists with all four named exports (`FROM`, `esc`, `emailShell`, `ctaButton`)
- [ ] `FROM` reads `process.env.RESEND_FROM_EMAIL` — confirmed by grep: `grep "RESEND_FROM_EMAIL" api/_email.js`
- [ ] No `export default` in the file — confirmed by grep: `grep "export default" api/_email.js` returns nothing
- [ ] `esc()` escapes all four characters: `&`, `<`, `>`, `"` — confirmed by reading the replace chain
- [ ] `emailShell` produces a complete HTML document (contains `<!DOCTYPE html>` and `</html>`)

### Should-Haves
- [ ] JSDoc comments on each export explain purpose, parameters, return type
- [ ] `api/_email.js` contains no Firebase or Resend SDK imports (it is a pure string-utility helper)
- [ ] Footer text matches: "Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu • cra-system.vercel.app"
