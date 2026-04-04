---
status: partial
phase: 01-email-fix
source: [01-VERIFICATION.md]
started: 2026-04-04T00:00:00.000Z
updated: 2026-04-04T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Mail zatwierdzający — pełny onboarding
expected: Po zatwierdzeniu wniosku w /wnioski, wnioskodawca otrzymuje mail z: powitaniem (imię), opisem CRA, krokami logowania przez Google, przyciskiem CTA prowadzącym do cra-system.vercel.app. Mail pochodzi z zweryfikowanej domeny (RESEND_FROM_EMAIL).
result: [pending]

### 2. Mail odrzucający — spójny wizualnie
expected: Po odrzuceniu wniosku w /wnioski, wnioskodawca otrzymuje mail w tej samej szacie graficznej co mail zatwierdzający (header SSUEW, biała karta, szary footer). Mail pochodzi z zweryfikowanej domeny.
result: [pending]

### 3. Mail potwierdzający złożenie wniosku
expected: Po złożeniu wniosku przez /wniosek, wnioskodawca i admin otrzymują maile z tej samej zweryfikowanej domeny (nie onboarding@resend.dev). Pola formularza (imię, organizacja itp.) wyświetlane są poprawnie.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

Wymagania wstępne (poza kodem):
1. Zweryfikuj domenę w panelu Resend → Domains → Add Domain → skonfiguruj DNS (SPF, DKIM, DMARC)
2. Dodaj zmienną środowiskową w Vercel: RESEND_FROM_EMAIL=noreply@twojadomena.pl
3. Opcjonalnie: dodaj do .env.local do lokalnych testów z `vercel dev`
