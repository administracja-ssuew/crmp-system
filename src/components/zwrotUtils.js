// Czyste helpery protokołu zwrotu (Część B) — stan przy zwrocie + decyzja wydającego.
// Adnotacje trafiają do drugiej kolumny `sprzetTabelaHTML`, więc PDF z backendu (Apps Script)
// zawiera je bez zmian po stronie serwera.

export const RETURN_DECISIONS = [
  { key: 'ok', label: 'PRZYJĘTO BEZ ZASTRZEŻEŃ' },
  { key: 'brudny', label: 'BRUDNY (DO CZYSZCZENIA)' },
  { key: 'uszkodzony', label: 'USZKODZONY (PROTOKÓŁ SZKODY)' },
];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// "Bez zastrzeżeń" wyklucza pozostałe; "brudny" i "uszkodzony" można łączyć.
export function toggleDecision(current, key) {
  if (current.includes(key)) return current.filter(k => k !== key);
  if (key === 'ok') return ['ok'];
  return [...current.filter(k => k !== 'ok'), key];
}

// Zwraca komunikat błędu albo null, gdy każda pozycja ma decyzję.
export function validateReturnItems(items) {
  const missing = items.findIndex(it => !it.decyzje || it.decyzje.length === 0);
  return missing === -1 ? null : `Zaznacz decyzję wydającego dla pozycji nr ${missing + 1}.`;
}

export function buildReturnRowsHTML(items) {
  return items.map((it, idx) => {
    const decyzje = RETURN_DECISIONS
      .map(d => `${it.decyzje.includes(d.key) ? '[X]' : '[&nbsp;&nbsp;]'} ${d.label}`)
      .join('<br/>');
    const nazwa = it.name && it.name !== it.code ? `${esc(it.name)} <span style="font-family: monospace;">(${esc(it.code)})</span>` : `<span style="font-family: monospace;">${esc(it.code)}</span>`;
    return `<tr>
        <td style="border: 1px solid black; padding: 5px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid black; padding: 5px;"><strong>${nazwa}</strong><br/>Stan przy zwrocie: ${esc(it.stan.trim() || 'bez uwag')}<br/>Decyzja wydającego:<br/>${decyzje}</td>
      </tr>`;
  }).join('');
}
