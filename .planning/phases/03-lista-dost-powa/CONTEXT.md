# Phase 3 Context: Lista Dostępowa

## Design Decisions

### Navigation
- **New top-level tab** in main menu sidebar
- Route: `/lista-dostepowa`
- Visible to all authenticated members

### Form Layout
- **Full-page layout** at `/lista-dostepowa`
- Consistent with EquipmentPage style (card-based, Tailwind)
- Form visible during 1st–5th of each month; replaced by "window closed" message otherwise

### Form Fields
- Imię i nazwisko (required)
- Adres e-mail @samorzad.ue.wroc.pl (required, validated)
- Nr indeksu (required)
- Wybór pomieszczenia (required, single-select dropdown — hardcoded list)
- Uzasadnienie (required, textarea)

### Rooms List
- Hardcoded in JSX as static array
- Placeholder names to be replaced by user: use ["Sala posiedzeń", "Biuro Zarządu", "Sala projektowa", "Pomieszczenie gospodarcze"] as defaults
- Easy to update via Edit later without backend changes

### PDF Generation
- **jsPDF client-side** (no extra server)
- Triggered by admin after window closes
- Output: formatted list of approved persons for the month

### Admin Panel
- **Separate page**: `/admin-dostep`
- Accessible only to `admin` role
- Features: approve/reject submissions, trigger PDF export
- NOT integrated with AdminEquipmentPanel (avoids complexity)

### Data Storage
- **Firebase Firestore** — collection `access_submissions`
- Schema:
  ```
  {
    name: string,
    email: string,          // lowercase @samorzad.ue.wroc.pl
    index: string,
    room: string,
    justification: string,
    status: 'pending' | 'approved' | 'rejected',
    month: string,          // "2026-04" format for monthly grouping
    createdAt: Timestamp,
    reviewedAt: Timestamp | null,
    reviewedBy: string | null  // admin email
  }
  ```

## UI Style
- Follow existing Tailwind patterns: slate/indigo palette
- Window-open state: indigo accent; window-closed: slate/gray muted
- Admin panel: same card style as AdminEquipmentPanel

## Constraints
- Email must end with `@samorzad.ue.wroc.pl` — validated on both client and Firestore rules (or server)
- Window logic: days 1–5 of each calendar month (client-side date check)
- One submission per email per month (prevent duplicates)
