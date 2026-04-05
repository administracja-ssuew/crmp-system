# Phase 5: Mapa Kampusu - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-05
**Phase:** 05 — Mapa Kampusu
**Areas discussed:** Podział widoków user vs admin, Responsywność mapy + hotspoty, Panel szczegółów miejsca

---

## Podział widoków user vs admin

| Option | Selected |
|--------|----------|
| Tylko info: nazwa, pojemność, wolne, przycisk "Jak zarezerwować" | ✓ |
| Info + lista aktywnych plakatów (bez edycji) | |
| Tylko mapa — klik nic nie robi dla usera | |

**Filtry:**
- Tak — oba (szukaj + filtr plakaty/banery) ✓

---

## Responsywność mapy + hotspoty

| Skalowanie | Selected |
|------------|----------|
| Wypełnia całą przestrzeń (object-fit contain) | ✓ |
| Stała szerokość, scroll poziomy | |
| min-h-[600px], dopasowuje | |

| Kolizja UI | Selected |
|------------|----------|
| Pasek na górze strony (sticky header) | ✓ |
| Filtry na prawo/dół | |
| Lewy margines pl-40 | |

| Tooltip | Selected |
|---------|----------|
| Nazwa + typ + status kolorowy | ✓ |
| Tylko nazwa | |
| Nazwa + wolne miejsca | |

---

## Panel szczegółów miejsca

| Admin panel | Selected |
|-------------|----------|
| Historia plakatów (zakończone + aktywne) | ✓ |
| Statystyki zajętości | ✓ |
| Edycja danych lokalizacji | ✓ |
| Centralny Rejestr Plakatów i Banerów | ✓ |

| Panel layout | Selected |
|--------------|----------|
| Zostaw jako sliding panel | |
| Modal na środku | |
| Zależy od ekranu: panel desktop, modal mobile | ✓ |

| Rejestr | Selected |
|---------|----------|
| Osobna strona /rejestr-plakatow | |
| Zakładka w MapPage (obok mapy) | ✓ |
| Część panelu admin | |

**Statystyki:** GAS ma dane historyczne — można pobrać ✓

---

## Claude's Discretion

- Implementacja tooltipa (group-hover vs useState)
- Wizualne detale Rejestru
- Obsługa braku danych historycznych
- Ikony lucide-react
