/* =========================================================
   WHO Thoughts Assessment™ — Official (Dana Bernstein)
   PDF-ALIGNED "HOLY TEMPLATE" VERSION

   ✅ Matches PDF steps + road tests
   ✅ Captures Name/Email + final results to Google Form (Sheets)
   ✅ No focus-loss typing bug
   ✅ Next button enables correctly while typing
   ✅ GitHub Pages compatible

   ❌ No auto-email (by Dana decision)

   PDF Source: "The list to have coded" :contentReference[oaicite:1]{index=1}
   ========================================================= */

const STORAGE_KEY = "who_assessment_official_pdf_v1";

/* =========================
   GOOGLE FORM CONFIG
   (from your prefilled link)
   ========================= */
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

/* =========================
   OPTIONS (from PDF)
   ========================= */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient","Empathy",
  "Ethics","Excellence","Fairness","Gratitude","Honesty","Impact","Independence","Inclusivity",
  "Integrity","Justice","Kind","Loyalty","Open Mind","Perseverance","Reliability","Resilience",
  "Respect","Self-Reliance","Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection",
  "Connector","Considerate","Creative","Earthy","Empathy","Explorer","Faith","Family","Fierce","Fun",
  "Goofy","Grounded","Gratitude","Helper","Humor","Introspective","Impact","Kind","Laughter","Limitless",
  "Listener","Love","Nerdy","Open Mind","Optimist","Passion","Patient","Peace","Playful","Present",
  "Problem Solver","Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "I'm not Capable",
  "I'm not Enough",
  "I'm not Fast Enough",
  "I'm not Good Enough",
  "I'm not Heard",
  "I'm not Listened to",
  "I'm not Respected",
  "I'm not Seen",
  "I'm not Smart Enough",
  "I'm not Valued",
  "I'm not Wanted",
];

/* =========================
   STEPS (PDF aligned)
   ========================= */
const STEPS = [
  { key: "welcome", title: "Welcome" },                 // PDF Page 1
  { key: "define", title: "Define Your WHO" },          // PDF Page 2
  { key: "start", title: "Start" },                     // PDF Page 3
  { key: "values_discover", title: "Step 1 of 6: Values (Discover)" },  // PDF Page 4
  { key: "values_pick", title: "Values: Candidate List" },              // PDF Page 4
  { key: "values_roadtest", title: "Step 2 of 6: Values (Road Test)" },  // PDF Page 4
  { key: "pillars_discover", title: "Step 3 of 6: Pillars (Discover)" }, // PDF Page 5
  { key: "pillars_pick", title: "Pillars: Candidate List" },             // PDF Page 5
  { key: "pillars_roadtest", title: "Step 4 of 6: Pillars (Road Test)" },// PDF Page 6
  { key: "ideal_emotion", title: "Step 5 of 6: Ideal Emotion" },         // PDF Page 6
  { key: "trigger", title: "Step 6 of 6: Trigger" },                      // PDF Page 7
  { key: "snapshot", title: "Your WHO Snapshot" },                        // PDF Page 8
  { key: "submitted", title: "Submitted" },
];

const DEFAULT_STATE = {
  stepIndex: 0,
  user: { name: "", email: "", wantsEmail: false },

  values: {
    proudMoment: "",
    proudWhy: "",
    upsetMoment: "",
    upsetWhy: "",
    candidates: [],      // 3–6 selected + customs
    roadtest: {},        // {valueName: "yes"|"no"}
    confirmed: [],       // yes
  },

  pillars: {
    bestMoment: "",
    candidates: [],      // 3–6 selected + customs
    roadtest1: {},       // {pillarName: "yes"|"no"}  yes => move to values
    movedToValues: [],   // from roadtest1 yes
    remainingAfter1: [], // computed
    roadtest2: {},       // {pillarName: "yes"|"no"}  yes => keep as pillar
    confirmed: [],       // after roadtest2 yes
  },

  idealEmotion: {
    primary: "",
    desire: 8,       // 1–10
    secondary: "",
  },

  trigger: {
    selected: "",
    feeling: "",
    resetScript: "",
  },

  comments: "",

  submit: { status: "idle", message: "" },
};

let state = loadState();

/* =========================
   DOM
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
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* =========================
   NAV / VALIDATION
   ========================= */
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function setStep(i) {
  state.stepIndex = clamp(i, 0, STEPS.length - 1);
  saveState();
  render();
}
function prevStep() { setStep(state.stepIndex - 1); }
function nextStep() { if (!canProceed()) return; setStep(state.stepIndex + 1); }

function canProceed() {
  const k = STEPS[state.stepIndex].key;

  if (k === "start") return state.user.name.trim().length > 0;

  if (k === "values_discover") {
    // PDF: they can proceed even if optional; but typically they fill something.
    // We'll allow Next always here (no blockage).
    return true;
  }

  if (k === "values_pick") {
    return state.values.candidates.length >= 3 && state.values.candidates.length <= 6;
  }

  if (k === "values_roadtest") {
    // must have answered yes/no for each candidate
    const c = state.values.candidates;
    return c.length > 0 && c.every(v => state.values.roadtest[v] === "yes" || state.values.roadtest[v] === "no");
  }

  if (k === "pillars_discover") return true;

  if (k === "pillars_pick") {
    return state.pillars.candidates.length >= 3 && state.pillars.candidates.length <= 6;
  }

  if (k === "pillars_roadtest") {
    const c = state.pillars.candidates;
    if (!(c.length > 0 && c.every(p => state.pillars.roadtest1[p] === "yes" || state.pillars.roadtest1[p] === "no"))) return false;

    // remaining after test 1:
    const remaining = c.filter(p => state.pillars.roadtest1[p] === "no");
    // must answer test2 for remaining
    return remaining.every(p => state.pillars.roadtest2[p] === "yes" || state.pillars.roadtest2[p] === "no");
  }

  if (k === "ideal_emotion") return (state.idealEmotion.primary || "").trim().length > 0;

  if (k === "trigger") return (state.trigger.selected || "").trim().length > 0;

  return true;
}

function progressPercent() {
  const max = STEPS.length - 1;
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

function wireNavHandlers() {
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
    case "welcome": return stepWelcome();
    case "define": return stepDefine();
    case "start": return stepStart();
    case "values_discover": return stepValuesDiscover();
    case "values_pick": return stepValuesPick();
    case "values_roadtest": return stepValuesRoadTest();
    case "pillars_discover": return stepPillarsDiscover();
    case "pillars_pick": return stepPillarsPick();
    case "pillars_roadtest": return stepPillarsRoadTest();
    case "ideal_emotion": return stepIdealEmotion();
    case "trigger": return stepTrigger();
    case "snapshot": return stepSnapshot();
    case "submitted": return stepSubmitted();
    default: return `<section class="card"><div class="h1">Missing step</div></section>`;
  }
}

/* =========================
   STEPS (PDF text)
   ========================= */

function stepWelcome() {
  return `
    <section class="card">
      <div class="h1">Thank you for taking the WHO Thoughts Assessment™.</div>
      <p class="p">
        Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self,
        and recognize the thoughts that quietly pull you off course.
      </p>
      <p class="p">
        When your nervous system is regulated, you are powerful. You respond instead of react. You choose instead of spiral.
      </p>
      <p class="p">
        Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve drifted from your WHO and knowing how to return.
      </p>
      <p class="p">
        My goal is to help you uncover and celebrate the best parts of what make you you — the strengths and natural qualities that already exist within you —
        and show you how to use them to move through conflict with clarity and confidence.
      </p>
      <p class="p">
        The WHO Thoughts Assessment™ is your invitation to reflect, reconnect, and reclaim the thoughts that shape your life.
      </p>
      <div class="small">— Dana Lynn Bernstein, PMP, PCC · The Conflict Resolution Coach</div>
    </section>
  `;
}

function stepDefine() {
  return `
    <section class="card">
      <div class="h1">Define Your WHO</div>
      <p class="p">
        Your WHO is defined by:
      </p>
      <ul class="ul">
        <li><b>Values</b> — Your guardrails</li>
        <li><b>Pillars</b> — Your energy source</li>
        <li><b>Ideal Emotion</b> — Your compass</li>
        <li><b>Trigger</b> — Your warning signal</li>
      </ul>
      <p class="p">
        Conflict happens when you believe your WHO has been threatened.
      </p>
      <p class="p">
        In 6 steps, you’ll identify Values, Pillars, Ideal Emotion, and Trigger.
      </p>
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

      <label class="chkline" style="margin-top:10px;">
        <input id="wantsEmail" type="checkbox" ${state.user.wantsEmail ? "checked" : ""} />
        <span>Email my results and bonus content. Email is optional.</span>
      </label>

      <div class="notice" style="margin-top:12px;">
        Your name and email (if provided) will be stored with your results.
      </div>
    </section>
  `;
}

function stepValuesDiscover() {
  return `
    <section class="card">
      <div class="h1">Step 1 of 6: Values (Discover)</div>
      <p class="p">There are two ways to uncover your Values: (1) what you’re proud of, and (2) what makes you upset.</p>

      <div class="h2">Prompt A: Proud Moment</div>
      <label class="lbl">At any point in your life, when were you most proud of yourself?</label>
      <textarea id="proudMoment" class="ta" placeholder="Example: I accomplished...">${escapeHtml(state.values.proudMoment)}</textarea>

      <label class="lbl">Why were you proud?</label>
      <textarea id="proudWhy" class="ta" placeholder="Example: I overcame the obstacles by...">${escapeHtml(state.values.proudWhy)}</textarea>

      <hr class="sep" />

      <div class="h2">Prompt B: Upset / Anger / Frustrated Moment</div>
      <label class="lbl">When were you most angry, frustrated, or furious (person or situation)?</label>
      <textarea id="upsetMoment" class="ta" placeholder="Example: When someone said/did...">${escapeHtml(state.values.upsetMoment)}</textarea>

      <label class="lbl">What exactly bothered you / why did it bother you?</label>
      <textarea id="upsetWhy" class="ta" placeholder="Example: They were not being transparent, respectful...">${escapeHtml(state.values.upsetWhy)}</textarea>

      <div class="small" style="margin-top:10px;">
        Next, build your Values candidate list (pick 3–6).
      </div>
    </section>
  `;
}

function stepValuesPick() {
  return `
    <section class="card">
      <div class="h1">Build your Values candidate list</div>
      <p class="p">Tap to select 3–6 Values OR add custom ones. We’ll road-test next.</p>

      <div class="small">Selected: <b>${state.values.candidates.length}</b> / 6</div>

      <div class="pills" style="margin-top:10px;">
        ${VALUE_OPTIONS.map((v) => pill(v, state.values.candidates.includes(v), "valueCandidate")).join("")}
      </div>

      <div style="margin-top:14px;">
        <label class="lbl">Add a candidate (press Enter)</label>
        <input id="addValueCandidate" class="txt" placeholder="Type a Value and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Current candidates</div>
        ${renderChosen(state.values.candidates, "removeValueCandidate")}
      </div>
    </section>
  `;
}

function stepValuesRoadTest() {
  const c = state.values.candidates;
  const confirmed = c.filter(v => state.values.roadtest[v] === "yes");
  const removed = c.filter(v => state.values.roadtest[v] === "no");
  state.values.confirmed = confirmed;

  return `
    <section class="card">
      <div class="h1">Step 2 of 6: Values (Road Test)</div>
      <p class="p">Road test each candidate. Values, when crossed, evoke an emotion.</p>
      <div class="small"><b>YES</b> = it’s a Value (keep) · <b>NO</b> = not a Value (remove)</div>

      <div class="table" style="margin-top:12px;">
        ${c.map(v => roadRow(v, "valuesRoad", state.values.roadtest[v])).join("")}
      </div>

      <hr class="sep" />

      <div class="h2">Live results</div>
      <div class="grid2">
        <div class="snapshotBox">
          <h3>Confirmed Values</h3>
          ${confirmed.length ? `<ul class="ul">${confirmed.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>
        <div class="snapshotBox">
          <h3>Removed</h3>
          ${removed.length ? `<ul class="ul">${removed.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>
      </div>

      <div class="notice" style="margin-top:12px;">
        Practical Application: By identifying these candidates, you can more easily de-escalate your emotions.
      </div>
    </section>
  `;
}

function stepPillarsDiscover() {
  return `
    <section class="card">
      <div class="h1">Step 3 of 6: Pillars (Discover)</div>
      <p class="p">
        Pillars are positive core characteristics that describe you at your best (not tied to accomplishment).
        You are great as you are!
      </p>

      <label class="lbl">When were you your happiest and most YOU? (Where / with who / doing what?)</label>
      <textarea id="bestMoment" class="ta" placeholder="Example: Hiking in the woods...">${escapeHtml(state.pillars.bestMoment)}</textarea>

      <div class="small" style="margin-top:10px;">
        Next, pick 3–6 Pillars that describe you at your best.
      </div>
    </section>
  `;
}

function stepPillarsPick() {
  return `
    <section class="card">
      <div class="h1">Pillar candidates</div>
      <p class="p">Tap to select 3–6 Pillars OR add custom ones. We’ll road-test next.</p>

      <div class="small">Selected: <b>${state.pillars.candidates.length}</b> / 6</div>

      <div class="pills" style="margin-top:10px;">
        ${PILLAR_OPTIONS.map((p) => pill(p, state.pillars.candidates.includes(p), "pillarCandidate")).join("")}
      </div>

      <div style="margin-top:14px;">
        <label class="lbl">Add Pillar candidates (add a trait, then press Enter)</label>
        <input id="addPillarCandidate" class="txt" placeholder="Type a Pillar and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Current candidates</div>
        ${renderChosen(state.pillars.candidates, "removePillarCandidate")}
      </div>
    </section>
  `;
}

function stepPillarsRoadTest() {
  const c = state.pillars.candidates;

  const movedToValues = c.filter(p => state.pillars.roadtest1[p] === "yes");
  const remaining = c.filter(p => state.pillars.roadtest1[p] === "no");

  state.pillars.movedToValues = movedToValues;
  state.pillars.remainingAfter1 = remaining;

  const confirmedPillars = remaining.filter(p => state.pillars.roadtest2[p] === "yes");
  state.pillars.confirmed = confirmedPillars;

  return `
    <section class="card">
      <div class="h1">Step 4 of 6: Pillars (Road Test)</div>

      <div class="h2">Road Test 1</div>
      <div class="small">If someone crosses this characteristic, do you get angry/frustrated/upset?</div>
      <div class="small"><b>YES</b> = Move to Values · <b>NO</b> = Keep as a Pillar</div>

      <div class="table" style="margin-top:12px;">
        ${c.map(p => roadRow(p, "pillarsRoad1", state.pillars.roadtest1[p], "YES=Move to Values")).join("")}
      </div>

      <hr class="sep" />

      <div class="h2">Road Test 2</div>
      <div class="small">If you took these characteristics away, would you be a shell of yourself?</div>
      <div class="small"><b>YES</b> = Keep as a Pillar · <b>NO</b> = Remove</div>

      <div class="table" style="margin-top:12px;">
        ${remaining.length
          ? remaining.map(p => roadRow(p, "pillarsRoad2", state.pillars.roadtest2[p])).join("")
          : `<div class="small">No remaining Pillars to test.</div>`
        }
      </div>

      <hr class="sep" />

      <div class="h2">Live results</div>
      <div class="grid2">
        <div class="snapshotBox">
          <h3>Confirmed Pillars</h3>
          ${confirmedPillars.length ? `<ul class="ul">${confirmedPillars.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>
        <div class="snapshotBox">
          <h3>Moved to Values</h3>
          ${movedToValues.length ? `<ul class="ul">${movedToValues.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>
      </div>

      <div class="notice" style="margin-top:12px;">
        Practical Application: Lead from your unique strengths.
      </div>
    </section>
  `;
}

function stepIdealEmotion() {
  return `
    <section class="card">
      <div class="h1">Step 5 of 6: Ideal Emotion</div>
      <p class="p">Your Ideal Emotion is what you want to feel each day (it’s ok to have 2).</p>

      <label class="lbl">Pick one (or your closest)</label>
      <select id="idealPrimary" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(o =>
          `<option value="${escapeHtmlAttr(o)}" ${state.idealEmotion.primary === o ? "selected" : ""}>${escapeHtml(o)}</option>`
        ).join("")}
      </select>

      <label class="lbl" style="margin-top:14px;">How much do you want to feel your Ideal Emotion? (1–10)</label>
      <input id="idealDesire" type="range" min="1" max="10" value="${Number(state.idealEmotion.desire || 8)}" />
      <div class="small">Current: <b>${Number(state.idealEmotion.desire || 8)}/10</b></div>

      <label class="lbl" style="margin-top:14px;">If you have two Ideal Emotions, list the second one (optional)</label>
      <input id="idealSecondary" class="txt" placeholder="Second Ideal Emotion" value="${escapeHtml(state.idealEmotion.secondary)}" />

      <div class="notice" style="margin-top:12px;">
        Practical Application: Use your Ideal Emotion as a compass to determine choices and responses.
      </div>
    </section>
  `;
}

function stepTrigger() {
  return `
    <section class="card">
      <div class="h1">Step 6 of 6: Trigger (Anti-WHO)</div>
      <p class="p">
        Your Trigger is one loud “I’m not...” story that surfaces when you feel under pressure.
      </p>

      <div class="pills">
        ${TRIGGER_OPTIONS.map(t => pill(t, state.trigger.selected === t, "triggerPick")).join("")}
      </div>

      <label class="lbl" style="margin-top:14px;">Or add a custom one</label>
      <input id="customTrigger" class="txt" placeholder="I'm not..." value="${escapeHtml(
        state.trigger.selected && !TRIGGER_OPTIONS.includes(state.trigger.selected) ? state.trigger.selected : ""
      )}" />

      <label class="lbl" style="margin-top:14px;">Name how it makes you feel (optional)</label>
      <input id="triggerFeeling" class="txt" placeholder="Demoralized, anxious, small..." value="${escapeHtml(state.trigger.feeling)}" />

      <label class="lbl" style="margin-top:14px;">Optional Reset Script (simple plan)</label>
      <textarea id="resetScript" class="ta" placeholder="That’s my Trigger talking. I’m choosing [Pillar] and honoring [Value].">${escapeHtml(state.trigger.resetScript)}</textarea>

      <label class="lbl" style="margin-top:14px;">Comments (optional)</label>
      <textarea id="comments" class="ta" placeholder="Anything Dana should know?">${escapeHtml(state.comments)}</textarea>
    </section>
  `;
}

function stepSnapshot() {
  // per PDF snapshot
  const confirmedValues = state.values.confirmed || [];
  const confirmedPillars = state.pillars.confirmed || [];
  const movedToValues = state.pillars.movedToValues || [];

  const allValuesFinal = uniq([...confirmedValues, ...movedToValues]);

  return `
    <section class="card">
      <div class="h1">Your WHO Snapshot</div>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values — Your guardrails</h3>
          ${allValuesFinal.length ? `<ul class="ul">${allValuesFinal.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>

        <div class="snapshotBox">
          <h3>Pillars — Your energy source</h3>
          ${confirmedPillars.length ? `<ul class="ul">${confirmedPillars.map(li).join("")}</ul>` : `<div class="small">—</div>`}
        </div>

        <div class="snapshotBox">
          <h3>Ideal Emotion — Your compass</h3>
          <ul class="ul">
            ${state.idealEmotion.primary ? `<li>${escapeHtml(state.idealEmotion.primary)} (target: ${Number(state.idealEmotion.desire || 8)}/10)</li>` : `<li class="small">—</li>`}
            ${state.idealEmotion.secondary ? `<li>${escapeHtml(state.idealEmotion.secondary)}</li>` : ""}
          </ul>
        </div>

        <div class="snapshotBox">
          <h3>Trigger — Your warning signal</h3>
          <ul class="ul">
            ${state.trigger.selected ? `<li>${escapeHtml(state.trigger.selected)}</li>` : `<li class="small">—</li>`}
          </ul>
        </div>
      </div>

      <div class="notice" style="margin-top:12px;">
        Refine over time. Awareness builds self-command.
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
   INPUT / CLICK HANDLERS
   - We re-render on typing BUT keep focus/caret
   ========================= */

document.addEventListener("input", (e) => {
  const id = e.target?.id;

  // Start
  if (id === "userName") { state.user.name = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "userEmail") { state.user.email = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }

  // Values discover
  if (id === "proudMoment") { state.values.proudMoment = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "proudWhy") { state.values.proudWhy = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "upsetMoment") { state.values.upsetMoment = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "upsetWhy") { state.values.upsetWhy = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }

  // Pillars discover
  if (id === "bestMoment") { state.pillars.bestMoment = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }

  // Ideal emotion
  if (id === "idealSecondary") { state.idealEmotion.secondary = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }

  // Trigger
  if (id === "customTrigger") {
    const v = e.target.value.trim();
    if (v) state.trigger.selected = v;
    saveState();
    safeRenderKeepFocus(e.target);
    return;
  }
  if (id === "triggerFeeling") { state.trigger.feeling = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "resetScript") { state.trigger.resetScript = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
  if (id === "comments") { state.comments = e.target.value; saveState(); safeRenderKeepFocus(e.target); return; }
});

document.addEventListener("change", (e) => {
  const id = e.target?.id;

  if (id === "wantsEmail") {
    state.user.wantsEmail = !!e.target.checked;
    saveState();
    render();
    return;
  }

  if (id === "idealPrimary") {
    state.idealEmotion.primary = e.target.value;
    saveState();
    render();
    return;
  }

  if (id === "idealDesire") {
    state.idealEmotion.desire = Number(e.target.value);
    saveState();
    render();
    return;
  }
});

document.addEventListener("click", (e) => {
  const t = e.target;

  // Values candidate pills
  if (t?.dataset?.pickType === "valueCandidate") {
    togglePick("values");
    return;
  }

  // Pillars candidate pills
  if (t?.dataset?.pickType === "pillarCandidate") {
    togglePick("pillars");
    return;
  }

  // Trigger pick
  if (t?.dataset?.pickType === "triggerPick") {
    state.trigger.selected = t.dataset.pick;
    saveState();
    render();
    return;
  }

  // Remove chips
  if (t?.dataset?.removeValueCandidate) {
    state.values.candidates = state.values.candidates.filter(x => x !== t.dataset.removeValueCandidate);
    delete state.values.roadtest[t.dataset.removeValueCandidate];
    saveState();
    render();
    return;
  }
  if (t?.dataset?.removePillarCandidate) {
    state.pillars.candidates = state.pillars.candidates.filter(x => x !== t.dataset.removePillarCandidate);
    delete state.pillars.roadtest1[t.dataset.removePillarCandidate];
    delete state.pillars.roadtest2[t.dataset.removePillarCandidate];
    saveState();
    render();
    return;
  }

  // Road test buttons
  if (t?.dataset?.roadGroup === "valuesRoad") {
    const label = t.dataset.label;
    const ans = t.dataset.ans;
    state.values.roadtest[label] = ans;
    saveState();
    render();
    return;
  }

  if (t?.dataset?.roadGroup === "pillarsRoad1") {
    const label = t.dataset.label;
    const ans = t.dataset.ans;
    state.pillars.roadtest1[label] = ans;
    saveState();
    render();
    return;
  }

  if (t?.dataset?.roadGroup === "pillarsRoad2") {
    const label = t.dataset.label;
    const ans = t.dataset.ans;
    state.pillars.roadtest2[label] = ans;
    saveState();
    render();
    return;
  }
});

document.addEventListener("keydown", (e) => {
  const id = e.target?.id;

  if (id === "addValueCandidate" && e.key === "Enter") {
    e.preventDefault();
    const v = String(e.target.value || "").trim();
    if (!v) return;
    if (!state.values.candidates.includes(v) && state.values.candidates.length < 6) {
      state.values.candidates = uniq([...state.values.candidates, v]);
      e.target.value = "";
      saveState();
      render();
    }
  }

  if (id === "addPillarCandidate" && e.key === "Enter") {
    e.preventDefault();
    const p = String(e.target.value || "").trim();
    if (!p) return;
    if (!state.pillars.candidates.includes(p) && state.pillars.candidates.length < 6) {
      state.pillars.candidates = uniq([...state.pillars.candidates, p]);
      e.target.value = "";
      saveState();
      render();
    }
  }
});

/* =========================
   TOGGLE PICK (3–6 max)
   ========================= */
function togglePick(which) {
  const t = event.target;
  const label = t.dataset.pick;
  const max = 6;

  if (which === "values") {
    const set = new Set(state.values.candidates);
    if (set.has(label)) set.delete(label);
    else { if (set.size >= max) return; set.add(label); }
    state.values.candidates = [...set];
    saveState();
    render();
  }

  if (which === "pillars") {
    const set = new Set(state.pillars.candidates);
    if (set.has(label)) set.delete(label);
    else { if (set.size >= max) return; set.add(label); }
    state.pillars.candidates = [...set];
    saveState();
    render();
  }
}

/* =========================
   SUBMIT (to Google Form)
   ========================= */
async function submitResults() {
  state.submit = { status: "submitting", message: "Saving your results..." };
  saveState();
  setStep(STEPS.findIndex(s => s.key === "submitted"));

  try {
    const payload = buildPayloadForForm();
    await postToGoogleForm(payload);
    state.submit = { status: "success", message: "" };
    saveState();
    render();
  } catch (err) {
    console.warn(err);
    state.submit = { status: "error", message: "Submission failed. Check Google Form mapping." };
    saveState();
    render();
  }
}

function buildPayloadForForm() {
  const confirmedValues = state.values.confirmed || [];
  const movedToValues = state.pillars.movedToValues || [];
  const finalValues = uniq([...confirmedValues, ...movedToValues]);
  const confirmedPillars = state.pillars.confirmed || [];

  const idealLine = `${state.idealEmotion.primary || ""} (target: ${Number(state.idealEmotion.desire || 8)}/10)` +
    (state.idealEmotion.secondary ? `; Second: ${state.idealEmotion.secondary}` : "");

  const triggerLine =
    `${state.trigger.selected || ""}` +
    (state.trigger.feeling ? ` | Feeling: ${state.trigger.feeling}` : "") +
    (state.trigger.resetScript ? ` | Reset: ${state.trigger.resetScript}` : "");

  return {
    name: state.user.name.trim(),
    email: state.user.email.trim(),
    values: finalValues.join(", "),
    pillars: confirmedPillars.join(", "),
    idealEmotion: idealLine.trim(),
    triggers: triggerLine.trim(),
    comments: (state.comments || "").trim(),
  };
}

async function postToGoogleForm(p) {
  if (!GOOGLE_FORM.enabled) throw new Error("GOOGLE_FORM disabled");

  const fd = new FormData();
  fd.append(GOOGLE_FORM.entry.name, p.name);
  fd.append(GOOGLE_FORM.entry.email, p.email);
  fd.append(GOOGLE_FORM.entry.values, p.values);
  fd.append(GOOGLE_FORM.entry.pillars, p.pillars);
  fd.append(GOOGLE_FORM.entry.idealEmotion, p.idealEmotion);
  fd.append(GOOGLE_FORM.entry.triggers, p.triggers);
  fd.append(GOOGLE_FORM.entry.comments, p.comments);

  await fetch(GOOGLE_FORM.formResponseUrl, {
    method: "POST",
    mode: "no-cors",
    body: fd,
  });
}

/* =========================
   UI HELPERS
   ========================= */
function pill(text, on, type) {
  return `<button class="pill ${on ? "on" : ""}" type="button" data-pick-type="${type}" data-pick="${escapeHtmlAttr(text)}">${escapeHtml(text)}</button>`;
}

function renderChosen(list, removeKey) {
  if (!list.length) return `<div class="small">None yet.</div>`;
  return `
    <div class="pills">
      ${list.map(x => `
        <span class="tag">
          ${escapeHtml(x)}
          <button class="ghost" type="button" style="margin-left:8px; padding:0 6px; border-radius:10px;"
            data-${removeKey}="${escapeHtmlAttr(x)}" title="Remove">×</button>
        </span>
      `).join("")}
    </div>
  `;
}

function roadRow(label, group, current, yesHint = "") {
  const yesOn = current === "yes";
  const noOn = current === "no";

  return `
    <div class="roadRow">
      <div class="roadLabel">${escapeHtml(label)}</div>
      <div class="roadQ">If someone violates this, do you feel upset / angry / frustrated?</div>
      <div class="roadBtns">
        <button type="button" class="pill ${yesOn ? "on" : ""}" data-road-group="${group}" data-label="${escapeHtmlAttr(label)}" data-ans="yes">YES</button>
        <button type="button" class="pill ${noOn ? "on" : ""}" data-road-group="${group}" data-label="${escapeHtmlAttr(label)}" data-ans="no">NO</button>
      </div>
    </div>
  `;
}

function li(x) { return `<li>${escapeHtml(x)}</li>`; }

function uniq(arr) {
  return [...new Set(arr.map(x => String(x).trim()).filter(Boolean))];
}

/* Prevent the old "1 character then focus drops" bug */
function safeRenderKeepFocus(activeEl) {
  const id = activeEl?.id;
  const start = activeEl?.selectionStart ?? null;
  const end = activeEl?.selectionEnd ?? null;

  render();

  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  if (start !== null && end !== null && typeof el.setSelectionRange === "function") {
    el.setSelectionRange(start, end);
  }
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
