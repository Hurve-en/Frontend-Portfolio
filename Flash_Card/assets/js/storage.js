/** ===============================
 *  STORAGE.JS - Data Persistence
 *  =============================== */

const StorageManager = (() => {
  const SESSION_KEY = "flashcardSession";

  // Load study session from localStorage
  function loadSession(appState) {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        appState.cards = session.cards || [];
        appState.cardDifficulty = session.cardDifficulty || {};
        appState.studyStats = session.studyStats || {
          total: 0,
          easy: 0,
          hard: 0,
          mastered: 0,
        };
        return true;
      } catch (e) {
        console.error("Failed to load session:", e);
        return false;
      }
    }
    return false;
  }

  // Save study session to localStorage
  function saveSession(appState) {
    const session = {
      cards: appState.cards,
      cardDifficulty: appState.cardDifficulty,
      studyStats: appState.studyStats,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  // Clear study session
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // Public API
  return {
    loadSession,
    saveSession,
    clearSession,
  };
})();
