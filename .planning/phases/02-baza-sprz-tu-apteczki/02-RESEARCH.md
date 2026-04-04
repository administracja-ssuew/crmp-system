# Phase 2: Baza Sprzętu + Apteczki — Research

**Researched:** 2026-04-04
**Domain:** Code inspection — EquipmentPage.jsx (549 lines), AdminEquipmentPanel.jsx (826 lines)
**Confidence:** HIGH — findings are based on direct line-by-line reading of both source files

---

## Summary

Both files are functional at a surface level but contain a consistent class of problems:
**field-name fragility** (GAS API column names are guessed, not verified), **silent failure
on errors** (catch blocks swallow exceptions without updating UI state), **ID instability
in AdminEquipmentPanel** (random fallback IDs break the issuing flow), and a **completely
static DIN protocol** (the "Norma DIN" tab always shows every item as "ZGODNY" regardless
of actual reported deficiencies).

The first-aid reporting flow in EquipmentPage works end-to-end syntactically, but the admin
resolution flow in AdminEquipmentPanel has a correctness bug: it filters `firstAidReports`
by `r.ID !== reportId` after a successful close, but the GAS API might return a different
field name (e.g. `r.id` or `r.Id`), causing the resolved report to remain visible. The
apteczki tab also has no loading/error feedback whatsoever during resolution.

The cart/reservation flow in EquipmentPage is largely complete but missing: a way to
**remove individual items from the cart** (only full clear via success), no **collision
check on wydania** (only checks rezerwacje), and no **user feedback** when the "rented"
status badge is shown to explain why they cannot reserve.

**Primary recommendation:** Fix bugs in the order listed in "Recommended Fix Order" below.
Most fixes are single-line or small targeted changes — no architectural work needed.

---

## EquipmentPage Bugs (EQ-01)

### BUG-EQ-01: Collision check ignores physical wydania — only checks rezerwacje

**File:** `src/pages/EquipmentPage.jsx`, lines 131–145 (`checkForCollisions`)

The collision function iterates `allReservations` (wniosek-based bookings) but never
consults `allWydania` (physically issued equipment). An item currently WYDANE (status
`WYDANE` in the wydania sheet) is correctly shown as "rented" in the status badge
(`getDynamicStatus`, lines 214–232), but submitting a new reservation for it will pass
the collision check and be sent to GAS with no warning to the user.

**Fix:** Before returning `null` from `checkForCollisions`, also check whether any cart
item ID is present in the `issuedItemIds` set (same logic used in AdminEquipmentPanel
lines 244–248). If it is, return the item name with a message indicating it is physically
out of the warehouse.

---

### BUG-EQ-02: `isDateReserved` mutates the Date object passed to it

**File:** `src/pages/EquipmentPage.jsx`, lines 243–253

```javascript
const isDateReserved = (itemId, dateObj) => {
  const checkDate = dateObj.setHours(0,0,0,0);   // <-- mutates the input object
```

`Array.from({length: 28}).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); ... isDateReserved(selectedItem.id, d) })`

The caller at line 492 creates `d` as a `new Date()` inside the map, then passes it to
`isDateReserved` which calls `.setHours(0,0,0,0)` on it — that mutates `d` in place. This
is harmless in the current code because `d` is not used after the call, but it is a
reliability hazard. If the call order changes, calendar cells will show the wrong dates.

**Fix:** `const checkDate = new Date(dateObj).setHours(0,0,0,0);`

---

### BUG-EQ-03: `fetchData` error handler silently drops errors on silent refresh

**File:** `src/pages/EquipmentPage.jsx`, lines 107–111

```javascript
.catch(() => {
  if (!silent) setError("Nie udało się pobrać bazy sprzętu z CRW.");
  setIsLoading(false);
  setIsRefreshing(false);
});
```

When `silent = true` (the auto-refresh after a reservation is submitted, line 174), any
network error is fully swallowed — the user sees stale data and no feedback. The
`isRefreshing` spinner also does not exist in the UI, so there is no visual indication
that a background refresh is even happening.

**Fix:** Add a non-modal toast or inline warning when a silent refresh fails. At minimum
log the error for debugging.

---

### BUG-EQ-04: First-aid modal does not reset when switching items

**File:** `src/pages/EquipmentPage.jsx`, lines 309–311

When a user opens the "Zgłoś braki" modal for one first-aid kit, closes it (the X button
sets `setIsFirstAidModalOpen(false)` but does NOT clear `usedItems` or `firstAidDesc`),
then opens the modal for a different kit, the previously checked items and description
text are still present. The kit name in the header correctly updates to `selectedItem.name`
but the form content is stale.

**Fix:** In the `onClick` handler for the "Zgłoś braki" card button (line 310), reset
`usedItems` and `firstAidDesc` before opening the modal:

```javascript
onClick={() => {
  setSelectedItem(item);
  setUsedItems([]);          // add
  setFirstAidDesc('');       // add
  setIsFirstAidModalOpen(true);
}}
```

The same issue exists for the identical button inside the Paszport "info" tab (line 460) —
the fix is the same.

---

### BUG-EQ-05: DIN protocol tab always shows "ZGODNY" for all items

**File:** `src/pages/EquipmentPage.jsx`, lines 509–542

The "Norma DIN" tab renders a static table where every DIN_13169_ITEMS entry has a
hardcoded status cell of `"ZGODNY"`. There is no mechanism to cross-reference the
apteczka's actual report history. The tab was clearly built as a placeholder but is
presented to users as a real compliance document.

This is a **misleading UI bug** — a user viewing the DIN tab sees all items as compliant
even if a deficiency report has already been submitted for that exact kit.

**Fix (minimal):** Add a disclaimer banner stating "Stan wykazany wg ostatniego przeglądu
— bieżące braki widoczne po zgłoszeniu." For a complete fix see EQ-MISSING-02.

---

### BUG-EQ-06: `selectedItem.isRealImage` used without null guard in Paszport modal

**File:** `src/pages/EquipmentPage.jsx`, line 424

```javascript
{selectedItem.isRealImage ? <img src={selectedItem.image} ... /> : selectedItem.image}
```

`selectedItem` is guarded by `selectedItem && !isFirstAidModalOpen` at line 416, so
a null crash is prevented. However `selectedItem.isRealImage` can be `undefined` (falsy)
for items where `item.ZDJĘCIE` was an empty string rather than absent — in that case the
emoji icon path is used correctly, but the `img` tag would render a broken image if the
ZDJĘCIE field contains whitespace. Low severity.

---

## EquipmentPage Missing Features (EQ-02)

### EQ-MISSING-01: No way to remove individual items from cart before checkout

**File:** `src/pages/EquipmentPage.jsx`, lines 325–368

The floating cart bar shows the count and a "Dalej" button. The checkout modal shows a
numbered list of items (lines 360–362) but the list items have no remove button. The only
way to remove an item is to close the modal, find the card in the grid, and click the
"✓ Wybrano" toggle button to deselect it. This is non-obvious UX.

**Fix:** Add a "✕" button next to each item in the checkout list that calls `setCart(cart.filter(c => c.id !== item.id))`.

---

### EQ-MISSING-02: DIN protocol tab does not reflect actual first-aid report history

**File:** `src/pages/EquipmentPage.jsx`, lines 509–542

The DIN tab shows a static table with all items "ZGODNY". There is no API call to fetch
the history of reports for the currently selected apteczka. The GAS API likely returns
`apteczkiBraki` data only in the admin response; the user-facing EquipmentPage would need
either a separate endpoint or to filter `data.apteczkiBraki` (if returned) by `apteczkaId`.

**Fix:** After fetching, store the apteczki reports in a `firstAidHistory` state variable.
In the DIN tab, for each DIN_13169_ITEMS entry check whether that item appears in any
open report for `selectedItem.id` — if so render it as "BRAK / ZGŁOSZONO" instead of
"ZGODNY".

---

### EQ-MISSING-03: No user-visible submission history ("Twoje zgłoszenia")

There is no UI for a user to see what first-aid reports they have previously submitted.
After `submitFirstAidReport` succeeds, the modal closes and the data is gone from the
user's perspective. This is referenced in ROADMAP.md plan 2.4.

---

### EQ-MISSING-04: Maintenance status does not prevent "Zgłoś braki" button for apteczki

**File:** `src/pages/EquipmentPage.jsx`, lines 309–317

For non-first-aid items, the "Rezerwuj" button is `disabled` when `currentStatus === 'maintenance'` (line 314). But for first-aid items, the "Zgłoś braki" button has no such
guard — a kit in `maintenance` status can still have a report submitted. This is a minor
inconsistency.

---

### EQ-MISSING-05: `isRefreshing` state exists but is never shown in UI

**File:** `src/pages/EquipmentPage.jsx`, lines 29, 59, 104

`isRefreshing` is set to `true` during a silent refresh but no spinner, overlay, or
indicator is ever rendered conditional on `isRefreshing`. The state variable is dead UI.

---

## AdminEquipmentPanel — Apteczki Bugs (EQ-03)

### BUG-ADMIN-01: Random ID fallback in `fetchAllData` breaks the issuing flow

**File:** `src/pages/AdminEquipmentPanel.jsx`, line 58

```javascript
id: item.KOD_QR || `BRAK-ID-${Math.floor(Math.random()*1000)}`,
```

Every time `fetchAllData()` is called, items without a `KOD_QR` get a new random ID.
This means:
- The `issuedItemIds` set (lines 244–248) will never match the random ID across refreshes.
- The `selectedItems` array (used in the protocol PDF) will contain IDs that don't exist
  in any Google Sheet row.
- The return flow (`processReturn`) sends a random ID as `nrPorozumienia`, corrupting the
  zwroty sheet.

**Fix:** Use the same stable-ID logic as EquipmentPage — `SSUEW-BRAK-{NAZWA_SPRZĘTU}` —
so at least the ID is deterministic between refreshes.

---

### BUG-ADMIN-02: `resolveFirstAidReport` filters by `r.ID` but GAS may return `r.id`

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 144–151

```javascript
setFirstAidReports(firstAidReports.filter(r => r.ID !== reportId));
```

The `resolveFirstAidReport` function sends `reportId` to GAS and on success removes the
report from local state by filtering `r.ID !== reportId`. However:

1. The `report.ID` field displayed in the card (line 280: `{report.ID}`) and the `key`
   prop (line 278: `key={report.ID}`) are both uppercase `ID`. If GAS returns lowercase
   `id`, both the key and the filter fail silently.
2. The `resolveFirstAidReport` has an empty `catch` block — any GAS error is swallowed
   and the local state is NOT updated (the `filter` is inside the `try`, after the
   `await`). So on network failure the user sees no error and the report stays in the list
   (which is actually correct behaviour) — but there is no feedback that the action failed.

**Fix:** After `await fetch(...)`, parse the response and check `result.success` before
calling `setFirstAidReports`. Add an error state and render it in the apteczki tab.

---

### BUG-ADMIN-03: `firstAidReports` field-name fallback chain silently returns empty array

**File:** `src/pages/AdminEquipmentPanel.jsx`, line 68

```javascript
const reports = data.apteczkiBraki || data.braki_apteczek || data.apteczki_braki || data.firstAidReports || [];
```

Four candidate field names are tried in sequence. If GAS returns a different key (e.g.,
`ApteczkiBraki` with capital A, or `zgloszeniaApteczek`), `reports` silently becomes `[]`
and the apteczki tab shows "Wszystkie apteczki są pełne" even when there are open reports.

This is flagged in CONCERNS.md as a fragile area but is listed here because it causes
a directly observable wrong result in the UI.

**Fix:** Agree on one canonical field name in the GAS script and remove the fallback chain.
As an interim fix, add a debug `console.log('[CRW] firstAidReports raw:', Object.keys(data))`
so the actual key can be confirmed quickly.

---

### BUG-ADMIN-04: Hardcoded document number fallback produces duplicates

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 76–86

```javascript
else setDocNumber(`01/SSUEW/03/2026`);
```

Documented in CONCERNS.md. The GAS `getNextNumber` call can fail silently (empty catch),
and the fallback is a hardcoded string `"01/SSUEW/03/2026"`. If this fallback is triggered
on two separate sessions, both protocols are issued with the same number.

**Fix:** On failure, set `docNumber` to `"BŁĄD — odśwież"` and disable the "Generuj PDF"
button until a valid number is fetched. Add a retry button.

---

### BUG-ADMIN-05: `confirmAndSendInvite` succeeds even on GAS error (catch always alerts success)

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 132–134

```javascript
} catch (err) { alert("Wniosek został przetworzony, odświeżam system."); }
finally { setApprovalModal(null); fetchAllData(); setIsUpdatingStatus(false); }
```

The catch block tells the user the request was processed, but a network error means the
GAS `updateRezerwacjaStatus` action never ran. The reservation status in the sheet remains
"Oczekuje" while the UI has closed the modal and refetched. After refetch, the reservation
will reappear in the list — but the admin may not notice.

**Fix:** Distinguish between success (parse `result.success === true`) and caught errors.
In the catch block, show an actual error message: "Błąd połączenia — wniosek NIE został
zatwierdzony. Spróbuj ponownie."

---

### BUG-ADMIN-06: `handleRejectReservation` has empty catch — silent failure

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 137–142

```javascript
try {
  await fetch(...);
} catch (err) {}
finally { fetchAllData(); setIsUpdatingStatus(false); }
```

Same pattern as BUG-ADMIN-05. If the GAS call fails, the rejection is silently lost and
the reservation reappears after `fetchAllData()`.

---

### BUG-ADMIN-07: Return flow (`processReturn`) sends wrong field as `nrPorozumienia`

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 219–229

```javascript
const targetId = getAgreementNumber(selectedReturn);
await fetch(API_URL, { ..., body: JSON.stringify({ action: "zapiszZwrot", nrPorozumienia: targetId }) });
```

`getAgreementNumber` uses the heuristic at lines 88–94: it returns `val1` if it contains
`SSUEW`, otherwise `val2`, otherwise `val1 || 'Brak numeru'`. If the column names in the
Google Sheet do not match exactly `Nr_Porozumienia` or `Nr Porozumienia`, `getAgreementNumber`
returns `'Brak numeru'` and the GAS `zapiszZwrot` action receives a useless ID.

The return row in the zwroty sheet displays the agreement number from `getAgreementNumber`
at line 645. If the heuristic fails, the return is logged as `"Brak numeru"` which cannot
be matched back to the original wydanie.

---

### BUG-ADMIN-08: Return table crashes if `selectedReturn['SPRZĘT']` and `selectedReturn['Sprzęt (Kody QR)']` are both undefined

**File:** `src/pages/AdminEquipmentPanel.jsx`, line 655

```javascript
{String(selectedReturn['SPRZĘT'] || selectedReturn['Sprzęt (Kody QR)']).split(',').map(...)}
```

If both fields are `undefined`, `String(undefined || undefined)` evaluates to
`String(undefined)` = `"undefined"`, which then gets split and rendered as a table row
containing the text "undefined". No null guard or error boundary exists here.

**Fix:** `const codes = String(selectedReturn['SPRZĘT'] || selectedReturn['Sprzęt (Kody QR)'] || '');`

---

### BUG-ADMIN-09: `initiateApproval` reads email with regex from `rez.Kontakt` — will fail if Kontakt format changes

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 112–118

```javascript
const emailMatch = rez.Kontakt.match(/([a-zA-Z0-9._-]+@...)/);
setRequesterEmail(emailMatch ? emailMatch[1] : '');
```

`rez.Kontakt` is constructed in EquipmentPage as `"Jan Kowalski | Tel: 123 | Email: jan@x.com"`.
The regex will correctly extract the email from that format. However if `rez.Kontakt` is
`null` or `undefined` (GAS returned an empty cell), `rez.Kontakt.match(...)` throws a
TypeError: `Cannot read properties of null`.

**Fix:** `const emailMatch = (rez.Kontakt || '').match(...);`

---

## AdminEquipmentPanel — Apteczki Missing Features (EQ-04)

### ADMIN-MISSING-01: No loading or error state for the apteczki tab

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 270–293

The apteczki tab renders immediately from `firstAidReports` state. There is no loading
indicator during the initial `fetchAllData()` call and no error message if the call fails.
The empty-state ("Wszystkie apteczki są pełne") is shown both when there are no reports
AND when the fetch failed/returned wrong field name (BUG-ADMIN-03).

**Fix:** Add a dedicated `isLoadingReports` boolean (or reuse an existing loading state)
and an error state for the apteczki section.

---

### ADMIN-MISSING-02: No "in progress" status for first-aid reports — only open → resolved

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 270–293

The current lifecycle is binary: a report either shows in the list (open) or disappears
(resolved after `resolveFirstAidReport`). There is no intermediate state such as "W trakcie
uzupełniania" that would let one admin claim a report and signal to others that it is being
handled.

Referenced in ROADMAP.md plan 2.4 and REQUIREMENTS.md EQ-04.

---

### ADMIN-MISSING-03: No history of resolved apteczki reports

After `resolveFirstAidReport` succeeds, the report is removed from the local state array
and never shown again. Admins have no way to view past resolutions, who resolved them, or
when. The GAS sheet presumably retains this data but there is no UI to query it.

---

### ADMIN-MISSING-04: `resolveFirstAidReport` does not record who resolved the report in the response

**File:** `src/pages/AdminEquipmentPanel.jsx`, line 147

The payload sent to GAS includes `adminOsoba: user?.email` — which is correct. However
the success `alert` says "Dziękujemy za uzupełnienie apteczki" with no confirmation of
what was resolved or any identifier. A resolved report also carries no timestamp in the
local state before removal.

---

### ADMIN-MISSING-05: Apteczki badge notification count is inaccurate

**File:** `src/pages/AdminEquipmentPanel.jsx`, line 263

```javascript
{firstAidReports.length > 0 && adminMode !== 'apteczki' && <span ... animate-ping></span>}
```

The badge is a pulsing dot (not a count). It disappears entirely when `adminMode === 'apteczki'`
even if there are still unresolved reports in the tab. It should remain visible as a count
badge while inside the tab so admins know how many remain.

---

## Shared Issues

### SHARED-01: `API_URL` is duplicated — config.js exists but is never imported

**Files:** `src/pages/EquipmentPage.jsx` line 50, `src/pages/AdminEquipmentPanel.jsx` line 50, `src/config.js`

Both files define the identical string:
```
"https://script.google.com/macros/s/AKfycbyRZFBR-7Lo2I-hXnFykVV5Bose6Z4tv7Hp7Si5LGV9lsiVdx8pCIKXBy_Z5eytRHQzGg/exec"
```

`src/config.js` exports `CRW_API_URL` but is never imported anywhere (confirmed in CONCERNS.md).
This is a v2/TD-01 tech debt item but is worth noting — a GAS redeployment requires
touching three files.

---

### SHARED-02: React `key` prop in apteczki reports list uses `report.ID` (uppercase)

**Files:** `src/pages/AdminEquipmentPanel.jsx` line 278

```javascript
{firstAidReports.map(report => (
  <div key={report.ID} ...>
```

If GAS returns lowercase `id`, `report.ID` is `undefined` for every report. React will
silently use `undefined` as a key, which triggers the "Each child in a list should have a
unique key" warning and can cause incorrect DOM reconciliation.

Same risk exists in the `resolveFirstAidReport` filter (BUG-ADMIN-02).

---

### SHARED-03: No React `key` warnings in wydania table row (zwroty tab)

**File:** `src/pages/AdminEquipmentPanel.jsx`, lines 593–604

```javascript
{activeWydania.map((wyd, idx) => (
  <div key={idx} ...>
```

Using array index as `key` is acceptable only for static lists. Since `activeWydania` is
fetched and can change, using `idx` means React may re-render the wrong row if the order
changes. Should use `key={getAgreementNumber(wyd)}` or a stable ID from the data.

---

### SHARED-04: `getDynamicStatus` in EquipmentPage checks two different field variants for wydania but AdminEquipmentPanel `issuedItemIds` uses the same two variants consistently

**Files:** `src/pages/EquipmentPage.jsx` lines 217–219, `src/pages/AdminEquipmentPanel.jsx` lines 244–248

Both files check `w['SPRZĘT'] || w['Sprzęt (Kody QR)']` for the equipment column in
wydania records. This is consistent, but both will silently return no match if the actual
GAS column name is different (e.g. `Sprzet_Kody` or `Kody_QR`). The field name should be
confirmed against the actual GAS output once.

---

## API Field Names (what GAS returns vs what code expects)

| GAS Action / Sheet | Code Expects | Fallback Attempts | Risk if Wrong |
|--------------------|-------------|-------------------|---------------|
| `data.sprzet[]` items | `KOD_QR`, `NAZWA_SPRZĘTU`, `TYP`, `RODZAJ`, `UWAGI`, `INTERAKCJA`, `LOKALIZACJA`, `ZDJĘCIE`, `LINK` | EquipmentPage: stable fallback ID; AdminEquipmentPanel: **random fallback ID** (BUG-ADMIN-01) | Admin issues protocol with ID that will never match |
| `data.rezerwacje[]` items | `ID`, `Status`, `Sprzet_Kody`, `Data_Od`, `Data_Do`, `Kontakt`, `Organizacja_Cel` | None | Collision check passes incorrectly if field names differ |
| `data.wydania[]` items | `STATUS` or `Status` or `status`, `SPRZĘT` or `Sprzęt (Kody QR)`, `Nr_Porozumienia` or `Nr Porozumienia`, `Data`, `Organizator` or `Organizacja`, `Kto_wypozyczyl` or `Wypożyczający` | Multi-variant OR chain | Return protocol renders "undefined" or uses wrong agreement number |
| `data.apteczkiBraki[]` (or alternative key) | `ID`, `Data_Zgloszenia`, `Apteczka_Nazwa`, `Osoba`, `Powod`, `Zuzyte_Materialy` | Four key name fallbacks for the top-level array; **zero** fallbacks for inner field names | Tab silently shows empty; or renders blank cards if inner fields wrong |
| `getNextNumber` response | `data.docNumber` | Hardcoded `"01/SSUEW/03/2026"` | Duplicate document numbers |
| `zapiszWydanie` response | `resData.link` | None — alert shows `undefined` in link if missing | Cosmetic (broken link in success alert) |

**Most critical unknown:** the exact key GAS uses for first-aid reports (the four-name
fallback chain in AdminEquipmentPanel line 68). This must be confirmed by checking the
GAS script source or by adding a temporary `console.log(Object.keys(data))` after fetch.

---

## Recommended Fix Order

Priority is assigned by (a) data corruption risk, (b) user-visible breakage, (c) ease of fix.

| # | Bug ID | Description | Effort | Priority |
|---|--------|-------------|--------|----------|
| 1 | BUG-ADMIN-01 | Random ID fallback in AdminEquipmentPanel | 1 line | CRITICAL |
| 2 | BUG-ADMIN-03 | firstAidReports field-name fallback — confirm actual GAS key | 1 line + GAS check | CRITICAL |
| 3 | BUG-ADMIN-02 | resolveFirstAidReport filters by r.ID — unify casing, add response check | ~10 lines | HIGH |
| 4 | BUG-ADMIN-08 | Return table crash on undefined equipment fields | 1 line | HIGH |
| 5 | BUG-ADMIN-09 | initiateApproval crashes on null Kontakt | 1 line | HIGH |
| 6 | BUG-EQ-01 | Collision check misses physically issued items | ~8 lines | HIGH |
| 7 | BUG-ADMIN-04 | Hardcoded doc number fallback — disable button on failure | ~5 lines | MEDIUM |
| 8 | BUG-ADMIN-05 | confirmAndSendInvite catch tells user "success" on failure | ~5 lines | MEDIUM |
| 9 | BUG-ADMIN-06 | handleRejectReservation empty catch | ~3 lines | MEDIUM |
| 10 | BUG-ADMIN-07 | processReturn may send "Brak numeru" as agreement ID | Requires GAS field name audit | MEDIUM |
| 11 | BUG-EQ-04 | First-aid modal retains stale usedItems between kits | 2 lines | MEDIUM |
| 12 | BUG-EQ-05 | DIN tab shows ZGODNY regardless of reports | UI disclaimer (quick) / full fix (requires data) | MEDIUM |
| 13 | BUG-EQ-02 | isDateReserved mutates Date argument | 1 line | LOW |
| 14 | BUG-EQ-03 | Silent error on background refresh | ~5 lines | LOW |
| 15 | SHARED-02 | key={report.ID} may be undefined | 1 line | LOW |
| 16 | SHARED-03 | key={idx} in wydania list | 1 line | LOW |
| 17 | EQ-MISSING-01 | No per-item remove from cart | ~8 lines | MEDIUM (UX) |
| 18 | ADMIN-MISSING-01 | No loading/error state for apteczki tab | ~15 lines | MEDIUM |
| 19 | ADMIN-MISSING-05 | Apteczki badge shows dot not count | 5 lines | LOW |

**Features to add (plan 2.4):**
- EQ-MISSING-02: DIN tab reflects actual open reports per kit
- EQ-MISSING-03: User submission history view
- ADMIN-MISSING-02: "In progress" status for reports
- ADMIN-MISSING-03: History of resolved reports

---

## RESEARCH COMPLETE

**Phase:** 2 — Baza Sprzętu + Apteczki
**Confidence:** HIGH (all findings from direct line-by-line code reading)

### Key Findings

- **17 distinct bugs identified** — 9 in AdminEquipmentPanel, 6 in EquipmentPage, 2 shared.
  The most dangerous is BUG-ADMIN-01 (random IDs on every fetch — corrupts all admin flows).
- **GAS field names are the root cause of most fragility.** `apteczkiBraki` vs 3 other
  variants, `SPRZĘT` vs `Sprzęt (Kody QR)`, `Nr_Porozumienia` vs `Nr Porozumienia` — none
  are verified against the actual GAS deployment. Confirming the real column names once
  would eliminate a whole class of bugs.
- **Both files share the same API_URL string** — config.js is dead code. This is a v2
  concern (TD-01) but should not be fixed in this phase to avoid scope creep.
- **The first-aid reporting flow (user side) works syntactically** but has stale-state
  bugs (BUG-EQ-04) and a misleading DIN tab (BUG-EQ-05).
- **The admin apteczki resolution flow has the most bugs** — empty catch, potential
  wrong field name in filter, no error feedback, and no loading state.
- **4 missing features** are defined in REQUIREMENTS.md EQ-02/EQ-04 and are separate
  from bugs — they require new UI components and possibly new GAS endpoints.

### File Created
`C:/Users/Mikołaj/Downloads/stand-dashboard-main/.planning/phases/02-baza-sprz-tu-apteczki/02-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Bug identification | HIGH | Direct code reading, line numbers cited |
| GAS field names | MEDIUM | Inferred from code; actual GAS script not read |
| Missing features | HIGH | Cross-referenced against REQUIREMENTS.md and ROADMAP.md |

### Open Questions
1. What are the exact column names in the GAS script output? Specifically: the key for
   first-aid reports array, and the exact status strings for wydania. Answerable by reading
   the GAS `.gs` source file (not present in this repo) or adding a temporary console.log.
2. Does the GAS `zglosBrakiApteczki` action return a field in the response that could be
   used as a stable `ID` for the new report? If so, the optimistic local filter in
   `resolveFirstAidReport` could use it reliably.

### Ready for Planning
Research complete. Planner can now create PLAN.md files for plans 2.2, 2.3, and 2.4.
