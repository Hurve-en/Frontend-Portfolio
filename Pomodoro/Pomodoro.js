// Pomodoro Timer - Professional Edition
// Enhanced with task management, statistics, focus mode, and analytics

/* ============================================
   CONSTANTS & INITIALIZATION
   ============================================ */
const LS_KEY = "pomodoro-pro-v2";
const MODES = {
  FOCUS: "focus",
  SHORT_BREAK: "short",
  LONG_BREAK: "long",
};

const DEFAULT_STATE = {
  settings: {
    focus: 25,
    short: 5,
    long: 15,
    autoReset: true,
    soundEnabled: true,
    theme: "dark",
  },
  tasks: [],
  sessions: [], // array of session records
  daily: { date: getTodayDate(), sessionsCompleted: 0, focusMinutes: 0 },
};

/* ============================================
   STATE MANAGEMENT
   ============================================ */
let appState = loadAppState();
let timerState = {
  mode: MODES.FOCUS,
  duration: 0,
  remaining: 0,
  running: false,
  interval: null,
  startTime: null,
  pausedTime: 0,
  sessionStartedAt: null,
};

/* ============================================
   DOM ELEMENT CACHING
   ============================================ */
const DOM = {
  // Timer Display
  timeDisplay: document.getElementById("time-display"),
  sessionLabel: document.getElementById("session-label"),

  // Controls
  startBtn: document.getElementById("start-btn"),
  pauseBtn: document.getElementById("pause-btn"),
  resetBtn: document.getElementById("reset-btn"),

  // Tabs
  tabs: document.querySelectorAll(".tab"),

  // Stats
  sessionsToday: document.getElementById("sessions-today"),
  minutesToday: document.getElementById("minutes-today"),
  tasksProgress: document.getElementById("tasks-progress"),

  // Task Management
  taskForm: document.getElementById("task-form"),
  taskInput: document.getElementById("task-input"),
  taskList: document.getElementById("task-list"),
  emptyTasks: document.getElementById("empty-tasks"),
  clearTasksBtn: document.getElementById("clear-tasks-btn"),

  // Settings Modal
  settingsModal: document.getElementById("settings-modal"),
  settingsBtn: document.getElementById("settings-btn"),
  closeSettingsBtn: document.getElementById("close-settings-btn"),
  settingsCancelBtn: document.getElementById("settings-cancel-btn"),
  settingsForm: document.getElementById("settings-form"),
  focusDuration: document.getElementById("focus-duration"),
  shortBreakDuration: document.getElementById("short-break-duration"),
  longBreakDuration: document.getElementById("long-break-duration"),
  autoResetCheck: document.getElementById("auto-reset-check"),
  soundEnabledCheck: document.getElementById("sound-enabled-check"),

  // Statistics
  statsPanel: document.getElementById("stats-panel"),
  statsToggle: document.getElementById("stats-toggle"),
  statsPeriod: document.getElementById("stats-period"),
  totalSessions: document.getElementById("total-sessions"),
  totalFocusTime: document.getElementById("total-focus-time"),
  bestStreak: document.getElementById("best-streak"),
  avgSession: document.getElementById("avg-session"),
  activityChart: document.getElementById("activity-chart"),
  exportStatsBtn: document.getElementById("export-stats-btn"),
  tasksPanel: document.getElementById("tasks-panel"),

  // Focus Mode
  focusModeBtn: document.getElementById("focus-mode-btn"),
  focusOverlay: document.getElementById("focus-overlay-overlay"),
  focusTimer: document.getElementById("focus-timer"),
  focusModeLabel: document.getElementById("focus-mode-label"),
  focusPauseBtn: document.getElementById("focus-pause-btn"),
  focusExitBtn: document.getElementById("focus-exit-btn"),

  // Theme
  themeToggle: document.getElementById("theme-toggle"),

  // Progress Ring
  ring: document.querySelector(".progress-ring .ring"),
};

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  renderInitialUI();
  setupKeyboardShortcuts();
});

function initializeApp() {
  // Ensure daily record is current
  const today = getTodayDate();
  if (appState.daily.date !== today) {
    appState.daily = { date: today, sessionsCompleted: 0, focusMinutes: 0 };
  }

  // Set timer duration
  setTimerMode(MODES.FOCUS, true);
  applyTheme();
}

function renderInitialUI() {
  renderTasks();
  updateStatsDisplay();
  updateQuickStats();
  drawProgressRing();
}

/* ============================================
   LOCAL STORAGE
   ============================================ */
function loadAppState() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) {
      saveAppState(DEFAULT_STATE);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new fields
    return {
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      daily: parsed.daily || DEFAULT_STATE.daily,
    };
  } catch (e) {
    console.error("Failed to load app state:", e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveAppState(state = appState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save app state:", e);
  }
}

/* ============================================
   TIME & DATE UTILITIES
   ============================================ */
function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getWeekDates(days = 7) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dates.push(dateStr);
  }
  return dates;
}

function formatTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/* ============================================
   TIMER CONTROL
   ============================================ */
function setTimerMode(mode, shouldReset = true) {
  timerState.mode = mode;

  const durations = {
    [MODES.FOCUS]: appState.settings.focus,
    [MODES.SHORT_BREAK]: appState.settings.short,
    [MODES.LONG_BREAK]: appState.settings.long,
  };

  timerState.duration = durations[mode] * 60; // convert to seconds
  if (shouldReset) {
    timerState.remaining = timerState.duration;
    timerState.pausedTime = 0;
  }

  updateTimerDisplay();
  drawProgressRing();
  updateTabsUI();
}

function startTimer() {
  if (timerState.running) return;

  timerState.running = true;
  timerState.startTime = Date.now();
  if (!timerState.sessionStartedAt) {
    timerState.sessionStartedAt = Date.now();
  }

  timerState.interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    timerState.remaining = Math.max(
      0,
      timerState.duration - timerState.pausedTime - elapsed,
    );

    updateTimerDisplay();
    drawProgressRing();

    if (timerState.remaining <= 0) {
      completeTimer();
    }
  }, 100);

  updateControlsUI();
}

function pauseTimer() {
  if (!timerState.running) return;

  timerState.running = false;
  clearInterval(timerState.interval);
  timerState.interval = null;
  timerState.pausedTime += Math.floor(
    (Date.now() - timerState.startTime) / 1000,
  );

  updateControlsUI();
}

function resetTimer() {
  pauseTimer();
  timerState.remaining = timerState.duration;
  timerState.pausedTime = 0;
  timerState.sessionStartedAt = null;
  updateTimerDisplay();
  drawProgressRing();
  updateControlsUI();
}

function completeTimer() {
  pauseTimer();
  playNotificationSound();

  if (timerState.mode === MODES.FOCUS) {
    recordSession();
  }

  // Auto-advance if enabled
  if (appState.settings.autoReset) {
    const nextMode =
      timerState.mode === MODES.FOCUS ? MODES.SHORT_BREAK : MODES.FOCUS;
    setTimerMode(nextMode, true);
  } else {
    timerState.remaining = 0;
    updateTimerDisplay();
  }

  updateStatsDisplay();
  updateQuickStats();
}

function recordSession() {
  const duration = Math.round(timerState.duration / 60); // duration in minutes
  const session = {
    id: Date.now().toString(),
    date: getTodayDate(),
    timestamp: Date.now(),
    duration: duration,
    completed: true,
  };

  appState.sessions.push(session);
  appState.daily.sessionsCompleted += 1;
  appState.daily.focusMinutes += duration;

  saveAppState();
}

/* ============================================
   TIMER DISPLAY & UI
   ============================================ */
function updateTimerDisplay() {
  DOM.timeDisplay.textContent = formatTime(timerState.remaining);
  if (DOM.focusTimer) {
    DOM.focusTimer.textContent = formatTime(timerState.remaining);
  }
}

function updateControlsUI() {
  DOM.startBtn.disabled = timerState.running;
  DOM.pauseBtn.disabled = !timerState.running;
  DOM.resetBtn.disabled =
    !timerState.running && timerState.remaining === timerState.duration;

  DOM.startBtn.textContent = timerState.running ? "⏸ Running..." : "▶ Start";
}

function updateTabsUI() {
  DOM.tabs.forEach((tab) => {
    const isActive = tab.dataset.mode === timerState.mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });

  const labels = {
    [MODES.FOCUS]: "Focus Session",
    [MODES.SHORT_BREAK]: "Short Break",
    [MODES.LONG_BREAK]: "Long Break",
  };

  DOM.sessionLabel.textContent = labels[timerState.mode];
  if (DOM.focusModeLabel) {
    DOM.focusModeLabel.textContent = labels[timerState.mode];
  }
}

function drawProgressRing() {
  if (!DOM.ring) return;

  const circumference = 2 * Math.PI * 48; // radius = 48
  const progress =
    timerState.duration === 0 ? 0 : timerState.remaining / timerState.duration;
  const offset = circumference * (1 - progress);

  DOM.ring.style.strokeDasharray = `${circumference} ${circumference}`;
  DOM.ring.style.strokeDashoffset = offset;
}

/* ============================================
   TASK MANAGEMENT
   ============================================ */
function addTask(text) {
  if (!text || !text.trim()) return;

  const task = {
    id: `task_${Date.now()}`,
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };

  appState.tasks.unshift(task);
  saveAppState();
  renderTasks();
  updateQuickStats();
}

function toggleTask(taskId) {
  const task = appState.tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveAppState();
    renderTasks();
    updateQuickStats();
  }
}

function deleteTask(taskId) {
  appState.tasks = appState.tasks.filter((t) => t.id !== taskId);
  saveAppState();
  renderTasks();
  updateQuickStats();
}

function clearCompletedTasks() {
  appState.tasks = appState.tasks.filter((t) => !t.completed);
  saveAppState();
  renderTasks();
  updateQuickStats();
}

function renderTasks() {
  DOM.taskList.innerHTML = "";

  if (appState.tasks.length === 0) {
    DOM.emptyTasks?.classList.remove("hidden");
    return;
  }

  DOM.emptyTasks?.classList.add("hidden");

  appState.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "done" : ""}`;
    li.innerHTML = `
      <input 
        type="checkbox" 
        ${task.completed ? "checked" : ""} 
        aria-label="Mark task done"
      />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="btn-remove" aria-label="Delete task">✕</button>
    `;

    const checkbox = li.querySelector("input[type=checkbox]");
    const removeBtn = li.querySelector(".btn-remove");

    checkbox.addEventListener("change", () => toggleTask(task.id));
    removeBtn.addEventListener("click", () => deleteTask(task.id));

    DOM.taskList.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ============================================
   STATISTICS & ANALYTICS
   ============================================ */
function updateQuickStats() {
  const completedTasks = appState.tasks.filter((t) => t.completed).length;
  const totalTasks = appState.tasks.length;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  DOM.sessionsToday.textContent = appState.daily.sessionsCompleted;
  DOM.minutesToday.textContent = appState.daily.focusMinutes;
  DOM.tasksProgress.textContent = `${progress}%`;
}

function updateStatsDisplay(period = "today") {
  let stats = calculateStats(period);

  DOM.totalSessions.textContent = stats.totalSessions;
  DOM.totalFocusTime.textContent = formatDuration(stats.totalMinutes);
  DOM.bestStreak.textContent = stats.bestStreak;
  DOM.avgSession.textContent = stats.avgDuration;

  renderActivityChart(period);
}

function calculateStats(period = "today") {
  let relevantSessions = [];

  if (period === "today") {
    relevantSessions = appState.sessions.filter(
      (s) => s.date === getTodayDate(),
    );
  } else if (period === "week") {
    const weekDates = getWeekDates(7);
    relevantSessions = appState.sessions.filter((s) =>
      weekDates.includes(s.date),
    );
  } else {
    relevantSessions = appState.sessions;
  }

  const totalSessions = relevantSessions.length;
  const totalMinutes = relevantSessions.reduce((sum, s) => sum + s.duration, 0);
  const avgDuration =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) + "m" : "0m";

  // Calculate best streak (consecutive days with sessions)
  let bestStreak = 0;
  if (appState.sessions.length > 0) {
    const dates = getWeekDates(7);
    let currentStreak = 0;

    dates.forEach((date) => {
      const hasSession = appState.sessions.some((s) => s.date === date);
      if (hasSession) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
  }

  return {
    totalSessions,
    totalMinutes,
    avgDuration,
    bestStreak,
  };
}

function renderActivityChart(period = "today") {
  DOM.activityChart.innerHTML = "";

  let dates = [];
  if (period === "today") {
    dates = [getTodayDate()];
  } else if (period === "week") {
    dates = getWeekDates(7);
  } else {
    dates = getWeekDates(30);
  }

  const maxSessions = Math.max(
    ...dates.map(
      (d) => appState.sessions.filter((s) => s.date === d).length || 1,
    ),
    3,
  );

  dates.forEach((date, i) => {
    const sessionsOnDate = appState.sessions.filter(
      (s) => s.date === date,
    ).length;
    const percentage = (sessionsOnDate / maxSessions) * 100 || 5;

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(percentage, 8)}%`;
    bar.setAttribute(
      "title",
      `${date}: ${sessionsOnDate} session${sessionsOnDate !== 1 ? "s" : ""}`,
    );

    DOM.activityChart.appendChild(bar);
  });
}

function exportData() {
  const exportObj = {
    exportDate: new Date().toISOString(),
    summary: calculateStats("all"),
    sessions: appState.sessions,
    tasks: appState.tasks,
  };

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pomodoro-data-${getTodayDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ============================================
   FOCUS MODE
   ============================================ */
function toggleFocusMode() {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  if (!focusOverlay) return;

  const isHidden = focusOverlay.classList.contains("hidden");
  focusOverlay.classList.toggle("hidden", !isHidden);

  if (!isHidden && timerState.running) {
    pauseTimer();
  }
}

function exitFocusMode() {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  if (focusOverlay) {
    focusOverlay.classList.add("hidden");
  }
}

/* ============================================
   SETTINGS & PREFERENCES
   ============================================ */
function openSettings() {
  DOM.focusDuration.value = appState.settings.focus;
  DOM.shortBreakDuration.value = appState.settings.short;
  DOM.longBreakDuration.value = appState.settings.long;
  DOM.autoResetCheck.checked = appState.settings.autoReset;
  DOM.soundEnabledCheck.checked = appState.settings.soundEnabled;

  DOM.settingsModal.classList.remove("hidden");
}

function closeSettings() {
  DOM.settingsModal.classList.add("hidden");
}

function saveSettings(e) {
  e.preventDefault();

  appState.settings.focus = Math.max(
    1,
    parseInt(DOM.focusDuration.value) || 25,
  );
  appState.settings.short = Math.max(
    1,
    parseInt(DOM.shortBreakDuration.value) || 5,
  );
  appState.settings.long = Math.max(
    1,
    parseInt(DOM.longBreakDuration.value) || 15,
  );
  appState.settings.autoReset = DOM.autoResetCheck.checked;
  appState.settings.soundEnabled = DOM.soundEnabledCheck.checked;

  saveAppState();
  setTimerMode(timerState.mode, true);
  closeSettings();
}

/* ============================================
   THEME MANAGEMENT
   ============================================ */
function toggleTheme() {
  const root = document.documentElement;
  const isLight = root.classList.contains("light");
  const newTheme = isLight ? "dark" : "light";

  root.classList.toggle("light", !isLight);
  appState.settings.theme = newTheme;
  saveAppState();

  DOM.themeToggle.setAttribute("aria-pressed", !isLight);
}

function applyTheme() {
  const theme = appState.settings.theme || "dark";
  const root = document.documentElement;

  if (theme === "light") {
    root.classList.add("light");
    DOM.themeToggle?.setAttribute("aria-pressed", "true");
  } else {
    root.classList.remove("light");
    DOM.themeToggle?.setAttribute("aria-pressed", "false");
  }
}

/* ============================================
   AUDIO NOTIFICATION
   ============================================ */
function playNotificationSound() {
  if (!appState.settings.soundEnabled) return;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const freq = 880; // A5 note

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
  // Timer Controls
  DOM.startBtn.addEventListener("click", () => {
    timerState.running ? pauseTimer() : startTimer();
  });
  DOM.pauseBtn.addEventListener("click", pauseTimer);
  DOM.resetBtn.addEventListener("click", resetTimer);

  // Tab Switching
  DOM.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!timerState.running) {
        setTimerMode(tab.dataset.mode, true);
      }
    });
  });

  // Task Management
  DOM.taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (DOM.taskInput.value.trim()) {
      addTask(DOM.taskInput.value);
      DOM.taskInput.value = "";
      DOM.taskInput.focus();
    }
  });

  DOM.clearTasksBtn.addEventListener("click", clearCompletedTasks);

  // Settings
  DOM.settingsBtn.addEventListener("click", openSettings);
  DOM.closeSettingsBtn.addEventListener("click", closeSettings);
  DOM.settingsCancelBtn.addEventListener("click", closeSettings);
  DOM.settingsForm.addEventListener("submit", saveSettings);

  // Theme
  DOM.themeToggle.addEventListener("click", toggleTheme);

  // Statistics
  DOM.statsToggle.addEventListener("click", () => {
    DOM.statsPanel.classList.toggle("hidden");
    DOM.tasksPanel.classList.toggle("hidden");
  });

  DOM.statsPeriod.addEventListener("change", (e) => {
    updateStatsDisplay(e.target.value);
  });

  DOM.exportStatsBtn.addEventListener("click", exportData);

  // Focus Mode
  DOM.focusModeBtn.addEventListener("click", toggleFocusMode);
  DOM.focusExitBtn.addEventListener("click", exitFocusMode);
  DOM.focusPauseBtn.addEventListener("click", pauseTimer);

  // Modal overlay click to close
  DOM.settingsModal.addEventListener("click", (e) => {
    if (e.target === DOM.settingsModal) closeSettings();
  });

  // Tab visibility - pause timer if tab becomes hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && timerState.running) {
      pauseTimer();
    }
  });
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Prevent shortcuts if user is typing in input
    if (e.target.tagName === "INPUT" && e.target.id !== "task-input") {
      return;
    }

    switch (e.key) {
      case " ":
        e.preventDefault();
        timerState.running ? pauseTimer() : startTimer();
        break;
      case "r":
      case "R":
        e.preventDefault();
        resetTimer();
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFocusMode();
        break;
      case ",":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          openSettings();
        }
        break;
    }
  });
}

window.addEventListener("beforeunload", () => {
  saveAppState();
});
