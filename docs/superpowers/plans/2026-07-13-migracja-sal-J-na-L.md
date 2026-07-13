# Migracja sal J → L + wygaszenie Kalendarza Organizacji Studenckich — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przenieść wszystkie sale budynku J na sale budynku L (9J→110 L, 16J→106 L, 28J→101 L, 11J→13 L, 24J→108 L), usunąć sale 10 A/213 Z/214 Z, wygasić Kalendarz Organizacji Studenckich, oraz wyprowadzić tożsamość sal do jednego centralnego modułu.

**Architecture:** Wariant B — powstaje `src/data/rooms.js` jako jedyne źródło prawdy (id sal, grupy, flagi, kolory). Pliki funkcyjne (`CalendarSamorzadPage`, `AccessListPage`, `AdminAccessPanel`) importują z modułu zamiast hardkodować sale. Org-kalendarz (`UniversalCalendarPage`) zostaje w repo, ale dostaje baner „nieaktywny" i blokadę rezerwacji. Teksty/knowledge/placeholdery aktualizowane ręcznie. Migracja danych backendu (Google Sheets) — osobna notatka dla użytkownika.

**Tech Stack:** React 18, Vite 8, Tailwind, Vitest (już skonfigurowany), Google Apps Script (backend, poza repo).

**Spec:** `docs/superpowers/specs/2026-07-13-migracja-sal-J-na-L-design.md`

---

## Struktura plików

- **Tworzone:**
  - `src/data/rooms.js` — jedyne źródło prawdy o salach.
  - `src/data/rooms.test.js` — testy Vitest modułu.
  - `docs/superpowers/backend-migracja-sal.md` — notatka migracji backendu (deliverable).
- **Modyfikowane:**
  - `src/pages/CalendarSamorzadPage.jsx` — import z modułu, usunięcie 213 Z/214 Z, filtry/siatka/opcje.
  - `src/pages/AccessListPage.jsx` — `ROOMS`→`RECRUITMENT_ROOMS`, sala specjalna.
  - `src/pages/AdminAccessPanel.jsx` — mapa dostępów + kolejność PDF, sala specjalna.
  - `src/pages/UniversalCalendarPage.jsx` — baner + blokada rezerwacji + usunięcie sal campus.
  - `src/pages/CalendarSelectionPage.jsx` — kafelek org-kalendarza nieaktywny + teksty.
  - `src/knowledge.js`, `src/pages/DocumentsPage.jsx`, `src/pages/KompendiumPage.jsx` — wzmianki tekstowe.

**Mapowanie (kanoniczny format `<numer> L`):** 9J→110 L, 16J→106 L, 28J→101 L, 11J→13 L, 24J→108 L. Usuwane: 10 A, 213 Z, 214 Z.

---

## Task 1: Centralny moduł `rooms.js` + testy (TDD)

**Files:**
- Create: `src/data/rooms.js`
- Create: `src/data/rooms.test.js`

- [ ] **Step 1: Napisz testy (failing)**

Utwórz `src/data/rooms.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { ROOMS, SAMORZAD_ROOMS, RECRUITMENT_ROOMS, ACCESS_PDF_ORDER, SPECIAL_ROOM, PERMANENT_ROOM } from './rooms';

describe('rooms — migracja J → L', () => {
  const ids = Object.keys(ROOMS);

  it('żadne id sali nie zawiera litery J', () => {
    expect(ids.some(id => /J/.test(id))).toBe(false);
  });
  it('wszystkie sale są w budynku L', () => {
    expect(ids.every(id => ROOMS[id].building === 'L')).toBe(true);
  });
  it('skasowane/stare sale nie występują', () => {
    for (const gone of ['9J', '16J', '28J', '11 J', '24 J', '10 A', '213 Z', '214 Z']) {
      expect(ids).not.toContain(gone);
    }
  });
  it('obecne są nowe id sal', () => {
    for (const id of ['110 L', '106 L', '101 L', '13 L', '108 L']) {
      expect(ids).toContain(id);
    }
  });
  it('RECRUITMENT_ROOMS nie zawiera sali tylko-stałej (108 L)', () => {
    expect(RECRUITMENT_ROOMS).not.toContain(PERMANENT_ROOM);
    expect(PERMANENT_ROOM).toBe('108 L');
  });
  it('SAMORZAD_ROOMS to rdzeń 110/106/101 L', () => {
    expect(SAMORZAD_ROOMS).toEqual(['110 L', '106 L', '101 L']);
  });
  it('ACCESS_PDF_ORDER zawiera wszystkie 5 sal', () => {
    expect(ACCESS_PDF_ORDER).toEqual(['110 L', '106 L', '101 L', '13 L', '108 L']);
  });
  it('SPECIAL_ROOM to 13 L i ma kind=special', () => {
    expect(SPECIAL_ROOM).toBe('13 L');
    expect(ROOMS[SPECIAL_ROOM].kind).toBe('special');
  });
  it('każda sala ma activeColor (klasa Tailwind)', () => {
    expect(ids.every(id => typeof ROOMS[id].activeColor === 'string' && ROOMS[id].activeColor.startsWith('bg-'))).toBe(true);
  });
});
```

- [ ] **Step 2: Uruchom testy — mają NIE przejść**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./rooms"`.

- [ ] **Step 3: Zaimplementuj moduł**

Utwórz `src/data/rooms.js`:

```js
// Jedyne źródło prawdy o salach Samorządu — budynek L (po przenosinach z budynku J).
// Zmiana/dodanie sali = edycja tego jednego pliku.
export const ROOMS = {
  '110 L': { label: '110 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-emerald-600' }, // było 9J
  '106 L': { label: '106 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-blue-600' },    // było 16J
  '101 L': { label: '101 L', building: 'L', kind: 'samorzad',  activeColor: 'bg-indigo-600' },  // było 28J
  '13 L':  { label: '13 L',  building: 'L', kind: 'special',   activeColor: 'bg-amber-600' },   // było 11J
  '108 L': { label: '108 L', building: 'L', kind: 'permanent', activeColor: 'bg-fuchsia-600' }, // było 24J
};

// Rdzeń zawsze-dostępny (siatka kalendarza Samorządu):
export const SAMORZAD_ROOMS = ['110 L', '106 L', '101 L'];
// Sale w formularzu rekrutacji dostępu (108 L wykluczona — tylko stały dostęp):
export const RECRUITMENT_ROOMS = ['110 L', '106 L', '101 L', '13 L'];
// Kolejność sal w PDF panelu dostępów:
export const ACCESS_PDF_ORDER = ['110 L', '106 L', '101 L', '13 L', '108 L'];

export const SPECIAL_ROOM = '13 L';   // wymaga dodatkowych pytań projektowych (było 11J)
export const PERMANENT_ROOM = '108 L'; // tylko stały dostęp, brak rekrutacji (było 24J)
```

- [ ] **Step 4: Uruchom testy — mają przejść**

Run: `npm test`
Expected: PASS — testy `rooms` zielone (plus wcześniejsze testy SignaturePad).

- [ ] **Step 5: Commit**

```bash
git add src/data/rooms.js src/data/rooms.test.js
git commit -m "feat: centralny moduł sal (rooms.js) + testy — migracja J na L"
```

---

## Task 2: Refaktor `CalendarSamorzadPage.jsx`

**Files:**
- Modify: `src/pages/CalendarSamorzadPage.jsx`

- [ ] **Step 1: Dodaj import modułu i usuń `CAMPUS_ROOMS`**

Zamień (linie 1-12):

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';
const HOURS = Array.from({ length: 24 }, (_, i) => i); 

const CAMPUS_ROOMS = {
  '10 A': { days: [2, 3], start: 18, end: 22 }, 
  '213 Z': { days: [4, 5], start: 18, end: 22 }, 
  '214 Z': { days: [1, 5], start: 18, end: 22 }
};
```

na:

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SAMORZAD_ROOMS, ROOMS } from '../data/rooms';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwy2oHgy_tsWrrSQ39XRteKuxjRK46yiMvsYDqT-Z4xOUUhfkCAzGMLzXs-i8ckIIBxhg/exec';
const HOURS = Array.from({ length: 24 }, (_, i) => i); 
```

- [ ] **Step 2: Domyślna sala formularza**

Zamień (linia 24):

```jsx
  date: '', room: '9J', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
```

na:

```jsx
  date: '', room: '110 L', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
```

- [ ] **Step 3: Przyciski filtrów sal (z modułu)**

Zamień (linie 263-269):

```jsx
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                <button onClick={() => setFilterRoom('9J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '9J' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>9J</button>
                <button onClick={() => setFilterRoom('16J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '16J' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>16J</button>
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                <button onClick={() => setFilterRoom('10 A')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '10 A' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>10 A</button>
                <button onClick={() => setFilterRoom('213 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '213 Z' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>213 Z</button>
                <button onClick={() => setFilterRoom('214 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '214 Z' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>214 Z</button>
```

na:

```jsx
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                {SAMORZAD_ROOMS.map(r => (
                  <button key={r} onClick={() => setFilterRoom(r)} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === r ? `${ROOMS[r].activeColor} text-white` : 'text-slate-500 hover:bg-slate-100'}`}>{r}</button>
                ))}
```

- [ ] **Step 4: `dailyRooms` z modułu (usuń pętlę campus)**

Zamień (linie 328-329):

```jsx
            let dailyRooms = ['9J', '16J', '28J'];
            Object.keys(CAMPUS_ROOMS).forEach(room => { if (CAMPUS_ROOMS[room].days.includes(dayOfWeek)) dailyRooms.push(room); });
```

na:

```jsx
            let dailyRooms = [...SAMORZAD_ROOMS];
```

- [ ] **Step 5: Usuń nakładkę „SALA ZABLOKOWANA" (campus) i popraw regułę wolnego dostępu**

Zamień (linie 358-382):

```jsx
                    {roomsToRender.map(room => {
                        const campusRules = CAMPUS_ROOMS[room];

                        return (
                        <div key={room} className="flex items-center mb-2 relative h-12">
                          <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border h-full text-xs sticky left-0 z-20">{room}</div>
                          <div className="flex-grow bg-slate-50/30 rounded-r-xl border h-full relative flex overflow-hidden">
                            {HOURS.map(h => <div key={h} className="flex-1 border-l"></div>)}
                            
                            {campusRules && (
                              <>
                                <div className="absolute top-0 bottom-0 left-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${(campusRules.start / 24) * 100}%`}}>
                                  <span className="text-[10px] font-bold text-slate-400 opacity-50 px-2 truncate">SALA ZABLOKOWANA</span>
                                </div>
                                <div className="absolute top-0 bottom-0 right-0 bg-slate-200/60 z-0 flex items-center justify-center" style={{width: `${((24 - campusRules.end) / 24) * 100}%`}}>
                                </div>
                              </>
                            )}

                            {room === '9J' && isWorkingDay && (
```

na:

```jsx
                    {roomsToRender.map(room => {
                        return (
                        <div key={room} className="flex items-center mb-2 relative h-12">
                          <div className="w-14 shrink-0 flex items-center justify-center font-black text-slate-500 bg-slate-50 rounded-l-xl border h-full text-xs sticky left-0 z-20">{room}</div>
                          <div className="flex-grow bg-slate-50/30 rounded-r-xl border h-full relative flex overflow-hidden">
                            {HOURS.map(h => <div key={h} className="flex-1 border-l"></div>)}

                            {room === '110 L' && isWorkingDay && (
```

- [ ] **Step 6: Lista `<option>` w modalu szybkiej rezerwacji**

Zamień (linie 493-494):

```jsx
                  <option value="9J">Sala 9J</option><option value="16J">Sala 16J</option><option value="28J">Sala 28J</option>
                  {Object.keys(CAMPUS_ROOMS).map(r => <option key={r} value={r}>Sala {r}</option>)}
```

na:

```jsx
                  {SAMORZAD_ROOMS.map(r => <option key={r} value={r}>Sala {r}</option>)}
```

- [ ] **Step 7: Zweryfikuj brak pozostałości i build**

Run: `npm run build`
Expected: build OK. Brak błędów o `CAMPUS_ROOMS`. Grep pliku nie zwraca `9J`, `16J`, `28J`, `10 A`, `213 Z`, `214 Z`, `CAMPUS_ROOMS`.

- [ ] **Step 8: Commit**

```bash
git add src/pages/CalendarSamorzadPage.jsx
git commit -m "refactor: CalendarSamorzad na moduł sal L, usunięcie sal campus 213/214 Z"
```

---

## Task 3: Refaktor `AccessListPage.jsx`

**Files:**
- Modify: `src/pages/AccessListPage.jsx`

- [ ] **Step 1: Import modułu + `ROOMS` z `RECRUITMENT_ROOMS`**

Zamień (linie 31-32):

```jsx
// --- Rooms available in form (24J is permanent-only — no recruitment) ---
export const ROOMS = ['9 J', '16 J', '28 J', '11 J']
```

na:

```jsx
// --- Rooms available in form (108 L is permanent-only — no recruitment) ---
import { RECRUITMENT_ROOMS, SPECIAL_ROOM } from '../data/rooms'
export const ROOMS = RECRUITMENT_ROOMS
```

> Uwaga: `import` musi trafić na górę pliku razem z pozostałymi importami — przenieś tę linię `import { RECRUITMENT_ROOMS, SPECIAL_ROOM } from '../data/rooms'` pod istniejące importy na początku pliku, a w miejscu linii 31-32 zostaw tylko komentarz + `export const ROOMS = RECRUITMENT_ROOMS`.

- [ ] **Step 2: `needs11J` na `SPECIAL_ROOM`**

Zamień (linia 70):

```jsx
  const needs11J = form.rooms.includes('11 J')
```

na:

```jsx
  const needs11J = form.rooms.includes(SPECIAL_ROOM)
```

- [ ] **Step 3: Komunikaty walidacji (11J → 13 L)**

Zamień (linie 99-101):

```jsx
      if (!form.projectName.trim()) { setError('Podaj nazwę projektu (wymagane dla sali 11J).'); return }
      if (!form.projectRole.trim()) { setError('Podaj swoją rolę w projekcie (wymagane dla sali 11J).'); return }
      if (!form.justification11J.trim()) { setError('Podaj uzasadnienie dostępu do sali 11J.'); return }
```

na:

```jsx
      if (!form.projectName.trim()) { setError('Podaj nazwę projektu (wymagane dla sali 13 L).'); return }
      if (!form.projectRole.trim()) { setError('Podaj swoją rolę w projekcie (wymagane dla sali 13 L).'); return }
      if (!form.justification11J.trim()) { setError('Podaj uzasadnienie dostępu do sali 13 L.'); return }
```

- [ ] **Step 4: Badge „SPECJALNA" przy sali specjalnej**

Zamień (linia 284):

```jsx
                      {room === '11 J' && <span className="ml-auto text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">SPECJALNA</span>}
```

na:

```jsx
                      {room === SPECIAL_ROOM && <span className="ml-auto text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">SPECJALNA</span>}
```

- [ ] **Step 5: Teksty sekcji dodatkowej (11J → 13 L)**

Zamień (linie 305, 307, 328, 331):

```jsx
                    <p className="text-sm font-black text-amber-800">Sala 11J — dodatkowe informacje</p>
```
na
```jsx
                    <p className="text-sm font-black text-amber-800">Sala 13 L — dodatkowe informacje</p>
```

```jsx
                  <p className="text-xs text-amber-700">Dostęp do sali 11J wymaga podania dodatkowych informacji o projekcie.</p>
```
na
```jsx
                  <p className="text-xs text-amber-700">Dostęp do sali 13 L wymaga podania dodatkowych informacji o projekcie.</p>
```

```jsx
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Uzasadnienie dostępu do sali 11J *</label>
```
na
```jsx
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Uzasadnienie dostępu do sali 13 L *</label>
```

```jsx
                      placeholder="Opisz szczegółowo, dlaczego Twój projekt wymaga dostępu do sali 11J..."
```
na
```jsx
                      placeholder="Opisz szczegółowo, dlaczego Twój projekt wymaga dostępu do sali 13 L..."
```

> Nazwy pól/kluczy (`justification11J`, `needs11J`) zostają — to identyfikatory, nie sale; ich zmiana zepsułaby payload/backend rekrutacji.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build OK. Grep pliku nie zwraca `'9 J'`, `'16 J'`, `'28 J'`, `'11 J'` ani „sali 11J".

- [ ] **Step 7: Commit**

```bash
git add src/pages/AccessListPage.jsx
git commit -m "refactor: AccessList na RECRUITMENT_ROOMS + sala specjalna 13 L"
```

---

## Task 4: Refaktor `AdminAccessPanel.jsx`

**Files:**
- Modify: `src/pages/AdminAccessPanel.jsx`

- [ ] **Step 1: Import modułu**

Zamień (linie 1-4):

```jsx
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
```

na:

```jsx
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { ACCESS_PDF_ORDER, SPECIAL_ROOM } from '../data/rooms'
```

- [ ] **Step 2: Przeklucz mapę `PERMANENT` na nowe id**

Zamień (linie 32-47):

```jsx
const PERMANENT = {
  '9 J':  CORE_MEMBERS,
  '16 J': CORE_MEMBERS,
  '28 J': CORE_MEMBERS,
  '11 J': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
    { name: 'Karol Vogel',       index: '194535' },
  ],
  '24 J': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
  ],
}
```

na:

```jsx
const PERMANENT = {
  '110 L': CORE_MEMBERS,
  '106 L': CORE_MEMBERS,
  '101 L': CORE_MEMBERS,
  '13 L': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
    { name: 'Karol Vogel',       index: '194535' },
  ],
  '108 L': [
    { name: 'Emilia Ćwiklińska', index: '188086' },
    { name: 'Daria Szewczyk',    index: '194192' },
    { name: 'Mikołaj Radliński', index: '193471' },
  ],
}
```

- [ ] **Step 3: `ROOMS_PDF_ORDER` z modułu**

Zamień (linie 49-50):

```jsx
// Sale w kolejności dla PDF (24J jest tylko stała — brak rekrutacji)
const ROOMS_PDF_ORDER = ['9 J', '16 J', '28 J', '11 J', '24 J']
```

na:

```jsx
// Sale w kolejności dla PDF (108 L jest tylko stała — brak rekrutacji)
const ROOMS_PDF_ORDER = ACCESS_PDF_ORDER
```

- [ ] **Step 4: `has11J` na `SPECIAL_ROOM` + etykieta**

Zamień (linia 184):

```jsx
              const has11J = rooms.includes('11 J')
```
na
```jsx
              const has11J = rooms.includes(SPECIAL_ROOM)
```

Zamień (linia 197):

```jsx
                            11J ⚠️
```
na
```jsx
                            13 L ⚠️
```

> Nazwa zmiennej `has11J` zostaje (identyfikator, nie sala).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build OK. Grep pliku nie zwraca `'9 J'`, `'16 J'`, `'28 J'`, `'11 J'`, `'24 J'`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AdminAccessPanel.jsx
git commit -m "refactor: AdminAccessPanel na ACCESS_PDF_ORDER + nowe id sal L"
```

---

## Task 5: Wygaszenie Kalendarza Organizacji Studenckich

**Files:**
- Modify: `src/pages/UniversalCalendarPage.jsx`
- Modify: `src/pages/CalendarSelectionPage.jsx`

- [ ] **Step 1: Opróżnij `CAMPUS_ROOMS` (usuń sale 10 A/213 Z/214 Z)**

W `src/pages/UniversalCalendarPage.jsx` zamień (linie 8-10, blok `CAMPUS_ROOMS`):

```jsx
const CAMPUS_ROOMS = {
  '10 A': { days: [2, 3], start: 18, end: 22 }, 
  '213 Z': { days: [4, 5], start: 18, end: 22 }, 
  '214 Z': { days: [1, 5], start: 18, end: 22 }
};
```

na:

```jsx
// Kalendarz Organizacji Studenckich wygaszony — brak sal campusowych.
const CAMPUS_ROOMS = {};
```

- [ ] **Step 1b: Usuń resztkowe literały `28J` (domyślna sala + siatka)**

W `src/pages/UniversalCalendarPage.jsx` zamień (linia 15, `room: '28J'` w formularzu):

```jsx
  date: '', room: '28J', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
```
na
```jsx
  date: '', room: '101 L', start: '18:00', end: '20:00', justification: '', notes: '', rodo: false
```

Oraz zamień (linia 211, wiersz siatki):

```jsx
            let dailyRooms = ['28J'];
```
na
```jsx
            let dailyRooms = ['101 L'];
```

> Uwaga: powyższe dwie linie mają dokładnie to brzmienie w pliku — jeśli numery linii się przesunęły po Step 1, znajdź je po treści (`room: '28J'` oraz `let dailyRooms = ['28J'];`).

- [ ] **Step 2: Baner „nieaktywny" na górze widoku**

W `src/pages/UniversalCalendarPage.jsx` zamień (linia 150):

```jsx
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
```

na:

```jsx
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-24 relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto mb-6 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center">
        <p className="text-sm font-black text-amber-800 uppercase tracking-widest">Kalendarz nieaktywny (wygaszony)</p>
        <p className="text-xs font-medium text-amber-700 mt-1">Kalendarz Organizacji Studenckich został wygaszony. Składanie rezerwacji jest niemożliwe.</p>
      </div>
```

- [ ] **Step 3: Podtytuł nagłówka**

W `src/pages/UniversalCalendarPage.jsx` zamień (linia 157):

```jsx
          <p className="text-sm font-medium text-slate-500 mt-1">Rezerwacja sali 28J oraz wyznaczonych sal uczelnianych.</p>
```

na:

```jsx
          <p className="text-sm font-medium text-slate-500 mt-1">Kalendarz wygaszony — tryb tylko do podglądu.</p>
```

- [ ] **Step 4: Usuń filtry sal campus i zablokuj przycisk rezerwacji**

W `src/pages/UniversalCalendarPage.jsx` zamień (linie 161-171):

```jsx
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-w-md scrollbar-hide">
                <button onClick={() => setFilterRoom('ALL')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>ALL</button>
                <button onClick={() => setFilterRoom('28J')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '28J' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>28J</button>
                <button onClick={() => setFilterRoom('10 A')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '10 A' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>10 A</button>
                <button onClick={() => setFilterRoom('213 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '213 Z' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>213 Z</button>
                <button onClick={() => setFilterRoom('214 Z')} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${filterRoom === '214 Z' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>214 Z</button>
            </div>
            
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                <span>+</span> Złóż Wniosek
            </button>
```

na:

```jsx
            <button disabled className="bg-slate-200 text-slate-400 px-5 py-2 rounded-xl font-bold shadow-inner cursor-not-allowed flex items-center gap-2">
                <span>🚫</span> Rezerwacje nieaktywne
            </button>
```

- [ ] **Step 5: Twardy bezpiecznik w handlerze wysyłki**

W `src/pages/UniversalCalendarPage.jsx` zamień (linie 130-131 — początek wysyłki po walidacji kolizji):

```jsx
    if (checkCollision(bookingForm)) return setBookingError('KOLIZJA! Sala jest już zajęta w tym terminie (lub wniosek oczekuje).');

    setIsSubmitting(true);
```

na:

```jsx
    if (checkCollision(bookingForm)) return setBookingError('KOLIZJA! Sala jest już zajęta w tym terminie (lub wniosek oczekuje).');

    // Kalendarz Organizacji Studenckich wygaszony — blokada składania rezerwacji.
    return setBookingError('Kalendarz Organizacji Studenckich został wygaszony — rezerwacje są nieaktywne.');

    setIsSubmitting(true);
```

> `campusRules` na linii 115 (`CAMPUS_ROOMS[bookingForm.room]`) automatycznie da `undefined` (pusty `CAMPUS_ROOMS`) — blok walidacji campus staje się nieaktywny, co jest OK.

- [ ] **Step 6: `CalendarSelectionPage` — kafelek org-kalendarza jako nieaktywny + teksty**

W `src/pages/CalendarSelectionPage.jsx` zamień (linia 66):

```jsx
              Dostęp do wszystkich przestrzeni samorządowych (9J,&nbsp;16J,&nbsp;28J) i&nbsp;wyznaczonych sal uczelnianych (bud.&nbsp;A,&nbsp;Z).
```

na:

```jsx
              Dostęp do wszystkich przestrzeni samorządowych (110&nbsp;L,&nbsp;106&nbsp;L,&nbsp;101&nbsp;L).
```

Następnie zamień cały kafelek „OPCJA 2: ORGANIZACJE" (linie 71-79):

```jsx
          {/* OPCJA 2: ORGANIZACJE */}
          <Link to="/kalendarz/organizacje" className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-blue-400 transition-all text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">🎓</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Dla Organizacji Studenckich</h2>
            <p className="text-sm text-slate-500 mb-5">
              Rezerwacja sali 28J oraz wyznaczonych sal dydaktycznych w&nbsp;budynkach A&nbsp;i&nbsp;Z (w&nbsp;godzinach wieczornych).
            </p>
            <span className="text-blue-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">Otwórz kalendarz →</span>
          </Link>
```

na:

```jsx
          {/* OPCJA 2: ORGANIZACJE — WYGASZONY */}
          <Link to="/kalendarz/organizacje" className="group bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-md opacity-60 grayscale transition-all text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-5">🎓</div>
            <h2 className="text-xl font-black text-slate-500 mb-2">Dla Organizacji Studenckich</h2>
            <p className="text-sm text-slate-400 mb-5">
              Kalendarz został wygaszony — rezerwacje są nieaktywne.
            </p>
            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Wygaszony</span>
          </Link>
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build OK. Grep `UniversalCalendarPage.jsx` i `CalendarSelectionPage.jsx` nie zwraca `10 A`, `213 Z`, `214 Z`; `CalendarSelectionPage` nie zwraca `9J`/`16J`/`28J`.

- [ ] **Step 8: Commit**

```bash
git add src/pages/UniversalCalendarPage.jsx src/pages/CalendarSelectionPage.jsx
git commit -m "feat: wygaszenie Kalendarza Organizacji Studenckich (baner + blokada) + kafelek nieaktywny"
```

---

## Task 6: Wzmianki tekstowe + baza wiedzy AI-bota

**Files:**
- Modify: `src/knowledge.js`
- Modify: `src/pages/DocumentsPage.jsx`
- Modify: `src/pages/KompendiumPage.jsx`

- [ ] **Step 1: `knowledge.js` — biuro i pomieszczenia**

Zamień (linia 35):

```
Biuro: pokój 9J, ul. Komandorska 43/45, 53-307 Wrocław.
```
na
```
Biuro: pokój 110 L, ul. Komandorska 43/45, 53-307 Wrocław.
```

Zamień (linia 119):

```
Biuro: pokój 9J, ul. Komandorska 43/45.
```
na
```
Biuro: pokój 110 L, ul. Komandorska 43/45.
```

- [ ] **Step 2: `knowledge.js` — zasady rezerwacji**

Zamień (linia 164):

```
2. Dla pomieszczeń samorządowych (9J, 16J, 28J): rezerwacja w CRA zazwyczaj wystarcza dla standardowych spotkań w godzinach pracy.
```
na
```
2. Dla pomieszczeń samorządowych (110 L, 106 L, 101 L): rezerwacja w CRA zazwyczaj wystarcza dla standardowych spotkań w godzinach pracy.
```

Zamień (linia 166):

```
4. Przedłużone korzystanie z pomieszczeń w bud. B/J (np. po 22:00, w weekendy) wymaga pisemnego wniosku z wyprzedzeniem --> sama rezerwacja w kalendarzu NIE gwarantuje dostępu.
```
na
```
4. Przedłużone korzystanie z pomieszczeń w bud. B/L (np. po 22:00, w weekendy) wymaga pisemnego wniosku z wyprzedzeniem --> sama rezerwacja w kalendarzu NIE gwarantuje dostępu.
```

Zamień (linia 167):

```
5. Organizacje studenckie rezerwują 28J oraz wyznaczone sale dydaktyczne (bud. A i Z) tylko w godzinach wieczornych, przez zakładkę "Dla Organizacji Studenckich" w kalendarzu.
```
na
```
5. Kalendarz Organizacji Studenckich został wygaszony — rezerwacje przez zakładkę "Dla Organizacji Studenckich" są nieaktywne.
```

- [ ] **Step 3: `DocumentsPage.jsx` — placeholdery**

Zamień (linia 101):

```jsx
    { id: 'budynek', label: 'Budynek docelowy', type: 'text', placeholder: 'np. Budynek L' },
```

> Jeśli aktualna treść to `placeholder: 'np. Budynek J'` — zmień na `'np. Budynek L'`.

Zamień (linia 106):

```jsx
    { id: 'miejsce', label: 'Miejsce', type: 'text', placeholder: 'np. Sala 101, w budynku L' },
```

> Aktualnie: `placeholder: 'np. Sala 214, w budynku A'` → zmień na `'np. Sala 101, w budynku L'`.

Zamień (linia 112):

```jsx
    { id: 'pomieszczenia', label: 'Numery pomieszczeń i budynek', type: 'text', placeholder: 'np. Pomieszczenia 110, 106, 101 - Budynek L' },
```

> Aktualnie: `placeholder: 'np. Pomieszczenia 9, 16, 28 - Budynek J'` → zmień jak wyżej. Linię 59 (`'np. Sala 205, Budynek A'`) i linię 80 (baner, „budynek Z") zostaw — to ogólne przykłady niezwiązane z budynkiem J.

- [ ] **Step 4: `KompendiumPage.jsx` — cytat-przykład**

Zamień (linia 802):

```jsx
                        '"Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych Magdalena Skoczylas zaprosiła obecnych na spotkanie integracyjne w budynku B/J."',
```
na
```jsx
                        '"Wiceprzewodnicząca ds. Strategii i Działań Operacyjnych Magdalena Skoczylas zaprosiła obecnych na spotkanie integracyjne w budynku B/L."',
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 6: Commit**

```bash
git add src/knowledge.js src/pages/DocumentsPage.jsx src/pages/KompendiumPage.jsx
git commit -m "docs: aktualizacja wzmianek o salach J->L (AI-bot, placeholdery, kompendium)"
```

---

## Task 7: Notatka migracji backendu (deliverable)

**Files:**
- Create: `docs/superpowers/backend-migracja-sal.md`

- [ ] **Step 1: Utwórz notatkę**

Utwórz `docs/superpowers/backend-migracja-sal.md`:

```markdown
# Migracja sal J → L — kroki po stronie backendu (poza repo)

Front zmienił nazwy sal na budynek L. Dane historyczne i listy sal żyją w
backendzie (Google Sheets / Apps Script) — trzeba je zmigrować ręcznie, tymi
samymi stringami (spacja przed literą): `110 L`, `106 L`, `101 L`, `13 L`, `108 L`.

## Mapowanie
| Stara | Nowa |
|---|---|
| 9J  | 110 L |
| 16J | 106 L |
| 28J | 101 L |
| 11J | 13 L |
| 24J | 108 L |
Usuwane: 10 A, 213 Z, 214 Z.

## 1. Arkusz rezerwacji Kalendarza Samorządu
Backend `GOOGLE_SHEETS_URL` (z `CalendarSamorzadPage.jsx`). W arkuszu rezerwacji w
kolumnie sali (`room`) podmień wartości wg mapowania. Zdecyduj, co ze starymi
wpisami sal `213 Z` / `214 Z` (usunąć lub zarchiwizować). Bez migracji stare
rezerwacje pod starymi nazwami nie pokażą się w siatce (siatka renderuje tylko
110 L / 106 L / 101 L).

## 2. Lista sal „Plan sal UEW" (SalaKalendar)
Backend `VITE_AS_SALA_URL`, akcja `getSalaList`. Jeśli lista zawiera sale budynku J
— zaktualizuj nazwy na L i usuń skasowane sale. Te dane są w całości po stronie
backendu (nie w repo).

## 3. Zgłoszenia dostępu (AccessList / AdminAccessPanel)
Jeśli w bazie zgłoszeń (Firestore) istnieją rekordy z salami `9 J`/`16 J`/`28 J`/
`11 J`/`24 J`, ich pole `rooms` nadal będzie miało stare wartości. Panel dopasowuje
stałych członków po nowych id — stare rekordy pokażą stare nazwy w liście, ale nie
zepsują UI. Migracja opcjonalna.

## Ważne
Stringi w backendzie MUSZĄ być identyczne z front (`110 L` itd., ze spacją).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/backend-migracja-sal.md
git commit -m "docs: notatka migracji sal po stronie backendu"
```

---

## Task 8: Weryfikacja końcowa

**Files:** brak (weryfikacja)

- [ ] **Step 1: Testy jednostkowe**

Run: `npm test`
Expected: PASS (testy `rooms` + wcześniejsze `signaturePadUtils`).

- [ ] **Step 2: Grep akceptacyjny — brak sal J w plikach funkcyjnych**

Run (Grep tool lub rg): wzorzec `\b\d+\s?J\b` w plikach: `src/data/rooms.js`, `src/pages/CalendarSamorzadPage.jsx`, `src/pages/AccessListPage.jsx`, `src/pages/AdminAccessPanel.jsx`, `src/pages/UniversalCalendarPage.jsx`, `src/pages/CalendarSelectionPage.jsx`.
Expected: **zero** trafień (żadna sala „…J" nie została w kodzie funkcyjnym/kalendarzach).

Dodatkowo grep `10 A|213 Z|214 Z` w `CalendarSamorzadPage.jsx`, `UniversalCalendarPage.jsx`, `CalendarSelectionPage.jsx` → zero trafień.

- [ ] **Step 3: Build produkcyjny**

Run: `npm run build`
Expected: build OK, bez błędów o niezdefiniowanych symbolach.

- [ ] **Step 4: Klik-through manualny (`npm run dev`)**

1. `/kalendarz/samorzad` — filtry i siatka pokazują 110 L / 106 L / 101 L (kolory emerald/blue/indigo), brak 213 Z/214 Z; „Wolny Dostęp" na 110 L; modal „Szybka Rezerwacja" ma opcje 110/106/101 L; domyślna sala 110 L.
2. Panel dostępów (formularz) — sale 110 L/106 L/101 L/13 L; wybór 13 L pokazuje sekcję „Sala 13 L — dodatkowe informacje".
3. Panel admina dostępów — zgłoszenia z 13 L mają badge „13 L ⚠️"; PDF/lista w kolejności 110/106/101/13/108 L.
4. `/kalendarz-wybor` — kafelek „Dla Organizacji Studenckich" wyszarzony, opis „wygaszony"; tekst kafelka Samorządu wymienia 110/106/101 L.
5. `/kalendarz/organizacje` — baner „Kalendarz nieaktywny (wygaszony)", przycisk „Rezerwacje nieaktywne" zablokowany, brak możliwości złożenia wniosku.
6. AI-bot — zapytanie o biuro/sale zwraca 110 L (nie 9J).

- [ ] **Step 5: Gałąź gotowa do przeglądu/scalenia**

Brak commita — kod był commitowany w taskach 1-7.

---

## Self-review (wykonane przy pisaniu planu)

- **Pokrycie spec:** moduł+testy (Task 1) ✓; refaktor Samorząd/AccessList/AdminAccess (Task 2-4) ✓; usunięcie 213 Z/214 Z (Task 2) i 10 A (Task 5) ✓; wygaszenie org-kalendarza baner+blokada (Task 5) ✓; kafelek nieaktywny + teksty selection (Task 5) ✓; knowledge/placeholdery/Kompendium (Task 6) ✓; notatka backendu (Task 7) ✓; weryfikacja + grep + manual (Task 8) ✓.
- **Spójność nazw:** eksporty modułu `ROOMS`, `SAMORZAD_ROOMS`, `RECRUITMENT_ROOMS`, `ACCESS_PDF_ORDER`, `SPECIAL_ROOM`, `PERMANENT_ROOM` użyte identycznie w Task 1-4. Nowe id sal `110 L / 106 L / 101 L / 13 L / 108 L` spójne wszędzie (ze spacją). Backend-notatka używa tych samych stringów.
- **Świadome odstępstwa:** wewnętrzne identyfikatory (`justification11J`, `needs11J`, `has11J`) zostają, by nie psuć payloadu/backendu; wygaszony `UniversalCalendarPage` nie jest podłączany do modułu (YAGNI).
- **Placeholdery:** jedyny świadomy `<<…>>`? brak. W notatce backendu brak placeholderów kodu (instrukcja).
- **Ryzyko (znane, zaakceptowane):** stare rezerwacje/zgłoszenia w backendzie pod starymi nazwami do czasu migracji (Task 7).
```
