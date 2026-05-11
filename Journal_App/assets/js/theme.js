/* Theme Module - Dark/Light mode toggle */

const Theme = (() => {
  // Apply saved theme if exists
  function loadTheme() {
    try {
      const saved = localStorage.getItem("journal-theme");
      if (saved) document.body.setAttribute("data-theme", saved);
    } catch (e) {}
  }

  // Toggle theme
  function toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", next);
    document
      .getElementById("themeBtn")
      .setAttribute("aria-pressed", String(next === "dark"));
    try {
      localStorage.setItem("journal-theme", next);
    } catch (e) {}
  }

  // Public API
  return {
    loadTheme,
    toggleTheme,
  };
})();
