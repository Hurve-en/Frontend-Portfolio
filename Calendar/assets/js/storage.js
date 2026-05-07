/** ===============================
 *  STORAGE.JS - Data Persistence
 *  =============================== */

const StorageManager = (() => {
  const STORAGE_KEY = "mini-planner-v2";

  // Load app state from localStorage
  function loadState(appState) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.viewDate) appState.viewDate = new Date(parsed.viewDate);
      if (parsed.selectedDate) appState.selectedDate = parsed.selectedDate;
      if (parsed.events) appState.events = parsed.events;
    } catch (e) {
      console.warn("Storage load failed", e);
    }
  }

  // Save app state to localStorage
  function saveState(appState) {
    const toSave = {
      viewDate: appState.viewDate.toISOString(),
      selectedDate: appState.selectedDate,
      events: appState.events,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  // Public API
  return {
    loadState,
    saveState,
  };
})();
