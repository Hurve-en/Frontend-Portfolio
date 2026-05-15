/* ============================================================================
   UI RENDERER - DOM caching and UI update methods
   ============================================================================ */

class UIRenderer {
  constructor() {
    this.elements = this.cacheElements();
  }

  cacheElements() {
    return {
      // Timer Display
      timeDisplay: document.getElementById("time-display"),
      sessionLabel: document.getElementById("session-label"),
      focusTimer: document.getElementById("focus-timer"),
      focusModeLabel: document.getElementById("focus-mode-label"),
      ring: document.querySelector(".progress-ring .ring"),

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
      totalSessions: document.getElementById("total-sessions"),
      totalFocusTime: document.getElementById("total-focus-time"),
      bestStreak: document.getElementById("best-streak"),
      avgSession: document.getElementById("avg-session"),
      activityChart: document.getElementById("activity-chart"),

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
      exportStatsBtn: document.getElementById("export-stats-btn"),
      tasksPanel: document.getElementById("tasks-panel"),

      // Focus Mode
      focusModeBtn: document.getElementById("focus-mode-btn"),
      focusOverlay: document.getElementById("focus-mode-overlay"),
      focusPauseBtn: document.getElementById("focus-pause-btn"),
      focusExitBtn: document.getElementById("focus-exit-btn"),

      // Theme
      themeToggle: document.getElementById("theme-toggle"),
    };
  }

  validateElements() {
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

    const missing = required.filter((key) => !this.elements[key]);
    if (missing.length > 0) {
      console.error("Missing critical DOM elements:", missing);
      return false;
    }
    return true;
  }

  updateTimerDisplay(seconds) {
    const formatted = Utilities.formatTime(seconds);
    if (this.elements.timeDisplay)
      this.elements.timeDisplay.textContent = formatted;
    if (this.elements.focusTimer)
      this.elements.focusTimer.textContent = formatted;
  }

  updateControlsUI(timerState) {
    if (this.elements.startBtn)
      this.elements.startBtn.disabled = timerState.running;
    if (this.elements.pauseBtn)
      this.elements.pauseBtn.disabled = !timerState.running;
    if (this.elements.resetBtn) {
      this.elements.resetBtn.disabled =
        !timerState.running && timerState.remaining === timerState.duration;
    }
    if (this.elements.startBtn) {
      this.elements.startBtn.textContent = timerState.running
        ? "⏸ Running..."
        : "▶ Start";
    }
  }

  updateTabsUI(mode) {
    this.elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive.toString());
    });

    const labels = {
      [CONFIG.MODES.FOCUS]: "Focus Session",
      [CONFIG.MODES.SHORT_BREAK]: "Short Break",
      [CONFIG.MODES.LONG_BREAK]: "Long Break",
    };

    if (this.elements.sessionLabel)
      this.elements.sessionLabel.textContent = labels[mode];
    if (this.elements.focusModeLabel)
      this.elements.focusModeLabel.textContent = labels[mode];
  }

  drawProgressRing(timerState) {
    if (!this.elements.ring) return;

    const circumference = 2 * Math.PI * 48;
    const progress =
      timerState.duration === 0
        ? 0
        : timerState.remaining / timerState.duration;
    const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

    this.elements.ring.style.strokeDasharray = `${circumference} ${circumference}`;
    this.elements.ring.style.strokeDashoffset = offset;
  }

  updateQuickStats(storage) {
    const completedTasks = storage.state.tasks.filter(
      (t) => t.completed,
    ).length;
    const totalTasks = storage.state.tasks.length;
    const progress =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    if (this.elements.sessionsToday)
      this.elements.sessionsToday.textContent =
        storage.state.daily.sessionsCompleted || 0;
    if (this.elements.minutesToday)
      this.elements.minutesToday.textContent =
        storage.state.daily.focusMinutes || 0;
    if (this.elements.tasksProgress)
      this.elements.tasksProgress.textContent = `${progress}%`;
  }

  updateStatsDisplay(stats) {
    if (this.elements.totalSessions)
      this.elements.totalSessions.textContent = stats.totalSessions || 0;
    if (this.elements.totalFocusTime) {
      this.elements.totalFocusTime.textContent = stats.totalMinutes
        ? Utilities.formatDuration(stats.totalMinutes)
        : "0m";
    }
    if (this.elements.bestStreak)
      this.elements.bestStreak.textContent = stats.bestStreak || 0;
    if (this.elements.avgSession)
      this.elements.avgSession.textContent = stats.avgDuration || "0m";
  }

  toggleFocusMode() {
    if (this.elements.focusOverlay) {
      this.elements.focusOverlay.classList.toggle("hidden");
    }
  }

  exitFocusMode() {
    if (this.elements.focusOverlay) {
      this.elements.focusOverlay.classList.add("hidden");
    }
  }

  openSettings(storage) {
    if (!this.elements.settingsModal) return;

    if (this.elements.focusDuration)
      this.elements.focusDuration.value = storage.state.settings.focus;
    if (this.elements.shortBreakDuration)
      this.elements.shortBreakDuration.value = storage.state.settings.short;
    if (this.elements.longBreakDuration)
      this.elements.longBreakDuration.value = storage.state.settings.long;
    if (this.elements.autoResetCheck)
      this.elements.autoResetCheck.checked = storage.state.settings.autoReset;
    if (this.elements.soundEnabledCheck)
      this.elements.soundEnabledCheck.checked =
        storage.state.settings.soundEnabled;

    this.elements.settingsModal.classList.remove("hidden");
  }

  closeSettings() {
    if (this.elements.settingsModal) {
      this.elements.settingsModal.classList.add("hidden");
    }
  }

  toggleStatsPanel() {
    if (this.elements.statsPanel)
      this.elements.statsPanel.classList.toggle("hidden");
    if (this.elements.tasksPanel)
      this.elements.tasksPanel.classList.toggle("hidden");
  }
}
