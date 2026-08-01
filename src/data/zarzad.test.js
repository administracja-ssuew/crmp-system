import { describe, it, expect } from 'vitest';
import { ZARZAD, CZLONKOWIE, KONTAKT_ADMINISTRACJA, TWORCA_SYSTEMU, pelneImie, osoba } from './zarzad';

describe('zarzad — nowa kadencja', () => {
  it('ma 10 członków z kompletem pól', () => {
    expect(ZARZAD).toHaveLength(10);
    for (const m of ZARZAD) {
      expect(m.imie).toBeTruthy();
      expect(m.nazwisko).toBeTruthy();
      expect(String(m.nrIndeksu)).toMatch(/^\d{6}$/);
      expect(m.funkcja).toBeTruthy();
    }
  });
  it('dokładnie jeden Przewodniczący SSUEW (Karol Vogel)', () => {
    const p = ZARZAD.filter(m => m.funkcja === 'Przewodniczący SSUEW');
    expect(p).toHaveLength(1);
    expect(pelneImie(p[0])).toBe('Karol Vogel');
  });
  it('kontakt administracyjny/RODO to Martyna Porębska z telefonem', () => {
    expect(KONTAKT_ADMINISTRACJA).toBeTruthy();
    expect(pelneImie(KONTAKT_ADMINISTRACJA)).toBe('Martyna Porębska');
    expect(KONTAKT_ADMINISTRACJA.telefon).toBe('500 214 385');
  });
  it('CZLONKOWIE: 10 wpisów {name, index}', () => {
    expect(CZLONKOWIE).toHaveLength(10);
    for (const m of CZLONKOWIE) { expect(m.name).toContain(' '); expect(m.index).toBeTruthy(); }
  });
  it('brak odeszłych członków starej kadencji', () => {
    const stare = ['Ćwiklińska','Skoczylas','Panas','Tyrakowski','Stachowski','Smereczniak','Szewczyk'];
    const wszystkie = ZARZAD.map(pelneImie).join(' ');
    for (const s of stare) expect(wszystkie).not.toContain(s);
  });
  it('osoba() znajduje po nazwisku', () => {
    expect(osoba('Porębska').index).toBe('198336');
    expect(osoba('Vogel').name).toBe('Karol Vogel');
  });
  it('osoba() dopasowuje po dokładnym nazwisku (nie po fragmencie)', () => {
    expect(osoba('Radliński')).toEqual({ name: 'Mikołaj Radliński', index: '193471' });
    expect(osoba('Radl')).toBeUndefined();          // fragment nie łapie
    expect(osoba('Kowalski')).toBeUndefined();       // brak takiej osoby
  });
  it('TWORCA_SYSTEMU to Mikołaj Radliński', () => {
    expect(TWORCA_SYSTEMU).toBe('Mikołaj Radliński');
  });
});
