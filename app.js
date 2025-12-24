/* ============================
   CONFIG
============================ */
const STORAGE_KEY = "who_assessment_v3";
const MAIN_SITE = "http://MyWHOthoughts.com";
const BOOK_LINK = "https://bit.ly/3PxJ3MD";
const WELCOME_IMAGE = "./welcome-image.jpg";

/* ============================
   DEFAULT STATE
============================ */
const DEFAULTS = {
  meta: { name: "", email: "", emailOptIn: false },
  fontScale: 1,

  values: [],
  confirmedValues: [],

  pillars: [],
  confirmedPillars: [],

  idealEmotion: "",
  idealEmotion2: "",
  idealEmotionLevel: 5,

  triggers: [
    { trigger: "", feeling: "", response: "" }
  ],
};

/* ============================
   OPTIONS
============================ */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er",
  "Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty",
  "Impact","Independence","Inclusivity","Integrity","Justice","Kind","Loyalty",
  "Open Mind","Perseverance","Reliability","Resilience","Respect","Self-Reliance",
  "Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Considerate","Creative","Earthy","Empathy","Explorer",
  "Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor",
  "Introspective","Impact","Kind","Laughter","Limitless","Listener","Love","Nerdy",
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present",
  "Problem Solver","Sarcastic","Service"
];

const EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled",
  "Freedom","Grateful","Happiness","Inspired","Joy","Peace","Playful",
  "Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart enough","Valued","Wanted"
];

/* ============================
   STATE
============================ */
let state = loadState();
let stepIndex = 0;

/* ============================
   DOM
============================ */
const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elProgress = document.getElementById("progressBar");

/* ============================
   STEPS
============================ */
const steps = [
  {
    title: "Welcome",
    hint: "Quick clarity. No fluff.",
    render: renderWelcome,
    validate: () => true,
  },
  {
    title: "Start",
    hint: "Email is optional.",
    render: renderMeta,
    validate: validateMeta,
  },
  {
    title: "Step 1 of 6 — Values (Discover)",
    hint: "Identify your non-negotiables.",
    render: () => renderMultiSelect("values", VALUE_OPTIONS),
    validate: () => state.values.length >= 3 || "Select at least 3 Values.",
  },
  {
    title: "Step 2 of 6 — Values (Road Test)",
    hint: "Values evoke emotion when crossed.",
    render: renderValuesRoadTest,
    validate: () => state.confirmedValues.length >= 2 || "Confirm at least 2 Values.",
  },
  {
    title: "Step 3 of 6 — Pillars (Discover)",
    hint: "Who you are at your best.",
    render: () => renderMultiSelect("pillars", PILLAR_OPTIONS),
    validate: () => state.pillars.length >= 3 || "Select at least 3 Pillars.",
  },
  {
    title: "Step 4 of 6 — Pillars (Road Test)",
    hint: "What fuels you vs drains you.",
    render: renderPillarsRoadTest,
    validate: () => state.confirmedPillars.length >= 2 || "Confirm at least 2 Pillars.",
  },
  {
    title: "Step 5 of 6 — Ideal Emotion",
    hint: "Your emotional compass.",
    render: renderIdealEmotion,
    validate: () => !!state.idealEmotion || "Select an Ideal Emotion.",
  },
  {
    title: "Step 6 of 6 — Trigger (Anti-WHO)",
    hint: "Recognize it before it hijacks you.",
    render: renderTrigger,
    validate: validateTrigger,
  },
  {
    title: "Your WHO Snapshot",
    hint: "Awareness builds self-command.",
    render: renderResults,
    validate: () => true,
  },
];

/* ============================
   INIT
============================ */
init();
function init(){
  elBack.onclick = () => go(-1);
  elNext.onclick = () => go(1);
  renderStep();
}

/* ============================
   NAV
============================ */
function go(delta){
  const res = steps[stepIndex].validate();
  if (res !== true) return toast(res);
  stepIndex = Math.max(0, Math.min(steps.length - 1, stepIndex + delta));
  renderStep();
}

function renderStep(){
  const step = steps[stepIndex];
  elTitle.textContent = step.title;
  elHint.textContent = step.hint;
  elBody.innerHTML = "";
  elBack.style.visibility = stepIndex === 0 ? "hidden" : "visible";
  elNext.textContent = stepIndex === steps.length - 1 ? "Done" : "Next";
  elProgress.style.width = `${(stepIndex / (steps.length - 1)) * 100}%`;
  step.render();
}

/* ============================
   RENDERERS
============================ */
function renderWelcome(){
  const box = document.createElement("div");
  box.className = "result-box";

  box.innerHTML = `
    <img src="${WELCOME_IMAGE}" alt="WHO Thoughts Assessment"
         style="width:100%; max-width:600px; margin:0 auto 20px; display:block; border-radius:16px;" />

    <p><strong>When your nervous system is regulated, you are powerful.</strong></p>
    <p>You respond instead of react. You choose instead of spiral.</p>
    <p>
      Self-command isn’t about perfection — it’s about awareness.
      Noticing when you drift from your WHO and knowing how to return.
    </p>
    <p>
      This assessment helps you uncover and celebrate the best parts of you —
      and use them to move through conflict with clarity and confidence.
    </p>
    <p><strong>— Dana Lynn Bernstein, PMP, PCC</strong><br/>
    <em>The Conflict Resolution Coach</em></p>
  `;

  elBody.appendChild(box);
}

function renderMeta(){
  elBody.innerHTML = `
    <div class="field">
      <div class="label">Your name</div>
      <input class="input" value="${state.meta.name}" />
    </div>

    <div class="field">
      <div class="label">Your email (optional)</div>
      <input class="input" value="${state.meta.email}" />
    </div>

    <label class="small">
      <input type="checkbox" ${state.meta.emailOptIn ? "checked" : ""} />
      Email my results and bonus content
    </label>
  `;

  const inputs = elBody.querySelectorAll("input");
  inputs[0].oninput = e => state.meta.name = e.target.value;
  inputs[1].oninput = e => state.meta.email = e.target.value;
  inputs[2].onchange = e => state.meta.emailOptIn = e.target.checked;
}

function renderMultiSelect(key, options){
  const selected = new Set(state[key]);

  const pills = document.createElement("div");
  pills.className = "pills";

  options.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill" + (selected.has(opt) ? " selected" : "");
    p.textContent = opt;
    p.onclick = () => {
      selected.has(opt) ? selected.delete(opt) : selected.add(opt);
      state[key] = [...selected];
      saveState();
      renderStep();
    };
    pills.appendChild(p);
  });

  elBody.appendChild(pills);
}

function renderValuesRoadTest(){
  state.values.forEach(v => roadTestRow(v, "confirmedValues"));
}

function renderPillarsRoadTest(){
  state.pillars.forEach(p => roadTestRow(p, "confirmedPillars"));
}

function roadTestRow(word, bucket){
  const row = document.createElement("div");
  row.className = "result-box";
  row.innerHTML = `
    <strong>${word}</strong>
    <div class="small">If crossed, do you feel upset or frustrated?</div>
    <button class="btn yes">YES</button>
    <button class="btn ghost">NO</button>
  `;
  row.querySelector(".yes").onclick = () => {
    if (!state[bucket].includes(word)) state[bucket].push(word);
    saveState();
  };
  row.querySelector(".ghost").onclick = () => {
    state[bucket] = state[bucket].filter(x => x !== word);
    saveState();
  };
  elBody.appendChild(row);
}

function renderIdealEmotion(){
  renderMultiSelect("idealEmotion", EMOTION_OPTIONS);

  const scale = document.createElement("div");
  scale.className = "field";
  scale.innerHTML = `
    <div class="label">How strongly do you feel it? (1–10)</div>
    <input type="range" min="1" max="10" value="${state.idealEmotionLevel}" />
    <div class="small">Current: ${state.idealEmotionLevel} / Target: 8</div>
  `;
  scale.querySelector("input").oninput = e =>
    state.idealEmotionLevel = +e.target.value;

  elBody.appendChild(scale);
}

function renderTrigger(){
  const t = state.triggers[0];
  elBody.innerHTML = `
    <div class="field">
      <div class="label">My Trigger (“I’m not ___ enough”)</div>
      <input class="input" value="${t.trigger}" />
    </div>
    <div class="field">
      <div class="label">It makes me feel</div>
      <input class="input" value="${t.feeling}" />
    </div>
    <div class="field">
      <div class="label">Reset Script</div>
      <textarea>${t.response}</textarea>
    </div>
  `;

  const inputs = elBody.querySelectorAll("input, textarea");
  inputs[0].oninput = e => t.trigger = e.target.value;
  inputs[1].oninput = e => t.feeling = e.target.value;
  inputs[2].oninput = e => t.response = e.target.value;
}

function renderResults(){
  elBody.innerHTML = `
    <div class="result-box">
      <strong>Values:</strong><br/>${state.confirmedValues.join(", ")}<br/><br/>
      <strong>Pillars:</strong><br/>${state.confirmedPillars.join(", ")}<br/><br/>
      <strong>Ideal Emotion:</strong><br/>
      ${state.idealEmotion} (${state.idealEmotionLevel}/10)<br/><br/>
      <strong>Trigger:</strong><br/>
      ${state.triggers[0].trigger}
    </div>
  `;
}

/* ============================
   HELPERS
============================ */
function validateMeta(){
  return state.meta.name.length >= 2 || "Please enter your name.";
}

function validateTrigger(){
  return state.triggers[0].trigger || "Please define your Trigger.";
}

function toast(msg){
  alert(msg);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(DEFAULTS);
  }catch{
    return structuredClone(DEFAULTS);
  }
}
