/** ===============================
 *  PREVIEW.JS - Preview Screen
 *  =============================== */

const PreviewView = (() => {
  // Render preview list of cards
  function render(appState) {
    const list = document.getElementById("previewList");
    const badge = document.getElementById("previewBadge");

    badge.textContent = `${appState.cards.length} card${appState.cards.length !== 1 ? "s" : ""}`;

    list.innerHTML = "";
    appState.cards.forEach((c, i) => {
      const el = document.createElement("div");
      el.className = "preview-item";
      el.style.animationDelay = `${i * 0.04}s`;
      el.innerHTML = `
        <div class="preview-num">${i + 1}</div>
        <div class="preview-content">
          <div class="preview-q">${Utils.esc(c.q)}</div>
          <div class="preview-a">${Utils.esc(c.a)}</div>
        </div>
        <button class="del-card" onclick="PreviewView.deleteCard(${i})" title="Remove card">✕</button>
      `;
      list.appendChild(el);
    });
  }

  // Delete a card from preview
  function deleteCard(index) {
    const appState = window.AppState;
    appState.cards.splice(index, 1);

    // Clean up difficulty tracking for deleted card
    Object.keys(appState.cardDifficulty).forEach((key) => {
      if (parseInt(key) === index) delete appState.cardDifficulty[key];
    });

    if (appState.cards.length === 0) {
      Utils.goTo("s-input");
      Utils.showToast("All cards removed. Paste new content.");
      StorageManager.clearSession();
      return;
    }

    render(appState);
    StorageManager.saveSession(appState);
  }

  // Public API
  return {
    render,
    deleteCard,
  };
})();
