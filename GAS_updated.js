/***********************
 * SSUEW – Rejestr Plakatowania i Banerów – Eskalacje + Audyt Kanclerza + CRA (Mapy)
 ***********************/

const CONFIG = {
  SHEET_NAME: "REJESTR_PLAKATOWANIA",
  TZ: "Europe/Warsaw",
  DRY_RUN: false,

  KANCLERZ_EMAIL: "wieslaw.witter@ue.wroc.pl",
  ADMIN_EMAIL: "administracja@samorzad.ue.wroc.pl",

  // 0-based indexy kolumn PLAKATY:
  COL: {
    ID: 0,                 // A
    ZNAK: 1,               // B
    ORG: 2,                // C
    EMAIL: 3,              // D
    DATA_ZGODY: 4,         // E
    OPIS_PROMO: 5,         // F
    OPIS_OBOW: 6,          // G
    DATA_ZDJECIA: 7,       // H
    STATUS_RECZNY: 8,      // I
    SENT_MINUS2: 9,        // J
    SENT_0: 10,            // K
    UWAGI: 11,             // L
    STATUS_SYSTEM: 12,     // M
    SENT_PLUS3: 13         // N
  }
};

const CONFIG_BANERY = {
  SHEET_NAME: "REJESTR_BANEROW",

  // 0-based indexy kolumn BANERY:
  COL: {
    ID: 0,                 // A
    ZNAK: 1,               // B
    ORG: 2,                // C
    EMAIL: 3,              // D
    DATA_ZGODY: 4,         // E
    LOKALIZACJA: 5,        // F <-- Lokalizacja
    OPIS: 6,               // G
    DATA_ZDJECIA: 7,       // H
    STATUS_RECZNY: 8,      // I
    SENT_MINUS2: 9,        // J
    SENT_0: 10,            // K
    UWAGI: 11,             // L
    LINK_ZDJECIE: 12,      // M <-- Weryfikacja (Link do zdjęcia)
    SENT_PLUS1: 13         // N <-- Eskalacja po 1 dniu
  }
};

function runDailyPlakatowanie() {
  sendReminders_();        // Uruchamia skrypt dla plakatów
  sendRemindersBanery_();  // Uruchamia skrypt dla banerów
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Rejestr Plakatów i Banerów')
    .addItem('1. Wyślij dzisiejsze przypomnienia i eskalacje (WSZYSTKO)', 'runDailyPlakatowanie')
    .addItem('2. Wygeneruj Raport dla Kanclerza', 'generujAudytMiesieczny')
    .addToUi();
}

// ==========================================
// BACKEND DLA APLIKACJI REACT (MapPage.jsx)
// ==========================================

/**
 * doGet(e) – obsługuje GET requesty z frontendu React.
 *
 * Akcje (e.parameter.action):
 *   brak / inne  → zwraca listę lokalizacji z mapy (domyślne zachowanie)
 *   getHistory   → historia plakatów/banerów dla danej lokalizacji (e.parameter.locationId)
 *   getAllPosters → wszystkie plakaty i banery z obu rejestrów
 */
function doGet(e) {  // UWAGA: dodany parametr 'e' do obsługi action/locationId
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  // Routing do specjalnych akcji
  if (action === 'getHistory')   return getHistory_(e);
  if (action === 'getAllPosters') return getAllPosters_();

  // === DOMYŚLNE: zwróć lokalizacje z mapy (jak poprzednio) ===
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetMiejsca = findSheet(ss, "Miejsca");
  const sheetRezerwacje = findSheet(ss, "Rezerwacje_Mapy") || findSheet(ss, "Rezerwacja_Mapa");

  if (!sheetMiejsca) return jsonResponse({ error: "Nie znaleziono arkusza Miejsca" });

  const dataMiejsca = sheetMiejsca.getDataRange().getValues();
  const dataRezerwacje = sheetRezerwacje ? sheetRezerwacje.getDataRange().getValues() : [];

  const dzisiaj = new Date();
  dzisiaj.setHours(0, 0, 0, 0);

  // Liczymy aktywne rezerwacje i zbieramy dane dla Admina
  const liczniki = {};
  const aktywnePlakaty = {};

  if (dataRezerwacje.length > 1) {
    dataRezerwacje.slice(1).forEach(row => {
      const id = String(row[0]).trim();
      const rawDate = row[1];
      const nazwa = String(row[2] || "");
      const org = String(row[3] || "");
      const credId = String(row[6] || "");

      if (id && rawDate) {
        const dataKoniec = new Date(rawDate);
        if (!isNaN(dataKoniec.getTime()) && dataKoniec >= dzisiaj) {
          liczniki[id] = (liczniki[id] || 0) + 1;

          if (!aktywnePlakaty[id]) aktywnePlakaty[id] = [];
          aktywnePlakaty[id].push({
            credId: credId,
            nazwa: nazwa,
            org: org,
            // FIX: dodane endDate – wcześniej brakowało, frontend pokazywał "Zdjąć do: undefined"
            endDate: rawDate ? Utilities.formatDate(new Date(rawDate), "Europe/Warsaw", "dd.MM.yyyy") : "—"
          });
        }
      }
    });
  }

  // Budujemy listę miejsc
  const locations = dataMiejsca.slice(1).map(row => {
    const id = String(row[0]).trim();
    const capacity = Number(row[3]) || 0;
    const zajete = liczniki[id] || 0;
    const wolne = Math.max(0, capacity - zajete);

    return {
      id: id,
      name: String(row[1]),
      type: String(row[2]).toLowerCase().trim(),
      capacity: capacity,
      free: wolne,
      top: toPercent(row[4]),
      left: toPercent(row[5]),
      image: String(row[6] || ""),
      activePosters: aktywnePlakaty[id] || []
    };
  });

  return jsonResponse({ locations: locations });
}

/**
 * getHistory_ – historia wszystkich plakatów/banerów dla danej lokalizacji.
 * Czyta WSZYSTKIE wiersze Rezerwacje_Mapy (nie tylko aktywne),
 * dołącza status z REJESTR_PLAKATOWANIA lub REJESTR_BANEROW przez credId.
 */
function getHistory_(e) {
  const locationId = String((e && e.parameter && e.parameter.locationId) || "").trim();
  if (!locationId) return jsonResponse({ error: "Brak parametru locationId" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetRez = findSheet(ss, "Rezerwacje_Mapy") || findSheet(ss, "Rezerwacja_Mapa");
  if (!sheetRez) return jsonResponse({ history: [] });

  const dataRez = sheetRez.getDataRange().getValues();

  // Budujemy mapę credId → status z obu rejestrów
  // Plakaty: col B (index 1) = credId, col M (index 12) = STATUS_SYSTEM, col I (index 8) = STATUS_RECZNY
  // Banery:  col B (index 1) = credId, col I (index 8) = STATUS_RECZNY (brak STATUS_SYSTEM)
  const statusMap = {};

  const sheetPlakaty = findSheet(ss, "REJESTR_PLAKATOWANIA");
  if (sheetPlakaty) {
    sheetPlakaty.getDataRange().getValues().slice(1).forEach(row => {
      const credId = String(row[1] || "").trim();
      if (!credId) return;
      // Preferuj STATUS_SYSTEM (col M), fallback na STATUS_RECZNY (col I)
      const sys = String(row[12] || "").trim();
      const reczny = String(row[8] || "").trim();
      statusMap[credId] = (sys || reczny || "ZDJETE").toUpperCase();
    });
  }

  const sheetBanery = findSheet(ss, "REJESTR_BANEROW");
  if (sheetBanery) {
    sheetBanery.getDataRange().getValues().slice(1).forEach(row => {
      const credId = String(row[1] || "").trim();
      if (!credId) return;
      // Banery nie mają STATUS_SYSTEM – tylko STATUS_RECZNY (col I)
      const reczny = String(row[8] || "").trim();
      if (!statusMap[credId]) { // nie nadpisuj jeśli już znaleziono w plakatach
        statusMap[credId] = (reczny || "ZDJETE").toUpperCase();
      }
    });
  }

  // Filtrujemy Rezerwacje_Mapy po locationId – WSZYSTKIE wiersze (nie tylko aktywne)
  const history = [];
  dataRez.slice(1).forEach(row => {
    if (String(row[0]).trim() !== locationId) return;
    const credId = String(row[6] || "").trim();
    const rawDate = row[1];
    history.push({
      credId: credId,
      nazwa: String(row[2] || ""),
      org: String(row[3] || ""),
      endDate: rawDate ? Utilities.formatDate(new Date(rawDate), "Europe/Warsaw", "dd.MM.yyyy") : "—",
      status: statusMap[credId] || "ZDJETE"
    });
  });

  // Sortujemy: najpierw aktywne, potem zakończone (malejąco po dacie)
  history.sort((a, b) => {
    if (a.status === 'AKTYWNE' && b.status !== 'AKTYWNE') return -1;
    if (a.status !== 'AKTYWNE' && b.status === 'AKTYWNE') return 1;
    return 0;
  });

  return jsonResponse({ history: history });
}

/**
 * getAllPosters_ – wszystkie wpisy z REJESTR_PLAKATOWANIA + REJESTR_BANEROW.
 * Dołącza locationId i posterName przez join z Rezerwacje_Mapy po credId.
 */
function getAllPosters_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Budujemy mapę credId → { locationId, posterName } z Rezerwacje_Mapy
  const sheetRez = findSheet(ss, "Rezerwacje_Mapy") || findSheet(ss, "Rezerwacja_Mapa");
  const locationMap = {};  // credId → locationId
  const nazwaMap = {};     // credId → posterName

  if (sheetRez) {
    sheetRez.getDataRange().getValues().slice(1).forEach(row => {
      const credId = String(row[6] || "").trim();
      if (!credId) return;
      locationMap[credId] = String(row[0] || "").trim();  // col A = locationId
      nazwaMap[credId] = String(row[2] || "").trim();     // col C = posterName
    });
  }

  const posters = [];

  // === PLAKATY ===
  const sheetPlakaty = findSheet(ss, "REJESTR_PLAKATOWANIA");
  if (sheetPlakaty) {
    sheetPlakaty.getDataRange().getValues().slice(1).forEach(row => {
      const credId = String(row[1] || "").trim();
      if (!credId) return; // pomijamy puste wiersze

      const sys = String(row[12] || "").trim();
      const reczny = String(row[8] || "").trim();
      const status = (sys || reczny || "AKTYWNE").toUpperCase();

      const rawZgody = row[4];
      const rawZdjecia = row[7];

      posters.push({
        credId: credId,
        org: String(row[2] || ""),
        email: String(row[3] || ""),
        dataZgody: rawZgody ? Utilities.formatDate(new Date(rawZgody), "Europe/Warsaw", "dd.MM.yyyy") : "—",
        dataZdjecia: rawZdjecia ? Utilities.formatDate(new Date(rawZdjecia), "Europe/Warsaw", "dd.MM.yyyy") : "—",
        status: status,
        type: "plakat",
        locationId: locationMap[credId] || "—",
        nazwa: nazwaMap[credId] || String(row[5] || "")  // fallback na OPIS_PROMO
      });
    });
  }

  // === BANERY ===
  const sheetBanery = findSheet(ss, "REJESTR_BANEROW");
  if (sheetBanery) {
    sheetBanery.getDataRange().getValues().slice(1).forEach(row => {
      const credId = String(row[1] || "").trim();
      if (!credId) return;

      // Banery nie mają STATUS_SYSTEM – używamy STATUS_RECZNY (col I)
      const reczny = String(row[8] || "").trim();
      const status = (reczny || "AKTYWNE").toUpperCase();

      const rawZgody = row[4];
      const rawZdjecia = row[7];

      posters.push({
        credId: credId,
        org: String(row[2] || ""),
        email: String(row[3] || ""),
        dataZgody: rawZgody ? Utilities.formatDate(new Date(rawZgody), "Europe/Warsaw", "dd.MM.yyyy") : "—",
        dataZdjecia: rawZdjecia ? Utilities.formatDate(new Date(rawZdjecia), "Europe/Warsaw", "dd.MM.yyyy") : "—",
        status: status,
        type: "baner",
        locationId: locationMap[credId] || "—",
        nazwa: nazwaMap[credId] || String(row[6] || "")  // fallback na OPIS (col G)
      });
    });
  }

  // Sortujemy: aktywne na górze
  posters.sort((a, b) => {
    if (a.status === 'AKTYWNE' && b.status !== 'AKTYWNE') return -1;
    if (a.status !== 'AKTYWNE' && b.status === 'AKTYWNE') return 1;
    return 0;
  });

  return jsonResponse({ posters: posters });
}

/**
 * doPost(e) – obsługuje POST requesty z frontendu React.
 *
 * Akcje (parsedData.action):
 *   addPoster      → dodaj plakat/baner (istniejące)
 *   removePoster   → zdejmij plakat/baner (istniejące)
 *   updateLocation → zaktualizuj dane lokalizacji (NOWE)
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const parsedData = JSON.parse(e.postData.contents);

    // === DODAWANIE PLAKATU (istniejące – bez zmian) ===
    if (parsedData.action === 'addPoster') {
      let sheetRez = findSheet(ss, "Rezerwacje_Mapy") || findSheet(ss, "Rezerwacja_Mapa");
      if (!sheetRez) {
        sheetRez = ss.insertSheet("Rezerwacje_Mapy");
        sheetRez.appendRow(["ID_Lokalizacji", "Data_Zdjecia", "Nazwa", "Organizacja", "Email", "Typ", "Znak_CRED"]);
      }

      sheetRez.appendRow([
        parsedData.locationId, parsedData.endDate, parsedData.posterName,
        parsedData.organization, parsedData.email, parsedData.locationType, parsedData.credId
      ]);

      const todayStr = Utilities.formatDate(new Date(), "Europe/Warsaw", "dd.MM.yyyy");
      const endD = new Date(parsedData.endDate);
      const endStr = Utilities.formatDate(endD, "Europe/Warsaw", "dd.MM.yyyy");

      if (parsedData.locationType === 'baner') {
        const bSheet = findSheet(ss, "REJESTR_BANEROW");
        if (bSheet) {
          const lastId = bSheet.getLastRow() > 1 ? Number(bSheet.getRange(bSheet.getLastRow(), 1).getValue()) || bSheet.getLastRow() : 1;
          bSheet.appendRow([
            lastId + 1, parsedData.credId, parsedData.organization, parsedData.email, todayStr, parsedData.locationId,
            parsedData.posterName, endStr, "AKTYWNE", "NIE", "NIE", "", "", "NIE"
          ]);
        }
      } else {
        const pSheet = findSheet(ss, "REJESTR_PLAKATOWANIA");
        if (pSheet) {
          const lastId = pSheet.getLastRow() > 1 ? Number(pSheet.getRange(pSheet.getLastRow(), 1).getValue()) || pSheet.getLastRow() : 1;
          pSheet.appendRow([
            lastId + 1, parsedData.credId, parsedData.organization, parsedData.email, todayStr, parsedData.posterName,
            "promocja wydarzenia " + parsedData.posterName, endStr, "AKTYWNE", "NIE", "NIE", "-", "AKTYWNE", "NIE"
          ]);
        }
      }
      SpreadsheetApp.flush();
      return jsonResponse({ success: true });
    }

    // === ZDEJMOWANIE PLAKATU (istniejące – bez zmian) ===
    if (parsedData.action === 'removePoster') {
      const sheetRez = findSheet(ss, "Rezerwacje_Mapy") || findSheet(ss, "Rezerwacja_Mapa");
      if (sheetRez) {
        const data = sheetRez.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][6]) === String(parsedData.credId)) {
            sheetRez.getRange(i+1, 2).setValue(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
            break;
          }
        }
      }

      const pSheet = findSheet(ss, "REJESTR_PLAKATOWANIA");
      if (pSheet) {
        const pData = pSheet.getDataRange().getValues();
        for (let i = 1; i < pData.length; i++) {
          if (String(pData[i][1]) === String(parsedData.credId)) {
            pSheet.getRange(i+1, 9).setValue("ZDJĘTE");  // col I
            pSheet.getRange(i+1, 13).setValue("ZDJĘTE"); // col M
            break;
          }
        }
      }

      const bSheet = findSheet(ss, "REJESTR_BANEROW");
      if (bSheet) {
        const bData = bSheet.getDataRange().getValues();
        for (let i = 1; i < bData.length; i++) {
          if (String(bData[i][1]) === String(parsedData.credId)) {
            bSheet.getRange(i+1, 9).setValue("ZDJĘTE");  // col I = STATUS_RECZNY
            // Uwaga: col M w REJESTR_BANEROW to LINK_ZDJECIE, nie STATUS – nie nadpisujemy
            break;
          }
        }
      }
      SpreadsheetApp.flush();
      return jsonResponse({ success: true });
    }

    // === NOWE: AKTUALIZACJA DANYCH LOKALIZACJI ===
    if (parsedData.action === 'updateLocation') {
      const sheetMiejsca = findSheet(ss, "Miejsca");
      if (!sheetMiejsca) return jsonResponse({ error: "Nie znaleziono arkusza Miejsca" });

      const dataMiejsca = sheetMiejsca.getDataRange().getValues();
      const locationId = String(parsedData.locationId || "").trim();

      for (let i = 1; i < dataMiejsca.length; i++) {
        if (String(dataMiejsca[i][0]).trim() !== locationId) continue;

        const rowNum = i + 1; // 1-based row number dla getRange

        // Miejsca: row[1]=name (col B=2), row[3]=capacity (col D=4), row[6]=image (col G=7)
        if (parsedData.name !== undefined && parsedData.name !== "") {
          sheetMiejsca.getRange(rowNum, 2).setValue(String(parsedData.name));
        }
        if (parsedData.capacity !== undefined && parsedData.capacity !== "") {
          sheetMiejsca.getRange(rowNum, 4).setValue(Number(parsedData.capacity));
        }
        if (parsedData.imageUrl !== undefined && parsedData.imageUrl !== "") {
          sheetMiejsca.getRange(rowNum, 7).setValue(String(parsedData.imageUrl));
        }

        SpreadsheetApp.flush();
        return jsonResponse({ success: true });
      }

      return jsonResponse({ error: "Nie znaleziono lokalizacji: " + locationId });
    }

  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// ==========================================
// 1A. MODUŁ PRZYPOMNIEŃ I ESKALACJI - PLAKATY (bez zmian)
// ==========================================
function sendReminders_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Brak arkusza: ${CONFIG.SHEET_NAME}`);

  const range = sheet.getDataRange();
  const data = range.getValues();
  const today = startOfDay_(new Date());

  const updatesMinus2 = data.map(row => [row[CONFIG.COL.SENT_MINUS2]]);
  const updates0 = data.map(row => [row[CONFIG.COL.SENT_0]]);
  const updatesPlus3 = data.map(row => [row[CONFIG.COL.SENT_PLUS3]]);
  let needsUpdate = false;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];

    const email = String(row[CONFIG.COL.EMAIL] || "").trim();
    if (!email) continue;

    const status = getStatus_(row, CONFIG);
    if (status !== "AKTYWNE") continue;

    const removalDate = toDate_(row[CONFIG.COL.DATA_ZDJECIA]);
    if (!removalDate) continue;

    const diffDays = daysDiff_(today, startOfDay_(removalDate));

    const znak = String(row[CONFIG.COL.ZNAK] || "").trim();
    const opis = String(row[CONFIG.COL.OPIS_OBOW] || "").trim();
    const org = String(row[CONFIG.COL.ORG] || "").trim();

    const sentMinus2 = String(row[CONFIG.COL.SENT_MINUS2] || "").trim().toUpperCase();
    const sent0 = String(row[CONFIG.COL.SENT_0] || "").trim().toUpperCase();
    const sentPlus3 = String(row[CONFIG.COL.SENT_PLUS3] || "").trim().toUpperCase();

    if (diffDays === 2 && sentMinus2 !== "TAK") {
      sendMail_(email, znak, opis, removalDate, false);
      updatesMinus2[r][0] = "TAK";
      needsUpdate = true;
    }

    if (diffDays === 0 && sent0 !== "TAK") {
      sendMail_(email, znak, opis, removalDate, true);
      updates0[r][0] = "TAK";
      needsUpdate = true;
    }

    if (diffDays <= -3 && sentPlus3 !== "TAK") {
      sendEscalationMail_(email, znak, opis, org);
      updatesPlus3[r][0] = "TAK";
      needsUpdate = true;
    }
  }

  if (needsUpdate && !CONFIG.DRY_RUN) {
    sheet.getRange(1, CONFIG.COL.SENT_MINUS2 + 1, updatesMinus2.length, 1).setValues(updatesMinus2);
    sheet.getRange(1, CONFIG.COL.SENT_0 + 1, updates0.length, 1).setValues(updates0);
    sheet.getRange(1, CONFIG.COL.SENT_PLUS3 + 1, updatesPlus3.length, 1).setValues(updatesPlus3);
  }
}

function sendMail_(email, znak, opis, date, isFinal) {
  const subject = (isFinal ? "Termin zdjęcia plakatów – DZIŚ" : "Przypomnienie o zdjęciu plakatów") + (znak ? ` – ${znak}` : "");
  const formatted = Utilities.formatDate(date, "Europe/Warsaw", "dd.MM.yyyy");

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
    <p>Dzień dobry,</p>
    <p>zgodnie z udzieloną zgodą z podania zarejestrowanego pod znakiem:<br/>
    <span style="font-size: 15px;"><b>${escapeHtml_(znak || "—")}</b></span></p>
    <p><b>Termin realizacji (zdjęcia plakatów):</b> ${formatted}</p>
    <p style="color:#555;">Prosimy o informację zwrotną po zdjęciu plakatów.</p>
    <p><i>~ Administracja Samorządu Studentów UEW</i></p>
  </div>`;

  if (CONFIG.DRY_RUN) return console.log(`[DRY RUN] Mail -> ${email}`);
  try { GmailApp.sendEmail(email, subject, "Wiadomość HTML", { htmlBody: html }); } catch (e) {}
}

function sendEscalationMail_(email, znak, opis, org) {
  const subject = `PILNE: Ostateczne wezwanie do usunięcia plakatów – ${znak}`;

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #dc3545; padding: 20px;">
    <h2 style="color: #dc3545; margin-top: 0;">OSTATECZNE WEZWANIE O PORZĄDKOWANIE</h2>
    <p>Dzień dobry,</p>
    <p>odnotowaliśmy <strong>niedopełnienie obowiązku usunięcia plakatów</strong> w wyznaczonym terminie dla zgody:<br/>
    <b>${escapeHtml_(znak || "—")}</b> (Organizacja: ${escapeHtml_(org || "—")})</p>
    <p style="color: #dc3545;"><strong>Prosimy o natychmiastowe usunięcie materiałów promocyjnych.</strong></p>
    <p>Brak reakcji w ciągu 24 godzin może skutkować <b>skierowaniem sprawy do Działu Zarządzania Nieruchomościami</b> oraz nałożeniem zakazu plakatowania na Państwa organizację na okres 1 miesięca.</p>
    <br>
    <p><i>~ Administracja Samorządu Studentów UEW</i></p>
  </div>`;

  if (CONFIG.DRY_RUN) return console.log(`[DRY RUN] ESKALACJA -> ${email}`);
  try {
    GmailApp.sendEmail(email, subject, "Wiadomość HTML", {
      htmlBody: html,
      cc: CONFIG.ADMIN_EMAIL
    });
  } catch (e) {}
}


// ==========================================
// 1B. MODUŁ PRZYPOMNIEŃ I ESKALACJI - BANERY (bez zmian)
// ==========================================
function sendRemindersBanery_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG_BANERY.SHEET_NAME);
  if (!sheet) return;

  const range = sheet.getDataRange();
  const data = range.getValues();
  const today = startOfDay_(new Date());

  const updatesMinus2 = data.map(row => [row[CONFIG_BANERY.COL.SENT_MINUS2]]);
  const updates0 = data.map(row => [row[CONFIG_BANERY.COL.SENT_0]]);
  const updatesPlus1 = data.map(row => [row[CONFIG_BANERY.COL.SENT_PLUS1]]);
  let needsUpdate = false;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];

    const email = String(row[CONFIG_BANERY.COL.EMAIL] || "").trim();
    if (!email) continue;

    const status = getStatus_(row, CONFIG_BANERY);
    if (status !== "AKTYWNE") continue;

    const removalDate = toDate_(row[CONFIG_BANERY.COL.DATA_ZDJECIA]);
    if (!removalDate) continue;

    const diffDays = daysDiff_(today, startOfDay_(removalDate));

    const znak = String(row[CONFIG_BANERY.COL.ZNAK] || "").trim();
    const lok = String(row[CONFIG_BANERY.COL.LOKALIZACJA] || "").trim();
    const org = String(row[CONFIG_BANERY.COL.ORG] || "").trim();

    const sentMinus2 = String(row[CONFIG_BANERY.COL.SENT_MINUS2] || "").trim().toUpperCase();
    const sent0 = String(row[CONFIG_BANERY.COL.SENT_0] || "").trim().toUpperCase();
    const sentPlus1 = String(row[CONFIG_BANERY.COL.SENT_PLUS1] || "").trim().toUpperCase();

    if (diffDays === 2 && sentMinus2 !== "TAK") {
      sendMailBanery_(email, znak, lok, removalDate, false);
      updatesMinus2[r][0] = "TAK";
      needsUpdate = true;
    }

    if (diffDays === 0 && sent0 !== "TAK") {
      sendMailBanery_(email, znak, lok, removalDate, true);
      updates0[r][0] = "TAK";
      needsUpdate = true;
    }

    if (diffDays <= -1 && sentPlus1 !== "TAK") {
      sendEscalationMailBanery_(email, znak, lok, org);
      updatesPlus1[r][0] = "TAK";
      needsUpdate = true;
    }
  }

  if (needsUpdate && !CONFIG.DRY_RUN) {
    sheet.getRange(1, CONFIG_BANERY.COL.SENT_MINUS2 + 1, updatesMinus2.length, 1).setValues(updatesMinus2);
    sheet.getRange(1, CONFIG_BANERY.COL.SENT_0 + 1, updates0.length, 1).setValues(updates0);
    sheet.getRange(1, CONFIG_BANERY.COL.SENT_PLUS1 + 1, updatesPlus1.length, 1).setValues(updatesPlus1);
  }
}

function sendMailBanery_(email, znak, lok, date, isFinal) {
  const subject = (isFinal ? "Termin demontażu baneru – DZIŚ" : "Przypomnienie o demontażu baneru") + (znak ? ` – ${znak}` : "");
  const formatted = Utilities.formatDate(date, "Europe/Warsaw", "dd.MM.yyyy");

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
    <p>Dzień dobry,</p>
    <p>zgodnie z udzieloną zgodą z podania zarejestrowanego pod znakiem:<br/>
    <span style="font-size: 15px;"><b>${escapeHtml_(znak || "—")}</b></span></p>
    <p><b>Lokalizacja baneru:</b> ${escapeHtml_(lok || "Brak danych")}</p>
    <p><b>Termin demontażu:</b> ${formatted}</p>

    <div style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0;">
      <strong>⚠️ ZASADY DEMONTAŻU I WERYFIKACJI:</strong>
      <ul style="margin-top: 5px; margin-bottom: 5px;">
        <li>Należy bezwzględnie usunąć wszystkie elementy mocujące (opaski zaciskowe, sznurki).</li>
        <li>Infrastruktura Uczelni musi pozostać w stanie nienaruszonym.</li>
        <li><b>Wymagane jest przesłanie zdjęcia pustego miejsca po demontażu w odpowiedzi na tę wiadomość.</b></li>
      </ul>
    </div>

    <p>Dopiero po otrzymaniu dowodu zdjęciowego status Państwa zgody zostanie zmieniony na zamknięty w rejestrze.</p>
    <p><i>~ Administracja Samorządu Studentów UEW</i></p>
  </div>`;

  if (CONFIG.DRY_RUN) return console.log(`[DRY RUN BANERY] Mail -> ${email}`);
  try { GmailApp.sendEmail(email, subject, "Wiadomość HTML", { htmlBody: html }); } catch (e) {}
}

function sendEscalationMailBanery_(email, znak, lok, org) {
  const subject = `PILNE: Ostateczne wezwanie do usunięcia BANERU – ${znak}`;

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #dc3545; padding: 20px;">
    <h2 style="color: #dc3545; margin-top: 0;">OSTATECZNE WEZWANIE O PORZĄDKOWANIE TERENU</h2>
    <p>Dzień dobry,</p>
    <p>odnotowaliśmy <strong>niedopełnienie obowiązku demontażu baneru</strong> w wyznaczonym terminie dla zgody:<br/>
    <b>${escapeHtml_(znak || "—")}</b> (Organizacja: ${escapeHtml_(org || "—")})</p>
    <p><b>Lokalizacja:</b> ${escapeHtml_(lok || "—")}</p>

    <p style="color: #dc3545;"><strong>Prosimy o natychmiastowe usunięcie materiałów oraz przesłanie zdjęcia dowodowego.</strong></p>
    <p>Ze względu na gabaryty materiału i dbałość o estetykę Kampusu, brak reakcji do końca dnia roboczego będzie skutkował natychmiastowym skierowaniem sprawy do Działu Zarządzania Nieruchomościami oraz nałożeniem zakazu promocyjnego.</p>
    <br>
    <p><i>~ Administracja Samorządu Studentów UEW</i></p>
  </div>`;

  if (CONFIG.DRY_RUN) return console.log(`[DRY RUN BANERY] ESKALACJA -> ${email}`);
  try {
    GmailApp.sendEmail(email, subject, "Wiadomość HTML", {
      htmlBody: html,
      cc: CONFIG.ADMIN_EMAIL
    });
  } catch (e) {}
}

// ==========================================
// 2. MODUŁ AUDYTU DLA KANCLERZA (bez zmian)
// ==========================================
function generujAudytMiesieczny() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPlakaty = ss.getSheetByName(CONFIG.SHEET_NAME);
  const sheetBanery = ss.getSheetByName(CONFIG_BANERY.SHEET_NAME);

  if (!sheetPlakaty) return SpreadsheetApp.getUi().alert("Brak arkusza plakatów!");

  const dataPlakaty = sheetPlakaty.getDataRange().getValues();
  let statsP = { total: 0, aktywne: 0, zdjete: 0, eskalacje: 0 };

  for (let r = 1; r < dataPlakaty.length; r++) {
    const row = dataPlakaty[r];
    if (!String(row[CONFIG.COL.EMAIL] || "").trim()) continue;

    statsP.total++;
    const status = getStatus_(row, CONFIG);
    if (status === "AKTYWNE") statsP.aktywne++;
    else if (status === "ZDJĘTE" || status === "ZDJETE") statsP.zdjete++;

    if (String(row[CONFIG.COL.SENT_PLUS3] || "").trim().toUpperCase() === "TAK") statsP.eskalacje++;
  }

  let statsB = { total: 0, aktywne: 0, zdjete: 0, eskalacje: 0 };
  if (sheetBanery) {
    const dataBanery = sheetBanery.getDataRange().getValues();
    for (let r = 1; r < dataBanery.length; r++) {
      const row = dataBanery[r];
      if (!String(row[CONFIG_BANERY.COL.EMAIL] || "").trim()) continue;

      statsB.total++;
      const status = getStatus_(row, CONFIG_BANERY);
      if (status === "AKTYWNE") statsB.aktywne++;
      else if (status === "ZDJĘTE" || status === "ZDJETE") statsB.zdjete++;

      if (String(row[CONFIG_BANERY.COL.SENT_PLUS1] || "").trim().toUpperCase() === "TAK") statsB.eskalacje++;
    }
  }

  const subject = `Raport z nadzoru nad materiałami promocyjnymi na UEW – ${Utilities.formatDate(new Date(), "Europe/Warsaw", "MM.yyyy")}`;

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
    <p>Szanowny Panie Kanclerzu,</p>
    <p>przekazuję comiesięczne podsumowanie nadzoru nad procedurą umieszczania materiałów promocyjnych (plakatów i banerów) na terenie Uczelni, prowadzoną przez Samorząd Studentów.</p>

    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0;">
      <div style="flex: 1; min-width: 250px; background-color: #f4f6f9; border-left: 5px solid #002e6d; padding: 15px;">
        <h3 style="margin-top: 0; color: #002e6d;">Rejestr Plakatów:</h3>
        <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>Zaopiniowane podania: <strong>${statsP.total}</strong></li>
          <li>Plakaty zdjęte zgodnie z terminem: <strong style="color: green;">${statsP.zdjete}</strong></li>
          <li>Aktualnie trwające ekspozycje: <strong>${statsP.aktywne}</strong></li>
          <li>Interwencje (przekroczenie terminu): <strong style="color: ${statsP.eskalacje > 0 ? 'red' : 'green'};">${statsP.eskalacje}</strong></li>
        </ul>
      </div>

      <div style="flex: 1; min-width: 250px; background-color: #fdfaf2; border-left: 5px solid #ffc107; padding: 15px;">
        <h3 style="margin-top: 0; color: #856404;">Rejestr Banerów:</h3>
        <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>Zaopiniowane podania: <strong>${statsB.total}</strong></li>
          <li>Demontaże zweryfikowane zdjęciem: <strong style="color: green;">${statsB.zdjete}</strong></li>
          <li>Aktualnie wiszące banery: <strong>${statsB.aktywne}</strong></li>
          <li>Pilne interwencje usunięcia: <strong style="color: ${statsB.eskalacje > 0 ? 'red' : 'green'};">${statsB.eskalacje}</strong></li>
        </ul>
      </div>
    </div>

    <p>Wszystkie pozytywnie opiniowane wnioski obwarowane są ścisłymi obowiązkami przygotowania materiałów oraz zachowania bezpieczeństwa i estetyki po demontażu. Dla banerów prowadzimy <b>zdjęciową procedurę weryfikacji porządku</b>.</p>
    <p>Procedura eskalacyjna i monitoring terminowości pomagają utrzymać estetykę naszego Kampusu w należytym porządku.</p>

    <p>Z wyrazami szacunku,<br>
    <i>Mikołaj Radliński</i></p>
  </div>`;

  if (!CONFIG.DRY_RUN) {
    GmailApp.sendEmail(CONFIG.KANCLERZ_EMAIL, subject, "Raport HTML", { htmlBody: html });
    SpreadsheetApp.getUi().alert(`Wysłano połączony raport do: ${CONFIG.KANCLERZ_EMAIL}`);
  } else {
    SpreadsheetApp.getUi().alert(`[DRY RUN] Raport wygenerowany. Nie wysłano z powodu trybu testowego.`);
  }
}

// ==========================================
// HELPERS (bez zmian)
// ==========================================
function findSheet(ss, name) { return ss.getSheets().find(s => s.getName().toLowerCase().trim() === name.toLowerCase().trim()); }

function toPercent(val) { if (val === "" || val == null) return "50%"; if (typeof val === 'number') return (val <= 1 ? val * 100 : val) + "%"; let s = String(val).trim(); return s.includes("%") || s.includes("px") ? s : s + "%"; }

function jsonResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }

function getStatus_(row, conf) {
  const sys = row.length > conf.COL.STATUS_SYSTEM ? String(row[conf.COL.STATUS_SYSTEM] || "").trim() : "";
  return (sys || String(row[conf.COL.STATUS_RECZNY] || "")).trim().toUpperCase();
}

function escapeHtml_(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, "<br/>");
}

function toDate_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000));
  const d = new Date(v); return isNaN(d) ? null : d;
}

function startOfDay_(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

function daysDiff_(d1, d2) {
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
