/* Storage Module - Entry CRUD and localStorage persistence */

const Storage = (() => {
  // Storage keys
  const STORE_KEY = "daily-journal-v1";
  const DRAFT_KEY = "daily-journal-draft";

  // All entries
  let entries = [];

  // Load all entries from browser storage
  function loadStore() {
    try {
      entries = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    } catch (e) {
      entries = [];
    }
  }

  // Save all entries to browser storage
  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Save failed", e);
    }
  }

  // Create a new entry and save it
  function createEntry(data) {
    const id = Utils.uid();
    const createdAt = Date.now();
    const entry = {
      id,
      title: data.title || "",
      body: data.body || "",
      date: data.date || Utils.todayKey(),
      mood: data.mood || null,
      tags: data.tags || [],
      createdAt,
      updatedAt: createdAt,
    };
    entries.unshift(entry);
    saveStore();
    return entry;
  }

  // Update an existing entry
  function updateEntry(id, updates) {
    const idx = entries.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    saveStore();
    return entries[idx];
  }

  // Delete an entry
  function deleteEntry(id) {
    const idx = entries.findIndex((x) => x.id === id);
    if (idx < 0) return;
    entries.splice(idx, 1);
    saveStore();
  }

  // Get all entries
  function getAllEntries() {
    return entries;
  }

  // Get entry by ID
  function getEntryById(id) {
    return entries.find((x) => x.id === id);
  }

  // Save draft
  function saveDraft(draft) {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ts: Date.now(), draft }),
      );
    } catch (e) {
      console.warn("Draft save failed", e);
    }
  }

  // Load draft if any
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw).draft : null;
    } catch (e) {
      return null;
    }
  }

  // Clear draft
  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }

  // Import entries from JSON
  function importEntries(arr) {
    if (!Array.isArray(arr)) throw new Error("Invalid format");
    entries = arr;
    saveStore();
  }

  // Public API
  return {
    loadStore,
    saveStore,
    createEntry,
    updateEntry,
    deleteEntry,
    getAllEntries,
    getEntryById,
    saveDraft,
    loadDraft,
    clearDraft,
    importEntries,
  };
})();
