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
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("History retrieval failed:", e);
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, MAX_HISTORY))
      );
    } catch (e) {
      console.warn("History save failed:", e);
    }
  }

  function addEntry(expr, result) {
    const history = getHistory();
    history.unshift({ expr, result, timestamp: new Date().getTime() });
    saveHistory(history);
    render();
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
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
        <span class="history-item-expr">${escapeHtml(item.expr)}</span>
        <span class="history-item-result">${escapeHtml(item.result)}</span>
      `;

      div.addEventListener("click", () => {
        // Dispatch custom event to notify app
        window.dispatchEvent(
          new CustomEvent("history-select", {
            detail: { expr: item.expr },
          })
        );
        historyPanel.setAttribute("hidden", "");
      });

      historyList.appendChild(div);
    });
  }

  function clear() {
    if (confirm("Clear all history?")) {
      localStorage.removeItem(HISTORY_KEY);
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
