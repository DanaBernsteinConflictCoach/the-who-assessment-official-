const steps = [];
let stepIndex = 0;

const state = {
  name: "",
  email: "",
  emailOptIn: false,
  values: [],
  pillars: [],
  idealEmotions: [],
  idealEmotionRating: 8,
  trigger: "",
  triggerFeeling: "",
  resetScript: ""
};

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSf_REPLACE_WITH_REAL_ID/formResponse";

// ===== UTIL =====
const el = id => document.getElementById(id);
const stepContent = el("stepContent");

el("year").textContent = new Date().getFullYear();

// ===== STEP RENDERING =====
function render() {
  stepContent.innerHTML = steps[stepIndex]();
  el("backBtn").disabled = stepIndex === 0;
  el("nextBtn").textContent = stepIndex === steps.length - 1 ? "Finish" : "Next";
  el("progressBar").style.width = `${(stepIndex / (steps.length - 1)) * 100}%`;
}

el("backBtn").onclick = () => {
  if (stepIndex > 0) stepIndex--;
  render();
};

el("nextBtn").onclick = () => {
  if (stepIndex < steps.length - 1) {
    stepIndex++;
    render();
  } else {
    submitToGoogleForm();
    sendResultsEmail();
    alert("Thank you! Your results are ready.");
  }
};

// ===== GOOGLE FORM SUBMIT =====
function submitToGoogleForm() {
  const data = new FormData();
  data.append("entry.1111111111", state.name);
  data.append("entry.2222222222", state.email);
  data.append("entry.3333333333", state.values.join(", "));
  data.append("entry.4444444444", state.pillars.join(", "));
  data.append(
    "entry.5555555555",
    `${state.idealEmotions.join(", ")} (${state.idealEmotionRating}/10)`
  );
  data.append("entry.6666666666", state.trigger);

  fetch(GOOGLE_FORM_ACTION, {
    method: "POST",
    mode: "no-cors",
    body: data
  });
}

// ===== EMAIL =====
function sendResultsEmail() {
  if (!state.emailOptIn || !state.email) return;

  const body = `
Dear ${state.name},

Thank you for taking the WHO Thoughts Assessment™.

These are the results of your assessment.

VALUES:
${state.values.join(", ")}

PILLARS:
${state.pillars.join(", ")}

IDEAL EMOTION:
${state.idealEmotions.join(", ")} (${state.idealEmotionRating}/10)

TRIGGER:
${state.trigger}

RESET SCRIPT:
${state.resetScript}

— Dana Lynn Bernstein, PMP, PCC
The Conflict Resolution Coach

© ${new Date().getFullYear()} My WHO Thoughts Assessment™
www.MyWHOthoughts.com
`;

  window.location.href =
    `mailto:${state.email}?subject=${encodeURIComponent(
      "Your WHO Thoughts Assessment™ Results"
    )}&body=${encodeURIComponent(body)}`;
}

// ===== STEPS =====
steps.push(() => `
  <div class="section">
    <img src="images/welcome.jpg" alt="Welcome">
    <h2>Welcome</h2>
    <p>Thank you for taking the WHO Thoughts Assessment™...</p>
  </div>
`);

steps.push(() => `
  <div class="section">
    <h2>Start</h2>
    <input placeholder="Your Name" oninput="state.name=this.value">
    <input placeholder="Your Email" oninput="state.email=this.value">
    <label>
      <input type="checkbox" onchange="state.emailOptIn=this.checked">
      Email my results and bonus content
    </label>
  </div>
`);

// (Additional steps continue in same pattern for Values, Pillars, Ideal Emotion, Trigger, Results)

// INITIALIZE
render();
