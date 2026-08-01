// Jedyne źródło prawdy o składzie Zarządu SSUEW.
// Zmiana kadencji = edycja TYLKO tego pliku.
export const ZARZAD = [
  { imie: 'Karol',     nazwisko: 'Vogel',        nrIndeksu: '194535', funkcja: 'Przewodniczący SSUEW' },
  { imie: 'Mikołaj',   nazwisko: 'Radliński',    nrIndeksu: '193471', funkcja: 'Wiceprzewodniczący ds. Strategii i Działań Operacyjnych' },
  { imie: 'Julia',     nazwisko: 'Pytel',        nrIndeksu: '194174', funkcja: 'Wiceprzewodnicząca ds. Projektów' },
  { imie: 'Alicja',    nazwisko: 'Góralska',     nrIndeksu: '193295', funkcja: 'Wiceprzewodnicząca ds. Public Relations' },
  { imie: 'Martyna',   nazwisko: 'Porębska',     nrIndeksu: '198336', funkcja: 'Członek Zarządu ds. Administracji', telefon: '500 214 385' },
  { imie: 'Katarzyna', nazwisko: 'Krzepkowska',  nrIndeksu: '197635', funkcja: 'Członek Zarządu ds. Finansów' },
  { imie: 'Martyna',   nazwisko: 'Staniszewska', nrIndeksu: '190894', funkcja: 'Członek Zarządu ds. Dydaktyki i Jakości Kształcenia' },
  { imie: 'Alicja',    nazwisko: 'Rózik',        nrIndeksu: '197976', funkcja: 'Członek Zarządu ds. Promocji' },
  { imie: 'Zuzanna',   nazwisko: 'Bąk',          nrIndeksu: '198222', funkcja: 'Członek Zarządu ds. Kontaktów Zewnętrznych' },
  { imie: 'Lena',      nazwisko: 'Kwoka',        nrIndeksu: '197408', funkcja: 'Członek Zarządu ds. Human Resources' },
];

export const pelneImie = (m) => `${m.imie} ${m.nazwisko}`;
export const znajdzPoFunkcji = (frag) => ZARZAD.find(m => m.funkcja.toLowerCase().includes(frag.toLowerCase()));

// Kontakt administracyjny/RODO (Członek Zarządu ds. Administracji):
export const KONTAKT_ADMINISTRACJA = znajdzPoFunkcji('Administracji');

// Format {name, index} dla panelu dostępów (AdminAccessPanel):
export const CZLONKOWIE = ZARZAD.map(m => ({ name: pelneImie(m), index: m.nrIndeksu }));

// Wybór członka po nazwisku (do budowy list dostępu do sal specjalnych):
export const osoba = (nazwisko) => CZLONKOWIE.find(m => m.name.includes(nazwisko));

// Twórca systemu — NIEZALEŻNY od kadencji (atrybucja techniczna):
export const TWORCA_SYSTEMU = 'Mikołaj Radliński';
