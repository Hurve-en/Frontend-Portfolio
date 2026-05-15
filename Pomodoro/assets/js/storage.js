/* ============================================================================
   STORAGE MANAGER - Handle app state and localStorage
   ============================================================================ */

class StorageManager {
  constructor() {
    this.state = this.loadAppState();
  }

  isLocalStorageAvailable() {
    try {
      const test = "__ls_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn("localStorage not available:", e);
      return false;
    }
  }

  loadAppState() {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn("Using default state - localStorage not available");
        return JSON.parse(JSON.stringify(CONFIG.DEFAULT_STATE));
      }

      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!stored) {
        const defaultState = JSON.parse(JSON.stringify(CONFIG.DEFAULT_STATE));
        defaultState.daily.date = Utilities.getTodayDate();
        this.saveAppState(defaultState);
        return defaultState;
      }

      const parsed = JSON.parse(stored);
      const merged = {
        settings: {
          ...CONFIG.DEFAULT_STATE.settings,
          ...(parsed.settings || {}),
        },
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        daily: parsed.daily || CONFIG.DEFAULT_STATE.daily,
      };

      return merged;
    } catch (e) {
      console.error("Failed to load app state:", e);
      return JSON.parse(JSON.stringify(CONFIG.DEFAULT_STATE));
    }
  }

  saveAppState(state = this.state) {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn("Cannot save state - localStorage not available");
        return;
      }

      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save app state:", e);
      if (e.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded");
      }
    }
  }

  getState() {
    return this.state;
  }

  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.saveAppState();
  }

  addTask(taskText) {
    const task = {
      id: `task_${Date.now()}`,
      text: taskText.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    this.state.tasks.unshift(task);
    this.saveAppState();
    return task;
  }

  toggleTask(taskId) {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveAppState();
    }
  }

  deleteTask(taskId) {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId);
    this.saveAppState();
  }

  clearCompletedTasks() {
    this.state.tasks = this.state.tasks.filter((t) => !t.completed);
    this.saveAppState();
  }

  recordSession(duration) {
    const session = {
      id: Date.now().toString(),
      date: Utilities.getTodayDate(),
      timestamp: Date.now(),
      duration: duration,
      completed: true,
    };

    this.state.sessions.push(session);
    this.state.daily.sessionsCompleted += 1;
    this.state.daily.focusMinutes += duration;
    this.saveAppState();
  }

  exportData() {
    return {
      exportDate: new Date().toISOString(),
      summary: this.calculateStats("all"),
      sessions: this.state.sessions,
      tasks: this.state.tasks,
    };
  }

  calculateStats(period = "today") {
    let relevantSessions = [];

    if (period === "today") {
      relevantSessions = this.state.sessions.filter(
        (s) => s.date === Utilities.getTodayDate(),
      );
    } else if (period === "week") {
      const weekDates = Utilities.getWeekDates(7);
      relevantSessions = this.state.sessions.filter((s) =>
        weekDates.includes(s.date),
      );
    } else {
      relevantSessions = this.state.sessions;
    }

    const totalSessions = relevantSessions.length;
    const totalMinutes = relevantSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
    const avgDuration =
      totalSessions > 0 ? Math.round(totalMinutes / totalSessions) + "m" : "0m";

    let bestStreak = 0;
    if (this.state.sessions.length > 0) {
      const dates = Utilities.getWeekDates(7);
      let currentStreak = 0;

      dates.forEach((date) => {
        const hasSession = this.state.sessions.some((s) => s.date === date);
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
}
