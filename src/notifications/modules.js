// Moduły objęte powiadomieniami. Kolejne etapy dopisują tu wpis + role w src/data/roles.js.
export const MODULE_META = {
  sale: { label: 'Sale i Przestrzenie', url: '/kalendarz/samorzad?oczekujace=1' },
};

export const isKnownModule = (m) => Object.prototype.hasOwnProperty.call(MODULE_META, m);
