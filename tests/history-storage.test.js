const assert = require("node:assert/strict");
const { createHistoryStorage, key } = require("../assets/js/history-storage.js");

function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(storageKey) {
      return data.has(storageKey) ? data.get(storageKey) : null;
    },
    setItem(storageKey, value) {
      data.set(storageKey, String(value));
    },
    removeItem(storageKey) {
      data.delete(storageKey);
    },
  };
}

function fullDraft(extra = {}) {
  return {
    title: "匿名反馈",
    usageBackground: "使用背景",
    userGoal: "用户目标",
    pageOrStep: "页面或环节",
    operationSteps: ["第一步", "第二步"],
    actualResult: "实际结果",
    canReproduce: "还不确定",
    expectedResult: "预期结果",
    impact: "造成的影响",
    temporaryWorkaround: "临时办法",
    proposedSolution: "建议方案",
    ...extra,
  };
}

{
  const storage = createHistoryStorage(createFakeStorage());
  assert.deepEqual(storage.getAll(), []);
}

{
  const storage = createHistoryStorage(createFakeStorage({ [key]: "not json" }));
  assert.deepEqual(storage.getAll(), []);
}

{
  const storage = createHistoryStorage(createFakeStorage());
  const saved = storage.save(fullDraft());
  assert.ok(saved.id);
  assert.ok(saved.createdAt);
  assert.ok(saved.updatedAt);
  assert.equal(storage.getAll().length, 1);
}

{
  const storage = createHistoryStorage(createFakeStorage());
  const first = storage.save(fullDraft({ title: "第一次" }));
  const second = storage.save(fullDraft({ id: first.id, title: "第二次" }));
  const records = storage.getAll();
  assert.equal(records.length, 1);
  assert.equal(records[0].id, first.id);
  assert.equal(second.id, first.id);
  assert.equal(records[0].title, "第二次");
}

{
  const storage = createHistoryStorage(createFakeStorage());
  const first = storage.save(fullDraft());
  const second = storage.save(fullDraft({ id: first.id, title: "更新后" }));
  assert.equal(second.createdAt, first.createdAt);
}

{
  const storage = createHistoryStorage(createFakeStorage());
  const saved = storage.save(fullDraft());
  assert.deepEqual(saved.operationSteps, ["第一步", "第二步"]);
  assert.equal(saved.title, "匿名反馈");
  assert.equal(saved.usageBackground, "使用背景");
  assert.equal(saved.userGoal, "用户目标");
  assert.equal(saved.pageOrStep, "页面或环节");
  assert.equal(saved.actualResult, "实际结果");
  assert.equal(saved.canReproduce, "还不确定");
  assert.equal(saved.expectedResult, "预期结果");
  assert.equal(saved.impact, "造成的影响");
  assert.equal(saved.temporaryWorkaround, "临时办法");
  assert.equal(saved.proposedSolution, "建议方案");
}

{
  const storage = createHistoryStorage(createFakeStorage({ [key]: JSON.stringify({ bad: true }) }));
  assert.deepEqual(storage.getAll(), []);
}


{
  const validRecord = { id: "valid-record", title: "字段不完整但有效" };
  const mixedHistory = [
    null,
    123,
    "broken",
    ["array is invalid"],
    {},
    { id: "" },
    { id: "   " },
    { title: "missing id" },
    validRecord,
  ];
  const storage = createHistoryStorage(createFakeStorage({ [key]: JSON.stringify(mixedHistory) }));
  assert.deepEqual(storage.getAll(), [validRecord]);
}

{
  const failingStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("write failed");
    },
  };
  const storage = createHistoryStorage(failingStorage);
  assert.throws(() => storage.save(fullDraft()), /write failed/);
}

console.log("history-storage tests passed");
