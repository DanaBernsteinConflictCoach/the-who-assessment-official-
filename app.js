/* ==========================
   WHO Assessment (Official)
   Bulletproof Nav (event delegation)
   + Google Form submission (Dana)
   ========================== */

const STORAGE_KEY = "who_assessment_official_v4"; // bump to avoid stale localStorage

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
    trigger: "entry.2079481635",
    comments: "entry.839337160",
  },
};

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

const TRIGGER_OPTIONS = ["Capable","Enough","Good Enough","Heard","Respected","Seen","Valued","Wanted"];

const STEPS = [
  { key: "welcome", title: "Welcome" },
  { key: "start", title: "Start" },
  { key: "values", title: "Values" },
  { key: "pillars", title: "Pillars" },
  { key: "ideal", title: "Ideal Emotion" },
  { key: "trigger", title: "Trigger" },
  { key: "snapshot", title: "Your Results" },
  { key: "submitted", title: "Submitted" },
];

const DEFAULT_STATE = {
  stepIndex: 0,
  user: { name: "", email: "" },
  values: { candidates: [] },
  pillars: { candidates: [] },
  ideal: { primary: "", desireLevel: 8 },
  trigger: { label: "", comments: "" },
  submit: { status: "idle", message: "" },
};

let state = loadState();

/* Mount */
const elApp = document.getElementById("app");
const elYear = document.getElementById("year");
if (elYear) elYear.textContent = new Date().getFullYear();

const btnReset = document.getElementById("btnReset");
if (btnReset) {
  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all answers?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

/* Storage */
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function uniq(arr) {
  return [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
}
function removeItem(arr, item) {
  return arr.filter((x) => x !== item);
}

/* ✅ Always sync Start step values from DOM (autofill-safe, event-safe) */
function syncStartFromDOM() {
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  if (nameEl) state.user.name = nameEl.value || "";
  if (emailEl) state.user.email = emailEl.value || "";
}

function setStep(idx) {
  state.stepIndex = clamp(idx, 0, STEPS.length - 1);
  saveState();
  render();
}

function currentKey() {
  return STEPS[state.stepIndex].key;
}

function canProceed() {
  const k = currentKey();

  if (k === "start") {
    syncStartFromDOM();
    return state.user.name.trim().length > 0;
  }

  if (k === "values") {
    const c = state.values.candidates;
    return c.length >= 3 && c.length <= 6;
  }

  if (k === "pillars") {
    const c = state.pillars.candidates;
    return c.length >= 3 && c.length <= 6;
  }

  if (k === "ideal") return state.ideal.primary.trim().length > 0;
  if (k === "trigger") return state.trigger.label.trim().length > 0;

  return true;
}

function nextStep() {
  // sync first in case we are on start
  if (currentKey() === "start") syncStartFromDOM();

  if (!canProceed()) return;

  setStep(state.stepIndex + 1);
}
function prevStep() {
  setStep(state.stepIndex - 1);
}

function progressPercent() {
  const max = STEPS.length - 2;
  const idx = Math.min(state.stepIndex, max);
  return Math.round((idx / max) * 100);
}

/* Render */
function render() {
  const step = STEPS[state.stepIndex];
  const pct = progressPercent();

  const proceed = canProceed();
  const key = step.key;

  elApp.innerHTML = `
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

    ${renderStep(step.key)}

    <section class="card">
      <div class="btnrow">
        <button id="btnBack" class="ghost" type="button" ${state.stepIndex > 0 && key !== "submitted" ? "" : "disabled"}>Back</button>

        ${
          key === "snapshot"
            ? `<button id="btnSubmit" class="primary" type="button">Submit Results</button>`
            : key === "submitted"
              ? `<button id="btnRestart" class="ghost" type="button">Start Over</button>`
              : `<button id="btnNext" class="primary" type="button" ${proceed ? "" : "disabled"}>Next</button>`
        }
      </div>

      ${
        (!proceed && key !== "snapshot" && key !== "submitted")
          ? `<div class="small">${key === "start" ? "Enter your name to continue." : "Complete the required items to continue."}</div>`
          : ""
      }

      <div class="small" style="margin-top:10px; opacity:.75;">
        Debug: step=${escapeHtml(step.key)} proceed=${proceed ? "true" : "false"}
      </div>
    </section>
  `;
}

function renderStep(key) {
  switch (key) {
    case "welcome":
      return `
        <section class="card">
          <div class="h1">Welcome</div>
          <p class="p">
            Thank you for taking the WHO Thoughts Assessment™. This short exercise helps you identify your
            Values (guardrails), Pillars (best-self traits), Ideal Emotion (your compass), and Trigger (your warning signal).
          </p>
          <div class="notice">
            Take your time. Your results will appear at the end, and you can submit them to receive a copy.
          </div>
        </section>
      `;

    case "start":
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

    case "values":
      return pickStep("Values", "value", VALUE_OPTIONS, state.values.candidates, "addValue", "Add a custom value (press Enter)");

    case "pillars":
      return pickStep("Pillars", "pillar", PILLAR_OPTIONS, state.pillars.candidates, "addPillar", "Add a custom pillar (press Enter)");

    case "ideal":
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

    case "trigger":
      return `
        <section class="card">
          <div class="h1">Trigger</div>
          <p class="p small">Pick your “I’m not ___ enough” story.</p>

          <div class="pills">
            ${TRIGGER_OPTIONS.map(t => {
              const full = `I'm not ${t}`;
              return `<button class="pill ${state.trigger.label === full ? "on" : ""}" data-trigger="${escapeHtmlAttr(full)}" type="button">${escapeHtml(full)}</button>`;
            }).join("")}
          </div>

          <label class="lbl">Custom trigger (optional)</label>
          <input id="customTrigger" class="txt" placeholder="Example: I'm not safe / I'm not in control"
            value="${escapeHtml(state.trigger.label.startsWith("I'm not ") ? "" : state.trigger.label)}" />

          <label class="lbl">Comments (optional)</label>
          <textarea id="comments" class="ta" placeholder="Any notes for Dana…">${escapeHtml(state.trigger.comments)}</textarea>
        </section>
      `;

    case "snapshot":
      return `
        <section class="card">
          <div class="h1">Your Results</div>

          <div class="snapshot">
            <div class="snapshotBox">
              <h3>Values</h3>
              <ul class="ul">${state.values.candidates.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
            </div>
            <div class="snapshotBox">
              <h3>Pillars</h3>
              <ul class="ul">${state.pillars.candidates.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
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

    case "submitted":
      return `
        <section class="card">
          <div class="h1">${state.submit.status === "success" ? "Submitted!" : state.submit.status === "error" ? "Submission Issue" : "Submitting..."}</div>
          <p class="p">${escapeHtml(state.submit.message || "")}</p>
        </section>
      `;

    default:
      return `<section class="card"><div class="h1">Missing step</div></section>`;
  }
}

function pickStep(title, kind, options, selected, addId, addLabel) {
  return `
    <section class="card">
      <div class="h1">${escapeHtml(title)}</div>
      <p class="p small">Select 3–6. Click again to unselect.</p>

      <div class="pills">
        ${options.map(v => `<button class="pill ${selected.includes(v) ? "on" : ""}" data-${kind}="${escapeHtmlAttr(v)}" type="button">${escapeHtml(v)}</button>`).join("")}
      </div>

      <label class="lbl">${escapeHtml(addLabel)}</label>
      <input id="${addId}" class="txt" placeholder="Type and press Enter" />

      <div class="small">Selected: ${selected.length} / 6</div>
    </section>
  `;
}

/* =========================
   EVENT DELEGATION
   ========================= */

document.addEventListener("click", (e) => {
  const target = e.target;

  // NAV
  if (target?.id === "btnNext") return nextStep();
  if (target?.id === "btnBack") return prevStep();
  if (target?.id === "btnRestart") {
    state = structuredClone(DEFAULT_STATE);
    saveState();
    return render();
  }
  if (target?.id === "btnSubmit") return submitToDana();

  // PICK PILLS
  if (target?.dataset?.value) return togglePick("values", target.dataset.value);
  if (target?.dataset?.pillar) return togglePick("pillars", target.dataset.pillar);
  if (target?.dataset?.trigger) {
    state.trigger.label = target.dataset.trigger;
    saveState();
    return render();
  }
});

document.addEventListener("input", (e) => {
  const id = e.target?.id;

  // keep state updated for non-start steps
  if (id === "idealDesire") {
    state.ideal.desireLevel = Number(e.target.value);
    saveState();
    return render();
  }

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

  // start fields: sync but don't force re-render on every keystroke
  if (id === "userName" || id === "userEmail") {
    syncStartFromDOM();
    saveState();
  }
});

document.addEventListener("change", (e) => {
  if (e.target?.id === "idealPrimary") {
    state.ideal.primary = e.target.value;
    saveState();
    render();
  }
});

document.addEventListener("keydown", (e) => {
  const id = e.target?.id;

  if (id === "addValue" && e.key === "Enter") {
    e.preventDefault();
    addCustom("values", e.target.value);
    e.target.value = "";
  }
  if (id === "addPillar" && e.key === "Enter") {
    e.preventDefault();
    addCustom("pillars", e.target.value);
    e.target.value = "";
  }
});

function togglePick(section, value) {
  const list = section === "values" ? state.values.candidates : state.pillars.candidates;

  if (list.includes(value)) {
    const next = removeItem(list, value);
    if (section === "values") state.values.candidates = next;
    else state.pillars.candidates = next;
  } else {
    if (list.length >= 6) return;
    const next = uniq([...list, value]);
    if (section === "values") state.values.candidates = next;
    else state.pillars.candidates = next;
  }

  saveState();
  render();
}

function addCustom(section, raw) {
  const v = String(raw || "").trim();
  if (!v) return;

  const list = section === "values" ? state.values.candidates : state.pillars.candidates;
  if (list.length >= 6) return;
  if (list.includes(v)) return;

  const next = uniq([...list, v]);
  if (section === "values") state.values.candidates = next;
  else state.pillars.candidates = next;

  saveState();
  render();
}

/* =========================
   SUBMISSION
   ========================= */

async function submitToDana() {
  if (!GOOGLE_FORM.enabled) return;

  syncStartFromDOM();
  saveState();

  state.submit = { status: "submitting", message: "Sending your results..." };
  saveState();
  setStep(STEPS.findIndex((s) => s.key === "submitted"));

  try {
    const payload = buildPayload();
    await postToGoogleForm(payload);

    state.submit = { status: "success", message: "Thank you! Your results were submitted successfully." };
    saveState();
    render();
  } catch (err) {
    console.warn(err);
    state.submit = {
      status: "error",
      message: "Submission failed. Check Google Form restrictions (sign-in required) and try again.",
    };
    saveState();
    render();
  }
}

function buildPayload() {
  syncStartFromDOM();

  const values = (state.values.candidates || []).join(", ");
  const pillars = (state.pillars.candidates || []).join(", ");
  const idealEmotion = state.ideal.primary ? `${state.ideal.primary} (${state.ideal.desireLevel}/10)` : "";

  return {
    name: state.user.name.trim(),
    email: state.user.email.trim(),
    values,
    pillars,
    idealEmotion,
    trigger: state.trigger.label || "",
    comments: (state.trigger.comments || "").trim(),
  };
}

async function postToGoogleForm(p) {
  const fd = new FormData();
  fd.append(GOOGLE_FORM.entry.name, p.name);
  fd.append(GOOGLE_FORM.entry.email, p.email);
  fd.append(GOOGLE_FORM.entry.values, p.values);
  fd.append(GOOGLE_FORM.entry.pillars, p.pillars);
  fd.append(GOOGLE_FORM.entry.idealEmotion, p.idealEmotion);
  fd.append(GOOGLE_FORM.entry.trigger, p.trigger);
  fd.append(GOOGLE_FORM.entry.comments, p.comments);

  await fetch(GOOGLE_FORM.formResponseUrl, { method: "POST", mode: "no-cors", body: fd });
}

/* Escaping */
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

/* Start */
render();
