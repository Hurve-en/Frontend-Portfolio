/* clock.js
   Digital Clock with timezone support, 12/24 toggle, Analog view, Alarm (stop/snooze),
   theme persistence, and accessible updates.

   Structure:
     - IIFE wraps everything to avoid globals.
     - Settings persisted to localStorage: format24, timezone, viewMode, theme, alarmTime.
     - Time display uses Intl.DateTimeFormat.formatToParts with timeZone option to extract parts robustly.
     - Alarm compares HH:MM in the chosen timezone every second; supports next-day behavior.
     - Audio beep via Web Audio API. If unavailable/blocked, falls back to <audio> or shows enable-sound notification.

   Note on timezone: We obtain timezone-local hour/min/sec via formatToParts for the chosen zone.
   This means we avoid creating Dates in arbitrary timezones; instead we use the runtime (UTC epoch)
   and ask Intl to tell us the components in that zone for the current instant.
*/

(function () {
  // ---------- DOM refs ----------
  const timeDisplay = document.getElementById('timeDisplay');
  const dateDisplay = document.getElementById('dateDisplay');
  const tzSelect = document.getElementById('tzSelect');
  const tzLabel = document.getElementById('tzLabel');
  const themeToggle = document.getElementById('themeToggle');
  const formatToggle = document.getElementById('formatToggle');
  const viewModeSelect = document.getElementById('viewMode');
  const analogWrap = document.getElementById('analogWrap');
  const alarmTimeInput = document.getElementById('alarmTime');
  const setAlarmBtn = document.getElementById('setAlarm');
  const clearAlarmBtn = document.getElementById('clearAlarm');
  const alarmStateEl = document.getElementById('alarmState');
  const snoozeBtn = document.getElementById('snoozeBtn');
  const stopBtn = document.getElementById('stopBtn');
  const appEl = document.querySelector('.app');
  const beepSample = document.getElementById('beepSample');

  // Analog hands
  const hourHand = document.getElementById('hourHand');
  const minuteHand = document.getElementById('minuteHand');
  const secondHand = document.getElementById('secondHand');
  const ticksContainer = document.getElementById('ticks');

  // ---------- Presets & defaults ----------
  const TZ_PRESETS = [
    { id: 'local', label: 'Local' },
    { id: 'UTC', label: 'UTC' },
    { id: 'America/New_York', label: 'New York' },
    { id: 'Europe/London', label: 'London' },
    { id: 'Asia/Tokyo', label: 'Tokyo' }
  ];

  const LS_KEY = 'clock_settings_v1';
  const DEFAULTS = {
    format24: false,
    timezone: 'local',
    viewMode: 'digital',
    theme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
    alarmTime: '', // 'HH:MM'
  };

  // ---------- Runtime state ----------
  let settings = {};
  let alarmActive = false;
  let alarmTriggered = false;
  let snoozeUntil = null; // epoch ms or null
  let audioEnabled = true;
  let audioCtx = null;
  let beepNode = null;

  // Keep track of last alarm day to avoid multiple triggers within same minute.
  let lastAlarmTriggerKey = null;

  // ---------- Utilities: localStorage ----------
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
    } catch (e) { /* ignore storage errors */ }
  }

  // ---------- Setup initial UI values ----------
  function populateTimezoneSelect() {
    tzSelect.innerHTML = '';
    TZ_PRESETS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      tzSelect.appendChild(opt);
    });
    // allow manual entry: also include browser's Intl timeZone (if available)
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (guessed && !TZ_PRESETS.some(p => p.id === guessed)) {
      const o = document.createElement('option');
      o.value = guessed;
      o.textContent = guessed;
      tzSelect.appendChild(o);
    }
  }

  function applySettingsToUI() {
    themeToggle.checked = (settings.theme === 'dark');
    if (settings.theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.removeAttribute('data-theme');

    formatToggle.setAttribute('aria-pressed', String(!settings.format24));
    formatToggle.dataset.format24 = settings.format24 ? '1' : '0';

    if (TZ_PRESETS.some(p => p.id === settings.timezone) || settings.timezone) {
      tzSelect.value = settings.timezone;
    } else {
      tzSelect.value = 'local';
      settings.timezone = 'local';
    }
    tzLabel.textContent = (TZ_PRESETS.find(p=>p.id===settings.timezone) || {label:settings.timezone}).label;

    viewModeSelect.value = settings.viewMode || 'digital';
    if (settings.viewMode === 'minimal') appEl.classList.add('minimal'); else appEl.classList.remove('minimal');

    alarmTimeInput.value = settings.alarmTime || '';
  }

  // ---------- Time / timezone helpers ----------
  // Get date-time parts for a given instant and timezone using Intl.formatToParts
  function getPartsForZone(date = new Date(), timeZone = 'local') {
    // if 'local', use default locale (no timeZone option) to get local parts
    const opts = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' };
    const parts = (timeZone === 'local') ?
      new Intl.DateTimeFormat([], opts).formatToParts(date) :
      new Intl.DateTimeFormat('en-US', Object.assign({}, opts, { timeZone })).formatToParts(date);

    // convert parts to an object for quick lookup
    const out = {};
    parts.forEach(p => { out[p.type] = p.value; });
    return out;
  }

  // Format time string given parts and current format setting
  function formatTimeFromParts(parts) {
    // parts.hour is 00..23 string
    const h24 = parseInt(parts.hour, 10);
    let displayHour = h24;
    let ampm = '';
    if (!settings.format24) {
      ampm = (h24 >= 12) ? 'PM' : 'AM';
      displayHour = h24 % 12;
      if (displayHour === 0) displayHour = 12;
    }
    const hh = String(displayHour).padStart(2, '0');
    const mm = String(parts.minute || '00').padStart(2, '0');
    const ss = String(parts.second || '00').padStart(2, '0');
    return { timeStr: `${hh}:${mm}:${ss}`, ampm };
  }

  // Build date string: Weekday, Month Day, Year
  function formatDateFromParts(parts) {
    const wk = parts.weekday || '';
    const mon = parts.month || '';
    const day = parts.day || '';
    const yr = parts.year || '';
    return `${wk}, ${mon} ${day}, ${yr}`;
  }

  // ---------- Alarm logic ----------
  // Determine whether the alarm should fire at the current moment.
  // Uses timezone-local hour/minute. Snooze overrides alarm firing until snoozeUntil epoch time.
  function checkAndTriggerAlarm(parts) {
    const alarmSet = settings.alarmTime && settings.alarmTime.length === 5;
    if (!alarmSet) return;

    // If snoozed, only trigger if now >= snoozeUntil
    if (snoozeUntil && Date.now() < snoozeUntil) return;

    const [ah, am] = settings.alarmTime.split(':').map(x => parseInt(x, 10));
    const curH = parseInt(parts.hour, 10);
    const curM = parseInt(parts.minute, 10);

    // create a key representing current day and alarm minute to prevent repeated triggers during same minute
    const todayKey = `${parts.year}-${parts.month}-${parts.day}-${String(ah).padStart(2,'0')}:${String(am).padStart(2,'0')}`;

    // compute if alarm time equals current hour and minute
    if (ah === curH && am === curM) {
      // if it hasn't already triggered for this exact key, trigger
      if (lastAlarmTriggerKey !== todayKey) {
        triggerAlarm();
        lastAlarmTriggerKey = todayKey;
      }
    } else {
      // reset lastAlarmTriggerKey if time moved past minute
      // (ensures next-day behavior when minutes match again)
      // If alarm is in the past for the same day, we'll handle by matching next day when equal.
    }
  }

  // Start alarm visual state and audio beep
  function triggerAlarm() {
    alarmTriggered = true;
    alarmStateEl.hidden = false;
    // start beep
    startBeep();
    // ensure focus for accessibility
    alarmStateEl.querySelector('.alarm-message').focus?.();
  }

  // Stop alarm and clear visual state
  function stopAlarm() {
    alarmTriggered = false;
    alarmStateEl.hidden = true;
    stopBeep();
    snoozeUntil = null;
  }

  // Snooze: pause alarm for 5 minutes from now (system time)
  function snoozeAlarm() {
    stopBeep();
    alarmTriggered = false;
    alarmStateEl.hidden = true;
    snoozeUntil = Date.now() + 5 * 60 * 1000;
  }

  // Set or clear alarm
  function setAlarmFromInput() {
    const val = alarmTimeInput.value; // 'HH:MM' or ''
    settings.alarmTime = val;
    saveSettings();
    if (val) {
      // user sets alarm for chosen HH:MM; will trigger when timezone-local HH:MM matches
      // if that time is in the past for today, the comparison logic ensures next-day trigger
      showToast(`Alarm set for ${val}`);
    } else {
      showToast('Alarm cleared');
    }
  }

  function clearAlarm() {
    settings.alarmTime = '';
    saveSettings();
    alarmTimeInput.value = '';
    stopAlarm();
  }

  // ---------- Audio beep (Web Audio API with fallback) ----------
  function startBeep() {
    // try Web Audio API
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // simple oscillator beep repeated via interval
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880; // A5
      g.gain.value = 0.0001; // start very quiet to avoid autoplay issues
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();

      // ramp up quickly (user gesture likely required in some browsers)
      g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);

      beepNode = { oscillator: o, gain: g };
      // continue beep until stopBeep
    } catch (e) {
      // fallback to <audio> element
      try {
        beepSample.play().catch(err => {
          // autoplay blocked: notify user to interact
          showToast('Audio blocked by browser. Interact to enable alarm sound.', true);
        });
      } catch (err) {
        // ignore
      }
    }
  }

  function stopBeep() {
    try {
      if (beepNode && beepNode.oscillator) {
        beepNode.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);
        beepNode.oscillator.stop(audioCtx.currentTime + 0.03);
        beepNode = null;
      }
    } catch (e) {}
    try { beepSample.pause(); beepSample.currentTime = 0; } catch (e) {}
  }

  // ---------- Rendering / update loop ----------
  function updateTime() {
    const now = new Date();
    // determine timezone to use
    const tz = settings.timezone === 'local' ? 'local' : settings.timezone;

    // parts holds strings for hour/minute/second/day/month/year/weekday
    const parts = getPartsForZone(now, tz);

    // update textual time and date
    const tf = formatTimeFromParts(parts);
    timeDisplay.textContent = (settings.format24) ? `${parts.hour}:${parts.minute}:${parts.second}` : `${tf.timeStr} ${tf.ampm}`;
    dateDisplay.textContent = formatDateFromParts(parts);
    tzLabel.textContent = (TZ_PRESETS.find(p => p.id === settings.timezone) || { label: settings.timezone }).label;

    // analog hands rotation
    updateAnalogHands(parts);

    // check alarm
    if (settings.alarmTime) {
      checkAndTriggerAlarm(parts);
    }

    // ensure we remain in sync (use next tick via setTimeout to align to next second)
    scheduleNextTick();
  }

  // align next tick to top of next second to avoid drift
  let nextTickTimer = null;
  function scheduleNextTick() {
    if (nextTickTimer) clearTimeout(nextTickTimer);
    const now = Date.now();
    const delay = 1000 - (now % 1000) + 5; // small offset
    nextTickTimer = setTimeout(updateTime, delay);
  }

  // Update analog hands angle using parts (strings)
  function updateAnalogHands(parts) {
    // compute numeric values
    const h = parseInt(parts.hour, 10);
    const m = parseInt(parts.minute, 10);
    const s = parseInt(parts.second, 10);

    // angles: hour = (h % 12 + m/60)*30
    const hourAngle = ((h % 12) + m / 60) * 30;
    const minuteAngle = (m + s / 60) * 6;
    const secondAngle = s * 6;

    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    secondHand.style.transform = `rotate(${secondAngle}deg)`;
  }

  // ---------- Helper: format/get parts ----------
  function getPartsForZone(date, timeZone) {
    const opts = {
      hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      day: '2-digit', month: 'long', year: 'numeric', weekday: 'long'
    };
    try {
      const dtf = (timeZone === 'local') ? new Intl.DateTimeFormat([], opts) : new Intl.DateTimeFormat('en-US', Object.assign({}, opts, { timeZone }));
      const parts = dtf.formatToParts(date);
      const out = {};
      parts.forEach(p => out[p.type] = p.value);
      // some locales produce non-numeric digits; ensure numeric hour/min are ASCII digits
      if (out.hour) out.hour = out.hour.replace(/[^\d]/g, '').padStart(2,'0');
      if (out.minute) out.minute = out.minute.replace(/[^\d]/g, '').padStart(2,'0');
      if (out.second) out.second = out.second.replace(/[^\d]/g, '').padStart(2,'0');
      return out;
    } catch (e) {
      // fallback: return local parts
      const local = new Intl.DateTimeFormat([], opts).formatToParts(date);
      const out = {}; local.forEach(p => out[p.type] = p.value);
      return out;
    }
  }

  function formatTimeFromParts(parts) {
    const h24 = parseInt(parts.hour || '0', 10);
    let displayHour = h24;
    let ampm = '';
    if (!settings.format24) {
      ampm = (h24 >= 12) ? 'PM' : 'AM';
      displayHour = h24 % 12;
      if (displayHour === 0) displayHour = 12;
    }
    const hh = String(displayHour).padStart(2, '0');
    const mm = String(parts.minute || '00').padStart(2, '0');
    const ss = String(parts.second || '00').padStart(2, '0');
    return { timeStr: `${hh}:${mm}:${ss}`, ampm };
  }

  function formatDateFromParts(parts) {
    const wk = parts.weekday || '';
    const mon = parts.month || '';
    const day = parts.day || '';
    const yr = parts.year || '';
    return `${wk}, ${mon} ${day}, ${yr}`;
  }

  // ---------- Small utility: toasts / notifications ----------
  let toastTimer = null;
  function showToast(msg, sticky = false) {
    // simple use alert for now to avoid extra markup; non-blocking toast could be added
    if (!sticky) {
      // transient: small overlay
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.position = 'fixed';
      el.style.bottom = '18px';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(6,10,25,0.9)';
      el.style.color = 'white';
      el.style.padding = '8px 12px';
      el.style.borderRadius = '8px';
      el.style.zIndex = 9999;
      document.body.appendChild(el);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.remove(); }, 2500);
    } else {
      alert(msg);
    }
  }

  // ---------- Events: UI binding ----------
  function bindUI() {
    // theme toggle
    themeToggle.addEventListener('change', (e) => {
      const dark = e.target.checked;
      settings.theme = dark ? 'dark' : 'light';
      try { localStorage.setItem('clock_theme', settings.theme); } catch (err) {}
      // apply immediately
      if (settings.theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
      else document.documentElement.removeAttribute('data-theme');
      saveSettings();
    });

    // format toggle: toggles 12/24 preference
    formatToggle.addEventListener('click', () => {
      settings.format24 = !settings.format24;
      formatToggle.setAttribute('aria-pressed', String(!settings.format24));
      saveSettings();
    });

    // timezone select change
    tzSelect.addEventListener('change', () => {
      const tz = tzSelect.value;
      settings.timezone = tz;
      tzLabel.textContent = (TZ_PRESETS.find(p => p.id === tz) || { label: tz }).label;
      saveSettings();
    });

    // view mode select (digital vs minimal)
    viewModeSelect.addEventListener('change', () => {
      settings.viewMode = viewModeSelect.value;
      if (settings.viewMode === 'minimal') appEl.classList.add('minimal'); else appEl.classList.remove('minimal');
      saveSettings();
    });

    // set/clear alarm
    setAlarmBtn.addEventListener('click', () => { setAlarmFromInput(); });
    clearAlarmBtn.addEventListener('click', () => { clearAlarm(); });

    // snooze & stop
    snoozeBtn.addEventListener('click', () => snoozeAlarm());
    stopBtn.addEventListener('click', () => stopAlarm());

    // keyboard accessibility: Escape to clear input
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // if focus in time input, clear it
        if (document.activeElement === alarmTimeInput) alarmTimeInput.value = '';
      }
    });

    // page visibility: when page becomes visible, update immediately to keep accurate
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateTime();
    });

    // allow user to click alarm state to stop
    alarmStateEl.addEventListener('click', () => stopAlarm());
  }

  // ---------- analog ticks initial render ----------
  function renderTicks() {
    ticksContainer.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const angle = i * 6;
      const len = (i % 5 === 0) ? 6 : 3;
      const x1 = 0;
      const y1 = -44;
      // rotate via transform
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '-44');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', String(-44 + len));
      line.setAttribute('class', 'tick');
      line.setAttribute('transform', `rotate(${angle})`);
      ticksContainer.appendChild(line);
    }
  }

  // ---------- init ----------
  function init() {
    loadSettings();
    populateTimezoneSelect();
    applySettingsToUI();
    bindUI();
    renderTicks();
    // initial immediate update
    updateTime();
  }

  // Kick off
  init();

  // Expose minimal API for debugging
  window._clock = {
    settings,
    start: () => updateTime(),
    stop: () => { if (nextTickTimer) clearTimeout(nextTickTimer); },
    evaluateParts: getPartsForZone
  };
})();
