(() => {
  // ---- crash banner (so you can SEE errors instead of a blank page) ----
  function showCrash(err){
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
      <section class="card" style="border:1px solid rgba(239,68,68,.35); background: rgba(239,68,68,.08);">
        <div class="h1">App Error</div>
        <div class="small">Something prevented the assessment from loading.</div>
        <pre class="small" style="white-space:pre-wrap; margin-top:10px;">${String(err && err.stack ? err.stack : err)}</pre>
        <div class="small" style="margin-top:10px;">
          Common fix: GitHub Pages Settings → Pages → set Folder to <b>/(root)</b>.
        </div>
      </section>
    `;
  }

  // ---- wait for DOM so #app always exists ----
  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    try {
      main();
    } catch (e) {
      showCrash(e);
    }
  });

  function main(){
    const STORAGE_KEY = "who_assessment_official_v3";

    // ✅ Dana Form mapping (confirmed)
    const GOOGLE_FORM = {
      enabled: true,
      formResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/formResponse",
      entry: {
        name: "entry.2005620554",
        email: "entry.1045781291",
        values: "entry.1065046570",
        pillars: "entry.1010525839",
        idealEmotion: "entry.1060481030",
        trigger: "entry.2079481635",
        comments: "entry.839337160"
      }
    };

    const VALUE_OPTIONS = [
      "Accountability","Adventure","Authenticity","Curiosity","Discipline","Empathy","Excellence",
      "Fairness","Freedom","Gratitude","Growth","Honesty","Impact","Integrity","Kindness","Love",
      "Loyalty","Peace","Respect","Responsibility","Service","Stability","Transparency"
    ];

    const PILLAR_OPTIONS = [
      "Bold","Builder","Calm","Compassionate","Confident","Creative","Disciplined","Empathetic",
      "Funny","Grounded","Helper","Honest","Joyful","Kind","Leader","Listener","Loyal","Optimist",
      "Patient","Present","Problem Solver","Resilient","Supportive"
    ];

    const IDEAL_EMOTION_OPTIONS = [
      "Calm","Clear","Connected","Content","Energized","Free","Fulfilled","Grateful","Grounded",
      "Inspired","Joyful","Peaceful","Present"
    ];

    const TRIGGER_OPTIONS = ["Capable","Enough","Good Enough","Heard","Respected","Seen","Valued","Wanted"];

    const STEPS = [
      { key:"welcome", title:"Welcome" },
      { key:"start", title:"Start" },
      { key:"values", title:"Values" },
      { key:"pillars", title:"Pillars" },
      { key:"ideal", title:"Ideal Emotion" },
      { key:"trigger", title:"Trigger" },
      { key:"snapshot", title:"Your Results" },
      { key:"submitted", title:"Submitted" }
    ];

    const DEFAULT_STATE = {
      stepIndex: 0,
      user: { name:"", email:"" },
      values: { candidates: [] },
      pillars: { candidates: [] },
      ideal: { primary:"", desireLevel: 8 },
      trigger: { label:"", comments:"" },
      submit: { status:"idle", message:"" }
    };

    let state = loadState();

    const elApp = document.getElementById("app");
    const elYear = document.getElementById("year");
    if (elYear) elYear.textContent = new Date().getFullYear();

    const btnReset = document.getElementById("btnReset");
    if (btnReset){
      btnReset.addEventListener("click", () => {
        if (!confirm("Reset all answers?")) return;
        state = clone(DEFAULT_STATE);
        saveState();
        render();
      });
    }

    function clone(obj){
      return JSON.parse(JSON.stringify(obj));
    }

    function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    function loadState(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return clone(DEFAULT_STATE);
        const parsed = JSON.parse(raw);
        return { ...clone(DEFAULT_STATE), ...parsed };
      }catch{
        return clone(DEFAULT_STATE);
      }
    }

    function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
    function uniq(arr){ return [...new Set(arr.map(x => String(x).trim()).filter(Boolean))]; }
    function removeItem(arr, item){ return arr.filter(x => x !== item); }

    function setStep(idx){
      state.stepIndex = clamp(idx, 0, STEPS.length - 1);
      saveState();
      render();
    }
    function nextStep(){ if (canProceed()) setStep(state.stepIndex + 1); }
    function prevStep(){ setStep(state.stepIndex - 1); }

    function canProceed(){
      const k = STEPS[state.stepIndex].key;
      if (k === "start") return state.user.name.trim().length > 0;
      if (k === "values") return state.values.candidates.length >= 3 && state.values.candidates.length <= 6;
      if (k === "pillars") return state.pillars.candidates.length >= 3 && state.pillars.candidates.length <= 6;
      if (k === "ideal") return state.ideal.primary.trim().length > 0;
      if (k === "trigger") return state.trigger.label.trim().length > 0;
      return true;
    }

    function progressPercent(){
      const max = STEPS.length - 2;
      const idx = Math.min(state.stepIndex, max);
      return Math.round((idx / max) * 100);
    }

    function render(){
      const step = STEPS[state.stepIndex];
      elApp.innerHTML = `
        ${renderProgress(step)}
        ${renderStep(step.key)}
        ${renderNav(step.key)}
      `;
      wireNav();
    }

    function renderProgress(step){
      const pct = progressPercent();
      return `
        <section class="card">
          <div class="kicker">${escapeHtml(step.title)}</div>
          <div class="progressWrap">
            <div class="progressBar"><div class="progressFill" style="width:${pct}%"></div></div>
            <div class="progressMeta">
              <div>${pct}% complete</div>
              <div>${Math.min(state.stepIndex + 1, STEPS.length - 1)} / ${STEPS.length - 1}</div>
            </div>
          </div>
        </section>
      `;
    }

    function renderNav(key){
      const isSubmitted = key === "submitted";
      const isSnapshot = key === "snapshot";
      const canBack = state.stepIndex > 0 && !isSubmitted;
      const proceed = canProceed();

      return `
        <section class="card">
          <div class="btnrow">
            <button id="btnBack" class="ghost" type="button" ${canBack ? "" : "disabled"}>Back</button>
            ${isSnapshot
              ? `<button id="btnSubmit" class="primary" type="button">Submit Results</button>`
              : isSubmitted
                ? `<button id="btnRestart" class="ghost" type="button">Start Over</button>`
                : `<button id="btnNext" class="primary" type="button" ${proceed ? "" : "disabled"}>Next</button>`
            }
          </div>
          ${(!proceed && !isSubmitted && !isSnapshot) ? `<div class="small">Complete the required items to continue.</div>` : ""}
        </section>
      `;
    }

    function wireNav(){
      const back = document.getElementById("btnBack");
      const next = document.getElementById("btnNext");
      const submit = document.getElementById("btnSubmit");
      const restart = document.getElementById("btnRestart");

      if (back) back.addEventListener("click", prevStep);
      if (next) next.addEventListener("click", nextStep);
      if (submit) submit.addEventListener("click", submitToDana);
      if (restart) restart.addEventListener("click", () => {
        state = clone(DEFAULT_STATE);
        saveState();
        render();
      });
    }

    function renderStep(key){
      switch(key){
        case "welcome": return `
          <section class="card">
            <div class="h1">Welcome</div>
            <p class="p">
              Thank you for taking the WHO Thoughts Assessment™.
              You’ll identify your Values, Pillars, Ideal Emotion, and Trigger.
            </p>
            <div class="notice"><b>Note:</b> Your results appear at the end, and you can submit them to Dana.</div>
          </section>
        `;
        case "start": return `
          <section class="card">
            <div class="h1">Start</div>
            <label class="lbl">Name <span class="small">(required)</span></label>
            <input id="userName" class="txt" placeholder="Your name" value="${escapeHtml(state.user.name)}" />
            <label class="lbl">Email <span class="small">(optional)</span></label>
            <input id="userEmail" class="txt" placeholder="you@email.com" value="${escapeHtml(state.user.email)}" />
          </section>
        `;
        case "values": return stepPick("Values", "value", VALUE_OPTIONS, state.values.candidates);
        case "pillars": return stepPick("Pillars", "pillar", PILLAR_OPTIONS, state.pillars.candidates);
        case "ideal": return `
          <section class="card">
            <div class="h1">Ideal Emotion</div>
            <label class="lbl">Pick your Ideal Emotion</label>
            <select id="idealPrimary" class="sel">
              <option value="">Select…</option>
              ${IDEAL_EMOTION_OPTIONS.map(o => `<option ${state.ideal.primary === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
            </select>
            <label class="lbl">How strongly? (1–10)</label>
            <input id="idealDesire" type="range" min="1" max="10" value="${state.ideal.desireLevel}" style="width:100%;" />
            <div class="small">Current: <b>${state.ideal.desireLevel}/10</b></div>
          </section>
        `;
        case "trigger": return `
          <section class="card">
            <div class="h1">Trigger</div>
            <div class="pills">
              ${TRIGGER_OPTIONS.map(t => {
                const full = `I'm not ${t}`;
                return `<button class="pill ${state.trigger.label===full?"on":""}" data-trigger="${escapeHtmlAttr(full)}" type="button">${escapeHtml(full)}</button>`;
              }).join("")}
            </div>
            <label class="lbl">Custom trigger (optional)</label>
            <input id="customTrigger" class="txt" placeholder="Example: I'm not safe" value="${escapeHtml(state.trigger.label.startsWith("I'm not ") ? "" : state.trigger.label)}" />
            <label class="lbl">Comments (optional)</label>
            <textarea id="comments" class="ta" placeholder="Any notes for Dana…">${escapeHtml(state.trigger.comments)}</textarea>
          </section>
        `;
        case "snapshot": return `
          <section class="card">
            <div class="h1">Your Results</div>
            <div class="snapshot">
              <div class="snapshotBox">
                <h3>Values</h3>
                <ul class="ul">${state.values.candidates.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
              </div>
              <div class="snapshotBox">
                <h3>Pillars</h3>
                <ul class="ul">${state.pillars.candidates.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
              </div>
              <div class="snapshotBox">
                <h3>Ideal Emotion</h3>
                <ul class="ul"><li>${escapeHtml(state.ideal.primary)} (${state.ideal.desireLevel}/10)</li></ul>
              </div>
              <div class="snapshotBox">
                <h3>Trigger</h3>
                <ul class="ul"><li>${escapeHtml(state.trigger.label)}</li></ul>
              </div>
            </div>

            <hr class="sep" />
            <div class="notice">
              <b>Thank you for taking the test.</b><br/>
              If you entered an email, Dana can send you your results and next steps.
            </div>
          </section>
        `;
        case "submitted": return `
          <section class="card">
            <div class="h1">${state.submit.status === "success" ? "Submitted!" : state.submit.status === "error" ? "Submission Issue" : "Submitting..."}</div>
            <p class="p">${escapeHtml(state.submit.message || "")}</p>
          </section>
        `;
        default: return "";
      }
    }

    function stepPick(title, kind, options, selected){
      return `
        <section class="card">
          <div class="h1">${escapeHtml(title)}</div>
          <p class="p small">Select 3–6. Click again to unselect.</p>
          <div class="pills">
            ${options.map(v => `<button class="pill ${selected.includes(v)?"on":""}" data-${kind}="${escapeHtmlAttr(v)}" type="button">${escapeHtml(v)}</button>`).join("")}
          </div>
          <div class="small">Selected: ${selected.length} / 6</div>
        </section>
      `;
    }

    // IMPORTANT: do NOT re-render on keystroke for normal typing
    document.addEventListener("input", (e) => {
      const id = e.target && e.target.id;
      if (id === "userName"){ state.user.name = e.target.value; saveState(); return; }
      if (id === "userEmail"){ state.user.email = e.target.value; saveState(); return; }
      if (id === "idealDesire"){ state.ideal.desireLevel = Number(e.target.value); saveState(); render(); return; }
      if (id === "customTrigger"){ const v = e.target.value.trim(); if (v) state.trigger.label = v; saveState(); return; }
      if (id === "comments"){ state.trigger.comments = e.target.value; saveState(); return; }
    });

    document.addEventListener("change", (e) => {
      if (e.target && e.target.id === "idealPrimary"){
        state.ideal.primary = e.target.value;
        saveState();
        render();
      }
    });

    document.addEventListener("click", (e) => {
      const t = e.target;

      if (t && t.dataset && t.dataset.value){
        toggleList(state.values.candidates, t.dataset.value, "values");
        return;
      }
      if (t && t.dataset && t.dataset.pillar){
        toggleList(state.pillars.candidates, t.dataset.pillar, "pillars");
        return;
      }
      if (t && t.dataset && t.dataset.trigger){
        state.trigger.label = t.dataset.trigger;
        saveState();
        render();
        return;
      }
    });

    function toggleList(list, item, which){
      if (list.includes(item)){
        list = removeItem(list, item);
      } else {
        if (list.length >= 6) return;
        list = uniq([...list, item]);
      }
      if (which === "values") state.values.candidates = list;
      else state.pillars.candidates = list;
      saveState();
      render();
    }

    async function submitToDana(){
      state.submit = { status:"submitting", message:"Sending your results..." };
      saveState();
      setStep(STEPS.findIndex(s => s.key === "submitted"));

      try{
        const payload = buildPayload();
        await postToGoogleForm(payload);

        state.submit = { status:"success", message:"Thank you! Your results were submitted successfully." };
        saveState();
        render();
      }catch(err){
        state.submit = { status:"error", message:"Submission failed. Check Google Form settings (no sign-in required) and try again." };
        saveState();
        render();
      }
    }

    function buildPayload(){
      return {
        name: state.user.name.trim(),
        email: state.user.email.trim(),
        values: (state.values.candidates || []).join(", "),
        pillars: (state.pillars.candidates || []).join(", "),
        idealEmotion: state.ideal.primary ? `${state.ideal.primary} (${state.ideal.desireLevel}/10)` : "",
        trigger: state.trigger.label || "",
        comments: (state.trigger.comments || "").trim()
      };
    }

    async function postToGoogleForm(p){
      if (!GOOGLE_FORM.enabled) return;

      const fd = new FormData();
      fd.append(GOOGLE_FORM.entry.name, p.name);
      fd.append(GOOGLE_FORM.entry.email, p.email);
      fd.append(GOOGLE_FORM.entry.values, p.values);
      fd.append(GOOGLE_FORM.entry.pillars, p.pillars);
      fd.append(GOOGLE_FORM.entry.idealEmotion, p.idealEmotion);
      fd.append(GOOGLE_FORM.entry.trigger, p.trigger);
      fd.append(GOOGLE_FORM.entry.comments, p.comments);

      await fetch(GOOGLE_FORM.formResponseUrl, { method:"POST", mode:"no-cors", body: fd });
    }

    function escapeHtml(s){
      return String(s ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
    }
    function escapeHtmlAttr(s){ return escapeHtml(s).replace(/\n/g," "); }

    render();
  }
})();
