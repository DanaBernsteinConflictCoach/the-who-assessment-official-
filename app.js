/* =========================================================
   WHO Assessment — app.js (FULL REPLACEMENT)
   Fixes:
   - “typing 1 char then stops” (no full re-render on input)
   - Google Form submission via formResponse (Option B)
   Notes:
   - Uses your entry IDs from the prefill URL you pasted.
   - If Dana changes the Google Form, entry IDs may change.
   ========================================================= */

/** =======================
 *  1) CONFIG (EDIT THESE)
 *  ======================= */

// Google Form "formResponse" endpoint (IMPORTANT: formResponse, not viewform)
const GOOGLE_FORM = {
  // From your live form id:
  // https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform
  // formResponse endpoint:
  formResponseUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/formResponse",

  // Entry IDs (from your prefill URL)
  entries: {
    name: "entry.2005620554",
    email: "entry.1045781291",
    values: "entry.1065046570",
    pillars: "entry.1010525839",
    idealEmotion: "entry.1060481030",
    trigger: "entry.2079481635",
    comments: "entry.839337160",
  },

  // Optional: where to send Dana a copy (ONLY if you later add Apps Script)
  coachEmail: "",
};

const STORAGE_KEY = "who_assessment_official_v2";

/** =======================
 *  2) WORD BANKS
 *  ======================= */

const VALUE_BANK = [
  "Health","Freedom","Growth","Family","Friendship","Love","Discipline","Adventure","Curiosity",
  "Creativity","Faith","Integrity","Mastery","Stability","Wealth","Impact","Service","Leadership",
  "Peace","Joy","Authenticity","Courage","Excellence","Humor","Gratitude","Patience","Empathy",
  "Justice","Balance","Resilience","Trust","Loyalty","Accountability","Confidence","Kindness"
];

const PILLAR_BANK = [
  "Body","Mind","Relationships","Work/Craft","Money","Faith/Spirit","Home/Environment","Fun/Play",
  "Learning","Community","Routine","Adventure","Creativity","Rest","Nutrition","Movement"
];

const TRIGGER_BANK = [
  "I'm not Capable",
  "I'm not Enough",
  "I'm not Important",
  "I'm not Safe",
  "I'm not Loved",
  "I'm not Respected",
  "I'm Trapped",
  "I'm Failing",
  "I'm Being Judged",
  "I'm Being Controlled"
];

const IDEAL_EMOTION_BANK = [
  "Peace","Confidence","Joy","Freedom","Calm","Love","Gratitude","Happiness","Courage","Clarity"
];

/** =======================
 *  3) STATE
 *  ======================= */

const DEFAULT_STATE = {
  step: 0,

  user: { name: "", email: "" },

  // Values section
  values: {
    proudMoment: "",
    upsetMoment: "",
    selected: [], // 3–6
    notes: "",
  },

  // Pillars section
  pillars: {
    bestMoment: "",
    selected: [], // 1–3
    notes: "",
  },

  // Ideal emotion
  idealEmotion: {
    label: "",
    desireLevel: 7, // 1–10
    why: "",
  },

  // Trigger
  trigger: {
    selected: "",
    response: "",
    notes: "",
  },

  // Final
  comments: "",
  submitStatus: { ok: false, error: "" },
};

let state = loadState();

/** =======================
 *  4) BOOT
 *  ======================= */

const elApp = document.getElementById("app");

document.addEventListener("DOMContentLoaded", () => {
  render();
  wireGlobal();
});

/** =======================
 *  5) RENDER
 *  ======================= */

function render() {
  // Render ONLY when step changes / buttons pressed (not on every keystroke)
  const totalSteps = 6; // 0..5
  const pct = Math.round(((state.step + 1) / totalSteps) * 100);

  elApp.innerHTML = `
    <section class="container">
      ${progressCard(pct, state.step + 1, totalSteps)}
      ${stepCard()}
      ${navCard()}
    </section>
  `;

  // After render, wire step-specific handlers
  wireStep();
  updateNavDisabled();
}

function progressCard(pct, current, total) {
  return `
    <div class="card progressCard">
      <div class="progressTop">
        <div class="progressLabel">${labelForStep(state.step)}</div>
        <div class="progressCount">${current} / ${total}</div>
      </div>
      <div class="progressBar">
        <div class="progressFill" style="width:${pct}%"></div>
      </div>
      <div class="progressMeta">${pct}% complete</div>
    </div>
  `;
}

function labelForStep(step) {
  switch (step) {
    case 0: return "START";
    case 1: return "VALUES";
    case 2: return "PILLARS";
    case 3: return "IDEAL EMOTION";
    case 4: return "TRIGGER";
    case 5: return "YOUR WHO SNAPSHOT";
    default: return "WHO";
  }
}

function stepCard() {
  switch (state.step) {
    case 0: return stepStart();
    case 1: return stepValues();
    case 2: return stepPillars();
    case 3: return stepIdealEmotion();
    case 4: return stepTrigger();
    case 5: return stepSnapshot();
    default: return stepStart();
  }
}

function navCard() {
  const isFirst = state.step === 0;
  const isLast = state.step === 5;

  return `
    <div class="card navCard">
      <button class="btn btnGhost" id="btnBack" ${isFirst ? "disabled" : ""}>Back</button>
      <div class="navHint" id="navHint">Complete this step to continue.</div>
      <button class="btn btnPrimary" id="btnNext">${isLast ? "Submit" : "Next"}</button>
    </div>
  `;
}

/** =======================
 *  6) STEP MARKUP
 *  ======================= */

function stepStart() {
  return `
    <div class="card">
      <h1>Start</h1>
      <p class="muted">Define your WHO</p>

      <div class="field">
        <label>Your name <span class="req">(required)</span></label>
        <input id="userName" class="input" type="text" value="${escapeAttr(state.user.name)}" placeholder="Your name" />
      </div>

      <div class="field">
        <label>Your email <span class="muted">(optional)</span></label>
        <input id="userEmail" class="input" type="email" value="${escapeAttr(state.user.email)}" placeholder="you@email.com" />
      </div>

      <div class="callout">
        Your name and email (if provided) will be stored with your results.
      </div>
    </div>
  `;
}

function stepValues() {
  return `
    <div class="card">
      <h1>Values (Discover)</h1>
      <p class="muted">Values show up in moments of pride — and moments of frustration.</p>

      <div class="field">
        <label>Proud moment <span class="muted">(optional)</span></label>
        <textarea id="proudMoment" class="textarea" rows="3" placeholder="Describe a moment you felt proud...">${escapeHtml(state.values.proudMoment)}</textarea>
      </div>

      <div class="field">
        <label>Upset moment <span class="muted">(optional)</span></label>
        <textarea id="upsetMoment" class="textarea" rows="3" placeholder="Describe a moment you felt upset...">${escapeHtml(state.values.upsetMoment)}</textarea>
      </div>

      <hr class="hr"/>

      <h2>Pick 3–6 Values</h2>
      <div class="field">
        <input id="valueSearch" class="input" type="text" placeholder="Search values..." />
      </div>

      <div class="pillGrid" id="valueBank">
        ${renderPills(VALUE_BANK, state.values.selected, "value")}
      </div>

      <div class="selectedLine">
        <strong>Selected:</strong> <span id="valueSelected">${escapeHtml(state.values.selected.join(", ")) || "None yet"}</span>
      </div>

      <div class="field">
        <label>Notes <span class="muted">(optional)</span></label>
        <textarea id="valuesNotes" class="textarea" rows="2" placeholder="Any notes about your values...">${escapeHtml(state.values.notes)}</textarea>
      </div>

      <p class="muted">Next, we’ll choose the pillars that fuel your energy.</p>
    </div>
  `;
}

function stepPillars() {
  return `
    <div class="card">
      <h1>Pillars (Discover)</h1>
      <p class="muted">Pillars are the areas of life that power you when you invest in them.</p>

      <div class="field">
        <label>Best moment recently <span class="muted">(optional)</span></label>
        <textarea id="bestMoment" class="textarea" rows="3" placeholder="Describe a moment you felt at your best...">${escapeHtml(state.pillars.bestMoment)}</textarea>
      </div>

      <hr class="hr"/>

      <h2>Pick 1–3 Pillars</h2>
      <div class="field">
        <input id="pillarSearch" class="input" type="text" placeholder="Search pillars..." />
      </div>

      <div class="pillGrid" id="pillarBank">
        ${renderPills(PILLAR_BANK, state.pillars.selected, "pillar")}
      </div>

      <div class="selectedLine">
        <strong>Selected:</strong> <span id="pillarSelected">${escapeHtml(state.pillars.selected.join(", ")) || "None yet"}</span>
      </div>

      <div class="field">
        <label>Notes <span class="muted">(optional)</span></label>
        <textarea id="pillarsNotes" class="textarea" rows="2" placeholder="Any notes about your pillars...">${escapeHtml(state.pillars.notes)}</textarea>
      </div>
    </div>
  `;
}

function stepIdealEmotion() {
  const label = state.idealEmotion.label || "";
  const level = Number(state.idealEmotion.desireLevel || 7);

  return `
    <div class="card">
      <h1>Ideal Emotion</h1>
      <p class="muted">This is your compass — what you’re ultimately trying to feel more often.</p>

      <h2>Choose one</h2>
      <div class="pillGrid" id="emotionBank">
        ${renderPills(IDEAL_EMOTION_BANK, label ? [label] : [], "emotion", true)}
      </div>

      <div class="field">
        <label>Target intensity (1–10)</label>
        <input id="idealLevel" class="range" type="range" min="1" max="10" value="${level}" />
        <div class="rangeMeta"><span>1</span><strong id="idealLevelLabel">${level}/10</strong><span>10</span></div>
      </div>

      <div class="field">
        <label>Why this emotion? <span class="muted">(optional)</span></label>
        <textarea id="idealWhy" class="textarea" rows="3" placeholder="What would change if you felt this more often?">${escapeHtml(state.idealEmotion.why)}</textarea>
      </div>
    </div>
  `;
}

function stepTrigger() {
  return `
    <div class="card">
      <h1>Trigger</h1>
      <p class="muted">Your trigger is your warning signal — the story your mind tells in tense moments.</p>

      <h2>Pick one</h2>
      <div class="pillGrid" id="triggerBank">
        ${renderPills(TRIGGER_BANK, state.trigger.selected ? [state.trigger.selected] : [], "trigger", true)}
      </div>

      <div class="field">
        <label>Best response when this trigger shows up <span class="muted">(optional)</span></label>
        <textarea id="triggerResponse" class="textarea" rows="3" placeholder="What would you like to say/do instead?">${escapeHtml(state.trigger.response)}</textarea>
      </div>

      <div class="field">
        <label>Notes <span class="muted">(optional)</span></label>
        <textarea id="triggerNotes" class="textarea" rows="2" placeholder="Anything else about this trigger...">${escapeHtml(state.trigger.notes)}</textarea>
      </div>
    </div>
  `;
}

function stepSnapshot() {
  const values = state.values.selected;
  const pillars = state.pillars.selected;
  const ideal = state.idealEmotion.label ? `${state.idealEmotion.label} (target: ${state.idealEmotion.desireLevel}/10)` : "";
  const trig = state.trigger.selected || "";

  return `
    <div class="card">
      <h1>Your WHO Snapshot</h1>

      <div class="grid2">
        <div class="miniCard">
          <h3>Values — Your guardrails</h3>
          <ul>${values.map(v => `<li>${escapeHtml(v)}</li>`).join("") || `<li class="muted">None selected</li>`}</ul>
        </div>

        <div class="miniCard">
          <h3>Pillars — Your energy source</h3>
          <ul>${pillars.map(p => `<li>${escapeHtml(p)}</li>`).join("") || `<li class="muted">None selected</li>`}</ul>
        </div>

        <div class="miniCard">
          <h3>Ideal Emotion — Your compass</h3>
          <ul>${ideal ? `<li>${escapeHtml(ideal)}</li>` : `<li class="muted">Not selected</li>`}</ul>
        </div>

        <div class="miniCard">
          <h3>Trigger — Your warning signal</h3>
          <ul>${trig ? `<li>${escapeHtml(trig)}</li>` : `<li class="muted">Not selected</li>`}</ul>
        </div>
      </div>

      <div class="callout">
        Refine over time. Awareness builds self-command.
      </div>

      <div class="field">
        <label>Any final comments? <span class="muted">(optional)</span></label>
        <textarea id="finalComments" class="textarea" rows="3" placeholder="Anything you want Dana to know...">${escapeHtml(state.comments)}</textarea>
      </div>

      ${
        state.submitStatus.error
          ? `<div class="errorBox"><strong>Submission Issue</strong><div>${escapeHtml(state.submitStatus.error)}</div></div>`
          : ""
      }
      ${
        state.submitStatus.ok
          ? `<div class="successBox"><strong>Submitted</strong><div>Your results were saved successfully.</div></div>`
          : ""
      }
    </div>
  `;
}

/** =======================
 *  7) WIRING (EVENTS)
 *  ======================= */

function wireGlobal() {
  // Reset button in your header (if present)
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", hardReset);
}

function wireStep() {
  const back = document.getElementById("btnBack");
  const next = document.getElementById("btnNext");
  if (back) back.addEventListener("click", goBack);
  if (next) next.addEventListener("click", goNextOrSubmit);

  // Step-specific input handlers — IMPORTANT:
  // We update state + save, BUT do NOT call render() on every keystroke.
  // That prevents the “one character then stops typing” bug.
  switch (state.step) {
    case 0:
      wireInput("userName", v => (state.user.name = v));
      wireInput("userEmail", v => (state.user.email = v));
      break;

    case 1:
      wireTextArea("proudMoment", v => (state.values.proudMoment = v));
      wireTextArea("upsetMoment", v => (state.values.upsetMoment = v));
      wireTextArea("valuesNotes", v => (state.values.notes = v));
      wireSearchFilter("valueSearch", "valueBank", VALUE_BANK, state.values.selected, "value");
      wirePillClicks("valueBank", "value", (label) => toggleMulti(state.values.selected, label, 6));
      break;

    case 2:
      wireTextArea("bestMoment", v => (state.pillars.bestMoment = v));
      wireTextArea("pillarsNotes", v => (state.pillars.notes = v));
      wireSearchFilter("pillarSearch", "pillarBank", PILLAR_BANK, state.pillars.selected, "pillar");
      wirePillClicks("pillarBank", "pillar", (label) => toggleMulti(state.pillars.selected, label, 3));
      break;

    case 3:
      wireTextArea("idealWhy", v => (state.idealEmotion.why = v));
      const range = document.getElementById("idealLevel");
      if (range) {
        range.addEventListener("input", (e) => {
          state.idealEmotion.desireLevel = Number(e.target.value || 7);
          saveState();
          const lbl = document.getElementById("idealLevelLabel");
          if (lbl) lbl.textContent = `${state.idealEmotion.desireLevel}/10`;
          updateNavDisabled();
        });
      }
      wirePillClicks("emotionBank", "emotion", (label) => {
        state.idealEmotion.label = label;
        saveState();
        // For single-select pills we *do* re-render that step (safe)
        render();
      });
      break;

    case 4:
      wireTextArea("triggerResponse", v => (state.trigger.response = v));
      wireTextArea("triggerNotes", v => (state.trigger.notes = v));
      wirePillClicks("triggerBank", "trigger", (label) => {
        state.trigger.selected = label;
        saveState();
        render();
      });
      break;

    case 5:
      wireTextArea("finalComments", v => (state.comments = v));
      break;
  }

  updateNavDisabled();
}

function wireInput(id, setter) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", (e) => {
    setter(e.target.value);
    saveState();
    updateNavDisabled(); // just enable/disable buttons, no rerender
  });
}

function wireTextArea(id, setter) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", (e) => {
    setter(e.target.value);
    saveState();
    // do NOT re-render
    updateNavDisabled();
  });
}

function wirePillClicks(containerId, type, onPick) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.addEventListener("click", (e) => {
    const btn = e.target.closest(`[data-pill-type="${type}"]`);
    if (!btn) return;
    const label = btn.getAttribute("data-pill-label");
    if (!label) return;

    onPick(label);

    // For multi-selects, update selected line without full rerender
    if (type === "value") {
      const line = document.getElementById("valueSelected");
      if (line) line.textContent = state.values.selected.join(", ") || "None yet";
      // update pill active states in-place
      btn.classList.toggle("pillActive");
    }
    if (type === "pillar") {
      const line = document.getElementById("pillarSelected");
      if (line) line.textContent = state.pillars.selected.join(", ") || "None yet";
      btn.classList.toggle("pillActive");
    }

    saveState();
    updateNavDisabled();
  });
}

function wireSearchFilter(inputId, containerId, bank, selectedArr, type) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  if (!input || !container) return;

  input.addEventListener("input", () => {
    const q = (input.value || "").trim().toLowerCase();
    const filtered = q ? bank.filter(x => x.toLowerCase().includes(q)) : bank;
    container.innerHTML = renderPills(filtered, selectedArr, type);
  });
}

/** =======================
 *  8) NAV / VALIDATION
 *  ======================= */

function canContinue() {
  switch (state.step) {
    case 0:
      return (state.user.name || "").trim().length > 0;

    case 1:
      return state.values.selected.length >= 3 && state.values.selected.length <= 6;

    case 2:
      return state.pillars.selected.length >= 1 && state.pillars.selected.length <= 3;

    case 3:
      return (state.idealEmotion.label || "").trim().length > 0;

    case 4:
      return (state.trigger.selected || "").trim().length > 0;

    case 5:
      // allow submit if everything earlier is valid
      return true;

    default:
      return false;
  }
}

function updateNavDisabled() {
  const next = document.getElementById("btnNext");
  const hint = document.getElementById("navHint");
  if (!next || !hint) return;

  const ok = canContinue();

  // On final step, keep enabled (submit), but show issues if earlier invalid
  if (state.step === 5) {
    next.disabled = false;
    hint.textContent = "Review and submit.";
    return;
  }

  next.disabled = !ok;

  hint.textContent = ok ? "Ready." : "Complete this step to continue.";
}

function goBack() {
  if (state.step <= 0) return;
  state.step -= 1;
  saveState();
  render();
}

async function goNextOrSubmit() {
  // If disabled, do nothing
  const next = document.getElementById("btnNext");
  if (next && next.disabled) return;

  // Clear submit messages when navigating
  state.submitStatus.ok = false;
  state.submitStatus.error = "";
  saveState();

  if (state.step < 5) {
    state.step += 1;
    saveState();
    render();
    return;
  }

  // Submit
  await submitToGoogleForm();
  saveState();
  render();
}

/** =======================
 *  9) SUBMISSION (OPTION B)
 *  ======================= */

async function submitToGoogleForm() {
  // Basic validation before submit
  if ((state.user.name || "").trim().length === 0) {
    state.submitStatus.ok = false;
    state.submitStatus.error = "Name is required.";
    return;
  }
  if (state.values.selected.length < 3) {
    state.submitStatus.ok = false;
    state.submitStatus.error = "Please select at least 3 values.";
    return;
  }
  if (state.pillars.selected.length < 1) {
    state.submitStatus.ok = false;
    state.submitStatus.error = "Please select at least 1 pillar.";
    return;
  }
  if (!state.idealEmotion.label) {
    state.submitStatus.ok = false;
    state.submitStatus.error = "Please select an ideal emotion.";
    return;
  }
  if (!state.trigger.selected) {
    state.submitStatus.ok = false;
    state.submitStatus.error = "Please select a trigger.";
    return;
  }

  // Build FormData for Google Forms
  const fd = new FormData();

  fd.append(GOOGLE_FORM.entries.name, state.user.name.trim());
  fd.append(GOOGLE_FORM.entries.email, (state.user.email || "").trim());

  // Combine into strings
  fd.append(GOOGLE_FORM.entries.values, state.values.selected.join(", "));
  fd.append(GOOGLE_FORM.entries.pillars, state.pillars.selected.join(", "));
  fd.append(
    GOOGLE_FORM.entries.idealEmotion,
    `${state.idealEmotion.label} (target: ${state.idealEmotion.desireLevel}/10)`
  );
  fd.append(GOOGLE_FORM.entries.trigger, state.trigger.selected);

  // Comments: combine all narrative text
  const combinedComments = [
    state.values.proudMoment ? `Proud moment: ${state.values.proudMoment}` : "",
    state.values.upsetMoment ? `Upset moment: ${state.values.upsetMoment}` : "",
    state.pillars.bestMoment ? `Best moment: ${state.pillars.bestMoment}` : "",
    state.idealEmotion.why ? `Why ideal emotion: ${state.idealEmotion.why}` : "",
    state.trigger.response ? `Trigger response: ${state.trigger.response}` : "",
    state.trigger.notes ? `Trigger notes: ${state.trigger.notes}` : "",
    state.values.notes ? `Values notes: ${state.values.notes}` : "",
    state.pillars.notes ? `Pillars notes: ${state.pillars.notes}` : "",
    state.comments ? `Final comments: ${state.comments}` : "",
  ].filter(Boolean).join("\n\n");

  fd.append(GOOGLE_FORM.entries.comments, combinedComments);

  try {
    // no-cors: browser won’t show success/failure, but it WILL send it.
    await fetch(GOOGLE_FORM.formResponseUrl, {
      method: "POST",
      mode: "no-cors",
      body: fd,
    });

    // Because no-cors is “blind”, we assume success.
    state.submitStatus.ok = true;
    state.submitStatus.error = "";
  } catch (err) {
    state.submitStatus.ok = false;
    state.submitStatus.error =
      "Submission failed. Check Google Form URL and entry IDs.";
  }
}

/** =======================
 *  10) HELPERS
 *  ======================= */

function renderPills(list, selected, type, singleSelect = false) {
  const selectedSet = new Set(selected || []);
  return list.map(label => {
    const active = selectedSet.has(label) ? "pillActive" : "";
    return `
      <button
        type="button"
        class="pill ${active}"
        data-pill-type="${type}"
        data-pill-label="${escapeAttr(label)}"
        aria-pressed="${active ? "true" : "false"}"
      >${escapeHtml(label)}</button>
    `;
  }).join("");
}

// Multi-select toggle with max cap
function toggleMulti(arr, label, max) {
  const idx = arr.indexOf(label);
  if (idx >= 0) {
    arr.splice(idx, 1);
    return;
  }
  if (arr.length >= max) return;
  arr.push(label);
}

// Storage
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULT_STATE), parsed);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
function hardReset() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(DEFAULT_STATE);
  render();
}

// Merge helper
function deepMerge(base, incoming) {
  if (typeof incoming !== "object" || incoming === null) return base;
  for (const k of Object.keys(incoming)) {
    const v = incoming[k];
    if (Array.isArray(v)) base[k] = v.slice();
    else if (typeof v === "object" && v !== null) base[k] = deepMerge(base[k] ?? {}, v);
    else base[k] = v;
  }
  return base;
}

// Escape
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("\n", " ");
}
