/* =========================================================
   MY WHO THOUGHTS ASSESSMENT™
   © 2025 Dana Lynn Bernstein
   Full JS Assessment Engine
   ========================================================= */

const app = document.getElementById("app");

/* =========================
   STATE
   ========================= */

const state = {
  step: 0,
  name: "",
  email: "",
  valuesCandidates: [],
  confirmedValues: [],
  pillarsCandidates: [],
  confirmedPillars: [],
  movedPillarsToValues: [],
  idealEmotion: "",
  idealEmotionLevel: 5,
  secondIdealEmotion: "",
  trigger: "",
  triggerFeeling: "",
  resetScript:
    "That’s my Trigger talking. I’m choosing [Pillar] and honoring [Value]."
};

/* =========================
   CONSTANTS (EXACT WORDING)
   ========================= */

const VALUES_LIST = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity",
  "Do-er","Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude",
  "Honesty","Impact","Independence","Inclusivity","Integrity","Justice",
  "Kind","Loyalty","Open Mind","Perseverance","Reliability","Resilience",
  "Respect","Self-Reliance","Service","Structure","Transparency"
];

const PILLARS_LIST = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion",
  "Confident","Connection","Connector","Considerate","Creative","Earthy",
  "Empathy","Explorer","Faith","Family","Fierce","Fun","Goofy","Grounded",
  "Gratitude","Helper","Humor","Introspective","Impact","Kind","Laughter",
  "Limitless","Listener","Love","Nerdy","Open Mind","Optimist","Passion",
  "Patient","Peace","Playful","Present","Problem Solver","Sarcastic","Service"
];

const IDEAL_EMOTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled",
  "Freedom","Grateful","Gratitude","Happiness","Inspired","Joy","Peace",
  "Playful","Present","Serenity"
];

const TRIGGERS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart enough","Valued","Wanted"
];

/* =========================
   NAV + PROGRESS
   ========================= */

function progress() {
  return `<div class="progress">
    Step ${state.step + 1} of 8
    <div class="bar"><div style="width:${((state.step+1)/8)*100}%"></div></div>
  </div>`;
}

function next() { state.step++; render(); }
function back() { state.step--; render(); }

/* =========================
   RENDER HELPERS
   ========================= */

function toggle(list, value, limit = null) {
  if (list.includes(value)) {
    list.splice(list.indexOf(value), 1);
  } else {
    if (limit && list.length >= limit) return;
    list.push(value);
  }
  render();
}

/* =========================
   PAGES
   ========================= */

const pages = [

/* 1 — WELCOME */
() => `
${progress()}
<h1>My WHO Thoughts Assessment™</h1>
<h2>Define Your WHO</h2>
<p><em>Quick clarity. No fluff.</em></p>

<p>Thank you for taking the WHO Thoughts Assessment™.</p>

<p>Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self, and recognize the thoughts that quietly pull you off course.</p>

<p>When your nervous system is regulated, you are powerful. You respond instead of react. You choose instead of spiral.</p>

<p>Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve drifted from your WHO and knowing how to return.</p>

<p>My goal is to help you uncover and celebrate the best parts of what make you you — the strengths and natural qualities that already exist within you — and show you how to use them to move through conflict with clarity and confidence.</p>

<p>Now imagine a world where more of us faced challenges this way: grounded, intentional, and self-led.</p>

<p>The WHO Thoughts Assessment™ is your invitation to reflect, reconnect, and reclaim the thoughts that shape your life.</p>

<p>— Dana Lynn Bernstein, PMP, PCC<br>The Conflict Resolution Coach</p>

<button onclick="next()">Next</button>
`,

/* 2 — START */
() => `
${progress()}
<h2>Start</h2>

<label>Your name</label>
<input id="name" value="${state.name}" />

<label>Your email</label>
<input id="email" value="${state.email}" />

<label>
<input type="checkbox" checked />
Email my results and bonus content. Email is optional.
</label>

<button onclick="saveUser()">Next</button>
`,

/* 3 — VALUES DISCOVER */
() => `
${progress()}
<h2>Step 1 of 6: Values (Discover)</h2>

<p>Rules: Tap to select 3–6 of your Values OR add custom ones.</p>

<div class="grid">
${VALUES_LIST.map(v =>
  `<button class="${state.valuesCandidates.includes(v) ? "selected" : ""}"
   onclick="toggle(state.valuesCandidates,'${v}',6)">${v}</button>`
).join("")}
</div>

<input id="addValue" placeholder="Add a candidate and press Enter"
onkeydown="if(event.key==='Enter'){toggle(state.valuesCandidates,this.value,6);this.value=''}"/>

<button onclick="back()">Back</button>
<button onclick="next()" ${state.valuesCandidates.length<3?"disabled":""}>Next</button>
`,

/* 4 — VALUES ROAD TEST */
() => `
${progress()}
<h2>Step 2 of 6: Values Evoke Emotions (Road Test)</h2>

${state.valuesCandidates.map(v => `
<p><strong>${v}</strong><br>
If someone violates this, do you feel upset / angry / frustrated?</p>
<button onclick="confirmValue('${v}',true)">YES</button>
<button onclick="confirmValue('${v}',false)">NO</button>
`).join("")}

<button onclick="back()">Back</button>
<button onclick="next()">Next</button>
`,

/* 5 — PILLARS DISCOVER */
() => `
${progress()}
<h2>Step 3 of 6: Pillars (Discover)</h2>

<p>Rules: Tap to select 3–6 of your Pillars OR add custom ones.</p>

<div class="grid">
${PILLARS_LIST.map(p =>
  `<button class="${state.pillarsCandidates.includes(p) ? "selected" : ""}"
   onclick="toggle(state.pillarsCandidates,'${p}',6)">${p}</button>`
).join("")}
</div>

<input placeholder="Add Pillar and press Enter"
onkeydown="if(event.key==='Enter'){toggle(state.pillarsCandidates,this.value,6);this.value=''}"/>

<button onclick="back()">Back</button>
<button onclick="next()" ${state.pillarsCandidates.length<3?"disabled":""}>Next</button>
`,

/* 6 — IDEAL EMOTION */
() => `
${progress()}
<h2>Step 5 of 6: Ideal Emotion</h2>

<select onchange="state.idealEmotion=this.value">
<option>Select…</option>
${IDEAL_EMOTIONS.map(e=>`<option>${e}</option>`).join("")}
</select>

<label>How much do you want to feel your Ideal Emotion (1–10)?</label>
<input type="range" min="1" max="10" value="${state.idealEmotionLevel}"
oninput="state.idealEmotionLevel=this.value"/>

<input placeholder="Second Ideal Emotion (optional)"
onchange="state.secondIdealEmotion=this.value"/>

<button onclick="back()">Back</button>
<button onclick="next()">Next</button>
`,

/* 7 — TRIGGER */
() => `
${progress()}
<h2>Step 6 of 6: Trigger (Anti-WHO)</h2>

<select onchange="state.trigger=this.value">
<option>Select…</option>
${TRIGGERS.map(t=>`<option>I'm not ${t}</option>`).join("")}
</select>

<input placeholder="Name how it makes you feel"
onchange="state.triggerFeeling=this.value"/>

<textarea>${state.resetScript}</textarea>

<button onclick="back()">Back</button>
<button onclick="next()">Next</button>
`,

/* 8 — SNAPSHOT */
() => `
${progress()}
<h2>Your WHO Snapshot</h2>

<p><strong>Values</strong></p>
<ul>${state.confirmedValues.map(v=>`<li>${v}</li>`).join("")}</ul>

<p><strong>Pillars</strong></p>
<ul>${state.confirmedPillars.map(p=>`<li>${p}</li>`).join("")}</ul>

<p><strong>Ideal Emotion</strong></p>
<p>${state.idealEmotion} (${state.idealEmotionLevel}/10)</p>

<p><strong>Trigger</strong></p>
<p>${state.trigger}</p>

<button onclick="submit()">Finish</button>
`
];

/* =========================
   ACTIONS
   ========================= */

function saveUser() {
  state.name = document.getElementById("name").value;
  state.email = document.getElementById("email").value;
  next();
}

function confirmValue(v, yes) {
  if (yes) state.confirmedValues.push(v);
  render();
}

/* =========================
   SUBMIT TO YOU
   ========================= */

function submit() {
  const url = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse";
  const data = new FormData();

  data.append("entry.NAME", state.name);
  data.append("entry.EMAIL", state.email);
  data.append("entry.RESULTS", JSON.stringify(state));

  fetch(url, { method: "POST", mode: "no-cors", body: data });

  app.innerHTML = "<h2>Thank you for taking the WHO Thoughts Assessment™</h2>";
}

/* =========================
   RENDER
   ========================= */

function render() {
  app.innerHTML = pages[state.step]();
}

render();
