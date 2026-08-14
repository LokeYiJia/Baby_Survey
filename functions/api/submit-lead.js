const MAX_BODY_BYTES = 32_768;
const AGE_BANDS = ["Below 25", "25–30", "31–35", "36–40", "Above 40"];
const STAGES = ["Planning for pregnancy", "Currently pregnant", "Postnatal / newborn stage"];
const CHILD_COUNTS = ["0 (First child on the way / planning)", "1", "2", "3 or more"];
const PRENATAL_ITEMS = ["Pregnancy complications coverage", "Baby medical card planning", "Critical illness protection for parents", "Income protection for parents", "Emergency cesarean section for early delivery"];
const CONCERNS = ["Pregnancy complications", "Baby hospitalization expenses", "Congenital illnesses / conditions", "NICU / premature baby expenses", "Loss of income after childbirth", "Rising medical inflation", "Child future education fund", "Family financial security"];
const COVERAGE_ITEMS = ["Medical card", "Life insurance", "Critical illness plan", "Investment / savings plan", "Baby insurance plan"];
const SATISFACTION = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"];

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const text = (value, field, required = false, max = 100) => { if (typeof value !== "string") throw new Error(`${field} must be text.`); const v = value.trim(); if (required && !v) throw new Error(`${field} is required.`); if (v.length > max) throw new Error(`${field} is too long.`); return v; };
const choice = (value, field, options) => { const v = text(value, field, true, 100); if (!options.includes(v)) throw new Error(`${field} is invalid.`); return v; };
const checklist = (value, field, options) => { if (!Array.isArray(value) || !value.length || value.length > options.length || value.some((v) => !options.includes(v)) || new Set(value).size !== value.length) throw new Error(`${field} is invalid.`); return value.join(", "); };
const matrix = (value, field, items) => { if (!value || Array.isArray(value) || typeof value !== "object" || items.some((item) => !["Yes", "No"].includes(value[item]))) throw new Error(`${field} is incomplete.`); return items.map((item) => `${item}: ${value[item]}`).join(" | "); };

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return json({ success: false, error: "Content-Type must be application/json." }, 415);
  let data;
  try { const body = await request.text(); if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return json({ success: false, error: "Request body is too large." }, 413); data = JSON.parse(body); if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("Request body must be an object."); }
  catch (error) { return json({ success: false, error: error.message || "Invalid JSON." }, 400); }
  try {
    const stage = choice(data.currentStage, "currentStage", STAGES);
    const phone = text(data.contactNumber, "contactNumber", true, 25); if (!/^[+\d()\s-]+$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, ""))) throw new Error("contactNumber is invalid.");
    const icLast4 = text(data.icLast4, "icLast4", true, 4); if (!/^\d{4}$/.test(icLast4)) throw new Error("icLast4 must contain exactly 4 digits.");
    const week = text(data.pregnancyWeek, "pregnancyWeek", false, 2); if (stage === "Currently pregnant" && (!/^\d{1,2}$/.test(week) || +week < 1 || +week > 45)) throw new Error("pregnancyWeek is invalid.");
    const due = text(data.expectedDueDate, "expectedDueDate", false, 10); if (stage === "Currently pregnant" && !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error("expectedDueDate is required.");
    const babyAge = text(data.babyAge, "babyAge", false, 50); if (stage === "Postnatal / newborn stage" && !babyAge) throw new Error("babyAge is required.");
    const agentName = text(data.agentName, "agentName", true, 100);
    const agentId = text(data.agentId, "agentId", true, 50);
    const agentEmail = text(data.agentEmail, "agentEmail", true, 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentEmail)) throw new Error("agentEmail is invalid.");
    const gmName = text(data.gmName, "gmName", true, 100);
    const presentationDone = choice(data.presentationDone, "presentationDone", ["Yes", "No"]);
    const potentialFollowUp = choice(data.potentialFollowUp, "potentialFollowUp", ["Yes", "No"]);
    const onTheSpotCloseCase = choice(data.onTheSpotCloseCase, "onTheSpotCloseCase", ["Yes", "No"]);
    const anp = text(data.anp, "anp", true, 50);
    if (data.consent !== true) throw new Error("consent must be true.");
    const payload = {
      fullName: text(data.fullName, "fullName", true), contactNumber: phone, icLast4,
      ageBand: choice(data.ageBand, "ageBand", AGE_BANDS), occupation: text(data.occupation, "occupation"), currentStage: stage,
      pregnancyWeek: week, expectedDueDate: due, babyAge, numberOfChildren: choice(data.numberOfChildren, "numberOfChildren", CHILD_COUNTS),
      prenatalPreparedness: matrix(data.prenatalPreparedness, "prenatalPreparedness", PRENATAL_ITEMS), mainConcerns: checklist(data.mainConcerns, "mainConcerns", CONCERNS),
      existingCoverage: matrix(data.existingCoverage, "existingCoverage", COVERAGE_ITEMS), currentInsurer: text(data.currentInsurer, "currentInsurer"),
      agentSatisfaction: choice(data.agentSatisfaction, "agentSatisfaction", SATISFACTION),
      presentationDone, potentialFollowUp, onTheSpotCloseCase, anp,
      agentName, agentId, agentEmail, gmName,
    };
    if (!env?.GOOGLE_SHEETS_WEBHOOK_URL) return json({ success: false, error: "Submission service is not configured." }, 500);
    let upstream; try { upstream = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch { return json({ success: false, error: "Unable to save the survey right now." }, 502); }
    const result = await upstream.json().catch(() => null); if (!upstream.ok || result?.success !== true) return json({ success: false, error: result?.error || "Unable to save the survey right now." }, 502);
    return json({ success: true });
  } catch (error) { return json({ success: false, error: error.message || "Invalid submission." }, 400); }
}
