/* =========================================================
   WHO Thoughts Assessment™ — Official (Dana Bernstein)
   Single-file app.js for GitHub Pages (no backend)

   ✅ Captures name + email + results into Google Forms/Sheets
   ✅ Smooth typing (NO re-render on each keystroke)
   ✅ Multi-step assessment with snapshot + submit
   ✅ Works on GitHub Pages

   ❌ Does NOT send emails (Dana decided to skip auto-email)

   ---------------------------------------------------------
   REQUIRED:
   - Keep index.html with: <main id="app"></main>
   - Keep a Reset button with id="btnReset" (optional)
   - Ensure this app.js is loaded with defer:
       <script defer src="./app.js?v=1"></script>

   ---------------------------------------------------------
   Google Form mapping (already filled from your prefill link):
   - Name:          entry.2005620554
   - Email:         entry.1045781291
   - Values:        entry.1065046570
   - Pillars:       entry.1010525839
   - Ideal Emotion: entry.1060481030
   - Triggers:      entry.2079481635
   - Comments:      entry.839337160
   ========================================================= */

const STORAGE_KEY = "who_assessment_official_v3";

/* =========================
   GOOGLE FORM CONFIG
   ========================= */
const GOOGLE_FORM = {
  enabled: true,
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

/* =========================
   OPTIONS (edit anytime)
   ========================= */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Compassion","Curiosity","Discipline","Empathy",
  "Excellence","Fairness","Freedom","Growth","Gratitude","Honesty","Impact","Independence",
  "Integrity","Justice","Kindness","Leadership","Loyalty","Love","Open-mindedness","Patience",
  "Peace","Respect","Resilience","Service","Stability","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurous","Bold","Builder","Calm","Caring","Committed","Compassionate","Confident",
  "Creative","Curious","Disciplined","Empathetic","Fun","Grounded","Helper","Humorous",
  "Kind","Leader","Listener","Open-minded","Optimistic","Patient","Playful","Present",
  "Problem Solver","Reliable","Resilient","Respectful","Service-driven","Thoughtful"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Clear","Connected","Content","Energized","Free","Fulfilled","Grateful","Inspired",
  "Joyful","Peaceful","Present","Safe","Steady"
];

const TRIGGER_OPTIONS = [
  "I'm not capable",
  "I'm not enough",
  "I'm not good enough",
  "I'm not heard",
  "I'm not respected",
  "I'm not seen",
  "I'm not valued",
  "I'm not wanted",
];

/* =========================
   STEPS
   ========================= */
const STEPS = [
  { key: "welcome", title: "Welcome" },
  { key: "start", title: "Start" },
  { key: "values_discover", title: "Step 1 of 6: Values (Discover)" },
  { key: "values_pick", title: "Step 2 of 6: Values (Pick 3–6)" },
  { key: "pillars_pick", title: "Step 3 of 6: Pillars (Pick 3–6)" },
  { key: "ideal_emotion", title: "Step 4 of 6: Ideal Emotion" },
  { key: "trigger", title: "Step 5 of 6: Trigger" },
  { key: "snapshot", title: "Step 6 of 6: Snapshot" },
  { key: "submitted", title: "Submitted" },
];

/* =========================
   DEFAULT STATE
   ========================= */
const DEFAULT_STATE = {
  stepIndex: 0,

  user: { name: "", email: "" },

  values: {
    proudMoment: "",
    upsetMoment: "",
    selected: [], // 3–6
  },

  pillars: {
    selected: [], // 3–6
  },

  idealEmotion: {
    selected: "",
  },

  trigger: {
    selected: "",
  },

  comments: "",

  submit: {
    status: "idle", // idle | submitting | success | error
    message: "",
  },
};

let state = loadState();

/* =========================
   DOM HOOKS
   ========================= */
const elApp = document.getElementById("app");

const btnReset = document.getElementById("btnReset");
if (btnReset) {
  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all answers?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

/* =========================
   STORAGE
   ========================= */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

/* =========================
   NAV + VALIDATION
   ========================= */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function setStep(i) {
  state.stepIndex = clamp(i, 0, STEPS.length - 1);
  saveState();
  render();
}
function prevStep() {
  setStep(state.stepIndex - 1);
}
function nextStep() {
  if (!canProceed()) return;
  setStep(state.stepIndex + 1);
}

function canProceed() {
  const k = STEPS[state.stepIndex].key;

  if (k === "start") {
    return state.user.name.trim().length > 0;
  }
  if (k === "values_discover") {
    return state.values.proudMoment.trim().length > 0 || state.values.upsetMoment.trim().length > 0;
  }
  if (k === "values_pick") {
    return state.values.selected.length >= 3 && state.values.selected.length <= 6;
  }
  if (k === "pillars_pick") {
    return state.pillars.selected.length >= 3 && state.pillars.selected.length <= 6;
  }
  if (k === "ideal_emotion") {
    return state.idealEmotion.selected.trim().length > 0;
  }
  if (k === "trigger") {
    return state.trigger.selected.trim().length > 0;
  }
  return true;
}

function progressPercent() {
  const max = STEPS.length - 1; // includes submitted
  return Math.round((state.stepIndex / max) * 100);
}

/* =========================
   RENDER
   ========================= */
function render() {
  const step = STEPS[state.stepIndex];

  elApp.innerHTML = `
    ${renderProgress(step.title)}
    ${renderStep(step.key)}
    ${renderNav(step.key)}
  `;

  wireNavHandlers(step.key);
}

function renderProgress(title) {
  const pct = progressPercent();
  return `
    <section class="card">
      <div class="kicker">${escapeHtml(title)}</div>
      <div class="progressWrap">
        <div class="progressBar"><div class="progressFill" style="width:${pct}%"></div></div>
        <div class="progressMeta">
          <div>${pct}% complete</div>
          <div>${state.stepIndex + 1} / ${STEPS.length}</div>
        </div>
      </div>
    </section>
  `;
}

function renderNav(key) {
  const isSubmitted = key === "submitted";
  const isSnapshot = key === "snapshot";
  const canBack = state.stepIndex > 0 && !isSubmitted;
  const proceed = canProceed();

  return `
    <section class="card">
      <div class="btnrow">
        <button id="btnBack" class="ghost" type="button" ${canBack ? "" : "disabled"}>Back</button>

        ${
          isSnapshot
            ? `<button id="btnSubmit" class="primary" type="button">Submit</button>`
            : !isSubmitted
              ? `<button id="btnNext" class="primary" type="button" ${proceed ? "" : "disabled"}>Next</button>`
              : `<button id="btnRestart" class="ghost" type="button">Start Over</button>`
        }
      </div>

      ${!proceed && !isSnapshot && !isSubmitted ? `<div class="small">Complete this step to continue.</div>` : ""}
    </section>
  `;
}

function wireNavHandlers(key) {
  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnRestart = document.getElementById("btnRestart");

  if (btnBack) btnBack.addEventListener("click", prevStep);
  if (btnNext) btnNext.addEventListener("click", nextStep);

  if (btnSubmit) btnSubmit.addEventListener("click", submitResults);

  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      state = structuredClone(DEFAULT_STATE);
      saveState();
      render();
    });
  }
}

function renderStep(key) {
  switch (key) {
    case "welcome":
      return stepWelcome();
    case "start":
      return stepStart();
    case "values_discover":
      return stepValuesDiscover();
    case "values_pick":
      return stepValuesPick();
    case "pillars_pick":
      return stepPillarsPick();
    case "ideal_emotion":
      return stepIdealEmotion();
    case "trigger":
      return stepTrigger();
    case "snapshot":
      return stepSnapshot();
    case "submitted":
      return stepSubmitted();
    default:
      return `<section class="card"><div class="h1">Missing step</div></section>`;
  }
}

/* =========================
   STEP TEMPLATES
   ========================= */
function stepWelcome() {
  return `
    <section class="card">
      <div class="h1">WHO Thoughts Assessment™</div>
      <p class="p">
        This short assessment helps you identify what drives you at your best — and what pulls you off course.
      </p>
      <p class="p">
        When you submit, your results are saved for review.
      </p>
      <hr class="sep" />
      <p class="p small">Take your time. One step at a time.</p>
    </section>
  `;
}

function stepStart() {
  return `
    <section class="card">
      <div class="h1">Start</div>

      <label class="lbl">Your name <span class="small">(required)</span></label>
      <input id="userName" class="txt" placeholder="Type your name" value="${escapeHtml(state.user.name)}" />

      <label class="lbl">Your email <span class="small">(optional)</span></label>
      <input id="userEmail" class="txt" placeholder="you@email.com" value="${escapeHtml(state.user.email)}" />

      <div class="notice" style="margin-top:12px;">
        Your name and email (if provided) will be stored with your results.
      </div>
    </section>
  `;
}

function stepValuesDiscover() {
  return `
    <section class="card">
      <div class="h1">Values (Discover)</div>
      <p class="p">
        Values show up in moments of pride — and moments of frustration.
      </p>

      <label class="lbl">Proud moment (optional)</label>
      <textarea id="proudMoment" class="ta" placeholder="When were you most proud of yourself?">${escapeHtml(
        state.values.proudMoment
      )}</textarea>

      <label class="lbl">Upset moment (optional)</label>
      <textarea id="upsetMoment" class="ta" placeholder="When were you frustrated/angry?">${escapeHtml(
        state.values.upsetMoment
      )}</textarea>

      <div class="small" style="margin-top:10px;">
        Next, pick 3–6 Values that best represent you.
      </div>
    </section>
  `;
}

function stepValuesPick() {
  return `
    <section class="card">
      <div class="h1">Pick 3–6 Values</div>
      <div class="small">Tap to select. Selected: <b>${state.values.selected.length}</b> / 6</div>

      <div class="pills" style="margin-top:10px;">
        ${VALUE_OPTIONS.map((v) => pill(v, state.values.selected.includes(v), "value")).join("")}
      </div>

      <div style="margin-top:14px;">
        <label class="lbl">Add a custom Value (press Enter)</label>
        <input id="addValue" class="txt" placeholder="Type a Value and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Your Values</div>
        ${renderChosen(state.values.selected, "removeValue")}
      </div>
    </section>
  `;
}

function stepPillarsPick() {
  return `
    <section class="card">
      <div class="h1">Pick 3–6 Pillars</div>
      <div class="small">These are your strengths at your best. Selected: <b>${state.pillars.selected.length}</b> / 6</div>

      <div class="pills" style="margin-top:10px;">
        ${PILLAR_OPTIONS.map((p) => pill(p, state.pillars.selected.includes(p), "pillar")).join("")}
      </div>

      <div style="margin-top:14px;">
        <label class="lbl">Add a custom Pillar (press Enter)</label>
        <input id="addPillar" class="txt" placeholder="Type a Pillar and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Your Pillars</div>
        ${renderChosen(state.pillars.selected, "removePillar")}
      </div>
    </section>
  `;
}

function stepIdealEmotion() {
  return `
    <section class="card">
      <div class="h1">Ideal Emotion</div>
      <p class="p">What do you want to feel most days?</p>

      <select id="idealEmotion" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(
          (o) => `<option value="${escapeHtmlAttr(o)}" ${state.idealEmotion.selected === o ? "selected" : ""}>${escapeHtml(
            o
          )}</option>`
        ).join("")}
      </select>

      <label class="lbl" style="margin-top:14px;">Comments (optional)</label>
      <textarea id="comments" class="ta" placeholder="Anything Dana should know?">${escapeHtml(state.comments)}</textarea>
    </section>
  `;
}

function stepTrigger() {
  return `
    <section class="card">
      <div class="h1">Trigger</div>
      <p class="p">
        This is the thought that shows up when you’re under stress.
      </p>

      <div class="pills">
        ${TRIGGER_OPTIONS.map((t) => pill(t, state.trigger.selected === t, "trigger")).join("")}
      </div>

      <div style="margin-top:14px;">
        <label class="lbl">Custom trigger (optional)</label>
        <input id="customTrigger" class="txt" placeholder="Type your trigger..." value="${
          state.trigger.selected && !TRIGGER_OPTIONS.includes(state.trigger.selected)
            ? escapeHtml(state.trigger.selected)
            : ""
        }" />
        <div class="small">Typing here replaces any selection above.</div>
      </div>
    </section>
  `;
}

function stepSnapshot() {
  const v = state.values.selected;
  const p = state.pillars.selected;

  return `
    <section class="card">
      <div class="h1">Your Snapshot</div>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values</h3>
          <ul class="ul">${v.map(li).join("")}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Pillars</h3>
          <ul class="ul">${p.map(li).join("")}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Ideal Emotion</h3>
          <ul class="ul">${state.idealEmotion.selected ? `<li>${escapeHtml(state.idealEmotion.selected)}</li>` : `<li class="small">—</li>`}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Trigger</h3>
          <ul class="ul">${state.trigger.selected ? `<li>${escapeHtml(state.trigger.selected)}</li>` : `<li class="small">—</li>`}</ul>
        </div>
      </div>

      <hr class="sep" />

      <div class="notice">
        When you click <b>Submit</b>, your results will be saved in Dana’s Google Form responses.
      </div>
    </section>
  `;
}

function stepSubmitted() {
  const s = state.submit;
  const ok = s.status === "success";
  const err = s.status === "error";

  return `
    <section class="card">
      <div class="h1">${ok ? "Submitted" : err ? "Submission Issue" : "Submitting..."}</div>
      <p class="p">
        ${ok ? "Your results were saved successfully." : err ? "We couldn’t submit your results. Try again." : "Sending now..."}
      </p>
      ${s.message ? `<div class="notice">${escapeHtml(s.message)}</div>` : ""}
      ${err ? `<div class="small" style="margin-top:10px;">Most common cause: wrong Google Form URL or entry IDs.</div>` : ""}
    </section>
  `;
}

/* =========================
   INTERACTION (NO focus loss)
   - Input handlers save only (no render)
   - Click handlers render when needed
   ========================= */

document.addEventListener("input", (e) => {
  const id = e.target?.id;

  // ✅ Save-only typing (prevents cursor/focus drop)
if (id === "userName") {
  state.user.name = e.target.value;
  saveState();
  safeRenderKeepFocus(e.target);
  return;
}
if (id === "userEmail") {
  state.user.email = e.target.value;
  saveState();
  safeRenderKeepFocus(e.target);
  return;
}
function safeRenderKeepFocus(activeEl){
  const id = activeEl?.id;
  const start = activeEl?.selectionStart ?? null;
  const end = activeEl?.selectionEnd ?? null;

  render();

  // restore focus + caret
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  if (start !== null && end !== null && typeof el.setSelectionRange === "function"){
    el.setSelectionRange(start, end);
  }
}

  if (id === "proudMoment") { state.values.proudMoment = e.target.value; saveState(); return; }
  if (id === "upsetMoment") { state.values.upsetMoment = e.target.value; saveState(); return; }
  if (id === "comments") { state.comments = e.target.value; saveState(); return; }

  if (id === "customTrigger") {
    const v = e.target.value.trim();
    if (v) state.trigger.selected = v;
    saveState();
    return;
  }
});

document.addEventListener("change", (e) => {
  const id = e.target?.id;

  if (id === "idealEmotion") {
    state.idealEmotion.selected = e.target.value;
    saveState();
    render(); // change affects validation + snapshot
    return;
  }
});

document.addEventListener("click", (e) => {
  const t = e.target;

  // Pills
  if (t?.dataset?.pickType === "value") {
    togglePick(state.values.selected, t.dataset.pick, 6, (arr) => (state.values.selected = arr));
    saveState();
    render();
    return;
  }
  if (t?.dataset?.pickType === "pillar") {
    togglePick(state.pillars.selected, t.dataset.pick, 6, (arr) => (state.pillars.selected = arr));
    saveState();
    render();
    return;
  }
  if (t?.dataset?.pickType === "trigger") {
    state.trigger.selected = t.dataset.pick;
    saveState();
    render();
    return;
  }

  // Remove chips
  if (t?.dataset?.removeValue) {
    state.values.selected = state.values.selected.filter((x) => x !== t.dataset.removeValue);
    saveState();
    render();
    return;
  }
  if (t?.dataset?.removePillar) {
    state.pillars.selected = state.pillars.selected.filter((x) => x !== t.dataset.removePillar);
    saveState();
    render();
    return;
  }
});

document.addEventListener("keydown", (e) => {
  const id = e.target?.id;

  if (id === "addValue" && e.key === "Enter") {
    e.preventDefault();
    const v = String(e.target.value || "").trim();
    if (!v) return;
    if (!state.values.selected.includes(v) && state.values.selected.length < 6) {
      state.values.selected = uniq([...state.values.selected, v]);
      e.target.value = "";
      saveState();
      render();
    }
  }

  if (id === "addPillar" && e.key === "Enter") {
    e.preventDefault();
    const p = String(e.target.value || "").trim();
    if (!p) return;
    if (!state.pillars.selected.includes(p) && state.pillars.selected.length < 6) {
      state.pillars.selected = uniq([...state.pillars.selected, p]);
      e.target.value = "";
      saveState();
      render();
    }
  }
});

/* =========================
   SUBMIT
   ========================= */
async function submitResults() {
  // Validation guard
  if (!canProceed()) return;

  state.submit = { status: "submitting", message: "Sending your results..." };
  saveState();
  setStep(STEPS.findIndex((s) => s.key === "submitted"));

  if (!GOOGLE_FORM.enabled) {
    state.submit = { status: "error", message: "GOOGLE_FORM.enabled is false in app.js." };
    saveState();
    render();
    return;
  }

  try {
    await postToGoogleForm(buildPayload());
    state.submit = { status: "success", message: "" };
    saveState();
    render();
  } catch (err) {
    console.warn(err);
    state.submit = { status: "error", message: "Submission failed. Check formResponseUrl + entry IDs." };
    saveState();
    render();
  }
}

function buildPayload() {
  return {
    name: state.user.name.trim(),
    email: state.user.email.trim(),

    values: state.values.selected.join(", "),
    pillars: state.pillars.selected.join(", "),
    idealEmotion: state.idealEmotion.selected || "",
    triggers: state.trigger.selected || "",
    comments: (state.comments || "").trim(),
  };
}

async function postToGoogleForm(p) {
  const fd = new FormData();

  fd.append(GOOGLE_FORM.entry.name, p.name);
  fd.append(GOOGLE_FORM.entry.email, p.email);
  fd.append(GOOGLE_FORM.entry.values, p.values);
  fd.append(GOOGLE_FORM.entry.pillars, p.pillars);
  fd.append(GOOGLE_FORM.entry.idealEmotion, p.idealEmotion);
  fd.append(GOOGLE_FORM.entry.triggers, p.triggers);
  fd.append(GOOGLE_FORM.entry.comments, p.comments);

  // no-cors is required for Google Forms POST from GitHub Pages
  await fetch(GOOGLE_FORM.formResponseUrl, {
    method: "POST",
    mode: "no-cors",
    body: fd,
  });
}

/* =========================
   HELPERS
   ========================= */
function uniq(arr) {
  return [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
}

function togglePick(current, item, max, setter) {
  const s = new Set(current);
  if (s.has(item)) s.delete(item);
  else {
    if (s.size >= max) return;
    s.add(item);
  }
  setter([...s]);
}

function pill(text, on, type) {
  return `<button class="pill ${on ? "on" : ""}" type="button" data-pick-type="${type}" data-pick="${escapeHtmlAttr(
    text
  )}">${escapeHtml(text)}</button>`;
}

function renderChosen(list, removeKey) {
  if (!list.length) return `<div class="small">None yet.</div>`;
  return `
    <div class="pills">
      ${list
        .map(
          (x) => `
        <span class="tag">
          ${escapeHtml(x)}
          <button class="ghost" type="button" style="margin-left:8px; padding:0 6px; border-radius:10px;"
            data-${removeKey}="${escapeHtmlAttr(x)}" title="Remove">×</button>
        </span>
      `
        )
        .join("")}
    </div>
  `;
}

function li(x) {
  return `<li>${escapeHtml(x)}</li>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtml(s).replaceAll("\n", " ");
}

/* =========================
   BOOT
   ========================= */
render();
