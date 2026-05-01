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
      const saved = localStorage.getItem(THEME_KEY);
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = saved || (prefersDark ? "dark" : "light");

      apply(initialTheme);

      const themeToggle = document.getElementById("themeToggle");
      if (themeToggle) {
        themeToggle.checked = initialTheme === "dark";
        themeToggle.addEventListener("change", (e) => {
          const newTheme = e.target.checked ? "dark" : "light";
          apply(newTheme);
          try {
            localStorage.setItem(THEME_KEY, newTheme);
          } catch (e) {
            console.warn("Theme storage failed:", e);
          }
        });
      }
    } catch (e) {
      console.warn("Theme initialization failed:", e);
    }
  }

  return { init, apply };
})();
