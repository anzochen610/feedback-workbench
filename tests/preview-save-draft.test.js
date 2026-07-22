const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  return {
    hidden: true,
    disabled: true,
    textContent: "",
    className: "",
    children: [],
    style: {},
    classList: { add() {} },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    addEventListener(eventName, handler) { this[`on${eventName}`] = handler; },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
  };
}

function fullDraft(extra = {}) {
  return {
    id: "record-1",
    title: "匿名反馈",
    usageBackground: "使用背景",
    userGoal: "用户目标",
    pageOrStep: "页面或环节",
    operationSteps: ["第一步"],
    actualResult: "实际结果",
    canReproduce: "还不确定",
    expectedResult: "预期结果",
    impact: "造成的影响",
    temporaryWorkaround: "",
    proposedSolution: "",
    ...extra,
  };
}

function runPreview(initialSessionDraft) {
  const elements = new Map();
  const saveButton = createElement();
  const saveStatus = createElement();
  elements.set("[data-save-history]", saveButton);
  elements.set("[data-save-status]", saveStatus);
  elements.set("[data-empty-state]", createElement());
  elements.set("[data-completeness-state]", createElement());
  elements.set("[data-completeness-level]", createElement());
  elements.set("[data-missing-list]", createElement());
  elements.set("[data-missing-empty]", createElement());
  elements.set("[data-suggestions-list]", createElement());
  elements.set("[data-suggestions-empty]", createElement());
  elements.set("[data-preview-state]", createElement());
  elements.set("[data-preview-actions]", createElement());
  elements.set("#preview-title", createElement());
  elements.set("[data-preview-list]", createElement());
  elements.set("[data-copy-plain-text]", createElement());
  elements.set("[data-copy-status]", createElement());

  const savedRecords = [];
  const sessionData = new Map();
  if (initialSessionDraft !== undefined) {
    sessionData.set("feedbackWorkbenchDraft", JSON.stringify(initialSessionDraft));
  }

  const context = {
    console,
    navigator: {},
    sessionStorage: {
      getItem(key) { return sessionData.has(key) ? sessionData.get(key) : null; },
      setItem(key, value) { sessionData.set(key, String(value)); },
      removeItem(key) { sessionData.delete(key); },
    },
    document: {
      querySelector(selector) { return elements.get(selector) || createElement(); },
      createElement() { return createElement(); },
      body: createElement(),
      execCommand() { return false; },
    },
    window: {
      checkFeedbackCompleteness() { return { level: "基本完整", missingFields: [], suggestions: [] }; },
      buildFeedbackPlainText() { return "plain text"; },
      FeedbackHistoryStorage: {
        createHistoryStorage() {
          return {
            save(draft) {
              savedRecords.push({ ...draft });
              return { ...draft, id: draft.id || "new-id", createdAt: draft.createdAt || "created", updatedAt: "updated" };
            },
          };
        },
      },
    },
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.sessionStorage = context.sessionStorage;
  context.window.navigator = context.navigator;

  vm.runInNewContext(fs.readFileSync("assets/js/preview.js", "utf8"), context);
  return { saveButton, saveStatus, savedRecords, sessionData };
}

{
  const page = runPreview(fullDraft());
  page.sessionData.delete("feedbackWorkbenchDraft");
  page.saveButton.onclick();
  assert.equal(page.savedRecords.length, 0);
  assert.equal(page.saveStatus.textContent, "当前草稿已失效或对应的历史反馈已被删除，请返回首页重新操作。");
}

{
  const page = runPreview(fullDraft({ id: "record-1" }));
  page.sessionData.set("feedbackWorkbenchDraft", JSON.stringify(fullDraft({ id: "record-2", title: "另一条" })));
  page.saveButton.onclick();
  assert.equal(page.savedRecords.length, 0);
  assert.equal(page.saveStatus.textContent, "当前草稿已失效或对应的历史反馈已被删除，请返回首页重新操作。");
}

{
  const page = runPreview(fullDraft({ id: "record-1", title: "页面旧标题" }));
  page.sessionData.set("feedbackWorkbenchDraft", JSON.stringify(fullDraft({ id: "record-1", title: "当前最新标题" })));
  page.saveButton.onclick();
  assert.equal(page.savedRecords.length, 1);
  assert.equal(page.savedRecords[0].title, "当前最新标题");
  assert.equal(JSON.parse(page.sessionData.get("feedbackWorkbenchDraft")).updatedAt, "updated");
}

{
  const page = runPreview(fullDraft({ id: "", title: "新建草稿" }));
  page.sessionData.set("feedbackWorkbenchDraft", JSON.stringify(fullDraft({ id: "", title: "新建草稿最新内容" })));
  page.saveButton.onclick();
  assert.equal(page.savedRecords.length, 1);
  assert.equal(page.savedRecords[0].title, "新建草稿最新内容");
}

console.log("preview-save-draft tests passed");
