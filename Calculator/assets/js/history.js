/* ============================================
   HISTORY.JS - Calculation history management
   ============================================ */

const HistoryManager = (function () {
  const HISTORY_KEY = "calc_history";
  const MAX_HISTORY = 15;

  const historyList = document.getElementById("historyList");
  const historyPanel = document.getElementById("historyPanel");
  const historyBtn = document.getElementById("historyBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  function getHistory() {
    const data = Utils.getFromStorage(HISTORY_KEY);
    return data || [];
  }

  function saveHistory(history) {
    Utils.setToStorage(HISTORY_KEY, history.slice(0, MAX_HISTORY));
  }

  function addEntry(expr, result) {
    const history = getHistory();
    history.unshift({ expr, result, timestamp: new Date().getTime() });
    saveHistory(history);
    render();
  }

  function render() {
    const history = getHistory();
    historyList.innerHTML = "";

    if (history.length === 0) {
      historyList.innerHTML =
        '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">No history yet</div>';
      return;
    }

    history.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <span class="history-item-expr">${Utils.escapeHtml(item.expr)}</span>
        <span class="history-item-result">${Utils.escapeHtml(item.result)}</span>
      `;

      div.addEventListener("click", () => {
        // Dispatch custom event to notify app
        window.dispatchEvent(
          new CustomEvent("history-select", {
            detail: { expr: item.expr },
          }),
        );
        historyPanel.setAttribute("hidden", "");
      });

      historyList.appendChild(div);
    });
  }

  function clear() {
    if (confirm("Clear all history?")) {
      Utils.removeFromStorage(HISTORY_KEY);
      render();
      UIManager.showToast("History cleared");
    }
  }

  function initEventListeners() {
    if (historyBtn) {
      historyBtn.addEventListener("click", () => {
        if (historyPanel.hasAttribute("hidden")) {
          historyPanel.removeAttribute("hidden");
          render();
        } else {
          historyPanel.setAttribute("hidden", "");
        }
      });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", clear);
    }

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !historyPanel.hasAttribute("hidden") &&
        !historyPanel.contains(e.target) &&
        !historyBtn.contains(e.target)
      ) {
        historyPanel.setAttribute("hidden", "");
      }
    });
  }

  function init() {
    render();
    initEventListeners();
  }

  return { init, addEntry, render };
})();
