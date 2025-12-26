/**
 * WHO Thoughts Assessment — Golden Rule Build
 * GOLDEN RULE: If a word/option is not in the PDF, it must not exist in the code.
 * Word banks below are copied from the PDF and must not be expanded. :contentReference[oaicite:1]{index=1}
 */

const STORAGE_KEY = "who_assessment_official_pdf_only_v1";

/** If you want the final step to open a prefilled Google Form: */
const GOOGLE_FORM_PREFILL_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform?usp=pp_url";

/** Entry IDs (from your prefill URL you shared previously). Change only if your form changes. */
const FORM_FIELDS = {
  name: "entry.2005620554",
  email: "entry.1045781291",
  values: "entry.1065046570",
  pillars: "entry.1010525839",
  ideal1: "entry.1060481030",
  // If you add a second ideal emotion in the form, put that entry id here:
  ideal2: "entry.1234567890",
  idealRating: "entry.2345678901",
  trigger: "entry.2079481635",
  triggerFeel: "entry.3456789012",
  resetScript: "entry.4567890123",
  comments: "entry.839337160",
};

/* =========================
   PDF WORD BANKS (ONLY)
   ========================= */

/** Values word bank from PDF. :contentReference[oaicite:2]{index=2} */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er",
  "Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty",
  "Impact","Independence","Inclusivity","Integrity","Justice","Kind","Loyalty",
  "Open Mind","Perseverance","Reliability","Resilience","Respect","Self-Reliance",
  "Service","Structure","Transparency"
];

/** Pillars word bank from PDF. :contentReference[oaicite:3]{index=3} */
const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Considerate","Creative","Earthy","Empathy","Explorer",
  "Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor",
  "Introspective","Impact","Kind","Laughter","Limitless","Listener","Love","Nerdy",
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present",
  "Problem Solver","Sarcastic","Service"
];

/** Ideal Emotion list from PDF. :contentReference[oaicite:4]{index=4} */
const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present",
  "Serenity"
];

/** Trigger list from PDF. :contentReference[oaicite:5]{index=5} */
const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart Enough","Valued","Wanted"
];

/* =========================
   STATE
   ========================= */

const DEFAULT_STATE = {
  name: "",
  email: "",
  emailOptIn: false,

  // Values (Step 1) + custom additions
  valueCandidates: [],  // user selected + custom typed
  valueCustomInput: "",
  proudMoment: "",
  proudWhy: "",
  upsetMoment: "",
  upsetWhy: "",

  // Values road test (Step 2)
  valueRoad: {},        // { value: "YES"|"NO" }
  confirmedValues: [],

  // Pillars (Step 3) + custom additions
  pillarsCandidates: [],
  pillarCustomInput: "",
  happiestMoment: "",
  pillarsRoad1: {},     // { pillar: "YES"|"NO" }  YES => move to values, NO => keep as pillar candidate
  movedToValues: [],
  pillarsRoad2: {},     // { pillar: "YES"|"NO" }  YES keep, NO remove
  confirmedPillars: [],

  // Ideal Emotion (Step 5)
  idealEmotion1: "",
  idealEmotion2: "",
  idealEmotionRating: 8, // default target-ish
  idealEmotion2Custom: "",

  // Trigger (Step 6)
  trigger: "",
  triggerCustom: "",
  triggerFeel: "",
  resetScript: "",

  // Optional comments
  comments: ""
};

let state = loadState();
let stepIndex = 0;

/* =========================
   STEPS (PDF FLOW)
   ========================= */

const STEPS = [
  {
    key: "welcome",
    title: "Welcome",
    hint:
      "Thank you for taking the WHO Thoughts Assessment™. One exercise per screen. Quick clarity. No fluff."
  },
  {
    key: "define",
    title: "Define Your WHO",
    hint:
      "Your WHO is defined by Values (guardrails), Pillars (energy source), Ideal Emotion (compass), Trigger (warning signal)."
  },
  {
    key: "start",
    title: "Start",
    hint: "Enter your name + email. Email is optional if you choose not to receive results."
  },
  {
    key: "values_discover",
    title: "Step 1 of 6: Values (Discover)",
    hint:
      "Tap to select 3–6 Values OR add custom ones. We’ll road-test on the next step."
  },
  {
    key: "values_road",
    title: "Step 2 of 6: Values (Road Test)",
    hint:
      "For each candidate Value: If someone violates this, do you feel upset / angry / frustrated?"
  },
  {
    key: "pillars_discover",
    title: "Step 3 of 6: Pillars (Discover)",
    hint:
      "Tap to select 3–6 Pillars OR add custom ones. We’ll road-test on the next step."
  },
  {
    key: "pillars_road",
    title: "Step 4 of 6: Pillars (Road Test)",
    hint:
      "Road Test 1: If crossed, do you get upset? YES→Move to Values, NO→Keep as Pillar. Road Test 2: If removed, would you be a shell of yourself?"
  },
  {
    key: "ideal_emotion",
    title: "Step 5 of 6: Ideal Emotion",
    hint:
      "Pick one (or closest). It is OK to have 2. Then rate how much you want to feel it (1–10)."
  },
  {
    key: "trigger",
    title: "Step 6 of 6: Trigger (Anti-WHO)",
    hint:
      "Pick one from the list OR add a custom one. Name how it makes you feel. Optional reset script."
  },
  {
    key: "snapshot",
    title: "Your WHO Snapshot",
    hint:
      "Review your Values, Pillars, Ideal Emotion, and Trigger. Then submit your results."
  }
];

/* =========================
   MOUNT
   ========================= */

const elApp = document.getElementById("app");
const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset everything?")) return;
    state = structuredClone(DEFAULT_STATE);
    stepIndex = 0;
    saveState();
    render();
  });
}

render();

/* =========================
   RENDER
   ========================= */

function render() {
  elApp.innerHTML = "";

  const step = STEPS[stepIndex];

  elApp.appendChild(header(step.title, step.hint));
  elApp.appendChild(hr());

  const toast = el("div", { className: "toast", id: "toast" }, "");
  elApp.appendChild(toast);

  switch (step.key) {
    case "welcome": renderWelcome(); break;
    case "define": renderDefine(); break;
    case "start": renderStart(); break;
    case "values_discover": renderValuesDiscover(); break;
    case "values_road": renderValuesRoad(); break;
    case "pillars_discover": renderPillarsDiscover(); break;
    case "pillars_road": renderPillarsRoad(); break;
    case "ideal_emotion": renderIdealEmotion(); break;
    case "trigger": renderTrigger(); break;
    case "snapshot": renderSnapshot(); break;
  }

  elApp.appendChild(nav());
}

function header(title, hint) {
  return el("div", { className: "hrow" }, [
    el("div", {}, [
      el("div", { className: "stepTitle" }, title),
      el("div", { className: "stepHint" }, hint)
    ]),
    progressDots()
  ]);
}

function progressDots() {
  const box = el("div", { className: "progress" });
  for (let i = 0; i < STEPS.length; i++) {
    box.appendChild(el("div", { className: `dot ${i <= stepIndex ? "on" : ""}` }));
  }
  return box;
}

function hr() { return el("div", { className: "hr" }); }

function nav() {
  const isLast = stepIndex === STEPS.length - 1;

  return el("div", { className: "row" }, [
    el("button", {
      className: "btn btn-ghost",
      type: "button",
      disabled: stepIndex === 0,
      onclick: () => { stepIndex = Math.max(0, stepIndex - 1); hideToast(); render(); }
    }, "Back"),

    el("div", { className: "small" }, `${stepIndex + 1} / ${STEPS.length}`),

    el("button", {
      className: "btn btn-primary",
      type: "button",
      onclick: () => onNext()
    }, isLast ? "Submit" : "Next")
  ]);
}

function onNext() {
  const err = validateStep(STEPS[stepIndex].key);
  if (err) return showToast(err);

  hideToast();

  // finalize/compute between-step derived lists
  if (STEPS[stepIndex].key === "values_road") finalizeConfirmedValues();
  if (STEPS[stepIndex].key === "pillars_road") finalizeConfirmedPillars();

  if (stepIndex < STEPS.length - 1) {
    stepIndex++;
    saveState();
    render();
    return;
  }

  // Submit: open prefilled google form
  const url = buildPrefilledFormURL();
  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================
   STEP RENDERS
   ========================= */

function renderWelcome() {
  elApp.appendChild(el("div", { className: "small" },
    "Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self, and recognize the thoughts that quietly pull you off course."
  ));
}

function renderDefine() {
  elApp.appendChild(el("div", { className: "small" }, [
    el("div", {}, "Your WHO is defined by:"),
    el("ul", {}, [
      el("li", {}, "Values — Your guardrails"),
      el("li", {}, "Pillars — Your energy source"),
      el("li", {}, "Ideal Emotion — Your compass"),
      el("li", {}, "Trigger — Your warning signal")
    ])
  ]));
}

function renderStart() {
  const grid = el("div", { className: "inline" });

  grid.appendChild(inputBlock("Your name", state.name, v => { state.name = v; saveState(); }));
  grid.appendChild(inputBlock("Your email", state.email, v => { state.email = v; saveState(); }, "email"));

  elApp.appendChild(grid);

  const cb = el("label", { className: "small", style: "display:flex; gap:10px; align-items:center; margin-top:12px;" }, [
    el("input", {
      type: "checkbox",
      checked: state.emailOptIn ? "checked" : null
    }),
    el("span", {}, "Email my results and bonus content. (Email is optional.)")
  ]);

  cb.querySelector("input").addEventListener("change", (e) => {
    state.emailOptIn = !!e.target.checked;
    saveState();
  });

  elApp.appendChild(cb);
}

function renderValuesDiscover() {
  // Prompts A & B
  elApp.appendChild(el("div", { className: "label" }, "Prompt A: Proud Moment"));
  elApp.appendChild(textAreaBlock("At any point in your life, when were you most proud of yourself?", state.proudMoment, v => { state.proudMoment = v; saveState(); }));
  elApp.appendChild(textAreaBlock("Why were you proud?", state.proudWhy, v => { state.proudWhy = v; saveState(); }, 3));

  elApp.appendChild(el("div", { className: "label" }, "Prompt B: Upset / Anger / Frustrated Moment"));
  elApp.appendChild(textAreaBlock("When were you most angry, frustrated, or furious (person or situation)?", state.upsetMoment, v => { state.upsetMoment = v; saveState(); }));
  elApp.appendChild(textAreaBlock("What exactly bothered you / Why did the behavior bother you?", state.upsetWhy, v => { state.upsetWhy = v; saveState(); }, 3));

  elApp.appendChild(hr());

  elApp.appendChild(el("div", { className: "label" }, "Build your Values candidate list"));
  elApp.appendChild(el("div", { className: "small" }, "Rules: Tap to select 3–6 of your Values OR add custom ones."));

  elApp.appendChild(pillGroup(VALUE_OPTIONS, state.valueCandidates, (next) => {
    state.valueCandidates = next;
    saveState();
    render();
  }));

  elApp.appendChild(el("div", { className: "label" }, "Add a candidate (press Enter)"));
  elApp.appendChild(addCustomRow(
    state.valueCustomInput,
    (v) => { state.valueCustomInput = v; saveState(); },
    () => {
      const v = sanitizeCustom(state.valueCustomInput);
      if (!v) return;
      if (!state.valueCandidates.includes(v)) state.valueCandidates.push(v);
      state.valueCustomInput = "";
      saveState();
      render();
    }
  ));

  elApp.appendChild(listPreview("Current candidates", state.valueCandidates));
}

function renderValuesRoad() {
  const candidates = state.valueCandidates.slice();
  if (!candidates.length) {
    elApp.appendChild(el("div", { className: "small" }, "No value candidates yet. Go back and select/add Values."));
    return;
  }

  elApp.appendChild(el("div", { className: "label" }, "Road test each Value"));

  candidates.forEach((val) => {
    const current = state.valueRoad[val] || "";

    const row = el("div", { className: "preview", style: "margin-top:10px;" }, [
      el("div", { className: "v", style: "font-weight:900; font-size:14px;" }, val),
      el("div", { className: "small", style: "margin-top:6px;" }, "If someone violates this, do you feel upset / angry / frustrated?"),
      el("div", { className: "row", style: "margin-top:10px; justify-content:flex-start;" }, [
        choiceBtn("YES", current === "YES", () => setValueRoad(val, "YES")),
        choiceBtn("NO", current === "NO", () => setValueRoad(val, "NO")),
        el("button", { className: "btn btn-danger", type: "button", onclick: () => removeValueCandidate(val) }, "Remove")
      ])
    ]);

    elApp.appendChild(row);
  });

  elApp.appendChild(hr());
  elApp.appendChild(listPreview("Confirmed Values (live)", getConfirmedValuesLive()));
}

function renderPillarsDiscover() {
  elApp.appendChild(el("div", { className: "label" }, "Prompt: Happiest / Best Self"));
  elApp.appendChild(textAreaBlock("When were you your happiest and most YOU? (Where / with who / doing what?)", state.happiestMoment, v => { state.happiestMoment = v; saveState(); }));

  elApp.appendChild(hr());

  elApp.appendChild(el("div", { className: "label" }, "Select your Pillars"));
  elApp.appendChild(el("div", { className: "small" }, "Rules: Tap to select 3–6 of your Pillars OR add custom ones."));

  elApp.appendChild(pillGroup(PILLAR_OPTIONS, state.pillarsCandidates, (next) => {
    state.pillarsCandidates = next;
    saveState();
    render();
  }));

  elApp.appendChild(el("div", { className: "label" }, "Add Pillar candidates (press Enter)"));
  elApp.appendChild(addCustomRow(
    state.pillarCustomInput,
    (v) => { state.pillarCustomInput = v; saveState(); },
    () => {
      const v = sanitizeCustom(state.pillarCustomInput);
      if (!v) return;
      if (!state.pillarsCandidates.includes(v)) state.pillarsCandidates.push(v);
      state.pillarCustomInput = "";
      saveState();
      render();
    }
  ));

  elApp.appendChild(listPreview("Current candidates", state.pillarsCandidates));
}

function renderPillarsRoad() {
  const candidates = state.pillarsCandidates.slice();
  if (!candidates.length) {
    elApp.appendChild(el("div", { className: "small" }, "No pillar candidates yet. Go back and select/add Pillars."));
    return;
  }

  elApp.appendChild(el("div", { className: "label" }, "Road Test 1"));
  elApp.appendChild(el("div", { className: "small" }, "If someone crosses this characteristic, do you get angry/frustrated/upset?"));

  candidates.forEach((p) => {
    const current = state.pillarsRoad1[p] || "";
    elApp.appendChild(el("div", { className: "preview", style: "margin-top:10px;" }, [
      el("div", { className: "v", style: "font-weight:900; font-size:14px;" }, p),
      el("div", { className: "row", style: "margin-top:10px; justify-content:flex-start;" }, [
        choiceBtn("YES", current === "YES", () => setPillarRoad1(p, "YES")),
        choiceBtn("NO", current === "NO", () => setPillarRoad1(p, "NO"))
      ])
    ]));
  });

  const remainingPillars = getRemainingPillarsAfterRoad1();
  const movedToValues = getMovedToValuesAfterRoad1();

  elApp.appendChild(hr());
  elApp.appendChild(listPreview("Moved to Values (live)", movedToValues));
  elApp.appendChild(listPreview("Remaining Pillars (live)", remainingPillars));

  elApp.appendChild(hr());

  elApp.appendChild(el("div", { className: "label" }, "Road Test 2"));
  elApp.appendChild(el("div", { className: "small" }, "If you took these characteristics away, would you be a shell of yourself?"));

  remainingPillars.forEach((p) => {
    const current = state.pillarsRoad2[p] || "";
    elApp.appendChild(el("div", { className: "preview", style: "margin-top:10px;" }, [
      el("div", { className: "v", style: "font-weight:900; font-size:14px;" }, p),
      el("div", { className: "row", style: "margin-top:10px; justify-content:flex-start;" }, [
        choiceBtn("YES", current === "YES", () => setPillarRoad2(p, "YES")),
        choiceBtn("NO", current === "NO", () => setPillarRoad2(p, "NO")),
        el("button", { className: "btn btn-danger", type: "button", onclick: () => removePillarCandidate(p) }, "Remove")
      ])
    ]));
  });

  elApp.appendChild(hr());
  elApp.appendChild(listPreview("Confirmed Pillars (live)", getConfirmedPillarsLive()));
}

function renderIdealEmotion() {
  elApp.appendChild(el("div", { className: "label" }, "Pick your Ideal Emotion (1)"));
  elApp.appendChild(selectBlock(IDEAL_EMOTION_OPTIONS, state.idealEmotion1, v => { state.idealEmotion1 = v; saveState(); render(); }));

  elApp.appendChild(el("div", { className: "label" }, "How much do you want to feel it? (1–10)"));
  elApp.appendChild(rangeBlock(state.idealEmotionRating, (v) => { state.idealEmotionRating = v; saveState(); }));

  elApp.appendChild(el("div", { className: "label" }, "If you have two Ideal Emotions, list the second one (optional)"));
  // PDF says list second one; it does NOT provide a second bank. We'll allow either another from list OR custom text.
  elApp.appendChild(selectBlock(["", ...IDEAL_EMOTION_OPTIONS], state.idealEmotion2, v => { state.idealEmotion2 = v; saveState(); render(); }));

  elApp.appendChild(el("div", { className: "small" }, "If your second Ideal Emotion isn’t in the dropdown, type it below (optional)."));
  elApp.appendChild(inputBlock("Second Ideal Emotion (custom)", state.idealEmotion2Custom, v => { state.idealEmotion2Custom = v; saveState(); }));
}

function renderTrigger() {
  elApp.appendChild(el("div", { className: "label" }, "Pick one Trigger from the list"));
  elApp.appendChild(selectBlock(["", ...TRIGGER_OPTIONS], state.trigger, v => { state.trigger = v; saveState(); }));

  elApp.appendChild(el("div", { className: "label" }, "Or add a custom one (optional)"));
  elApp.appendChild(inputBlock("Custom Trigger", state.triggerCustom, v => { state.triggerCustom = v; saveState(); }));

  elApp.appendChild(el("div", { className: "label" }, "Name how it makes you feel"));
  elApp.appendChild(inputBlock("How it makes you feel", state.triggerFeel, v => { state.triggerFeel = v; saveState(); }));

  elApp.appendChild(el("div", { className: "label" }, "Optional Reset Script"));
  elApp.appendChild(textAreaBlock(
    "When my Trigger appears, how will I pivot to my WHO? (simple plan)",
    state.resetScript,
    v => { state.resetScript = v; saveState(); },
    3
  ));

  elApp.appendChild(el("div", { className: "label" }, "Optional comments"));
  elApp.appendChild(textAreaBlock("Anything else you want Dana to see?", state.comments, v => { state.comments = v; saveState(); }, 4));
}

function renderSnapshot() {
  const confirmedValues = state.confirmedValues.length ? state.confirmedValues : getConfirmedValuesLive();
  const confirmedPillars = state.confirmedPillars.length ? state.confirmedPillars : getConfirmedPillarsLive();

  const ideal2 = (state.idealEmotion2 || "").trim() || (state.idealEmotion2Custom || "").trim();

  const triggerFinal = (state.trigger || "").trim() || (state.triggerCustom || "").trim();

  elApp.appendChild(el("div", { className: "small" }, "Review your snapshot below. Then press Submit to open the prefilled form."));

  const box = el("div", { className: "preview" }, [
    kv("Name", state.name || "—"),
    kv("Email", state.email || "—"),
    kv("Confirmed Values", confirmedValues.length ? confirmedValues.join(", ") : "—"),
    kv("Confirmed Pillars", confirmedPillars.length ? confirmedPillars.join(", ") : "—"),
    kv("Ideal Emotion", state.idealEmotion1 || "—"),
    kv("Ideal Emotion Rating", `${state.idealEmotionRating}/10`),
    kv("Second Ideal Emotion", ideal2 || "—"),
    kv("Trigger (Anti-WHO)", triggerFinal || "—"),
    kv("How it makes you feel", state.triggerFeel || "—"),
    kv("Reset Script", state.resetScript || "—"),
    kv("Comments", state.comments || "—")
  ]);

  elApp.appendChild(box);
}

/* =========================
   VALIDATION (light, per PDF intent)
   ========================= */

function validateStep(key) {
  if (key === "start") {
    if (!state.name.trim()) return "Please enter your name.";
    // Email optional only if not opted in
    if (state.emailOptIn) {
      if (!state.email.trim()) return "Please enter your email (or uncheck email results).";
      if (!/^\S+@\S+\.\S+$/.test(state.email.trim())) return "Please enter a valid email.";
    }
  }

  if (key === "values_discover") {
    if (state.valueCandidates.length < 3) return "Select or add at least 3 Value candidates.";
    if (state.valueCandidates.length > 6) return "Please keep Values to 3–6 candidates (per instructions).";
  }

  if (key === "values_road") {
    const c = state.valueCandidates;
    const answered = c.filter(v => state.valueRoad[v] === "YES" || state.valueRoad[v] === "NO");
    if (answered.length !== c.length) return "Please answer YES/NO for each Value candidate (or remove it).";
  }

  if (key === "pillars_discover") {
    if (state.pillarsCandidates.length < 3) return "Select or add at least 3 Pillar candidates.";
    if (state.pillarsCandidates.length > 6) return "Please keep Pillars to 3–6 candidates (per instructions).";
  }

  if (key === "pillars_road") {
    const c = state.pillarsCandidates;
    const answered1 = c.filter(p => state.pillarsRoad1[p] === "YES" || state.pillarsRoad1[p] === "NO");
    if (answered1.length !== c.length) return "Please answer Road Test 1 for each Pillar (YES/NO).";

    const remaining = getRemainingPillarsAfterRoad1();
    const answered2 = remaining.filter(p => state.pillarsRoad2[p] === "YES" || state.pillarsRoad2[p] === "NO");
    if (answered2.length !== remaining.length) return "Please answer Road Test 2 for each remaining Pillar (YES/NO).";
  }

  if (key === "ideal_emotion") {
    if (!state.idealEmotion1) return "Please select your Ideal Emotion.";
    if (!Number.isFinite(state.idealEmotionRating) || state.idealEmotionRating < 1 || state.idealEmotionRating > 10)
      return "Ideal Emotion rating must be 1–10.";
  }

  if (key === "trigger") {
    const trig = (state.trigger || "").trim() || (state.triggerCustom || "").trim();
    if (!trig) return "Please choose or add your Trigger.";
    if (!state.triggerFeel.trim()) return "Please name how your Trigger makes you feel.";
  }

  return "";
}

/* =========================
   ROAD TEST HELPERS
   ========================= */

function setValueRoad(val, answer) {
  state.valueRoad[val] = answer;
  saveState();
  render();
}

function removeValueCandidate(val) {
  state.valueCandidates = state.valueCandidates.filter(v => v !== val);
  delete state.valueRoad[val];
  saveState();
  render();
}

function getConfirmedValuesLive() {
  return state.valueCandidates.filter(v => state.valueRoad[v] === "YES");
}

function finalizeConfirmedValues() {
  state.confirmedValues = getConfirmedValuesLive();
  saveState();
}

function setPillarRoad1(p, answer) {
  state.pillarsRoad1[p] = answer;
  saveState();
  render();
}

function setPillarRoad2(p, answer) {
  state.pillarsRoad2[p] = answer;
  saveState();
  render();
}

function removePillarCandidate(p) {
  state.pillarsCandidates = state.pillarsCandidates.filter(x => x !== p);
  delete state.pillarsRoad1[p];
  delete state.pillarsRoad2[p];
  saveState();
  render();
}

function getMovedToValuesAfterRoad1() {
  return state.pillarsCandidates.filter(p => state.pillarsRoad1[p] === "YES");
}

function getRemainingPillarsAfterRoad1() {
  return state.pillarsCandidates.filter(p => state.pillarsRoad1[p] === "NO");
}

function getConfirmedPillarsLive() {
  const remaining = getRemainingPillarsAfterRoad1();
  return remaining.filter(p => state.pillarsRoad2[p] === "YES");
}

function finalizeConfirmedPillars() {
  state.movedToValues = getMovedToValuesAfterRoad1();
  state.confirmedPillars = getConfirmedPillarsLive();

  // per PDF: moved pillars become Values candidates (if not already)
  state.movedToValues.forEach((p) => {
    if (!state.confirmedValues.includes(p) && !state.valueCandidates.includes(p)) {
      // Add to candidates (custom) but do NOT add to VALUE_OPTIONS bank.
      state.valueCandidates.push(p);
    }
  });

  saveState();
}

/* =========================
   GOOGLE FORM PREFILL
   ========================= */

function buildPrefilledFormURL() {
  const confirmedValues = state.confirmedValues.length ? state.confirmedValues : getConfirmedValuesLive();
  const confirmedPillars = state.confirmedPillars.length ? state.confirmedPillars : getConfirmedPillarsLive();

  const ideal2 = (state.idealEmotion2 || "").trim() || (state.idealEmotion2Custom || "").trim();
  const triggerFinal = (state.trigger || "").trim() || (state.triggerCustom || "").trim();

  const q = new URLSearchParams();

  q.set(FORM_FIELDS.name, state.name.trim());
  q.set(FORM_FIELDS.email, state.email.trim());
  q.set(FORM_FIELDS.values, confirmedValues.join(", "));
  q.set(FORM_FIELDS.pillars, confirmedPillars.join(", "));
  q.set(FORM_FIELDS.ideal1, state.idealEmotion1);
  if (FORM_FIELDS.ideal2 && ideal2) q.set(FORM_FIELDS.ideal2, ideal2);
  if (FORM_FIELDS.idealRating) q.set(FORM_FIELDS.idealRating, String(state.idealEmotionRating));
  q.set(FORM_FIELDS.trigger, triggerFinal);
  if (FORM_FIELDS.triggerFeel) q.set(FORM_FIELDS.triggerFeel, state.triggerFeel.trim());
  if (FORM_FIELDS.resetScript) q.set(FORM_FIELDS.resetScript, state.resetScript.trim());
  q.set(FORM_FIELDS.comments, state.comments.trim());

  return `${GOOGLE_FORM_PREFILL_BASE}&${q.toString()}`;
}

/* =========================
   UI BUILDING BLOCKS
   (assumes your existing style.css classes from your current site)
   ========================= */

function pillGroup(options, selected, onChange) {
  const wrap = el("div", { className: "pills" });

  options.forEach((opt) => {
    const on = selected.includes(opt);
    const b = el("button", { type: "button", className: `pill ${on ? "on" : ""}` }, opt);
    b.addEventListener("click", () => {
      const next = new Set(selected);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      onChange(Array.from(next));
    });
    wrap.appendChild(b);
  });

  return wrap;
}

function inputBlock(label, value, onInput, type = "text") {
  const box = el("div", {});
  box.appendChild(el("div", { className: "label" }, label));
  const inp = el("input", { className: "field", value: value || "", type });
  inp.addEventListener("input", (e) => onInput(e.target.value));
  box.appendChild(inp);
  return box;
}

function textAreaBlock(placeholder, value, onInput, rows = 5) {
  const ta = el("textarea", { className: "field", rows: String(rows), placeholder });
  ta.value = value || "";
  ta.addEventListener("input", (e) => onInput(e.target.value));
  return ta;
}

function selectBlock(options, selectedValue, onChange) {
  const sel = el("select", { className: "field" });
  options.forEach((opt) => {
    const o = el("option", { value: opt }, opt === "" ? "Select…" : opt);
    if (opt === selectedValue) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener("change", (e) => onChange(e.target.value));
  return sel;
}

function rangeBlock(value, onChange) {
  const wrap = el("div", { className: "preview", style: "margin-top:10px;" });

  const line = el("div", { className: "row", style: "justify-content:space-between; margin-top:0;" }, [
    el("div", { className: "small" }, "1"),
    el("div", { className: "v" }, `Current: ${value}/10`),
    el("div", { className: "small" }, "10")
  ]);

  const r = el("input", { type: "range", min: "1", max: "10", step: "1", value: String(value), style: "width:100%;" });
  r.addEventListener("input", (e) => onChange(parseInt(e.target.value, 10)));

  wrap.appendChild(line);
  wrap.appendChild(r);
  return wrap;
}

function addCustomRow(value, onInput, onEnter) {
  const wrap = el("div", { className: "row", style: "justify-content:flex-start; gap:10px;" });
  const inp = el("input", { className: "field", value: value || "", placeholder: "Type and press Enter…" });
  inp.addEventListener("input", (e) => onInput(e.target.value));
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  });
  wrap.appendChild(inp);
  return wrap;
}

function listPreview(title, arr) {
  const box = el("div", { className: "preview" }, [
    el("div", { className: "k" }, title),
    el("div", { className: "v" }, arr && arr.length ? arr.join(", ") : "—")
  ]);
  return box;
}

function choiceBtn(text, active, onClick) {
  return el("button", {
    type: "button",
    className: `btn ${active ? "btn-primary" : "btn-ghost"}`,
    onclick: onClick
  }, text);
}

function kv(k, v) {
  return el("div", { className: "kv" }, [
    el("div", { className: "k" }, k),
    el("div", { className: "v" }, v)
  ]);
}

function sanitizeCustom(str) {
  const s = (str || "").trim();
  if (!s) return "";
  // Keep user custom exactly as they typed (PDF allows custom). Do not “correct” or invent options.
  return s;
}

/* =========================
   TOAST
   ========================= */

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
}

function hideToast() {
  const t = document.getElementById("toast");
  if (!t) return;
  t.classList.remove("show");
}

/* =========================
   DOM + STORAGE
   ========================= */

function el(tag, attrs = {}, children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === "className") node.className = v;
    else if (k === "onclick") node.onclick = v;
    else if (k === "disabled") node.disabled = !!v;
    else node.setAttribute(k, v);
  }
  if (children === undefined || children === null) return node;
  if (Array.isArray(children)) {
    children.forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  } else {
    node.appendChild(typeof children === "string" ? document.createTextNode(children) : children);
  }
  return node;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      valueCandidates: Array.isArray(parsed.valueCandidates) ? parsed.valueCandidates : [],
      pillarsCandidates: Array.isArray(parsed.pillarsCandidates) ? parsed.pillarsCandidates : [],
      valueRoad: parsed.valueRoad && typeof parsed.valueRoad === "object" ? parsed.valueRoad : {},
      pillarsRoad1: parsed.pillarsRoad1 && typeof parsed.pillarsRoad1 === "object" ? parsed.pillarsRoad1 : {},
      pillarsRoad2: parsed.pillarsRoad2 && typeof parsed.pillarsRoad2 === "object" ? parsed.pillarsRoad2 : {},
      confirmedValues: Array.isArray(parsed.confirmedValues) ? parsed.confirmedValues : [],
      confirmedPillars: Array.isArray(parsed.confirmedPillars) ? parsed.confirmedPillars : [],
      movedToValues: Array.isArray(parsed.movedToValues) ? parsed.movedToValues : []
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
