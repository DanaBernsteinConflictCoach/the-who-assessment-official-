const screens = document.querySelectorAll(".screen");
let index = 0;

function show() {
  screens.forEach(s => s.classList.remove("active"));
  screens[index].classList.add("active");
  updateProgress();
}

function next() {
  if (index < screens.length - 1) {
    index++;
    show();
  }
}

function prev() {
  if (index > 0) {
    index--;
    show();
  }
}

function startAssessment() {
  index = 1;
  show();
}

function updateProgress() {
  const steps = 6;
  const current = Math.min(index, steps);
  document.getElementById("progressBar").style.width =
    ((current) / steps) * 100 + "%";
}

function adjustFont(delta) {
  const size = parseInt(getComputedStyle(document.documentElement).fontSize);
  document.documentElement.style.fontSize = size + delta + "px";
}

document.getElementById("year").textContent = new Date().getFullYear();
show();
