/* Utility Functions Module */

const Utils = (() => {
  // Generate unique ID for each entry
  const uid = () =>
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  // Get date string in YYYY-MM-DD format
  const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

  // Get current date/time in format for HTML datetime-local input
  const nowLocalISO = () => new Date().toISOString().slice(0, 16);

  // Show temporary notification message
  const showToast = (msg, ms = 1400) => {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), ms);
  };

  // Check if user prefers less motion/animations
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Public API
  return {
    uid,
    todayKey,
    nowLocalISO,
    showToast,
    prefersReduced,
  };
})();
