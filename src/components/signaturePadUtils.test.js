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
