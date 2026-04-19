/* Digital Clock - Timezone, 12/24 format, alarm, theme, and analog view support */
/*
  FEATURES:
  - Display time in any timezone with 12/24 hour format
  - Set alarms with snooze functionality
  - Light/dark theme with persistence
  - Analog and minimal view modes
  - Uses localStorage for saving user preferences
  - Web Audio API for alarm beeps
*/

(function () {
  // HTML Elements - Get references to all interactive elements
  const timeDisplay = document.getElementById("timeDisplay");
  const dateDisplay = document.getElementById("dateDisplay");
  const tzSelect = document.getElementById("tzSelect");
  const tzLabel = document.getElementById("tzLabel");
  const themeToggle = document.getElementById("themeToggle");
  const formatToggle = document.getElementById("formatToggle");
  const viewModeSelect = document.getElementById("viewMode");
  const analogWrap = document.getElementById("analogWrap");
  const alarmTimeInput = document.getElementById("alarmTime");
  const setAlarmBtn = document.getElementById("setAlarm");
  const clearAlarmBtn = document.getElementById("clearAlarm");
  const alarmStateEl = document.getElementById("alarmState");
  const snoozeBtn = document.getElementById("snoozeBtn");
  const stopBtn = document.getElementById("stopBtn");
  const appEl = document.querySelector(".app");
  const beepSample = document.getElementById("beepSample");

  // Analog Clock Hands - Rotating SVG lines
  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const ticksContainer = document.getElementById("ticks");

  // Configuration - Timezone options and default settings
  const TZ_PRESETS = [
    { id: "local", label: "Local" },
    { id: "UTC", label: "UTC" },
    { id: "America/New_York", label: "New York" },
    { id: "Europe/London", label: "London" },
    { id: "Asia/Tokyo", label: "Tokyo" },
  ];

  // Settings Storage - Key name and initial values
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
    alarmTime: "", // 'HH:MM'
  };

  // App State - Variables that change during execution
  let settings = {};
  let alarmActive = false;
  let alarmTriggered = false;
  let snoozeUntil = null; // epoch ms or null
  let audioEnabled = true;
  let audioCtx = null;
  let beepNode = null;

  // Alarm Tracking - Prevents alarm from firing repeatedly in same minute
  let lastAlarmTriggerKey = null;

  // Storage Utilities - Save and load settings from browser storage
  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        settings = Object.assign({}, DEFAULTS, parsed);
      } else settings = Object.assign({}, DEFAULTS);
    } catch (e) {
      settings = Object.assign({}, DEFAULTS);
    }
  }
  function saveSettings() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch (e) {
      /* ignore storage errors */
    }
  }

  // UI Setup - Populate dropdowns and apply saved settings
  function populateTimezoneSelect() {
    tzSelect.innerHTML = "";
    TZ_PRESETS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      tzSelect.appendChild(opt);
    });
    // allow manual entry: also include browser's Intl timeZone (if available)
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (guessed && !TZ_PRESETS.some((p) => p.id === guessed)) {
      const o = document.createElement("option");
      o.value = guessed;
      o.textContent = guessed;
      tzSelect.appendChild(o);
    }
  }

  function applySettingsToUI() {
    themeToggle.checked = settings.theme === "dark";
    if (settings.theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");

    formatToggle.setAttribute("aria-pressed", String(!settings.format24));
    formatToggle.dataset.format24 = settings.format24 ? "1" : "0";

    if (
      TZ_PRESETS.some((p) => p.id === settings.timezone) ||
      settings.timezone
    ) {
      tzSelect.value = settings.timezone;
    } else {
      tzSelect.value = "local";
      settings.timezone = "local";
    }
    tzLabel.textContent = (
      TZ_PRESETS.find((p) => p.id === settings.timezone) || {
        label: settings.timezone,
      }
    ).label;

    viewModeSelect.value = settings.viewMode || "digital";
    if (settings.viewMode === "minimal") appEl.classList.add("minimal");
    else appEl.classList.remove("minimal");

    alarmTimeInput.value = settings.alarmTime || "";
  }

  // Time Utilities - Format and convert time for different timezones
  function getPartsForZone(date = new Date(), timeZone = "local") {
    // if 'local', use default locale (no timeZone option) to get local parts
    const opts = {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    };
    const parts =
      timeZone === "local"
        ? new Intl.DateTimeFormat([], opts).formatToParts(date)
        : new Intl.DateTimeFormat(
            "en-US",
            Object.assign({}, opts, { timeZone }),
          ).formatToParts(date);

    // convert parts to an object for quick lookup
    const out = {};
    parts.forEach((p) => {
      out[p.type] = p.value;
    });
    return out;
  }

  // Format Time - Convert 24-hour time to 12 or 24-hour display format
  function formatTimeFromParts(parts) {
    // parts.hour is 00..23 string
    const h24 = parseInt(parts.hour, 10);
    let displayHour = h24;
    let ampm = "";
    if (!settings.format24) {
      ampm = h24 >= 12 ? "PM" : "AM";
      displayHour = h24 % 12;
      if (displayHour === 0) displayHour = 12;
    }
    const hh = String(displayHour).padStart(2, "0");
    const mm = String(parts.minute || "00").padStart(2, "0");
    const ss = String(parts.second || "00").padStart(2, "0");
    return { timeStr: `${hh}:${mm}:${ss}`, ampm };
  }

  // Format Date - Create readable date string from parts
  function formatDateFromParts(parts) {
    const wk = parts.weekday || "";
    const mon = parts.month || "";
    const day = parts.day || "";
    const yr = parts.year || "";
    return `${wk}, ${mon} ${day}, ${yr}`;
  }

  // Alarm Logic - Check and trigger alarms at the right time
  function checkAndTriggerAlarm(parts) {
    const alarmSet = settings.alarmTime && settings.alarmTime.length === 5;
    if (!alarmSet) return;

    // Check if snoozed - don't trigger if snooze is still active
    if (snoozeUntil && Date.now() < snoozeUntil) return;

    const [ah, am] = settings.alarmTime.split(":").map((x) => parseInt(x, 10));
    const curH = parseInt(parts.hour, 10);
    const curM = parseInt(parts.minute, 10);

    // Create unique key - prevents multiple triggers in the same minute
    const todayKey = `${parts.year}-${parts.month}-${parts.day}-${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;

    // Check if current time matches alarm time
    if (ah === curH && am === curM) {
      // Trigger alarm if it hasn't fired for this time yet
      if (lastAlarmTriggerKey !== todayKey) {
        triggerAlarm();
        lastAlarmTriggerKey = todayKey;
      }
    }
  }

  // Trigger Alarm - Show alert and play sound
  function triggerAlarm() {
    alarmTriggered = true;
    alarmStateEl.hidden = false;
    // Play alarm sound
    startBeep();
    // Focus alert for accessibility
    alarmStateEl.querySelector(".alarm-message").focus?.();
  }

  // Stop Alarm - Hide alert and mute sound
  function stopAlarm() {
    alarmTriggered = false;
    alarmStateEl.hidden = true;
    stopBeep();
    snoozeUntil = null;
  }

  // Snooze Alarm - Quiet for 5 minutes then trigger again
  function snoozeAlarm() {
    stopBeep();
    alarmTriggered = false;
    alarmStateEl.hidden = true;
    snoozeUntil = Date.now() + 5 * 60 * 1000;
  }

  // Set Alarm - Save time from input field
  function setAlarmFromInput() {
    const val = alarmTimeInput.value; // 'HH:MM' or ''
    settings.alarmTime = val;
    saveSettings();
    if (val) {
      // Alarm set - will trigger when local time matches
      showToast(`Alarm set for ${val}`);
    } else {
      showToast("Alarm cleared");
    }
  }

  // Clear Alarm - Remove set time and stop any active alarm
  function clearAlarm() {
    settings.alarmTime = "";
    saveSettings();
    alarmTimeInput.value = "";
    stopAlarm();
  }

  // Audio Beep - Play sound using Web Audio API or fallback audio element
  function startBeep() {
    // Try modern Web Audio API
    try {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Create sine wave sound at 880Hz
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // A5
      g.gain.value = 0.0001; // Start quiet for autoplay compatibility
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();

      // Ramp up volume quickly
      g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);

      beepNode = { oscillator: o, gain: g };
    } catch (e) {
      // Fallback - use HTML audio element if Web Audio fails
      try {
        beepSample.play().catch((err) => {
          // Audio blocked - tell user to interact with page
          showToast(
            "Audio blocked by browser. Interact to enable alarm sound.",
            true,
          );
        });
      } catch (err) {
        // ignore
      }
    }
  }

  function stopBeep() {
    try {
      if (beepNode && beepNode.oscillator) {
        beepNode.gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + 0.02,
        );
        beepNode.oscillator.stop(audioCtx.currentTime + 0.03);
        beepNode = null;
      }
    } catch (e) {}
    try {
      beepSample.pause();
      beepSample.currentTime = 0;
    } catch (e) {} // Stop audio element
  }

  // Update Clock Display - Main render loop that updates every second
  function updateTime() {
    const now = new Date();
    // Get timezone to display
    const tz = settings.timezone === "local" ? "local" : settings.timezone;

    // Get time parts as strings for selected timezone
    const parts = getPartsForZone(now, tz);

    // Update digital time and date display
    const tf = formatTimeFromParts(parts);
    timeDisplay.textContent = settings.format24
      ? `${parts.hour}:${parts.minute}:${parts.second}`
      : `${tf.timeStr} ${tf.ampm}`;
    dateDisplay.textContent = formatDateFromParts(parts);
    tzLabel.textContent = (
      TZ_PRESETS.find((p) => p.id === settings.timezone) || {
        label: settings.timezone,
      }
    ).label;

    // Update analog clock hands
    updateAnalogHands(parts);

    // Check if alarm should trigger
    if (settings.alarmTime) {
      checkAndTriggerAlarm(parts);
    }

    // Schedule next update for top of next second
    scheduleNextTick();
  }

  // Schedule Next Update - Align to next second boundary
  let nextTickTimer = null;
  function scheduleNextTick() {
    if (nextTickTimer) clearTimeout(nextTickTimer);
    const now = Date.now();
    const delay = 1000 - (now % 1000) + 5; // Add small offset to hit next second
    nextTickTimer = setTimeout(updateTime, delay);
  }

  // Update Analog Hands - Rotate clock hands to show current time
  function updateAnalogHands(parts) {
    // Convert time parts to numbers
    const h = parseInt(parts.hour, 10);
    const m = parseInt(parts.minute, 10);
    const s = parseInt(parts.second, 10);

    // Calculate rotation angles for each hand (30 degrees per hour/5 min, 6 degrees per min/sec)
    const hourAngle = ((h % 12) + m / 60) * 30;
    const minuteAngle = (m + s / 60) * 6;
    const secondAngle = s * 6;

    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    secondHand.style.transform = `rotate(${secondAngle}deg)`;
  }

  // Get Time Parts - Extract date/time components for a timezone
  function getPartsForZone(date, timeZone) {
    const opts = {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    };
    try {
      const dtf =
        timeZone === "local"
          ? new Intl.DateTimeFormat([], opts)
          : new Intl.DateTimeFormat(
              "en-US",
              Object.assign({}, opts, { timeZone }),
            );
      const parts = dtf.formatToParts(date);
      const out = {};
      parts.forEach((p) => (out[p.type] = p.value));
      // Ensure digits are standard 0-9 format, not locale-specific
      if (out.hour) out.hour = out.hour.replace(/[^\d]/g, "").padStart(2, "0");
      if (out.minute)
        out.minute = out.minute.replace(/[^\d]/g, "").padStart(2, "0");
      if (out.second)
        out.second = out.second.replace(/[^\d]/g, "").padStart(2, "0");
      return out;
    } catch (e) {
      // Fallback - return local timezone if request fails
      const local = new Intl.DateTimeFormat([], opts).formatToParts(date);
      const out = {};
      local.forEach((p) => (out[p.type] = p.value));
      return out;
    }
  }

  // Format Time String - Convert 24-hour to 12 or 24-hour format
  function formatTimeFromParts(parts) {
    const h24 = parseInt(parts.hour || "0", 10);
    let displayHour = h24;
    let ampm = "";
    if (!settings.format24) {
      ampm = h24 >= 12 ? "PM" : "AM";
      displayHour = h24 % 12;
      if (displayHour === 0) displayHour = 12;
    }
    const hh = String(displayHour).padStart(2, "0");
    const mm = String(parts.minute || "00").padStart(2, "0");
    const ss = String(parts.second || "00").padStart(2, "0");
    return { timeStr: `${hh}:${mm}:${ss}`, ampm };
  }

  function formatDateFromParts(parts) {
    const wk = parts.weekday || "";
    const mon = parts.month || "";
    const day = parts.day || "";
    const yr = parts.year || "";
    return `${wk}, ${mon} ${day}, ${yr}`;
  }

  // Show Toast - Display temporary notification message
  let toastTimer = null;
  function showToast(msg, sticky = false) {
    // Create temporary on-screen message
    if (!sticky) {
      // Non-sticky - auto-hide after 2.5 seconds
      const el = document.createElement("div");
      el.textContent = msg;
      el.style.position = "fixed";
      el.style.bottom = "18px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.background = "rgba(6,10,25,0.9)";
      el.style.color = "white";
      el.style.padding = "8px 12px";
      el.style.borderRadius = "8px";
      el.style.zIndex = 9999;
      document.body.appendChild(el);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        el.remove();
      }, 2500);
    } else {
      // Sticky - show as alert until user closes
      alert(msg);
    }
  }

  // Bind UI Events - Set up all user interactions
  function bindUI() {
    // Theme Toggle - Switch between light and dark
    themeToggle.addEventListener("change", (e) => {
      const dark = e.target.checked;
      settings.theme = dark ? "dark" : "light";
      try {
        localStorage.setItem("clock_theme", settings.theme);
      } catch (err) {}
      // Apply theme right away
      if (settings.theme === "dark")
        document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      saveSettings();
    });

    // Time Format - Toggle between 12 and 24-hour format
    formatToggle.addEventListener("click", () => {
      settings.format24 = !settings.format24;
      formatToggle.setAttribute("aria-pressed", String(!settings.format24));
      saveSettings();
    });

    // Timezone Select - Change displayed timezone
    tzSelect.addEventListener("change", () => {
      const tz = tzSelect.value;
      settings.timezone = tz;
      tzLabel.textContent = (
        TZ_PRESETS.find((p) => p.id === tz) || { label: tz }
      ).label;
      saveSettings();
    });

    // View Mode - Switch between digital+analog or minimal display
    viewModeSelect.addEventListener("change", () => {
      settings.viewMode = viewModeSelect.value;
      if (settings.viewMode === "minimal") appEl.classList.add("minimal");
      else appEl.classList.remove("minimal");
      saveSettings();
    });

    // Alarm Buttons - Set or clear alarm
    setAlarmBtn.addEventListener("click", () => {
      setAlarmFromInput();
    });
    clearAlarmBtn.addEventListener("click", () => {
      clearAlarm();
    });

    // Alarm Controls - Snooze or stop active alarm
    snoozeBtn.addEventListener("click", () => snoozeAlarm());
    stopBtn.addEventListener("click", () => stopAlarm());

    // Keyboard Shortcut - Escape key clears alarm time input
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Clear input if focused
        if (document.activeElement === alarmTimeInput)
          alarmTimeInput.value = "";
      }
    });

    // Page Visibility - Update clock immediately when page becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateTime();
    });

    // Click to Stop - User can click alarm alert to stop it
    alarmStateEl.addEventListener("click", () => stopAlarm());
  }

  // Render Ticks - Draw 60 tick marks on analog clock (every 6 degrees)
  function renderTicks() {
    ticksContainer.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const angle = i * 6;
      const len = i % 5 === 0 ? 6 : 3; // Longer marks every 5 minutes
      // Rotate line to show around clock
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "-44");
      line.setAttribute("x2", "0");
      line.setAttribute("y2", String(-44 + len));
      line.setAttribute("class", "tick");
      line.setAttribute("transform", `rotate(${angle})`);
      ticksContainer.appendChild(line);
    }
  }

  // Initialize App - Set up all components on page load
  function init() {
    loadSettings();
    populateTimezoneSelect();
    applySettingsToUI();
    bindUI();
    renderTicks();
    // First clock update
    updateTime();
  }

  // Start the app
  init();

  // Debug API - Exposed for testing in browser console
  window._clock = {
    settings,
    start: () => updateTime(),
    stop: () => {
      if (nextTickTimer) clearTimeout(nextTickTimer);
    },
    evaluateParts: getPartsForZone,
  };
})();
