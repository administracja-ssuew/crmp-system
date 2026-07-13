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
