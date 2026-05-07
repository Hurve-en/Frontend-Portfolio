/** ===============================
 *  UTILS.JS - Utility Functions
 *  =============================== */

const Utils = (() => {
  // Date to ISO string (YYYY-MM-DD)
  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  // ISO string to Date
  function fromISODate(iso) {
    const [y, m, dd] = iso.split("-").map(Number);
    return new Date(y, m - 1, dd);
  }

  // Format month and year
  function niceMonthYear(d) {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }

  // Get weekday name
  function weekdayName(d) {
    return d.toLocaleString(undefined, { weekday: "long" });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  }

  // Get category color for dot indicators
  function getCategoryColor(category) {
    const colors = {
      work: "var(--cat-work)",
      personal: "var(--cat-personal)",
      health: "var(--cat-health)",
      other: "var(--cat-other)",
    };
    return colors[category] || colors.other;
  }

  // Public API
  return {
    toISODate,
    fromISODate,
    niceMonthYear,
    weekdayName,
    escapeHtml,
    getCategoryColor,
  };
})();
