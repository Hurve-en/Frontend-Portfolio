const Storage = (() => {
  const LS_KEY = "clock_settings_v1";
  const DEFAULTS = {
    format24: false,
    timezone: "local",
    viewMode: "digital",
    theme:
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    alarmTime: "",
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign({}, DEFAULTS, parsed);
      }
      return Object.assign({}, DEFAULTS);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  return { loadSettings, saveSettings };
})();
