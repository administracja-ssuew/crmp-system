# CRA — System Samorządu Studentów UEW

## What This Is

CRA (ang. *Central Resource Application*) to wewnętrzny dashboard Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu. System zarządza dostępem do przestrzeni i zasobów SSUEW: sprzętem, kalendarzami, dokumentami, stanowiskami, weryfikacją, wnioskami dostępu i AI-asystentem. Aplikacja jest React SPA wdrożoną na Vercel, przeznaczoną wyłącznie dla członków Samorządu.

## Core Value

Jeden punkt dostępu do wszystkich zasobów i narzędzi SSUEW — bez zbędnej biurokracji, bez Exceli, bez szukania po mailach.

## Requirements

### Validated

- ✓ Google OAuth login z Firebase — tylko zatwierdzeni użytkownicy (`authorized_users`) mogą się zalogować — existing
- ✓ System wniosków dostępowych (formularz → email → zatwierdzenie admina → aktywacja konta) — existing
- ✓ Panel administracyjny wniosków dostępowych (`/wnioski`) — existing
- ✓ Baza Sprzętu: katalog, rezerwacje, wypożyczenia (`/sprzet`, `/wydawanie`) — existing
- ✓ Raportowanie braków w apteczkach (moduł w AdminEquipmentPanel) — existing
- ✓ Kalendarze: pokoje SSUEW + organizacje (`/kalendarz/samorzad`, `/kalendarz/organizacje`) — existing
- ✓ Rejestr Stanowisk (`/rejestr`) — existing
- ✓ Mapa Kampusu — lokalizacje plakatowe (`/mapa`) — existing
- ✓ Moduł Lex SSUEW — biblioteka dokumentów i generator petycji (`/dokumenty`) — existing
- ✓ Kompendium Wiedzy Protokolanta (`/kompendium`) — existing
- ✓ Księga Dokumentów (`/ksiega-dokumentow`) — existing (wymaga rozbudowy)
- ✓ Weryfikacja Sali — check-in/check-out z QR i Supabase (`/skaner`) — existing
- ✓ AI-asystent Gemini dostępny na każdej stronie — existing
- ✓ Role-based access control: admin / logitech / member — existing
- ✓ Vercel Serverless Functions dla uprzywilejowanych operacji (Resend, Firebase Admin) — existing

### Active

- [ ] Naprawić integrację Resend — zmienić domenę nadawcy na zweryfikowaną, wysyłać pełny onboarding email po zatwierdzeniu konta
- [ ] Poprawić i ukończyć moduł Bazy Sprzętu + apteczki — naprawić błędy, uzupełnić brakujące funkcje
- [ ] Lista Dostępowa — miesięczny moduł zgłoszeń dostępu do pomieszczeń SSUEW (otwarcie auto 1. dnia miesiąca na 5 dni, zatwierdzone przez admina, export PDF, widoczna lista zatwierdzonych)
- [ ] Uatrakcyjnić Kompendium Wiedzy Protokolanta — wzory, nowe bajery, lepsza prezentacja treści
- [ ] Dodać Księgę Inwentarzową — informacyjny przewodnik po inwentarzu (nowa zakładka)
- [ ] Poprawić funkcjonalność modułu Mapa Kampusu

### Out of Scope

- Mobilna aplikacja natywna — web-first, mapa kampusu wymaga dużego ekranu
- Real-time powiadomienia push — maile Resend wystarczą do komunikacji
- Zewnętrzne logowanie poza Google OAuth — spójność z Google Workspace SSUEW
- Publiczny dostęp do jakichkolwiek modułów poza formularzem wniosku — system wewnętrzny

## Context

- System działa w ekosystemie Google: Auth przez Firebase, dane przez Google Apps Script / Sheets, pliki przez Google Drive
- Każda strona odwołuje się do osobnego deploymentu Google Apps Script — URL-e są hardcoded
- Supabase używany wyłącznie w VerificationPage (blacklist + storage zdjęć)
- Trzy role: `admin` (pełen dostęp), `logitech` (panel wydawania sprzętu), `member` (podstawowy dostęp)
- Interfejs w całości po polsku; użytkownicy: członkowie Samorządu Studentów UEW
- Lista Dostępowa ograniczona do maili @samorzad.ue.wroc.pl

## Constraints

- **Tech Stack**: React 18 + Vite + Tailwind CSS — nie zmieniamy
- **Backend**: Vercel Serverless Functions + Firebase Admin — tylko dla uprzywilejowanych operacji
- **Data**: Google Apps Script jako główne API — zachować istniejący pattern
- **Auth**: Firebase Google OAuth — nowe moduły muszą respektować istniejące role
- **Deployment**: Vercel — wszystkie nowe API jako `/api/*.js` serverless functions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Resend wymaga zweryfikowanej domeny nadawcy | `onboarding@resend.dev` ląduje w spamie i nie działa dla zewnętrznych odbiorców | — Pending |
| Lista Dostępowa: dostęp tylko @samorzad.ue.wroc.pl | System wewnętrzny — tylko aktywni członkowie Samorządu wnioskują o klucze | — Pending |
| Lista Dostępowa: PDF generowany client-side | Prostota — brak dodatkowego serwera, użytkownik pobiera z przeglądarki | — Pending |
| Apteczki: norma DIN 13169 jako standard wyposażenia | Istniejący kod już odwołuje się do tej normy | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after initialization*
