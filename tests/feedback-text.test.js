const assert = require("assert");
const { buildFeedbackPlainText } = require("../assets/js/feedback-text.js");

const fullDraft = {
  title: "按钮点击后没有反应",
  usageBackground: "整理一次匿名产品体验记录",
  userGoal: "把体验问题提交给产品同学",
  pageOrStep: "反馈填写页",
  operationSteps: ["打开页面", "点击提交按钮", "观察页面变化"],
  actualResult: "页面没有任何提示",
  canReproduce: "可以重复出现",
  expectedResult: "点击后显示下一步",
  impact: "无法继续完成反馈整理",
  temporaryWorkaround: "先把内容复制到文档",
  proposedSolution: "增加提交后的状态提示",
  missingFields: ["不应复制"],
  suggestions: ["不应复制"],
};

const fullText = buildFeedbackPlainText(fullDraft);
assert.strictEqual(
  fullText,
  [
    "体验反馈：按钮点击后没有反应",
    "",
    "【使用背景与目标】",
    "使用背景：整理一次匿名产品体验记录",
    "用户目标：把体验问题提交给产品同学",
    "问题发生的页面或环节：反馈填写页",
    "",
    "【问题事实】",
    "具体操作步骤：",
    "1. 打开页面",
    "2. 点击提交按钮",
    "3. 观察页面变化",
    "实际结果：页面没有任何提示",
    "是否可以重复出现：可以重复出现",
    "",
    "【期望与影响】",
    "预期结果：点击后显示下一步",
    "造成的影响：无法继续完成反馈整理",
    "",
    "【补充信息】",
    "临时解决方式：先把内容复制到文档",
    "建议解决方案：增加提交后的状态提示",
  ].join("\n")
);
assert(!fullText.includes("缺失字段"));
assert(!fullText.includes("补充建议"));
assert(!fullText.includes("完整度"));
assert(!fullText.includes("不应复制"));

const blankStepsText = buildFeedbackPlainText({
  ...fullDraft,
  operationSteps: ["  第一步  ", "", "   ", 123, null, "第二步"],
  temporaryWorkaround: "",
  proposedSolution: "",
});
assert(blankStepsText.includes("1. 第一步\n2. 第二步"));
assert(!blankStepsText.includes("【补充信息】"));

const missingText = buildFeedbackPlainText({ operationSteps: [] });
assert(missingText.includes("体验反馈：未填写"));
assert(missingText.includes("具体操作步骤：\n未填写"));
assert(missingText.includes("造成的影响：未填写"));

const optionalOnlyText = buildFeedbackPlainText({ proposedSolution: "  保留一个选填字段  " });
assert(optionalOnlyText.includes("【补充信息】"));
assert(optionalOnlyText.includes("建议解决方案：保留一个选填字段"));
assert(!optionalOnlyText.includes("临时解决方式："));

assert.doesNotThrow(() => buildFeedbackPlainText(null));
assert.doesNotThrow(() => buildFeedbackPlainText({ title: 123, operationSteps: "不是数组" }));
assert.strictEqual(typeof buildFeedbackPlainText({}), "string");
