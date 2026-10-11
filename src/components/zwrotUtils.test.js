import { describe, it, expect } from 'vitest';
import { toggleDecision, validateReturnItems, buildReturnRowsHTML } from './zwrotUtils';

describe('zwrotUtils — decyzja wydającego', () => {
  it('"bez zastrzeżeń" wyklucza pozostałe opcje', () => {
    expect(toggleDecision(['brudny', 'uszkodzony'], 'ok')).toEqual(['ok']);
    expect(toggleDecision(['ok'], 'brudny')).toEqual(['brudny']);
  });
  it('brudny + uszkodzony można łączyć, ponowne kliknięcie odznacza', () => {
    expect(toggleDecision(['brudny'], 'uszkodzony')).toEqual(['brudny', 'uszkodzony']);
    expect(toggleDecision(['brudny', 'uszkodzony'], 'brudny')).toEqual(['uszkodzony']);
  });
  it('walidacja wskazuje pierwszą pozycję bez decyzji', () => {
    expect(validateReturnItems([{ decyzje: ['ok'] }, { decyzje: [] }])).toMatch(/nr 2/);
    expect(validateReturnItems([{ decyzje: ['ok'] }])).toBeNull();
  });
});

describe('zwrotUtils — HTML do PDF', () => {
  const html = buildReturnRowsHTML([
    { code: 'A-1', name: 'Laptop', stan: 'rysa <b>', decyzje: ['uszkodzony'] },
    { code: 'B-2', name: 'B-2', stan: '  ', decyzje: ['ok'] },
  ]);
  it('zaznacza krzyżykiem wybraną decyzję', () => {
    expect(html).toContain('[X] USZKODZONY (PROTOKÓŁ SZKODY)');
    expect(html).toContain('[X] PRZYJĘTO BEZ ZASTRZEŻEŃ');
  });
  it('escapuje opis stanu i wstawia "bez uwag" dla pustego', () => {
    expect(html).toContain('rysa &lt;b&gt;');
    expect(html).toContain('Stan przy zwrocie: bez uwag');
  });
  it('zachowuje 2 kolumny na wiersz (zgodność z szablonem backendu)', () => {
    const firstRow = html.split('</tr>')[0];
    expect(firstRow.match(/<td/g)).toHaveLength(2);
  });
});
