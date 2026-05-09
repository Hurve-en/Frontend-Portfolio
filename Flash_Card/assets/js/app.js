/** ===============================
 *  APP.JS - Application Controller
 *  =============================== */

// Global app state
window.AppState = {
  cards: [],
  studyOrder: [],
  idx: 0,
  cardDifficulty: {},
  studyStats: { total: 0, easy: 0, hard: 0, mastered: 0 },
};

const FlashcardApp = (() => {
  // Initialize app
  function init() {
    const appState = window.AppState;

    // Try to load previous session
    StorageManager.loadSession(appState);

    // Attach event listeners
    attachEventListeners();
  }

  // Attach all event listeners
  function attachEventListeners() {
    const pasteArea = document.getElementById("pasteArea");
    const parseBtn = document.getElementById("parseBtn");

    // Monitor input and enable/disable parse button
    pasteArea.addEventListener("input", function () {
      parseBtn.disabled = this.value.trim().length < 3;
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      const activeScreen = document.querySelector(".screen.active").id;

      // Space or Enter to flip in study mode
      if (
        (e.code === "Space" || e.code === "Enter") &&
        activeScreen === "s-study"
      ) {
        e.preventDefault();
        StudyView.flip(window.AppState);
      }

      // Arrow keys for navigation
      if (e.code === "ArrowRight" && activeScreen === "s-study") {
        e.preventDefault();
        StudyView.navigate(window.AppState, 1);
      }
      if (e.code === "ArrowLeft" && activeScreen === "s-study") {
        e.preventDefault();
        StudyView.navigate(window.AppState, -1);
      }

      // E for Easy, H for Hard
      if (e.code === "KeyE" && activeScreen === "s-study") {
        e.preventDefault();
        StudyView.markEasy(window.AppState);
      }
      if (e.code === "KeyH" && activeScreen === "s-study") {
        e.preventDefault();
        StudyView.markHard(window.AppState);
      }

      // Ctrl/Cmd+Shift+S to shuffle
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.code === "KeyS" &&
        activeScreen === "s-study"
      ) {
        e.preventDefault();
        StudyView.shuffle(window.AppState);
      }
    });
  }

  // Public API
  return {
    init,
  };
})();

// Global functions for onclick handlers in HTML
function clearInput() {
  document.getElementById("pasteArea").value = "";
  document.getElementById("parseBtn").disabled = true;
}

function parseInput() {
  const rawText = document.getElementById("pasteArea").value;
  const result = Parser.parseInput(rawText);

  if (!result.success) {
    Utils.showToast(
      "Couldn't detect Q&A pairs. Try using Q: / A: labels.",
      true,
    );
    return;
  }

  const appState = window.AppState;
  appState.cards = result.cards;
  appState.cardDifficulty = {};
  appState.studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
  StorageManager.saveSession(appState);

  PreviewView.render(appState);
  Utils.goTo("s-preview");
  Utils.showToast(
    `Parsed ${result.cards.length} card${result.cards.length !== 1 ? "s" : ""}! ✓`,
  );
}

function startStudy() {
  const appState = window.AppState;
  if (appState.cards.length === 0) return;

  appState.studyOrder = [...Array(appState.cards.length).keys()];
  appState.idx = 0;
  appState.cardDifficulty = {};
  appState.studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
  StorageManager.saveSession(appState);

  Utils.goTo("s-study");
  StudyView.showCard(appState);
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  FlashcardApp.init();
});
