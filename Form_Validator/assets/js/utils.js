/* Utility Functions Module */

const Utils = (() => {
  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Show toast notification (optional - not used in current form but good to have)
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Navigate to section (for smooth scroll)
  function goTo(selector) {
    const target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Public API
  return {
    escapeHtml,
    showToast,
    goTo,
  };
})();
