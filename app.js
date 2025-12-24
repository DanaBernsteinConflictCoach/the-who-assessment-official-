/***********************************************************
 * MY WHO THOUGHTS ASSESSMENT — SINGLE FILE JS
 * PDF-FUNCTIONALITY MATCHED
 ***********************************************************/

const STORAGE_KEY = "who_assessment_v2";

/* ---------------- DEFAULT STATE ---------------- */
const DEFAULT_STATE = {
  meta: { name: "", email: "", emailOptIn: false },

  values: [],
  confirmedValues: [],

  pillars: [],
  confirmedPillars: [],
  movedPillars: [],

  idealEmotion: "",
  idealEmotion2: "",
  idealEmotionLevel: 5,

  trigger: {
    belief: "",
    feeling: "",
    reset: ""
  }
};

let state = loadState();
let stepIndex = 0;

/* ---------------- OPTIONS (PDF) ---------------- */
const VALUES = [
  "Accountability","Authenticity","Compassion","Considerate","Curiosity",
  "Empathy","Ethics","Fairness","Gratitude","Honesty","Impact","Integrity",
  "Justice","Kind","Loyalty","Open Mind","Respect","Responsibility","Service"
];

const PILLARS = [
  "Adventurer","Builder","Caretaker","Community","Confident","Creative",
  "Faith","Family","Fun","Grounded","Helper","Humor","Listener","Love",
  "Optimist","Patient","Playful","Present","Problem Solver"
];

const EMOTIONS = [
  "Calm","Clear","Connected","Content","Energized","Fulfilled",
  "Inspired","Joy","Peace","Present"
];

/* ---------------- DOM ---------------- */
const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elProgress = document.getElementById("progressBar");

/* ---------------- NAV VISIBILITY FIX ---------------- */
const navWrap = document.createElement("div");
navWrap.style.position = "sticky";
navWrap.style.bottom = "0";
navWrap.style.background = "#fff";
navWrap.style.padding = "12px";
navWrap.style.borderTop = "1px solid #ddd";
navWrap.style.display = "flex";
navWrap.style.justifyContent = "space-between";
navWrap.style.zIndex = "999";

elBack.style.minWidth = "110px";
elNext.style.minWidth = "130px";
elNext.style.fontWeight = "700";

navWrap.appendChild(elBack);
navWrap.appendChild(elNext);
document.body.appendChild(navWrap);

/* ---------------- FOOTER (PDF) ---------------- */
const footer = document.createElement("footer");
footer.style.textAlign = "center";
footer.style.fontSize = "13px";
footer.style.opacity = "0.8";
footer.style.padding = "24px";
footer.innerHTML = `
© ${new Date().getFullYear()} My WHO Thoughts Assessment™ — All rights reserved<br>
www.MyWHOthoughts.com • Book link<br>
A portion of book proceeds support Girl Scouts
`;
document.body.appendChild(footer);

/* ---------------- STEPS ---------------- */
const steps = [

/* WELCOME */
{
  title: "My WHO Thoughts Assessment™",
  hint: "Define Your WHO",
  render() {
    elBody.innerHTML = `
      <p><strong>Self-command increases when you de-escalate the emotions
      that are evoked when you are not being your WHO.</strong></p>

      <p>
        When your nervous system is regulated, you are powerful.
        You respond instead of react. You choose instead of spiral.
      </p>

      <p>
        This assessment will help you identify the internal framework
        that drives how you experience conflict — your WHO.
      </p>
    `;
  },
  validate: () => true
},

/* DEFINE WHO */
{
  title: "Define Your WHO",
  hint: "Internal conflict creates external conflict",
  render() {
    elBody.innerHTML = `
      <p>
        External conflict focuses on what to do or how to do something.
        Internal conflict focuses on your thoughts — why you labeled something a conflict.
      </p>

      <p><strong>Your WHO is defined by:</strong></p>
      <ul>
        <li><strong>Values</strong> — Your guardrails</li>
        <li><strong>Pillars</strong> — Who you are at your best</li>
        <li><strong>Ideal Emotion</strong> — Your compass</li>
        <li><strong>Trigger</strong> — Your warning signal</li>
      </ul>

      <p><strong>Conflict happens when you believe your WHO has been threatened.</strong></p>
    `;
  },
  validate: () => true
},

/* START */
{
  title: "Start",
  hint: "Email is optional",
  render() {
    elBody.innerHTML = `
      <label>Name</label>
      <input id="nameInput" value="${state.meta.name}">

      <label>Email</label>
      <input id="emailInput" value="${state.meta.email}">

      <label>
        <input type="checkbox" id="emailOptIn" ${state.meta.emailOptIn ? "checked" : ""}>
        Email my results and bonus content
      </label>
    `;

    document.getElementById("nameInput").oninput = e => {
      state.meta.name = e.target.value; save();
    };
    document.getElementById("emailInput").oninput = e => {
      state.meta.email = e.target.value; save();
    };
    document.getElementById("emailOptIn").onchange = e => {
      state.meta.emailOptIn = e.target.checked; save();
    };
  },
  validate: () => state.meta.name || "Please enter your name."
},

/* VALUES DISCOVER */
{
  title: "Step 1 of 6 — Values",
  hint: "Your non-negotiables",
  render() {
    renderSelectableList(VALUES, state.values, v => {
      toggle(state.values, v); save(); renderStep();
    });
  },
  validate: () => state.values.length >= 3 || "Select at least 3 Values."
},

/* VALUES ROAD TEST */
{
  title: "Step 2 of 6 — Values (Road Test)",
  hint: "Do you feel emotion when crossed?",
  render() {
    elBody.innerHTML = "";
    state.values.forEach(v => {
      const box = document.createElement("div");
      box.innerHTML = `
        <strong>${v}</strong>
        <p>If violated, do you feel upset, angry, or frustrated?</p>
        <button>YES</button>
        <button>NO</button>
      `;
      box.children[2].onclick = () => {
        if (!state.confirmedValues.includes(v)) state.confirmed
