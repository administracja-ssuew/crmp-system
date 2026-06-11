# Backend: akcja `zapiszProtokolSzkody` (do wklejenia ręcznie)

Frontend Windykacji wysyła gotowy PDF (base64) akcją `zapiszProtokolSzkody`.
Dodaj poniższą obsługę do `doPost` w SWOIM wdrożonym Apps Scripcie sprzętowym
(tym spod `API_URL` w `src/pages/AdminEquipmentPanel.jsx`), a następnie wdróż
nową wersję (Deploy → Manage deployments → Edit → New version).

## Krok 1 — ustaw ID folderu Dysku
Podmień `<<ID_FOLDERU_DYSKU>>` na ID folderu, w którym mają lądować PDF-y
(najlepiej ten sam folder, do którego trafiają protokoły Wydania/Zwrotu).

## Krok 2 — dodaj w `doPost` (obok istniejących `if (parsedData.action === ...)`)

```js
if (parsedData.action === 'zapiszProtokolSzkody') {
  const bytes = Utilities.base64Decode(parsedData.pdfBase64);
  const blob = Utilities.newBlob(bytes, 'application/pdf', parsedData.filename || 'protokol-szkody.pdf');
  const folder = DriveApp.getFolderById('<<ID_FOLDERU_DYSKU>>');
  const file = folder.createFile(blob);

  // (opcjonalnie) log do arkusza „Szkody": utwórz arkusz o tej nazwie z nagłówkami
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Szkody');
    if (!sheet) {
      sheet = ss.insertSheet('Szkody');
      sheet.appendRow(['Data', 'Sprawca', 'Nr albumu', 'Sprzęt', 'Rodzaj szkody', 'Link PDF']);
    }
    sheet.appendRow([
      new Date(),
      parsedData.perpetrator || '',
      parsedData.albumId || '',
      parsedData.equipmentName || '',
      parsedData.damageType || '',
      file.getUrl(),
    ]);
  } catch (logErr) {
    // log opcjonalny — brak arkusza nie blokuje zapisu pliku
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, link: file.getUrl() }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Uwagi
- Jeśli Twój doPost ma już helper typu `jsonResponse(...)`, użyj go zamiast
  ręcznego `ContentService...` — efekt ten sam.
- Po wdrożeniu URL deploymentu MUSI pozostać ten sam co `API_URL` (użyj „New
  version" istniejącego deploymentu, nie twórz nowego URL).
