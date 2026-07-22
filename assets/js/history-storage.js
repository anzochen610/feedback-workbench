(function (global) {
  "use strict";

  const HISTORY_KEY = "feedbackWorkbenchHistory";
  const FEEDBACK_FIELDS = [
    "title",
    "usageBackground",
    "userGoal",
    "pageOrStep",
    "actualResult",
    "canReproduce",
    "expectedResult",
    "impact",
    "temporaryWorkaround",
    "proposedSolution",
  ];

  function createFallbackId() {
    return `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return createFallbackId();
  }

  function asText(value) {
    return typeof value === "string" ? value : "";
  }

  function normalizeSteps(steps) {
    return Array.isArray(steps) ? steps.map(asText) : [];
  }

  function isValidHistoryRecord(record) {
    return Boolean(
      record
        && typeof record === "object"
        && !Array.isArray(record)
        && typeof record.id === "string"
        && record.id.trim()
    );
  }

  function createUpdatedAt(existingRecord) {
    const now = new Date();
    const existingTime = Date.parse(asText(existingRecord?.updatedAt));
    if (!Number.isNaN(existingTime) && now.getTime() <= existingTime) {
      return new Date(existingTime + 1).toISOString();
    }
    return now.toISOString();
  }

  function normalizeRecord(draft, existingRecord) {
    const now = new Date().toISOString();
    const record = {
      id: asText(draft?.id) || asText(existingRecord?.id) || createId(),
      title: "",
      createdAt: asText(existingRecord?.createdAt) || asText(draft?.createdAt) || now,
      updatedAt: createUpdatedAt(existingRecord),
      usageBackground: "",
      userGoal: "",
      pageOrStep: "",
      operationSteps: normalizeSteps(draft?.operationSteps),
      actualResult: "",
      canReproduce: "",
      expectedResult: "",
      impact: "",
      temporaryWorkaround: "",
      proposedSolution: "",
    };

    FEEDBACK_FIELDS.forEach((key) => {
      record[key] = asText(draft?.[key]);
    });

    return record;
  }

  function getStorage(storage) {
    if (storage) return storage;
    try {
      return global.localStorage || null;
    } catch {
      return null;
    }
  }

  function createHistoryStorage(storage) {
    const storageObject = getStorage(storage);

    function requireStorage() {
      if (!storageObject) {
        throw new Error("Local storage is unavailable.");
      }
      return storageObject;
    }

    function getAll() {
      if (!storageObject) return [];
      let raw = null;
      try {
        raw = storageObject.getItem(HISTORY_KEY);
      } catch {
        return [];
      }
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isValidHistoryRecord) : [];
      } catch {
        return [];
      }
    }

    function save(draft) {
      const usableStorage = requireStorage();
      const records = getAll();
      const draftId = asText(draft?.id);
      const existingIndex = draftId ? records.findIndex((record) => record && record.id === draftId) : -1;
      const existingRecord = existingIndex >= 0 ? records[existingIndex] : null;
      const savedRecord = normalizeRecord(draft, existingRecord);
      const nextRecords = records.slice();

      if (existingIndex >= 0) {
        nextRecords[existingIndex] = savedRecord;
      } else {
        nextRecords.unshift(savedRecord);
      }

      usableStorage.setItem(HISTORY_KEY, JSON.stringify(nextRecords));
      return savedRecord;
    }

    function getById(id) {
      const textId = asText(id);
      if (!textId) return null;
      return getAll().find((record) => record && record.id === textId) || null;
    }

    function remove(id) {
      const textId = asText(id);
      if (!textId.trim()) return false;

      const records = getAll();
      const existingIndex = records.findIndex((record) => record && record.id === textId);
      if (existingIndex < 0) return false;

      const usableStorage = requireStorage();
      const nextRecords = records.slice(0, existingIndex).concat(records.slice(existingIndex + 1));
      usableStorage.setItem(HISTORY_KEY, JSON.stringify(nextRecords));
      return true;
    }

    return { key: HISTORY_KEY, getAll, save, getById, remove };
  }

  const api = { key: HISTORY_KEY, createHistoryStorage };
  global.FeedbackHistoryStorage = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
