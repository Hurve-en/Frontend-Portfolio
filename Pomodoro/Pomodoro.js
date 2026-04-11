// This file controls the app's behavior and user interactions.

/* Pomodoro Timer App - JavaScript Code
   Features:
   - Timer that can start, pause, and reset
   - Circular progress bar
   - Settings window with saved options
   - Task list that saves tasks
   - Daily counter for completed sessions
   - Soft sound when timer finishes
*/

/* ===== Helper Functions and Data ===== */
const LS_KEY = "vibe-pomodoro-v1";

// Default config
const defaults = {
  settings: { focus: 25, short: 5, long: 15, autoReset: true, theme: "dark" },
  tasks: [],
  daily: { date: todayKey(), done: 0 },
};

let state = loadState();
let timer = {
  mode: "focus", // 'focus' | 'short' | 'long'
  duration: seconds(state.settings.focus * 60),
  remaining: seconds(state.settings.focus * 60),
  running: false,
  interval: null,
};

// DOM references
const timeDisplay = document.getElementById("time-display");
const labelDisplay = document.getElementById("session-label");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const tabs = document.querySelectorAll(".session-tabs .tab");
const ring = document.querySelector(".progress-ring .ring");
const counterDone = document.getElementById("counter-done");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskProgress = document.getElementById("task-progress");
const settingsModal = document.getElementById("settings-modal");
const openSettingsBtn = document.getElementById("open-settings");
const closeSettingsBtn = document.getElementById("close-settings");
const saveSettingsBtn = document.getElementById("save-settings");
const settingFocus = document.getElementById("setting-focus");
const settingShort = document.getElementById("setting-short");
const settingLong = document.getElementById("setting-long");
const settingAuto = document.getElementById("setting-auto");
const modeToggle = document.getElementById("mode-toggle");
const addPomodoroBtn = document.getElementById("add-pomodoro");
const clearCompletedBtn = document.getElementById("clear-completed");

// audio context for chime
let audioCtx = null;

/* ===== Setup ===== */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  restoreSettingsUI();
  attachEventHandlers();
  renderTasks();
  updateDailyCounterUI();
  updateTaskProgressUI();
  setMode(timer.mode, false); // initialize UI
  drawRing(); // set initial circle dashoffset
});

/* ===== Data Storage ===== */
function loadState() {
  // Load saved data from browser storage, or use default values
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(defaults));
      return JSON.parse(JSON.stringify(defaults));
    }
    const parsed = JSON.parse(raw);

    // validate & fill defaults
    parsed.settings = Object.assign(
      {},
      defaults.settings,
      parsed.settings || {},
    );
    parsed.tasks = parsed.tasks || [];
    // daily reset if date changed
    const today = todayKey();
    if (!parsed.daily || parsed.daily.date !== today) {
      parsed.daily = { date: today, done: 0 };
    }
    return parsed;
  } catch (e) {
    console.error("Load state failed", e);
    localStorage.setItem(LS_KEY, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }
}

function saveState() {
  // Save current data to browser storage
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Save failed", e);
  }
}

/* ===== Timer Helper Functions ===== */
function seconds(n) {
  return Math.round(n);
}
function formatTime(s) {
  // Convert seconds to MM:SS format
  s = Math.max(0, Math.floor(s));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
function todayKey() {
  // Get today's date as a string for daily counter
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ===== Timer Main Functions ===== */
function setMode(mode, resetRemaining = true) {
  // Change the current timer mode (focus, short break, long break)
  timer.mode = mode;
  // choose duration from settings
  const min =
    mode === "focus"
      ? state.settings.focus
      : mode === "short"
        ? state.settings.short
        : state.settings.long;
  timer.duration = min * 60;
  if (resetRemaining) timer.remaining = timer.duration;
  updateTimerUI();
  // update active tab
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  labelDisplay.textContent =
    mode === "focus"
      ? "Focus"
      : mode === "short"
        ? "Short Break"
        : "Long Break";
  drawRing();
}

function updateTimerUI() {
  // Update the displayed time and button states
  timeDisplay.textContent = formatTime(timer.remaining);
  // enable/disable buttons
  startBtn.disabled = timer.running;
  pauseBtn.disabled = !timer.running;
  resetBtn.disabled = !timer.running && timer.remaining === timer.duration;
  // set aria-labels
  startBtn.setAttribute("aria-pressed", String(timer.running));
}

function startTimer() {
  // Start the countdown timer
  if (timer.running) return;
  timer.running = true;
  const startAt = Date.now();
  const endAt = startAt + timer.remaining * 1000;

  timer.interval = setInterval(() => {
    const now = Date.now();
    timer.remaining = Math.max(0, Math.round((endAt - now) / 1000));
    updateTimerUI();
    drawRing();
    if (timer.remaining <= 0) {
      stopTimer();
      onTimerEnd();
    }
  }, 250);

  updateTimerUI();
}

function pauseTimer() {
  // Pause the running timer
  if (!timer.running) return;
  timer.running = false;
  clearInterval(timer.interval);
  timer.interval = null;
  updateTimerUI();
}

function stopTimer() {
  // Stop the timer completely
  timer.running = false;
  if (timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
  }
  timer.remaining = 0;
  updateTimerUI();
}

function resetTimer() {
  // Reset timer to full duration
  pauseTimer();
  timer.remaining = timer.duration;
  updateTimerUI();
  drawRing();
}

function onTimerEnd() {
  // Handle what happens when timer reaches zero
  playChime();
  // if focus finished => count as pomodoro done
  if (timer.mode === "focus") {
    state.daily.done = (state.daily.done || 0) + 1;
    saveStateLocal();
    updateDailyCounterUI();
  }
  // auto behavior
  if (state.settings.autoReset) {
    // If focus -> go to short, if short -> focus, if long -> focus
    if (timer.mode === "focus") setMode("short");
    else setMode("focus");
    // auto-start next? keep paused to give user control — design choice
    // startTimer(); // optional: auto-start next session
  } else {
    // leave at finished (0) and let user choose
  }
}

/* ===== Progress Circle Drawing ===== */
function drawRing() {
  // Draw the circular progress bar using SVG
  // ring is an SVG circle r=48 -> circumference = 2πr
  const r = 48;
  const c = 2 * Math.PI * r;
  const progress = timer.duration === 0 ? 0 : timer.remaining / timer.duration;
  const offset = c * (1 - progress);
  if (ring) {
    ring.style.strokeDasharray = `${c} ${c}`;
    ring.style.strokeDashoffset = offset;
    // subtle color change for mode
    if (timer.mode === "focus") ring.style.stroke = "url(#grad)"; // fallback
    if (timer.mode === "focus") ring.style.stroke = "url(#)"; // not used; keep static color via CSS
  }
  timeDisplay.textContent = formatTime(timer.remaining);
}

/* ===== Button and Event Setup ===== */
function attachEventHandlers() {
  // Connect buttons to their actions
  // Start / pause / reset
  startBtn?.addEventListener("click", () => {
    startTimer();
  });
  pauseBtn?.addEventListener("click", () => {
    pauseTimer();
  });
  resetBtn?.addEventListener("click", () => {
    resetTimer();
  });

  // Tabs
  tabs.forEach((t) =>
    t.addEventListener("click", (e) => {
      const mode = t.dataset.mode;
      setMode(mode, true);
    }),
  );

  // Open/close settings
  openSettingsBtn?.addEventListener("click", () => {
    openSettings();
  });
  closeSettingsBtn?.addEventListener("click", () => {
    closeSettings();
  });
  saveSettingsBtn?.addEventListener("click", (ev) => {
    ev.preventDefault();
    saveSettingsFromUI();
    closeSettings();
  });

  // settings modal background close (click outside)
  settingsModal?.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  // Task form submit
  taskForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    addTask(text);
    taskInput.value = "";
  });

  // quick add pomodoro
  addPomodoroBtn?.addEventListener("click", () => {
    state.daily.done = (state.daily.done || 0) + 1;
    saveStateLocal();
    updateDailyCounterUI();
  });

  // clear completed tasks
  clearCompletedBtn?.addEventListener("click", () => {
    state.tasks = state.tasks.filter((t) => !t.done);
    saveStateLocal();
    renderTasks();
  });

  // theme toggle
  modeToggle?.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveStateLocal();
  });

  // quick-mode radio buttons
  document.querySelectorAll('input[name="quick-mode"]').forEach((node) => {
    node.addEventListener("change", (e) => {
      setMode(e.target.value, true);
    });
  });
}

/* ===== Task Management ===== */
function addTask(text) {
  // Add a new task to the list
  const task = {
    id: "t_" + Date.now().toString(36),
    text,
    done: false,
    created: Date.now(),
  };
  state.tasks.unshift(task);
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function toggleTaskDone(id) {
  // Mark a task as done or not done
  const t = state.tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function removeTask(id) {
  // Remove a task from the list
  state.tasks = state.tasks.filter((x) => x.id !== id);
  saveStateLocal();
  renderTasks();
  updateTaskProgressUI();
}

function renderTasks() {
  // Display the task list on the page
  if (!taskList) return;
  taskList.innerHTML = "";
  state.tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-item" + (t.done ? " done" : "");
    li.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} aria-label="Mark done" />
      <div style="flex:1">${escapeHtml(t.text)}</div>
      <button class="btn small remove">✕</button>
    `;
    const checkbox = li.querySelector("input[type=checkbox]");
    checkbox.addEventListener("change", () => toggleTaskDone(t.id));
    li.querySelector(".remove").addEventListener("click", () =>
      removeTask(t.id),
    );
    taskList.appendChild(li);
  });
}

/* ===== Settings Window ===== */
function openSettings() {
  // Show the settings window
  restoreSettingsUI();
  settingsModal.classList.remove("hidden");
}
function closeSettings() {
  // Hide the settings window
  settingsModal.classList.add("hidden");
}
function restoreSettingsUI() {
  // Fill the settings form with current values
  settingFocus.value = state.settings.focus;
  settingShort.value = state.settings.short;
  settingLong.value = state.settings.long;
  settingAuto.checked = !!state.settings.autoReset;
}
function saveSettingsFromUI() {
  // Save the settings from the form
  const f = Math.max(1, parseInt(settingFocus.value || 25));
  const s = Math.max(1, parseInt(settingShort.value || 5));
  const l = Math.max(1, parseInt(settingLong.value || 15));
  state.settings.focus = f;
  state.settings.short = s;
  state.settings.long = l;
  state.settings.autoReset = !!settingAuto.checked;
  saveStateLocal();
  // Update timer durations if current mode matches
  setMode(timer.mode, true);
}

/* ===== Display Updates ===== */
function updateDailyCounterUI() {
  // Update the daily pomodoro count display
  counterDone.textContent = state.daily?.done || 0;
}

function updateTaskProgressUI() {
  // Update the task completion percentage
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  taskProgress.textContent = pct + "%";
}

/* ===== Data Saving Helper ===== */
function saveStateLocal() {
  // Save data and update displays
  saveState(); // helper wrapper
  // slight wrapper to update UI
  saveState();
}
function saveState() {
  saveStateCore();
}
function saveStateCore() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed saving state", e);
  }
}

/* ===== Sound Effect ===== */
function playChime() {
  // Play a soft sound when timer ends
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime); // A5
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.warn("Audio failed", e);
  }
}

/* ===== Utility Functions ===== */
function escapeHtml(str) {
  // Prevent HTML injection in text
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

/* ===== Theme Setup ===== */
function applyTheme() {
  // Apply light or dark theme to the page
  const root = document.documentElement;
  const theme = state.settings.theme || "dark";
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  modeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
}

/* ===== Daily Counter Reset ===== */
function updateDailyIfNeeded() {
  // Reset daily counter if it's a new day
  const today = todayKey();
  if (!state.daily || state.daily.date !== today) {
    state.daily = { date: today, done: 0 };
    saveStateCore();
  }
}
updateDailyIfNeeded();

/* ===== small safety: handle unload ===== */
window.addEventListener("beforeunload", () => {
  // store current remaining/duration into state (optional)
  saveStateCore();
});
