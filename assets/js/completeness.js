const COMPLETENESS_LEVELS = {
  MISSING: "缺少关键信息",
  SUGGEST: "建议补充",
  COMPLETE: "基本完整",
};

const REQUIRED_FIELDS = [
  ["title", "反馈标题"],
  ["usageBackground", "使用背景"],
  ["userGoal", "用户目标"],
  ["pageOrStep", "问题发生的页面或环节"],
  ["operationSteps", "具体操作步骤"],
  ["actualResult", "实际结果"],
  ["canReproduce", "是否可以重复出现"],
  ["expectedResult", "预期结果"],
  ["impact", "造成的影响"],
];

// 这些阈值只用于触发温和提醒，方便用户发现“可能还可以补充”的地方；
// 它们不代表质量评分，也不判断内容准确、真实或需求是否合理。
const SHORT_TEXT_LIMIT = 12;
const DETAILED_TEXT_LIMIT = 24;
const LONG_SOLUTION_LIMIT = 40;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getFilledOperationSteps(steps) {
  return Array.isArray(steps) ? steps.map(normalizeText).filter(Boolean) : [];
}

function isFieldMissing(draft, key) {
  if (key === "operationSteps") return getFilledOperationSteps(draft?.operationSteps).length === 0;
  return !normalizeText(draft?.[key]);
}

function isShortFilledText(value) {
  const text = normalizeText(value);
  return text.length > 0 && text.length < SHORT_TEXT_LIMIT;
}

function checkFeedbackCompleteness(draft = {}) {
  const safeDraft = draft && typeof draft === "object" ? draft : {};
  const missingFields = REQUIRED_FIELDS.filter(([key]) => isFieldMissing(safeDraft, key)).map(([, label]) => label);
  const suggestions = [];
  const filledSteps = getFilledOperationSteps(safeDraft.operationSteps);

  if (filledSteps.length === 1) {
    suggestions.push("可以补充问题发生前后的操作，让复现过程更清楚。");
  }

  if (isShortFilledText(safeDraft.actualResult)) {
    suggestions.push("可以补充页面提示、等待时间或你实际看到的变化。");
  }

  if (isShortFilledText(safeDraft.expectedResult)) {
    suggestions.push("可以进一步说明你原本期待页面如何回应。");
  }

  if (isShortFilledText(safeDraft.impact)) {
    suggestions.push("可以补充这个问题对任务完成造成的具体影响。");
  }

  const proposedSolutionLength = normalizeText(safeDraft.proposedSolution).length;
  const factsAreBrief = normalizeText(safeDraft.actualResult).length < DETAILED_TEXT_LIMIT || filledSteps.length <= 1;
  if (proposedSolutionLength >= LONG_SOLUTION_LIMIT && factsAreBrief) {
    suggestions.push("建议先补充问题事实，再把解决方案作为参考。");
  }

  let level = COMPLETENESS_LEVELS.COMPLETE;
  if (missingFields.length > 0) level = COMPLETENESS_LEVELS.MISSING;
  else if (suggestions.length > 0) level = COMPLETENESS_LEVELS.SUGGEST;

  return { level, missingFields, suggestions };
}

if (typeof window !== "undefined") {
  window.checkFeedbackCompleteness = checkFeedbackCompleteness;
}

if (typeof module !== "undefined") {
  module.exports = { checkFeedbackCompleteness, COMPLETENESS_LEVELS };
}
