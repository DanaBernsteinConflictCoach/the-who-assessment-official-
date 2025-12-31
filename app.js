/**
 * GOLDEN RULE:
 * If a word/option is not in the PDFs, it must not exist in code.
 *
 * Word banks below are taken ONLY from the uploaded PDFs:
 * - Values list: PDF page 4
 * - Pillars list + road tests: PDF pages 5–6
 * - Ideal Emotion dropdown list: PDF page 6
 * - Trigger "I'm not..." list: PDF page 7
 *
 * Features:
 * - Boxed UI
 * - Progress dots + bar
 * - Road tests + remove buttons
 * - Prefilled Google Form submit (LAST PAGE ONLY)
 * - RESET button (top-right) clears local answers + restarts
 */

const STORAGE_KEY = "who_assessment_pdf_locked_v7";

/**
 * ✅ Prefilled Google Form template URL (provided by you).
 * We overwrite the entry values with the user's actual answers.
 */
const PREFILLED_FORM_TEMPLATE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform?usp=pp_url&entry.2005620554=name&entry.1045781291=email@gmail.com&entry.1065046570=values&entry.1010525839=pillars&entry.1060481030=ideal+emotion&entry.2079481635=trigger&entry.839337160=comments";

/* ----------- EXACT WORD BANKS (DO NOT EDIT / DO NOT ADD) ----------- */

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient",
  "Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty","Impact","Independence",
  "Inclusivity","Integrity","Justice","Kind","Loyalty","Open Mind","Perseverance","Reliability",
  "Resilience","Respect","Self-Reliance","Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection",
  "Connector","Considerate","Creative","Earthy","Empathy","Easy-going","Explorer","Faith","Family","Fierce",
  "Fun","Goofy","Grounded","Gratitude","Helper","Humor","Introspective","Impact","Kind",
  "Laughter","Limitless","Listener","Love","Nerdy","Open Mind","Optimist","Passion","Patient",
  "Peace","Playful","Present","Problem Solver","Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom","Grateful",
  "Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to","Respected","Seen",
  "Smart Enough","Valued","Wanted"
];

/* ------------------------------- FLOW ------------------------------- */

const STEPS = [
  { key:"welcome",  label:"Welcome" },
  { key:"define",   label:"Define Your WHO" },
  { key:"start",    label:"Start" },
  { key:"values1",  label:"Step 1 of 6: Values (Discover)" },
  { key:"values2",  label:"Step 2 of 6: Values (Road Test)" },
  { key:"pillars1", label:"Step 3 of 6: Pillars (Discover)" },
  { key:"pillars2", label:"Step 4 of 6: Pillars (Road Test)" },
  { key:"ideal",    label:"Step 5 of 6: Ideal Emotion" },
  { key:"trigger",  label:"Step 6 of 6: Trigger (Anti-WHO)" },
  { key:"snapshot", label:"Your WHO Snapshot" },
  { key:"end",      label:"Next Step" },
];

const DEFAULTS = {
  name: "",
  email: "",

  // Values (Discover)
  valuesProudWhen: "",
  valuesProudWhy: "",
  valuesUpsetWhen: "",
  valuesUpsetWhy: "",
  valueCandidates: [],
  valueCustom: "",

  // Values Road Test
  valueTest: {}, // { [value]: 'yes'|'no' }

  // Pillars (Discover)
  pillarsBestSelf: "",
  pillarCandidates: [],
  pillarCustom: "",

  // Pillars Road Test
  pillarTest1: {}, // { [pillar]: 'yes'|'no' } yes->move to values, no->keep pillar
  pillarTest2: {}, // { [pillar]: 'yes'|'no' } yes->keep pillar, no->remove

  // Ideal Emotion
  idealEmotion1: "",
  idealEmotionRating: 8,
  idealEmotion2: "",

  // Trigger
  triggerPicked: "",     // stores full "I’m not …" string
  triggerCustom: "",     // free text
  triggerFeel: "",
  resetScript: "That’s my Trigger talking. I’m choosing [Pillar] and honoring [Value].",

  // End comments
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
  body.appendChild(renderStep());
  elApp.appendChild(body);

  elApp.appendChild(renderNav());
}

function renderTop(){
  const wrap = document.createElement("div");
  wrap.className = "topRow";

  const left = document.createElement("div");
  left.className = "brand";

  const title = document.createElement("h1");
  title.className = "brandTitle";
  title.textContent = "My WHO Thoughts Assessment™";

  const sub = document.createElement("p");
  sub.className = "brandSub";
  sub.textContent = "Define Your WHO";

  const quick = document.createElement("p");
  quick.className = "quickLine";
  quick.textContent = "Quick clarity. No fluff.";

  left.appendChild(title);
  left.appendChild(sub);
  left.appendChild(quick);

  const right = document.createElement("div");
  right.className = "progressWrap";

  // Reset button (top-right)
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn";
  resetBtn.textContent = "Reset";
  resetBtn.onclick = resetAssessment;
  right.appendChild(resetBtn);

  const dots = document.createElement("div");
  dots.className = "progressDots";
  const totalDots = STEPS.length;
  for(let i=0;i<totalDots;i++){
    const d = document.createElement("div");
    d.className = "dot " + (i <= stepIndex ? "on" : "");
    dots.appendChild(d);
  }

  const bar = document.createElement("div");
  bar.className = "progressBar";
  const fill = document.createElement("div");
  fill.className = "progressFill";
  fill.style.width = `${Math.round(((stepIndex+1)/totalDots)*100)}%`;
  bar.appendChild(fill);

  right.appendChild(dots);
  right.appendChild(bar);

  wrap.appendChild(left);
  wrap.appendChild(right);

  return wrap;
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

    // Require name on Page 3 (Start)
    if(STEPS[stepIndex].key === "start" && !state.name.trim()){
      alert("Please enter your name to continue.");
      return;
    }

    if(stepIndex < STEPS.length - 1){
      stepIndex++;
      saveState();
      render();
    }else{
      saveState();
    }
  };

  nav.appendChild(back);
  nav.appendChild(next);
  return nav;
}

function renderStep(){
  const key = STEPS[stepIndex]?.key;

  switch(key){
    case "welcome":  return stepWelcome();
    case "define":   return stepDefine();
    case "start":    return stepStart();
    case "values1":  return stepValuesDiscover();
    case "values2":  return stepValuesRoadTest();
    case "pillars1": return stepPillarsDiscover();
    case "pillars2": return stepPillarsRoadTest();
    case "ideal":    return stepIdealEmotion();
    case "trigger":  return stepTrigger();
    case "snapshot": return stepSnapshot();
    case "end":      return stepEnd();
    default:         return stepWelcome();
  }
}

/* ------------------------------- Steps ------------------------------- */

function stepWelcome(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 1 — Welcome"));

  wrap.appendChild(help(
    "Thank you for taking the WHO Thoughts Assessment™.\n\n" +
    "Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self, and recognize the thoughts that quietly pull you off course.\n\n" +
    "When your nervous system is regulated, you are powerful. You respond instead of react. You choose instead of spiral.\n\n" +
    "Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve drifted from your WHO and knowing how to return.\n\n" +
    "My goal is to help you uncover and celebrate the best parts of what make you you — the strengths and natural qualities that already exist within you — and show you how to use them to move through conflict with clarity and confidence.\n\n" +
    "Now imagine a world where more of us faced challenges this way: grounded, intentional, and self-led.\n\n" +
    "The WHO Thoughts Assessment™ is your invitation to reflect, reconnect, and reclaim the thoughts that shape your life.\n\n" +
    "— Dana Lynn Bernstein, PMP, PCC\nThe Conflict Resolution Coach"
  ));

  return wrap;
}

function stepDefine(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 2 — Define Your WHO"));

  wrap.appendChild(help(
    "Conflict is best solved by breaking it into smaller parts. External conflict (what to do/how to do something) and internal conflict (the thoughts that stop you from doing the what and how).\n\n" +
    "Identity also has an external (physical attributes, roles, titles, achievements) and an internal component (your WHO).\n\n" +
    "Your WHO is defined by:\n" +
    "Values — Your guardrails\n" +
    "Pillars — Your energy source\n" +
    "Ideal Emotion — Your compass\n" +
    "Trigger — Your inner critic that makes you doubt your WHO\n\n" +
    "Conflict happens when you believe your Values were crossed, you were not acting as your Pillars, or you believed your Trigger."
  ));

  const grid = document.createElement("div");
  grid.className = "boxGrid";

  grid.appendChild(box("Values — Your guardrails",
    "Values are your non-negotiables and boundaries. Use them as guardrails when making decisions."));
  grid.appendChild(op("+"));

  grid.appendChild(box("Pillars — Your energy source",
    "Pillars are your strengths and when you are in a flow state. Draw on them when feeling depleted."));
  grid.appendChild(op("="));

  grid.appendChild(box("Ideal Emotion — Your compass",
    "What you want to feel each day. Living your Values and being your Pillars allows you to feel your Ideal Emotion."));
  grid.appendChild(op("≠"));

  grid.appendChild(box("Trigger — Your inner critic",
    "One loud “I’m not…” story that pulls you off course. Recognize it quickly so it doesn’t hijack your response."));

  wrap.appendChild(grid);

  return wrap;
}

function stepStart(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 3 — Start"));

  const grid = document.createElement("div");
  grid.className = "grid2";
  grid.appendChild(field("Your name", inputText(state.name, v => state.name = v, true)));
  grid.appendChild(field("Your email", inputText(state.email, v => state.email = v)));
  wrap.appendChild(grid);

  // no submit button here (LAST PAGE ONLY)
  return wrap;
}

function stepValuesDiscover(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 1 of 6: Values (Discover)"));
  wrap.appendChild(help(
    "These two prompts will uncover your Values."
  ));

  wrap.appendChild(field("Prompt A: Proud Moment — At any point in your life, when were you most proud of yourself?", textarea(state.valuesProudWhen, v => state.valuesProudWhen = v)));
  wrap.appendChild(field("Why were you proud?", textarea(state.valuesProudWhy, v => state.valuesProudWhy = v)));

  wrap.appendChild(field("Prompt B: Upset / Anger / Frustrated Moment — When were you most angry, frustrated, or furious (person or situation)?", textarea(state.valuesUpsetWhen, v => state.valuesUpsetWhen = v)));
  wrap.appendChild(field("What exactly bothered you / Why did the behavior bother you?", textarea(state.valuesUpsetWhy, v => state.valuesUpsetWhy = v)));

  wrap.appendChild(hr());
  wrap.appendChild(help(
    "Reflect\n" +
    "What are the non-negotiable Values that drive your success? Or, which Values, when crossed or acted against, evoke an emotion.\n" +
    "Rules: Tap to select 3–6 of your Values OR add custom ones. We’ll road-test on the next step."
  ));

  wrap.appendChild(chipPicker(VALUE_OPTIONS, state.valueCandidates, (next) => {
    state.valueCandidates = next;
    for(const k of Object.keys(state.valueTest)){
      if(!next.includes(k)) delete state.valueTest[k];
    }
    saveState();
    render();
  }, 6));

  wrap.appendChild(field("Add a candidate (press Enter)", inputEnter(state.valueCustom, (val) => {
    const cleaned = cleanWord(val);
    if(!cleaned) return;

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

function stepValuesRoadTest(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 2 of 6: Values Evoke Emotions (Road Test)"));
  wrap.appendChild(help(
    "Values, when crossed, evoke an emotion.\n\n" +
    "Instructions\n• YES = it’s a Value (keep)\n• NO = it’s not a Value. Or select REMOVE to delete from the list."
  ));

  const candidates = [...state.valueCandidates];

  if(candidates.length === 0){
    wrap.appendChild(help("No Values candidates selected yet. Go back and choose 3–6 candidates."));
    return wrap;
  }

  const confirmed = [];

  candidates.forEach(val => {
    const card = document.createElement("div");
    card.className = "qaCard";

    const top = document.createElement("div");
    top.className = "qaTop";

    const left = document.createElement("div");
    left.innerHTML = `<div class="qaWord">${escapeHtml(val)}</div>
      <div class="qaQ">If someone acts against this Value, do you feel upset / angry / frustrated?</div>`;

    const btns = document.createElement("div");
    btns.className = "btnRow";

    const yes = chipBtn("YES", state.valueTest[val] === "yes", () => {
      state.valueTest[val] = "yes";
      saveState(); render();
    });

    const no = chipBtn("NO", state.valueTest[val] === "no", () => {
      state.valueTest[val] = "no";
      saveState(); render();
    });

    const remove = chipBtn("Remove", false, () => {
      state.valueCandidates = state.valueCandidates.filter(x => x !== val);
      delete state.valueTest[val];
      saveState(); render();
    }, "danger");

    btns.appendChild(yes);
    btns.appendChild(no);
    btns.appendChild(remove);

    top.appendChild(left);
    top.appendChild(btns);
    card.appendChild(top);
    wrap.appendChild(card);

    if(state.valueTest[val] === "yes") confirmed.push(val);
  });

  wrap.appendChild(hr());
  wrap.appendChild(summaryMini("Live results — Confirmed Values", confirmed));
  wrap.appendChild(help("Practical Application: By identifying these candidates, you increase self-awareness and can more easily de-escalate your emotions."));
  return wrap;
}

function stepPillarsDiscover(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 3 of 6: Pillars (Discover)"));
  wrap.appendChild(help(
    "Are positive core characteristics that describe you at your best. Pillars are not tied to accomplishment or how you think you \"should be\". You are great as you are!\n\n" +
    "Find your Pillars by recalling any time in your life when you just felt so \"you,\" when time melted away, and you felt freedom from judgment (self or others)."
  ));

  wrap.appendChild(field("Prompt: Happiest / Best Self — When were you your happiest and most YOU? (Where / with who / doing what?)", textarea(state.pillarsBestSelf, v => state.pillarsBestSelf = v)));

  wrap.appendChild(help("Rules: Tap to select 3–6 of your Pillars OR add custom ones. We’ll road-test on the next step."));

  wrap.appendChild(chipPicker(PILLAR_OPTIONS, state.pillarCandidates, (next) => {
    state.pillarCandidates = next;
    for(const k of Object.keys(state.pillarTest1)){
      if(!next.includes(k)) delete state.pillarTest1[k];
    }
    for(const k of Object.keys(state.pillarTest2)){
      if(!next.includes(k)) delete state.pillarTest2[k];
    }
    saveState();
    render();
  }, 6));

  wrap.appendChild(field("Add Pillar candidates (add a trait, then press enter)", inputEnter(state.pillarCustom, (val) => {
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

function stepPillarsRoadTest(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 4 of 6: Pillars (Road Test)"));
  wrap.appendChild(help(
    "Road Test 1\nIf someone crosses this characteristic, do you get angry/frustrated/upset?\n" +
    "• YES = Move to Values because it evokes an emotion\n• NO = Keep as a Pillar"
  ));

  const candidates = [...state.pillarCandidates];
  if(candidates.length === 0){
    wrap.appendChild(help("No Pillars candidates selected yet. Go back and choose 3–6 candidates."));
    return wrap;
  }

  candidates.forEach(p => {
    const card = document.createElement("div");
    card.className = "qaCard";

    const top = document.createElement("div");
    top.className = "qaTop";

    const left = document.createElement("div");
    left.innerHTML = `<div class="qaWord">${escapeHtml(p)}</div>
      <div class="qaQ">If someone crosses this characteristic, do you get angry/frustrated/upset?</div>`;

    const btns = document.createElement("div");
    btns.className = "btnRow";

    const yes = chipBtn("YES. Move to Values.", state.pillarTest1[p] === "yes", () => {
      state.pillarTest1[p] = "yes";
      saveState(); render();
    });

    const no = chipBtn("Keep as Pillar.", state.pillarTest1[p] === "no", () => {
      state.pillarTest1[p] = "no";
      saveState(); render();
    });

    const remove = chipBtn("Remove", false, () => {
      state.pillarCandidates = state.pillarCandidates.filter(x => x !== p);
      delete state.pillarTest1[p];
      delete state.pillarTest2[p];
      saveState(); render();
    }, "danger");

    btns.appendChild(yes);
    btns.appendChild(no);
    btns.appendChild(remove);

    top.appendChild(left);
    top.appendChild(btns);
    card.appendChild(top);
    wrap.appendChild(card);
  });

  const movedToValues = [];
  const remainingAfter1 = [];
  for(const p of candidates){
    if(state.pillarTest1[p] === "yes") movedToValues.push(p);
    if(state.pillarTest1[p] === "no") remainingAfter1.push(p);
  }

  wrap.appendChild(hr());

  const liveBox = document.createElement("div");
  liveBox.className = "smallBox";
  liveBox.innerHTML = `<div class="miniTitle">Live results</div>`;
  liveBox.appendChild(summaryLine("Moved to Values", movedToValues));
  liveBox.appendChild(summaryLine("Remaining Pillars", remainingAfter1));
  wrap.appendChild(liveBox);

  wrap.appendChild(hr());

  wrap.appendChild(help(
    "Road Test 2\nIf you took these characteristics away, would you feel empty or disconnected from who you are?\n" +
    "• YES = Keep as a Pillar because I would not be me without this attribute\n• NO = Remove"
  ));

  remainingAfter1.forEach(p => {
    const card = document.createElement("div");
    card.className = "qaCard";

    const top = document.createElement("div");
    top.className = "qaTop";

    const left = document.createElement("div");
    left.innerHTML = `<div class="qaWord">${escapeHtml(p)}</div>
      <div class="qaQ">If you took this characteristic away, would you feel empty or disconnected from who you are?</div>`;

    const btns = document.createElement("div");
    btns.className = "btnRow";

    const yes = chipBtn("YES. It's a Pillar", state.pillarTest2[p] === "yes", () => {
      state.pillarTest2[p] = "yes";
      saveState(); render();
    });

    const no = chipBtn("NO", state.pillarTest2[p] === "no", () => {
      state.pillarTest2[p] = "no";
      saveState(); render();
    });

    const remove = chipBtn("Remove", false, () => {
      state.pillarCandidates = state.pillarCandidates.filter(x => x !== p);
      delete state.pillarTest1[p];
      delete state.pillarTest2[p];
      saveState(); render();
    }, "danger");

    btns.appendChild(yes);
    btns.appendChild(no);
    btns.appendChild(remove);

    top.appendChild(left);
    top.appendChild(btns);
    card.appendChild(top);
    wrap.appendChild(card);
  });

  const confirmedPillars = confirmedPillarsList();
  const confirmedValues = confirmedValuesList();

  wrap.appendChild(hr());
  wrap.appendChild(summaryMini("Confirmed Pillars", confirmedPillars));
  wrap.appendChild(summaryMini("Confirmed Values", confirmedValues));
  wrap.appendChild(help("Practical Application: Wear these Pillars as jackets to reframe yourself when feeling off course to remind you who you are. Lead from your unique strengths."));

  return wrap;
}

function stepIdealEmotion(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 5 of 6: Ideal Emotion"));
  wrap.appendChild(help(
    "Your Ideal Emotion is what you want to feel each day (yes, it is ok to have 2 Ideal Emotions).\n" +
    "When you’re not feeling that emotion, revisit your Values and Pillars to see where you are not aligned with the WHO words that you selected."
  ));

  wrap.appendChild(field("Pick one (or your closest)", select(["", ...IDEAL_EMOTION_OPTIONS], state.idealEmotion1, v => state.idealEmotion1 = v)));

  const sliderBox = document.createElement("div");
  sliderBox.className = "smallBox";
  sliderBox.innerHTML = `<div class="miniTitle">How much do you want to feel your Ideal Emotion (be realistic)?</div>
    <div class="helpText" style="color:var(--ink); margin:0 0 10px;">Current: ${state.idealEmotionRating}/10</div>`;
  const range = document.createElement("input");
  range.type = "range";
  range.min = "1";
  range.max = "10";
  range.value = String(state.idealEmotionRating);
  range.style.width = "100%";
  range.oninput = (e) => { state.idealEmotionRating = Number(e.target.value); saveState(); render(); };
  sliderBox.appendChild(range);
  wrap.appendChild(sliderBox);

  wrap.appendChild(field("If you have two Ideal Emotions, list the second one.", select(["", ...IDEAL_EMOTION_OPTIONS], state.idealEmotion2, v => state.idealEmotion2 = v)));

  return wrap;
}

function stepTrigger(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Step 6 of 6: Trigger (Anti-WHO)"));
  wrap.appendChild(help("Just as important as knowing your Values and Pillars, is recognizing the inner critic that makes you feel demoralized or demotivated. Life is thematic. Look at the list below and reflect on what your inner critic told you when you faced blame inwards or felt like you were not enough in some way. OR add a custom Trigger."));

  const chipList = TRIGGER_OPTIONS.map(x => `I’m not ${x}`);
  wrap.appendChild(chipPicker(chipList, state.triggerPicked ? [state.triggerPicked] : [], (next) => {
    state.triggerPicked = next[0] || "";
    saveState(); render();
  }, 1, true));

  wrap.appendChild(field("Choose or add your “I’m not” Trigger.", inputText(state.triggerCustom, v => state.triggerCustom = v)));
  wrap.appendChild(field("Name how it makes you feel.", inputText(state.triggerFeel, v => state.triggerFeel = v)));
  wrap.appendChild(field("Optional Reset Script: When my Trigger appears, how will you pivot to your WHO? (simple plan)", textarea(state.resetScript, v => state.resetScript = v)));

  return wrap;
}

function stepSnapshot(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 8 — Your WHO Snapshot"));

  const confirmedValues = confirmedValuesList();
  const confirmedPillars = confirmedPillarsList();
  const trig = (state.triggerPicked || state.triggerCustom || "—");
  const emotions = [state.idealEmotion1, state.idealEmotion2].filter(Boolean);

  wrap.appendChild(summaryMini("Values — Your guardrails and also evokes an emotion if crossed", confirmedValues.length ? confirmedValues : ["—"]));
  wrap.appendChild(summaryMini("Pillars — Your energy source and what makes you unique", confirmedPillars.length ? confirmedPillars : ["—"]));
  wrap.appendChild(summaryMini("Ideal Emotion — Your compass that indicates if you are living your Values and being your Pillars at your target amount", emotions.length ? emotions : ["—"]));
  wrap.appendChild(summaryMini("Ideal Emotion rating (target: 8/10)", [`${state.idealEmotionRating}/10`]));
  wrap.appendChild(summaryMini("Trigger — Your inner critic that runs contrary to your WHO", [trig]));

  wrap.appendChild(hr());
  wrap.appendChild(field("Comments on the assessment, share a learning, or just say “hi, I want to keep in touch”", textarea(state.comments, v => state.comments = v)));

  // no submit button here (LAST PAGE ONLY)
  return wrap;
}

function stepEnd(){
  const wrap = document.createElement("div");
  wrap.appendChild(sectionTitle("Page 9 — Next Step"));

  wrap.appendChild(help(
    "Completed.\n\n" +
    "When you’re ready, click the button below to submit your results. " +
    "It opens a prefilled Google Form — you just press Submit."
  ));

  const submitBox = document.createElement("div");
  submitBox.className = "smallBox";
  submitBox.style.marginTop = "12px";
  submitBox.innerHTML = `<div class="miniTitle">Submit</div>
    <div class="helpText" style="color:var(--ink); margin:0;">
      Opens the prefilled Google Form (then press Submit).
    </div>`;

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.style.marginTop = "10px";
  btn.textContent = "Open prefilled Google Form";
  btn.onclick = () => openPrefilledForm();

  submitBox.appendChild(btn);
  wrap.appendChild(submitBox);

  return wrap;
}

/* ------------------------ Prefilled Form Logic ------------------------ */

function openPrefilledForm(){
  if(!PREFILLED_FORM_TEMPLATE){
    alert("Prefilled Google Form URL is missing in app.js.");
    return;
  }
  const url = buildPrefilledFormUrl();
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildPrefilledFormUrl(){
  const u = new URL(PREFILLED_FORM_TEMPLATE);

  // Entry IDs (from your provided URL)
  const ENTRY_NAME = "entry.2005620554";
  const ENTRY_EMAIL = "entry.1045781291";
  const ENTRY_VALUES = "entry.1065046570";
  const ENTRY_PILLARS = "entry.1010525839";
  const ENTRY_IDEAL = "entry.1060481030";
  const ENTRY_TRIGGER = "entry.2079481635";
  const ENTRY_COMMENTS = "entry.839337160";

  const confirmedValues = confirmedValuesList();
  const confirmedPillars = confirmedPillarsList();
  const emotions = [state.idealEmotion1, state.idealEmotion2].filter(Boolean);

  const idealEmotionText = emotions.length
    ? `${emotions.join(", ")} (target: ${state.idealEmotionRating}/10)`
    : "";

  const triggerText = (state.triggerPicked || state.triggerCustom || "");

  u.searchParams.set(ENTRY_NAME, state.name || "");
  u.searchParams.set(ENTRY_EMAIL, state.email || "");
  u.searchParams.set(ENTRY_VALUES, confirmedValues.join(", "));
  u.searchParams.set(ENTRY_PILLARS, confirmedPillars.join(", "));
  u.searchParams.set(ENTRY_IDEAL, idealEmotionText);
  u.searchParams.set(ENTRY_TRIGGER, triggerText);
  u.searchParams.set(ENTRY_COMMENTS, state.comments || "");

  u.searchParams.set("usp", "pp_url");
  return u.toString();
}

/* ------------------------ Derived Results Logic ------------------------ */

function confirmedValuesList(){
  const confirmed = [];
  for(const v of state.valueCandidates){
    if(state.valueTest[v] === "yes") confirmed.push(v);
  }
  for(const p of state.pillarCandidates){
    if(state.pillarTest1[p] === "yes" && !confirmed.includes(p)) confirmed.push(p);
  }
  return confirmed;
}

function confirmedPillarsList(){
  const confirmed = [];
  for(const p of state.pillarCandidates){
    if(state.pillarTest1[p] === "no" && state.pillarTest2[p] === "yes"){
      confirmed.push(p);
    }
  }
  return confirmed;
}

/* ------------------------ RESET (Minimal Effort) ------------------------ */

function resetAssessment(){
  const ok = confirm("Reset the assessment? This will clear all your answers on this device.");
  if(!ok) return;

  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  state = structuredClone(DEFAULTS);
  stepIndex = 0;
  render();
}

/* ----------------------------- UI Helpers ----------------------------- */

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

function help(text){
  const p = document.createElement("p");
  p.className = "helpText";
  p.style.whiteSpace = "pre-wrap";
  p.textContent = text;
  return p;
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

function inputText(value, onChange, required=false){
  const i = document.createElement("input");
  i.className = "input";
  i.type = "text";
  i.value = value || "";
  if(required) i.required = true;
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

  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt === "" ? "Select…" : opt;
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

function chipPicker(options, selected, setSelected, maxPick, singleSelect=false){
  const wrap = document.createElement("div");
  wrap.className = "chips";

  options.forEach(word => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip " + (selected.includes(word) ? "selected" : "");
    c.textContent = word;

    c.onclick = () => {
      let next = [...selected];

      if(next.includes(word)){
        next = next.filter(x => x !== word);
      }else{
        if(singleSelect){
          next = [word];
        }else{
          if(next.length >= maxPick) return;
          next.push(word);
        }
      }
      setSelected(next);
    };

    wrap.appendChild(c);
  });

  return wrap;
}

function chipBtn(text, active, onClick, variant){
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip ghost " + (active ? "selected" : "") + (variant === "danger" ? " danger" : "");
  b.textContent = text;
  b.onclick = onClick;
  return b;
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
  v.style.margin = "0";
  v.textContent = arr.length ? arr.join(", ") : "—";
  box.appendChild(v);

  return box;
}

function summaryMini(title, lines){
  const box = document.createElement("div");
  box.className = "smallBox";
  box.style.marginBottom = "10px";

  const t = document.createElement("div");
  t.className = "miniTitle";
  t.textContent = title;

  const v = document.createElement("div");
  v.className = "helpText";
  v.style.color = "var(--ink)";
  v.style.margin = "0";
  v.innerHTML = (lines || ["—"]).map(x => escapeHtml(String(x))).join("<br/>");

  box.appendChild(t);
  box.appendChild(v);
  return box;
}

function summaryLine(label, arr){
  const line = document.createElement("div");
  line.className = "helpText";
  line.style.margin = "8px 0 0";
  line.style.color = "var(--ink)";
  line.innerHTML = `<b>${escapeHtml(label)}:</b> ${escapeHtml(arr.length ? arr.join(", ") : "—")}`;
  return line;
}

function box(head, body){
  const wrap = document.createElement("div");
  const h = document.createElement("div");
  h.className = "boxHead";
  h.textContent = head;
  const b = document.createElement("div");
  b.className = "boxBody";
  b.textContent = body;
  wrap.appendChild(h);
  wrap.appendChild(b);
  return wrap;
}

function op(symbol){
  const d = document.createElement("div");
  d.className = "op";
  d.textContent = symbol;
  return d;
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
  return String(s).trim();
}

function escapeHtml(str){
  return str
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
