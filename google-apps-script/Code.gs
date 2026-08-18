var SHEET_NAME = "Baby Survey Responses";
var SCRIPT_BUILD = "2026-08-18-baby-fair-agent-report-v2";
var ROUTING_KEY_PREFIX = "BABY_FAIR_AGENT_";

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
  "Gave out Gifts?",
  "Gift Details",
  "Remarks",
  "Submission Timestamp",
  "Submission ID",
  "Email Sent Timestamp"
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Agent Reports")
    .addItem("Send unsent Baby Fair reports", "sendAgentReports")
    .addToUi();
}

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
      safeCell_(data.gaveOutGifts),
      safeCell_(data.giftDetails),
      safeCell_(data.remarks),
      submittedAt,
      submissionId,
      ""
    ];

    var targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 2).setNumberFormat("@");
    sheet.getRange(targetRow, 3).setNumberFormat("@");
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    sheet.getRange(targetRow, 2).setNumberFormat("@");
    sheet.getRange(targetRow, 3).setNumberFormat("@");
    sheet.getRange(targetRow, 23).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    SpreadsheetApp.flush();

    // Keep agent routing private so the response sheet retains exactly the
    // requested 25 columns. The report sender retrieves it by Submission ID.
    PropertiesService.getDocumentProperties().setProperty(
      ROUTING_KEY_PREFIX + submissionId,
      JSON.stringify({
        agentName: safeProperty_(data.agentName),
        agentId: safeProperty_(data.agentId),
        agentEmail: safeProperty_(data.agentEmail).toLowerCase(),
        gmName: safeProperty_(data.gmName)
      })
    );
    return jsonResponse_({ success: true, submissionId: submissionId });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({ success: false, error: "[" + SCRIPT_BUILD + "] " + (error && error.message ? error.message : "Unable to process survey.") });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function sendAgentReports() {
  var ui = SpreadsheetApp.getUi();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Sheet tab not found: " + SHEET_NAME);
    verifyHeaders_(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      ui.alert("Baby Fair Agent Reports", "There are no submissions to send.", ui.ButtonSet.OK);
      return;
    }

    var properties = PropertiesService.getDocumentProperties();
    var rows = sheet.getRange(2, 1, lastRow - 1, EXPECTED_HEADERS.length).getDisplayValues();
    var groups = {};
    var missingRouting = 0;
    var invalidEmail = 0;
    rows.forEach(function (values, index) {
      if (values[24].trim() !== "") return;
      var submissionId = values[23].trim();
      var rawRouting = properties.getProperty(ROUTING_KEY_PREFIX + submissionId);
      if (!rawRouting) { missingRouting++; return; }
      var routing;
      try { routing = JSON.parse(rawRouting); } catch (error) { missingRouting++; return; }
      var email = String(routing.agentEmail || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { invalidEmail++; return; }
      if (!groups[email]) groups[email] = [];
      groups[email].push({ rowNumber: index + 2, values: values, routing: routing, submissionId: submissionId });
    });

    var recipients = Object.keys(groups);
    if (!recipients.length) {
      ui.alert("Baby Fair Agent Reports", "No unsent submissions with valid agent routing were found." + skippedMessage_(missingRouting, invalidEmail), ui.ButtonSet.OK);
      return;
    }
    var quota = MailApp.getRemainingDailyQuota();
    if (quota < recipients.length) throw new Error("Not enough email quota. " + recipients.length + " agent reports are ready, but only " + quota + " recipients remain today.");

    var sentAt = new Date();
    var totalLeads = 0;
    recipients.forEach(function (email) {
      var leads = groups[email];
      var report = buildAgentReport_(email, leads);
      MailApp.sendEmail({
        to: email,
        subject: "Baby Fair Lead Report - " + leads.length + (leads.length === 1 ? " lead" : " leads"),
        body: report.text,
        htmlBody: report.html,
        name: "Baby Fair Survey"
      });
      leads.forEach(function (lead) {
        sheet.getRange(lead.rowNumber, 25).setValue(sentAt).setNumberFormat("yyyy-mm-dd hh:mm:ss");
        properties.deleteProperty(ROUTING_KEY_PREFIX + lead.submissionId);
      });
      totalLeads += leads.length;
    });
    SpreadsheetApp.flush();
    ui.alert("Baby Fair Agent Reports Sent", "Sent " + recipients.length + " agent email(s) containing " + totalLeads + " lead(s)." + skippedMessage_(missingRouting, invalidEmail), ui.ButtonSet.OK);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    ui.alert("Baby Fair Agent Reports Failed", error && error.message ? error.message : "Unable to send reports.", ui.ButtonSet.OK);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function buildAgentReport_(agentEmail, leads) {
  var generatedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var reportHeaders = EXPECTED_HEADERS.slice(0, 23);
  var text = ["Hello " + plainTextCell_(leads[0].routing.agentName) + ",", "", "Here are " + leads.length + (leads.length === 1 ? " Baby Fair lead" : " Baby Fair leads") + " assigned to " + agentEmail + ".", ""];
  var cards = leads.map(function (lead, leadIndex) {
    text.push("Lead " + (leadIndex + 1));
    var rows = reportHeaders.map(function (header, index) {
      var value = lead.values[index];
      text.push(header + ": " + plainTextCell_(value));
      return "<tr><th style=\"padding:6px 10px;text-align:left;vertical-align:top;background:#fff1f2;border:1px solid #ead9dc;width:230px\">" + escapeHtml_(header) + "</th><td style=\"padding:6px 10px;border:1px solid #ead9dc\">" + escapeHtml_(value) + "</td></tr>";
    }).join("");
    [["Agent Name", lead.routing.agentName], ["Agent ID", lead.routing.agentId], ["GM Name", lead.routing.gmName]].forEach(function (field) {
      text.push(field[0] + ": " + plainTextCell_(field[1]));
      rows += "<tr><th style=\"padding:6px 10px;text-align:left;background:#fff1f2;border:1px solid #ead9dc\">" + escapeHtml_(field[0]) + "</th><td style=\"padding:6px 10px;border:1px solid #ead9dc\">" + escapeHtml_(field[1]) + "</td></tr>";
    });
    text.push("");
    return "<h3 style=\"color:#d83236;margin:24px 0 8px\">Lead " + (leadIndex + 1) + "</h3><table style=\"border-collapse:collapse;width:100%;max-width:850px\">" + rows + "</table>";
  }).join("");
  text.push("Report generated: " + generatedAt);
  return {
    text: text.join("\n"),
    html: "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#172033\"><h2 style=\"color:#d83236\">Baby Fair Lead Report</h2><p>Here are <strong>" + leads.length + (leads.length === 1 ? " lead" : " leads") + "</strong> assigned to " + escapeHtml_(agentEmail) + ".</p>" + cards + "<p style=\"margin-top:24px;color:#687083\">Report generated: " + escapeHtml_(generatedAt) + "</p></div>"
  };
}

function skippedMessage_(missingRouting, invalidEmail) {
  var messages = [];
  if (missingRouting) messages.push(missingRouting + " row(s) missing private agent routing");
  if (invalidEmail) messages.push(invalidEmail + " row(s) with invalid agent email");
  return messages.length ? "\n\n" + messages.join("; ") + "." : "";
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
function safeProperty_(value) { return String(value == null ? "" : value).trim(); }
function escapeHtml_(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function safeCell_(value) { var text = value == null ? "" : String(value); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function forcedTextCell_(value) { var text = value == null ? "" : String(value); return text === "" ? "" : "'" + text; }
function jsonResponse_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
