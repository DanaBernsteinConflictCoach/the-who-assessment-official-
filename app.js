/**
 * GOLDEN RULE ENFORCED:
 * - If a word/option is not in the PDF, it does not exist here.
 * - Values & Pillars word banks are taken ONLY from the uploaded PDF images.
 * - Ideal Emotion & Trigger banks are NOT defined in the PDF as selectable lists,
 *   so we do NOT invent dropdown options; user types them.
 */

const STORAGE_KEY = "who_assessment_v2_pdf_locked";

/** EXACT VALUES CHIP LIST from PDF (page 3 image) */
const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient",
  "Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty","Impact","Independence",
  "Inclusivity","Integrity","Justice","Kind","Loyalty","Open Mind","Perseverance","Reliability",
  "Resilience","Respect","Self-Reliance","Service","Structure","Transparency"
];

/** EXACT PILLARS CHIP LIST from PDF (page 4 image) */
const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Considerate","Creative","Earthy","Empathy","Explorer","Faith",
  "Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor","Introspective",
  "Impact","Kind","Laughter","Limitless","Listener","Love","Nerdy","Open Mind","Optimist",
  "Passion","Patient","Peace","Playful","Present","Problem Solver","Sarcastic","Service"
];

/**
 * Trigger word bank is NOT present in this PDF as chips/list.
 * So we must NOT fabricate "I'm not..." options.
 * If you upload the other PDF that contains the Trigger bank, we’ll populate it here.
 */
const TRIGGER_OPTIONS = []; // intentionally empty per golden rule

const STEPS = [
  "Define",
  "Start",
  "Values",
  "Pillars",
  "Ideal Emotion",
  "Trigger",
  "Summary",
];

const DEFAULTS = {
  name: "",
  email: "",
  emailResults: true,

  // Values discover inputs
  valuesProud: "",
  valuesUpset: "",
  valueCandidates: [],
  valueCustom: "",

  // Pillars discover inputs
  pillarsBestSelf: "",
  pillarCandidates: [],
  pillarCustom: "",

  // Ideal Emotion
  idealEmotion1: "",
  idealEmotionRating: 8,
  idealEmotion2: "",

  // Trigger (Anti-WHO)
  triggerPicked: "",       // from TRIGGER_OPTIONS (currently none)
  triggerCustom: "",       // user typed (e.g., "I'm not ____")
  triggerFeel: "",
  resetScript: "",
  comments: "",
};

let state = loadState();
let stepIndex = 0;

const elApp = document.getElementById("app");
document.getElementById("year").textContent = new Date().getFullYear();

render();

/* ----------------------------- Rendering ----------------------------- */

function render(){
  elApp.innerHTML = "";
  elApp.appendChild(renderTop());
  elApp.appendChild(hr());

  const body = document.createElement("div");
  body.className = "body";
  body.appendChild(renderStep());
  elApp.appendChild(body);

  elApp.appendChild(renderNav());
}

function renderTop(){
  const wrap = document.createElement("div");
  wrap.className = "topRow";

  const left = document.createElement("div");
  left.className = "hgroup";

  const h = document.createElement("h1");
  h.textContent = titleForStep(stepIndex);

  const sub = document.createElement("p");
  sub.className = "sub";
  sub.textContent = subtitleForStep(stepIndex);

  left.appendChild(h);
  left.appendChild(sub);

  const dots = document.createElement("div");
  dots.className = "progressDots";
  for(let i=0;i<8;i++){
    const d = document.createElement("div");
    d.className = "dot " + (i <= stepIndex ? "on" : "off");
    dots.appendChild(d);
  }

  wrap.appendChild(left);
  wrap.appendChild(dots);
  return wrap;
}

function renderStep(){
  switch(stepIndex){
    case 0: return stepDefine();
    case 1: return stepStart();
    case 2: return stepValues();
    case 3: return stepPillars();
    case 4: return stepIdealEmotion();
    case 5: return stepTrigger();
    case 6: return stepSummary();
    default: return stepDefine();
  }
}

function renderNav(){
  const nav = document.createElement("div");
  nav.className = "navRow";

  const back = document.createElement("button");
  back.className = "btn";
  back.textContent = "Back";
  back.disabled = stepIndex === 0;
  back.onclick = () => { stepIndex = Math.max(0, stepIndex - 1); render(); };

  const next = document.createElement("button");
  next.className = "btnPrimary";
  next.textContent = stepIndex === STEPS.length - 1 ? "Done" : "Next";
  next.onclick = () => {
    if(stepIndex < STEPS.length - 1){
      stepIndex++;
      saveState();
      render();
    }else{
      saveState();
      // stays on summary
    }
  };

  nav.appendChild(back);
  nav.appendChild(next);
  return nav;
}

function stepDefine(){
  const wrap = document.createElement("div");

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    "Your WHO is defined by Values (guardrails), Pillars (energy source), Ideal Emotion (compass), Trigger (warning signal).";
  wrap.appendChild(help);

  const box = document.createElement("div");
  box.className = "pillBox";
  box.innerHTML = `
    <div class="helpText" style="margin-bottom:8px;">
      Your WHO is defined by:
    </div>
    <ul class="helpText" style="margin:0; padding-left:18px;">
      <li><b>Values</b> — Your guardrails</li>
      <li><b>Pillars</b> — Your energy source</li>
      <li><b>Ideal Emotion</b> — Your compass</li>
      <li><b>Trigger</b> — Your warning signal</li>
    </ul>
  `;
  wrap.appendChild(box);

  return wrap;
}

function stepStart(){
  const wrap = document.createElement("div");

  const grid = document.createElement("div");
  grid.className = "grid2";

  grid.appendChild(field("Your name", inputText(state.name, v => state.name = v)));
  grid.appendChild(field("Your email", inputText(state.email, v => state.email = v)));

  wrap.appendChild(grid);

  const cb = document.createElement("label");
  cb.className = "checkboxRow";
  cb.innerHTML = `
    <input type="checkbox" ${state.emailResults ? "checked" : ""} />
    Email my results and bonus content. (Email is optional.)
  `;
  cb.querySelector("input").onchange = (e) => { state.emailResults = e.target.checked; saveState(); };
  wrap.appendChild(cb);

  return wrap;
}

function stepValues(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("VALUES (Discover)"));

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    "There are two ways to uncover your Values: (1) what is your proudest moment at any point in your life, and (2) what makes you upset. We’ll discover candidates from your proudest moments first, then road-test them.";
  wrap.appendChild(help);

  wrap.appendChild(field("Prompt A: Proud Moment", textarea(state.valuesProud, v => state.valuesProud = v)));
  wrap.appendChild(field("Prompt B: Upset / Anger / Frustrated Moment", textarea(state.valuesUpset, v => state.valuesUpset = v)));

  wrap.appendChild(hr());

  const rules = document.createElement("p");
  rules.className = "helpText";
  rules.textContent = "Build your Values candidate list — Tap to select 3–6 of your Values OR add custom ones.";
  wrap.appendChild(rules);

  wrap.appendChild(chipPicker(VALUE_OPTIONS, state.valueCandidates, (nextArr) => {
    state.valueCandidates = nextArr;
    saveState();
    render(); // live refresh for the current candidates box
  }, 6));

  wrap.appendChild(field("Add a candidate (press Enter)", inputEnter(state.valueCustom, (val) => {
    const cleaned = cleanWord(val);
    if(!cleaned) return;

    // Golden rule: custom values are allowed (PDF says you can add custom ones),
    // but we keep them user-provided only (not preloaded).
    if(!state.valueCandidates.includes(cleaned)){
      if(state.valueCandidates.length < 6){
        state.valueCandidates = [...state.valueCandidates, cleaned];
      }
    }
    state.valueCustom = "";
    saveState();
    render();
  }, (v)=> state.valueCustom = v)));

  wrap.appendChild(currentCandidatesBox(state.valueCandidates));

  return wrap;
}

function stepPillars(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Pillars (Discover)"));

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    `Are positive core characteristics that describe you at your best (they are not tied to accomplishment or how you think you "should be"). You are great as you are!
You can find your Pillars by recalling any time in your life when you just felt so "you," when time melted away, and you felt freedom from judgment (self or others).`;
  wrap.appendChild(help);

  wrap.appendChild(field("Prompt: Happiest / Best Self", textarea(state.pillarsBestSelf, v => state.pillarsBestSelf = v)));

  wrap.appendChild(hr());

  const rules = document.createElement("p");
  rules.className = "helpText";
  rules.textContent = "Select your Pillars — Tap to select 3–6 of your Pillars OR add custom ones.";
  wrap.appendChild(rules);

  wrap.appendChild(chipPicker(PILLAR_OPTIONS, state.pillarCandidates, (nextArr) => {
    state.pillarCandidates = nextArr;
    saveState();
    render(); // live refresh for the current candidates box
  }, 6));

  wrap.appendChild(field("Add Pillar candidates (press Enter)", inputEnter(state.pillarCustom, (val) => {
    const cleaned = cleanWord(val);
    if(!cleaned) return;

    if(!state.pillarCandidates.includes(cleaned)){
      if(state.pillarCandidates.length < 6){
        state.pillarCandidates = [...state.pillarCandidates, cleaned];
      }
    }
    state.pillarCustom = "";
    saveState();
    render();
  }, (v)=> state.pillarCustom = v)));

  wrap.appendChild(currentCandidatesBox(state.pillarCandidates));

  return wrap;
}

function stepIdealEmotion(){
  const wrap = document.createElement("div");
  wrap.appendChild(sectionTitle("Ideal Emotion"));

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    "Your Ideal Emotion is what you want to feel each day (yes, it is ok to have 2 Ideal Emotions). When you’re not feeling that emotion, revisit your Values and Pillars to see where you are not aligned with the WHO words that you selected.";
  wrap.appendChild(help);

  wrap.appendChild(field("Pick your Ideal Emotion (1)", inputText(state.idealEmotion1, v => state.idealEmotion1 = v)));

  // Slider (1–10)
  const sliderWrap = document.createElement("div");
  sliderWrap.className = "smallBox";
  const label = document.createElement("div");
  label.className = "helpText";
  label.style.marginBottom = "10px";
  label.innerHTML = `<b>How much do you want to feel it?</b> (1–10) <span style="color:var(--muted);">Current: ${state.idealEmotionRating}/10</span>`;
  sliderWrap.appendChild(label);

  const range = document.createElement("input");
  range.type = "range";
  range.min = "1";
  range.max = "10";
  range.value = String(state.idealEmotionRating);
  range.style.width = "100%";
  range.oninput = (e) => { state.idealEmotionRating = Number(e.target.value); saveState(); render(); };
  sliderWrap.appendChild(range);

  wrap.appendChild(sliderWrap);

  wrap.appendChild(field("If you have two Ideal Emotions, list the second one (optional)", inputText(state.idealEmotion2, v => state.idealEmotion2 = v)));

  return wrap;
}

function stepTrigger(){
  const wrap = document.createElement("div");
  wrap.appendChild(sectionTitle("Trigger (Anti-WHO)"));

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    `Just as important as knowing your Values and Pillars, is recognizing the inner critic voice that makes you feel demoralized, pulls you off course, and causes you to react. That’s your Trigger.
Your Trigger is one loud “I’m not…” story that surfaces when you feel under pressure. We all have one.`;
  wrap.appendChild(help);

  // Because TRIGGER_OPTIONS is empty (per golden rule), we show typed input only.
  if(TRIGGER_OPTIONS.length > 0){
    wrap.appendChild(field("Pick one Trigger from the list", select(TRIGGER_OPTIONS, state.triggerPicked, v => state.triggerPicked = v)));
  }

  wrap.appendChild(field("Or add a custom one (optional)", inputText(state.triggerCustom, v => state.triggerCustom = v)));
  wrap.appendChild(field("Name how it makes you feel", inputText(state.triggerFeel, v => state.triggerFeel = v)));

  wrap.appendChild(field("Optional Reset Script", textarea(state.resetScript, v => state.resetScript = v)));

  // In PDF, Dana asked to move comments to the end of app.
  // So we do NOT include comments here.

  return wrap;
}

function stepSummary(){
  const wrap = document.createElement("div");
  wrap.appendChild(sectionTitle("Summary"));

  const help = document.createElement("p");
  help.className = "helpText";
  help.textContent =
    "These are the results of your WHO Thoughts Assessment. Revisit your WHO when you feel conflicted, depleted, off-track, or triggered.";
  wrap.appendChild(help);

  wrap.appendChild(hr());

  wrap.appendChild(summaryBox("Values", state.valueCandidates));
  wrap.appendChild(summaryBox("Pillars", state.pillarCandidates));

  const ieLines = [];
  if(state.idealEmotion1) ieLines.push(state.idealEmotion1);
  if(state.idealEmotion2) ieLines.push(state.idealEmotion2);

  wrap.appendChild(summaryBox("Ideal Emotion", ieLines.length ? ieLines : ["—"]));
  wrap.appendChild(summaryBox("Ideal Emotion rating (target)", [`${state.idealEmotionRating}/10`]));

  const trig = state.triggerPicked || state.triggerCustom;
  wrap.appendChild(summaryBox("Trigger (Anti-WHO)", [trig || "—"]));
  wrap.appendChild(summaryBox("How it makes you feel", [state.triggerFeel || "—"]));

  wrap.appendChild(summaryBox("Optional Reset Script", [state.resetScript?.trim() ? state.resetScript.trim() : "—"]));

  wrap.appendChild(hr());

  // Comments at the end (per PDF request)
  wrap.appendChild(field("Comments on the assessment, share a learning, or just say “hi”", textarea(state.comments, v => state.comments = v)));

  return wrap;
}

/* ----------------------------- UI Helpers ----------------------------- */

function titleForStep(i){
  switch(i){
    case 0: return "Define Your WHO";
    case 1: return "Start";
    case 2: return "Values";
    case 3: return "Pillars";
    case 4: return "Ideal Emotion";
    case 5: return "Trigger (Anti-WHO)";
    case 6: return "Summary";
    default: return "My WHO Thoughts Assessment";
  }
}

function subtitleForStep(i){
  switch(i){
    case 0: return "Your WHO is defined by Values (guardrails), Pillars (energy source), Ideal Emotion (compass), Trigger (warning signal).";
    case 1: return "Enter your name + email. Email is optional if you choose not to receive results.";
    case 2: return "Discover candidates, then select 3–6 Values (or add custom ones).";
    case 3: return "Recall a time you felt most YOU. Select 3–6 Pillars (or add custom ones).";
    case 4: return "Choose what you want to feel each day. It is OK to have 2.";
    case 5: return "Name the “I’m not…” story that pulls you off course and how it makes you feel.";
    case 6: return "Review what you selected and leave any final comments.";
    default: return "";
  }
}

function hr(){
  const d = document.createElement("div");
  d.className = "hr";
  return d;
}

function sectionTitle(text){
  const h = document.createElement("h2");
  h.className = "sectionTitle";
  h.textContent = text;
  return h;
}

function field(labelText, control){
  const wrap = document.createElement("div");
  wrap.style.marginBottom = "12px";

  const l = document.createElement("div");
  l.className = "label";
  l.textContent = labelText;

  wrap.appendChild(l);
  wrap.appendChild(control);
  return wrap;
}

function inputText(value, onChange){
  const i = document.createElement("input");
  i.className = "input";
  i.type = "text";
  i.value = value || "";
  i.oninput = (e) => { onChange(e.target.value); saveState(); };
  return i;
}

function textarea(value, onChange){
  const t = document.createElement("textarea");
  t.className = "textarea";
  t.value = value || "";
  t.oninput = (e) => { onChange(e.target.value); saveState(); };
  return t;
}

function select(options, value, onChange){
  const s = document.createElement("select");
  s.className = "select";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Select…";
  s.appendChild(empty);

  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    s.appendChild(o);
  });

  s.value = value || "";
  s.onchange = (e) => { onChange(e.target.value); saveState(); };
  return s;
}

function inputEnter(value, onEnter, onTyping){
  const i = document.createElement("input");
  i.className = "input";
  i.type = "text";
  i.value = value || "";
  i.placeholder = "Type and press Enter…";
  i.oninput = (e) => { onTyping(e.target.value); saveState(); };
  i.onkeydown = (e) => {
    if(e.key === "Enter"){
      e.preventDefault();
      onEnter(i.value);
    }
  };
  return i;
}

function chipPicker(options, selected, setSelected, maxPick){
  const wrap = document.createElement("div");
  wrap.className = "chips";

  options.forEach(word => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip" + (selected.includes(word) ? " selected" : "");
    c.textContent = word;

    c.onclick = () => {
      let next = [...selected];

      if(next.includes(word)){
        next = next.filter(x => x !== word);
      }else{
        if(next.length >= maxPick) return;
        next.push(word);
      }
      setSelected(next);
    };

    wrap.appendChild(c);
  });

  return wrap;
}

function currentCandidatesBox(arr){
  const box = document.createElement("div");
  box.className = "smallBox";

  const t = document.createElement("div");
  t.className = "miniTitle";
  t.textContent = "Current candidates";
  box.appendChild(t);

  const v = document.createElement("div");
  v.className = "helpText";
  v.style.color = "var(--ink)";
  v.textContent = arr.length ? arr.join(", ") : "—";
  box.appendChild(v);

  return box;
}

function summaryBox(title, lines){
  const box = document.createElement("div");
  box.className = "smallBox";
  box.style.marginBottom = "10px";

  const t = document.createElement("div");
  t.className = "miniTitle";
  t.textContent = title;

  const v = document.createElement("div");
  v.className = "helpText";
  v.style.color = "var(--ink)";
  v.innerHTML = (lines || ["—"]).map(x => escapeHtml(String(x))).join("<br/>");

  box.appendChild(t);
  box.appendChild(v);
  return box;
}

/* ----------------------------- State ----------------------------- */

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...parsed };
  }catch{
    return structuredClone(DEFAULTS);
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch{}
}

/* ----------------------------- Utils ----------------------------- */

function cleanWord(s){
  if(!s) return "";
  const out = String(s).trim();
  if(!out) return "";
  // keep user text as-is (no forced casing) to respect their wording
  return out;
}

function escapeHtml(str){
  return str
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
