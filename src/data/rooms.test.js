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
