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

1. Date
2. Full Name
3. Contact Number
4. Last 4 Digits of IC
5. Age
6. Occupation
7. Current Stage
8. Current Week of Pregnancy
9. Expected Due Date
10. Baby's Age
11. Number of Children
12. Prenatal Protection Check
13. Main Concerns
14. Existing Insurance Coverage
15. Current Insurance Company
16. Previous Agent Satisfaction

## Google Apps Script setup

1. Open the response spreadsheet and choose **Extensions → Apps Script**.
2. Replace the editor contents with [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. Choose **Deploy → New deployment → Web app**.
4. Run as the deploying account and select the access level appropriate for public form submissions.
5. Copy the deployed `/exec` URL.

The script verifies every header, protects against formula injection, preserves the contact number and IC digits as text, and uses a script-wide lock for concurrent submissions. Deploy a new Apps Script version whenever `Code.gs` changes.

## Cloudflare Pages setup

1. Connect this repository to Cloudflare Pages.
2. Set build command to `npm run build` and output directory to `dist`.
3. Add an encrypted environment variable named `GOOGLE_SHEETS_WEBHOOK_URL` containing the Apps Script `/exec` URL.
4. Deploy or redeploy the Pages project.

Do not prefix the secret with `VITE_` and do not commit the real URL.
