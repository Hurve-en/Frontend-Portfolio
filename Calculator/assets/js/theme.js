/* ============================================
   THEME.JS - Dark/Light theme management
   ============================================ */

const ThemeManager = (function () {
  const THEME_KEY = "calc_theme";

  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function init() {
    try {
      const saved = Utils.getFromStorage(THEME_KEY);
      const prefersDark = Utils.prefersDarkMode();
      const initialTheme = saved || (prefersDark ? "dark" : "light");

      apply(initialTheme);

      const themeToggle = document.getElementById("themeToggle");
      if (themeToggle) {
        themeToggle.checked = initialTheme === "dark";
        themeToggle.addEventListener("change", (e) => {
          const newTheme = e.target.checked ? "dark" : "light";
          apply(newTheme);
          Utils.setToStorage(THEME_KEY, newTheme);
        });
      }
    } catch (e) {
      console.warn("Theme initialization failed:", e);
    }
  }

  return { init, apply };
})();
