/* ============================================================================
   THEME MANAGER - Theme switching and persistence
   ============================================================================ */

class ThemeManager {
  constructor(storage) {
    this.storage = storage;
    this.themeKey = "pomodoro-theme";
  }

  apply() {
    const theme = this.storage.state.settings.theme || "dark";
    const root = document.documentElement;

    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }

    this.updateToggleState(theme);
  }

  toggle() {
    const root = document.documentElement;
    const isLight = root.classList.contains("light");
    const newTheme = isLight ? "dark" : "light";

    this.storage.state.settings.theme = newTheme;
    this.storage.saveAppState();
    this.apply();
  }

  updateToggleState(theme) {
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", (theme === "dark").toString());
    }
  }
}
