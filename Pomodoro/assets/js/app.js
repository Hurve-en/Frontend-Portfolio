/* ============================================================================
   POMODORO APP - Main application controller
   ============================================================================ */

class PomodoroApp {
  constructor() {
    this.storage = new StorageManager();
    this.ui = new UIRenderer();
    this.timer = new TimerManager(this.storage);
    this.taskManager = new TaskManager(this.storage);
    this.statsManager = new StatsManager(this.storage);
    this.themeManager = new ThemeManager(this.storage);

    this.init();
  }

  init() {
    try {
      if (!this.ui.validateElements()) {
        console.error("Failed to initialize: Missing required DOM elements");
        return;
      }

      // Ensure daily record is current
      const today = Utilities.getTodayDate();
      if (this.storage.state.daily.date !== today) {
        this.storage.state.daily = {
          date: today,
          sessionsCompleted: 0,
          focusMinutes: 0,
        };
        this.storage.saveAppState();
      }

      // Setup theme and timer
      this.themeManager.apply();
      this.timer.setMode(CONFIG.MODES.FOCUS, true);

      // Setup event listeners and render UI
      this.setupTimerListeners();
      this.setupEventListeners();
      this.renderInitialUI();
      this.setupKeyboardShortcuts();

      console.log("Pomodoro app initialized successfully");
    } catch (e) {
      console.error("Failed to initialize Pomodoro app:", e);
    }
  }

  setupTimerListeners() {
    this.timer.on("tick", () => {
      this.ui.updateTimerDisplay(this.timer.state.remaining);
      this.ui.drawProgressRing(this.timer.state);
    });

    this.timer.on("modeChanged", () => {
      this.ui.updateTimerDisplay(this.timer.state.remaining);
      this.ui.updateTabsUI(this.timer.state.mode);
      this.ui.updateControlsUI(this.timer.state);
      this.ui.drawProgressRing(this.timer.state);
    });

    this.timer.on("started", () => {
      this.ui.updateControlsUI(this.timer.state);
    });

    this.timer.on("paused", () => {
      this.ui.updateControlsUI(this.timer.state);
    });

    this.timer.on("reset", () => {
      this.ui.updateTimerDisplay(this.timer.state.remaining);
      this.ui.updateControlsUI(this.timer.state);
      this.ui.drawProgressRing(this.timer.state);
    });

    this.timer.on("completed", () => {
      this.updateStatsDisplay();
      this.ui.updateQuickStats(this.storage);
    });
  }

  setupEventListeners() {
    try {
      // Timer Controls
      if (this.ui.elements.startBtn) {
        this.ui.elements.startBtn.addEventListener("click", () => {
          this.timer.state.running ? this.timer.pause() : this.timer.start();
        });
      }
      if (this.ui.elements.pauseBtn) {
        this.ui.elements.pauseBtn.addEventListener("click", () =>
          this.timer.pause(),
        );
      }
      if (this.ui.elements.resetBtn) {
        this.ui.elements.resetBtn.addEventListener("click", () =>
          this.timer.reset(),
        );
      }

      // Tab Switching
      this.ui.elements.tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          if (!this.timer.state.running) {
            this.timer.setMode(tab.dataset.mode, true);
          }
        });
      });

      // Task Management
      if (this.ui.elements.taskForm) {
        this.ui.elements.taskForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const taskText = this.ui.elements.taskInput?.value.trim();
          if (taskText) {
            this.taskManager.addTask(taskText);
            this.taskManager.renderTasks("#task-list");
            this.ui.updateQuickStats(this.storage);
            if (this.ui.elements.taskInput) {
              this.ui.elements.taskInput.value = "";
              this.ui.elements.taskInput.focus();
            }
          }
        });
      }

      if (this.ui.elements.clearTasksBtn) {
        this.ui.elements.clearTasksBtn.addEventListener("click", () => {
          this.taskManager.clearCompleted();
          this.taskManager.renderTasks("#task-list");
          this.ui.updateQuickStats(this.storage);
        });
      }

      // Settings
      if (this.ui.elements.settingsBtn) {
        this.ui.elements.settingsBtn.addEventListener("click", () =>
          this.ui.openSettings(this.storage),
        );
      }
      if (this.ui.elements.closeSettingsBtn) {
        this.ui.elements.closeSettingsBtn.addEventListener("click", () =>
          this.ui.closeSettings(),
        );
      }
      if (this.ui.elements.settingsCancelBtn) {
        this.ui.elements.settingsCancelBtn.addEventListener("click", () =>
          this.ui.closeSettings(),
        );
      }
      if (this.ui.elements.settingsForm) {
        this.ui.elements.settingsForm.addEventListener("submit", (e) =>
          this.saveSettings(e),
        );
      }

      // Theme
      if (this.ui.elements.themeToggle) {
        this.ui.elements.themeToggle.addEventListener("click", () =>
          this.themeManager.toggle(),
        );
      }

      // Statistics
      if (this.ui.elements.statsToggle) {
        this.ui.elements.statsToggle.addEventListener("click", () =>
          this.ui.toggleStatsPanel(),
        );
      }
      if (this.ui.elements.statsPeriod) {
        this.ui.elements.statsPeriod.addEventListener("change", (e) => {
          this.updateStatsDisplay(e.target.value);
        });
      }
      if (this.ui.elements.exportStatsBtn) {
        this.ui.elements.exportStatsBtn.addEventListener("click", () =>
          this.statsManager.exportData(),
        );
      }

      // Focus Mode
      if (this.ui.elements.focusModeBtn) {
        this.ui.elements.focusModeBtn.addEventListener("click", () =>
          this.ui.toggleFocusMode(),
        );
      }
      if (this.ui.elements.focusExitBtn) {
        this.ui.elements.focusExitBtn.addEventListener("click", () =>
          this.ui.exitFocusMode(),
        );
      }
      if (this.ui.elements.focusPauseBtn) {
        this.ui.elements.focusPauseBtn.addEventListener("click", () =>
          this.timer.pause(),
        );
      }

      // Modal overlay click to close
      if (this.ui.elements.settingsModal) {
        this.ui.elements.settingsModal.addEventListener("click", (e) => {
          if (e.target === this.ui.elements.settingsModal)
            this.ui.closeSettings();
        });
      }

      // Tab visibility
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.timer.state.running) {
          this.timer.pause();
        }
      });

      console.log("Event listeners set up successfully");
    } catch (e) {
      console.error("Error setting up event listeners:", e);
    }
  }

  saveSettings(e) {
    try {
      e.preventDefault();

      const focusVal = parseInt(this.ui.elements.focusDuration?.value) || 25;
      const shortVal =
        parseInt(this.ui.elements.shortBreakDuration?.value) || 5;
      const longVal = parseInt(this.ui.elements.longBreakDuration?.value) || 15;

      this.storage.state.settings.focus = Math.max(1, Math.min(180, focusVal));
      this.storage.state.settings.short = Math.max(1, Math.min(60, shortVal));
      this.storage.state.settings.long = Math.max(1, Math.min(180, longVal));
      this.storage.state.settings.autoReset =
        this.ui.elements.autoResetCheck?.checked ?? true;
      this.storage.state.settings.soundEnabled =
        this.ui.elements.soundEnabledCheck?.checked ?? true;

      this.storage.saveAppState();
      this.timer.setMode(this.timer.state.mode, true);
      this.ui.closeSettings();

      console.log("Settings saved successfully");
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  }

  renderInitialUI() {
    try {
      this.taskManager.renderTasks("#task-list");
      this.ui.updateQuickStats(this.storage);
      this.updateStatsDisplay("today");
      this.ui.updateTimerDisplay(this.timer.state.remaining);
      this.ui.updateTabsUI(this.timer.state.mode);
      this.ui.updateControlsUI(this.timer.state);
      this.ui.drawProgressRing(this.timer.state);
    } catch (e) {
      console.error("Error rendering initial UI:", e);
    }
  }

  updateStatsDisplay(period = "today") {
    const stats = this.statsManager.getStats(period);
    this.ui.updateStatsDisplay(stats);
    this.statsManager.renderActivityChart(period, "#activity-chart");
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      try {
        // Prevent shortcuts if user is typing in text input (except Space)
        if (
          e.target.tagName === "INPUT" &&
          e.target.id !== "task-input" &&
          e.key !== " "
        ) {
          return;
        }

        // Allow task input only for space bar
        if (e.target.id === "task-input" && e.key !== " ") {
          return;
        }

        switch (e.key.toLowerCase()) {
          case " ":
            e.preventDefault();
            this.timer.state.running ? this.timer.pause() : this.timer.start();
            break;
          case "r":
            e.preventDefault();
            this.timer.reset();
            break;
          case "f":
            e.preventDefault();
            this.ui.toggleFocusMode();
            break;
          case ",":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              this.ui.openSettings(this.storage);
            }
            break;
        }
      } catch (e) {
        console.error("Error in keyboard shortcut handler:", e);
      }
    });
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  window.pomodoroApp = new PomodoroApp();
});

window.addEventListener("beforeunload", () => {
  try {
    if (window.pomodoroApp && window.pomodoroApp.storage) {
      window.pomodoroApp.storage.saveAppState();
    }
  } catch (e) {
    console.error("Error saving state before unload:", e);
  }
});
