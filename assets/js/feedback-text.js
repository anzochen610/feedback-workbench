(function (root) {
  const EMPTY_TEXT = "未填写";

  function normalizeText(value) {
    return typeof value === "string" && value.trim() ? value.trim() : EMPTY_TEXT;
  }

  function normalizeOptionalText(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps
      .filter((step) => typeof step === "string")
      .map((step) => step.trim())
      .filter(Boolean);
  }

  function buildFeedbackPlainText(draft) {
    const safeDraft = draft && typeof draft === "object" ? draft : {};
    const lines = [
      `体验反馈：${normalizeText(safeDraft.title)}`,
      "",
      "【使用背景与目标】",
      `使用背景：${normalizeText(safeDraft.usageBackground)}`,
      `用户目标：${normalizeText(safeDraft.userGoal)}`,
      `问题发生的页面或环节：${normalizeText(safeDraft.pageOrStep)}`,
      "",
      "【问题事实】",
      "具体操作步骤：",
    ];

    const steps = normalizeSteps(safeDraft.operationSteps);
    if (steps.length === 0) {
      lines.push(EMPTY_TEXT);
    } else {
      steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
    }

    lines.push(
      `实际结果：${normalizeText(safeDraft.actualResult)}`,
      `是否可以重复出现：${normalizeText(safeDraft.canReproduce)}`,
      "",
      "【期望与影响】",
      `预期结果：${normalizeText(safeDraft.expectedResult)}`,
      `造成的影响：${normalizeText(safeDraft.impact)}`,
    );

    const temporaryWorkaround = normalizeOptionalText(safeDraft.temporaryWorkaround);
    const proposedSolution = normalizeOptionalText(safeDraft.proposedSolution);
    if (temporaryWorkaround || proposedSolution) {
      lines.push("", "【补充信息】");
      if (temporaryWorkaround) lines.push(`临时解决方式：${temporaryWorkaround}`);
      if (proposedSolution) lines.push(`建议解决方案：${proposedSolution}`);
    }

    return lines.join("\n");
  }

  root.buildFeedbackPlainText = buildFeedbackPlainText;

  if (typeof module === "object" && module.exports) {
    module.exports = { buildFeedbackPlainText };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
