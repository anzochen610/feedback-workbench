const DRAFT_KEY = "feedbackWorkbenchDraft";
const emptyState = document.querySelector("[data-empty-state]");
const previewState = document.querySelector("[data-preview-state]");
const previewActions = document.querySelector("[data-preview-actions]");
const previewTitle = document.querySelector("#preview-title");
const previewList = document.querySelector("[data-preview-list]");

function readDraft() {
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function hasAnyContent(draft) {
  if (!draft) return false;
  return Object.entries(draft).some(([key, value]) => {
    if (key === "operationSteps") return Array.isArray(value) && value.some((step) => typeof step === "string" && step.trim());
    return typeof value === "string" && value.trim();
  });
}

function displayValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "未填写";
}

function appendTextItem(label, value) {
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = displayValue(value);
  previewList.append(term, description);
}

function appendSteps(steps) {
  const term = document.createElement("dt");
  term.textContent = "具体操作步骤";
  const description = document.createElement("dd");
  const filledSteps = Array.isArray(steps) ? steps.filter((step) => typeof step === "string").map((step) => step.trim()).filter(Boolean) : [];
  if (filledSteps.length === 0) {
    description.textContent = "未填写";
  } else {
    const list = document.createElement("ol");
    filledSteps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      list.append(item);
    });
    description.append(list);
  }
  previewList.append(term, description);
}

const draft = readDraft();
if (!hasAnyContent(draft)) {
  emptyState.hidden = false;
} else {
  previewTitle.textContent = displayValue(draft.title);
  appendTextItem("使用背景", draft.usageBackground);
  appendTextItem("用户目标", draft.userGoal);
  appendTextItem("问题发生的页面或环节", draft.pageOrStep);
  appendSteps(draft.operationSteps);
  appendTextItem("实际结果", draft.actualResult);
  appendTextItem("是否可以重复出现", draft.canReproduce);
  appendTextItem("预期结果", draft.expectedResult);
  appendTextItem("造成的影响", draft.impact);
  appendTextItem("临时解决方式（选填）", draft.temporaryWorkaround);
  appendTextItem("建议解决方案（选填）", draft.proposedSolution);
  previewState.hidden = false;
  previewActions.hidden = false;
}
