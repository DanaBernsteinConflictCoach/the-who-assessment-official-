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
        if (!state.confirmedValues.includes(v)) state.confirmedValues.push(v);
        save();
      };
      box.children[3].onclick = () => {
        state.confirmedValues = state.confirmedValues.filter(x => x !== v);
        save();
      };
      elBody.appendChild(box);
    });
  },
  validate: () => state.confirmedValues.length >= 2 || "Confirm at least 2 Values."
},

/* PILLARS DISCOVER */
{
  title: "Step 3 of 6 — Pillars",
  hint: "Who you are at your best",
  render() {
    renderSelectableList(PILLARS, state.pillars, p => {
      toggle(state.pillars, p); save(); renderStep();
    });
  },
  validate: () => state.pillars.length >= 3 || "Select at least 3 Pillars."
},

/* PILLARS ROAD TEST */
{
  title: "Step 4 of 6 — Pillars (Road Test)",
  hint: "Does crossing this upset you?",
  render() {
    elBody.innerHTML = "";
    state.pillars.forEach(p => {
      const box = document.createElement("div");
      box.innerHTML = `
        <strong>${p}</strong>
        <p>If crossed, do you feel upset?</p>
        <button>YES → Value</button>
        <button>NO → Pillar</button>
      `;
      box.children[2].onclick = () => {
        if (!state.confirmedValues.includes(p)) state.confirmedValues.push(p);
        save();
      };
      box.children[3].onclick = () => {
        if (!state.confirmedPillars.includes(p)) state.confirmedPillars.push(p);
        save();
      };
      elBody.appendChild(box);
    });
  },
  validate: () => state.confirmedPillars.length >= 2 || "Keep at least 2 Pillars."
},

/* IDEAL EMOTION */
{
  title: "Step 5 of 6 — Ideal Emotion",
  hint: "Your emotional compass",
  render() {
    renderSelectableList(EMOTIONS, [state.idealEmotion], e => {
      state.idealEmotion = e; save(); renderStep();
    });

    elBody.innerHTML += `
      <label>How much do you feel it? (1–10)</label>
      <input type="range" min="1" max="10" value="${state.idealEmotionLevel}">
      <label>Optional second Ideal Emotion</label>
      <input value="${state.idealEmotion2}">
    `;

    elBody.querySelector("input[type=range]").oninput = e => {
      state.idealEmotionLevel = e.target.value; save();
    };
    elBody.querySelectorAll("input")[1].oninput = e => {
      state.idealEmotion2 = e.target.value; save();
    };
  },
  validate: () => state.idealEmotion || "Choose an Ideal Emotion."
},

/* TRIGGER */
{
  title: "Step 6 of 6 — Trigger",
  hint: "Recognize the Anti-WHO",
  render() {
    elBody.innerHTML = `
      <label>My trigger is “I’m not ___ enough”</label>
      <input value="${state.trigger.belief}">

      <label>It makes me feel</label>
      <input value="${state.trigger.feeling}">

      <label>Reset Script</label>
      <textarea>${state.trigger.reset}</textarea>
    `;

    const inputs = elBody.querySelectorAll("input,textarea");
    inputs[0].oninput = e => { state.trigger.belief = e.target.value; save(); };
    inputs[1].oninput = e => { state.trigger.feeling = e.target.value; save(); };
    inputs[2].oninput = e => { state.trigger.reset = e.target.value; save(); };
  },
  validate: () => state.trigger.belief || "Define your Trigger."
},

/* SNAPSHOT */
{
  title: "Your WHO Snapshot",
  hint: "Awareness builds self-command",
  render() {
    elBody.innerHTML = `
      <strong>Values:</strong><br>${state.confirmedValues.join(", ")}<br><br>
      <strong>Pillars:</strong><br>${state.confirmedPillars.join(", ")}<br><br>
      <strong>Ideal Emotion:</strong><br>
      ${state.idealEmotion} (${state.idealEmotionLevel}/10)<br><br>
      <strong>Trigger:</strong><br>
      ${state.trigger.belief}
    `;
  },
  validate: () => true
}

];

/* ---------------- HELPERS ---------------- */
function renderSelectableList(list, selected, onClick) {
  elBody.innerHTML = "";
  list.forEach(item => {
    const d = document.createElement("div");
    d.textContent = item;
    d.style.padding = "8px";
    d.style.border = "1px solid #ccc";
    d.style.margin = "6px 0";
    d.style.cursor = "pointer";
    if (selected.includes(item)) d.style.background = "#e6f2ff";
    d.onclick = () => onClick(item);
    elBody.appendChild(d);
  });
}

function toggle(arr, item) {
  const i = arr.indexOf(item);
  i >= 0 ? arr.splice(i, 1) : arr.push(item);
}

function renderStep() {
  const s = steps[stepIndex];
  elTitle.textContent = s.title;
  elHint.textContent = s.hint;
  elBack.style.visibility = stepIndex === 0 ? "hidden" : "visible";
  elProgress.style.width = `${(stepIndex / (steps.length - 1)) * 100}%`;
  elBody.innerHTML = "";
  s.render();
}

elBack.onclick = () => {
  stepIndex = Math.max(0, stepIndex - 1);
  renderStep();
};

elNext.onclick = () => {
  const res = steps[stepIndex].validate();
  if (res !== true) return alert(res);
  stepIndex = Math.min(steps.length - 1, stepIndex + 1);
  renderStep();
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

/* INIT */
renderStep();
