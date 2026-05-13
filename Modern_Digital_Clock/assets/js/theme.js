const Theme = (() => {
  function applyTheme(theme) {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.checked = theme === "dark";
    }
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function toggleTheme(settings) {
    const theme = settings.theme === "dark" ? "light" : "dark";
    settings.theme = theme;
    Storage.saveSettings(settings);
    applyTheme(theme);
  }

  return { applyTheme, toggleTheme };
})();
