/* ============================================
   UI.JS - UI rendering and display management
   ============================================ */

const UIManager = (function () {
  const primaryEl = document.getElementById("primary");
  const secondaryEl = document.getElementById("secondary");
  const toastEl = document.getElementById("toast");

  function renderPrimary(text, isError = false) {
    primaryEl.textContent = text === "" ? "0" : text;
    primaryEl.classList.toggle("error", !!isError);
  }

  function renderSecondary(value) {
    secondaryEl.textContent = value === null ? "—" : String(value);
  }

  function showToast(message, duration = 2000) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, duration);
  }

  /**
   * Centralized display state update (for future scaling)
   * @param {object} state - { primary?: string, secondary?: value, toast?: string, error?: boolean }
   */
  function updateState(state = {}) {
    if (state.primary !== undefined) {
      renderPrimary(state.primary, state.error || false);
    }
    if (state.secondary !== undefined) {
      renderSecondary(state.secondary);
    }
    if (state.toast !== undefined) {
      showToast(state.toast);
    }
  }

  return {
    renderPrimary,
    renderSecondary,
    showToast,
    updateState, // New centralized method for future growth
  };
})();
