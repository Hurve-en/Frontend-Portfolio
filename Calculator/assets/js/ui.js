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

  return {
    renderPrimary,
    renderSecondary,
    showToast,
  };
})();
