# Requirements: CRA — System Samorządu Studentów UEW

**Defined:** 2026-04-04
**Core Value:** Jeden punkt dostępu do wszystkich zasobów i narzędzi SSUEW

## v1 Requirements

### Email (Resend)

- [ ] **EMAIL-01**: Zmienić nadawcę w api/approve-request.js, api/reject-request.js i api/request-access.js z `onboarding@resend.dev` na zweryfikowaną domenę Resend
- [ ] **EMAIL-02**: Rozbudować treść maila po zatwierdzeniu konta do pełnego onboardingu: powitanie, krótki opis CRA, instrukcja pierwszego logowania (Google), link do systemu
- [ ] **EMAIL-03**: Mail po odrzuceniu wniosku (api/reject-request.js) spójny wizualnie i językowo z resztą komunikacji

### Equipment (Baza Sprzętu)

- [ ] **EQ-01**: Naprawić istniejące błędy w EquipmentPage.jsx i AdminEquipmentPanel.jsx
- [ ] **EQ-02**: Uzupełnić brakujące funkcje modułu sprzętu (do ustalenia po inspekcji kodu)
- [ ] **EQ-03**: Naprawić błędy w module apteczek w AdminEquipmentPanel
- [ ] **EQ-04**: Uzupełnić brakujące funkcje apteczek (historia zgłoszeń, obsługa stanów)

### Access List (Lista Dostępowa)

- [ ] **ACC-01**: Formularz zgłoszeniowy listy dostępowej (imię, nazwisko, nr indeksu, email @samorzad.ue.wroc.pl, wybór sali, uzasadnienie) — dostępny tylko w oknie zgłoszeń
- [ ] **ACC-02**: Panel admina do przeglądania i zatwierdzania/odrzucania zgłoszeń dostępu do pomieszczeń
- [ ] **ACC-03**: Automatyczne otwarcie panelu zgłoszeń 1. dnia każdego miesiąca na 5 dni (logika client-side na podstawie daty)
- [ ] **ACC-04**: Generowanie PDF listy zatwierdzonych osób po zamknięciu okna zgłoszeń
- [ ] **ACC-05**: Widok listy zatwierdzonych dla użytkowników widoczny przez cały miesiąc (poza oknem zgłoszeń)

### Kompendium & Inwentarz

- [ ] **KOMP-01**: Uatrakcyjnić UI Kompendium Wiedzy Protokolanta — nowy layout, karty, sekcje, estetyka
- [ ] **KOMP-02**: Dodać wzory i szablony dokumentów do Kompendium
- [ ] **INV-01**: Nowa zakładka Księga Inwentarzowa — informacyjny przewodnik po inwentarzu SSUEW (co, gdzie, jak)

### Mapa Kampusu

- [ ] **MAP-01**: Poprawić funkcjonalność modułu Mapy Kampusu (integracja z nową mapą z Photoshopa, interaktywność)

## v2 Requirements

### Bezpieczeństwo

- **SEC-01**: Autoryzacja server-side na endpointach /api/approve-request i /api/reject-request (Firebase ID token verification)
- **SEC-02**: Przenieść klucz Supabase z kodu do zmiennych środowiskowych (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### Tech Debt

- **TD-01**: Scentralizować wszystkie URL-e Google Apps Script w src/config.js i importować stamtąd
- **TD-02**: Przenieść firebase-admin i resend z dependencies do devDependencies / osobnego package.json w api/
- **TD-03**: Zmigrować VerificationPage z react-qr-reader (abandonware) na @yudiel/react-qr-scanner

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobilna aplikacja natywna | Web-first; mapa i tabele wymagają dużego ekranu |
| Publiczny dostęp do modułów | System wewnętrzny — tylko dla zatwierdzonych członków |
| Real-time powiadomienia push | Maile Resend wystarczą do obecnej skali |
| OAuth przez inne providery niż Google | Spójność z Google Workspace SSUEW |
| Własna baza danych / migracja z Google Sheets | Za duży koszt przy obecnej architekturze |

## Traceability

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
| MAP-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after initialization*
