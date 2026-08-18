# Baby Survey

A responsive prenatal and postnatal protection survey based on the supplied paper-form reference. Illustration areas are intentionally left as styled placeholders so artwork can be inserted later.

## Data flow

```text
React survey → POST /api/submit-lead → Cloudflare Pages Function
             → Google Apps Script Web App → Google Sheet
```

The Apps Script URL remains a server-side Cloudflare secret and is never exposed to the browser.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
npm test
npm run build
```

Vite serves the form locally. A complete submission requires the Pages Function environment (for example, Cloudflare Wrangler) and the webhook binding.

## Google Sheet setup

Create a tab named exactly `Baby Survey Responses`. Put these exact headers in row 1, in order:

1. Full Name
2. Contact Number
3. Last 4 Digits of IC
4. Age
5. Occupation
6. Current Stage
7. Current Week of Pregnancy
8. Expected Due Date
9. Baby's Age
10. Number of Children
11. Parental Protection Check
12. Main Concerns
13. Existing Insurance Coverage
14. Current Insurance Company
15. Previous Insurance Agent Satisfaction
16. Presentation Done
17. Potential Follow Up
18. On the Spot Close Case
19. ANP
20. Gave out Gifts?
21. Remarks
22. Submission Timestamp
23. Submission ID
24. Email Sent Timestamp

## Google Apps Script setup

1. Open the response spreadsheet and choose **Extensions → Apps Script**.
2. Replace the editor contents with [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. Choose **Deploy → New deployment → Web app**.
4. Run as the deploying account and select the access level appropriate for public form submissions.
5. Copy the deployed `/exec` URL.

The script generates the submission timestamp on the server using the spreadsheet's `Asia/Kuala_Lumpur` timezone. It also verifies every header, protects against formula injection, preserves the contact number and IC digits as text, and uses a script-wide lock for concurrent submissions. Deploy a new Apps Script version whenever `Code.gs` changes.

## Agent email reports

After the main form's first Submit button is pressed, a popup collects Agent Name, Agent ID, Agent Email, GM Name, and follow-up questions. ANP (Annual Premium) appears and becomes required only when On the Spot Close Case is Yes. Gave out Gifts? is required; Remarks is optional. The agent details route the lead email but are not stored in the 24-column response sheet. Immediately after saving a response, Apps Script sends that lead to the supplied agent email and records the email-sent timestamp.

After installing `Code.gs`, run `authorizeMailSending` once in the Apps Script editor and approve the requested mail permission.

Email sending uses the deploying Google account's Apps Script daily recipient quota.

## Cloudflare Pages setup

1. Connect this repository to Cloudflare Pages.
2. Set build command to `npm run build` and output directory to `dist`.
3. Add an encrypted environment variable named `GOOGLE_SHEETS_WEBHOOK_URL` containing the Apps Script `/exec` URL.
4. Deploy or redeploy the Pages project.

Do not prefix the secret with `VITE_` and do not commit the real URL.
