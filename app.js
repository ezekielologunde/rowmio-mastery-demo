import { nextMasteryStatus } from "./state-machine.js";
import { OBJECTIVE, DIAGNOSTIC, REMEDIATION, PRACTICE, INDEPENDENT, DELAYED_RECHECK } from "./fixtures.js";

const RECHECK_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

const state = {
  status: "not_started",
  recheckDueAt: null,
  simulatedNow: new Date(),
  diagnosedTag: null,
  step: "diagnostic",
  trace: [],
};

const $ = (sel) => document.querySelector(sel);
const stageEl = $("#stage");
const statusBadge = $("#status-badge");
const traceList = $("#trace-list");
const dueNote = $("#due-note");

function fmtDate(d) {
  if (!d) return "—";
  return d.toISOString().slice(0, 19).replace("T", " ") + " UTC";
}

function logTransition(attempt, result) {
  state.trace.unshift({
    from: state.status,
    attempt: { ...attempt },
    to: result.status,
    recheckDueAt: result.nextRecheckDueAt,
    at: new Date(state.simulatedNow),
  });
  state.status = result.status;
  state.recheckDueAt = result.nextRecheckDueAt;
}

function transition(attempt) {
  const result = nextMasteryStatus(state.status, attempt, state.recheckDueAt, state.simulatedNow);
  logTransition(attempt, result);
  return result;
}

function renderTrace() {
  statusBadge.textContent = state.status;
  statusBadge.className = "badge badge-" + state.status;
  dueNote.textContent = state.recheckDueAt
    ? `Recheck due: ${fmtDate(state.recheckDueAt)} (simulated clock: ${fmtDate(state.simulatedNow)})`
    : `Simulated clock: ${fmtDate(state.simulatedNow)}`;
  traceList.innerHTML = state.trace.map(t => `
    <li>
      <code>nextMasteryStatus("${t.from}", {stage:"${t.attempt.stage}", correct:${t.attempt.correct}, hintUsed:${!!t.attempt.hintUsed}})</code>
      <span class="arrow">&rarr;</span> <strong>${t.to}</strong>
      ${t.recheckDueAt ? `<small>recheck due ${fmtDate(t.recheckDueAt)}</small>` : ""}
    </li>`).join("") || "<li class=\"empty\">No attempts yet.</li>";
}

function escapeOption(v) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function renderDiagnostic() {
  stageEl.innerHTML = `
    <div class="eyebrow">DIAGNOSTIC &middot; ${OBJECTIVE.title}</div>
    <h2>${escapeOption(DIAGNOSTIC.prompt)}</h2>
    <p class="lede">Pick an answer. Each wrong option is tagged with the specific misconception or gap it represents &mdash; the same "diagnostic distractor" authoring pattern the real D1 spec uses. Classifying it is a lookup, not a model call.</p>
    <div class="options" id="diag-options">
      ${DIAGNOSTIC.options.map((o, i) => `<button class="option" data-i="${i}">${escapeOption(o.value)}</button>`).join("")}
    </div>
  `;
  stageEl.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = DIAGNOSTIC.options[Number(btn.dataset.i)];
      transition({ stage: "diagnostic", correct: opt.correct });
      state.diagnosedTag = opt.correct ? "correct" : opt.tag;
      state.lastDiagnosticOption = opt;
      state.step = "remediation";
      render();
    });
  });
}

function renderRemediation() {
  const opt = state.lastDiagnosticOption;
  stageEl.innerHTML = `
    <div class="eyebrow">CLASSIFICATION</div>
    <h2>${opt.correct ? "Correct" : "Not quite"}</h2>
    ${opt.correct ? "" : `<p class="lede"><strong>${opt.tag.replace(/_/g, " ")}</strong>: ${opt.reason}</p>`}
    <p class="remediation">${REMEDIATION[state.diagnosedTag]}</p>
    <p class="note">State moved to <strong>diagnosed</strong> either way &mdash; a single diagnostic answer classifies the gap, it doesn't itself prove or disprove mastery.</p>
    <button class="button" id="to-practice">Continue to guided practice &rarr;</button>
  `;
  $("#to-practice").addEventListener("click", () => { state.step = "practice"; render(); });
}

function renderPractice() {
  let hintShown = false;
  stageEl.innerHTML = `
    <div class="eyebrow">PRACTICE &middot; hint available</div>
    <h2>${escapeOption(PRACTICE.prompt)}</h2>
    <p class="lede">One practice attempt is enough to move the state from <strong>diagnosed</strong> into <strong>practicing</strong> in this model &mdash; the adaptive engine that picks which practice item to serve next, and fades hint availability, isn't modeled in this demo.</p>
    <button class="button secondary" id="show-hint">Show hint</button>
    <div id="hint-box" class="hint-box" hidden></div>
    <div class="answer-row">
      <input id="practice-answer" type="text" placeholder="Your answer" autocomplete="off">
      <button class="button" id="practice-submit">Submit</button>
    </div>
  `;
  $("#show-hint").addEventListener("click", () => {
    hintShown = true;
    const box = $("#hint-box");
    box.hidden = false;
    box.textContent = PRACTICE.hint;
  });
  $("#practice-submit").addEventListener("click", () => {
    const val = $("#practice-answer").value.trim();
    const correct = val === PRACTICE.answer;
    transition({ stage: "practice", correct, hintUsed: hintShown });
    state.step = "practice-result";
    state.practiceWasCorrect = correct;
    render();
  });
}

function renderPracticeResult() {
  stageEl.innerHTML = `
    <div class="eyebrow">PRACTICE RESULT</div>
    <h2>${state.practiceWasCorrect ? "Correct." : "Not quite — but the state still advances."}</h2>
    <p class="note">Production would keep serving practice items with fading hints until the learner is ready. This demo moves straight to the independent check to keep the walkthrough short.</p>
    <button class="button" id="to-independent">Continue to independent check &rarr;</button>
  `;
  $("#to-independent").addEventListener("click", () => { state.step = "independent"; render(); });
}

function renderIndependent() {
  stageEl.innerHTML = `
    <div class="eyebrow">INDEPENDENT CHECK &middot; no hint available</div>
    <h2>${escapeOption(INDEPENDENT.prompt)}</h2>
    <p class="lede">No hint here by design. Per the real state machine, only a correct, unhinted independent attempt promotes the state; anything else leaves it at <strong>practicing</strong>.</p>
    <div class="answer-row">
      <input id="independent-answer" type="text" placeholder="Your answer" autocomplete="off">
      <button class="button" id="independent-submit">Submit</button>
    </div>
  `;
  $("#independent-submit").addEventListener("click", () => {
    const val = $("#independent-answer").value.trim();
    const correct = val === INDEPENDENT.answer;
    const result = transition({ stage: "independent", correct, hintUsed: false });
    state.step = result.status === "verified_independent" ? "recheck-gate" : "independent-retry";
    render();
  });
}

function renderIndependentRetry() {
  stageEl.innerHTML = `
    <div class="eyebrow">STATE: still practicing</div>
    <h2>That attempt didn't promote the state.</h2>
    <p class="note">Matches production: a wrong (or hinted) independent attempt returns <strong>practicing</strong>, not a partial credit state. Try the independent check again.</p>
    <button class="button" id="retry">Try independent check again &rarr;</button>
  `;
  $("#retry").addEventListener("click", () => { state.step = "independent"; render(); });
}

function renderRecheckGate() {
  stageEl.innerHTML = `
    <div class="eyebrow">VERIFIED INDEPENDENT &middot; recheck pending</div>
    <h2>${escapeOption(DELAYED_RECHECK.prompt)}</h2>
    <p class="lede">A delayed recheck is now scheduled for ${fmtDate(state.recheckDueAt)}. Try answering right now &mdash; the real state machine treats an early recheck attempt as a non-transition, even if correct, because it proves nothing about retention.</p>
    <div class="answer-row">
      <input id="recheck-answer" type="text" placeholder="Your answer" autocomplete="off">
      <button class="button" id="recheck-submit">Submit now (early)</button>
    </div>
    <button class="button secondary" id="simulate-days">Simulate 3 days passing &rarr;</button>
  `;
  $("#recheck-submit").addEventListener("click", () => {
    const val = $("#recheck-answer").value.trim();
    const correct = val === DELAYED_RECHECK.answer;
    transition({ stage: "delayed_recheck", correct, hintUsed: false });
    state.step = "recheck-gate";
    render();
    const box = document.createElement("p");
    box.className = "note flash";
    box.textContent = "Attempt logged, but too early to count — state is unchanged. Simulate 3 days, then try again.";
    stageEl.appendChild(box);
  });
  $("#simulate-days").addEventListener("click", () => {
    state.simulatedNow = new Date(state.simulatedNow.getTime() + RECHECK_DELAY_MS + 1000);
    state.step = "recheck-due";
    render();
  });
}

function renderRecheckDue() {
  stageEl.innerHTML = `
    <div class="eyebrow">RECHECK DUE &middot; simulated clock advanced</div>
    <h2>${escapeOption(DELAYED_RECHECK.prompt)}</h2>
    <p class="lede">The recheck is now due (simulated clock: ${fmtDate(state.simulatedNow)}). A correct, unhinted answer marks the objective <strong>mastered</strong>; a wrong one marks it <strong>regressed</strong>.</p>
    <div class="answer-row">
      <input id="recheck-answer-2" type="text" placeholder="Your answer" autocomplete="off">
      <button class="button" id="recheck-submit-2">Submit</button>
    </div>
  `;
  $("#recheck-submit-2").addEventListener("click", () => {
    const val = $("#recheck-answer-2").value.trim();
    const correct = val === DELAYED_RECHECK.answer;
    transition({ stage: "delayed_recheck", correct, hintUsed: false });
    state.step = "done";
    render();
  });
}

function renderDone() {
  const mastered = state.status === "mastered";
  stageEl.innerHTML = `
    <div class="eyebrow">END STATE</div>
    <h2>${mastered ? "Mastered." : "Regressed."}</h2>
    <p class="note">${mastered
      ? "Survived an unhinted independent check and a delayed recheck days later. Production would stop surfacing this objective as due for practice."
      : "Failed the delayed recheck after previously passing the independent check. Production returns this to practicing on the next practice attempt — a visible regression, not a silent downgrade."}</p>
    <button class="button" id="restart">Restart the walkthrough</button>
  `;
  $("#restart").addEventListener("click", () => {
    state.status = "not_started";
    state.recheckDueAt = null;
    state.simulatedNow = new Date();
    state.diagnosedTag = null;
    state.step = "diagnostic";
    state.trace = [];
    render();
  });
}

const renderers = {
  diagnostic: renderDiagnostic,
  remediation: renderRemediation,
  practice: renderPractice,
  "practice-result": renderPracticeResult,
  independent: renderIndependent,
  "independent-retry": renderIndependentRetry,
  "recheck-gate": renderRecheckGate,
  "recheck-due": renderRecheckDue,
  done: renderDone,
};

function render() {
  renderers[state.step]();
  renderTrace();
}

render();
