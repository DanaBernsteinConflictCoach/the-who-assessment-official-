// =========================
// THE WHO ASSESSMENT (OFFICIAL)
// clean card UI + pill selectors
// final step opens PREFILLED Google Form (user just presses Submit)
// =========================

const STORAGE_KEY = "who_assessment_official_v1";

// ✅ Your prefilled Google Form base (DO NOT URL-ENCODE this whole thing; we'll encode each field safely)
const GOOGLE_FORM_PREFILL_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform?usp=pp_url";

// These must match your form's entry IDs (from your prefill URL)
const FORM_FIELDS = {
  name: "entry.2005620554",
  email: "entry.1045781291",
  values: "entry.1065046570",
  pillars: "entry.1010525839",
  idealEmotion: "entry.1060481030",
  trigger: "entry.2079481635",
  comments: "entry.839337160",
};

const VALUE_OPTIONS = [
  "Health","Freedom","Growth","Family","Friendship","Love","Discipline","Adventure","Curiosity",
  "Creativity","Faith","Integrity","Mastery","Stability","Wealth","Impact","Service","Leadership",
  "Peace","Joy","Authenticity","Courage","Excellence","Humor"
];

const PILLAR_OPTIONS = [
  "Body","Mind","Relationships","Work/Craft","Money","Faith/Spirit","Home/Environment","Fun/Play",
  "Learning","Community","Routine","Adventure"
];

const DEFAULT_STATE = {
  name: "",
  email: "",
  values: [],
  pillars: [],
  idealEmotion: "",
  trigger: "",
  comments: ""
};

const STEPS = [
  {
    key: "intro",
    title: "Start",
    hint: "Enter your name + email. Then we’ll build your WHO profile step by step."
  },
  {
    key: "values",
    title: "Your Values",
    hint: "Pick the values that matter most to you. (Aim for ~5–10.)"
  },
  {
    key: "pillars",
    title: "Your Pillars",
    hint: "Pick the life pillars you want to prioritize."
  },
  {
    key: "idealEmotion",
    title: "Ideal Emotion",
    hint: "What emotion do you want to feel more often in life?"
  },
  {
    key: "trigger",
    title: "Top Trigger",
    hint: "What’s one situation that reliably throws you off?"
  },
  {
    key: "comments",
    title: "Anything Else?",
    hint: "Optional. Add any extra context you want Dana to see."
  },
  {
    key: "review",
    title: "Review + Submit",
    hint: "We’ll open a prefilled Google Form. You’ll just press Submit."
  }
];

let state = loadState();
let stepIndex = 0;

const app = document.getElementById("app");
document.getElementById("year").textContent = new Date().getFullYear();

const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", () => {
  if (!confirm("Reset everything?")) return;
  state = structuredClone(DEFAULT_STATE);
  stepIndex = 0;
  saveState();
  render();
});

render();

// -------------------------
// Rendering
// -------------------------
function render(){
  app.innerHTML = "";

  const step = STEPS[stepIndex];

  // header row (title + progress dots)
  const hrow = el("div", { className:"hrow" }, [
    el("div", {}, [
      el("div", { className:"stepTitle" }, step.title),
      el("div", { className:"stepHint" }, step.hint),
    ]),
    progressDots()
  ]);

  const toast = el("div", { className:"toast", id:"toast" }, "");

  app.appendChild(hrow);
  app.appendChild(el("div", { className:"hr" }));
  app.appendChild(toast);

  // body by step
  if (step.key === "intro") renderIntro();
  if (step.key === "values") renderValues();
  if (step.key === "pillars") renderPillars();
  if (step.key === "idealEmotion") renderIdealEmotion();
  if (step.key === "trigger") renderTrigger();
  if (step.key === "comments") renderComments();
  if (step.key === "review") renderReview();

  // nav buttons
  const nav = el("div", { className:"row" }, [
    el("button", {
      className:"btn btn-ghost",
      type:"button",
      disabled: stepIndex === 0,
      onclick: () => { stepIndex = Math.max(0, stepIndex - 1); render(); }
    }, "Back"),

    el("div", { className:"small" }, `${stepIndex + 1} / ${STEPS.length}`),

    el("button", {
      className:"btn btn-primary",
      type:"button",
      onclick: () => nextStep()
    }, stepIndex === STEPS.length - 1 ? "Open Prefilled Form" : "Next"),
  ]);

  app.appendChild(nav);
}

function progressDots(){
  const box = el("div", { className:"progress", "aria-label":"Progress" });
  for (let i = 0; i < STEPS.length; i++){
    const d = el("div", { className:`dot ${i <= stepIndex ? "on":""}` });
    box.appendChild(d);
  }
  return box;
}

// -------------------------
// Step UIs
// -------------------------
function renderIntro(){
  const grid = el("div", { className:"inline" });

  const name = inputField("Name", state.name, (v)=>{ state.name=v; saveState(); });
  const email = inputField("Email", state.email, (v)=>{ state.email=v; saveState(); }, "email");

  grid.appendChild(name);
  grid.appendChild(email);
  app.appendChild(grid);

  app.appendChild(el("div", { className:"small", style:"margin-top:12px;" },
    "Tip: This saves automatically, so you can refresh and you won’t lose progress."
  ));
}

function renderValues(){
  app.appendChild(el("div", { className:"label" }, "Select your values"));
  app.appendChild(pillGroup(VALUE_OPTIONS, state.values, (nextArr)=>{
    state.values = nextArr;
    saveState();
  }));
}

function renderPillars(){
  app.appendChild(el("div", { className:"label" }, "Select your pillars"));
  app.appendChild(pillGroup(PILLAR_OPTIONS, state.pillars, (nextArr)=>{
    state.pillars = nextArr;
    saveState();
  }));
}

function renderIdealEmotion(){
  app.appendChild(el("div", { className:"label" }, "Ideal emotion"));
  const inp = el("input", {
    className:"field",
    value: state.idealEmotion,
    placeholder:"Example: Calm, Confident, Energized...",
    inputmode:"text"
  });
  inp.addEventListener("input", (e)=>{ state.idealEmotion = e.target.value; saveState(); });
  app.appendChild(inp);
}

function renderTrigger(){
  app.appendChild(el("div", { className:"label" }, "Top trigger"));
  const inp = el("input", {
    className:"field",
    value: state.trigger,
    placeholder:"Example: Feeling judged, being ignored, uncertainty...",
    inputmode:"text"
  });
  inp.addEventListener("input", (e)=>{ state.trigger = e.target.value; saveState(); });
  app.appendChild(inp);
}

function renderComments(){
  app.appendChild(el("div", { className:"label" }, "Optional comments"));
  const ta = el("textarea", {
    className:"field",
    rows:"6",
    placeholder:"Anything else you want to share?"
  });
  ta.value = state.comments;
  ta.addEventListener("input", (e)=>{ state.comments = e.target.value; saveState(); });
  app.appendChild(ta);
}

function renderReview(){
  app.appendChild(el("div", { className:"small" },
    "This is what will be prefilled into the Google Form:"
  ));

  const preview = el("div", { className:"preview" });

  preview.appendChild(kv("Name", state.name || "—"));
  preview.appendChild(kv("Email", state.email || "—"));
  preview.appendChild(kv("Values", state.values.length ? state.values.join(", ") : "—"));
  preview.appendChild(kv("Pillars", state.pillars.length ? state.pillars.join(", ") : "—"));
  preview.appendChild(kv("Ideal Emotion", state.idealEmotion || "—"));
  preview.appendChild(kv("Trigger", state.trigger || "—"));
  preview.appendChild(kv("Comments", state.comments || "—"));

  app.appendChild(preview);

  app.appendChild(el("div", { className:"small", style:"margin-top:10px;" },
    "When you click “Open Prefilled Form”, the form opens with everything filled in. The user just presses Submit."
  ));
}

function kv(k, v){
  return el("div", { className:"kv" }, [
    el("div", { className:"k" }, k),
    el("div", { className:"v" }, v),
  ]);
}

// -------------------------
// Navigation + Validation
// -------------------------
function nextStep(){
  const step = STEPS[stepIndex];

  // validate current step before advancing
  const err = validateStep(step.key);
  if (err){
    showToast(err);
    return;
  }
  hideToast();

  if (stepIndex < STEPS.length - 1){
    stepIndex++;
    render();
    return;
  }

  // last step: open prefilled form
  const url = buildPrefilledFormURL();
  window.open(url, "_blank", "noopener,noreferrer");
}

function validateStep(key){
  if (key === "intro"){
    if (!state.name.trim()) return "Please enter your name.";
    if (!state.email.trim()) return "Please enter your email.";
    // light email check
    if (!/^\S+@\S+\.\S+$/.test(state.email.trim())) return "Please enter a valid email address.";
  }
  if (key === "values"){
    if (!state.values.length) return "Pick at least 1 value.";
  }
  if (key === "pillars"){
    if (!state.pillars.length) return "Pick at least 1 pillar.";
  }
  if (key === "idealEmotion"){
    if (!state.idealEmotion.trim()) return "Enter an ideal emotion.";
  }
  if (key === "trigger"){
    if (!state.trigger.trim()) return "Enter your top trigger.";
  }
  return "";
}

function showToast(msg){
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
}
function hideToast(){
  const t = document.getElementById("toast");
  if (!t) return;
  t.classList.remove("show");
}

// -------------------------
// Prefilled Google Form URL builder
// -------------------------
function buildPrefilledFormURL(){
  const q = new URLSearchParams();

  q.set(FORM_FIELDS.name, state.name.trim());
  q.set(FORM_FIELDS.email, state.email.trim());
  q.set(FORM_FIELDS.values, state.values.join(", "));
  q.set(FORM_FIELDS.pillars, state.pillars.join(", "));
  q.set(FORM_FIELDS.idealEmotion, state.idealEmotion.trim());
  q.set(FORM_FIELDS.trigger, state.trigger.trim());
  q.set(FORM_FIELDS.comments, state.comments.trim());

  return `${GOOGLE_FORM_PREFILL_BASE}&${q.toString()}`;
}

// -------------------------
// UI Helpers
// -------------------------
function pillGroup(options, selected, onChange){
  const wrap = el("div", { className:"pills" });

  options.forEach(opt => {
    const on = selected.includes(opt);

    const b = el("button", {
      type:"button",
      className:`pill ${on ? "on":""}`,
    }, opt);

    b.addEventListener("click", () => {
      const next = new Set(selected);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      onChange(Array.from(next));
      // re-render to update pill state
      render();
    });

    wrap.appendChild(b);
  });

  return wrap;
}

function inputField(label, value, onInput, type="text"){
  const box = el("div", {});
  box.appendChild(el("div", { className:"label" }, label));

  const inp = el("input", {
    className:"field",
    value: value,
    type,
    autocomplete: type === "email" ? "email" : "name",
    inputmode: type === "email" ? "email" : "text",
    spellcheck: type === "email" ? "false" : "true",
  });
  inp.addEventListener("input", (e)=> onInput(e.target.value));
  box.appendChild(inp);
  return box;
}

function el(tag, attrs={}, children){
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k === "className") node.className = v;
    else if (k === "onclick") node.onclick = v;
    else if (k === "disabled") node.disabled = !!v;
    else node.setAttribute(k, v);
  }
  if (children === undefined || children === null) return node;
  if (Array.isArray(children)){
    children.forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  } else {
    node.appendChild(typeof children === "string" ? document.createTextNode(children) : children);
  }
  return node;
}

// -------------------------
// Storage
// -------------------------
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      values: Array.isArray(parsed.values) ? parsed.values : [],
      pillars: Array.isArray(parsed.pillars) ? parsed.pillars : [],
    };
  }catch{
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
