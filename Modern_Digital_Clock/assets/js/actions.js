const Actions = (() => {
  function bindUI(settings, updateTimeFn) {
    const themeToggle = document.getElementById("themeToggle");
    const formatToggle = document.getElementById("formatToggle");
    const tzSelect = document.getElementById("tzSelect");
    const viewModeSelect = document.getElementById("viewMode");
    const setAlarmBtn = document.getElementById("setAlarm");
    const clearAlarmBtn = document.getElementById("clearAlarm");
    const snoozeBtn = document.getElementById("snoozeBtn");
    const stopBtn = document.getElementById("stopBtn");
    const alarmTimeInput = document.getElementById("alarmTime");
    const alarmStateEl = document.getElementById("alarmState");
    const appEl = document.querySelector(".app");

    themeToggle.addEventListener("change", () => {
      Theme.toggleTheme(settings);
    });

    formatToggle.addEventListener("click", () => {
      settings.format24 = !settings.format24;
      formatToggle.setAttribute("aria-pressed", String(!settings.format24));
      Storage.saveSettings(settings);
      updateTimeFn();
    });

    tzSelect.addEventListener("change", () => {
      const tz = tzSelect.value;
      settings.timezone = tz;
      Storage.saveSettings(settings);
    });

    viewModeSelect.addEventListener("change", () => {
      settings.viewMode = viewModeSelect.value;
      if (settings.viewMode === "minimal") appEl.classList.add("minimal");
      else appEl.classList.remove("minimal");
      Storage.saveSettings(settings);
    });

    setAlarmBtn.addEventListener("click", () => {
      const val = alarmTimeInput.value;
      settings.alarmTime = val;
      Storage.saveSettings(settings);
      Alarm.setAlarmFromInput(val);
    });

    clearAlarmBtn.addEventListener("click", () => {
      settings.alarmTime = "";
      Storage.saveSettings(settings);
      Alarm.clearAlarm();
    });

    snoozeBtn.addEventListener("click", () => Alarm.snoozeAlarm());
    stopBtn.addEventListener("click", () => Alarm.stopAlarm());

    alarmStateEl.addEventListener("click", () => Alarm.stopAlarm());

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.activeElement === alarmTimeInput) {
        alarmTimeInput.value = "";
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateTimeFn();
    });
  }

  return { bindUI };
})();
