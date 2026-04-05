# Roadmap: CRA — System Samorządu Studentów UEW

**Created:** 2026-04-04
**Milestone:** v1 — Core Improvements
**Project type:** Brownfield — existing React 18 + Vite + Tailwind CSS + Firebase + Vercel SPA

## Phases

- [ ] **Phase 1: Email Fix** — Fix Resend sender domain and rewrite all three transactional email templates
- [x] **Phase 2: Baza Sprzętu + Apteczki** — Fix bugs and complete missing features in equipment catalog and first aid kit modules (completed 2026-04-04)
- [ ] **Phase 3: Lista Dostępowa** — Build new monthly access list module (form, admin panel, PDF generation, approved list view)
- [x] **Phase 4: Kompendium + Księga Inwentarzowa** — Redesign KompendiumPage and add new KsiegaInwentarzPage tab (completed 2026-04-05)
- [x] **Phase 5: Mapa Kampusu** — Improve MapPage interactivity and prepare integration point for new Photoshop campus map (completed 2026-04-05)

---

## Phase Details

### Phase 1: Email Fix
**Goal:** All three Resend-powered transactional emails send from a verified custom domain with consistent, complete Polish content
**Depends on:** Nothing (isolated serverless functions)
**Requirements:** EMAIL-01, EMAIL-02, EMAIL-03
**Success Criteria** (what must be TRUE):
  1. No email arrives with `onboarding@resend.dev` as sender — all use the verified custom domain
  2. Approval email contains a full onboarding block: welcome greeting, one-paragraph CRA description, Google login walkthrough, and a working link to the system
  3. Rejection email matches the approval email in visual structure (same HTML layout, consistent tone and Polish phrasing)
  4. All three handlers (approve-request.js, reject-request.js, request-access.js) share a single `from` constant so future domain changes require one edit
**Plans:**
- [ ] 1.1 — Shared email config: Extract `from` address and reusable HTML shell (header, footer, button component) into `api/_email.js` helper — can run in parallel with 1.2
- [ ] 1.2 — Approval onboarding email: Rewrite approve-request.js email body to full onboarding template (welcome, CRA description, Google login steps, CTA button) — can run in parallel with 1.1
- [ ] 1.3 — Rejection email redesign: Update reject-request.js to use shared shell from 1.1, align visual style with approval email
- [ ] 1.4 — request-access.js sender fix: Swap `onboarding@resend.dev` for verified domain in the acknowledgement email sent on form submission
**UI hint**: no

### Phase 2: Baza Sprzętu + Apteczki
**Goal:** Equipment catalog, reservation flow, and first aid kit reporting work correctly end-to-end for both regular users and admins
**Depends on:** Nothing (self-contained module with its own Google Apps Script API)
**Requirements:** EQ-01, EQ-02, EQ-03, EQ-04
**Success Criteria** (what must be TRUE):
  1. EquipmentPage.jsx loads without JS errors; items display with stable IDs (no `BRAK-ID-random` fallback in production data)
  2. A user can add items to cart, submit a reservation, and receive collision warnings when dates overlap with already-approved reservations
  3. An admin can approve or reject a reservation in AdminEquipmentPanel.jsx; approval correctly creates a calendar event via GAS
  4. A user can submit a first aid kit deficiency report (select missing items, add description) and it persists in the GAS sheet
  5. An admin can see open first aid reports and mark them resolved; resolved reports disappear from the list
**Plans:**
3/3 plans complete
- [ ] 2.2 — EquipmentPage bug fixes: Apply fixes identified in 2.1 to EquipmentPage.jsx (stable IDs, collision check edge cases, cart UX, error states) — depends on 2.1
- [ ] 2.3 — AdminEquipmentPanel bug fixes: Apply fixes identified in 2.1 to AdminEquipmentPanel.jsx (firstAidReports field name fallbacks, wydania display, return flow) — depends on 2.1, can run in parallel with 2.2
- [ ] 2.4 — First aid history & state management: Add submission history view for users (past reports) and complete status lifecycle (open → in progress → resolved) in AdminEquipmentPanel
**UI hint**: yes

### Phase 3: Lista Dostępowa
**Goal:** Members can submit monthly room access requests during the 5-day window; admins can approve/reject; a PDF of the approved list is generated when the window closes; the approved list is visible all month
**Depends on:** Phase 1 (email notifications on approval/rejection use the fixed Resend setup)
**Requirements:** ACC-01, ACC-02, ACC-03, ACC-04, ACC-05
**Success Criteria** (what must be TRUE):
  1. On the 1st–5th of any month the access request form is visible and accepts: first name, last name, student ID, @samorzad.ue.wroc.pl email, room selection, justification
  2. Outside the 5-day window the form is hidden and replaced by a clear "window closed" message with the next opening date
  3. Submitted requests appear in the admin panel; admin can approve or reject each entry with one click
  4. After the window closes, the admin can trigger PDF generation that produces a formatted list of all approved persons for that month
  5. A read-only approved list view is accessible to all authenticated users throughout the remainder of the month
  6. All submissions and approvals are persisted in Firebase Firestore using the existing collection pattern
**Plans:**
- [ ] 3.1 — Data layer & window logic: Define Firestore collection schema (`access_submissions`), write date-window helper (isWindowOpen, daysUntilNext), create AccessListContext or local hooks — foundation for all other plans
- [ ] 3.2 — Submission form (AccessListPage): Build form component with field validation, window-open gate, and Firestore write; wire into router as new tab — depends on 3.1, can run in parallel with 3.3
- [ ] 3.3 — Admin panel (AdminAccessPanel): Build approve/reject list view reading from Firestore, write status updates back — depends on 3.1, can run in parallel with 3.2
- [ ] 3.4 — Approved list view: Build read-only approved list component visible outside the submission window; reuse Firestore query from 3.3 — depends on 3.3
- [ ] 3.5 — PDF generation: Integrate jsPDF (or equivalent) to render approved list as downloadable PDF; triggered by admin after window closes — depends on 3.3
**UI hint**: yes

### Phase 4: Kompendium + Księga Inwentarzowa
**Goal:** KompendiumPage is visually redesigned with cards and sections; document templates are accessible; a new KsiegaInwentarzPage tab provides an informational inventory guide
**Depends on:** Nothing (read-only informational pages, no shared state)
**Requirements:** KOMP-01, KOMP-02, INV-01
**Success Criteria** (what must be TRUE):
  1. KompendiumPage renders content in a card/section layout instead of a flat 1111-line wall; each major topic is visually separated and scannable
  2. A "Wzory i szablony" section is present in KompendiumPage with downloadable or viewable document templates
  3. A new "Księga Inwentarzowa" route and nav tab exists; it loads without errors and displays structured inventory guidance (what items exist, where they are stored, how to handle them)
**Plans:**
3/3 plans complete
- [ ] 4.2 — Document templates section: Add templates block to KompendiumPage (file list with preview/download links, stored as static assets or Google Drive links) — can run in parallel with 4.1
- [ ] 4.3 — KsiegaInwentarzPage: Create new page component, add route in App.jsx, add nav entry; populate with inventory guide content (categories, locations, procedures)
**UI hint**: yes

### Phase 5: Mapa Kampusu
**Goal:** MapPage is ready to display an updated Photoshop-sourced campus map with improved interactive hotspot behavior
**Depends on:** Nothing (isolated page)
**Requirements:** MAP-01
**Success Criteria** (what must be TRUE):
  1. MapPage accepts a new high-resolution map image without layout breakage (responsive container ready)
  2. Hotspots or clickable regions on the map show a tooltip or info panel with room/building details on interaction
  3. The map is usable on standard desktop viewport sizes without horizontal scroll
**Plans:**
3/3 plans executed
- [x] 5.2 — Admin panel expansion (Zarządzaj tab with history, stats, location edit) — completed 2026-04-05
- [x] 5.3 — Rejestr Plakatów i Banerów (full RegistryView with fetchAllPosters, filter tabs, search, table) — completed 2026-04-05

**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Email Fix | 0/4 | Not started | - |
| 2. Baza Sprzętu + Apteczki | 0/4 | Complete    | 2026-04-04 |
| 3. Lista Dostępowa | 0/5 | Not started | - |
| 4. Kompendium + Księga Inwentarzowa | 2/3 | Complete    | 2026-04-05 |
| 5. Mapa Kampusu | 3/3 | Complete    | 2026-04-05 |

---

## Completion Criteria

- [ ] All v1 requirements covered (16/16 mapped)
- [ ] Each phase has a clear, testable goal
- [ ] Plans are small enough to execute atomically
- [ ] No requirement appears in more than one phase
- [ ] Success criteria are observable from user perspective, not implementation tasks

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| EMAIL-01 | Phase 1 | Pending |
| EMAIL-02 | Phase 1 | Pending |
| EMAIL-03 | Phase 1 | Pending |
| EQ-01 | Phase 2 | Pending |
| EQ-02 | Phase 2 | Pending |
| EQ-03 | Phase 2 | Pending |
| EQ-04 | Phase 2 | Pending |
| ACC-01 | Phase 3 | Pending |
| ACC-02 | Phase 3 | Pending |
| ACC-03 | Phase 3 | Pending |
| ACC-04 | Phase 3 | Pending |
| ACC-05 | Phase 3 | Pending |
| KOMP-01 | Phase 4 | Pending |
| KOMP-02 | Phase 4 | Pending |
| INV-01 | Phase 4 | Pending |
| MAP-01 | Phase 5 | Complete |

**Coverage: 16/16 v1 requirements mapped. No orphans.**

---
*Created: 2026-04-04*
