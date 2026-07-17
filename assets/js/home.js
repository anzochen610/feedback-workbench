const historyList = document.querySelector("[data-history-list]");
const historyEmpty = document.querySelector("[data-history-empty]");

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

function createButton(text) {
  const button = document.createElement("button");
  button.className = "button ghost";
  button.type = "button";
  button.disabled = true;
  button.textContent = text;
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
  const titleText = typeof record.title === "string" ? record.title.trim() : "";
  title.textContent = titleText || "未命名反馈";

  const overview = document.createElement("p");
  overview.textContent = `信息概览：${getOverview(record)}`;

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.setAttribute("aria-label", "历史反馈操作");
  actions.append(createButton("编辑（下一步实现）"), createButton("删除（下一步实现）"));

  card.append(topline, title, overview, actions);
  return card;
}

function renderHistory() {
  if (!historyList || !historyEmpty || !window.FeedbackHistoryStorage || typeof window.checkFeedbackCompleteness !== "function") return;

  const storage = window.FeedbackHistoryStorage.createHistoryStorage();
  const records = storage.getAll().slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  historyList.replaceChildren();
  historyEmpty.hidden = records.length > 0;

  records.forEach((record) => {
    historyList.append(createHistoryCard(record));
  });
}

renderHistory();
