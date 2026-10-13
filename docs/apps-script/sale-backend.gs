// =============================================================================
// BACKEND SAL CRA (Google Apps Script) — kopia referencyjna z repo.
// Wdrożenie: edytor Apps Script → Ctrl+A → wklej → Ctrl+S → uruchom raz testPowiadomCRA
// (zgoda na UrlFetch i MailApp) → Wdróż → Zarządzaj wdrożeniami → ołówek → „Nowa wersja”.
// Zmiany 2026-10-11: powiadomienia CRA (powiadomCRA), maile do wnioskodawców
// (mailDoWnioskodawcy), submitBooking zwraca rowId, doGet zwraca inboxError.
// Sekret: Ustawienia projektu → Właściwości skryptu → NOTIFY_SECRET (ta sama wartość co w Vercelu).
// =============================================================================

// === KONFIGURACJA ===
// Wklej tutaj ID swojego drugiego pliku: KRRPPD SSUEW (WNIOSKI)
var INBOX_SHEET_ID = '1TspT6A7mV1NdHuiFB8-2_R8mYH9LGYldWNcIifYV0zc'; 
var CRA_NOTIFY_URL = 'https://cra-system.vercel.app/api/notify';

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); 
  
  var sheetSale = ss.getSheetByName('Sale') || ss.getSheets()[0];
  var dataSale = getSheetData(sheetSale);
  
  var sheetPrzedluzenia = ss.getSheetByName('Przedluzenia');
  var dataPrzedluzenia = getSheetData(sheetPrzedluzenia);
  
  var pending = [];
  var rejected = [];
  var inboxError = false; // CRA nie synchronizuje liczników, gdy odczyt wniosków się nie udał
    try {
    var inboxSS = SpreadsheetApp.openById(INBOX_SHEET_ID);
    var inboxSheet = inboxSS.getSheets()[0];
    
    pending = getPendingData(inboxSheet, "OCZEKUJE");
    rejected = getPendingData(inboxSheet, "ODRZUCONE"); 
    
    // 🔥 DODAJ TĘ LINIJKĘ (Pobierze dla nas zatwierdzone wnioski z mailem!)
    var approved_reqs = getPendingData(inboxSheet, "ZATWIERDZONE"); 

  } catch(err) {
    console.error("Błąd: ", err);
    inboxError = true;
  }

  return ContentService.createTextOutput(JSON.stringify({
    sale: dataSale,
    przedluzenia: dataPrzedluzenia,
    pending: pending,
    inboxError: inboxError,
    rejected: rejected,
    // 🔥 DODAJ TĘ LINIJKĘ W ZWRACANYM JSON-ie (Wysyła je do frontendu):
    approved_reqs: approved_reqs || [] 
  })).setMimeType(ContentService.MimeType.JSON);
}


function getPendingData(sheet, filterStatus) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var displayRows = sheet.getDataRange().getDisplayValues();
  if (rows.length <= 1) return []; 

  var originalHeaders = rows[0].map(function(h) { return h.toString().trim(); });
  var lowerHeaders = originalHeaders.map(function(h) { return h.toLowerCase(); });
  
  var statusIdx = lowerHeaders.indexOf('status');
  if (statusIdx === -1) statusIdx = originalHeaders.length - 1;

  var data = [];
  var targetStatus = String(filterStatus).trim().toUpperCase();
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var statusValue = String(row[statusIdx] || "").trim().toUpperCase(); 
    
    var isMatch = false;
    if (targetStatus === "OCZEKUJE") {
        if (statusValue === "" || statusValue === "OCZEKUJE" || statusValue === "NOWY" || statusValue === "OCZEKUJĄCY") {
            isMatch = true;
        }
    } else {
        if (statusValue === targetStatus) {
            isMatch = true;
        }
    }
    
    if (isMatch) {
      if (!row.join("").trim()) continue; // pomiń totalnie puste wiersze

      var record = { id: i }; 
      for (var j = 0; j < originalHeaders.length; j++) {
        var headerKey = originalHeaders[j];
        if (lowerHeaders[j] === 'date' || lowerHeaders[j] === 'start' || lowerHeaders[j] === 'end' || lowerHeaders[j] === 'timestamp') {
          record[headerKey] = displayRows[i][j];
        } else {
          record[headerKey] = row[j];
        }
      }
      
      if (targetStatus === "OCZEKUJE" && !record.status) {
          record.status = "OCZEKUJE"; 
      }
      
      data.push(record);
    }
  }
  return data;
}



// ==========================================
// FUNKCJE POMOCNICZE (MAGIA CZYTANIA DAT)
// ==========================================

function getSheetData(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var displayRows = sheet.getDataRange().getDisplayValues(); 
  if (rows.length === 0) return [];
  
  var headers = rows[0].map(function(h) { return h.toString().trim(); });
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      // Wymuszamy czytanie daty i godzin jako czysty tekst z ekranu
      if (headers[j] === 'date' || headers[j] === 'start' || headers[j] === 'end' || headers[j] === 'until') {
        record[headers[j]] = displayRows[i][j];
      } else {
        record[headers[j]] = row[j];
      }
    }
    // Sprawdzamy czy wiersz nie jest całkowicie pusty
    if (row.join("").length > 0) {
      data.push(record);
    }
  }
  return data;
}

// ==========================================
// FUNKCJA ODBIERAJĄCA ZAPYTANIA POST (Z REACTA)
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var inboxSS = SpreadsheetApp.openById(INBOX_SHEET_ID);
    var calSS = SpreadsheetApp.getActiveSpreadsheet();
    
    // AKCJA 1: Student wysyła formularz -> Zapis w Arkuszu Wniosków
    if (data.action === "submitBooking") {
      var inboxSheet = inboxSS.getSheets()[0];
      
      // Tworzy nagłówki automatycznie, jeśli to nowy arkusz
      if (inboxSheet.getLastRow() === 0) {
        inboxSheet.appendRow(["Timestamp", "applicantName", "email", "orgType", "org", "title", "room", "date", "start", "end", "justification", "notes", "status"]);
      }
      
      inboxSheet.appendRow([
        new Date().toLocaleString('pl-PL'), 
        data.applicantName || "", 
        data.email || "", 
        data.orgType || "", 
        data.org || "", 
        data.title || "", 
        data.room || "", 
        data.date || "", 
        data.start || "", 
        data.end || "", 
        data.justification || "", 
        data.notes || "", 
        "OCZEKUJE"
      ]);

      // rowId = indeks w getPendingData (numer wiersza arkusza - 1)
      var rowId = inboxSheet.getLastRow() - 1;
      powiadomCRA({
        event: 'created', module: 'sale', refId: String(rowId),
        data: { room: data.room, org: data.org, title: data.title, date: data.date, start: data.start, end: data.end }
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, rowId: rowId })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // AKCJA 2: Admin Akceptuje -> Zapis w Kalendarzu ('Sale') + zmiana we Wnioskach na ZATWIERDZONE
    if (data.action === "approveBooking") {
      var calSheet = calSS.getSheetByName('Sale') || calSS.getSheets()[0];
      var inboxSheet = inboxSS.getSheets()[0];
      
      // Sprytne łączenie nazwy organizacji z tematem na jeden kafelek (jak w Twoim Excelu)
      var displayTitle = data.title;
      if (data.org && data.org !== "Samorząd Studentów UEW" && data.org !== "Samorząd Studentów") {
         displayTitle = data.title + " (" + data.org + ")";
      }
      
      // 🟢 OTO ZMIANA: Pobieramy kolor z danych, a jeśli go nie ma, dajemy domyślny indigo
      var eventColor = data.color ? data.color : "bg-indigo-600";
      
      calSheet.appendRow([
        data.room,         
        data.date,         
        data.start,        
        data.end,          
        displayTitle,      
        eventColor,         // 🟢 Wstawiamy zmienną eventColor zamiast sztywnego "bg-indigo-600"
        data.applicantName || "",   // ← nowe
        data.email || ""            // ← nowe
      ]);
      
      // Zmiana statusu we wnioskach
      var headers = inboxSheet.getDataRange().getValues()[0];
      var statusCol = headers.indexOf('status') + 1; // +1 bo Arkusze liczą od 1
      if (statusCol === 0) statusCol = inboxSheet.getLastColumn();
      
      inboxSheet.getRange(data.rowId + 1, statusCol).setValue("ZATWIERDZONE"); 

      powiadomCRA({ event: 'resolved', module: 'sale', refId: String(data.rowId), resolution: 'approved', actor: data.actor || '' });
      mailDoWnioskodawcy(data.email, 'ZATWIERDZONE', { title: data.title, room: data.room, date: data.date, start: data.start, end: data.end });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // AKCJA 3: Admin Odrzuca -> Tylko zmiana statusu we Wnioskach na ODRZUCONE
    if (data.action === "rejectBooking") {
      var inboxSheet = inboxSS.getSheets()[0];
      
      var headers = inboxSheet.getDataRange().getValues()[0];
      var statusCol = headers.indexOf('status') + 1;
      if (statusCol === 0) statusCol = inboxSheet.getLastColumn();
      
      inboxSheet.getRange(data.rowId + 1, statusCol).setValue("ODRZUCONE"); 

      // Dane wnioskodawcy z wiersza (front wysyła tylko rowId)
      var lower = headers.map(function(h) { return String(h).trim().toLowerCase(); });
      var vals = inboxSheet.getRange(data.rowId + 1, 1, 1, headers.length).getDisplayValues()[0];
      var pick = function(name) { var i = lower.indexOf(name); return i === -1 ? '' : vals[i]; };

      powiadomCRA({ event: 'resolved', module: 'sale', refId: String(data.rowId), resolution: 'rejected', actor: data.actor || '' });
      mailDoWnioskodawcy(pick('email'), 'ODRZUCONE', { title: pick('title'), room: pick('room'), date: pick('date'), start: pick('start'), end: pick('end') });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
  // AKCJA 4: Admin dodaje Przedłużenie (Zgoda Kanclerza)
    if (data.action === "addExtension") {
      var extSheet = calSS.getSheetByName('Przedluzenia');
      
      // Jeśli nie masz zakładki, skrypt sam ją stworzy z odpowiednimi nagłówkami
      if (!extSheet) {
        extSheet = calSS.insertSheet('Przedluzenia');
        extSheet.appendRow(["date", "until", "note"]);
      }
      
      extSheet.appendRow([data.date, data.until, data.note]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ==========================================
// FUNKCJA: AUTOMATYCZNY BACKUP ARKUSZA
// ==========================================
function createBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var originalFileId = ss.getId();
  var originalFile = DriveApp.getFileById(originalFileId);
  
  // Formatowanie daty do nazwy pliku
  var date = new Date();
  var dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // Nowa nazwa pliku
  var newName = ss.getName() + " - BACKUP " + dateString;
  
  // Pobieranie folderu, w którym leży oryginał
  var folders = originalFile.getParents();
  var folder = folders.hasNext() ? folders.next() : DriveApp.getRootFolder();
  
  // Tworzenie kopii
  originalFile.makeCopy(newName, folder);
}

// ==========================================
// POWIADOMIENIA CRA (2026-10-11)
// Błąd powiadomienia nigdy nie blokuje wniosku — wszystko w try/catch.
// ==========================================
function powiadomCRA(payload) {
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('NOTIFY_SECRET');
    if (!secret) { console.warn('Brak NOTIFY_SECRET we Właściwościach skryptu — pomijam powiadomienie'); return; }
    var res = UrlFetchApp.fetch(CRA_NOTIFY_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Notify-Secret': secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 300) console.warn('CRA notify ' + res.getResponseCode() + ': ' + res.getContentText());
  } catch (err) {
    console.warn('CRA notify: ' + err);
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mailDoWnioskodawcy(email, decyzja, w) {
  try {
    email = String(email || '').trim();
    if (!email || email.indexOf('@') === -1) return;
    var zatw = decyzja === 'ZATWIERDZONE';
    var kiedy = esc(w.date) + (w.start && w.end ? ', ' + esc(w.start) + '–' + esc(w.end) : '');
    var html = 'Cześć,<br><br>Twoja rezerwacja <b>„' + esc(w.title) + '”</b> w sali <b>' + esc(w.room) + '</b> (' + kiedy + ') '
      + (zatw ? 'została <b>zatwierdzona</b> i jest już w kalendarzu Samorządu.'
              : '<b>nie została zatwierdzona</b>. Jeśli masz pytania, odpowiedz na tę wiadomość.')
      + '<br><br>Pozdrawiamy,<br>Administracja Samorządu Studentów UEW';
    MailApp.sendEmail({
      to: email,
      subject: 'Rezerwacja sali ' + w.room + ' (' + w.date + ') — ' + (zatw ? 'zatwierdzona' : 'odrzucona'),
      htmlBody: html,
      name: 'CRA — Samorząd Studentów UEW'
    });
  } catch (err) {
    console.warn('Mail do wnioskodawcy: ' + err);
  }
}

// Uruchom raz ręcznie (lista funkcji → testPowiadomCRA → Uruchom): nada zgody i wyśle testowy push.
// Testowa sprawa zamknie się sama przy następnym wejściu admina na stronę sal.
function testPowiadomCRA() {
  powiadomCRA({
    event: 'created', module: 'sale', refId: 'TEST-' + new Date().getTime(),
    data: { room: '110 L', org: 'Test', title: 'Test powiadomień CRA', date: '2026-10-20', start: '18:00', end: '20:00' }
  });
}
