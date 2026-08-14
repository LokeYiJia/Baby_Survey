var SHEET_NAME = "Baby Survey Responses";
var SCRIPT_BUILD = "2026-08-14-baby-fair-direct-agent-email-v1";

var EXPECTED_HEADERS = [
  "Full Name",
  "Contact Number",
  "Last 4 Digits of IC",
  "Age",
  "Occupation",
  "Current Stage",
  "Current Week of Pregnancy",
  "Expected Due Date",
  "Baby's Age",
  "Number of Children",
  "Parental Protection Check",
  "Main Concerns",
  "Existing Insurance Coverage",
  "Current Insurance Company",
  "Previous Insurance Agent Satisfaction",
  "Presentation Done",
  "Potential Follow Up",
  "On the Spot Close Case",
  "ANP",
  "Submission Timestamp",
  "Submission ID",
  "Email Sent Timestamp"
];

function authorizeMailSending() {
  Logger.log("Remaining daily recipient quota: " + MailApp.getRemainingDailyQuota());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Missing request body.");
    var data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid payload.");

    lock.waitLock(30000);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    spreadsheet.setSpreadsheetTimeZone("Asia/Kuala_Lumpur");
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Sheet tab not found: " + SHEET_NAME);
    verifyHeaders_(sheet);

    var submittedAt = new Date();
    var submissionId = Utilities.getUuid();
    var row = [
      safeCell_(data.fullName),
      forcedTextCell_(data.contactNumber),
      forcedTextCell_(data.icLast4),
      safeCell_(data.ageBand),
      safeCell_(data.occupation),
      safeCell_(data.currentStage),
      safeCell_(data.pregnancyWeek),
      safeCell_(data.expectedDueDate),
      safeCell_(data.babyAge),
      safeCell_(data.numberOfChildren),
      safeCell_(data.prenatalPreparedness),
      safeCell_(data.mainConcerns),
      safeCell_(data.existingCoverage),
      safeCell_(data.currentInsurer),
      safeCell_(data.agentSatisfaction),
      safeCell_(data.presentationDone),
      safeCell_(data.potentialFollowUp),
      safeCell_(data.onTheSpotCloseCase),
      safeCell_(data.anp),
      submittedAt,
      submissionId,
      ""
    ];

    var targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 2, 1, 2).setNumberFormat("@");
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    sheet.getRange(targetRow, 2, 1, 2).setNumberFormat("@");
    sheet.getRange(targetRow, 20).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    SpreadsheetApp.flush();

    // The popup agent fields are used for routing but are intentionally not
    // stored because the requested response sheet contains only survey,
    // outcome, and delivery-tracking columns.
    sendAgentEmail_(data, submittedAt);
    sheet.getRange(targetRow, 22).setValue(new Date()).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    SpreadsheetApp.flush();
    return jsonResponse_({ success: true, submissionId: submissionId });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({ success: false, error: "[" + SCRIPT_BUILD + "] " + (error && error.message ? error.message : "Unable to process survey.") });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function sendAgentEmail_(data, submittedAt) {
  var agentEmail = data.agentEmail == null ? "" : String(data.agentEmail).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentEmail)) throw new Error("Invalid Agent Email.");
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error("The daily agent email quota has been reached.");

  var fields = [
    ["Full Name", data.fullName],
    ["Contact Number", data.contactNumber],
    ["Last 4 Digits of IC", data.icLast4],
    ["Age", data.ageBand],
    ["Occupation", data.occupation],
    ["Current Stage", data.currentStage],
    ["Current Week of Pregnancy", data.pregnancyWeek],
    ["Expected Due Date", data.expectedDueDate],
    ["Baby's Age", data.babyAge],
    ["Number of Children", data.numberOfChildren],
    ["Parental Protection Check", data.prenatalPreparedness],
    ["Main Concerns", data.mainConcerns],
    ["Existing Insurance Coverage", data.existingCoverage],
    ["Current Insurance Company", data.currentInsurer],
    ["Previous Insurance Agent Satisfaction", data.agentSatisfaction],
    ["Presentation Done", data.presentationDone],
    ["Potential Follow Up", data.potentialFollowUp],
    ["On the Spot Close Case", data.onTheSpotCloseCase],
    ["ANP", data.anp],
    ["Submission Timestamp", Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")],
    ["Agent Name", data.agentName],
    ["Agent ID", data.agentId],
    ["GM Name", data.gmName]
  ];

  var text = ["Hello " + plainTextCell_(data.agentName) + ",", "", "A new Baby Fair lead has been assigned to you.", ""];
  var htmlRows = fields.map(function (field) {
    text.push(field[0] + ": " + plainTextCell_(field[1]));
    return "<tr><th style=\"padding:7px 10px;text-align:left;vertical-align:top;background:#fff1f2;border:1px solid #ead9dc;width:230px\">" + escapeHtml_(field[0]) + "</th><td style=\"padding:7px 10px;border:1px solid #ead9dc\">" + escapeHtml_(field[1]) + "</td></tr>";
  }).join("");

  MailApp.sendEmail({
    to: agentEmail,
    subject: "New Baby Fair Lead - " + plainTextCell_(data.fullName),
    body: text.join("\n"),
    htmlBody: "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#172033\"><h2 style=\"color:#d83236\">New Baby Fair Lead</h2><p>Hello " + escapeHtml_(data.agentName) + ",</p><p>A new Baby Fair lead has been assigned to you.</p><table style=\"border-collapse:collapse;width:100%;max-width:850px\">" + htmlRows + "</table></div>",
    name: "Baby Fair Survey"
  });
}

function verifyHeaders_(sheet) {
  var headers = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).getDisplayValues()[0];
  var mismatches = [];
  EXPECTED_HEADERS.forEach(function (expected, index) {
    if (headers[index] !== expected) mismatches.push("Column " + (index + 1) + ': expected "' + expected + '", found "' + (headers[index] || "(blank)") + '"');
  });
  if (mismatches.length) throw new Error("Sheet header mismatch. " + mismatches.join("; "));
}

function plainTextCell_(value) { return String(value == null ? "" : value).replace(/[\t\r\n]+/g, " "); }
function escapeHtml_(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function safeCell_(value) { var text = value == null ? "" : String(value); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function forcedTextCell_(value) { var text = value == null ? "" : String(value); return text === "" ? "" : "'" + text; }
function jsonResponse_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
