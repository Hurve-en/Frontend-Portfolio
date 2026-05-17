/* Undo/Redo & App State */
class UndoRedoManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  push(state) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(state)));
    this.currentIndex++;
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

class AppState {
  constructor() {
    this.todos = this.loadTodos();
    this.stats = this.loadStats();
    this.undoRedo = new UndoRedoManager();
    this.timerState = {
      isRunning: false,
      isPaused: false,
      currentMode: "work",
      workDuration: 25,
      breakDuration: 5,
      timeRemaining: 25 * 60,
      totalFocusTime: 0,
      sessionsCompleted: 0,
    };
    this.currentFilter = "all";
    this.quickPriority = "medium";
    this.quickCategory = "general";
    this.quickDueDate = null;
  }

  loadTodos() {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  }

  saveTodos() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.undoRedo.push(this.todos);
    this.updateUndoRedoButtons();
  }

  loadStats() {
    const saved = localStorage.getItem("stats");
    return saved
      ? JSON.parse(saved)
      : {
          completedTasks: 0,
          totalFocusMinutes: 0,
          sessionsCompleted: 0,
          streakDays: 0,
          lastActiveDate: null,
        };
  }

  saveStats() {
    localStorage.setItem("stats", JSON.stringify(this.stats));
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    if (undoBtn) undoBtn.disabled = !this.undoRedo.canUndo();
    if (redoBtn) redoBtn.disabled = !this.undoRedo.canRedo();
  }
}
