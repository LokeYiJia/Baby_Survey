var SHEET_NAME = "Baby Survey Responses";
var EXPECTED_HEADERS = [
  "Date", "Full Name", "Contact Number", "Last 4 Digits of IC", "Age", "Occupation",
  "Current Stage", "Current Week of Pregnancy", "Expected Due Date", "Baby's Age",
  "Number of Children", "Prenatal Protection Check", "Main Concerns",
  "Existing Insurance Coverage", "Current Insurance Company", "Previous Agent Satisfaction"
];

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function safeCell_(value) {
  var text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function forcedTextCell_(value) {
  var text = value === null || value === undefined ? "" : String(value);
  return text === "" ? "" : "'" + text;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Missing request body.");
    var data = JSON.parse(e.postData.contents);
    lock.waitLock(30000);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    spreadsheet.setSpreadsheetTimeZone("Asia/Kuala_Lumpur");
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Sheet tab not found: " + SHEET_NAME);
    var headers = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).getDisplayValues()[0];
    for (var i = 0; i < EXPECTED_HEADERS.length; i++) {
      if (headers[i] !== EXPECTED_HEADERS[i]) throw new Error('Header mismatch in column ' + (i + 1) + '. Expected "' + EXPECTED_HEADERS[i] + '", found "' + headers[i] + '".');
    }
    var row = [
      safeCell_(data.date), safeCell_(data.fullName), forcedTextCell_(data.contactNumber), forcedTextCell_(data.icLast4),
      safeCell_(data.ageBand), safeCell_(data.occupation), safeCell_(data.currentStage), safeCell_(data.pregnancyWeek),
      safeCell_(data.expectedDueDate), safeCell_(data.babyAge), safeCell_(data.numberOfChildren),
      safeCell_(data.prenatalPreparedness), safeCell_(data.mainConcerns), safeCell_(data.existingCoverage),
      safeCell_(data.currentInsurer), safeCell_(data.agentSatisfaction)
    ];
    var targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 3, 1, 2).setNumberFormat("@");
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    sheet.getRange(targetRow, 3, 1, 2).setNumberFormat("@");
    SpreadsheetApp.flush();
    return jsonResponse_({ success: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({ success: false, error: error && error.message ? error.message : "Unable to append survey." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
