const UI = (() => {
  let nextTickTimer = null;

  function populateTimezoneSelect() {
    const tzSelect = document.getElementById("tzSelect");
    tzSelect.innerHTML = "";
    Utils.TZ_PRESETS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      tzSelect.appendChild(opt);
    });
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (guessed && !Utils.TZ_PRESETS.some((p) => p.id === guessed)) {
      const o = document.createElement("option");
      o.value = guessed;
      o.textContent = guessed;
      tzSelect.appendChild(o);
    }
  }

  function applySettingsToUI(settings) {
    const themeToggle = document.getElementById("themeToggle");
    const formatToggle = document.getElementById("formatToggle");
    const tzSelect = document.getElementById("tzSelect");
    const tzLabel = document.getElementById("tzLabel");
    const viewModeSelect = document.getElementById("viewMode");
    const alarmTimeInput = document.getElementById("alarmTime");
    const appEl = document.querySelector(".app");

    Theme.applyTheme(settings.theme);
    formatToggle.setAttribute("aria-pressed", String(!settings.format24));
    formatToggle.dataset.format24 = settings.format24 ? "1" : "0";

    if (
      Utils.TZ_PRESETS.some((p) => p.id === settings.timezone) ||
      settings.timezone
    ) {
      tzSelect.value = settings.timezone;
    } else {
      tzSelect.value = "local";
      settings.timezone = "local";
    }
    tzLabel.textContent = Utils.getTzLabel(settings.timezone);

    viewModeSelect.value = settings.viewMode || "digital";
    if (settings.viewMode === "minimal") appEl.classList.add("minimal");
    else appEl.classList.remove("minimal");

    alarmTimeInput.value = settings.alarmTime || "";
  }

  function updateTime(parts, settings) {
    const timeDisplay = document.getElementById("timeDisplay");
    const dateDisplay = document.getElementById("dateDisplay");
    const tzLabel = document.getElementById("tzLabel");

    const tf = Utils.formatTimeFromParts(parts, settings.format24);
    timeDisplay.textContent = settings.format24
      ? `${parts.hour}:${parts.minute}:${parts.second}`
      : `${tf.timeStr} ${tf.ampm}`;
    dateDisplay.textContent = Utils.formatDateFromParts(parts);
    tzLabel.textContent = Utils.getTzLabel(settings.timezone);

    updateAnalogHands(parts);
    scheduleNextTick();
  }

  function updateAnalogHands(parts) {
    const hourHand = document.getElementById("hourHand");
    const minuteHand = document.getElementById("minuteHand");
    const secondHand = document.getElementById("secondHand");

    const h = parseInt(parts.hour, 10);
    const m = parseInt(parts.minute, 10);
    const s = parseInt(parts.second, 10);

    const hourAngle = ((h % 12) + m / 60) * 30;
    const minuteAngle = (m + s / 60) * 6;
    const secondAngle = s * 6;

    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    secondHand.style.transform = `rotate(${secondAngle}deg)`;
  }

  function scheduleNextTick(callback) {
    if (nextTickTimer) clearTimeout(nextTickTimer);
    const now = Date.now();
    const delay = 1000 - (now % 1000) + 5;
    nextTickTimer = setTimeout(callback, delay);
  }

  function renderTicks() {
    const ticksContainer = document.getElementById("ticks");
    ticksContainer.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const angle = i * 6;
      const len = i % 5 === 0 ? 6 : 3;
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

  function showToast(msg, sticky = false) {
    if (!sticky) {
      const el = document.createElement("div");
      el.textContent = msg;
      el.style.position = "fixed";
      el.style.bottom = "18px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.background = "rgba(6, 10, 25, 0.9)";
      el.style.color = "white";
      el.style.padding = "8px 12px";
      el.style.borderRadius = "8px";
      el.style.zIndex = 9999;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    } else {
      alert(msg);
    }
  }

  function stopTickTimer() {
    if (nextTickTimer) clearTimeout(nextTickTimer);
  }

  return {
    populateTimezoneSelect,
    applySettingsToUI,
    updateTime,
    updateAnalogHands,
    scheduleNextTick,
    renderTicks,
    showToast,
    stopTickTimer,
  };
})();
