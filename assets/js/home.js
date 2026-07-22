const DRAFT_KEY = "feedbackWorkbenchDraft";
const historyList = document.querySelector("[data-history-list]");
const historyEmpty = document.querySelector("[data-history-empty]");
const pageStatus = document.querySelector("[data-page-status]");

function isRenderableRecord(record) {
  return Boolean(
    record
      && typeof record === "object"
      && !Array.isArray(record)
      && typeof record.id === "string"
      && record.id.trim()
  );
}

function getUpdatedAtTime(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新时间：未知";
  return `更新时间：${date.toLocaleString("zh-CN", { hour12: false })}`;
}

function getOverview(record) {
  const actualResult = typeof record.actualResult === "string" ? record.actualResult.trim() : "";
  const usageBackground = typeof record.usageBackground === "string" ? record.usageBackground.trim() : "";
  return actualResult || usageBackground || "暂无内容概览";
}

function getDisplayTitle(record) {
  const title = typeof record.title === "string" ? record.title.trim() : "";
  return title || "未命名反馈";
}

function showPageStatus(message, type) {
  if (!pageStatus) return;
  pageStatus.textContent = message;
  pageStatus.className = `page-status ${type === "success" ? "success" : "error"}`;
  pageStatus.hidden = false;
}

function clearDeletedDraft(deletedId) {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === "object" && parsed.id === deletedId) {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // Broken drafts should not interrupt a successful delete action.
  }
}

function editRecord(id) {
  const storage = window.FeedbackHistoryStorage.createHistoryStorage();
  const record = storage.getById(id);
  if (!record) {
    showPageStatus("编辑失败，这条历史反馈可能已被删除。", "error");
    return;
  }

  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(record));
  } catch {
    showPageStatus("编辑失败，请检查浏览器是否允许临时存储。", "error");
    return;
  }

  window.location.href = "feedback-form.html";
}

function deleteRecord(id) {
  const confirmed = window.confirm("确定删除这条历史反馈吗？删除后无法恢复。");
  if (!confirmed) return;

  try {
    const storage = window.FeedbackHistoryStorage.createHistoryStorage();
    const removed = storage.remove(id);
    if (!removed) {
      showPageStatus("删除失败，请重试。", "error");
      return;
    }
    clearDeletedDraft(id);
    renderHistory();
    showPageStatus("历史反馈已删除。", "success");
  } catch {
    showPageStatus("删除失败，请重试。", "error");
  }
}

function createActionButton(text, ariaLabel, onClick, extraClass = "") {
  const button = document.createElement("button");
  button.className = `button ghost${extraClass ? ` ${extraClass}` : ""}`;
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

function createHistoryCard(record) {
  const card = document.createElement("article");
  card.className = "feedback-card card";

  const topline = document.createElement("div");
  topline.className = "card-topline";

  const level = document.createElement("span");
  const result = window.checkFeedbackCompleteness(record);
  level.className = "level-badge";
  if (result.level === "缺少关键信息") level.classList.add("level-missing");
  if (result.level === "建议补充") level.classList.add("level-suggest");
  if (result.level === "基本完整") level.classList.add("level-complete");
  level.textContent = result.level;

  const time = document.createElement("time");
  time.dateTime = typeof record.updatedAt === "string" ? record.updatedAt : "";
  time.textContent = formatUpdatedAt(record.updatedAt);
  topline.append(level, time);

  const title = document.createElement("h3");
  const displayTitle = getDisplayTitle(record);
  title.textContent = displayTitle;

  const overview = document.createElement("p");
  overview.textContent = `信息概览：${getOverview(record)}`;

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.setAttribute("aria-label", "历史反馈操作");
  actions.append(
    createActionButton("编辑", `编辑：${displayTitle}`, () => editRecord(record.id)),
    createActionButton("删除", `删除：${displayTitle}`, () => deleteRecord(record.id), "danger")
  );

  card.append(topline, title, overview, actions);
  return card;
}

function renderHistory() {
  if (!historyList || !historyEmpty || !window.FeedbackHistoryStorage || typeof window.checkFeedbackCompleteness !== "function") return;

  const storage = window.FeedbackHistoryStorage.createHistoryStorage();
  const records = storage.getAll()
    .filter(isRenderableRecord)
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      const timeDiff = getUpdatedAtTime(b.record.updatedAt) - getUpdatedAtTime(a.record.updatedAt);
      return timeDiff || a.index - b.index;
    })
    .map(({ record }) => record);
  historyList.replaceChildren();
  historyEmpty.hidden = records.length > 0;

  records.forEach((record) => {
    historyList.append(createHistoryCard(record));
  });
}

renderHistory();
