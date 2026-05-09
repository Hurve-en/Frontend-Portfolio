/** ===============================
 *  UTILS.JS - Utility Functions
 *  =============================== */

const Utils = (() => {
  // Escape HTML to prevent XSS
  function esc(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Show toast notification
  let toastTimer;
  function showToast(msg, isError = false) {
    clearTimeout(toastTimer);
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const t = document.createElement("div");
    t.className = "toast" + (isError ? " error" : " success");
    t.textContent = msg;
    document.body.appendChild(t);
    toastTimer = setTimeout(() => t && t.remove(), 3000);
  }

  // Switch visible screen by ID
  function goTo(id) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    // Focus management for accessibility
    const screen = document.getElementById(id);
    if (screen) {
      setTimeout(() => {
        const firstButton = screen.querySelector("button");
        if (firstButton) firstButton.focus();
      }, 100);
    }
  }

  // Public API
  return {
    esc,
    showToast,
    goTo,
  };
})();
