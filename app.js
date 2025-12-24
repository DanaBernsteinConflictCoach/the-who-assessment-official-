/* ==========================
   WHO Assessment (Official)
   - Static GitHub Pages app
   - Submits final results to Dana’s Google Form
   ========================== */

const STORAGE_KEY = "who_assessment_official_v3";

/* ✅ Dana’s Google Form config (confirmed mapping) */
const GOOGLE_FORM = {
  enabled: true,
  formResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/formResponse",
  entry: {
    name: "entry.2005620554",
    email: "entry.1045781291",
    values: "entry.1065046570",
    pillars: "entry.1010525839",
    idealEmotion: "entry.1060481030",
    trigger: "entry.2079481635",
    comments: "entry.839337160"
  }
};

/* Options */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Curiosity","Discipline","Empathy","Excellence",
  "Fairness","Freedom","Gratitude","Growth","Honesty","Impact","Integrity","Kindness","Love",
  "Loyalty","Peace","Respect","Responsibility","Service","Stability","Transparency"
];

const PILLAR_OPTIONS = [
  "Bold","Builder","Calm","Compassionate","Confident","Creative","Disciplined","Empathetic",
  "Funny","Grounded","Helper","Honest","Joyful","Kind","Leader","Listener","Loyal","Optimist",
  "Patient","Present","Problem Solver","Resilient","Supportive"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Clear","Connected","Content","Energized","Free","Fulfilled","Grateful","Grounded",
  "Inspired","Joyful","Peaceful","Present"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Good Enough","Heard","Respected","Seen","Valued","Wanted"
];

/* Steps */
const STEPS = [
  { key:"welcome", title:"Welcome" },
  { key:"start", title:"Start" },
  { key:"values", title:"Values" },
  { key:"pillars", title:"Pillars" },
  { key:"ideal", title:"Ideal Emotion" },
  { key:"trigger", title:"Trigger" },
  { key:"snapshot", title:"Your Results" },
  { key:"submitted", title:"Submitted" }
];

const DEFAULT_STATE = {
  stepIndex: 0,
  user: { name:"", email:"" },

  values: { candidates: [] },
  pillars: { candidates: [] },

  ideal: { primary:"", desireLevel: 8 },

  trigger: { label:"", comments:"" },

  submit: { status:"idle", message:"" }
};

let state = loadState();

/* Mount */
const elApp = document.getElementById("app");
const elYear = document.getElementById("year");
if (elYear) elYear.textContent = new Date().getFullYear();

const btnReset = document.getElementById("btnReset");
if (btnReset){
  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all answers?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

/* Storage */
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  }catch{
    return structuredClone(DEFAULT_STATE);
  }
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function uniq(arr){ return [...new Set(arr.map(x => String(x).trim()).filter(Boolean))]; }
function removeItem(arr, item){ return arr.filter(x => x !== item); }

function setStep(idx){
  state.stepIndex = clamp(idx, 0, STEPS.length - 1);
  saveState();
  render();
}
function nextStep(){
  if (!canProceed()) return;
  setStep(state.stepIndex + 1);
}
function prevStep(){ setStep(state.stepIndex - 1); }

function progressPercent(){
  const max = STEPS.length - 2; // exclude submitted
  const idx = Math.min(state.stepIndex, max);
  return Math.round((idx / max) * 100);
}

function canProceed(){
  const k = STEPS[state.stepIndex].key;

  if (k === "start") return state.user.name.trim().length > 0;

  if (k === "values"){
    const c = state.values.candidates;
    return c.length >= 3 && c.length <= 6;
  }
  if (k === "pillars"){
    const c = state.pillars.candidates;
    return c.length >= 3 && c.length <= 6;
  }
  if (k === "ideal") return state.ideal.primary.trim().length > 0;
  if (k === "trigger") return state.trigger.label.trim().length > 0;

  return true;
}

function render(){
  const step = STEPS[state.stepIndex];
  elApp.innerHTML = `
    ${renderProgress(step)}
    ${renderStep(step.key)}
    ${renderNav(step.key)}
  `;
  wireNav();
}

function renderProgress(step){
  const pct = progressPercent();
  return `
    <section class="card">
      <div class="kicker">${escapeHtml(step.title)}</div>
      <div class="progressWrap">
        <div class="progressBar"><div class="progressFill" style="width:${pct}%"></div></div>
        <div class="progressMeta">
          <div>${pct}% complete</div>
          <div>${Math.min(state.stepIndex + 1, STEPS.length - 1)} / ${STEPS.length - 1}</div>
        </div>
      </div>
    </section>
  `;
}

function renderNav(key){
  const isSubmitted = key === "submitted";
  const isSnapshot = key === "snapshot";

  const canBack = state.stepIndex > 0 && !isSubmitted;
  const proceed = canProceed();

  return `
    <section class="card">
      <div class="btnrow">
        <button id="btnBack" class="ghost" type="button" ${canBack ? "" : "disabled"}>Back</button>
        ${isSnapshot
          ? `<button id="btnSubmit" class="primary" type="button">Submit Results</button>`
          : isSubmitted
            ? `<button id="btnRestart" class="ghost" type="button">Start Over</button>`
            : `<button id="btnNext" class="primary" type="button" ${proceed ? "" : "disabled"}>Next</button>`
        }
      </div>
      ${(!proceed && !isSubmitted && !isSnapshot) ? `<div class="small">Complete the required items to continue.</div>` : ""}
    </section>
  `;
}

function wireNav(){
  const back = document.getElementById("btnBack");
  const next = document.getElementById("btnNext");
  const submit = document.getElementById("btnSubmit");
  const restart = document.getElementById("btnRestart");

  if (back) back.addEventListener("click", prevStep);
  if (next) next.addEventListener("click", () => { nextStep(); });
  if (submit) submit.addEventListener("click", submitToDana);
  if (restart) restart.addEventListener("click", () => {
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

function renderStep(key){
  switch(key){
    case "welcome": return stepWelcome();
    case "start": return stepStart();
    case "values": return stepValues();
    case "pillars": return stepPillars();
    case "ideal": return stepIdeal();
    case "trigger": return stepTrigger();
    case "snapshot": return stepSnapshot();
    case "submitted": return stepSubmitted();
    default: return `<section class="card"><div class="h1">Missing step</div></section>`;
  }
}

/* Steps */
function stepWelcome(){
  return `
    <section class="card">
      <div class="h1">Welcome</div>
      <p class="p">
        Thank you for taking the WHO Thoughts Assessment™.
        This short exercise helps you identify your Values (guardrails), Pillars (best-self traits),
        Ideal Emotion (your compass), and Trigger (your warning signal).
      </p>
      <div class="notice">
        Take your time. Your results will appear at the end, and you can submit them to receive a copy.
      </div>
    </section>
  `;
}

function stepStart(){
  return `
    <section class="card">
      <div class="h1">Start</div>

      <label class="lbl">Name <span class="small">(required)</span></label>
      <input id="userName" class="txt" placeholder="Your name" value="${escapeHtml(state.user.name)}" />

      <label class="lbl">Email <span class="small">(optional)</span></label>
      <input id="userEmail" class="txt" placeholder="you@email.com" value="${escapeHtml(state.user.email)}" />

      <div class="small" style="margin-top:10px;">
        If you provide an email, Dana can send you a “thank you” message with your results.
      </div>
    </section>
  `;
}

function stepValues(){
  const selected = state.values.candidates;
  return `
    <section class="card">
      <div class="h1">Values</div>
      <p class="p small">Select 3–6 Values. You can also add custom ones.</p>

      <div class="pills">
        ${VALUE_OPTIONS.map(v => pill(v, selected.includes(v), "value")).join("")}
      </div>

      <label class="lbl">Add a custom value (press Enter)</label>
      <input id="addValue" class="txt" placeholder="Type a value and press Enter" />

      <div class="h2">Your selected values</div>
      ${renderSelected(selected, "value")}
      <div class="small">Selected: ${selected.length} / 6</div>
    </section>
  `;
}

function stepPillars(){
  const selected = state.pillars.candidates;
  return `
    <section class="card">
      <div class="h1">Pillars</div>
      <p class="p small">Select 3–6 Pillars that describe you at your best.</p>

      <div class="pills">
        ${PILLAR_OPTIONS.map(v => pill(v, selected.includes(v), "pillar")).join("")}
      </div>

      <label class="lbl">Add a custom pillar (press Enter)</label>
      <input id="addPillar" class="txt" placeholder="Type a pillar and press Enter" />

      <div class="h2">Your selected pillars</div>
      ${renderSelected(selected, "pillar")}
      <div class="small">Selected: ${selected.length} / 6</div>
    </section>
  `;
}

function stepIdeal(){
  return `
    <section class="card">
      <div class="h1">Ideal Emotion</div>
      <p class="p small">Choose the emotion you want to feel most days.</p>

      <label class="lbl">Pick your Ideal Emotion</label>
      <select id="idealPrimary" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(o => `<option ${state.ideal.primary === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      </select>

      <label class="lbl">How strongly do you want to feel this? (1–10)</label>
      <input id="idealDesire" type="range" min="1" max="10" value="${state.ideal.desireLevel}" style="width:100%;" />
      <div class="small">Current: <b>${state.ideal.desireLevel}/10</b></div>
    </section>
  `;
}

function stepTrigger(){
  const label = state.trigger.label;
  return `
    <section class="card">
      <div class="h1">Trigger</div>
      <p class="p small">Pick your “I’m not ___ enough” story.</p>

      <div class="pills">
        ${TRIGGER_OPTIONS.map(t => {
          const full = `I'm not ${t}`;
          return `<button class="pill ${label===full?"on":""}" data-trigger="${escapeHtmlAttr(full)}" type="button">${escapeHtml(full)}</button>`;
        }).join("")}
      </div>

      <label class="lbl">Custom trigger (optional)</label>
      <input id="customTrigger" class="txt" placeholder="Example: I'm not safe / I'm not in control" value="${escapeHtml(label.startsWith("I'm not ") ? "" : label)}" />

      <label class="lbl">Comments (optional)</label>
      <textarea id="comments" class="ta" placeholder="Any notes for Dana…">${escapeHtml(state.trigger.comments)}</textarea>
    </section>
  `;
}

function stepSnapshot(){
  const values = state.values.candidates;
  const pillars = state.pillars.candidates;

  return `
    <section class="card">
      <div class="h1">Your Results</div>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values</h3>
          <ul class="ul">${values.map(li).join("")}</ul>
        </div>
        <div class="snapshotBox">
          <h3>Pillars</h3>
          <ul class="ul">${pillars.map(li).join("")}</ul>
        </div>
        <div class="snapshotBox">
          <h3>Ideal Emotion</h3>
          <ul class="ul">
            ${state.ideal.primary ? `<li>${escapeHtml(state.ideal.primary)} (${state.ideal.desireLevel}/10)</li>` : `<li class="small">Not set.</li>`}
          </ul>
        </div>
        <div class="snapshotBox">
          <h3>Trigger</h3>
          <ul class="ul">
            ${state.trigger.label ? `<li>${escapeHtml(state.trigger.label)}</li>` : `<li class="small">Not set.</li>`}
          </ul>
        </div>
      </div>

      <hr class="sep" />

      <div class="notice">
        <b>Thank you for taking the assessment.</b><br/>
        If you enter an email, Dana can send you a “thank you” message with your results and next steps.
      </div>
    </section>
  `;
}

function stepSubmitted(){
  const ok = state.submit.status === "success";
  const err = state.submit.status === "error";
  return `
    <section class="card">
      <div class="h1">${ok ? "Submitted!" : err ? "Submission Issue" : "Submitting..."}</div>
      <p class="p">${escapeHtml(state.submit.message || "")}</p>
      ${err ? `<div class="small">Most common causes: Google Form restrictions (sign-in required) or wrong URL.</div>` : ""}
    </section>
  `;
}

/* UI helpers */
function pill(text, on, kind){
  return `<button class="pill ${on?"on":""}" data-${kind}="${escapeHtmlAttr(text)}" type="button">${escapeHtml(text)}</button>`;
}

function renderSelected(list, kind){
  if (!list.length) return `<div class="small">None yet.</div>`;
  return `
    <div class="pills">
      ${list.map(x => `
        <span class="tag">
          ${escapeHtml(x)}
          <button class="ghost" type="button"
            style="margin-left:8px; padding:0 6px; border-radius:10px;"
            data-remove="${escapeHtmlAttr(x)}" data-kind="${kind}">×</button>
        </span>
      `).join("")}
    </div>
  `;
}

function li(x){ return `<li>${escapeHtml(x)}</li>`; }

/* =========================
   EVENTS
   - Fixes focus-loss bug
   - Also enables Next live on Start step
   ========================= */

/**
 * Re-render without breaking typing focus:
 * - capture active element + cursor
 * - render on next frame
 * - restore focus + cursor
 */
function rerenderKeepFocus(){
  const active = document.activeElement;
  const activeId = active?.id;
  const isTextField = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");

  let start = null, end = null;
  if (isTextField && typeof active.selectionStart === "number") {
    start = active.selectionStart;
    end = active.selectionEnd;
  }

  requestAnimationFrame(() => {
    render();
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        el.focus();
        if (start !== null && typeof el.setSelectionRange === "function") {
          el.setSelectionRange(start, end ?? start);
        }
      }
    }
  });
}

document.addEventListener("input", (e) => {
  const id = e.target?.id;

  // ✅ START step: update Next button live without losing focus
  if (id === "userName") {
    state.user.name = e.target.value;
    saveState();
    rerenderKeepFocus();
    return;
  }
  if (id === "userEmail") {
    state.user.email = e.target.value;
    saveState();
    rerenderKeepFocus();
    return;
  }

  // ✅ slider can re-render normally
  if (id === "idealDesire") {
    state.ideal.desireLevel = Number(e.target.value);
    saveState();
    render();
    return;
  }

  // ✅ trigger custom + comments: save only (Next enables when you click Next anyway)
  if (id === "customTrigger") {
    const v = e.target.value.trim();
    if (v) state.trigger.label = v;
    saveState();
    return;
  }
  if (id === "comments") {
    state.trigger.comments = e.target.value;
    saveState();
    return;
  }
});

document.addEventListener("change", (e) => {
  const id = e.target?.id;
  if (id === "idealPrimary"){
    state.ideal.primary = e.target.value;
    saveState();
    render();
    return;
  }
});

document.addEventListener("click", (e) => {
  const t = e.target;

  if (t?.dataset?.value){
    toggleSelect("values", t.dataset.value);
    return;
  }

  if (t?.dataset?.pillar){
    toggleSelect("pillars", t.dataset.pillar);
    return;
  }

  if (t?.dataset?.trigger){
    state.trigger.label = t.dataset.trigger;
    saveState();
    render();
    return;
  }

  if (t?.dataset?.remove && t?.dataset?.kind){
    const item = t.dataset.remove;
    const kind = t.dataset.kind;
    if (kind === "value"){
      state.values.candidates = removeItem(state.values.candidates, item);
    } else {
      state.pillars.candidates = removeItem(state.pillars.candidates, item);
    }
    saveState();
    render();
  }
});

document.addEventListener("keydown", (e) => {
  const id = e.target?.id;

  if (id === "addValue" && e.key === "Enter"){
    e.preventDefault();
    addCustom("values", e.target.value);
    e.target.value = "";
    return;
  }
  if (id === "addPillar" && e.key === "Enter"){
    e.preventDefault();
    addCustom("pillars", e.target.value);
    e.target.value = "";
    return;
  }
});

function toggleSelect(section, value){
  const path = section === "values" ? state.values.candidates : state.pillars.candidates;
  const max = 6;

  if (path.includes(value)){
    const next = removeItem(path, value);
    if (section === "values") state.values.candidates = next;
    else state.pillars.candidates = next;
  } else {
    if (path.length >= max) return;
    const next = uniq([...path, value]);
    if (section === "values") state.values.candidates = next;
    else state.pillars.candidates = next;
  }

  saveState();
  render();
}

function addCustom(section, raw){
  const v = String(raw || "").trim();
  if (!v) return;

  const path = section === "values" ? state.values.candidates : state.pillars.candidates;
  if (path.includes(v)) return;
  if (path.length >= 6) return;

  const next = uniq([...path, v]);
  if (section === "values") state.values.candidates = next;
  else state.pillars.candidates = next;

  saveState();
  render();
}

/* Submission */
async function submitToDana(){
  if (!GOOGLE_FORM.enabled) return;

  state.submit = { status:"submitting", message:"Sending your results..." };
  saveState();
  setStep(STEPS.findIndex(s => s.key === "submitted"));

  try{
    const payload = buildPayload();
    await postToGoogleForm(payload);

    state.submit = {
      status:"success",
      message:"Thank you! Your results were submitted successfully."
    };
    saveState();
    render();
  }catch(err){
    console.warn(err);
    state.submit = {
      status:"error",
      message:"Submission failed. Check form restrictions (sign-in required) and try again."
    };
    saveState();
    render();
  }
}

function buildPayload(){
  const values = (state.values.candidates || []).join(", ");
  const pillars = (state.pillars.candidates || []).join(", ");
  const idealEmotion = state.ideal.primary
    ? `${state.ideal.primary} (${state.ideal.desireLevel}/10)`
    : "";

  const trigger = state.trigger.label || "";
  const comments = (state.trigger.comments || "").trim();

  return {
    name: state.user.name.trim(),
    email: state.user.email.trim(),
    values,
    pillars,
    idealEmotion,
    trigger,
    comments
  };
}

async function postToGoogleForm(p){
  const fd = new FormData();
  fd.append(GOOGLE_FORM.entry.name, p.name);
  fd.append(GOOGLE_FORM.entry.email, p.email);
  fd.append(GOOGLE_FORM.entry.values, p.values);
  fd.append(GOOGLE_FORM.entry.pillars, p.pillars);
  fd.append(GOOGLE_FORM.entry.idealEmotion, p.idealEmotion);
  fd.append(GOOGLE_FORM.entry.trigger, p.trigger);
  fd.append(GOOGLE_FORM.entry.comments, p.comments);

  await fetch(GOOGLE_FORM.formResponseUrl, { method:"POST", mode:"no-cors", body: fd });
}

/* Escaping */
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(s){ return escapeHtml(s).replaceAll("\n"," "); }

/* Start */
render();
