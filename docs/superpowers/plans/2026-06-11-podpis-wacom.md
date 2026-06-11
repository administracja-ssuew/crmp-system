# Podpis tabletem Wacom we wszystkich protokołach — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umożliwić podpisywanie protokołów Wydawania, Zwrotów i Windykacji piórem Wacom CTL-4100 (z myszą/dotykiem jako zapasem) z naturalną, zależną od nacisku grubością linii, przez jeden wspólny komponent `SignaturePad`, oraz zapisać podpisany protokół Windykacji jako PDF na serwer.

**Architecture:** Nowy komponent `SignaturePad` (canvas + W3C Pointer Events + odczyt `pressure`) zastępuje 3 zduplikowane implementacje rysowania w `AdminEquipmentPanel.jsx`. Wydawanie/Zwroty wysyłają podpisy do niezmienionego backendu sprzętowego jako PNG data-URL. Windykacja renderuje protokół po stronie klienta (`html2canvas` + `jspdf`) i wysyła gotowy PDF (base64) do nowej, cienkiej akcji Apps Script.

**Tech Stack:** React 18, Vite 8, Tailwind, Pointer Events API, `jspdf` + `html2canvas` (już zainstalowane), Vitest (dodawany), Google Apps Script (backend, poza repo).

**Spec:** `docs/superpowers/specs/2026-06-11-wacom-tablet-signatures-design.md`

---

## Struktura plików

- **Tworzone:**
  - `src/components/signaturePadUtils.js` — czyste funkcje (`pressureToLineWidth`, `scalePoint`).
  - `src/components/signaturePadUtils.test.js` — testy Vitest czystych funkcji.
  - `src/components/SignaturePad.jsx` — komponent canvas + Pointer Events.
  - `docs/superpowers/backend-zapiszProtokolSzkody.md` — snippet GAS do wklejenia przez użytkownika.
- **Modyfikowane:**
  - `package.json` — devDependency `vitest` + skrypt `test`.
  - `vite.config.js` — sekcja `test` dla Vitest.
  - `src/pages/AdminEquipmentPanel.jsx` — importy, stany/refy, usunięcie starych handlerów, użycie `SignaturePad` w 3 trybach, `finalizeSummons` + przyciski Windykacji.

---

## Task 1: Vitest + czyste funkcje (TDD)

**Files:**
- Modify: `package.json` (sekcja `devDependencies` + `scripts`)
- Modify: `vite.config.js`
- Create: `src/components/signaturePadUtils.test.js`
- Create: `src/components/signaturePadUtils.js`

- [ ] **Step 1: Zainstaluj Vitest**

Run: `npm install -D vitest@^2.1.0`
Expected: dodaje `vitest` do `devDependencies`, kończy się bez błędu.

- [ ] **Step 2: Dodaj skrypt `test` do `package.json`**

W `package.json` w sekcji `"scripts"` zmień:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Skonfiguruj Vitest w `vite.config.js`**

Zamień całą zawartość `vite.config.js` na:

```js
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
```

- [ ] **Step 4: Napisz testy (failing)**

Utwórz `src/components/signaturePadUtils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { pressureToLineWidth, scalePoint } from './signaturePadUtils';

describe('pressureToLineWidth', () => {
  it('zwraca fallback gdy brak nacisku (mysz/dotyk, pressure=0)', () => {
    expect(pressureToLineWidth(0)).toBe(5);
  });
  it('zwraca ~min przy bardzo niskim nacisku', () => {
    expect(pressureToLineWidth(0.0001)).toBeCloseTo(1.5, 2);
  });
  it('zwraca max przy pełnym nacisku', () => {
    expect(pressureToLineWidth(1)).toBe(6);
  });
  it('interpoluje nacisk pośredni', () => {
    expect(pressureToLineWidth(0.5)).toBeCloseTo(3.75, 2);
  });
  it('przycina nacisk powyżej 1', () => {
    expect(pressureToLineWidth(2)).toBe(6);
  });
  it('respektuje własny zakres', () => {
    expect(pressureToLineWidth(0.5, { min: 0, max: 10 })).toBe(5);
  });
});

describe('scalePoint', () => {
  it('mapuje współrzędne klienta na piksele canvasa (skala 2x)', () => {
    const rect = { left: 100, top: 50, width: 300, height: 100 };
    expect(scalePoint(100, 50, rect, 600, 200)).toEqual({ x: 0, y: 0 });
    expect(scalePoint(400, 150, rect, 600, 200)).toEqual({ x: 600, y: 200 });
  });
  it('działa przy skali 1:1', () => {
    const rect = { left: 0, top: 0, width: 600, height: 200 };
    expect(scalePoint(300, 100, rect, 600, 200)).toEqual({ x: 300, y: 100 });
  });
});
```

- [ ] **Step 5: Uruchom testy — mają NIE przejść**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./signaturePadUtils"` / funkcje niezdefiniowane.

- [ ] **Step 6: Zaimplementuj czyste funkcje**

Utwórz `src/components/signaturePadUtils.js`:

```js
// Mapuje nacisk pióra (0..1) na grubość kreski w px.
// pressure === 0 (lub brak) oznacza urządzenie bez nacisku (mysz/dotyk) -> fallback.
export function pressureToLineWidth(pressure, { min = 1.5, max = 6, fallback = 5 } = {}) {
  if (!pressure || pressure <= 0) return fallback;
  const clamped = Math.min(1, Math.max(0, pressure));
  return min + (max - min) * clamped;
}

// Przelicza współrzędne klienta (viewport) na piksele canvasa,
// uwzględniając różnicę między rozmiarem CSS a backing-store canvasa.
export function scalePoint(clientX, clientY, rect, canvasWidth, canvasHeight) {
  const scaleX = canvasWidth / rect.width;
  const scaleY = canvasHeight / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
```

- [ ] **Step 7: Uruchom testy — mają przejść**

Run: `npm test`
Expected: PASS — 8 testów zielonych.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js src/components/signaturePadUtils.js src/components/signaturePadUtils.test.js
git commit -m "feat: Vitest + czyste funkcje SignaturePad (nacisk, skalowanie)"
```

---

## Task 2: Komponent `SignaturePad`

**Files:**
- Create: `src/components/SignaturePad.jsx`

> Uwaga: rysowanie na canvasie nie jest testowane jednostkowo (jsdom nie implementuje `getContext('2d')`). Logika czysta jest pokryta w Task 1; komponent weryfikujemy buildem i checklistą manualną (Task 6).

- [ ] **Step 1: Utwórz komponent**

Utwórz `src/components/SignaturePad.jsx`:

```jsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { pressureToLineWidth, scalePoint } from './signaturePadUtils';

// Wspólne pole podpisu. Renderuje canvas (absolutny) + placeholder,
// jako fragment wstawiany do istniejącego pudełka z obramowaniem w rodzicu.
// Obsługuje pióro/mysz/dotyk przez Pointer Events; pióro Wacom daje nacisk.
const SignaturePad = forwardRef(function SignaturePad(
  { label, onChange, width = 600, height = 200, penColor = '#000080' },
  ref
) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasInk(false);
      if (onChange) onChange(null);
    },
  }), [onChange]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return scalePoint(e.clientX, e.clientY, rect, canvas.width, canvas.height);
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const point = getPoint(e);
    const last = lastPointRef.current;
    ctx.strokeStyle = penColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = pressureToLineWidth(e.pressure);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    if (!hasInk) setHasInk(true);
  };

  const endStroke = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* już zwolniony */ }
    }
    if (canvas && onChange) onChange(canvas.toDataURL());
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-crosshair absolute top-0 left-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
      {label && !hasInk && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">
          {label}
        </div>
      )}
    </>
  );
});

export default SignaturePad;
```

- [ ] **Step 2: Zweryfikuj build**

Run: `npm run build`
Expected: build kończy się bez błędu (komponent się kompiluje).

- [ ] **Step 3: Commit**

```bash
git add src/components/SignaturePad.jsx
git commit -m "feat: komponent SignaturePad (Pointer Events + nacisk)"
```

---

## Task 3: Podłączenie `SignaturePad` w Wydawaniu i Zwrotach

**Files:**
- Modify: `src/pages/AdminEquipmentPanel.jsx` (importy ~1-3; stany/refy ~31-36; handlery ~282-304; canvasy w Wydawaniu ~761-771 i Zwrotach ~954-964)

- [ ] **Step 1: Dodaj importy**

Zamień (linie 1-3):

```jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
```

na:

```jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
```

- [ ] **Step 2: Zamień refy i stany podpisów**

Zamień (linie 31-36):

```jsx
  const canvasBorrowerRef = useRef(null);
  const canvasAdminRef = useRef(null);
  const [isDrawingBorrower, setIsDrawingBorrower] = useState(false);
  const [isDrawingAdmin, setIsDrawingAdmin] = useState(false);
  const [sigBorrowerData, setSigBorrowerData] = useState(null);
  const [sigAdminData, setSigAdminData] = useState(null);
```

na:

```jsx
  const sigBorrowerRef = useRef(null);
  const sigAdminRef = useRef(null);
  const [sigBorrowerData, setSigBorrowerData] = useState(null);
  const [sigAdminData, setSigAdminData] = useState(null);
  const sigSummonsAdminRef = useRef(null);
  const sigSummonsPerpRef = useRef(null);
  const [sigSummonsAdmin, setSigSummonsAdmin] = useState(null);
  const [sigSummonsPerp, setSigSummonsPerp] = useState(null);
```

- [ ] **Step 3: Usuń stare handlery i przepisz `clearSignatures`**

Zamień (linie 282-304 — bloki `handleStartDraw`, `handleDraw`, `clearSignatures`):

```jsx
  const handleStartDraw = (e, ref, setDrawingState) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); const rect = c.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    const scaleX = c.width / rect.width; const scaleY = c.height / rect.height;
    ctx.beginPath(); ctx.moveTo(x * scaleX, y * scaleY); setDrawingState(true);
  };

  const handleDraw = (e, ref, isDrawingState) => {
    if (!isDrawingState) return; e.preventDefault();
    const c = ref.current; const ctx = c.getContext('2d'); const rect = c.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    const scaleX = c.width / rect.width; const scaleY = c.height / rect.height;
    ctx.lineTo(x * scaleX, y * scaleY); 
    ctx.strokeStyle = '#000080'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  const clearSignatures = () => { 
    if (canvasBorrowerRef.current) { const ctx = canvasBorrowerRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasBorrowerRef.current.width, canvasBorrowerRef.current.height); setSigBorrowerData(null); }
    if (canvasAdminRef.current) { const ctx = canvasAdminRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasAdminRef.current.width, canvasAdminRef.current.height); setSigAdminData(null); }
  };
```

na:

```jsx
  const clearSignatures = () => {
    if (sigAdminRef.current) sigAdminRef.current.clear();
    if (sigBorrowerRef.current) sigBorrowerRef.current.clear();
  };
```

- [ ] **Step 4: Podłącz `SignaturePad` w Wydawaniu (krok 3)**

Zamień (linie 761-764, pole Admina):

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Admina">
                        <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                        {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs">PODPIS WYDAJĄCEGO</div>}
                      </div>
```

na:

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Admina">
                        <SignaturePad ref={sigAdminRef} label="PODPIS WYDAJĄCEGO" onChange={setSigAdminData} />
                      </div>
```

Następnie zamień (linie 769-772, pole Korzystającego):

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Studenta">
                        <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                        {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs">PODPIS KORZYSTAJĄCEGO</div>}
                      </div>
```

na:

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Studenta">
                        <SignaturePad ref={sigBorrowerRef} label="PODPIS KORZYSTAJĄCEGO" onChange={setSigBorrowerData} />
                      </div>
```

- [ ] **Step 5: Podłącz `SignaturePad` w Zwrotach (returnStep 2)**

Zamień (linie 954-956, pole Przyjmującego):

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Przyjmującego">
                        <canvas ref={canvasAdminRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onMouseMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onMouseUp={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasAdminRef, setIsDrawingAdmin)} onTouchMove={e => handleDraw(e, canvasAdminRef, isDrawingAdmin)} onTouchEnd={() => {setIsDrawingAdmin(false); setSigAdminData(canvasAdminRef.current.toDataURL());}}/>
                        {!sigAdminData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">PRZYJMUJĄCY<br/>(SSUEW)</div>}
                      </div>
```

na:

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Przyjmującego">
                        <SignaturePad ref={sigAdminRef} label="PRZYJMUJĄCY (SSUEW)" onChange={setSigAdminData} />
                      </div>
```

Następnie zamień (linie 962-964, pole Zwracającego):

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Zwracającego">
                        <canvas ref={canvasBorrowerRef} width={600} height={200} className="w-full h-full cursor-crosshair absolute top-0 left-0" onMouseDown={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onMouseMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onMouseUp={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}} onTouchStart={e => handleStartDraw(e, canvasBorrowerRef, setIsDrawingBorrower)} onTouchMove={e => handleDraw(e, canvasBorrowerRef, isDrawingBorrower)} onTouchEnd={() => {setIsDrawingBorrower(false); setSigBorrowerData(canvasBorrowerRef.current.toDataURL());}}/>
                        {!sigBorrowerData && <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">ZWRACAJĄCY<br/>(STUDENT)</div>}
                      </div>
```

na:

```jsx
                      <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Zwracającego">
                        <SignaturePad ref={sigBorrowerRef} label="ZWRACAJĄCY (STUDENT)" onChange={setSigBorrowerData} />
                      </div>
```

- [ ] **Step 6: Zweryfikuj build (brak odwołań do usuniętych symboli)**

Run: `npm run build`
Expected: build OK. Brak błędów o `handleStartDraw`, `handleDraw`, `canvasAdminRef`, `canvasBorrowerRef`, `isDrawingAdmin`, `isDrawingBorrower`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminEquipmentPanel.jsx
git commit -m "feat: SignaturePad w Wydawaniu i Zwrotach, usunięcie starych handlerów"
```

---

## Task 4: Windykacja — pola podpisu + zapis PDF na serwer

**Files:**
- Modify: `src/pages/AdminEquipmentPanel.jsx` (dodać `finalizeSummons`; pola podpisu ~1076-1086; przyciski ~1089-1092)

- [ ] **Step 1: Dodaj funkcję `finalizeSummons`**

Wstaw nową funkcję bezpośrednio PO funkcji `processReturn` (czyli po linii kończącej `processReturn`, ~365, przed `getDaysPastDue`):

```jsx
  const finalizeSummons = async () => {
    if (!sigSummonsAdmin || !sigSummonsPerp) { alert("Protokół musi podpisać Dysponent oraz Sprawca!"); return; }
    setIsVerifying(true);
    try {
      const el = document.getElementById('printable-document');
      const shot = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => node.classList && node.classList.contains('print:hidden'),
      });
      const imgData = shot.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let renderW = pageWidth;
      let renderH = (shot.height * renderW) / shot.width;
      if (renderH > pageHeight) { renderH = pageHeight; renderW = (shot.width * renderH) / shot.height; }
      pdf.addImage(imgData, 'PNG', (pageWidth - renderW) / 2, 0, renderW, renderH);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const filename = `SZKODA-${today.replace(/\./g, '-')}-${(summonsData.perpetrator || 'X').replace(/\s+/g, '_')}.pdf`;
      const payload = {
        action: "zapiszProtokolSzkody",
        filename,
        pdfBase64,
        perpetrator: summonsData.perpetrator,
        albumId: summonsData.albumId,
        equipmentName: summonsData.equipmentName,
        damageType: summonsData.damageType,
      };
      const response = await fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const resData = await response.json().catch(() => ({}));
      if (resData.success) {
        alert(`Protokół Szkody zapisany!\nPDF: ${resData.link || 'Zapisano na Dysku'}`);
      } else {
        alert(`Błąd serwera: ${resData.message || 'Nieznany błąd'}. Możesz użyć „Drukuj" jako zapasu.`);
      }
    } catch (err) {
      alert("Nie udało się wygenerować/zapisać PDF. Użyj przycisku „Drukuj" jako zapasu.");
    } finally {
      setIsVerifying(false);
    }
  };
```

- [ ] **Step 2: Wstaw `SignaturePad` w pola podpisu Windykacji**

Zamień (linie 1076-1078, pole Dysponenta — pusty div z komentarzem):

```jsx
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent">
                    {/* Miejsce na fizyczny lub cyfrowy podpis Admina */}
                  </div>
```

na:

```jsx
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Dysponenta">
                    <SignaturePad ref={sigSummonsAdminRef} label="PODPIS DYSPONENTA" onChange={setSigSummonsAdmin} />
                  </div>
```

Następnie zamień (linie 1082-1084, pole Sprawcy — pusty div z komentarzem):

```jsx
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent">
                    {/* Miejsce na podpis Sprawcy */}
                  </div>
```

na:

```jsx
                  <div className="w-full h-24 border border-black relative touch-none bg-gray-50 print:bg-transparent" title="Podpis Sprawcy">
                    <SignaturePad ref={sigSummonsPerpRef} label="PODPIS SPRAWCY" onChange={setSigSummonsPerp} />
                  </div>
```

- [ ] **Step 3: Zamień przyciski Windykacji (dodaj zapis + czyszczenie, zachowaj druk)**

Zamień (linie 1089-1092):

```jsx
              <div className="mt-16 flex gap-4 print:hidden border-t border-slate-200 pt-6">
                <button onClick={() => setShowSummonsDocument(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase text-xs">Wróć</button>
                <button onClick={() => window.print()} className="bg-red-600 text-white py-4 px-6 rounded-xl font-black uppercase text-xs flex-1">🖨️ Podpisz i Zapisz (PDF)</button>
              </div>
```

na:

```jsx
              <div className="mt-16 flex flex-wrap gap-4 print:hidden border-t border-slate-200 pt-6">
                <button onClick={() => setShowSummonsDocument(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-xl font-black uppercase text-xs">Wróć</button>
                <button onClick={() => { if (sigSummonsAdminRef.current) sigSummonsAdminRef.current.clear(); if (sigSummonsPerpRef.current) sigSummonsPerpRef.current.clear(); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 px-6 rounded-xl font-bold uppercase text-[10px]">Wyczyść Podpisy</button>
                <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 py-4 px-6 rounded-xl font-black uppercase text-xs">🖨️ Drukuj</button>
                <button onClick={finalizeSummons} disabled={!sigSummonsAdmin || !sigSummonsPerp || isVerifying} className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white py-4 px-6 rounded-xl font-black uppercase text-xs flex-1">{isVerifying ? 'Zapisywanie...' : 'Podpisz i Zapisz (PDF)'}</button>
              </div>
```

- [ ] **Step 4: Zweryfikuj build**

Run: `npm run build`
Expected: build OK, brak błędów o niezdefiniowanych symbolach (`finalizeSummons`, `sigSummonsAdmin`, `sigSummonsPerp`, refy).

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminEquipmentPanel.jsx
git commit -m "feat: podpis cyfrowy + zapis PDF na serwer w protokole Windykacji"
```

---

## Task 5: Snippet backendu GAS (deliverable dla użytkownika)

**Files:**
- Create: `docs/superpowers/backend-zapiszProtokolSzkody.md`

> Backend sprzętowy nie jest w repo (jest wdrożony). Ten plik to instrukcja + snippet do ręcznego wklejenia przez użytkownika do jego Apps Scriptu.

- [ ] **Step 1: Utwórz plik z instrukcją i snippetem**

Utwórz `docs/superpowers/backend-zapiszProtokolSzkody.md`:

```markdown
# Backend: akcja `zapiszProtokolSzkody` (do wklejenia ręcznie)

Frontend Windykacji wysyła gotowy PDF (base64) akcją `zapiszProtokolSzkody`.
Dodaj poniższą obsługę do `doPost` w SWOIM wdrożonym Apps Scripcie sprzętowym
(tym spod `API_URL` w `src/pages/AdminEquipmentPanel.jsx`), a następnie wdróż
nową wersję (Deploy → Manage deployments → Edit → New version).

## Krok 1 — ustaw ID folderu Dysku
Podmień `<<ID_FOLDERU_DYSKU>>` na ID folderu, w którym mają lądować PDF-y
(najlepiej ten sam folder, do którego trafiają protokoły Wydania/Zwrotu).

## Krok 2 — dodaj w `doPost` (obok istniejących `if (parsedData.action === ...)`)

\`\`\`js
if (parsedData.action === 'zapiszProtokolSzkody') {
  const bytes = Utilities.base64Decode(parsedData.pdfBase64);
  const blob = Utilities.newBlob(bytes, 'application/pdf', parsedData.filename || 'protokol-szkody.pdf');
  const folder = DriveApp.getFolderById('<<ID_FOLDERU_DYSKU>>');
  const file = folder.createFile(blob);

  // (opcjonalnie) log do arkusza „Szkody": utwórz arkusz o tej nazwie z nagłówkami
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Szkody');
    if (!sheet) {
      sheet = ss.insertSheet('Szkody');
      sheet.appendRow(['Data', 'Sprawca', 'Nr albumu', 'Sprzęt', 'Rodzaj szkody', 'Link PDF']);
    }
    sheet.appendRow([
      new Date(),
      parsedData.perpetrator || '',
      parsedData.albumId || '',
      parsedData.equipmentName || '',
      parsedData.damageType || '',
      file.getUrl(),
    ]);
  } catch (logErr) {
    // log opcjonalny — brak arkusza nie blokuje zapisu pliku
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, link: file.getUrl() }))
    .setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

## Uwagi
- Jeśli Twój doPost ma już helper typu `jsonResponse(...)`, użyj go zamiast
  ręcznego `ContentService...` — efekt ten sam.
- Po wdrożeniu URL deploymentu MUSI pozostać ten sam co `API_URL` (użyj „New
  version" istniejącego deploymentu, nie twórz nowego URL).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/backend-zapiszProtokolSzkody.md
git commit -m "docs: snippet backendu GAS dla zapiszProtokolSzkody"
```

---

## Task 6: Weryfikacja końcowa + checklista manualna

**Files:** brak (weryfikacja)

- [ ] **Step 1: Testy jednostkowe**

Run: `npm test`
Expected: PASS (8 testów).

- [ ] **Step 2: Build produkcyjny**

Run: `npm run build`
Expected: build OK, bez ostrzeżeń o nieużywanych/niezdefiniowanych symbolach z usuniętego kodu.

- [ ] **Step 3: Test manualny — uruchom dev i sprawdź (wymaga przeglądarki, najlepiej Chromium na Windows)**

Run: `npm run dev`

Sprawdź ręcznie:
1. **Wydawanie** → przejdź do kroku 3 (Protokół). Pole „PODPIS WYDAJĄCEGO" i „PODPIS KORZYSTAJĄCEGO" rysują myszą. Po podpisaniu obu — przycisk „Zatwierdź Wydanie" się odblokowuje. „Wyczyść Podpisy" czyści oba pola (placeholdery wracają).
2. **Pióro Wacom** (jeśli podłączone): rysowanie piórem działa, mocniejszy nacisk = grubsza linia.
3. **Zwroty** → wybierz aktywny protokół → krok 2. Oba pola podpisu działają, „Zatwierdź Zwrot" odblokowuje się po obu podpisach.
4. **Windykacja** → wypełnij formularz → „Generuj Protokół" → na dole pola „PODPIS DYSPONENTA" i „PODPIS SPRAWCY". Po obu podpisach „Podpisz i Zapisz (PDF)" się odblokowuje; klik generuje PDF i wysyła na serwer (po dodaniu backendu z Task 5 zwraca link). Bez backendu pokaże komunikat błędu serwera — wtedy „Drukuj" działa jako zapas.
5. **Dotyk** (jeśli ekran dotykowy): rysowanie palcem działa, strona nie przewija się podczas pisania.

> **Znane ryzyko (do odnotowania w teście):** jeśli `html2canvas` zgłosi błąd parsowania kolorów (`oklch`) przy generowaniu PDF Windykacji, zadziała `try/catch` → komunikat + przycisk „Drukuj" pozostaje sprawnym zapasem. Rdzeń protokołu używa standardowych kolorów (`text-black`, `bg-gray-50/100`, `border-black`), więc nie powinno wystąpić.

- [ ] **Step 4: (jeśli wszystko działa) — gałąź gotowa do przeglądu/scalania**

Brak commita — kod był commitowany w taskach 1-5. Przejdź do finalizacji gałęzi (PR / merge) wg potrzeb.

---

## Self-review (wykonane przy pisaniu planu)

- **Pokrycie spec:** komponent (Task 2) ✓; Pointer Events + nacisk (Task 1+2) ✓; użycie w 3 trybach (Task 3-4) ✓; Windykacja PDF→serwer (Task 4) ✓; backend snippet (Task 5) ✓; Vitest + testy manualne (Task 1, 6) ✓; usunięcie duplikatów/dead code (Task 3) ✓.
- **Spójność typów/nazw:** `SignaturePad` props `{ label, onChange, width, height, penColor }` i metoda ref `clear()` używane identycznie w Task 2/3/4. Refy: `sigAdminRef`, `sigBorrowerRef`, `sigSummonsAdminRef`, `sigSummonsPerpRef`. Stany: `sigAdminData`, `sigBorrowerData`, `sigSummonsAdmin`, `sigSummonsPerp`. Akcja backendu `zapiszProtokolSzkody` zgodna między frontendem (Task 4) a snippetem (Task 5).
- **Odstępstwo od spec (świadome):** pominięto `isEmpty()` w `useImperativeHandle` (YAGNI — rodzic bramkuje przyciski na własnym stanie `sig*Data`/`sigSummons*` podnoszonym przez `onChange`).
- **Placeholdery:** jedyny świadomy `<<ID_FOLDERU_DYSKU>>` w snippecie GAS (do uzupełnienia przez użytkownika).
```
