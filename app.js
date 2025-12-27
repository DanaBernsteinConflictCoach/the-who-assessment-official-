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
 * UI style matches the boxed layout PDF (boxes grid).
 */

const STORAGE_KEY = "who_assessment_pdf_locked_v3";

// Provided (PDF): users info needs to be sent to this Google Form link.
// PDF does NOT provide entry IDs, so we cannot fabricate a hidden POST.
// We therefore offer a button that opens the exact provided URL.
const GOOGLE_FORM_URL = "https://forms.gle/1PCPTs2FKaiCartf8";

/* ----------- EXACT WORD BANKS (DO NOT EDIT / DO NOT ADD) ----------- */

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient",
  "Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty","Impact","Independence",
  "Inclusivity","Integrity","Justice","Kind","Loyalty","Open Mind","Perseverance","Reliability",
  "Resilience","Respect","Self-Reliance","Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection",
  "Connector","Considerate","Creative","Earthy","Empathy","Explorer","Faith","Family","Fierce",
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
  emailOptIn: true,

  // Values (Discover)
  valuesProudWhen: "",
  valuesProudWhy: "",
  valuesUpsetWhen: "",
  valuesUpsetWhy: "",
  valueCandidates: [],
  valueCustom: "",

  // Values Road Test
  valueTest: {}, // { [value]: 'yes'|'no' } only for candidates

  // Pillars (Discover)
  pillarsBestSelf: "",
  pillarCandidates: [],
  pillarCustom: "",

  // Pillars Road Test
  pillarTest1: {}, // { [pillar]: 'yes'|'no'|'remove' } yes->move to values, no->keep pillar
  pillarTest2: {}, // { [pillar]: 'yes'|'no'|'remove' } yes->keep pillar, no->remove

  // Ideal Emotion
  idealEmotion1: "",
  idealEmotionRating: 8,
  idealEmotion2: "",

  // Trigger
  triggerPicked: "",     // stores full "I'm not …" string
  triggerCustom: "",     // free text (expects "I'm not ...")
  triggerFeel: "",
  resetScript: "That’s my Trigger talking. I’m choosing [Pillar] and honoring [Value].",

  // End comments (moved to end)
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
    "Conflict is best solved by breaking it into smaller parts. External conflict (tacticals about what to do/how to do something) and internal conflict (your thoughts about why you labeled something a conflict).\n\n" +
    "Identity also has an external (physical attributes, roles, titles, achievements) and internal component (your WHO).\n\n" +
    "Your WHO is defined by:\n" +
    "Values — Your guardrails\n" +
    "Pillars — Your energy source\n" +
    "Ideal Emotion — Your compass\n" +
    "Trigger — Your warning signal\n\n" +
    "Conflict happens when you believe your WHO has been threatened."
  ));

  // Boxed visual (like the “other PDF”)
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
  grid.appendChild(op("+"));

  grid.appendChild(box("Trigger — Your warning signal",
    "One loud “I’m not…” story that pulls you off course. Recognize it quickly so it doesn’t hijack your response."));

  wrap.appendChild(grid);

  return wrap;
}

function stepStart(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 3 — Start"));

  const grid = document.createElement("div");
  grid.className = "grid2";
  grid.appendChild(field("Your name", inputText(state.name, v => state.name = v)));
  grid.appendChild(field("Your email", inputText(state.email, v => state.email = v)));
  wrap.appendChild(grid);

  const cb = document.createElement("label");
  cb.className = "helpText";
  cb.style.display = "flex";
  cb.style.gap = "10px";
  cb.style.alignItems = "center";
  cb.innerHTML = `<input type="checkbox" ${state.emailOptIn ? "checked":""} />
    Email my results and bonus content. Email is optional.`;
  cb.querySelector("input").onchange = (e) => { state.emailOptIn = e.target.checked; saveState(); };
  wrap.appendChild(cb);

  wrap.appendChild(hr());

  // Compliant “send to Google Form” (no invented entry IDs)
  const formBox = document.createElement("div");
  formBox.className = "smallBox";
  formBox.innerHTML = `
    <div class="miniTitle">Google Form</div>
    <div class="helpText" style="color:var(--ink); margin:0;">
      The PDF specifies this Google Form link for collecting user info. This app can open it for submission:
    </div>
  `;
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.style.marginTop = "10px";
  btn.textContent = "Send my info to Google Form";
  btn.onclick = () => window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer");
  formBox.appendChild(btn);

  wrap.appendChild(formBox);

  return wrap;
}

function stepValuesDiscover(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 4 — Step 1 of 6: Values (Discover)"));
  wrap.appendChild(help(
    "There are two ways to uncover your Values (1) what is your proudest moment at any point in your life, and (2) what makes you upset. We’ll discover candidates from your proudest moments first, then road-test them."
  ));

  wrap.appendChild(field("Prompt A: Proud Moment — At any point in your life, when were you most proud of yourself?", textarea(state.valuesProudWhen, v => state.valuesProudWhen = v)));
  wrap.appendChild(field("Why were you proud?", textarea(state.valuesProudWhy, v => state.valuesProudWhy = v)));

  wrap.appendChild(field("Prompt B: Upset / Anger / Frustrated Moment — When were you most angry, frustrated, or furious (person or situation)?", textarea(state.valuesUpsetWhen, v => state.valuesUpsetWhen = v)));
  wrap.appendChild(field("What exactly bothered you / Why did the behavior bother you?", textarea(state.valuesUpsetWhy, v => state.valuesUpsetWhy = v)));

  wrap.appendChild(hr());
  wrap.appendChild(help(
    "Build your Values candidate list\n" +
    "Reflect on what matters to you. What are the non-negotiable rules that drive your success?\n" +
    "Rules: Tap to select 3–6 of your Values OR add custom ones. We’ll road-test on the next step."
  ));

  wrap.appendChild(chipPicker(VALUE_OPTIONS, state.valueCandidates, (next) => {
    state.valueCandidates = next;
    // clear any tests for removed candidates
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
    "Road test each candidate. Values, when crossed, evoke an emotion.\n\n" +
    "Instructions\n• YES = it’s a Value (keep)\n• NO = it’s not a Value (remove from the list)."
  ));

  const candidates = [...state.valueCandidates];

  if(candidates.length === 0){
    wrap.appendChild(help("No Values candidates selected yet. Go back and choose 3–6 candidates."));
    return wrap;
  }

  const live = {
    confirmed: [],
  };

  candidates.forEach(val => {
    const card = document.createElement("div");
    card.className = "qaCard";

    const top = document.createElement("div");
    top.className = "qaTop";

    const left = document.createElement("div");
    left.innerHTML = `<div class="qaWord">${escapeHtml(val)}</div>
      <div class="qaQ">If someone violates this, do you feel upset / angry / frustrated?</div>`;

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

    if(state.valueTest[val] === "yes") live.confirmed.push(val);
  });

  wrap.appendChild(hr());

  wrap.appendChild(summaryMini("Live results — Confirmed Values", live.confirmed));
  wrap.appendChild(help("Practical Application: By identifying these candidates, you can more easily de-escalate your emotions."));
  return wrap;
}

function stepPillarsDiscover(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 5 — Step 3 of 6: Pillars (Discover)"));
  wrap.appendChild(help(
    "Are positive core characteristics that describe you at your best (they are not tied to accomplishment or how you think you \"should be\"). You are great as you are!\n\n" +
    "You can find your Pillars by recalling any time in your life when you just felt so \"you,\" when time melted away, and you felt freedom from judgment (self or others)."
  ));

  wrap.appendChild(field("Prompt: Happiest / Best Self — When were you your happiest and most YOU? (Where / with who / doing what?)", textarea(state.pillarsBestSelf, v => state.pillarsBestSelf = v)));

  wrap.appendChild(help(
    "Rules: Tap to select 3–6 of your Pillars OR add custom ones. We’ll road-test on the next step."
  ));

  wrap.appendChild(chipPicker(PILLAR_OPTIONS, state.pillarCandidates, (next) => {
    state.pillarCandidates = next;
    // clear removed tests
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
    "• YES = Move to Values\n• NO = Keep as a Pillar"
  ));

  const candidates = [...state.pillarCandidates];
  if(candidates.length === 0){
    wrap.appendChild(help("No Pillars candidates selected yet. Go back and choose 3–6 candidates."));
    return wrap;
  }

  // Road Test 1
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

    const yes = chipBtn("YES", state.pillarTest1[p] === "yes", () => {
      state.pillarTest1[p] = "yes";
      saveState(); render();
    });

    const no = chipBtn("NO", state.pillarTest1[p] === "no", () => {
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

  // Derive moved-to-values and remaining pillars after test1 decisions
  const movedToValues = [];
  const remainingAfter1 = [];

  for(const p of candidates){
    if(state.pillarTest1[p] === "yes") movedToValues.push(p);
    if(state.pillarTest1[p] === "no") remainingAfter1.push(p);
  }

  wrap.appendChild(hr());

  // Live results box (like screenshot)
  const liveBox = document.createElement("div");
  liveBox.className = "smallBox";
  liveBox.innerHTML = `<div class="miniTitle">Live results</div>`;
  liveBox.appendChild(summaryLine("Moved to Values", movedToValues));
  liveBox.appendChild(summaryLine("Remaining Pillars", remainingAfter1));
  wrap.appendChild(liveBox);

  wrap.appendChild(hr());

  wrap.appendChild(help(
    "Road Test 2\nIf you took these characteristics away, would you be a shell of yourself?\n" +
    "• YES = Keep as a Pillar\n• NO = Remove"
  ));

  // Road Test 2 only for remainingAfter1
  remainingAfter1.forEach(p => {
    const card = document.createElement("div");
    card.className = "qaCard";

    const top = document.createElement("div");
    top.className = "qaTop";

    const left = document.createElement("div");
    left.innerHTML = `<div class="qaWord">${escapeHtml(p)}</div>
      <div class="qaQ">If you took this characteristic away, would you be a shell of yourself?</div>`;

    const btns = document.createElement("div");
    btns.className = "btnRow";

    const yes = chipBtn("YES", state.pillarTest2[p] === "yes", () => {
      state.pillarTest2[p] = "yes";
      saveState(); render();
    });

    const no = chipBtn("NO", state.pillarTest2[p] === "no", () => {
      state.pillarTest2[p] = "no";
      saveState(); render();
    });

    const remove = chipBtn("Remove", false, () => {
      // Remove from candidates entirely
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

  // Confirmed Pillars after test2
  const confirmedPillars = [];
  for(const p of remainingAfter1){
    if(state.pillarTest2[p] === "yes") confirmedPillars.push(p);
  }

  // Confirmed Values = valuesTest yes + movedToValues (from pillars test1 yes)
  const confirmedValues = confirmedValuesList();

  wrap.appendChild(hr());
  wrap.appendChild(summaryMini("Confirmed Pillars", confirmedPillars));
  wrap.appendChild(summaryMini("Moved to Values", movedToValues));
  wrap.appendChild(summaryMini("Confirmed Values", confirmedValues));

  wrap.appendChild(help("Practical Application: Lead from your unique strengths."));
  return wrap;
}

function stepIdealEmotion(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 6 — Step 5 of 6: Ideal Emotion"));
  wrap.appendChild(help(
    "Your Ideal Emotion is what you want to feel each day (yes, it is ok to have 2 Ideal Emotions).\n" +
    "When you’re not feeling that emotion, revisit your Values and Pillars to see where you are not aligned with the WHO words that you selected."
  ));

  wrap.appendChild(field("Pick one (or your closest)", select(IDEAL_EMOTION_OPTIONS, state.idealEmotion1, v => state.idealEmotion1 = v)));

  // Slider 1–10
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

  wrap.appendChild(help(
    "Practical Application: Use your Ideal Emotion as a compass to determine choices and responses.\n\n" +
    "Alignment Check\nWhen your Ideal Emotion dips, ask:\n" +
    "• Which Value did I compromise?\n" +
    "• Which Pillar am I not embodying?\n" +
    "• Is my Trigger leading (more on that)?\n" +
    "• What action realigns me?"
  ));

  return wrap;
}

function stepTrigger(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 7 — Step 6 of 6: Trigger (Anti-WHO)"));
  wrap.appendChild(help(
    "Just as important as knowing your Values and Pillars, is recognizing the inner critic voice that makes you feel demoralized, pulls you off course, and causes you to react. That’s your Trigger.\n" +
    "Your Trigger is one loud “I’m not...” story that surfaces when you feel under pressure. We all have one.\n\n" +
    "Pick one from the list OR add a custom one."
  ));

  // Chips with “I’m not …”
  const chipList = TRIGGER_OPTIONS.map(x => `I’m not ${x}`);
  wrap.appendChild(chipPicker(chipList, state.triggerPicked ? [state.triggerPicked] : [], (next) => {
    state.triggerPicked = next[0] || "";
    saveState(); render();
  }, 1, true));

  wrap.appendChild(field("Choose or add your “I’m not” Trigger.", inputText(state.triggerCustom, v => state.triggerCustom = v)));
  wrap.appendChild(field("Name how it makes you feel.", inputText(state.triggerFeel, v => state.triggerFeel = v)));
  wrap.appendChild(field("Optional Reset Script: When my Trigger appears, how will you pivot to your WHO? (simple plan)", textarea(state.resetScript, v => state.resetScript = v)));

  wrap.appendChild(help(
    "Practical Application: Recognize the Trigger quickly so it doesn’t hijack your response — reactive vs intentional response."
  ));

  return wrap;
}

function stepSnapshot(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 8 — Your WHO Snapshot"));

  const confirmedValues = confirmedValuesList();
  const confirmedPillars = confirmedPillarsList();
  const trig = (state.triggerPicked || state.triggerCustom || "—");
  const emotions = [state.idealEmotion1, state.idealEmotion2].filter(Boolean);

  wrap.appendChild(summaryMini("Values — Your guardrails", confirmedValues.length ? confirmedValues : ["—"]));
  wrap.appendChild(summaryMini("Pillars — Your energy source", confirmedPillars.length ? confirmedPillars : ["—"]));
  wrap.appendChild(summaryMini("Ideal Emotion — Your compass", emotions.length ? emotions : ["—"]));
  wrap.appendChild(summaryMini("Ideal Emotion rating (target: 8/10)", [`${state.idealEmotionRating}/10`]));
  wrap.appendChild(summaryMini("Trigger — Your warning signal", [trig]));

  wrap.appendChild(help(
    "Values - Revisit your values when you feel conflicted to determine if you are honoring them.\n" +
    "Pillars - When feeling depleted, do an external activity or self-care to feed one/more of your Pillars.\n" +
    "Ideal Emotion - When you are not at the level you desire, look at your Values and Pillars, then determine how to re-align.\n" +
    "Trigger (Anti-WHO) - Silently identify to yourself when your Trigger shows up (“That’s my Trigger talking”). Then purposely create distance and do a pausing technique.\n\n" +
    "Refine over time. Awareness builds self-command. Test your Values and Pillars in real situations, notice what holds or shifts, and refine your list over time."
  ));

  wrap.appendChild(hr());

  // Comments at end (per request)
  wrap.appendChild(field("Comments on the assessment, share a learning, or just say “hi”", textarea(state.comments, v => state.comments = v)));

  return wrap;
}

function stepEnd(){
  const wrap = document.createElement("div");

  wrap.appendChild(sectionTitle("Page 9 — Next Step"));

  wrap.appendChild(help(
    "This week, lead with:\n" +
    "• One Value\n" +
    "• One Pillar\n\n" +
    "If your Ideal Emotion dips, check what you compromised.\n\n" +
    "Hoping you enjoyed this assessment. For additional insights and tips, grab a copy of my book.\n\n" +
    "Make the World a Better Place*,\nDana Lynn Bernstein, PMP, PCC\nThe Conflict Resolution Coach\nLinkedIn - https://www.linkedin.com/in/danabernstein/\n*Girl Scouts motto • Portion of book proceeds support Girl Scouts"
  ));

  // Email preview (no backend emails in GH Pages)
  const emailBox = document.createElement("div");
  emailBox.className = "smallBox";
  emailBox.innerHTML = `<div class="miniTitle">Email (Preview)</div>
    <div class="helpText" style="color:var(--ink); margin:0;">
      This is a preview of the results email text specified in the PDF. (Sending requires a backend or a Google Forms entry-id setup.)
    </div>`;

  const pre = document.createElement("div");
  pre.className = "helpText";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.marginTop = "10px";
  pre.style.color = "var(--ink)";
  pre.textContent = buildEmailBody();
  emailBox.appendChild(pre);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.style.marginTop = "10px";
  copyBtn.textContent = "Copy email text";
  copyBtn.onclick = async () => {
    try{
      await navigator.clipboard.writeText(buildEmailBody());
      copyBtn.textContent = "Copied!";
      setTimeout(()=> copyBtn.textContent = "Copy email text", 1200);
    }catch{
      alert("Copy failed on this device/browser.");
    }
  };

  emailBox.appendChild(copyBtn);
  wrap.appendChild(emailBox);

  return wrap;
}

/* ------------------------ Derived Results Logic ------------------------ */

function confirmedValuesList(){
  const confirmed = [];
  // from values road test
  for(const v of state.valueCandidates){
    if(state.valueTest[v] === "yes") confirmed.push(v);
  }
  // add pillars moved to values (road test 1 yes)
  for(const p of state.pillarCandidates){
    if(state.pillarTest1[p] === "yes" && !confirmed.includes(p)) confirmed.push(p);
  }
  return confirmed;
}

function confirmedPillarsList(){
  const confirmed = [];
  // only pillars that are NO in test1 and YES in test2
  for(const p of state.pillarCandidates){
    if(state.pillarTest1[p] === "no" && state.pillarTest2[p] === "yes"){
      confirmed.push(p);
    }
  }
  return confirmed;
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

/* ----------------------------- Email Text ----------------------------- */

function buildEmailBody(){
  const name = state.name?.trim() ? state.name.trim() : "there";

  const confirmedValues = confirmedValuesList();
  const confirmedPillars = confirmedPillarsList();
  const emotions = [state.idealEmotion1, state.idealEmotion2].filter(Boolean);
  const trig = (state.triggerPicked || state.triggerCustom || "—");

  return [
    `Dear ${name}`,
    ``,
    `Thank you for taking the WHO Thoughts Assessment™.`,
    `Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self, and recognize the thoughts that quietly pull you off course.`,
    ``,
    `When your nervous system is regulated, you are powerful. You respond instead of react. You choose instead of spiral.`,
    ``,
    `Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve drifted from your WHO and knowing how to return.`,
    ``,
    `My goal is to help you uncover and celebrate the best parts of what make you you — the strengths and natural qualities that already exist within you — and show you how to use them to move through conflict with clarity and confidence.`,
    ``,
    `Now imagine a world where more of us faced challenges this way: grounded, intentional, and self-led.`,
    ``,
    `These are the results of your WHO Thoughts Assessment™. Reflect, reconnect, and reclaim the thoughts that shape your life.`,
    ``,
    `Your Results`,
    `Values: ${confirmedValues.length ? confirmedValues.join(", ") : "—"}`,
    `Pillars: ${confirmedPillars.length ? confirmedPillars.join(", ") : "—"}`,
    `Ideal Emotion: ${emotions.length ? emotions.join(", ") : "—"} (target: ${state.idealEmotionRating}/10)`,
    `Trigger: ${trig}`,
    ``,
    `Internal Conflict & Choice`,
    `Internal conflict comes from`,
    `1. Competing WHO traits. You can be:`,
    `• Independent and community-oriented`,
    `• Passionate and peaceful`,
    `When something happens that evokes an emotion, intentionally choose which Value or Pillar to be your response team.`,
    ``,
    `2. Values “over used”. Examples:`,
    `• If “excellence” is your Value, you may feel stuck when starting a new endeavor. Choose another Value to lead with, then bring “excellence” in as a guide.`,
    `• A “perseverance” value can be singularly focused. Instead, face perseverance towards balance.`,
    ``,
    `3. Dialing down your WHO to an unsustainable level:`,
    `• Know when your WHO is too low for too long. Add self care to the list (and help others).`,
    `• Situations calls for a different WHO to be used and at various levels. Choose with intention.`,
    ``,
    `Live clean between your ears.`,
    `— Dana Lynn Bernstein, PMP, PCC`,
    `The Conflict Resolution Coach`,
    `Additional exercises and reflections in my book, It’s the Thought That Counts: Mastering the Art of YOU vs You`,
    `A portion of book proceeds support Girl Scouts`,
    ``,
    `© ${new Date().getFullYear()} My WHO Thoughts Assessment™ — All rights reserved`,
    `www.MyWHOthoughts.com • Book link https://bit.ly/3PxJ3MD`,
    ``,
    `(Add Unsubscribe button)`,
  ].join("\n");
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
