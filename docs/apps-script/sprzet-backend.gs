// =============================================================================
// BACKEND SPRZĘTU CRA (Google Apps Script) — kopia referencyjna z repo.
// Wdrożenie: edytor Apps Script → Ctrl+A → wklej ten plik → Ctrl+S →
// Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: „Nowa wersja” → Wdróż.
// NIE twórz nowego wdrożenia (zmieniłby się URL używany przez CRA).
//
// Zmiany 2026-10-11 względem wersji produkcyjnej:
//  - nowaRezerwacja: mail-powiadomienie do logistyki (powiadomONowymWniosku)
//  - zapiszWydanie: zapis e-maila korzystającego w kolumnie L (WYDANIA → nagłówek „Email”)
//  - zapiszZwrot: tabela ze stanem przy zwrocie + decyzją wydającego, poprawiony tekst
//    potwierdzenia i literówka, wysyłka podpisanego PDF zwrotu na e-mail zwracającego
// =============================================================================

var sheetId = '1oFNVEsHmWS_b3-kOIhU8JpTiw-q-2LQ_vwDNxQN7C5o';

// Adresaci powiadomień o nowych wnioskach o sprzęt
var POWIADOMIENIA_WNIOSKI = [
  'martyna.porebska@samorzad.ue.wroc.pl',
  'jakub.jasinski@samorzad.ue.wroc.pl'
];

function autoryzujWszystko() {
  CalendarApp.getDefaultCalendar();
  DriveApp.getRootFolder();
  MailApp.getRemainingDailyQuota();
}

function doGet(e) {
  var ss = SpreadsheetApp.openById(sheetId);

  // Pobieranie kolejnego numeru porozumienia
  if (e && e.parameter && e.parameter.action === 'getNextNumber') {
    var wydaniaSheet = ss.getSheetByName('WYDANIA');
    var lastRow = wydaniaSheet ? wydaniaSheet.getLastRow() : 0;
    var nextNumber = lastRow === 0 ? 1 : lastRow;
    var currentMonth = new Date().getMonth() + 1;
    var currentMonthStr = currentMonth < 10 ? '0' + currentMonth : currentMonth;
    var currentYear = new Date().getFullYear();
    var docNumber = nextNumber + "/SSUEW/" + currentMonthStr + "/" + currentYear;
    return ContentService.createTextOutput(JSON.stringify({ docNumber: docNumber })).setMimeType(ContentService.MimeType.JSON);
  }

  // Pobieranie wszystkich danych dla Dashboardu i CRW
  var result = { sprzet: [], rezerwacje: [], wydania: [], apteczkiBraki: [] };

  ['DANE', 'REZERWACJE', 'WYDANIA', 'APTECZKI_BRAKI'].forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      if(data.length > 0) {
        var headers = data[0].map(function(h) { return String(h).trim(); });
        var arr = sheetName.toLowerCase();
        if(arr === 'dane') arr = 'sprzet';
        if(arr === 'apteczki_braki') arr = 'apteczkiBraki';

        for (var i = 1; i < data.length; i++) {
          if (data[i][0] !== "") {
            var obj = {};
            for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
            result[arr].push(obj);
          }
        }
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    var parsedData = JSON.parse(e.postData.contents);

    // =========================================================================
    // 1. WYDAWANIE SPRZĘTU I GENEROWANIE URZĘDOWEGO PDF (ZAŁ 1, 2A, 11)
    // =========================================================================
    if (parsedData.action === "zapiszWydanie") {
      var pdfUrl = "Brak pliku";

      if (parsedData.sigBorrower && parsedData.sigAdmin) {
        var dzisiaj = new Date().toLocaleDateString('pl-PL');
        var godzina = new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});

        // POTĘŻNY HTML - W 100% ZGODNY Z PRZESŁANYMI PDF-AMI (Czcionka Times New Roman)
        var htmlContent = `
          <div style="font-family: 'Times New Roman', Times, serif; font-size: 11px; line-height: 1.4; padding: 30px; text-align: justify; color: #000;">

            <table style="width: 100%; margin-bottom: 20px; font-weight: bold; font-size: 10px;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  Samorząd Studentów<br>Uniwersytetu Ekonomicznego<br>we Wrocławiu
                </td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                  ZAŁĄCZNIK NR 1<br>DO REGULAMINU GOSPODAROWANIA<br>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU<br>STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU
                </td>
              </tr>
            </table>

            <h1 style="text-align: center; text-decoration: underline; font-size: 16px; margin-bottom: 2px;">POROZUMIENIE SPRZĘTOWE</h1>
            <h2 style="text-align: center; font-size: 12px; margin-top: 0; margin-bottom: 20px;">(UMOWA UŻYCZENIA MIENIA RUCHOMEGO) NR ${parsedData.nrPorozumienia}</h2>

            <p>Zawarte w dniu <strong>${dzisiaj}</strong> we Wrocławiu, pomiędzy:</p>
            <p><strong>1. SAMORZĄDEM STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU,</strong><br>
            reprezentowanym przez Dysponenta / Operatora Systemu: <strong>${parsedData.adminName}</strong><br>
            zwanym dalej <strong>„WYDAJĄCYM"</strong>,</p>

            <p style="font-weight: bold; text-align: center; margin: 15px 0;">a</p>

            <p><strong>2. PODMIOT:</strong><br>
            <strong>${parsedData.organizacja}</strong> (pełna nazwa Organizacji Studenckiej / Koła Naukowego i/lub Projektu)<br>
            reprezentowaną przez:<br>
            Pana/Panią: <strong>${parsedData.osoba}</strong> (imię i nazwisko Reprezentanta)<br>
            Nr albumu (legitymacji): <strong>${parsedData.albumId}</strong><br>
            Adres zamieszkania/korespondencyjny: <strong>${parsedData.address}</strong><br>
            Nr telefonu: <strong>${parsedData.phone}</strong><br>
            E-mail: <strong>${parsedData.email}</strong><br>
            zwanym dalej <strong>„KORZYSTAJĄCYM"</strong>.</p>

            <p style="font-weight: bold; margin-top: 20px; margin-bottom: 5px;">§ 1. PRZEDMIOT UMOWY I OŚWIADCZENIA</p>
            <p style="margin-top: 0; margin-bottom: 5px;">1. Wydający oddaje Korzystającemu w bezpłatne używanie na czas oznaczony Sprzęt określony szczegółowo w Protokole Zdawczo-Odbiorczym (Załącznik nr 2), stanowiącym integralną część niniejszej umowy.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">2. Korzystający oświadcza, że zapoznał się z treścią "Regulaminu Gospodarowania Składnikami Majątku Ruchomego Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu" (dalej: Regulamin), w pełni akceptuje jego postanowienia, w tym zasady odpowiedzialności materialnej, i zobowiązuje się do ich ścisłego przestrzegania.</p>

            <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">§ 2. OKRES OBOWIĄZYWANIA I MIEJSCE</p>
            <p style="margin-top: 0; margin-bottom: 5px;">1. Sprzęt zostaje wydany na okres:<br>
            &nbsp;&nbsp;&nbsp;&nbsp;OD dnia: <strong>${parsedData.dateFrom}</strong><br>
            &nbsp;&nbsp;&nbsp;&nbsp;DO dnia: <strong>${parsedData.dateTo}</strong></p>
            <p style="margin-top: 0; margin-bottom: 5px;">2. Miejscem docelowym użytkowania Sprzętu jest: <strong>${parsedData.location}</strong>.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">3. Termin zwrotu określony w ust. 1 jest terminem zawitym. Przekroczenie terminu bez uprzedniej pisemnej zgody Wydającego skutkuje:<br>
            &nbsp;&nbsp;&nbsp;&nbsp;a. Natychmiastowym rozwiązaniem umowy;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;b. Nałożeniem blokady na wypożyczenia (karencja);<br>
            &nbsp;&nbsp;&nbsp;&nbsp;c. Powstaniem roszczenia o naprawienie szkody poprzez zapłatę pełnej wartości odtworzeniowej przedmiotu (zakup fabrycznie nowego urządzenia o identycznych lub lepszych parametrach), w przypadku jego utraty, zniszczenia lub trwałego uszkodzenia w okresie po upływie terminu zwrotu.</p>

            <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">§ 3. ZASADY ODPOWIEDZIALNOŚCI (SOLIDARNOŚĆ)</p>
            <p style="margin-top: 0; margin-bottom: 5px;">1. Korzystający ponosi pełną odpowiedzialność materialną za powierzone mienie na zasadzie ryzyka, od momentu jego wydania do momentu zwrotu potwierdzonego przez Wydającego.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">2. Reprezentant podpisujący niniejszą umowę oświadcza, iż jest umocowany do działania w imieniu wskazanego w komparycji Podmiotu.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">3. Na podstawie art. 366 § 1 Kodeksu cywilnego, Reprezentant przyjmuje na siebie odpowiedzialność solidarną ze wskazanym Podmiotem za wszelkie zobowiązania wynikające z niniejszej umowy, w tym w szczególności za naprawienie szkody wynikłej z utraty, kradzieży lub uszkodzenia Sprzętu.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">4. Wydający uprawniony jest do dochodzenia całości roszczenia od Reprezentanta z jego majątku osobistego, niezależnie od stanu finansów Podmiotu.</p>

            <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">§ 4. BEZPIECZEŃSTWO I DANE OSOBOWE</p>
            <p style="margin-top: 0; margin-bottom: 5px;">1. Korzystający zobowiązuje się do używania Sprzętu zgodnie z jego przeznaczeniem oraz zasadami BHP.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">2. W przypadku powstania szkody lub utraty Sprzętu, Korzystający zobowiązuje się do niezwłocznego uzupełnienia danych osobowych niezbędnych do dochodzenia roszczeń, na wezwanie Wydającego w Protokole Szkody.</p>

            <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">§ 5. DORĘCZENIA I POSTANOWIENIA KOŃCOWE</p>
            <p style="margin-top: 0; margin-bottom: 5px;">1. Korzystający zobowiązuje się do informowania Wydającego o każdej zmianie adresu pod rygorem uznania doręczenia na adres wskazany w komparycji umowy za skuteczne po upływie 7 dni od nadania (fikcja doręczenia).</p>
            <p style="margin-top: 0; margin-bottom: 5px;">2. W sprawach nieuregulowanych zastosowanie mają przepisy Regulaminu oraz Kodeksu cywilnego.</p>
            <p style="margin-top: 0; margin-bottom: 5px;">3. Sądem właściwym do rozstrzygania sporów jest Sąd powszechny właściwy miejscowo dla siedziby Wydającego.</p>

            <table style="width: 100%; text-align: center; margin-top: 40px; page-break-inside: avoid;">
              <tr>
                <td style="width: 50%;">
                  <img src="${parsedData.sigAdmin}" style="width: 140px; height: auto;" /><br>
                  <span style="border-top: 1px solid black; padding-top: 5px; display: inline-block; width: 200px;">(Podpis WYDAJĄCEGO)</span>
                </td>
                <td style="width: 50%;">
                  <img src="${parsedData.sigBorrower}" style="width: 140px; height: auto;" /><br>
                  <span style="border-top: 1px solid black; padding-top: 5px; display: inline-block; width: 200px;">(Czytelny podpis KORZYSTAJĄCEGO)</span>
                </td>
              </tr>
            </table>

            <div style="page-break-before: always;">
              <table style="width: 100%; margin-bottom: 20px; font-weight: bold; font-size: 10px;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    Samorząd Studentów<br>Uniwersytetu Ekonomicznego<br>we Wrocławiu
                  </td>
                  <td style="width: 50%; text-align: right; vertical-align: top;">
                    ZAŁĄCZNIK NR 2<br>DO REGULAMINU GOSPODAROWANIA<br>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU<br>STUDENTÓW UNIWERSYTETU EKONOMICZNEGO WE WROCŁAWIU
                  </td>
                </tr>
              </table>

              <h1 style="text-align: center; font-size: 14px; margin-bottom: 2px;">PROTOKÓŁ ZDAWCZO-ODBIORCZY</h1>
              <h2 style="text-align: center; font-size: 11px; font-weight: normal; margin-top: 0; margin-bottom: 20px;">(INTEGRALNA CZĘŚĆ POROZUMIENIA SPRZĘTOWEGO NR ${parsedData.nrPorozumienia})</h2>

              <p style="font-weight: bold; text-decoration: underline;">CZĘŚĆ A: WYDANIE SPRZĘTU</p>
              <p>Data wydania: <strong>${dzisiaj}</strong>&nbsp;&nbsp;&nbsp;&nbsp;Godzina: <strong>${godzina}</strong></p>

              <p style="font-weight: bold; margin-bottom: 5px;">TABELA WYDANIA:</p>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid black; text-align: left; font-size: 10px; margin-bottom: 15px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid black; padding: 5px; text-align: center; width: 30px;">L.P.</th>
                    <th style="border: 1px solid black; padding: 5px;">NAZWA SPRZĘTU</th>
                    <th style="border: 1px solid black; padding: 5px;">NR INWENTARZOWY (SSUEW-...)</th>
                  </tr>
                </thead>
                <tbody>
                  ${parsedData.sprzetTabelaHTML}
                </tbody>
              </table>

              <p style="font-weight: bold; margin-bottom: 5px;">OŚWIADCZENIE KORZYSTAJĄCEGO (DOMNIEMANIE SPRAWNOŚCI):</p>
              <p style="margin-top: 0; margin-bottom: 2px;">1. Potwierdzam odbiór wyżej wymienionego Sprzętu.</p>
              <p style="margin-top: 0; margin-bottom: 2px;">2. Oświadczam, że w obecności Wydającego dokonałem oględzin Sprzętu oraz weryfikacji jego działania.</p>
              <p style="margin-top: 0; margin-bottom: 2px;">3. Stwierdzam, że Sprzęt jest kompletny, czysty, w pełni sprawny technicznie i nie wnoszę do jego stanu żadnych zastrzeżeń.</p>
              <p style="margin-top: 0; margin-bottom: 20px;">4. Zobowiązuję się do zwrotu Sprzętu w stanie niepogorszonym.</p>

              <table style="width: 100%; margin-top: 30px; margin-bottom: 15px; font-weight: bold; font-size: 10px;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                  </td>
                  <td style="width: 50%; text-align: right; vertical-align: top;">
                    ZAŁĄCZNIK NR 11<br>DO REGULAMINU GOSPODAROWANIA<br>SKŁADNIKAMI MAJĄTKU RUCHOMEGO SAMORZĄDU
                  </td>
                </tr>
              </table>

              <h1 style="text-align: center; font-size: 13px; margin-bottom: 2px;">KLAUZULA INFORMACYJNA RODO</h1>
              <h2 style="text-align: center; font-size: 11px; font-weight: normal; margin-top: 0; margin-bottom: 15px;">(DLA KORZYSTAJĄCYCH ZE SPRZĘTU SSUEW)</h2>

              <p style="margin-top: 0; margin-bottom: 5px;">Zgodnie z art. 13 RODO informujemy, że:</p>
              <p style="margin-top: 0; margin-bottom: 2px;">1. Administratorem Twoich danych osobowych jest Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu.</p>
              <p style="margin-top: 0; margin-bottom: 2px; text-align: justify;">2. Dane (Imię, Nazwisko, Nr albumu, a w przypadku wystąpienia szkody - PESEL) przetwarzane są w celu realizacji umowy użyczenia sprzętu oraz ewentualnego dochodzenia roszczeń z tytułu zniszczenia mienia publicznego (prawnie uzasadniony interes art. 6 ust. 1 lit. f RODO) - przez czas trwania umowy użyczenia i dochodzenia roszczeń.</p>
              <p style="margin-top: 0; margin-bottom: 2px;">3. Dane mogą być przekazywane organom Uczelni (Rzecznik Dyscyplinarny) oraz organom ścigania.</p>
              <p style="margin-top: 0; margin-bottom: 20px;">4. Masz prawo wglądu do danych i ich sprostowania. Podanie danych jest warunkiem wydania sprzętu.</p>

              <table style="width: 100%; text-align: center; margin-top: 40px; page-break-inside: avoid;">
                <tr>
                  <td style="width: 50%;">
                    <img src="${parsedData.sigAdmin}" style="width: 140px; height: auto;" /><br>
                    <span style="border-top: 1px solid black; padding-top: 5px; display: inline-block; width: 200px;">(Podpis WYDAJĄCEGO)</span>
                  </td>
                  <td style="width: 50%;">
                    <img src="${parsedData.sigBorrower}" style="width: 140px; height: auto;" /><br>
                    <span style="border-top: 1px solid black; padding-top: 5px; display: inline-block; width: 200px;">(Podpis KORZYSTAJĄCEGO - Akceptacja Umowy i RODO)</span>
                  </td>
                </tr>
              </table>

            </div>
          </div>
        `;

        // Zapisywanie PDF i wysyłanie e-maila
        var blob = Utilities.newBlob(htmlContent, MimeType.HTML).getAs(MimeType.PDF);
        blob.setName("Porozumienie_" + parsedData.nrPorozumienia.replace(/\//g, "_") + ".pdf");

        var folderName = "Protokoly_CRW";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        var pdfFile = folder.createFile(blob);
        pdfUrl = pdfFile.getUrl();

        if (parsedData.email && parsedData.email.trim() !== "") {
          try {
            MailApp.sendEmail({
              to: parsedData.email,
              subject: "Twoje Porozumienie Sprzętowe - SSUEW",
              htmlBody: "Cześć " + parsedData.osoba + ",<br><br>w załączniku przesyłamy oficjalną, podpisaną cyfrowo kopię Twojego Porozumienia Sprzętowego z Samorządem Studentów UEW.<br><br>Pamiętaj o terminowym zwrocie!<br><br>Pozdrawiamy,<br>Administracja Samorządu Studentów UEW",
              attachments: [blob]
            });
          } catch(e) { Logger.log("Błąd wysyłki maila: " + e); }
        }
      }

      // Zapis do zakładki WYDANIA
      var wydaniaSheet = ss.getSheetByName('WYDANIA');
      wydaniaSheet.appendRow([
        parsedData.nrPorozumienia,           // A - Nr_Porozumienia
        new Date().toLocaleString('pl-PL'),  // B - Data
        parsedData.osoba,                    // C - Kto_wypozyczyl
        parsedData.organizacja,              // D - Organizacja
        parsedData.sprzet,                   // E - SPRZĘT
        "WYDANE",                            // F - STATUS
        "",                                  // G - Data_Zwrotu (wypełni zapiszZwrot)
        pdfUrl,                              // H - PDF_Wydanie
        "",                                  // I - PDF_Zwrot (wypełni zapiszZwrot)
        parsedData.dateFrom || "",           // J - Data_Od
        parsedData.dateTo || "",             // K - Data_Do
        parsedData.email || ""               // L - Email (do wysyłki PDF zwrotu)
      ]);

      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ success: true, link: pdfUrl })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. APTECZKI - ZGŁASZANIE BRAKÓW
    // =========================================================================
    else if (parsedData.action === "zglosBrakiApteczki") {
      var apteczkiSheet = ss.getSheetByName('APTECZKI_BRAKI');
      if (!apteczkiSheet) {
        apteczkiSheet = ss.insertSheet('APTECZKI_BRAKI');
        apteczkiSheet.appendRow(["ID", "Data_Zgloszenia", "Apteczka_ID", "Apteczka_Nazwa", "Osoba", "Powod", "Zuzyte_Materialy", "Status"]);
      }
      var newAptId = "APT-" + Math.floor(1000 + Math.random() * 9000) + "/" + new Date().getFullYear();
      apteczkiSheet.appendRow([
        newAptId,
        new Date().toLocaleString('pl-PL'),
        parsedData.apteczkaId,
        parsedData.apteczkaName,
        parsedData.osoba,
        parsedData.powod,
        parsedData.zuzyteMaterialy,
        "Oczekuje"
      ]);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 3. APTECZKI - ZATWIERDZANIE UZUPEŁNIENIA PRZEZ ADMINA
    // =========================================================================
    else if (parsedData.action === "zamknijZgloszenieApteczki") {
      var apteczkiSheet = ss.getSheetByName('APTECZKI_BRAKI');
      var dataApt = apteczkiSheet.getDataRange().getValues();
      for (var i = 1; i < dataApt.length; i++) {
        if (String(dataApt[i][0]).trim() === String(parsedData.id).trim()) {
          apteczkiSheet.getRange(i + 1, 8).setValue("Zrealizowane przez: " + parsedData.adminOsoba);
          break;
        }
      }
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 4. ZWROTY SPRZĘTU — status, PDF ze stanem i decyzją, mail do zwracającego
    // =========================================================================
else if (parsedData.action === 'zapiszZwrot') {
  var sheet = ss.getSheetByName('WYDANIA');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colA = headers.indexOf('Nr_Porozumienia'); // col 0 (A)
  var colF = headers.indexOf('STATUS');          // col 5 (F)
  var colG = headers.indexOf('Data_Zwrotu');     // col 6 (G) — lub dodaj jeśli brak
  var colH = headers.indexOf('PDF_Wydanie');     // col 7 (H)
  var colI = headers.indexOf('PDF_Zwrot');       // col 8 (I) — nowa kolumna

  // Jeśli kolumna PDF_Zwrot nie istnieje jeszcze — dodaj nagłówek
  if (colI === -1) {
    colI = headers.length;
    sheet.getRange(1, colI + 1).setValue('PDF_Zwrot');
  }

  var targetRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colA === -1 ? 0 : colA]).trim() === String(parsedData.nrPorozumienia).trim()) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }

  if (targetRow === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Nie znaleziono porozumienia: ' + parsedData.nrPorozumienia }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Aktualizuj STATUS i datę zwrotu
  var dataZwrotu = parsedData.dataZwrotu || new Date().toLocaleString('pl-PL');
  sheet.getRange(targetRow, (colF === -1 ? 6 : colF) + 1).setValue('ZWRÓCONE');
  if (colG !== -1) sheet.getRange(targetRow, colG + 1).setValue(dataZwrotu);

  // Generuj PDF jeśli są podpisy
  var pdfUrl = '';
  var mailMsg = '';
  if (parsedData.sigAdmin && parsedData.sigBorrower) {
    var nrDoc = parsedData.nrPorozumienia;
    var osoba = parsedData.osoba || '';
    var organizacja = parsedData.organizacja || '';
    var adminName = parsedData.adminName || '';
    var sprzet = parsedData.sprzet || '';

    // Buduj wiersze tabeli sprzętu (CRA wysyła gotowe wiersze ze stanem i decyzją wydającego)
    var tabelaHTML = '';
    if (parsedData.sprzetTabelaHTML) {
      tabelaHTML = parsedData.sprzetTabelaHTML;
    } else {
      var ids = sprzet.split(',');
      for (var k = 0; k < ids.length; k++) {
        tabelaHTML += '<tr><td style="border:1px solid black;padding:5px;text-align:center;">' + (k+1) + '</td>'
          + '<td style="border:1px solid black;padding:5px;font-family:monospace;">' + ids[k].trim() + '</td></tr>';
      }
    }

    var htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      + '<style>'
      + 'body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #000; }'
      + 'h2 { text-align: center; font-size: 14px; margin-bottom: 4px; }'
      + 'h3 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; }'
      + '.info-grid { width: 100%; border-collapse: collapse; margin: 12px 0; }'
      + '.info-grid td { padding: 4px 8px; border: 1px solid #ccc; }'
      + '.info-grid td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }'
      + '.sprzet-table { width: 100%; border-collapse: collapse; margin: 12px 0; }'
      + '.sprzet-table th { border: 1px solid black; padding: 6px; background: #eeeeee; text-align: left; font-size: 10px; }'
      + '.sig-section { display: flex; justify-content: space-between; margin-top: 30px; }'
      + '.sig-box { width: 45%; text-align: center; }'
      + '.sig-box img { max-width: 160px; max-height: 60px; border-bottom: 1px solid #000; display: block; margin: 0 auto; }'
      + '.sig-box p { font-size: 10px; margin-top: 4px; }'
      + '.footer-note { font-size: 9px; color: #666; margin-top: 16px; text-align: center; }'
      + '</style></head><body>'
      + '<h2>PROTOKÓŁ ZWROTU SPRZĘTU</h2>'
      + '<h3>Samorząd Studentów Uniwersytetu Ekonomicznego we Wrocławiu</h3>'
      + '<hr style="margin:8px 0;">'
      + '<table class="info-grid">'
      + '<tr><td>Nr porozumienia</td><td><b>' + nrDoc + '</b></td></tr>'
      + '<tr><td>Zdający (Pożyczkobiorca)</td><td>' + osoba + (organizacja ? ' / ' + organizacja : '') + '</td></tr>'
      + '<tr><td>Przyjmujący (Dysponent)</td><td>' + adminName + '</td></tr>'
      + '<tr><td>Data zwrotu</td><td>' + dataZwrotu + '</td></tr>'
      + '</table>'
      + '<p style="font-weight:bold;margin-top:12px;">Zwrócony sprzęt:</p>'
      + '<table class="sprzet-table">'
      + '<thead><tr>'
      + '<th style="width:30px;">Lp.</th>'
      + '<th>Sprzęt — stan przy zwrocie i decyzja wydającego</th>'
      + '</tr></thead>'
      + '<tbody>' + tabelaHTML + '</tbody>'
      + '</table>'
      + '<p style="margin-top:12px;">Potwierdzam odbiór wyżej wymienionego sprzętu w stanie opisanym w tabeli powyżej.</p>'
      + '<div class="sig-section">'
      + '<div class="sig-box">'
      + '<img src="' + parsedData.sigBorrower + '" />'
      + '<p><b>Podpis Zdającego</b><br>' + osoba + '</p>'
      + '</div>'
      + '<div class="sig-box">'
      + '<img src="' + parsedData.sigAdmin + '" />'
      + '<p><b>Podpis Przyjmującego</b><br>' + adminName + '</p>'
      + '</div>'
      + '</div>'
      + '<p class="footer-note">Dokument wygenerowany automatycznie przez system CRA · ' + dataZwrotu + '</p>'
      + '</body></html>';

    var blob = Utilities.newBlob(htmlContent, 'text/html', 'Zwrot_' + nrDoc + '.html');
    var pdfBlob = blob.getAs('application/pdf');
    pdfBlob.setName('Zwrot_' + nrDoc + '.pdf');

    var folder = DriveApp.getFoldersByName('Protokoly_CRW');
    var targetFolder = folder.hasNext() ? folder.next() : DriveApp.getRootFolder();
    var file = targetFolder.createFile(pdfBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfUrl = file.getUrl();

    // Zapisz URL PDF zwrotu w kolumnie I (nie nadpisuj H = wydanie PDF)
    sheet.getRange(targetRow, colI + 1).setValue(pdfUrl);

    // Wyślij podpisany PDF zwrotu do zwracającego (e-mail z CRA albo z kolumny Email w WYDANIA)
    var colEmail = headers.indexOf('Email');
    var emailZwrot = String(parsedData.email || (colEmail !== -1 ? data[targetRow - 1][colEmail] : '') || '').trim();
    if (emailZwrot !== '') {
      try {
        MailApp.sendEmail({
          to: emailZwrot,
          subject: 'Protokół zwrotu sprzętu ' + nrDoc + ' - SSUEW',
          htmlBody: 'Cześć ' + osoba + ',<br><br>w załączniku przesyłamy podpisany protokół zwrotu sprzętu do porozumienia nr <b>' + nrDoc + '</b>, wraz z opisem stanu sprzętu przy zwrocie.<br><br>Dziękujemy za terminowy zwrot!<br><br>Pozdrawiamy,<br>Administracja Samorządu Studentów UEW',
          attachments: [pdfBlob]
        });
        mailMsg = 'Wysłano PDF na ' + emailZwrot;
      } catch (mailErr) { mailMsg = 'Błąd wysyłki maila: ' + mailErr; Logger.log(mailMsg); }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, link: pdfUrl, message: mailMsg }))
    .setMimeType(ContentService.MimeType.JSON);
}


    // =========================================================================
    // 5. OBSŁUGA REZERWACJI (NOWA I ZMIANA STATUSU)
    // =========================================================================
    else if (parsedData.action === "nowaRezerwacja") {
      var rezSheet = ss.getSheetByName('REZERWACJE');
      var lastRowRez = rezSheet.getLastRow();
      var nextIdNum = 1;
      if (lastRowRez > 1) {
        var lastIdString = rezSheet.getRange(lastRowRez, 1).getValue().toString();
        var match = lastIdString.match(/RES-(\d+)/);
        if (match && match[1]) nextIdNum = parseInt(match[1], 10) + 1;
        else nextIdNum = lastRowRez;
      }
      var newId = "RES-" + nextIdNum;
      rezSheet.appendRow([ newId, new Date().toLocaleString('pl-PL'), parsedData.sprzetKody, parsedData.dataOd, parsedData.dataDo, parsedData.cel, parsedData.kontakt, "Oczekuje" ]);
      SpreadsheetApp.flush();
      // Powiadomienie logistyki — błąd poczty nie może blokować złożenia wniosku
      try { powiadomONowymWniosku(newId, parsedData); } catch (mailErr) { Logger.log('Mail o wniosku: ' + mailErr); }
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: newId })).setMimeType(ContentService.MimeType.JSON);
    }

    else if (parsedData.action === "updateRezerwacjaStatus") {
      var rezSheet = ss.getSheetByName('REZERWACJE');
      var dataRez = rezSheet.getDataRange().getValues();
      for(var x = 1; x < dataRez.length; x++) {
        if(String(dataRez[x][0]).trim() === String(parsedData.id).trim()) {
          rezSheet.getRange(x + 1, 8).setValue(parsedData.status); break;
        }
      }
      SpreadsheetApp.flush();
      var calMsg = "Brak kalendarza";
      if (parsedData.status === "Zatwierdzone" && parsedData.createEvent) {
        try {
          var eventTitle = "Wydanie Sprzętu SSUEW - " + parsedData.organizacja;
          var pickupStart = new Date(parsedData.pickupDateTime + ":00");
          var pickupEnd = new Date(pickupStart.getTime() + 30 * 60000);
          var emails = [];
          if (parsedData.requesterEmail && parsedData.requesterEmail.trim() !== "") emails.push(parsedData.requesterEmail.trim());
          if (parsedData.adminEmail && parsedData.adminEmail.trim() !== "") emails.push(parsedData.adminEmail.trim());
          CalendarApp.getDefaultCalendar().createEvent(eventTitle, pickupStart, pickupEnd, {
            location: "Biuro Administracji Samorządu Studentów UEW (pom. 11, bud. B/L)", description: "Odbiór zarezerwowanego majątku:\n" + parsedData.sprzetKody + "\n\nPrzygotuj legitymację studencką.", guests: emails.join(","), sendInvites: true
          });
          calMsg = "Zapisano. Wysłano e-mail z zaproszeniem.";
        } catch (calErr) { calMsg = "Zatwierdzono, ale błędny e-mail do kalendarza."; }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: calMsg })).setMimeType(ContentService.MimeType.JSON);
    }

  else if (parsedData.action === 'setSerwisStatus') {
  var daneSheet = ss.getSheetByName('DANE');
  var daneData = daneSheet.getDataRange().getValues();
  var daneHeaders = daneData[0];
  var colQR    = daneHeaders.indexOf('KOD_QR');
  var colUwagi = daneHeaders.indexOf('UWAGI');
  if (colQR === -1 || colUwagi === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Brak kolumny KOD_QR lub UWAGI w arkuszu DANE' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  for (var s = 1; s < daneData.length; s++) {
    if (String(daneData[s][colQR]).trim() === String(parsedData.kodQR).trim()) {
      daneSheet.getRange(s + 1, colUwagi + 1).setValue(parsedData.uwagi || '');
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Nie znaleziono: ' + parsedData.kodQR }))
    .setMimeType(ContentService.MimeType.JSON);
}


  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// POWIADOMIENIE O NOWYM WNIOSKU O SPRZĘT (wywoływane z nowaRezerwacja)
// Mail wychodzi z konta, które jest właścicielem wdrożenia („Wykonaj jako: Ja”).
// =============================================================================
function powiadomONowymWniosku(id, data) {
  var kontakt = String(data.kontakt || '').split('|').map(function(s) { return s.trim(); });
  var sprzet = String(data.sprzetNazwy || data.sprzetKody || '').split(', ');
  var html =
    '<p><b>Nowy wniosek o wypożyczenie sprzętu</b> — nr <b>' + id + '</b></p>' +
    '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:14px">' +
    '<tr><td><b>Kto wypożycza</b></td><td>' + kontakt.join('<br>') + '</td></tr>' +
    '<tr><td><b>Organizacja / cel</b></td><td>' + (data.cel || '-') + '</td></tr>' +
    '<tr><td><b>Termin</b></td><td>' + data.dataOd + ' → ' + data.dataDo + '</td></tr>' +
    '<tr><td><b>Sprzęt</b></td><td>' + sprzet.join('<br>') + '</td></tr>' +
    '</table>' +
    '<p><a href="https://cra-system.vercel.app/wydawanie">Otwórz panel wniosków w CRA</a></p>';
  MailApp.sendEmail({
    to: POWIADOMIENIA_WNIOSKI.join(','),
    subject: '[CRA] Nowy wniosek o sprzęt ' + id + ' — ' + (data.cel || ''),
    htmlBody: html,
    name: 'CRA — Samorząd Studentów UEW'
  });
}

// Uruchom raz ręcznie w edytorze (lista funkcji → testPowiadomienia → Uruchom),
// żeby sprawdzić, czy maile dochodzą do Martyny i Jakuba.
function testPowiadomienia() {
  powiadomONowymWniosku('TEST-1', {
    kontakt: 'Jan Testowy | Tel: 500 000 000 | Email: jan@samorzad.ue.wroc.pl',
    cel: 'Test powiadomień', dataOd: '2026-10-20', dataDo: '2026-10-21',
    sprzetNazwy: 'Laptop Dell (LAP-01), Projektor (PRJ-02)'
  });
}
