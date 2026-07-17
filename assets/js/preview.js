const DRAFT_KEY = "feedbackWorkbenchDraft";
const emptyState = document.querySelector("[data-empty-state]");
const completenessState = document.querySelector("[data-completeness-state]");
const completenessLevel = document.querySelector("[data-completeness-level]");
const missingList = document.querySelector("[data-missing-list]");
const missingEmpty = document.querySelector("[data-missing-empty]");
const suggestionsList = document.querySelector("[data-suggestions-list]");
const suggestionsEmpty = document.querySelector("[data-suggestions-empty]");
const previewState = document.querySelector("[data-preview-state]");
const previewActions = document.querySelector("[data-preview-actions]");
const previewTitle = document.querySelector("#preview-title");
const previewList = document.querySelector("[data-preview-list]");
const copyButton = document.querySelector("[data-copy-plain-text]");
const copyStatus = document.querySelector("[data-copy-status]");
const saveButton = document.querySelector("[data-save-history]");
const saveStatus = document.querySelector("[data-save-status]");

function showCopyStatus(message, type) {
  if (!copyStatus) return;
  copyStatus.textContent = message;
  copyStatus.className = `copy-status ${type === "success" ? "success" : "error"}`;
  copyStatus.hidden = false;
}

function showSaveStatus(message, type) {
  if (!saveStatus) return;
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type === "success" ? "success" : "error"}`;
  saveStatus.hidden = false;
}

function fallbackCopyText(text) {
  let textArea = null;

  try {
    if (typeof document.execCommand !== "function") {
      return false;
    }

    textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.append(textArea);
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    if (textArea) {
      try {
        textArea.remove();
      } catch {
        // Even cleanup errors should not escape the fallback copy helper.
      }
    }
  }
}

async function copyPlainText(draft) {
  if (!hasAnyContent(draft) || typeof window.buildFeedbackPlainText !== "function") {
    showCopyStatus("复制失败，请重试或手动选择预览内容。", "error");
    return;
  }

  const text = window.buildFeedbackPlainText(draft);
  let copied = false;

  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
  }

  if (!copied) {
    copied = fallbackCopyText(text);
  }

  if (copied) {
    showCopyStatus("已复制，可以粘贴到文档或聊天工具中。", "success");
    return;
  }

  showCopyStatus("复制失败，请重试或手动选择预览内容。", "error");
}

function readDraft() {
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function hasAnyContent(draft) {
  if (!draft) return false;
  return Object.entries(draft).some(([key, value]) => {
    if (["id", "createdAt", "updatedAt"].includes(key)) return false;
    if (key === "operationSteps") return Array.isArray(value) && value.some((step) => typeof step === "string" && step.trim());
    return typeof value === "string" && value.trim();
  });
}

function displayValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "未填写";
}

function appendListItems(listElement, items) {
  listElement.replaceChildren();
  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    listElement.append(item);
  });
}

function renderCompleteness(result) {
  completenessLevel.textContent = result.level;
  completenessLevel.className = "level-badge";
  if (result.level === "缺少关键信息") completenessLevel.classList.add("level-missing");
  if (result.level === "建议补充") completenessLevel.classList.add("level-suggest");
  if (result.level === "基本完整") completenessLevel.classList.add("level-complete");

  appendListItems(missingList, result.missingFields);
  missingEmpty.hidden = result.missingFields.length > 0;
  missingList.hidden = result.missingFields.length === 0;

  appendListItems(suggestionsList, result.suggestions);
  suggestionsEmpty.hidden = result.suggestions.length > 0;
  suggestionsList.hidden = result.suggestions.length === 0;
  completenessState.hidden = false;
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

function saveToHistory(draft) {
  if (!hasAnyContent(draft) || !window.FeedbackHistoryStorage) {
    showSaveStatus("保存失败，请检查浏览器是否允许本地存储。", "error");
    return;
  }

  try {
    const storage = window.FeedbackHistoryStorage.createHistoryStorage();
    const savedRecord = storage.save(draft);
    Object.assign(draft, {
      id: savedRecord.id,
      createdAt: savedRecord.createdAt,
      updatedAt: savedRecord.updatedAt,
    });
    writeDraft(draft);
    showSaveStatus("已保存到当前浏览器的历史反馈。", "success");
    if (saveButton) saveButton.textContent = "已保存";
  } catch {
    showSaveStatus("保存失败，请检查浏览器是否允许本地存储。", "error");
  }
}

const draft = readDraft();
if (!hasAnyContent(draft)) {
  emptyState.hidden = false;
} else {
  const completenessResult = window.checkFeedbackCompleteness(draft);
  renderCompleteness(completenessResult);
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
  if (copyButton) {
    copyButton.disabled = false;
    copyButton.addEventListener("click", () => copyPlainText(draft));
  }
  if (saveButton) {
    saveButton.disabled = false;
    saveButton.addEventListener("click", () => saveToHistory(draft));
  }
}
