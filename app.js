/* =====================================================
   CONFIG
===================================================== */
const STORAGE_KEY = "who_assessment_pdf_exact";
const WELCOME_IMAGE = "./welcome.jpg";

/* =====================================================
   DEFAULT STATE
===================================================== */
const DEFAULTS = {
  meta: { name: "", email: "", emailOptIn: false },

  values: [],
  valuesConfirmed: [],

  pillars: [],
  pillarsRemaining: [],
  pillarsMovedToValues: [],

  idealEmotion: "",
  idealEmotion2: "",
  idealEmotionLevel: 5,

  trigger: {
    story: "",
    feeling: "",
    reset: ""
  }
};

let state = loadState();
let stepIndex = 0;

/* =====================================================
   OPTIONS (PDF EXACT)
===================================================== */
const VALUES = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er",
  "Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty",
  "Impact","Independence","Inclusivity","Integrity","Justice","Kind","Loyalty",
  "Open Mind","Perseverance","Reliability","Resilience","Respect","Self-Reliance",
  "Service","Structure","Transparency"
];

const PILLARS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Considerate","Creative","Earthy","Empathy","Explorer",
  "Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor",
  "Introspective","Impact","Kind","Laughter","Limitless","Listener","Love","Nerdy",
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present",
  "Problem Solver","Sarcastic","Service"
];

const EMOTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled",
  "Freedom","Grateful","Happiness","Inspired","Joy","Peace","Playful",
  "Present","Serenity"
];

const TRIGGERS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart enough","Valued","Wanted"
];

/* =====================================================
   DOM
===================================================== */
const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elProgress = document.getElementById("progressBar");

/* =====================================================
   STEPS — PDF ORDER
===================================================== */
const steps = [

/* PAGE 1 — WELCOME */
{
  title: "My WHO Thoughts Assessment™",
  hint: "Define Your WHO • Quick clarity. No fluff.",
  render(){
    elBody.innerHTML = `
      <img src="${WELCOME_IMAGE}" style="width:100%;border-radius:16px;margin-bottom:20px"/>

      <p>When your nervous system is regulated, you are powerful.  
      You respond instead of react. You choose instead of spiral.</p>

      <p><strong>Self-command isn’t about perfection — it’s about awareness.</strong></p>

      <p>It’s about noticing when you’ve drifted from your WHO and knowing how to return.</p>

      <p>This assessment is your invitation to reflect, reconnect, and reclaim the thoughts that shape your life.</p>

      <p><strong>— Dana Lynn Bernstein, PMP, PCC</strong><br/>
      <em>The Conflict Resolution Coach</em></p>
    `;
  },
  validate:()=>true
},

/* PAGE 3 — START */
{
  title: "Start",
  hint: "Email is optional.",
  render(){
    elBody.innerHTML = `
      <div class="field"><label>Your name</label>
      <input value="${state.meta.name}"></div>

      <div class="field"><label>Your email</label>
      <input value="${state.meta.email}"></div>

      <label class="small">
        <input type="checkbox" ${state.meta.emailOptIn?"checked":""}>
        Email my results and bonus content
      </label>
    `;
    const i = elBody.querySelectorAll("input");
    i[0].oninput=e=>state.meta.name=e.target.value;
    i[1].oninput=e=>state.meta.email=e.target.value;
    i[2].onchange=e=>state.meta.emailOptIn=e.target.checked;
  },
  validate:()=>state.meta.name||"Enter your name"
},

/* PAGE 4 — VALUES DISCOVER */
{
  title:"Step 1 of 6 — Values (Discover)",
  hint:"What are your non-negotiable rules?",
  render(){
    renderMulti("values", VALUES,
      "Tap to select 3–6 Values OR add your own.");
  },
  validate:()=>state.values.length>=3||"Select at least 3 Values"
},

/* VALUES ROAD TEST */
{
  title:"Step 2 of 6 — Values (Road Test)",
  hint:"Values evoke emotion when crossed.",
  render(){
    elBody.innerHTML="";
    state.values.forEach(v=>{
      const d=document.createElement("div");
      d.className="result-box";
      d.innerHTML=`
        <strong>${v}</strong>
        <p>If someone violates this, do you feel upset / angry / frustrated?</p>
        <button class="btn yes">YES</button>
        <button class="btn ghost">NO</button>
      `;
      d.querySelector(".yes").onclick=()=>{
        if(!state.valuesConfirmed.includes(v))
          state.valuesConfirmed.push(v);
        save();
      };
      d.querySelector(".ghost").onclick=()=>{
        state.valuesConfirmed=state.valuesConfirmed.filter(x=>x!==v);
        save();
      };
      elBody.appendChild(d);
    });
  },
  validate:()=>state.valuesConfirmed.length>=2||"Confirm at least 2 Values"
},

/* PAGE 5 — PILLARS DISCOVER */
{
  title:"Step 3 of 6 — Pillars (Discover)",
  hint:"Who you are at your happiest and most YOU.",
  render(){
    renderMulti("pillars", PILLARS,
      "Tap to select 3–6 Pillars OR add your own.");
  },
  validate:()=>state.pillars.length>=3||"Select at least 3 Pillars"
},

/* PILLARS ROAD TEST */
{
  title:"Step 4 of 6 — Pillars (Road Test)",
  hint:"Test each characteristic.",
  render(){
    elBody.innerHTML="";
    state.pillars.forEach(p=>{
      const d=document.createElement("div");
      d.className="result-box";
      d.innerHTML=`
        <strong>${p}</strong>
        <p>If someone crosses this, do you feel upset?</p>
        <button class="btn yes">YES → Move to Values</button>
        <button class="btn ghost">NO → Keep</button>
      `;
      d.querySelector(".yes").onclick=()=>{
        state.pillarsMovedToValues.push(p);
        save();
      };
      d.querySelector(".ghost").onclick=()=>{
        state.pillarsRemaining.push(p);
        save();
      };
      elBody.appendChild(d);
    });
  },
  validate:()=>state.pillarsRemaining.length>=2||"Keep at least 2 Pillars"
},

/* PAGE 6 — IDEAL EMOTION */
{
  title:"Step 5 of 6 — Ideal Emotion",
  hint:"Your emotional compass.",
  render(){
    renderMultiSingle("idealEmotion", EMOTIONS);
    elBody.innerHTML+=`
      <label>How strongly do you feel it? (1–10)</label>
      <input type="range" min="1" max="10" value="${state.idealEmotionLevel}">
      <label>Optional second Ideal Emotion</label>
      <input value="${state.idealEmotion2}">
    `;
    const i=elBody.querySelectorAll("input");
    i[1].oninput=e=>state.idealEmotionLevel=+e.target.value;
    i[2].oninput=e=>state.idealEmotion2=e.target.value;
  },
  validate:()=>state.idealEmotion||"Choose an Ideal Emotion"
},

/* PAGE 7 — TRIGGER */
{
  title:"Step 6 of 6 — Trigger (Anti-WHO)",
  hint:"Recognize it before it hijacks you.",
  render(){
    elBody.innerHTML=`
      <label>My Trigger is “I’m not ___ enough”</label>
      <input value="${state.trigger.story}">
      <label>It makes me feel</label>
      <input value="${state.trigger.feeling}">
      <label>Reset Script</label>
      <textarea>${state.trigger.reset}</textarea>
    `;
    const i=elBody.querySelectorAll("input,textarea");
    i[0].oninput=e=>state.trigger.story=e.target.value;
    i[1].oninput=e=>state.trigger.feeling=e.target.value;
    i[2].oninput=e=>state.trigger.reset=e.target.value;
  },
  validate:()=>state.trigger.story||"Define your Trigger"
},

/* PAGE 8 — SNAPSHOT */
{
  title:"Your WHO Snapshot",
  hint:"Awareness builds self-command.",
  render(){
    elBody.innerHTML=`
      <strong>Values</strong><br>${state.valuesConfirmed.join(", ")}<br><br>
      <strong>Pillars</strong><br>${state.pillarsRemaining.join(", ")}<br><br>
      <strong>Ideal Emotion</strong><br>${state.idealEmotion} (${state.idealEmotionLevel}/10)<br><br>
      <strong>Trigger</strong><br>${state.trigger.story}
    `;
  },
  validate:()=>true
}

];

/* =====================================================
   HELPERS
===================================================== */
function renderMulti(key,list,hint){
  elBody.innerHTML=`<p>${hint}</p>`;
  const s=new Set(state[key]);
  list.forEach(w=>{
    const p=document.createElement("div");
    p.className="pill"+(s.has(w)?" selected":"");
    p.textContent=w;
    p.onclick=()=>{
      s.has(w)?s.delete(w):s.add(w);
      state[key]=[...s];
      save(); renderStep();
    };
    elBody.appendChild(p);
  });
}

function renderMultiSingle(key,list){
  elBody.innerHTML="";
  list.forEach(w=>{
    const p=document.createElement("div");
    p.className="pill"+(state[key]===w?" selected":"");
    p.textContent=w;
    p.onclick=()=>{state[key]=w;save();renderStep();};
    elBody.appendChild(p);
  });
}

function renderStep(){
  const s=steps[stepIndex];
  elTitle.textContent=s.title;
  elHint.textContent=s.hint;
  elBack.style.visibility=stepIndex?"visible":"hidden";
  elProgress.style.width=`${(stepIndex/(steps.length-1))*100}%`;
  elBody.innerHTML="";
  s.render();
}

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function loadState(){return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(DEFAULTS);}
