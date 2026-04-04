---
status: human_needed
phase: 1
phase_name: Email Fix
verified: 2026-04-04
re_verification: false
human_verification:
  - test: "Trigger a real approval via the admin panel and confirm the email arrives from the custom domain (not onboarding@resend.dev), with full onboarding content visible in the inbox"
    expected: "Recipient sees Polish onboarding email with CRA description, numbered Google login steps, and CTA button; sender address matches RESEND_FROM_EMAIL env var"
    why_human: "Cannot verify RESEND_FROM_EMAIL is set and pointing to a Resend-verified domain without access to Vercel project settings and a live test send"
  - test: "Trigger a real rejection via the admin panel and confirm the rejection email arrives with the shared emailShell() visual structure (branded header, footer)"
    expected: "Recipient sees rejection email with indigo header bearing 'Samorząd Studentów UEW', polite Polish body, admin contact link, and branded footer"
    why_human: "Visual/layout parity between approval and rejection email must be confirmed by inspecting the rendered email in a real inbox; cannot test HTML rendering from code alone"
  - test: "Submit the access request form and confirm BOTH outgoing emails (admin notification and applicant confirmation) arrive from the custom domain"
    expected: "Admin receives table-formatted notification; applicant receives confirmation — both from the verified custom domain, not onboarding@resend.dev"
    why_human: "Two separate resend.emails.send() calls; actual delivery and sender display name must be confirmed in real inboxes"
---

# Verification: Phase 1 — Email Fix

**Phase Goal:** All three Resend-powered transactional emails send from a verified custom domain with consistent, complete Polish content
**Verified:** 2026-04-04
**Status:** HUMAN NEEDED — all automated code checks pass; live send verification required
**Re-verification:** No — initial verification

---

## Must-Haves Check

### Plan 1.1 — Shared Email Helper (`api/_email.js`)

| Check | Evidence | Status |
|-------|----------|--------|
| `api/_email.js` exists | File present at `api/_email.js` (93 lines) | PASS |
| Exports `FROM`, `esc`, `emailShell`, `ctaButton` | Lines 12, 21, 37, 85 — all four named exports present | PASS |
| `FROM` reads `process.env.RESEND_FROM_EMAIL` with fallback | Line 12: `export const FROM = process.env.RESEND_FROM_EMAIL \|\| 'noreply@example.com'` | PASS |
| `emailShell()` returns complete HTML document with inline styles | Returns `<!DOCTYPE html>` … `</html>` with all styles as `style=""` attributes, table-based layout | PASS |
| `ctaButton()` returns `<a>` styled with `background:#4f46e5` | Lines 85–91: `<a href="${href}" style="…background:#4f46e5;…">` | PASS |
| `esc()` escapes `&`, `<`, `>`, `"` | Lines 23–26: four `.replace()` chains for all four characters | PASS |
| No `export default` in `_email.js` | `grep "export default" api/_email.js` — not found | PASS |
| No `onboarding@resend.dev` in `_email.js` | Not present anywhere in file | PASS |
| Footer text: `cra-system.vercel.app` | Line 68: footer span contains `cra-system.vercel.app` | PASS |
| Brand color `#4f46e5` present | Lines 52, 87 — header background and ctaButton | PASS |

### Plan 1.2 — Approval Email (`api/approve-request.js`)

| Check | Evidence | Status |
|-------|----------|--------|
| Imports `FROM, emailShell, ctaButton, esc` from `./_email.js` | Line 4: exact import confirmed | PASS |
| `from: FROM` used (not `onboarding@resend.dev`) | Line 36: `from: FROM` | PASS |
| No `onboarding@resend.dev` in file | Not found by grep | PASS |
| `html: emailShell(` present | Line 39: `html: emailShell('Dostęp przyznany — CRA', ...)` | PASS |
| `esc(name)` wraps user-supplied name | Line 40: `Cześć ${esc(name)}!` | PASS |
| `ctaButton('Przejdź do CRA →', 'https://cra-system.vercel.app')` present | Line 61 | PASS |
| Section `Jak się zalogować?` present | Line 53 | PASS |
| Section `Czym jest CRA?` present | Line 46 | PASS |
| Firebase write `db.collection('authorized_users').add(` unchanged | Line 26 | PASS |
| Status update `update({ status: 'approved' })` unchanged | Line 32 | PASS |
| Closing line `Do zobaczenia w systemie!` present | Line 64 | PASS |

### Plan 1.3 — Rejection Email (`api/reject-request.js`)

| Check | Evidence | Status |
|-------|----------|--------|
| Imports `FROM, emailShell, esc` from `./_email.js` | Line 4: exact import confirmed | PASS |
| `from: FROM` used (not `onboarding@resend.dev`) | Line 30: `from: FROM` | PASS |
| No `onboarding@resend.dev` in file | Not found by grep | PASS |
| `html: emailShell(` present | Line 33: `html: emailShell('Wniosek odrzucony — CRA', ...)` | PASS |
| `esc(name)` wraps user-supplied name | Line 34: `Cześć ${esc(name)},` | PASS |
| Admin contact address `administracja@samorzad.ue.wroc.pl` present | Lines 40–41 | PASS |
| `nie został zatwierdzony` phrasing present | Line 36 | PASS |
| Firestore `update({ status: 'rejected' })` unchanged | Line 26 | PASS |
| `ctaButton` NOT imported (rejection has no CTA) | Not found in file — correct | PASS |

### Plan 1.4 — Sender Fix (`api/request-access.js`)

| Check | Evidence | Status |
|-------|----------|--------|
| Imports `FROM, esc` from `./_email.js` | Line 4: exact import confirmed | PASS |
| No `onboarding@resend.dev` in file | `grep -r "onboarding@resend.dev" api/` — not found anywhere | PASS |
| Exactly 2 `from: FROM` occurrences | `grep -c "from: FROM" api/request-access.js` → `2` | PASS |
| `esc(name)` used in applicant confirmation | Line 75: `Cześć <b>${esc(name)}</b>` | PASS |
| `esc(organization)` in admin email | Line 57: `${esc(organization)}` | PASS |
| `esc(justification)` in admin email | Line 58: `${esc(justification)}` | PASS |
| All other admin email fields escaped: email, phone, index | Lines 54–56 confirm `esc(email)`, `esc(phone \|\| '—')`, `esc(index \|\| '—')` | PASS |
| Firestore write `db.collection('access_requests').add(` unchanged | Lines 34–43 | PASS |
| Validation block `if (!name \|\| !email \|\| !organization \|\| !justification)` unchanged | Line 28 | PASS |
| `emailShell` NOT imported (bodies not rewritten in 1.4) | Not in import on line 4 — correct | PASS |

---

## Phase Success Criteria (from ROADMAP.md)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | No email uses `onboarding@resend.dev` as sender — all use verified custom domain | PASS (code) / HUMAN (live test) |
| 2 | Approval email has full onboarding block: welcome, CRA description, Google login walkthrough, working system link | PASS — all four blocks present in code |
| 3 | Rejection email matches approval email in visual structure (same HTML layout, consistent Polish) | PASS (code) / HUMAN (rendered check) |
| 4 | All three handlers share a single `from` constant — one edit changes all three | PASS — all import `FROM` from `api/_email.js` |

---

## Requirement Coverage

| ID | Description | Code Status | Notes |
|----|-------------|-------------|-------|
| EMAIL-01 | Replace `onboarding@resend.dev` with verified custom domain in all three handlers | SATISFIED | `FROM` constant from `_email.js` used in all three handlers; zero occurrences of sandbox address remain |
| EMAIL-02 | Approval email: full onboarding (welcome, CRA description, Google login steps, system link) | SATISFIED | All four required blocks present in `approve-request.js` lines 39–67 |
| EMAIL-03 | Rejection email visually and linguistically consistent with rest of system | SATISFIED (code) / NEEDS HUMAN (visual render) | Uses same `emailShell()` wrapper as approval; Polish phrasing is polite and consistent; visual parity requires inbox inspection |

Note: REQUIREMENTS.md marks EMAIL-03 as unchecked (`[ ]`) in the checkbox list despite marking it "Pending" in the Traceability table. The code implementation is complete — the checkbox should be updated after human verification of the rendered email.

---

## Anti-Patterns Found

No blockers or warnings found.

| File | Pattern Checked | Result |
|------|-----------------|--------|
| `api/_email.js` | `export default`, `onboarding@resend.dev`, TODO/FIXME | None found |
| `api/approve-request.js` | Raw `${name}` interpolation, sandbox sender | None found — `esc()` applied |
| `api/reject-request.js` | Raw `${name}` interpolation, sandbox sender | None found — `esc()` applied |
| `api/request-access.js` | Raw user-input interpolation, sandbox sender, missing second `from: FROM` | None found — all six fields escaped, both sends updated |

---

## Human Verification Required

### 1. Live Send — Approval Email

**Test:** Approve a pending access request in the admin panel
**Expected:** Recipient inbox shows sender from the custom verified domain (the value of `RESEND_FROM_EMAIL` in Vercel); email renders with indigo header "Samorząd Studentów UEW", Polish onboarding body with "Czym jest CRA?" and "Jak się zalogować?" sections, numbered Google login steps, a working CTA button linking to `https://cra-system.vercel.app`, and branded footer
**Why human:** `RESEND_FROM_EMAIL` must be set to a Resend-verified domain in Vercel environment variables; this cannot be confirmed from code inspection alone

### 2. Live Send — Rejection Email

**Test:** Reject a pending access request in the admin panel
**Expected:** Recipient inbox shows same branded header/footer as approval email; body contains polite Polish rejection text, admin contact link (`administracja@samorzad.ue.wroc.pl`), and no CTA button; sender is the custom domain
**Why human:** Visual/layout parity between the two emails must be confirmed in a real email client — HTML rendering differs across clients (Gmail, Outlook, Apple Mail)

### 3. Live Send — Access Request Submission (both emails)

**Test:** Submit the access request form as a new user
**Expected:** (a) Admin receives a table-formatted notification at `administracja@samorzad.ue.wroc.pl` from the custom domain; (b) Applicant receives a Polish confirmation email from the custom domain
**Why human:** Two separate email sends in one request; both must be confirmed delivered and showing the correct sender — this verifies the second `from: FROM` instance that is harder to spot

---

## Verdict

All code-level checks pass with zero gaps. The implementation is complete and correct:

- `api/_email.js` provides all four named exports (`FROM`, `esc`, `emailShell`, `ctaButton`) with no sandbox address and no default export.
- All three handlers import from `_email.js` and use `FROM` as the sender.
- `onboarding@resend.dev` is absent from the entire `api/` directory.
- `request-access.js` has exactly 2 `from: FROM` occurrences and escapes all six user-supplied fields.
- The approval email contains all required onboarding blocks.
- The rejection email uses `emailShell()` for visual consistency with approval.

Phase 1 goal is achieved at the code level. The only remaining work is confirming `RESEND_FROM_EMAIL` is configured in Vercel and performing three live send tests to validate actual email delivery and rendering.

---

_Verified: 2026-04-04_
_Verifier: Claude (gsd-verifier)_
