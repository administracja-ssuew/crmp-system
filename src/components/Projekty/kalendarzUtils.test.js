import { describe, it, expect } from 'vitest';
import { buildCalGrid, groupUpcoming, MONTHS_PL, DAYS_PL } from './kalendarzUtils';

describe('buildCalGrid', () => {
  it('zwraca siatkę o długości wielokrotności 7', () => {
    const grid = buildCalGrid(2026, 0, []); // styczeń 2026
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(31);
  });
  it('ma dokładnie tyle komórek bieżącego miesiąca, ile dni', () => {
    const grid = buildCalGrid(2026, 0, []);
    expect(grid.filter(c => c.month === 0).length).toBe(31); // styczeń ma 31 dni
  });
  it('przypisuje wydarzenie do właściwego dnia po data_finalu', () => {
    const ev = { id: 'x', data_finalu: '2026-01-15', nazwa: 'Test' };
    const grid = buildCalGrid(2026, 0, [ev]);
    const cell = grid.find(c => c.month === 0 && c.day === 15);
    expect(cell.events).toHaveLength(1);
    expect(cell.events[0].id).toBe('x');
  });
  it('komórki wiodące pochodzą z poprzedniego miesiąca', () => {
    const grid = buildCalGrid(2026, 0, []);
    // 1 stycznia 2026 to czwartek → 3 komórki wiodące z grudnia (month === -1)
    expect(grid[0].month).toBe(-1);
  });
});

describe('groupUpcoming', () => {
  const events = [
    { id: 'a', data_finalu: '2026-02-10', nazwa: 'B' },
    { id: 'b', data_finalu: '2026-01-20', nazwa: 'A' },
    { id: 'c', data_finalu: '2025-12-01', nazwa: 'past' },
    { id: 'd', data_finalu: '2026-02-05', nazwa: 'C' },
    { id: 'e', data_finalu: '', nazwa: 'brak daty' },
  ];
  it('odrzuca przeszłe i puste daty, grupuje po miesiącu, sortuje rosnąco', () => {
    const g = groupUpcoming(events, new Date(2026, 0, 1)); // od 2026-01-01
    expect(g.map(x => x.key)).toEqual(['2026-01', '2026-02']);
    expect(g[0].label).toBe('Styczeń 2026');
    expect(g[1].label).toBe('Luty 2026');
    expect(g[1].events.map(e => e.id)).toEqual(['d', 'a']); // 05 przed 10
  });
  it('pusta lista → pusta tablica grup', () => {
    expect(groupUpcoming([], new Date(2026, 0, 1))).toEqual([]);
  });
});
