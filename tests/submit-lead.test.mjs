import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/api/submit-lead.js";

const prenatalPreparedness = {
  "Pregnancy complications coverage": "Yes", "Baby medical card planning": "No",
  "Critical illness protection for parents": "Yes", "Income protection for parents": "No",
  "Emergency cesarean section for early delivery": "Yes",
};
const existingCoverage = { "Medical card": "Yes", "Life insurance": "Yes", "Critical illness plan": "No", "Investment / savings plan": "No", "Baby insurance plan": "No" };
const valid = () => ({ fullName: "Alex Tan", contactNumber: "0123456789", icLast4: "0123", ageBand: "25–30", occupation: "Designer", currentStage: "Currently pregnant", pregnancyWeek: "20", expectedDueDate: "2026-12-20", babyAge: "", numberOfChildren: "0 (First child on the way / planning)", prenatalPreparedness: { ...prenatalPreparedness }, mainConcerns: ["Baby hospitalization expenses"], existingCoverage: { ...existingCoverage }, currentInsurer: "Great Eastern", agentSatisfaction: "Satisfied", consent: true, presentationDone: "Yes", potentialFollowUp: "Yes", onTheSpotCloseCase: "No", anp: "", gaveOutGifts: "Yes", remarks: "Requested a follow-up call.", agentName: "Jamie Lim", agentId: "A123", agentEmail: "jamie@example.com", gmName: "Morgan Lee" });
const call = (payload = valid(), env = { GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.test/exec" }) => onRequest({ request: new Request("https://example.test/api/submit-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }), env });

test("accepts and forwards a valid survey", async (t) => {
  const originalFetch = globalThis.fetch; let forwarded;
  globalThis.fetch = async (_url, init) => { forwarded = JSON.parse(init.body); return new Response('{"success":true}', { headers: { "Content-Type": "application/json" } }); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const response = await call(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { success: true });
  assert.equal(forwarded.contactNumber, "0123456789"); assert.match(forwarded.prenatalPreparedness, /Pregnancy complications coverage: Yes/); assert.equal("consent" in forwarded, false);
  assert.equal(forwarded.agentEmail, "jamie@example.com");
});

test("rejects an invalid agent email", async () => {
  const payload = valid(); payload.agentEmail = "not-an-email";
  const response = await call(payload); assert.equal(response.status, 400); assert.match((await response.json()).error, /agentEmail/);
});

test("requires all follow-up outcomes", async () => {
  const payload = valid(); payload.presentationDone = "";
  const response = await call(payload); assert.equal(response.status, 400); assert.match((await response.json()).error, /presentationDone/);
});

test("requires ANP only for an on-the-spot close", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"success":true}', { headers: { "Content-Type": "application/json" } });
  t.after(() => { globalThis.fetch = originalFetch; });
  const closed = valid(); closed.onTheSpotCloseCase = "Yes"; closed.anp = "";
  assert.equal((await call(closed)).status, 400);
  const notClosed = valid(); notClosed.onTheSpotCloseCase = "No"; notClosed.anp = "ignored";
  const response = await call(notClosed); assert.equal(response.status, 200);
});

test("accepts sections 2 through 8 when left blank", async (t) => {
  const originalFetch = globalThis.fetch; let forwarded;
  globalThis.fetch = async (_url, init) => { forwarded = JSON.parse(init.body); return new Response('{"success":true}', { headers: { "Content-Type": "application/json" } }); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const payload = valid();
  Object.assign(payload, { currentStage: "", pregnancyWeek: "", expectedDueDate: "", babyAge: "", numberOfChildren: "", prenatalPreparedness: {}, mainConcerns: [], existingCoverage: {}, currentInsurer: "", agentSatisfaction: "" });
  const response = await call(payload); assert.equal(response.status, 200);
  assert.equal(forwarded.currentStage, ""); assert.equal(forwarded.prenatalPreparedness, ""); assert.equal(forwarded.mainConcerns, "");
});

test("does not expose the webhook when configuration is missing", async () => {
  const response = await call(valid(), {}); assert.equal(response.status, 500); const result = await response.json(); assert.equal(JSON.stringify(result).includes("script.google"), false);
});
