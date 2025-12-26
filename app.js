/* ==========================================
   WHO Assessment — Official
   Static GitHub Pages app
   ✅ Submit redirects to a PREFILLED Google Form
   ========================================== */

const STORAGE_KEY = "who_assessment_official_prefill_v2";

/* ============
   GOOGLE FORM
   ============ */
const GOOGLE_FORM = {
  enabled: true,
  prefillUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform?usp=pp_url",
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
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present","Problem Solver",
  "Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to","Respected",
  "Seen","Smart Enough","Valued","Wanted"
];

const STEPS = [
  { key:"welcome", title:"Welcome" },
  { key:"define", title:"Define Your WHO" },
  { key:"start", title:"Start" },
  { key:"values", title:"Values" },
  { key:"pillars", title:"Pillars" },
  { key:"ideal", title:"Ideal Emotion" },
  { key:"trigger", title:"Trigger (Anti-WHO)" },
  { key:"snapshot", title:"Your WHO Snapshot" },
  { key:"submitted", title:"Submitted" }
];

const DEFAULT_STATE = {
  stepIndex: 0,
  user: { name:"", email:"" },

  values: { selected: [] },
  pillars: { selected: [] },

  idealEmotion: { primary:"" },
  trigger: { label:"" },

  comments: "",

  lastSubmit: { status:"idle", message:"", prefillUrl:"" }
};

let state = loadState();

const elApp = document.getElementById("app");
const elYear = document.getElementById("year");
if (elYear) elYear.textContent = String(new Date().getFullYear());

const btnReset = document.getElementById("btnReset");
if (btnReset){
  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all answers?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

/* ================
   State helpers
   ================ */
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
function uniq(arr){ return [...new Set(arr.map(s => String(s).trim()).filter(Boolean))]; }
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

/* ================
   Proceed rules
   ================ */
function canProceed(){
  const key = STEPS[state.stepIndex]?.key;

  if (key === "start") return !!state.user.name.trim();
  if (key === "values") return (state.values.selected || []).length >= 3;
  if (key === "pillars") return (state.pillars.selected || []).length >= 3;
  if (key === "ideal") return !!state.idealEmotion.primary.trim();
  if (key === "trigger") return !!state.trigger.label.trim();
  return true;
}

/* ================
   Prefill builder
   ================ */
function buildPrefillUrl(){
  const base = GOOGLE_FORM.prefillUrl;
  const qp = new URLSearchParams();

  qp.set(GOOGLE_FORM.entry.name, state.user.name.trim());
  qp.set(GOOGLE_FORM.entry.email, state.user.email.trim());

  qp.set(GOOGLE_FORM.entry.values, (state.values.selected || []).join(", "));
  qp.set(GOOGLE_FORM.entry.pillars, (state.pillars.selected || []).join(", "));
  qp.set(GOOGLE_FORM.entry.idealEmotion, state.idealEmotion.primary || "");
  qp.set(GOOGLE_FORM.entry.trigger, state.trigger.label || "");
  qp.set(GOOGLE_FORM.entry.comments, state.comments || "");

  return `${base}&${qp.toString()}`;
}

function submitToDana(){
  if (!GOOGLE_FORM.enabled){
    state.lastSubmit = { status:"error", message:"Form submit is disabled.", prefillUrl:"" };
    saveState();
    setStep(STEPS.findIndex(s => s.key === "submitted"));
    return;
  }

  if (!state.user.name.trim()){
    alert("Please enter your name.");
    setStep(STEPS.findIndex(s => s.key === "start"));
    return;
  }

  const url = buildPrefillUrl();

  state.lastSubmit = {
    status:"success",
    message:"Almost done — your Google Form is prefilled. Press Submit on the form to send it to Dana.",
    prefillUrl: url
  };
  saveState();

  // if redirect gets blocked, user still sees a page with a button
  setStep(STEPS.findIndex(s => s.key === "submitted"));
  window.location.href = url;
}

/* ================
   Rendering
   ================ */
function pill(label, on, dataKey){
  return `<button class="pill ${on ? "on" : ""}" type="button" data-${dataKey}="${escapeHtmlAttr(label)}">${escapeHtml(label)}</button>`;
}
function render(){
  const step = STEPS[state.stepIndex];
  const key = step.key;

  const dots = STEPS.map((s, i) => `<span class="stepDot ${i === state.stepIndex ? "on" : ""}"></span>`).join("");

  elApp.innerHTML = `
    <section class="card">
      <div class="stepper">${dots}</div>
      <div class="stepTitle">${escapeHtml(step.title)}</div>
    </section>

    <div style="height:12px;"></div>

    ${key === "welcome" ? stepWelcome() : ""}
    ${key === "define" ? stepDefine() : ""}
    ${key === "start" ? stepStart() : ""}
    ${key === "values" ? stepValues() : ""}
    ${key === "pillars" ? stepPillars() : ""}
    ${key === "ideal" ? stepIdeal() : ""}
    ${key === "trigger" ? stepTrigger() : ""}
    ${key === "snapshot" ? stepSnapshot() : ""}
    ${key === "submitted" ? stepSubmitted() : ""}

    <div class="nav">
      <button class="btn ghost" type="button" id="btnBack" ${state.stepIndex === 0 ? "disabled" : ""}>Back</button>

      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
        ${key === "snapshot"
          ? `<button class="btn primary" type="button" id="btnSubmit">Submit Results</button>`
          : `<button class="btn primary" type="button" id="btnNext" ${canProceed() ? "" : "disabled"}>Next</button>`
        }
      </div>
    </div>
  `;

  const back = document.getElementById("btnBack");
  if (back) back.onclick = prevStep;

  const next = document.getElementById("btnNext");
  if (next) next.onclick = nextStep;

  const submit = document.getElementById("btnSubmit");
  if (submit) submit.onclick = submitToDana;

  wireInputs();
}

function wireInputs(){
  const userName = document.getElementById("userName");
  if (userName){
    userName.oninput = (e)=>{ state.user.name = e.target.value; saveState(); render(); };
  }
  const userEmail = document.getElementById("userEmail");
  if (userEmail){
    userEmail.oninput = (e)=>{ state.user.email = e.target.value; saveState(); };
  }

  const ideal = document.getElementById("idealPrimary");
  if (ideal){
    ideal.onchange = (e)=>{ state.idealEmotion.primary = e.target.value; saveState(); render(); };
  }

  const comments = document.getElementById("comments");
  if (comments){
    comments.oninput = (e)=>{ state.comments = e.target.value; saveState(); };
  }
}

/* ================
   Step templates
   ================ */
function stepWelcome(){
  return `
    <section class="card">
      <div class="h1">Welcome</div>
      <p class="p">
        This assessment helps you define your WHO:
        <b>Values</b> • <b>Pillars</b> • <b>Ideal Emotion</b> • <b>Trigger</b>.
      </p>
      <div class="notice">
        At the end, you’ll be sent to a <b>prefilled Google Form</b>. You just press <b>Submit</b>.
      </div>
    </section>
  `;
}

function stepDefine(){
  return `
    <section class="card">
      <div class="h1">Define Your WHO</div>
      <p class="p">
        Your WHO is defined by:
        <b>Values</b> (guardrails) • <b>Pillars</b> (energy source) • <b>Ideal Emotion</b> (compass) • <b>Trigger</b> (warning signal).
      </p>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values</h3>
          <ul class="ul"><li>Non-negotiables</li><li>When crossed, evoke emotion</li></ul>
        </div>
        <div class="snapshotBox">
          <h3>Pillars</h3>
          <ul class="ul"><li>You at your best</li><li>Your core energy</li></ul>
        </div>
        <div class="snapshotBox">
          <h3>Ideal Emotion</h3>
          <ul class="ul"><li>What you want to feel daily</li><li>Guides choices</li></ul>
        </div>
        <div class="snapshotBox">
          <h3>Trigger</h3>
          <ul class="ul"><li>Your “I’m not ___ enough” story</li><li>Shows up under pressure</li></ul>
        </div>
      </div>
    </section>
  `;
}

function stepStart(){
  return `
    <section class="card">
      <div class="h1">Start</div>

      <label class="lbl">Your name <span class="small">(required)</span></label>
      <input id="userName" class="txt" placeholder="Type your name" value="${escapeHtml(state.user.name)}" />

      <label class="lbl">Your email <span class="small">(optional)</span></label>
      <input id="userEmail" class="txt" placeholder="you@email.com" value="${escapeHtml(state.user.email)}" />

      <div class="small" style="margin-top:10px;">
        This info will be prefilled into the Google Form for Dana.
      </div>
    </section>
  `;
}

function stepValues(){
  const selected = state.values.selected || [];
  return `
    <section class="card">
      <div class="h1">Values</div>
      <p class="p">Pick your top <b>3–6</b>.</p>

      <div class="pills">
        ${VALUE_OPTIONS.map(v => pill(v, selected.includes(v), "value")).join("")}
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Selected</div>
        <div class="small">${selected.length} / 6 (need at least 3)</div>
        <div class="pills">
          ${selected.map(v => `<span class="tag">${escapeHtml(v)} <button class="btn ghost" type="button" style="padding:0 10px;border-radius:999px;" data-remove-value="${escapeHtmlAttr(v)}">×</button></span>`).join("") || `<span class="small">None yet.</span>`}
        </div>
      </div>
    </section>
  `;
}

function stepPillars(){
  const selected = state.pillars.selected || [];
  return `
    <section class="card">
      <div class="h1">Pillars</div>
      <p class="p">Pick your top <b>3–6</b>.</p>

      <div class="pills">
        ${PILLAR_OPTIONS.map(p => pill(p, selected.includes(p), "pillar")).join("")}
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Selected</div>
        <div class="small">${selected.length} / 6 (need at least 3)</div>
        <div class="pills">
          ${selected.map(p => `<span class="tag">${escapeHtml(p)} <button class="btn ghost" type="button" style="padding:0 10px;border-radius:999px;" data-remove-pillar="${escapeHtmlAttr(p)}">×</button></span>`).join("") || `<span class="small">None yet.</span>`}
        </div>
      </div>
    </section>
  `;
}

function stepIdeal(){
  return `
    <section class="card">
      <div class="h1">Ideal Emotion</div>
      <p class="p">Pick the emotion you want to feel most days.</p>

      <label class="lbl">Ideal Emotion <span class="small">(required)</span></label>
      <select id="idealPrimary" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(o => `<option value="${escapeHtmlAttr(o)}" ${state.idealEmotion.primary === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      </select>

      <label class="lbl">Optional comments to Dana</label>
      <textarea id="comments" class="ta" placeholder="Anything you want Dana to know?">${escapeHtml(state.comments)}</textarea>
    </section>
  `;
}

function stepTrigger(){
  const label = state.trigger.label || "";
  return `
    <section class="card">
      <div class="h1">Trigger (Anti-WHO)</div>
      <p class="p">Pick the “I’m not ___” story that shows up under pressure.</p>

      <div class="pills">
        ${TRIGGER_OPTIONS.map(t => {
          const full = `I'm not ${t}`;
          return pill(full, label === full, "trigger");
        }).join("")}
      </div>

      <div style="margin-top:12px;">
        <label class="lbl">Or type your own</label>
        <input id="triggerCustom" class="txt" placeholder="Example: I'm not safe / I'm not in control..." value="${escapeHtml(label && !label.startsWith("I'm not ") ? label : "")}" />
        <div class="small">Typing here overrides the selection.</div>
      </div>
    </section>
  `;
}

function stepSnapshot(){
  const values = state.values.selected || [];
  const pillars = state.pillars.selected || [];
  return `
    <section class="card">
      <div class="h1">Your WHO Snapshot</div>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values</h3>
          <ul class="ul">${values.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Pillars</h3>
          <ul class="ul">${pillars.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Ideal Emotion</h3>
          <ul class="ul"><li>${escapeHtml(state.idealEmotion.primary || "")}</li></ul>
        </div>

        <div class="snapshotBox">
          <h3>Trigger</h3>
          <ul class="ul"><li>${escapeHtml(state.trigger.label || "")}</li></ul>
        </div>
      </div>

      <hr class="sep" />

      <div class="notice">
        When you click <b>Submit Results</b>, you’ll be taken to a prefilled Google Form.
        <br/>Just press <b>Submit</b> there to send Dana your results.
      </div>
    </section>
  `;
}

function stepSubmitted(){
  const link = state.lastSubmit?.prefillUrl || "";
  const msg = state.lastSubmit?.message || "If you weren’t redirected, use the button below.";

  return `
    <section class="card">
      <div class="h1">Submitted</div>
      <p class="p">${escapeHtml(msg)}</p>

      ${link ? `
        <a class="btn primary" href="${escapeHtmlAttr(link)}">Open Prefilled Google Form</a>
        <div class="small" style="margin-top:10px;">
          Press <b>Submit</b> on the form to send it to Dana.
        </div>
      ` : `
        <div class="notice">No prefilled link created. Something is wrong.</div>
      `}
    </section>
  `;
}

/* ================
   Click delegation
   ================ */
document.addEventListener("click", (e)=>{
  const t = e.target;

  // toggle value
  if (t?.dataset?.value){
    const v = t.dataset.value;
    const arr = state.values.selected || [];
    if (arr.includes(v)){
      state.values.selected = removeItem(arr, v);
    }else{
      if (arr.length >= 6) return;
      state.values.selected = uniq([...arr, v]);
    }
    saveState(); render();
  }

  // toggle pillar
  if (t?.dataset?.pillar){
    const p = t.dataset.pillar;
    const arr = state.pillars.selected || [];
    if (arr.includes(p)){
      state.pillars.selected = removeItem(arr, p);
    }else{
      if (arr.length >= 6) return;
      state.pillars.selected = uniq([...arr, p]);
    }
    saveState(); render();
  }

  // toggle trigger
  if (t?.dataset?.trigger){
    state.trigger.label = t.dataset.trigger;
    saveState(); render();
  }

  // remove selected value
  if (t?.dataset?.removeValue){
    const v = t.dataset.removeValue;
    state.values.selected = removeItem(state.values.selected || [], v);
    saveState(); render();
  }

  // remove selected pillar
  if (t?.dataset?.removePillar){
    const p = t.dataset.removePillar;
    state.pillars.selected = removeItem(state.pillars.selected || [], p);
    saveState(); render();
  }
});

document.addEventListener("input", (e)=>{
  const t = e.target;
  if (t?.id === "triggerCustom"){
    const v = String(t.value || "").trim();
    if (v){
      state.trigger.label = v;
      saveState(); render();
    }
  }
});

/* ================
   HTML escaping
   ================ */
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(s){ return escapeHtml(s).replaceAll("\n"," "); }

// initial paint
render();
