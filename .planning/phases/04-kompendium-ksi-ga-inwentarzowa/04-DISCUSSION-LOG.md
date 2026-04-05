# Phase 4: Kompendium + Księga Inwentarzowa - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 04 — Kompendium + Księga Inwentarzowa
**Areas discussed:** Treść KsięgiInwentarzowej, Interaktywność KsięgiInwentarzowej, Sekcja szablonów dokumentów, Layout KompendiumPage

---

## Treść KsięgiInwentarzowej

| Option | Description | Selected |
|--------|-------------|----------|
| Dokładnie te 5 sekcji | Czym jest, Podstawa prawna, Struktura kolumn, Inwentaryzacja otwarcia, Relacja z ewidencją | |
| Te 5 + procedura dodawania wpisu | Dodaj sekcję krok-po-kroku | |
| Te 5 + procedura + FAQ / częste błędy | Jak wyżej, plus sekcja typowych błędów ewidencyjnych | ✓ |

**User's choice:** 7 sekcji łącznie  
**Notes:** Użytkownik dostarczył pełną treść 5 sekcji bezpośrednio w rozmowie. Zdjęcia Księgi będą wgrane do `/public/ksiega/` po implementacji.

---

## Zdjęcia Księgi

| Option | Description | Selected |
|--------|-------------|----------|
| Tak — wgraję do /public i osadź jako `<img>` | Statyczne pliki w /public | ✓ |
| Tak — link do Google Drive | Zewnętrzny URL | |
| Na razie bez zdjęć | Wdrożymy bez zdjęć | |

**User's choice:** `/public/ksiega/` + `<img>` z placeholderami

---

## Interaktywność KsięgiInwentarzowej

| Option | Description | Selected |
|--------|-------------|----------|
| Checklista procedury wpisu | SessionStorage, analogia do Kompendium | ✓ |
| Accordion kolumn 1–15 | Każda kolumna rozwijana | ✓ |
| Tabela porównawcza Księga vs ewidencja cyfrowa | Statyczna tabela 3 kolumny | ✓ |
| Symulator / formularz testowy wpisu | Edukacyjny formularz podglądu wiersza | ✓ |

**User's choice:** Wszystkie cztery elementy  
**Notes:** To czyni KsiegaInwentarzPage stroną porównywalnej skali z KompendiumPage.

---

## Nawigacja KsięgiInwentarzowej

| Option | Description | Selected |
|--------|-------------|----------|
| Tak — sticky nav jak w KompendiumPage | Lewa szuflada desktop, dropdown mobile | ✓ |
| Nie — bez bocznej nawigacji | Prostsze | |

**User's choice:** Sticky nav — pełna spójność z KompendiumPage

---

## Sekcja szablonów dokumentów

| Option | Description | Selected |
|--------|-------------|----------|
| Karty z ikoną, nazwą i linkiem 'Otwórz' | Każdy szablon jako karta | ✓ |
| Prosta lista linków z ikonami | Lista elementów | |
| Karty z kategoriami | Pogrupowane w kategoriach | |

**User's choice:** Karty bez kategorii, siatka 3 kolumny, 7–15 szablonów

---

## Layout KompendiumPage

| Option | Description | Selected |
|--------|-------------|----------|
| Nowe kolorowe header-y sekcji z ikonami | Każda sekcja dostaje wyraźną kartę | ✓ |
| Progress bar czytania | Poziomy pasek u góry | ✓ |
| Karta podsumowania sekcji ("Co znajdziesz tutaj") | Intro-box na początku każdej sekcji | ✓ |
| Tylko odświeżyć palety kolorów i typografię | Zachować strukturę, zaktualizować styl | ✓ |

**User's choice:** Wszystkie cztery elementy layoutu

---

## Sekcja szablonów w nav

| Option | Description | Selected |
|--------|-------------|----------|
| Tak — dodaj do nav jako "Wzory i szablony" | Bezpośrednie przejście z menu | ✓ |
| Nie — sekcja na końcu bez wpisu w nav | Footer strony | |

**User's choice:** Dodaj do sticky nav

---

## Claude's Discretion

- Dokładna paleta kolorów nagłówków sekcji
- Wybór ikon z lucide-react
- Dokładne kroki checklisty procedury wpisu
- Treść sekcji FAQ/błędy ewidencyjne
- Kolejność pozycji nav w KsiegaInwentarzPage
- Przycisk "scroll to top" w KsiegaInwentarzPage
