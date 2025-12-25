/* =========================================================
   The WHO Assessment — Official (app.js)
   - Static-site safe Google Form submission (hidden iframe)
   - 13-step flow with validation + word banks
   - Saves progress to localStorage
   ========================================================= */

/* ===================== GOOGLE FORM CONFIG ===================== */
const GOOGLE_FORM = {
  formResponseUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/formResponse",
  entry: {
    name: "entry.2005620554",
    email: "entry.1045781291",
    values: "entry.1065046570",
    pillars: "entry.1010525839",
    idealEmotion: "entry.1060481030",
    triggers: "entry.2079481635",
    comments: "entry.839337160",
  },
};

/* ===================== BANKS ===================== */
const VALUE_OPTIONS = [
  "Health","Freedom","Growth","Family","Friendship","Love","Discipline","Adventure","Curiosity",
  "Creativity","Faith","Integrity","Mastery","Stability","Wealth","Impact","Service","Leadership",
  "Peace","Joy","Authenticity","Courage","Excellence","Humor"
];

const PILLAR_OPTIONS = [
  "Body","Mind","Relationships","Work/Craft","Money","Faith/Spirit","Home/Environment","Fun/Play",
  "Learning","Community","Routine","Adventure"
];

const IDEAL_EMOTIONS = [
  "Peace","Confidence","Happiness","Clarity","Calm","Connection","Freedom","Joy","Grounded","Inspired"
];

const TRIGGER_OPTIONS = [
  "I’m not heard",
  "I’m not respected",
  "I’m not valued",
  "I’m not safe",
  "I’m not capable",
  "I’m not important",
  "I’m losing control",
  "I’m being judged",
];

/* ===================== STATE ===================== */
const STORAGE_KEY = "who_assessment_official_v2";

function defaultState() {
  return {
    stepIndex: 0,
    submitted: false,
    user: { name: "", email: "" },

    values: {
      proudMoment: "",
      proudWhy: "",
      upsetMoment: "",
      upsetWhy: "",
      selected: [], // 3-6
      custom: [],
    },

    pillars: {
      bestMoment: "",
      bestWhy: "",
      selected: [], // 1-3
      custom: [],
    },

    idealEmotion: {
      emotion: "",
      desire: 8,
      why: "",
    },

    trigger: {
      trigger: "",
      response: "",
      notes: "",
    },

    comments: "",
  };
}

let state = loadState();

/* ===================== STEPS ===================== */
const STEPS = [
  { key: "start", title: "Start", subtitle: "Define your WHO", render: renderStart, canNext: canNextStart },

  { key: "values_discover", title: "Values (Discover)", subtitle: "Values show up in moments of pride — and moments of frustration.", render: renderValuesDiscover, canNext: () => true },
  { key: "values_bank", title: "Values (Word Bank)", subtitle: "Browse the word bank to spark ideas.", render: renderValuesBank, canNext: () => true },
  { key: "values_pick", title: "Values (Pick 3–6)", subtitle: "Pick 3–6 Values that best represent you.", render: renderValuesPick, canNext: canNextValuesPick },

  { key: "pillars_discover", title: "Pillars (Discover)", subtitle: "Pillars are where you feel energized and alive.", render: renderPillarsDiscover, canNext: () => true },
  { key: "pillars_bank", title: "Pillars (Word Bank)", subtitle: "Browse the word bank to spark ideas.", render: renderPillarsBank, canNext: () => true },
  { key: "pillars_pick", title: "Pillars (Pick 1–3)", subtitle: "Pick 1–3 Pillars that strengthen your WHO.", render: renderPillarsPick, canNext: canNextPillarsPick },

  { key: "ideal_emotion", title: "Ideal Emotion", subtitle: "Your compass: how you want to feel most often.", render: renderIdealEmotion, canNext: canNextIdealEmotion },

  { key: "trigger", title: "Trigger", subtitle: "Your warning signal: what sets you off.", render: renderTrigger, canNext: canNextTrigger },

  { key: "snapshot", title: "Your WHO Snapshot", subtitle: "A simple summary of what you discovered.", render: renderSnapshot, canNext: () => true },

  { key: "submit", title: "Submit", subtitle: "Save your results.", render: renderSubmit, canNext: () => true },

  { key: "submitted", title: "Submitted", subtitle: "Your responses have been saved successfully.", render: renderSubmitted, canNext: () => false },
];

/* ===================== MOUNT ===================== */
const elApp = document.getElementById("app");
if (!elApp) console.error("Missing #app element in index.html");
render();

/* ===================== RENDER ===================== */
function render() {
  const step = STEPS[state.stepIndex] || STEPS[0];
  const total = STEPS.length;
  const num = state.stepIndex + 1;
  const pct = Math.round((num / total) * 100);

  elApp.innerHTML = `
    ${progressCard(step.title, pct, num, total)}
    <div class="card">
      <div class="cardHead">
        <h1>${escapeHtml(step.title)}</h1>
        <p class="muted">${escapeHtml(step.subtitle || "")}</p>
      </div>
      <div class="cardBody">
        ${step.render()}
      </div>
    </div>
    ${navCard(step)}
  `;

  wireEvents();
}

function progressCard(label, pct, num, total) {
  return `
    <div class="card slim">
      <div class="row between">
        <div class="kicker">${escapeHtml(label).toUpperCase()}</div>
        <div class="muted">${num} / ${total}</div>
      </div>
      <div class="bar"><div class="barFill" style="width:${pct}%;"></div></div>
      <div class="row between">
        <div class="muted">${pct}% complete</div>
        <div></div>
      </div>
    </div>
  `;
}

function navCard(step) {
  const isFirst = state.stepIndex === 0;
  const isSubmitted = step.key === "submitted";
  const nextLabel = step.key === "submit" ? "Submit" : "Next";
  const nextDisabled = isSubmitted ? true : !step.canNext();

  return `
    <div class="card slim">
      <div class="row between">
        <button class="btn" id="btnBack" ${isFirst || isSubmitted ? "disabled" : ""}>Back</button>
        <div class="muted">${(!isSubmitted && nextDisabled) ? "Complete this step to continue." : ""}</div>
        <button class="btn primary" id="btnNext" ${nextDisabled ? "disabled" : ""}>${isSubmitted ? "Done" : nextLabel}</button>
      </div>
    </div>
  `;
}

/* ===================== STEP UI ===================== */
function renderStart() {
  return `
    <div class="field">
      <label>Your name <span class="req">(required)</span></label>
      <input id="userName" type="text" value="${escapeHtmlAttr(state.user.name)}" placeholder="Your name" />
    </div>

    <div class="field">
      <label>Your email <span class="muted">(optional)</span></label>
      <input id="userEmail" type="email" value="${escapeHtmlAttr(state.user.email)}" placeholder="you@email.com" />
    </div>

    <div class="note">
      Your name and email (if provided) will be stored with your results.
    </div>
  `;
}

function renderValuesDiscover() {
  return `
    <div class="field">
      <label>Proud moment <span class="muted">(optional)</span></label>
      <textarea id="proudMoment" rows="3">${escapeHtml(state.values.proudMoment)}</textarea>
    </div>
    <div class="field">
      <label>Why did it matter? <span class="muted">(optional)</span></label>
      <textarea id="proudWhy" rows="3">${escapeHtml(state.values.proudWhy)}</textarea>
    </div>

    <div class="field">
      <label>Upset moment <span class="muted">(optional)</span></label>
      <textarea id="upsetMoment" rows="3">${escapeHtml(state.values.upsetMoment)}</textarea>
    </div>
    <div class="field">
      <label>Why did it matter? <span class="muted">(optional)</span></label>
      <textarea id="upsetWhy" rows="3">${escapeHtml(state.values.upsetWhy)}</textarea>
    </div>

    <div class="muted small">Next: browse the Values word bank.</div>
  `;
}

function renderValuesBank() {
  return `
    <div class="muted small">Tap a word to quickly add it to your selection list (max 6).</div>
    <div class="pillGrid">
      ${VALUE_OPTIONS.map(v => pill("addValue", v, state.values.selected.includes(v))).join("")}
    </div>
    <div class="note">Next: pick your final 3–6 Values.</div>
  `;
}

function renderValuesPick() {
  return `
    <div class="muted small">Selected: <b>${state.values.selected.length}</b> (choose 3–6)</div>

    <div class="pillGrid">
      ${state.values.selected.map(v => pill("removeValue", v, true)).join("") || `<div class="muted">No Values selected yet.</div>`}
    </div>

    <div class="field">
      <label>Add a custom Value <span class="muted">(optional)</span></label>
      <input id="customValue" type="text" placeholder="Type a value and press Enter" />
    </div>

    <div class="muted small">Tip: tap a selected Value to remove it.</div>
  `;
}

function renderPillarsDiscover() {
  return `
    <div class="field">
      <label>Best moment <span class="muted">(optional)</span></label>
      <textarea id="bestMoment" rows="3">${escapeHtml(state.pillars.bestMoment)}</textarea>
    </div>

    <div class="field">
      <label>Why did it feel good? <span class="muted">(optional)</span></label>
      <textarea id="bestWhy" rows="3">${escapeHtml(state.pillars.bestWhy)}</textarea>
    </div>

    <div class="muted small">Next: browse the Pillars word bank.</div>
  `;
}

function renderPillarsBank() {
  return `
    <div class="muted small">Tap a word to quickly add it to your selection list (max 3).</div>
    <div class="pillGrid">
      ${PILLAR_OPTIONS.map(p => pill("addPillar", p, state.pillars.selected.includes(p))).join("")}
    </div>
    <div class="note">Next: pick your final 1–3 Pillars.</div>
  `;
}

function renderPillarsPick() {
  return `
    <div class="muted small">Selected: <b>${state.pillars.selected.length}</b> (choose 1–3)</div>

    <div class="pillGrid">
      ${state.pillars.selected.map(p => pill("removePillar", p, true)).join("") || `<div class="muted">No Pillars selected yet.</div>`}
    </div>

    <div class="field">
      <label>Add a custom Pillar <span class="muted">(optional)</span></label>
      <input id="customPillar" type="text" placeholder="Type a pillar and press Enter" />
    </div>

    <div class="muted small">Tip: tap a selected Pillar to remove it.</div>
  `;
}

function renderIdealEmotion() {
  return `
    <div class="field">
      <label>Ideal emotion <span class="req">(required)</span></label>
      <select id="idealEmotionSelect">
        <option value="">Select one...</option>
        ${IDEAL_EMOTIONS.map(e => `<option value="${escapeHtmlAttr(e)}" ${state.idealEmotion.emotion===e?"selected":""}>${escapeHtml(e)}</option>`).join("")}
      </select>
    </div>

    <div class="field">
      <label>Target level <span class="muted">(1–10)</span></label>
      <input id="idealDesire" type="range" min="1" max="10" value="${Number(state.idealEmotion.desire||8)}" />
      <div class="muted small">Target: <b>${Number(state.idealEmotion.desire||8)}/10</b></div>
    </div>

    <div class="field">
      <label>Why this emotion? <span class="muted">(optional)</span></label>
      <textarea id="idealWhy" rows="3">${escapeHtml(state.idealEmotion.why)}</textarea>
    </div>
  `;
}

function renderTrigger() {
  return `
    <div class="field">
      <label>Your trigger <span class="req">(required)</span></label>
      <select id="triggerSelect">
        <option value="">Select one...</option>
        ${TRIGGER_OPTIONS.map(t => `<option value="${escapeHtmlAttr(t)}" ${state.trigger.trigger===t?"selected":""}>${escapeHtml(t)}</option>`).join("")}
      </select>
    </div>

    <div class="field">
      <label>When triggered, I want to respond by… <span class="muted">(optional)</span></label>
      <textarea id="triggerResponse" rows="3">${escapeHtml(state.trigger.response)}</textarea>
    </div>

    <div class="field">
      <label>Notes <span class="muted">(optional)</span></label>
      <textarea id="triggerNotes" rows="3">${escapeHtml(state.trigger.notes)}</textarea>
    </div>
  `;
}

function renderSnapshot() {
  const values = state.values.selected.length ? state.values.selected : ["—"];
  const pillars = state.pillars.selected.length ? state.pillars.selected : ["—"];
  const ideal = state.idealEmotion.emotion
    ? `${state.idealEmotion.emotion} (target: ${Number(state.idealEmotion.desire||8)}/10)`
    : "—";
  const trig = state.trigger.trigger || "—";

  return `
    <div class="grid2">
      <div class="box">
        <h3>Values — Your guardrails</h3>
        <ul>${values.map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
      </div>

      <div class="box">
        <h3>Pillars — Your energy source</h3>
        <ul>${pillars.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      </div>

      <div class="box">
        <h3>Ideal Emotion — Your compass</h3>
        <ul><li>${escapeHtml(ideal)}</li></ul>
      </div>

      <div class="box">
        <h3>Trigger — Your warning signal</h3>
        <ul><li>${escapeHtml(trig)}</li></ul>
      </div>
    </div>

    <div class="note">Refine over time. Awareness builds self-command.</div>
  `;
}

function renderSubmit() {
  return `
    <div class="note">
      Clicking <b>Submit</b> will save your results to Dana’s private response sheet.
      <br/><span class="muted small">No email is sent automatically.</span>
    </div>

    <div class="field">
      <label>Any final comments? <span class="muted">(optional)</span></label>
      <textarea id="finalComments" rows="4">${escapeHtml(state.comments)}</textarea>
    </div>
  `;
}

function renderSubmitted() {
  return `
    <div class="note">
      Your responses have been saved successfully.
    </div>

    <div class="row end">
      <button class="btn" id="btnStartOver">Start Over</button>
    </div>
  `;
}

/* ===================== VALIDATION ===================== */
function canNextStart() {
  return (state.user.name || "").trim().length > 0;
}
function canNextValuesPick() {
  return state.values.selected.length >= 3 && state.values.selected.length <= 6;
}
function canNextPillarsPick() {
  return state.pillars.selected.length >= 1 && state.pillars.selected.length <= 3;
}
function canNextIdealEmotion() {
  return (state.idealEmotion.emotion || "").trim().length > 0;
}
function canNextTrigger() {
  return (state.trigger.trigger || "").trim().length > 0;
}

/* ===================== EVENTS ===================== */
function wireEvents() {
  // Reset button (top right) if it exists
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.onclick = hardReset;

  // Back/Next
  const back = document.getElementById("btnBack");
  const next = document.getElementById("btnNext");
  if (back) back.onclick = goBack;
  if (next) next.onclick = goNext;

  // Start over
  const so = document.getElementById("btnStartOver");
  if (so) so.onclick = hardReset;

  // Inputs
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", onInputChange);
    el.addEventListener("change", onInputChange);
  });

  // Pills
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const action = e.currentTarget.getAttribute("data-action");
      const value = e.currentTarget.getAttribute("data-value");
      onPillClick(action, value);
    });
  });

  // Custom value/pillar entry
  const cv = document.getElementById("customValue");
  if (cv) {
    cv.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = (cv.value || "").trim();
        if (!v) return;
        addValue(v);
        cv.value = "";
      }
    });
  }

  const cp = document.getElementById("customPillar");
  if (cp) {
    cp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = (cp.value || "").trim();
        if (!v) return;
        addPillar(v);
        cp.value = "";
      }
    });
  }
}

function onInputChange(e) {
  const id = e.target.id;
  const val = e.target.value ?? "";

  if (id === "userName") state.user.name = val;
  if (id === "userEmail") state.user.email = val;

  if (id === "proudMoment") state.values.proudMoment = val;
  if (id === "proudWhy") state.values.proudWhy = val;
  if (id === "upsetMoment") state.values.upsetMoment = val;
  if (id === "upsetWhy") state.values.upsetWhy = val;

  if (id === "bestMoment") state.pillars.bestMoment = val;
  if (id === "bestWhy") state.pillars.bestWhy = val;

  if (id === "idealEmotionSelect") state.idealEmotion.emotion = val;
  if (id === "idealDesire") state.idealEmotion.desire = Number(val);
  if (id === "idealWhy") state.idealEmotion.why = val;

  if (id === "triggerSelect") state.trigger.trigger = val;
  if (id === "triggerResponse") state.trigger.response = val;
  if (id === "triggerNotes") state.trigger.notes = val;

  if (id === "finalComments") state.comments = val;

  saveState();
  render();
}

function onPillClick(action, value) {
  if (action === "addValue") addValue(value);
  if (action === "removeValue") removeValue(value);

  if (action === "addPillar") addPillar(value);
  if (action === "removePillar") removePillar(value);

  saveState();
  render();
}

/* ===================== SELECTION HELPERS ===================== */
function addValue(v) {
  if (state.values.selected.includes(v)) return;
  if (state.values.selected.length >= 6) return;
  state.values.selected.push(v);
  saveState();
  render();
}
function removeValue(v) {
  state.values.selected = state.values.selected.filter(x => x !== v);
}

function addPillar(p) {
  if (state.pillars.selected.includes(p)) return;
  if (state.pillars.selected.length >= 3) return;
  state.pillars.selected.push(p);
  saveState();
  render();
}
function removePillar(p) {
  state.pillars.selected = state.pillars.selected.filter(x => x !== p);
}

/* ===================== NAV ===================== */
function goBack() {
  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    saveState();
    render();
  }
}

async function goNext() {
  const step = STEPS[state.stepIndex];

  if (step.key === "submit") {
    // build payload + submit
    const payload = buildPayload();
    await submitToGoogleIframe(payload);

    state.submitted = true;
    state.stepIndex = STEPS.findIndex(s => s.key === "submitted");
    saveState();
    render();
    return;
  }

  if (step.canNext()) {
    state.stepIndex = Math.min(state.stepIndex + 1, STEPS.length - 1);
    saveState();
    render();
  }
}

function hardReset() {
  state = defaultState();
  saveState();
  render();
}

/* ===================== GOOGLE SUBMIT (IFRAME) ===================== */
function submitToGoogleIframe(payload) {
  return new Promise((resolve) => {
    // iframe target
    let iframe = document.getElementById("hidden_iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.id = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    // build form
    const form = document.createElement("form");
    form.action = GOOGLE_FORM.formResponseUrl;
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const add = (name, value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value ?? "";
      form.appendChild(input);
    };

    add(GOOGLE_FORM.entry.name, payload.name);
    add(GOOGLE_FORM.entry.email, payload.email);
    add(GOOGLE_FORM.entry.values, payload.values);
    add(GOOGLE_FORM.entry.pillars, payload.pillars);
    add(GOOGLE_FORM.entry.idealEmotion, payload.idealEmotion);
    add(GOOGLE_FORM.entry.triggers, payload.triggers);
    add(GOOGLE_FORM.entry.comments, payload.comments);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      form.remove();
      resolve(true);
    }, 1200);
  });
}

/* ===================== PAYLOAD ===================== */
function buildPayload() {
  const valuesText = [
    `Selected Values: ${state.values.selected.join(", ")}`,
    state.values.proudMoment ? `Proud moment: ${state.values.proudMoment}` : "",
    state.values.proudWhy ? `Why it mattered: ${state.values.proudWhy}` : "",
    state.values.upsetMoment ? `Upset moment: ${state.values.upsetMoment}` : "",
    state.values.upsetWhy ? `Why it mattered: ${state.values.upsetWhy}` : "",
  ].filter(Boolean).join("\n");

  const pillarsText = [
    `Selected Pillars: ${state.pillars.selected.join(", ")}`,
    state.pillars.bestMoment ? `Best moment: ${state.pillars.bestMoment}` : "",
    state.pillars.bestWhy ? `Why it mattered: ${state.pillars.bestWhy}` : "",
  ].filter(Boolean).join("\n");

  const idealEmotionText = [
    state.idealEmotion.emotion ? `Ideal Emotion: ${state.idealEmotion.emotion}` : "",
    `Target: ${Number(state.idealEmotion.desire || 8)}/10`,
    state.idealEmotion.why ? `Why: ${state.idealEmotion.why}` : "",
  ].filter(Boolean).join("\n");

  const triggerText = [
    state.trigger.trigger ? `Trigger: ${state.trigger.trigger}` : "",
    state.trigger.response ? `Preferred response: ${state.trigger.response}` : "",
    state.trigger.notes ? `Notes: ${state.trigger.notes}` : "",
  ].filter(Boolean).join("\n");

  return {
    name: (state.user.name || "").trim(),
    email: (state.user.email || "").trim(),
    values: valuesText,
    pillars: pillarsText,
    idealEmotion: idealEmotionText,
    triggers: triggerText,
    comments: (state.comments || "").trim(),
  };
}

/* ===================== UI HELPERS ===================== */
function pill(action, label, selected) {
  return `
    <button type="button" class="pill ${selected ? "on" : ""}"
      data-action="${escapeHtmlAttr(action)}"
      data-value="${escapeHtmlAttr(label)}">
      ${escapeHtml(label)}
    </button>
  `;
}

/* ===================== STORAGE ===================== */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

/* ===================== ESCAPE ===================== */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtml(s).replaceAll("\n"," ");
}
