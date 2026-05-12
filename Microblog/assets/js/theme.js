const Theme = (() => {
  const THEME_KEY = "microblog-theme";

  function loadTheme() {
    const t = localStorage.getItem(THEME_KEY) || "light";
    applyTheme(t);
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  function toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    UI.showToast("Theme updated", "success");
  }

  return { loadTheme, toggleTheme };
})();
