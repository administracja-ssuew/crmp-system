// Czyste funkcje Kalendarza Projektowego (testowalne, bez DOM).

export const MONTHS_PL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];
export const DAYS_PL = ['Pon','Wt','Śr','Cz','Pt','So','Nd'];

// Siatka miesiąca (7×N): komórki poprzedniego/bieżącego/następnego miesiąca,
// z przypisaniem wydarzeń po polu data_finalu (YYYY-MM-DD).
export function buildCalGrid(year, month, events) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];

  const prevMonth = (month + 11) % 12;
  const prevYear  = month === 0 ? year - 1 : year;

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: prevMonth, year: prevYear, events: [], isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = (
      today.getFullYear() === year &&
      today.getMonth()    === month &&
      today.getDate()     === d
    );
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = (events || []).filter(ev => {
      if (!ev.data_finalu) return false;
      return String(ev.data_finalu).slice(0, 10) === dateStr;
    });
    cells.push({ day: d, month, year, events: dayEvents, isToday });
  }
  const nextMonth = (month + 1) % 12;
  const nextYear  = month === 11 ? year + 1 : year;

  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: day++, month: nextMonth, year: nextYear, events: [], isToday: false });
  }
  return cells;
}

// Nadchodzące wydarzenia (od fromDate włącznie), posortowane rosnąco,
// pogrupowane po miesiącu: [{ key:'YYYY-MM', label:'Miesiąc RRRR', events:[...] }]
export function groupUpcoming(events, fromDate = new Date()) {
  const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
  const upcoming = (events || [])
    .filter(ev => ev.data_finalu && String(ev.data_finalu).slice(0, 10) >= fromStr)
    .sort((a, b) => String(a.data_finalu).slice(0, 10).localeCompare(String(b.data_finalu).slice(0, 10)));

  const groups = [];
  const byKey = {};
  for (const ev of upcoming) {
    const key = String(ev.data_finalu).slice(0, 7); // YYYY-MM
    if (!byKey[key]) {
      const [y, m] = key.split('-');
      byKey[key] = { key, label: `${MONTHS_PL[parseInt(m, 10) - 1]} ${y}`, events: [] };
      groups.push(byKey[key]);
    }
    byKey[key].events.push(ev);
  }
  return groups;
}
