# Podpis tabletem Wacom we wszystkich protokołach — projekt

**Data:** 2026-06-11
**Plik docelowy (frontend):** `src/pages/AdminEquipmentPanel.jsx`
**Nowy komponent:** `src/components/SignaturePad.jsx`
**Sprzęt:** Wacom Intuos CTL-4100 (tablet piórkowy bez ekranu)

## Kontekst i ograniczenia sprzętowe

Wacom Intuos CTL-4100 to tablet piórkowy **bez własnego wyświetlacza**. Po
zainstalowaniu sterownika Wacom system widzi go jako **urządzenie wskazujące**
(pointer). Osoba podpisująca patrzy na **monitor komputera** i pisze piórem „na
ślepo" po powierzchni tabletu — podpis pojawia się w polu na ekranie. To nie
jest podpis jak na tablecie z ekranem (np. Wacom STU).

Sterownik wystawia pióro przez **W3C Pointer Events** (`pointerType === 'pen'`)
z odczytem nacisku (`pressure` 0–1). Rekomendowana przeglądarka: Chromium
(Edge/Chrome) na Windows.

## Cel

1. Podpisywanie protokołów piórem Wacom (mysz/dotyk jako zapas), z naturalnie
   zmienną grubością linii zależną od nacisku.
2. Ujednolicenie 3 dziś skopiowanych implementacji podpisu (Wydawanie, Zwroty,
   plus puste pola w Windykacji) w jeden wspólny komponent.
3. Dodanie realnych pól podpisu cyfrowego do protokołu Windykacji (dziś ma puste
   `<div>` i tylko `window.print()`).
4. Zapis podpisanego protokołu Windykacji na serwer jako PDF.

## Decyzje (zatwierdzone z użytkownikiem)

- **Zakres:** wszystkie protokoły, jeden wspólny komponent.
- **UX podpisu:** pola w obecnych miejscach i rozmiarach, tylko ulepszone o pióro
  i nacisk. Bez nakładki pełnoekranowej. Układ stron bez zmian.
- **Przechwytywanie pióra (wariant A1):** natywne **Pointer Events + nacisk**,
  zero nowych zależności runtime. (Odrzucone: biblioteka `signature_pad` —
  zbędna zależność; Wacom Signature SDK — ciężki/kruche przy React+GAS,
  a CTL-4100 to tablet kreatywny, nie podpisowy.)
- **Zapis Windykacji (wariant B1):** **PDF po stronie klienta** (`jspdf` +
  `html2canvas`, już w zależnościach) → upload base64 do cienkiej nowej akcji
  GAS, która zapisuje plik na Dysku i zwraca link. (Odrzucone: wysyłka HTML jak
  `zapiszWydanie` — zależy od logiki backendu sprzętowego, którego nie ma w repo.)
- **Testy:** dodajemy **Vitest** dla czystych funkcji + checklista manualna.

## Architektura — komponent `SignaturePad`

`src/components/SignaturePad.jsx`, eksportowany jako `forwardRef`.

### Propsy
- `label: string` — tekst placeholdera widoczny, gdy pole puste (np.
  „PODPIS WYDAJĄCEGO").
- `onChange(dataUrl: string | null)` — wołany po zakończeniu kreski (zwraca PNG
  data URL) oraz przy wyczyszczeniu (`null`).
- `width = 600`, `height = 200` — wymiary w pikselach canvasa (zgodne z obecnymi).
- `penColor = '#000080'`.
- `className` / styl kontenera — zachowuje obecny wygląd pudełka
  (`w-full h-24 border border-black relative touch-none bg-gray-50 ...`).

### Wnętrze
- `useRef` na element `<canvas>`.
- Jeden zestaw **Pointer Events**: `onPointerDown`, `onPointerMove`,
  `onPointerUp`, `onPointerLeave`, `onPointerCancel` (zastępuje osobne
  mouse + touch).
- `target.setPointerCapture(e.pointerId)` na `pointerdown` — kreska nie urywa się,
  gdy pióro chwilowo opuści pole.
- Skalowanie współrzędnych canvas↔CSS zachowane z obecnego kodu
  (`scaleX = canvas.width / rect.width`, analogicznie Y).
- **Nacisk → grubość linii:** czysta funkcja `pressureToLineWidth(pressure)`:
  - pióro: `pressure` w zakresie 0–1 → grubość interpolowana w zakresie
    np. `[1.5, 6]` px.
  - mysz/dotyk bez nacisku (`pressure === 0`): stała grubość ≈5px (zachowanie
    zbliżone do obecnego).
  - Każdy segment kreski rysowany osobno (`beginPath`/`moveTo`/`lineTo`/`stroke`)
    z własną grubością; `lineCap`/`lineJoin = 'round'`.
- `touch-action: none` na canvasie (zapobiega przewijaniu/gestom podczas pisania).
- `useImperativeHandle(ref, () => ({ clear(), isEmpty() }))`.

### Czyste funkcje (wydzielone, testowalne)
`src/components/signaturePadUtils.js`:
- `pressureToLineWidth(pressure, { min, max, fallback })` → number.
- `scalePoint(clientX, clientY, rect, canvasW, canvasH)` → `{ x, y }`.

## Miejsca użycia w `AdminEquipmentPanel.jsx`

1. **Wydawanie (krok 3):** zamiana dwóch inline `<canvas>` (Wydający +
   Korzystający) na `<SignaturePad>`; podpięcie pod istniejące
   `setSigAdminData` / `setSigBorrowerData`.
2. **Zwroty (returnStep 2):** ta sama zamiana (Przyjmujący + Zwracający), te same
   stany `sigAdminData` / `sigBorrowerData`.
3. **Windykacja:** dwa puste `<div>` zamienione na `<SignaturePad>` (Dysponent +
   Sprawca). Nowe stany: `sigSummonsAdmin`, `sigSummonsPerp`.

Funkcja `clearSignatures()` oraz bramki przycisków (`disabled={!sig...}`)
zostają — działają na stanie podnoszonym przez `onChange`. Refy do `clear()`
wywoływane z poziomu rodzica przy czyszczeniu.

Usuwane (po migracji): stare `handleStartDraw`, `handleDraw`, osobne stany
`isDrawingBorrower`/`isDrawingAdmin` oraz duplikaty atrybutów
`onMouseDown/onTouchStart/...` w JSX.

## Przepływ danych

- Pióro/mysz/dotyk → `PointerEvent` → `SignaturePad` rysuje + `onChange(dataURL)`
  → stan rodzica.
- **Wydawanie / Zwroty:** stan → istniejący POST (`sigBorrower` / `sigAdmin`,
  data URL PNG) → **backend sprzętowy bez zmian**.
- **Windykacja:** podpisy narysowane w canvasach → `html2canvas` na regionie
  `#printable-document` → `jspdf` (A4) → base64 → **nowy POST**
  `action: 'zapiszProtokolSzkody'` → **nowa akcja GAS** → zapis PDF na Dysku →
  zwrot `{ success, link }`. `window.print()` pozostaje jako ręczny zapas.

### Nowa funkcja `finalizeSummons()` (frontend)
1. Walidacja: oba podpisy obecne (`sigSummonsAdmin && sigSummonsPerp`).
2. `html2canvas(printableEl)` → `jsPDF` A4 → `doc.output('datauristring')` /
   base64.
3. POST do `API_URL`: `{ action: 'zapiszProtokolSzkody', filename, pdfBase64,
   perpetrator, albumId, equipmentName, damageType }`.
4. Sukces → alert z linkiem; błąd → alert + dostępny `window.print()`.

## Backend (do dopisania w wdrożonym Apps Scripcie — POZA tym repo)

Kod backendu sprzętowego (obsługa `zapiszWydanie`/`zapiszZwrot`, generacja PDF)
**nie znajduje się w repo** — w repo jest tylko `GAS_updated.js` (plakaty/banery).
Dostarczony zostanie gotowy snippet w stylu `GAS_updated.js`:

```js
// w doPost, obok istniejących akcji:
if (parsedData.action === 'zapiszProtokolSzkody') {
  const bytes = Utilities.base64Decode(parsedData.pdfBase64);
  const blob = Utilities.newBlob(bytes, 'application/pdf', parsedData.filename);
  const folder = DriveApp.getFolderById('<<ID_FOLDERU_DYSKU>>'); // do ustawienia
  const file = folder.createFile(blob);
  // opcjonalnie: wpis do arkusza „Szkody"
  return jsonResponse({ success: true, link: file.getUrl() });
}
```

**Użytkownik wkleja snippet do swojego skryptu sprzętowego i ustawia ID folderu
Dysku.** To jedyna część, której nie da się uruchomić z tego repo.

## Obsługa błędów

- Zwolnienie pointer capture na `pointerup`/`cancel`/`leave`.
- `pressure === 0` → grubość domyślna (mysz/urządzenia bez nacisku).
- Null-check `canvas.getContext('2d')`.
- Windykacja: generacja PDF i upload w `try/catch`; przy błędzie alert i
  pozostawienie `window.print()`, by dokument nie zginął.
- `html2canvas` bezpiecznie przechwytuje canvas podpisu (brak zewnętrznych
  obrazów → brak tainted canvas).

## Co pozostaje bez zmian

- Format PNG data-URL dla Wydawania/Zwrotów (backend sprzętowy niezmieniony).
- Bramki przycisków `disabled={!sigBorrowerData || !sigAdminData}`.
- Układ stron, etykiety, style druku (`print:`), numeracja protokołów.

## Testy

- **Vitest** (nowa devDependency + skrypt `test`) dla czystych funkcji:
  - `pressureToLineWidth` — granice 0/0.5/1, fallback dla nacisku 0.
  - `scalePoint` — poprawne skalowanie przy różnicy rozmiaru canvas vs CSS.
- **Checklista manualna** (wymaga tabletu / przeglądarki):
  1. Pióro Wacom rysuje w polu; nacisk zmienia grubość linii.
  2. Mysz i dotyk nadal działają (stała grubość).
  3. „Wyczyść Podpisy" czyści oba pola i resetuje stan.
  4. Wydawanie i Zwroty: przycisk zatwierdzenia odblokowuje się po obu podpisach;
     PDF z backendu zawiera podpisy.
  5. Windykacja: po obu podpisach generuje się PDF, wgrywa na Dysk, zwraca link;
     przy błędzie sieci działa `window.print()`.

## Poza zakresem

- Nakładka pełnoekranowa „Podpisz tutaj".
- Wacom Signature SDK / dane biometryczne podpisu.
- Modyfikacja serwerowej generacji PDF dla Wydawania/Zwrotów.
- Mapowanie absolutne/relatywne tabletu (konfiguracja w sterowniku Wacom, nie w
  aplikacji).
