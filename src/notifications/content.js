import { MODULE_META } from './modules.js';

const clean = (v) => String(v ?? '').trim();

// "2026-10-14" | "14.10.2026" | "5.1" → "14.10" / "05.01"; inne formaty bez zmian
export function formatDayMonth(raw) {
  const s = clean(raw);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}`;
  m = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.\d{2,4})?$/);
  if (m) return `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}`;
  return s;
}

// "18:00" | "9:05" | "18:00:00" | "1899-12-30T18:00:00.000Z" → "HH:MM"
export function formatHour(raw) {
  let s = clean(raw);
  if (s.includes('T')) s = s.split('T')[1];
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : s;
}

export function buildContent(module, data = {}) {
  const meta = MODULE_META[module];
  if (module !== 'sale' || !meta) throw new Error(`Nieznany moduł: ${module}`);
  const room = clean(data.room);
  const who = [clean(data.org), clean(data.title)].filter(Boolean).join(' — ');
  const day = formatDayMonth(data.date);
  const start = formatHour(data.start);
  const end = formatHour(data.end);
  const parts = [who || 'Wniosek bez tytułu'];
  if (day) parts.push(day);
  if (start && end) parts.push(`${start}–${end}`);
  return {
    title: room ? `Nowy wniosek o salę · ${room}` : 'Nowy wniosek o salę',
    body: parts.join(', '),
    url: meta.url,
  };
}

function wnioskiCzekaja(n) {
  if (n === 1) return 'wniosek czeka';
  const d = n % 10, h = n % 100;
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return 'wnioski czekają';
  return 'wniosków czeka';
}

export function buildReminder(module, count) {
  const meta = MODULE_META[module];
  return {
    title: `${meta.label}: przypomnienie`,
    body: `${count} ${wnioskiCzekaja(count)} ponad 2 dni na decyzję`,
    url: meta.url,
  };
}
