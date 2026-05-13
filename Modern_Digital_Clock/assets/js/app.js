const App = (() => {
  let settings = {};

  function updateTime() {
    const now = new Date();
    const tz = settings.timezone === "local" ? "local" : settings.timezone;
    const parts = Utils.getPartsForZone(now, tz);

    UI.updateTime(parts, settings);

    if (settings.alarmTime) {
      Alarm.checkAndTriggerAlarm(parts, settings.alarmTime, Alarm.isSnoozed());
    }
  }

  function init() {
    settings = Storage.loadSettings();
    UI.populateTimezoneSelect();
    UI.applySettingsToUI(settings);
    Actions.bindUI(settings, updateTime);
    UI.renderTicks();
    updateTime();
    UI.scheduleNextTick(updateTime);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
