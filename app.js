/* =========================================================
   WHO THOUGHTS ASSESSMENT™
   FULL JS TEST + DATA SUBMISSION
   ========================================================= */

/* =========================
   🔒 EXACT WORDING ONLY
   ========================= */

const ASSESSMENT_COPY = {
  intro: {
    title: "PASTE EXACT INTRO TITLE HERE",
    body: "PASTE EXACT INTRO BODY TEXT HERE",
    startButton: "PASTE EXACT BUTTON TEXT HERE"
  },

  userInfo: {
    nameLabel: "PASTE EXACT NAME LABEL",
    emailLabel: "PASTE EXACT EMAIL LABEL",
    continueButton: "PASTE EXACT CONTINUE BUTTON TEXT"
  },

  questions: [
    {
      id: 1,
      question: "PASTE QUESTION 1 EXACTLY",
      answers: [
        { text: "PASTE ANSWER A EXACTLY", value: 1 },
        { text: "PASTE ANSWER B EXACTLY", value: 2 },
        { text: "PASTE ANSWER C EXACTLY", value: 3 },
        { text: "PASTE ANSWER D EXACTLY", value: 4 }
      ]
    }
    // ⬆️ ADD ALL QUESTIONS — NOTHING OMITTED
  ],

  results: {
    low: {
      label: "PASTE RESULT LABEL EXACTLY",
      title: "PASTE RESULT TITLE EXACTLY",
      body: "PASTE RESULT BODY EXACTLY"
    },
    medium: {
      label: "PASTE RESULT LABEL EXACTLY",
      title: "PASTE RESULT TITLE EXACTLY",
      body: "PASTE RESULT BODY EXACTLY"
    },
    high: {
      label: "PASTE RESULT LABEL EXACTLY",
      title: "PASTE RESULT TITLE EXACTLY",
      body: "PASTE RESULT BODY EXACTLY"
    }
  }
};

/* =========================
   🧠 STATE
   ========================= */

let currentQuestion = 0;
let score = 0;
let userName = "";
let userEmail = "";

const app = document.getElementById("app");

/* =========================
   INTRO
   ========================= */

function renderIntro() {
  app.innerHTML = `
    <h1>${ASSESSMENT_COPY.intro.title}</h1>
    <p>${ASSESSMENT_COPY.intro.body}</p>
    <button id="startBtn">${ASSESSMENT_COPY.intro.startButton}</button>
  `;

  document.getElementById("startBtn").onclick = renderUserInfo;
}

/* =========================
   USER INFO
   ========================= */

function renderUserInfo() {
  app.innerHTML = `
    <label>${ASSESSMENT_COPY.userInfo.nameLabel}</label>
    <input id="nameInput" type="text" required>

    <label>${ASSESSMENT_COPY.userInfo.emailLabel}</label>
    <input id="emailInput" type="email" required>

    <button id="continueBtn">${ASSESSMENT_COPY.userInfo.continueButton}</button>
  `;

  document.getElementById("continueBtn").onclick = () => {
    userName = document.getElementById("nameInput").value.trim();
    userEmail = document.getElementById("emailInput").value.trim();

    if (!userName || !userEmail) return alert("Please complete all fields.");

    renderQuestion();
  };
}

/* =========================
   QUESTIONS
   ========================= */

function renderQuestion() {
  const q = ASSESSMENT_COPY.questions[currentQuestion];

  app.innerHTML = `
    <div class="progress">
      Question ${currentQuestion + 1} of ${ASSESSMENT_COPY.questions.length}
    </div>
    <h2>${q.question}</h2>
    <div class="answers">
      ${q.answers
        .map(
          a => `<button class="answer-btn" data-value="${a.value}">${a.text}</button>`
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.onclick = () => {
      score += Number(btn.dataset.value);
      currentQuestion++;
      currentQuestion < ASSESSMENT_COPY.questions.length
        ? renderQuestion()
        : renderResults();
    };
  });
}

/* =========================
   RESULTS + SUBMISSION
   ========================= */

function renderResults() {
  const max = ASSESSMENT_COPY.questions.length * 4;
  const ratio = score / max;

  let result;
  if (ratio < 0.34) result = ASSESSMENT_COPY.results.low;
  else if (ratio < 0.67) result = ASSESSMENT_COPY.results.medium;
  else result = ASSESSMENT_COPY.results.high;

  submitResults(result.label);

  app.innerHTML = `
    <h1>${result.title}</h1>
    <p>${result.body}</p>
  `;
}

/* =========================
   🔐 SEND DATA TO YOU
   ========================= */

function submitResults(resultLabel) {
  const formURL = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse";

  const data = new FormData();
  data.append("entry.NAME_FIELD_ID", userName);
  data.append("entry.EMAIL_FIELD_ID", userEmail);
  data.append("entry.SCORE_FIELD_ID", score);
  data.append("entry.RESULT_FIELD_ID", resultLabel);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: data
  });
}

/* =========================
   INIT
   ========================= */

renderIntro();
