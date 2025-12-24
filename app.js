const screens = document.querySelectorAll(".screen");
let index = 0;

const valuesList = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient",
  "Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty","Impact","Independence",
  "Inclusivity","Integrity","Justice","Kind","Loyalty","Open Mind","Perseverance",
  "Reliability","Resilience","Respect","Self Reliance","Service","Structure","Transparency"
];

const pillarsList = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection",
  "Connector","Considerate","Creative","Earthy","Empathy","Explorer","Faith","Family","Fierce",
  "Fun","Goofy","Grounded","Gratitude","Helper","Humor","Introspective","Impact","Kind","Laughter",
  "Limitless","Listener","Love","Nerdy","Open Mind","Optimist","Passion","Patient","Peace",
  "Playful","Present","Problem Solver","Sarcastic","Service"
];

const emotions = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom","Grateful",
  "Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
];

const triggers = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to","Respected","Seen",
  "Smart enough","Valued","Wanted"
];

const state = {
  values: [],
  confirmedValues: [],
  pillars: [],
  confirmedPillars: [],
  movedToValues: [],
  emotions: [],
  emotionLevel: 5,
  trigger: ""
};

function renderBank(list, container, handler) {
  container.innerHTML = "";
  list.forEach(item => {
    const el = document.createElement("span");
    el.textContent = item;
    el.onclick = () => handler(item);
    container.appendChild(el);
  });
}

renderBank(valuesList, document.getElementById("valuesBank"), v => {
  if (!state.values.includes(v)) {
    state.values.push(v);
    updateSelected("valuesSelected", state.values);
  }
});

renderBank(pillarsList, document.getElementById("pillarsBank"), p => {
  if (!state.pillars.includes(p)) {
    state.pillars.push(p);
    updateSelected("confirmedPillars", state.pillars);
  }
});

renderBank(emotions, document.getElementById("emotionBank"), e => {
  if (state.emotions.length < 2 && !state.emotions.includes(e)) {
    state.emotions.push(e);
  }
});

renderBank(triggers, document.getElementById("triggerBank"), t => {
  state.trigger = "I'm not " + t;
});

function updateSelected(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = list.map(v => `<span>${v}</span>`).join("");
}

function setEmotionLevel(v) {
  state.emotionLevel = v;
  document.getElementById("emotionLevel").textContent = v;
}

function updateSnapshot() {
  document.getElementById("snapValues").textContent = state.values.join(", ");
  document.getElementById("snapPillars").textContent = state.pillars.join(", ");
  document.getElementById("snapEmotion").textContent =
    state.emotions.join(" & ") + " (" + state.emotionLevel + "/10)";
  document.getElementById("snapTrigger").textContent = state.trigger;
}

function show() {
  screens.forEach(s => s.classList.remove("active"));
  screens[index].classList.add("active");
  updateSnapshot();
  document.getElementById("progressBar").style.width =
    Math.min(index,6)/6*100 + "%";
}

function next() {
  if (index < screens.length - 1) index++;
  show();
}

function prev() {
  if (index > 0) index--;
  show();
}

function start() {
  index = 1;
  show();
}

function adjustFont(d) {
  const r = document.documentElement;
  r.style.fontSize = (parseInt(getComputedStyle(r).fontSize) + d) + "px";
}

show();
