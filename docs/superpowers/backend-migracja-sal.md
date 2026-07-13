# Migracja sal J → L — kroki po stronie backendu (poza repo)

Front zmienił nazwy sal na budynek L. Dane historyczne i listy sal żyją w
backendzie (Google Sheets / Apps Script) — trzeba je zmigrować ręcznie, tymi
samymi stringami (spacja przed literą): `110 L`, `106 L`, `101 L`, `13 L`, `108 L`.

## Mapowanie
| Stara | Nowa |
|---|---|
| 9J  | 110 L |
| 16J | 106 L |
| 28J | 101 L |
| 11J | 13 L |
| 24J | 108 L |
Usuwane: 10 A, 213 Z, 214 Z.

## 1. Arkusz rezerwacji Kalendarza Samorządu
Backend `GOOGLE_SHEETS_URL` (z `CalendarSamorzadPage.jsx`). W arkuszu rezerwacji w
kolumnie sali (`room`) podmień wartości wg mapowania. Zdecyduj, co ze starymi
wpisami sal `213 Z` / `214 Z` (usunąć lub zarchiwizować). Bez migracji stare
rezerwacje pod starymi nazwami nie pokażą się w siatce (siatka renderuje tylko
110 L / 106 L / 101 L).

## 2. Lista sal „Plan sal UEW" (SalaKalendar)
Backend `VITE_AS_SALA_URL`, akcja `getSalaList`. Jeśli lista zawiera sale budynku J
— zaktualizuj nazwy na L i usuń skasowane sale. Te dane są w całości po stronie
backendu (nie w repo).

## 3. Zgłoszenia dostępu (AccessList / AdminAccessPanel)
Jeśli w bazie zgłoszeń (Firestore) istnieją rekordy z salami `9 J`/`16 J`/`28 J`/
`11 J`/`24 J`, ich pole `rooms` nadal będzie miało stare wartości. Panel dopasowuje
stałych członków po nowych id — stare rekordy pokażą stare nazwy w liście, ale nie
zepsują UI. Migracja opcjonalna.

## Ważne
Stringi w backendzie MUSZĄ być identyczne z front (`110 L` itd., ze spacją).
