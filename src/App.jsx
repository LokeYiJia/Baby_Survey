import React, { useRef, useState } from "react";

const AGE_BANDS = ["Below 25", "25–30", "31–35", "36–40", "Above 40"];
const STAGES = ["Planning for pregnancy", "Currently pregnant", "Postnatal / newborn stage"];
const CHILD_COUNTS = ["0 (First child on the way / planning)", "1", "2", "3 or more"];
const PRENATAL_ITEMS = [
  "Pregnancy complications coverage", "Baby medical card planning",
  "Critical illness protection for parents", "Income protection for parents",
  "Emergency cesarean section for early delivery",
];
const CONCERNS = [
  "Pregnancy complications", "Baby hospitalization expenses",
  "Congenital illnesses / conditions", "NICU / premature baby expenses",
  "Loss of income after childbirth", "Rising medical inflation",
  "Child future education fund", "Family financial security",
];
const COVERAGE_ITEMS = [
  "Medical card", "Life insurance", "Critical illness plan",
  "Investment / savings plan", "Baby insurance plan",
];
const SATISFACTION = ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"];
const STAGE_IMAGES = {
  "Planning for pregnancy": "/stage-planning.png",
  "Currently pregnant": "/stage-pregnant.png",
  "Postnatal / newborn stage": "/stage-newborn.png",
};

const blankAnswers = (items) => Object.fromEntries(items.map((item) => [item, ""]));
const initialForm = {
  fullName: "", contactNumber: "", icLast4: "", ageBand: "", occupation: "",
  currentStage: "", pregnancyWeek: "", expectedDueDate: "", babyAge: "",
  numberOfChildren: "", prenatalPreparedness: blankAnswers(PRENATAL_ITEMS),
  mainConcerns: [], existingCoverage: blankAnswers(COVERAGE_ITEMS),
  currentInsurer: "", agentSatisfaction: "", consent: false,
};

function PictureSpace({ label }) {
  return <div className="picture-space" aria-label={`${label} picture placeholder`}><span>Picture space</span></div>;
}

function Card({ number, title, tone, children, picture }) {
  return (
    <section className={`card ${tone} section-${number}`}>
      <h2>
        {number === "1" && (
          <span className="section-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 21a7.5 7.5 0 0 1 15 0Z" />
            </svg>
          </span>
        )}
        {number === "2" && (
          <span className="section-icon baby-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12.3 4.7c1.6-.9 2-2.3 1.2-3.2-.8-.8-2.2-.3-2.8.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M5.2 10.2a7 7 0 0 1 13.6 0 2.5 2.5 0 0 1-.2 5A7 7 0 0 1 5.4 15a2.5 2.5 0 0 1-.2-4.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.2" cy="12.3" r="1" />
              <circle cx="14.8" cy="12.3" r="1" />
              <path d="M9.6 15.6c1.5 1.5 3.3 1.5 4.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        )}
        {number === "3" && (
          <span className="section-icon couple-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="7.5" cy="5.5" r="2.5" />
              <circle cx="16.5" cy="5.5" r="2.5" />
              <path d="M3.5 20v-8.2c0-1.8 1.5-3.3 3.3-3.3h1.4c1.8 0 3.3 1.5 3.3 3.3V20H9v-5.5H6V20Z" />
              <path d="m12.3 13.5 2.4-3.6a2.7 2.7 0 0 1 2.2-1.2h.3a2.7 2.7 0 0 1 2.4 1.5l2.1 4.3h-2.2V20H17v-5.5h-1.7l1.1-2.4-2.2 3.3Z" />
            </svg>
          </span>
        )}
        {number === "4" && (
          <span className="section-icon protection-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 2.5 20 6v5.5c0 5.1-3.4 8.5-8 10-4.6-1.5-8-4.9-8-10V6Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="m8.2 11.8 2.4 2.4 5.3-5.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        {number === "5" && (
          <span className="section-icon concerns-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 11.2c0-4.2 3.8-7.5 8.8-7.5s8.8 3.3 8.8 7.5-3.8 7.5-8.8 7.5c-1.1 0-2.2-.2-3.2-.5L4.2 21l1.2-4.2A7.2 7.2 0 0 1 3 11.2Z" />
              <circle cx="8.3" cy="11.2" r="1.15" fill="var(--tone)" />
              <circle cx="11.8" cy="11.2" r="1.15" fill="var(--tone)" />
              <circle cx="15.3" cy="11.2" r="1.15" fill="var(--tone)" />
            </svg>
          </span>
        )}
        {number === "6" && (
          <span className="section-icon coverage-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v14h16v-14A1.5 1.5 0 0 0 18.5 5H16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 3h6l1 4H8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 9.5 16 11v2.6c0 2.6-1.7 4.4-4 5.2-2.3-.8-4-2.6-4-5.2V11Z" />
              <path d="m10 13.8 1.3 1.3 2.8-2.8" fill="none" stroke="var(--tone)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        {number === "7" && (
          <span className="section-icon policy-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 2.5h10l4 4v15H5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M15 2.5v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 8.5 12 7l3 1.5v2.1c0 2.1-1.3 3.4-3 4.1-1.7-.7-3-2-3-4.1Z" />
              <path d="m10.7 10.5.9.9 1.8-1.8" fill="none" stroke="var(--tone)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 17h8M8 19.5h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
        {number === "8" && (
          <span className="section-icon satisfaction-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="10" cy="7" r="3.2" />
              <path d="M3.5 19.5v-3c0-3.2 2.6-5.7 5.7-5.7h1.6c2 0 3.7 1 4.7 2.4a5 5 0 0 0-1 6.3Z" />
              <circle cx="17.5" cy="16.5" r="5" fill="white" />
              <path d="M15.5 16.3c.5-.5 1-.5 1.4 0M18.2 16.3c.5-.5 1-.5 1.4 0M15.8 18c1 1 2.4 1 3.4 0" fill="none" stroke="var(--tone)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
        )}
        <b>{number}.</b> {title}
      </h2>
      <div className={picture ? "card-with-picture" : ""}>
        <div>{children}</div>
        {picture && (number === "5"
          ? <div className="card-picture"><img src="/main-concerns-bear.png" alt="Teddy bear" /></div>
          : <PictureSpace label={title} />)}
      </div>
    </section>
  );
}

function RadioGroup({ label, name, options, value, onChange, required = true, vertical = false }) {
  return (
    <fieldset><legend>{label}{required && " *"}</legend><div className={`choice-list${vertical ? " vertical" : ""}`}>
      {options.map((option) => <label className="choice" key={option}>
        <input type="radio" name={name} value={option} checked={value === option} onChange={onChange} required={required} />
        <span>{option}</span>
      </label>)}
    </div></fieldset>
  );
}

function StageSelector({ value, onChange }) {
  return <fieldset className="stage-selector"><legend>Current Stage (Please tick) *</legend><div className="stage-options">
    {STAGES.map((option) => <label className="stage-option" key={option}>
      <img src={STAGE_IMAGES[option]} alt="" aria-hidden="true" />
      <span className="stage-choice"><input className="square-radio" type="radio" name="currentStage" value={option} checked={value === option} onChange={onChange} required /><span>{option}</span></span>
    </label>)}
  </div></fieldset>;
}

function SatisfactionSelector({ value, onChange }) {
  return <fieldset className="satisfaction-selector"><legend>Are you satisfied with the service by your previous insurance agent? *</legend>
    <div className="satisfaction-options">{SATISFACTION.map((option) => <label key={option}>
      {option === "Very dissatisfied" && <span className="satisfaction-emoji very-dissatisfied" aria-hidden="true" />}
      {option === "Dissatisfied" && <img className="rating-emoji" src="/rating-dissatisfied.png" alt="" aria-hidden="true" />}
      {option === "Neutral" && <span className="satisfaction-emoji neutral" aria-hidden="true" />}
      {option === "Satisfied" && <span className="satisfaction-emoji satisfied" aria-hidden="true" />}
      {option === "Very satisfied" && <span className="satisfaction-emoji very-satisfied" aria-hidden="true" />}
      <span>{option}</span><input className="square-radio" type="radio" name="agentSatisfaction" value={option} checked={value === option} onChange={onChange} required />
    </label>)}</div>
  </fieldset>;
}

function YesNoGrid({ items, name, values, onChange }) {
  return <div className="matrix"><div className="matrix-head"><span>Have you prepared any of the following?</span><span>Yes</span><span>No</span></div>
    {items.map((item) => <div className="matrix-row" key={item}><span>{item}</span>{["Yes", "No"].map((answer) =>
      <label key={answer}><input type="radio" name={`${name}-${item}`} value={answer} checked={values[item] === answer} onChange={() => onChange(name, item, answer)} required /><span className="sr-only">{answer}</span></label>
    )}</div>)}
  </div>;
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const update = ({ target: { name, value, type, checked } }) => {
    let next = type === "checkbox" ? checked : value;
    if (name === "icLast4") next = value.replace(/\D/g, "").slice(0, 4);
    setForm((current) => ({ ...current, [name]: next }));
  };
  const updateConcerns = ({ target: { value, checked } }) => setForm((current) => ({
    ...current, mainConcerns: checked ? [...current.mainConcerns, value] : current.mainConcerns.filter((item) => item !== value),
  }));
  const updateMatrix = (name, item, answer) => setForm((current) => ({
    ...current, [name]: { ...current[name], [item]: answer },
  }));

  const submit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!form.mainConcerns.length) return setStatus({ type: "error", message: "Please select at least one main concern." });
    submittingRef.current = true; setSubmitting(true); setStatus({ type: "loading", message: "Submitting your survey…" });
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      const response = await fetch("/api/submit-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, ...form }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error(result.error || "Unable to submit. Please try again.");
      setForm(initialForm); setStatus({ type: "success", message: "Thank you — your survey was submitted successfully." });
    } catch (error) { setStatus({ type: "error", message: error.message }); }
    finally { submittingRef.current = false; setSubmitting(false); }
  };

  return <main className="page-shell"><form className="survey" onSubmit={submit}>
    <header className="hero">
      <div><h1><em>Prenatal</em> &amp; Postnatal<br />Protection Check</h1><p>Helping you protect what matters most,<br />from today and for tomorrow. ♡</p></div>
      <div className="hero-family"><img src="/family-hero.png" alt="Parents holding their baby" /></div>
    </header>
    <div className="form-grid">
      <Card number="1" title="Parent Information" tone="red">
        <label className="field"><span>Full Name *</span><input name="fullName" value={form.fullName} onChange={update} maxLength="100" required /></label>
        <label className="field"><span>Contact Number *</span><input name="contactNumber" value={form.contactNumber} onChange={update} inputMode="tel" maxLength="25" required /></label>
        <label className="field"><span>Last 4 Digits of IC Number *</span><input name="icLast4" value={form.icLast4} onChange={update} inputMode="numeric" pattern="[0-9]{4}" maxLength="4" required /></label>
        <RadioGroup label="Age" name="ageBand" options={AGE_BANDS} value={form.ageBand} onChange={update} />
        <label className="field"><span>Occupation</span><input name="occupation" value={form.occupation} onChange={update} maxLength="100" /></label>
      </Card>
      <Card number="2" title="Pregnancy / Baby Information" tone="coral">
        <StageSelector value={form.currentStage} onChange={update} />
        <div className="stage-details">
          <div className="conditional"><h3>If Pregnant</h3><label className="field"><span>Current Week of Pregnancy{form.currentStage === "Currently pregnant" && " *"}</span><input type="number" name="pregnancyWeek" min="1" max="45" value={form.pregnancyWeek} onChange={update} required={form.currentStage === "Currently pregnant"} /></label><label className="field"><span>Expected Due Date{form.currentStage === "Currently pregnant" && " *"}</span><input type="date" name="expectedDueDate" value={form.expectedDueDate} onChange={update} required={form.currentStage === "Currently pregnant"} /></label></div>
          <div className="conditional"><h3>If Baby is Born</h3><label className="field"><span>Baby’s Age{form.currentStage === "Postnatal / newborn stage" && " *"}</span><input name="babyAge" value={form.babyAge} onChange={update} maxLength="50" required={form.currentStage === "Postnatal / newborn stage"} /></label></div>
        </div>
      </Card>
      <Card number="3" title="Number of Children" tone="blue"><RadioGroup label="How many children do you have? (Including current pregnancy)" name="numberOfChildren" options={CHILD_COUNTS} value={form.numberOfChildren} onChange={update} vertical /></Card>
      <Card number="4" title="Prenatal Protection Check" tone="green"><YesNoGrid items={PRENATAL_ITEMS} name="prenatalPreparedness" values={form.prenatalPreparedness} onChange={updateMatrix} /></Card>
      <Card number="5" title="Main Concerns" tone="gold" picture><fieldset><legend>What are your biggest concerns currently? (You may tick more than one) *</legend><div className="stacked">{CONCERNS.map((item) => <label className="choice" key={item}><input type="checkbox" value={item} checked={form.mainConcerns.includes(item)} onChange={updateConcerns} /><span>{item}</span></label>)}</div></fieldset></Card>
      <Card number="6" title="Existing Insurance Coverage" tone="purple"><YesNoGrid items={COVERAGE_ITEMS} name="existingCoverage" values={form.existingCoverage} onChange={updateMatrix} /></Card>
      <Card number="7" title="Your Current Policy" tone="teal"><label className="field"><span>Your current policy is under which insurance company?</span><input name="currentInsurer" value={form.currentInsurer} onChange={update} maxLength="100" /></label></Card>
      <Card number="8" title="Previous Insurance Agent Satisfaction" tone="pink"><SatisfactionSelector value={form.agentSatisfaction} onChange={update} /></Card>
    </div>
    <section className="consent-panel"><label className="choice"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required /><span>I consent to the collection and use of my information for follow-up and advisory purposes. *</span></label></section>
    <footer><h2>♥ Thank you for your time! ♥</h2><p>We look forward to helping you and your family with the right protection.</p><button disabled={submitting}>{submitting ? "Submitting…" : "Submit Survey"}</button>{status.message && <p className={`status ${status.type}`} role="status">{status.message}</p>}</footer>
  </form></main>;
}
