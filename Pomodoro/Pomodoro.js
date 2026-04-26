// Pomodoro Timer - Professional Edition
// Enhanced with task management, statistics, focus mode, and analytics

/* ============================================
   PERFORMANCE UTILITIES
   ============================================ */

/**
 * Simple debounce implementation
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle implementation for scroll and resize events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Performance optimization: Batch DOM updates
const pendingUpdates = new Set();

function scheduleUpdate(updateFn) {
  pendingUpdates.add(updateFn);
  if (pendingUpdates.size === 1) {
    requestAnimationFrame(() => {
      pendingUpdates.forEach((fn) => fn());
      pendingUpdates.clear();
    });
  }
}
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
  focusOverlay: document.getElementById("focus-mode-overlay"),
  focusTimer: document.getElementById("focus-timer"),
  focusModeLabel: document.getElementById("focus-mode-label"),
  focusPauseBtn: document.getElementById("focus-pause-btn"),
  focusExitBtn: document.getElementById("focus-exit-btn"),

  // Theme
  themeToggle: document.getElementById("theme-toggle"),

  // Progress Ring
  ring: document.querySelector(".progress-ring .ring"),
};

/**
 * Verify all required DOM elements are present
 * @returns {boolean} True if all critical elements exist
 */
function validateDOMElements() {
  const required = [
    "timeDisplay",
    "sessionLabel",
    "startBtn",
    "pauseBtn",
    "resetBtn",
    "taskForm",
    "taskInput",
    "taskList",
    "settingsModal",
    "statsPanel",
    "focusOverlay",
    "themeToggle",
  ];

  const missing = required.filter((key) => !DOM[key]);

  if (missing.length > 0) {
    console.error(
      "Missing critical DOM elements:",
      missing,
      "The page may not be fully loaded.",
    );
    return false;
  }

  return true;
}

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Validate DOM before initialization
    if (!validateDOMElements()) {
      console.error("Failed to initialize: Missing required DOM elements");
      return;
    }

    initializeApp();
    setupEventListeners();
    renderInitialUI();
    setupKeyboardShortcuts();

    console.log("Pomodoro app initialized successfully");
  } catch (e) {
    console.error("Failed to initialize Pomodoro app:", e);
  }
});

function initializeApp() {
  try {
    // Ensure daily record is current
    const today = getTodayDate();
    if (appState.daily.date !== today) {
      appState.daily = { date: today, sessionsCompleted: 0, focusMinutes: 0 };
    }

    // Set timer duration
    setTimerMode(MODES.FOCUS, true);
    applyTheme();
  } catch (e) {
    console.error("Error during app initialization:", e);
  }
}

function renderInitialUI() {
  try {
    renderTasks();
    updateStatsDisplay();
    updateQuickStats();
    drawProgressRing();
  } catch (e) {
    console.error("Error rendering initial UI:", e);
  }
}

/* ============================================
   LOCAL STORAGE
   ============================================ */

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = "__ls_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn("localStorage is not available:", e);
    return false;
  }
}

function loadAppState() {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn("Using default state - localStorage not available");
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    const stored = localStorage.getItem(LS_KEY);
    if (!stored) {
      console.log("No saved state found, using defaults");
      saveAppState(DEFAULT_STATE);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new fields and ensure data integrity
    const merged = {
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      daily: parsed.daily || DEFAULT_STATE.daily,
    };

    console.log("App state loaded successfully");
    return merged;
  } catch (e) {
    console.error("Failed to load app state:", e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveAppState(state = appState) {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn("Cannot save state - localStorage not available");
      return;
    }

    localStorage.setItem(LS_KEY, JSON.stringify(state));
    console.log("App state saved successfully");
  } catch (e) {
    console.error("Failed to save app state:", e);
    if (e.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded");
    }
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
  try {
    if (!Object.values(MODES).includes(mode)) {
      console.error("Invalid timer mode:", mode);
      return;
    }

    timerState.mode = mode;

    const durations = {
      [MODES.FOCUS]: appState.settings.focus,
      [MODES.SHORT_BREAK]: appState.settings.short,
      [MODES.LONG_BREAK]: appState.settings.long,
    };

    timerState.duration = (durations[mode] || 25) * 60; // convert to seconds
    if (shouldReset) {
      timerState.remaining = timerState.duration;
      timerState.pausedTime = 0;
      timerState.sessionStartedAt = null;
    }

    updateTimerDisplay();
    drawProgressRing();
    updateTabsUI();

    console.log("Timer mode set to:", mode, "Duration:", timerState.duration);
  } catch (e) {
    console.error("Error setting timer mode:", e);
  }
}

function startTimer() {
  try {
    if (timerState.running) {
      console.warn("Timer is already running");
      return;
    }

    timerState.running = true;
    timerState.startTime = Date.now();
    if (!timerState.sessionStartedAt) {
      timerState.sessionStartedAt = Date.now();
    }

    timerState.interval = setInterval(() => {
      try {
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
      } catch (e) {
        console.error("Error in timer interval:", e);
        pauseTimer();
      }
    }, 100);

    updateControlsUI();
    console.log("Timer started");
  } catch (e) {
    console.error("Error starting timer:", e);
  }
}

function pauseTimer() {
  try {
    if (!timerState.running) {
      console.warn("Timer is not running");
      return;
    }

    timerState.running = false;
    if (timerState.interval) {
      clearInterval(timerState.interval);
      timerState.interval = null;
    }

    timerState.pausedTime += Math.floor(
      (Date.now() - timerState.startTime) / 1000,
    );

    updateControlsUI();
    console.log("Timer paused. Remaining:", timerState.remaining);
  } catch (e) {
    console.error("Error pausing timer:", e);
  }
}

function resetTimer() {
  try {
    pauseTimer();
    timerState.remaining = timerState.duration;
    timerState.pausedTime = 0;
    timerState.sessionStartedAt = null;
    updateTimerDisplay();
    drawProgressRing();
    updateControlsUI();
    console.log("Timer reset");
  } catch (e) {
    console.error("Error resetting timer:", e);
  }
}

function completeTimer() {
  try {
    pauseTimer();
    playNotificationSound();

    if (timerState.mode === MODES.FOCUS) {
      recordSession();
    }

    // Auto-advance if enabled
    if (appState.settings.autoReset) {
      const nextMode =
        timerState.mode === MODES.FOCUS ? MODES.SHORT_BREAK : MODES.FOCUS;
      setTimeout(() => setTimerMode(nextMode, true), 500);
    } else {
      timerState.remaining = 0;
      updateTimerDisplay();
    }

    updateStatsDisplay();
    updateQuickStats();
    console.log("Timer completed. Mode was:", timerState.mode);
  } catch (e) {
    console.error("Error completing timer:", e);
  }
}

function recordSession() {
  try {
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
    console.log("Session recorded:", session);
  } catch (e) {
    console.error("Error recording session:", e);
  }
}

/* ============================================
   TIMER DISPLAY & UI
   ============================================ */
function updateTimerDisplay() {
  try {
    const formattedTime = formatTime(timerState.remaining);

    if (DOM.timeDisplay) {
      DOM.timeDisplay.textContent = formattedTime;
    }

    if (DOM.focusTimer) {
      DOM.focusTimer.textContent = formattedTime;
    }
  } catch (e) {
    console.error("Error updating timer display:", e);
  }
}

function updateControlsUI() {
  try {
    if (!DOM.startBtn || !DOM.pauseBtn || !DOM.resetBtn) {
      console.warn("Timer control buttons not found");
      return;
    }

    DOM.startBtn.disabled = timerState.running;
    DOM.pauseBtn.disabled = !timerState.running;
    DOM.resetBtn.disabled =
      !timerState.running && timerState.remaining === timerState.duration;

    DOM.startBtn.textContent = timerState.running ? "⏸ Running..." : "▶ Start";
  } catch (e) {
    console.error("Error updating controls UI:", e);
  }
}

function updateTabsUI() {
  try {
    DOM.tabs.forEach((tab) => {
      const isActive = tab.dataset.mode === timerState.mode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive.toString());
    });

    const labels = {
      [MODES.FOCUS]: "Focus Session",
      [MODES.SHORT_BREAK]: "Short Break",
      [MODES.LONG_BREAK]: "Long Break",
    };

    if (DOM.sessionLabel) {
      DOM.sessionLabel.textContent = labels[timerState.mode] || "Session";
    }

    if (DOM.focusModeLabel) {
      DOM.focusModeLabel.textContent = labels[timerState.mode] || "Session";
    }
  } catch (e) {
    console.error("Error updating tabs UI:", e);
  }
}

function drawProgressRing() {
  try {
    if (!DOM.ring) {
      console.warn("Progress ring element not found");
      return;
    }

    const circumference = 2 * Math.PI * 48; // radius = 48
    const progress =
      timerState.duration === 0
        ? 0
        : timerState.remaining / timerState.duration;
    const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

    DOM.ring.style.strokeDasharray = `${circumference} ${circumference}`;
    DOM.ring.style.strokeDashoffset = offset;
  } catch (e) {
    console.error("Error drawing progress ring:", e);
  }
}

/* ============================================
   TASK MANAGEMENT
   ============================================ */
function addTask(text) {
  // Validate input
  if (!text || typeof text !== "string") {
    console.warn("Invalid task text:", text);
    return;
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0 || trimmedText.length > 100) {
    console.warn(
      "Task text must be between 1 and 100 characters:",
      trimmedText.length,
    );
    return;
  }

  const task = {
    id: `task_${Date.now()}`,
    text: trimmedText,
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
  try {
    if (!DOM.taskList) {
      console.warn("Task list element not found");
      return;
    }

    DOM.taskList.innerHTML = "";

    if (appState.tasks.length === 0) {
      if (DOM.emptyTasks) {
        DOM.emptyTasks.classList.remove("hidden");
      }
      return;
    }

    if (DOM.emptyTasks) {
      DOM.emptyTasks.classList.add("hidden");
    }

    appState.tasks.forEach((task) => {
      try {
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

        if (checkbox) {
          checkbox.addEventListener("change", () => toggleTask(task.id));
        }
        if (removeBtn) {
          removeBtn.addEventListener("click", () => deleteTask(task.id));
        }

        DOM.taskList.appendChild(li);
      } catch (e) {
        console.error("Error rendering task:", task, e);
      }
    });
  } catch (e) {
    console.error("Error in renderTasks:", e);
  }
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
  try {
    const completedTasks = appState.tasks.filter((t) => t.completed).length;
    const totalTasks = appState.tasks.length;
    const progress =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    if (DOM.sessionsToday) {
      DOM.sessionsToday.textContent = appState.daily.sessionsCompleted || 0;
    }
    if (DOM.minutesToday) {
      DOM.minutesToday.textContent = appState.daily.focusMinutes || 0;
    }
    if (DOM.tasksProgress) {
      DOM.tasksProgress.textContent = `${progress}%`;
    }
  } catch (e) {
    console.error("Error updating quick stats:", e);
  }
}

function updateStatsDisplay(period = "today") {
  try {
    const stats = calculateStats(period);

    if (DOM.totalSessions) {
      DOM.totalSessions.textContent = stats.totalSessions || 0;
    }
    if (DOM.totalFocusTime) {
      DOM.totalFocusTime.textContent = stats.totalMinutes
        ? formatDuration(stats.totalMinutes)
        : "0m";
    }
    if (DOM.bestStreak) {
      DOM.bestStreak.textContent = stats.bestStreak || 0;
    }
    if (DOM.avgSession) {
      DOM.avgSession.textContent = stats.avgDuration || "0m";
    }

    renderActivityChart(period);
  } catch (e) {
    console.error("Error updating stats display:", e);
  }
}

function calculateStats(period = "today") {
  try {
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
    const totalMinutes = relevantSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
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
  } catch (e) {
    console.error("Error calculating stats:", e);
    return {
      totalSessions: 0,
      totalMinutes: 0,
      avgDuration: "0m",
      bestStreak: 0,
    };
  }
}

function renderActivityChart(period = "today") {
  try {
    if (!DOM.activityChart) {
      console.warn("Activity chart element not found");
      return;
    }

    DOM.activityChart.innerHTML = "";

    let dates = [];
    if (period === "today") {
      dates = [getTodayDate()];
    } else if (period === "week") {
      dates = getWeekDates(7);
    } else {
      dates = getWeekDates(30);
    }

    const sessionCounts = dates.map(
      (d) => appState.sessions.filter((s) => s.date === d).length,
    );
    const maxSessions = Math.max(...sessionCounts, 3);

    dates.forEach((date, i) => {
      const sessionsOnDate = sessionCounts[i];
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
  } catch (e) {
    console.error("Error rendering activity chart:", e);
  }
}

function exportData() {
  try {
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Data exported successfully");
  } catch (e) {
    console.error("Error exporting data:", e);
    alert("Failed to export data. Please check the console.");
  }
}

/* ============================================
   FOCUS MODE
   ============================================ */
function toggleFocusMode() {
  try {
    if (!DOM.focusOverlay) {
      console.warn("Focus overlay element not found");
      return;
    }

    const isHidden = DOM.focusOverlay.classList.contains("hidden");

    if (isHidden) {
      // Entering focus mode
      DOM.focusOverlay.classList.remove("hidden");
    } else {
      // Exiting focus mode
      DOM.focusOverlay.classList.add("hidden");
    }
  } catch (e) {
    console.error("Error toggling focus mode:", e);
  }
}

function exitFocusMode() {
  try {
    if (DOM.focusOverlay) {
      DOM.focusOverlay.classList.add("hidden");
    }
  } catch (e) {
    console.error("Error exiting focus mode:", e);
  }
}

/* ============================================
   SETTINGS & PREFERENCES
   ============================================ */
function openSettings() {
  try {
    if (!DOM.settingsModal) {
      console.warn("Settings modal not found");
      return;
    }

    if (DOM.focusDuration) DOM.focusDuration.value = appState.settings.focus;
    if (DOM.shortBreakDuration)
      DOM.shortBreakDuration.value = appState.settings.short;
    if (DOM.longBreakDuration)
      DOM.longBreakDuration.value = appState.settings.long;
    if (DOM.autoResetCheck)
      DOM.autoResetCheck.checked = appState.settings.autoReset;
    if (DOM.soundEnabledCheck)
      DOM.soundEnabledCheck.checked = appState.settings.soundEnabled;

    DOM.settingsModal.classList.remove("hidden");
  } catch (e) {
    console.error("Error opening settings:", e);
  }
}

function closeSettings() {
  try {
    if (DOM.settingsModal) {
      DOM.settingsModal.classList.add("hidden");
    }
  } catch (e) {
    console.error("Error closing settings:", e);
  }
}

function saveSettings(e) {
  try {
    e.preventDefault();

    // Validate and parse settings with constraints
    const focusVal = parseInt(DOM.focusDuration?.value) || 25;
    const shortVal = parseInt(DOM.shortBreakDuration?.value) || 5;
    const longVal = parseInt(DOM.longBreakDuration?.value) || 15;

    appState.settings.focus = Math.max(1, Math.min(180, focusVal));
    appState.settings.short = Math.max(1, Math.min(60, shortVal));
    appState.settings.long = Math.max(1, Math.min(180, longVal));
    appState.settings.autoReset = DOM.autoResetCheck?.checked ?? true;
    appState.settings.soundEnabled = DOM.soundEnabledCheck?.checked ?? true;

    saveAppState();
    setTimerMode(timerState.mode, true);
    closeSettings();

    console.log("Settings saved successfully");
  } catch (e) {
    console.error("Error saving settings:", e);
  }
}

/* ============================================
   THEME MANAGEMENT
   ============================================ */
function toggleTheme() {
  try {
    const root = document.documentElement;
    if (!root) {
      console.error("Could not find document root element");
      return;
    }

    const isLight = root.classList.contains("light");
    const newTheme = isLight ? "dark" : "light";

    root.classList.toggle("light", !isLight);
    appState.settings.theme = newTheme;
    saveAppState();

    if (DOM.themeToggle) {
      DOM.themeToggle.setAttribute("aria-pressed", (!isLight).toString());
    }

    console.log("Theme changed to:", newTheme);
  } catch (e) {
    console.error("Error toggling theme:", e);
  }
}

function applyTheme() {
  try {
    const theme = appState.settings.theme || "dark";
    const root = document.documentElement;

    if (!root) {
      console.error("Could not find document root element");
      return;
    }

    if (theme === "light") {
      root.classList.add("light");
      if (DOM.themeToggle) {
        DOM.themeToggle.setAttribute("aria-pressed", "true");
      }
    } else {
      root.classList.remove("light");
      if (DOM.themeToggle) {
        DOM.themeToggle.setAttribute("aria-pressed", "false");
      }
    }

    console.log("Theme applied:", theme);
  } catch (e) {
    console.error("Error applying theme:", e);
  }
}

/* ============================================
   AUDIO NOTIFICATION
   ============================================ */
function playNotificationSound() {
  if (!appState.settings.soundEnabled) {
    console.log("Sound notifications disabled");
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not supported");
      return;
    }

    const audioCtx = new AudioContext();
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

    console.log("Notification sound played");
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
  try {
    // Timer Controls
    if (DOM.startBtn) {
      DOM.startBtn.addEventListener("click", () => {
        timerState.running ? pauseTimer() : startTimer();
      });
    }
    if (DOM.pauseBtn) {
      DOM.pauseBtn.addEventListener("click", pauseTimer);
    }
    if (DOM.resetBtn) {
      DOM.resetBtn.addEventListener("click", resetTimer);
    }

    // Tab Switching
    DOM.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (!timerState.running) {
          setTimerMode(tab.dataset.mode, true);
        }
      });
    });

    // Task Management
    if (DOM.taskForm) {
      DOM.taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const taskText = DOM.taskInput?.value.trim();
        if (taskText) {
          addTask(taskText);
          if (DOM.taskInput) {
            DOM.taskInput.value = "";
            DOM.taskInput.focus();
          }
        }
      });
    }

    if (DOM.clearTasksBtn) {
      DOM.clearTasksBtn.addEventListener("click", clearCompletedTasks);
    }

    // Settings
    if (DOM.settingsBtn) {
      DOM.settingsBtn.addEventListener("click", openSettings);
    }
    if (DOM.closeSettingsBtn) {
      DOM.closeSettingsBtn.addEventListener("click", closeSettings);
    }
    if (DOM.settingsCancelBtn) {
      DOM.settingsCancelBtn.addEventListener("click", closeSettings);
    }
    if (DOM.settingsForm) {
      DOM.settingsForm.addEventListener("submit", saveSettings);
    }

    // Theme
    if (DOM.themeToggle) {
      DOM.themeToggle.addEventListener("click", toggleTheme);
    }

    // Statistics
    if (DOM.statsToggle) {
      DOM.statsToggle.addEventListener("click", () => {
        if (DOM.statsPanel) DOM.statsPanel.classList.toggle("hidden");
        if (DOM.tasksPanel) DOM.tasksPanel.classList.toggle("hidden");
      });
    }

    if (DOM.statsPeriod) {
      DOM.statsPeriod.addEventListener("change", (e) => {
        updateStatsDisplay(e.target.value);
      });
    }

    if (DOM.exportStatsBtn) {
      DOM.exportStatsBtn.addEventListener("click", exportData);
    }

    // Focus Mode
    if (DOM.focusModeBtn) {
      DOM.focusModeBtn.addEventListener("click", toggleFocusMode);
    }
    if (DOM.focusExitBtn) {
      DOM.focusExitBtn.addEventListener("click", exitFocusMode);
    }
    if (DOM.focusPauseBtn) {
      DOM.focusPauseBtn.addEventListener("click", pauseTimer);
    }

    // Modal overlay click to close
    if (DOM.settingsModal) {
      DOM.settingsModal.addEventListener("click", (e) => {
        if (e.target === DOM.settingsModal) closeSettings();
      });
    }

    // Tab visibility - pause timer if tab becomes hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && timerState.running) {
        pauseTimer();
      }
    });

    console.log("Event listeners set up successfully");
  } catch (e) {
    console.error("Error setting up event listeners:", e);
  }
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    try {
      // Prevent shortcuts if user is typing in text input (except task input for Space)
      if (
        e.target.tagName === "INPUT" &&
        e.target.id !== "task-input" &&
        e.key !== ","
      ) {
        return;
      }

      // Allow task input only for space bar (start/pause)
      if (e.target.id === "task-input" && e.key !== " ") {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          timerState.running ? pauseTimer() : startTimer();
          break;
        case "r":
          e.preventDefault();
          resetTimer();
          break;
        case "f":
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
    } catch (e) {
      console.error("Error in keyboard shortcut handler:", e);
    }
  });
}

window.addEventListener("beforeunload", () => {
  try {
    saveAppState();
  } catch (e) {
    console.error("Error saving state before unload:", e);
  }
});
