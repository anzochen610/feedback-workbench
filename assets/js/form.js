const DRAFT_KEY = "feedbackWorkbenchDraft";
const form = document.querySelector("[data-feedback-form]");
const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
const prevButton = document.querySelector("[data-prev-step]");
const nextButton = document.querySelector("[data-next-step]");
const stepsContainer = document.querySelector("[data-operation-steps]");
const addStepButton = document.querySelector("[data-add-step]");
let currentStep = 0;

function field(name) {
  return form.elements.namedItem(name);
}

function readTextField(name) {
  const control = field(name);
  return control ? control.value : "";
}

function writeTextField(name, value) {
  const control = field(name);
  if (control) control.value = typeof value === "string" ? value : "";
}

function readDraftFromStorage() {
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return {};
  }
}

function getDraft() {
  const operationSteps = Array.from(document.querySelectorAll("[data-operation-input]")).map((input) => input.value);
  return {
    title: readTextField("title"),
    usageBackground: readTextField("usageBackground"),
    userGoal: readTextField("userGoal"),
    pageOrStep: readTextField("pageOrStep"),
    operationSteps,
    actualResult: readTextField("actualResult"),
    canReproduce: readTextField("canReproduce"),
    expectedResult: readTextField("expectedResult"),
    impact: readTextField("impact"),
    temporaryWorkaround: readTextField("temporaryWorkaround"),
    proposedSolution: readTextField("proposedSolution"),
  };
}

function saveDraft() {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(getDraft()));
}

function createOperationStep(value = "") {
  const row = document.createElement("div");
  row.className = "operation-step-row";

  const label = document.createElement("label");
  const inputId = `operationStep-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  label.setAttribute("for", inputId);

  const input = document.createElement("input");
  input.id = inputId;
  input.type = "text";
  input.value = typeof value === "string" ? value : "";
  input.dataset.operationInput = "";
  input.placeholder = "例如：点击提交按钮";

  const deleteButton = document.createElement("button");
  deleteButton.className = "button ghost small-button";
  deleteButton.type = "button";
  deleteButton.textContent = "删除";
  deleteButton.addEventListener("click", () => {
    if (stepsContainer.children.length <= 1) return;
    row.remove();
    renumberOperationSteps();
    saveDraft();
  });

  row.append(label, input, deleteButton);
  stepsContainer.append(row);
  renumberOperationSteps();
}

function renumberOperationSteps() {
  Array.from(stepsContainer.children).forEach((row, index) => {
    const label = row.querySelector("label");
    const deleteButton = row.querySelector("button");
    label.textContent = `步骤 ${index + 1}`;
    deleteButton.disabled = stepsContainer.children.length <= 1;
    deleteButton.setAttribute("aria-label", `删除步骤 ${index + 1}`);
  });
}

function restoreCanReproduce(value) {
  const group = field("canReproduce");
  if (!group) return;
  group.value = typeof value === "string" ? value : "";
}

function removeNewDraftParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete("new");
  history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function restoreDraft() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("new") === "1") {
    sessionStorage.removeItem(DRAFT_KEY);
    removeNewDraftParam();
  }

  const draft = readDraftFromStorage();
  writeTextField("title", draft.title);
  writeTextField("usageBackground", draft.usageBackground);
  writeTextField("userGoal", draft.userGoal);
  writeTextField("pageOrStep", draft.pageOrStep);
  writeTextField("actualResult", draft.actualResult);
  writeTextField("expectedResult", draft.expectedResult);
  writeTextField("impact", draft.impact);
  writeTextField("temporaryWorkaround", draft.temporaryWorkaround);
  writeTextField("proposedSolution", draft.proposedSolution);
  restoreCanReproduce(draft.canReproduce);

  const savedSteps = Array.isArray(draft.operationSteps) && draft.operationSteps.length ? draft.operationSteps : ["", ""];
  savedSteps.forEach((step) => createOperationStep(step));
}

function showStep(stepIndex, shouldFocus = true) {
  currentStep = stepIndex;
  panels.forEach((panel, index) => { panel.hidden = index !== currentStep; });
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === currentStep);
    if (index === currentStep) indicator.setAttribute("aria-current", "step");
    else indicator.removeAttribute("aria-current");
  });
  prevButton.textContent = currentStep === 0 ? "返回首页" : "上一步";
  nextButton.textContent = currentStep === panels.length - 1 ? "进入预览" : "下一步";
  saveDraft();
  if (shouldFocus) panels[currentStep].querySelector("h2").focus();
}

restoreDraft();
showStep(0, false);

form.addEventListener("submit", (event) => {
  event.preventDefault();
});
form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);
addStepButton.addEventListener("click", () => {
  createOperationStep();
  saveDraft();
  stepsContainer.lastElementChild.querySelector("input").focus();
});
prevButton.addEventListener("click", () => {
  if (currentStep === 0) window.location.href = "index.html";
  else showStep(currentStep - 1);
});
nextButton.addEventListener("click", () => {
  if (currentStep === panels.length - 1) {
    saveDraft();
    window.location.href = "preview.html";
  } else {
    showStep(currentStep + 1);
  }
});
