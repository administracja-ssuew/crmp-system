# Migracja sal J → L — strona backendu (poza repo)

**Podsumowanie: backend NIE wymaga zmian kodu, a danych historycznych NIE
migrujemy** (decyzja: było, minęło). Nowe rezerwacje automatycznie zapisują się
pod nowymi nazwami sal L (front je wysyła). Ta notatka to tylko zapis stanu.

## Mapowanie (dla odniesienia)
| Stara | Nowa |
|---|---|
| 9J  | 110 L |
| 16J | 106 L |
| 28J | 101 L |
| 11J | 13 L |
| 24J | 108 L |
Sale 10 A / 213 Z / 214 Z zniknęły z kalendarzy rezerwacyjnych Samorządu.

## 1. Kalendarz Samorządu (Apps Script + arkusz „Sale")
Backend `GOOGLE_SHEETS_URL` (skrypt `doGet`/`doPost`). W kodzie skryptu **nie ma
żadnych nazw sal na sztywno** — sale są przekazywane z frontu i zapisywane jako
zwykły tekst w kolumnie `room` (`submitBooking`, `approveBooking`). Dlatego skrypt
zostaje bez zmian.
- **Dane historyczne: bez migracji.** Stare rezerwacje pod nazwami 9J / 16J / 28J /
  213 Z / 214 Z zostają w arkuszu, ale nie pojawią się w nowej siatce (renderuje ona
  tylko 110 L / 106 L / 101 L) — świadomie zaakceptowane.
- Nowe rezerwacje zapisują się już pod nazwami L.

## 2. „Plan sal UEW" (SalaKalendar) — POZA MIGRACJĄ, NIE RUSZAĆ
Backend `VITE_AS_SALA_URL`, akcja `getSalaList`. To ogólnouczelniana lista sal z
systemu planów zajęć UEW (nie należy do Samorządu) — **niczego tu nie usuwamy ani
nie zmieniamy**. Sale 10 A / 213 Z / 214 Z to realne sale uczelni; znikają wyłącznie
z kalendarzy rezerwacyjnych Samorządu, a nie z ogólnego podglądu zajętości sal.

## 3. Zgłoszenia dostępu (Firestore) — bez migracji
Stare zgłoszenia mogą mieć w polu `rooms` nazwy J. Zostawiamy — panel działa i pokaże
po prostu starą nazwę przy historycznym rekordzie. Nowe zgłoszenia używają nazw L.
