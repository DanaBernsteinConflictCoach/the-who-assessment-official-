/* =========================================================
   CONFIG
========================================================= */
const STORAGE_KEY = "who_assessment_complete_v1";
const WELCOME_IMAGE = "./assets/welcome.jpg";

/* =========================================================
   DEFAULT STATE
========================================================= */
const DEFAULTS = {
  meta: { name: "", email: "", emailOptIn: false },

  values: [],
  valuesConfirmed: [],

  pillars: [],
  pillarsKept: [],
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

/* =========================================================
   OPTIONS (PDF EXACT)
========================================================= */
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

/* =========================================================
   DOM
========================================================= */
const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elProgress = document.getElementById("progressBar");

/* =========================================================
   STICKY NAV (BUTTON FIX)
========================================================= */
const navBar = document.createElement("div");
navBar.style.position = "sticky";
navBar.style.bottom = "0";
navBar.style.background = "#fff";
navBar.style.padding = "14px 16px";
navBar.style.display = "flex";
navBar.style.justifyContent = "space-between";
navBar.style.borderTop = "1px solid #ddd";
navBar.style.zIndex = "1000";

elBack.style.minWidth = "110px";
elNext.style.minWidth = "130px";
elNext.style.fontWeight = "700";

navBar.appendChild(elBack);
navBar.appendChild(elNext);
document.body.appendChild(navBar);

/* =========================================================
   FOOTER (PDF EXACT)
========================================================= */
const footer = document.createElement("footer");
footer.style.marginTop = "40px";
footer.style.padding = "24px";
footer.style.fontSize = "13px";
footer.style.textAlign = "center";
footer.style.opacity = "0.85";
footer.innerHTML = `
  © ${new Date().getFullYear()} My WHO Thoughts Assessment™ — All rights reserved<br/>
  <a href="http://MyWHOthoughts.com" target="_blank">www.MyWHOthoughts.com</a> •
  <a href="https://bit.ly/3PxJ3MD" target="_blank">Book link</a><br/>
  A portion of book proceeds support Girl Scouts
`;
document.body.appendChild(footer);

/* =========================================================
   STEPS — PDF ORDER
========================================================= */
const steps = [

/* PAGE 1 — WELCOME */
{
  title: "My WHO Thoughts Assessment™",
  hint: "Define Your WHO • Quick clarity. No fluff.",
  render(){
    elBody.innerHTML = `
      <img src="${WELCOME_IMAGE}" style="width:100%;max-width:720px;margin:0 auto 24px;display:block;border-radius:18px"/>

      <p><strong>When your nervous system is regulated, you are powerful.</strong></p>
      <p>You respond instead of react. You choose instead of spiral.</p>

      <p>
        <strong>Self-command isn’t about perfection — it’s about awareness.</strong>
        It’s about noticing when you’ve drifted from your WHO and knowing how to return.
      </p>

      <p>
        My goal is to help you uncover and celebrate the best parts of what make you you —
        the strengths and natural qualities that already exist within you —
        and show you how to use them to move through conflict with clarity and confidence.
      </p>

      <p><strong>— Dana Lynn Bernstein, PMP, PCC</strong><br/>
      <em>The Conflict Resolution Coach</em></p>
    `;
  },
  validate:()=>true
},

/* PAGE 2 — DEFINE WHO */
{
  title: "Define Your WHO",
  hint: "Understanding your internal framework.",
  render(){
    elBody.innerHTML = `
      <div class="result-box">
        <p><strong>Conflict is best solved by breaking it into smaller parts.</strong></p>

        <p>
          External conflict focuses on what to do or how to do something.
          Internal conflict focuses on your thoughts — why you labeled something a conflict.
        </p>

        <p>
          Identity also has two components:
          an external component (roles, titles, achievements)
          and an internal component — your <strong>WHO</strong>.
        </p>

        <p><strong>Your WHO is defined by:</strong></p>
        <ul>
          <li><strong>Values</strong> — Your guardrails</li>
          <li><strong>Pillars</strong> — Your energy source</li>
          <li><strong>Ideal Emotion</strong> — Your compass</li>
          <li><strong>Trigger</strong> — Your warning signal</li>
        </ul>

        <p><strong>Conflict happens when you believe your WHO has been threatened.</strong></p>
      </div>
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
      <div class="field">
        <label>Your name</label>
        <input value="${state.meta.name}">
      </div>

      <div class="field">
        <label>Your email</label>
