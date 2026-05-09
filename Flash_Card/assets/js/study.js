/** ===============================
 *  STUDY.JS - Study Mode Logic
 *  =============================== */

const StudyView = (() => {
  // Show current card
  function showCard(appState) {
    const c = appState.cards[appState.studyOrder[appState.idx]];

    document.getElementById("qText").textContent = c.q;
    document.getElementById("aText").textContent = c.a;
    document.getElementById("flipper").classList.remove("flipped");

    // Update progress bar
    const pct = ((appState.idx + 1) / appState.studyOrder.length) * 100;
    document.getElementById("progFill").style.width = pct + "%";
    document.getElementById("progTxt").textContent =
      `${appState.idx + 1} of ${appState.studyOrder.length}`;

    // Update navigation buttons
    document.getElementById("prevBtn").disabled = appState.idx === 0;
    document.getElementById("nextBtn").disabled =
      appState.idx === appState.studyOrder.length - 1;

    // Show done screen on last card
    if (appState.idx === appState.studyOrder.length - 1) {
      clearTimeout(window._doneTimer);
      window._doneTimer = setTimeout(() => showDone(appState), 700);
    } else {
      clearTimeout(window._doneTimer);
      removeDone();
    }
  }

  // Flip card
  function flip(appState) {
    document.getElementById("flipper").classList.toggle("flipped");
    StorageManager.saveSession(appState);
  }

  // Navigate between cards
  function navigate(appState, direction) {
    const next = appState.idx + direction;
    if (next < 0 || next >= appState.studyOrder.length) return;
    appState.idx = next;
    showCard(appState);
    StorageManager.saveSession(appState);
  }

  // Mark card as easy
  function markEasy(appState) {
    const cardIdx = appState.studyOrder[appState.idx];
    appState.cardDifficulty[cardIdx] = "easy";
    appState.studyStats.easy++;
    StorageManager.saveSession(appState);
    Utils.showToast("Marked as Easy ✓", false);
    navigate(appState, 1);
  }

  // Mark card as hard
  function markHard(appState) {
    const cardIdx = appState.studyOrder[appState.idx];
    appState.cardDifficulty[cardIdx] = "hard";
    appState.studyStats.hard++;
    StorageManager.saveSession(appState);
    Utils.showToast("Marked as Hard ⚡", false);
    navigate(appState, 1);
  }

  // Shuffle cards
  function shuffle(appState) {
    // Fisher-Yates shuffle
    for (let i = appState.studyOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [appState.studyOrder[i], appState.studyOrder[j]] = [
        appState.studyOrder[j],
        appState.studyOrder[i],
      ];
    }
    appState.idx = 0;
    removeDone();
    showCard(appState);
    StorageManager.saveSession(appState);
    Utils.showToast("Cards shuffled 🔀", false);
  }

  // Show completion overlay
  function showDone(appState) {
    if (document.getElementById("doneOverlay")) return;

    appState.studyStats.total = appState.studyOrder.length;
    appState.studyStats.mastered = appState.studyStats.easy;
    StorageManager.saveSession(appState);

    const scene = document.getElementById("scene");
    const done = document.createElement("div");
    done.className = "done-overlay";
    done.id = "doneOverlay";

    const accuracyPercent =
      appState.studyStats.total > 0
        ? Math.round(
            (appState.studyStats.easy / appState.studyStats.total) * 100,
          )
        : 0;

    done.innerHTML = `
      <div class="done-icon">🎉</div>
      <div class="done-title">Session Complete!</div>
      <div class="done-sub">You reviewed all ${appState.cards.length} card${appState.cards.length !== 1 ? "s" : ""}.</div>
      <div class="done-stats">
        <div class="done-stat-row">
          <div class="done-stat">
            <div class="done-stat-value">${appState.studyStats.easy}</div>
            <div class="done-stat-label">Mastered</div>
          </div>
          <div class="done-stat">
            <div class="done-stat-value">${appState.studyStats.hard}</div>
            <div class="done-stat-label">Need Practice</div>
          </div>
          <div class="done-stat">
            <div class="done-stat-value">${accuracyPercent}%</div>
            <div class="done-stat-label">Accuracy</div>
          </div>
        </div>
      </div>
      <div class="done-btns">
        <button class="btn-restart" onclick="StudyView.restart()">Study Again</button>
        <button class="btn-sm" style="flex:1;padding:12px" onclick="StudyView.editCards()">Edit Cards</button>
      </div>
    `;
    scene.appendChild(done);
  }

  // Remove completion overlay
  function removeDone() {
    const d = document.getElementById("doneOverlay");
    if (d) d.remove();
  }

  // Restart study session
  function restart() {
    const appState = window.AppState;
    removeDone();
    appState.studyOrder = [...Array(appState.cards.length).keys()];
    appState.idx = 0;
    appState.cardDifficulty = {};
    appState.studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
    showCard(appState);
    StorageManager.saveSession(appState);
  }

  // Exit study and edit cards
  function editCards() {
    removeDone();
    Utils.goTo("s-preview");
    PreviewView.render(window.AppState);
  }

  // Public API
  return {
    showCard,
    flip,
    navigate,
    markEasy,
    markHard,
    shuffle,
    showDone,
    removeDone,
    restart,
    editCards,
  };
})();
