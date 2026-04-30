// This script handles the task list, timer, stats, and page interactions.

// ==================== UNDO/REDO MANAGER ====================
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

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

// ==================== STATE MANAGEMENT ====================
class AppState {
  constructor() {
    this.todos = this.loadTodos();
    this.stats = this.loadStats();
    this.undoRedo = new UndoRedoManager();
    this.timerState = {
      isRunning: false,
      isPaused: false,
      currentMode: "work", // 'work' or 'break'
      workDuration: 25, // in minutes
      breakDuration: 5, // in minutes
      timeRemaining: 25 * 60, // in seconds
      totalFocusTime: 0, // in seconds
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
    // Push current state to undo history
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

// ==================== POMODORO TIMER ====================
class PomodoroTimer {
  constructor(state) {
    this.state = state;
    this.timerInterval = null;
    this.audioNotification = this.createAudioNotification();
    this.initElements();
    this.attachEventListeners();
    this.updateDisplay();
  }

  initElements() {
    this.elements = {
      timerDisplay: document.getElementById("timerDisplay"),
      timerLabel: document.getElementById("timerLabel"),
      playBtn: document.getElementById("playBtn"),
      pauseBtn: document.getElementById("pauseBtn"),
      resetBtn: document.getElementById("resetBtn"),
      workDurationInput: document.getElementById("workDuration"),
      breakDurationInput: document.getElementById("breakDuration"),
      modeBtns: document.querySelectorAll(".mode-btn"),
      timerFill: document.querySelector(".timer-fill"),
      totalFocusTime: document.getElementById("totalFocusTime"),
      sessionFocusTime: document.getElementById("sessionFocusTime"),
      sessionCount: document.getElementById("sessionCount"),
    };
  }

  attachEventListeners() {
    this.elements.playBtn.addEventListener("click", () => this.start());
    this.elements.pauseBtn.addEventListener("click", () => this.pause());
    this.elements.resetBtn.addEventListener("click", () => this.reset());
    this.elements.workDurationInput.addEventListener("change", (e) =>
      this.updateDuration("work", e.target.value),
    );
    this.elements.breakDurationInput.addEventListener("change", (e) =>
      this.updateDuration("break", e.target.value),
    );
    this.elements.modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.switchMode(btn.dataset.mode));
    });
  }

  start() {
    if (this.state.timerState.isRunning) return;

    this.state.timerState.isRunning = true;
    this.state.timerState.isPaused = false;
    this.updateButtons();

    this.timerInterval = setInterval(() => {
      this.state.timerState.timeRemaining--;
      this.state.timerState.totalFocusTime++;

      if (this.state.timerState.currentMode === "work") {
        this.state.stats.totalFocusMinutes++;
      }

      this.updateDisplay();

      if (this.state.timerState.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  pause() {
    if (!this.state.timerState.isRunning) return;

    this.state.timerState.isRunning = false;
    this.state.timerState.isPaused = true;
    clearInterval(this.timerInterval);
    this.updateButtons();
  }

  reset() {
    clearInterval(this.timerInterval);
    this.state.timerState.isRunning = false;
    this.state.timerState.isPaused = false;
    this.state.timerState.timeRemaining =
      this.state.timerState.currentMode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    this.updateDisplay();
    this.updateButtons();
  }

  switchMode(mode) {
    if (this.state.timerState.isRunning) return;

    this.state.timerState.currentMode = mode;
    this.state.timerState.timeRemaining =
      mode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;

    // Highlight the selected mode button
    this.elements.modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    this.updateDisplay();
  }

  updateDuration(mode, minutes) {
    minutes = Math.max(1, Math.min(60, parseInt(minutes) || 25));
    this.state.timerState[mode + "Duration"] = minutes;

    if (
      !this.state.timerState.isRunning &&
      this.state.timerState.currentMode === mode
    ) {
      this.state.timerState.timeRemaining = minutes * 60;
      this.updateDisplay();
    }
  }

  completeSession() {
    clearInterval(this.timerInterval);
    this.state.timerState.isRunning = false;

    if (this.state.timerState.currentMode === "work") {
      this.state.timerState.sessionsCompleted++;
      this.state.stats.sessionsCompleted++;
      this.playNotification();
      showToast("🎉 Session completed! Take a break.", "success");
      this.switchMode("break");
    } else {
      showToast("✨ Break finished! Ready for another session?");
      this.switchMode("work");
    }

    this.state.saveStats();
    this.updateButtons();
    this.updateDisplay();
  }

  updateDisplay() {
    const minutes = Math.floor(this.state.timerState.timeRemaining / 60);
    const seconds = this.state.timerState.timeRemaining % 60;
    this.elements.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Set timer label text
    let label =
      this.state.timerState.currentMode === "work"
        ? "Focus Time"
        : "Break Time";
    if (this.state.timerState.isPaused) label = "Paused";
    if (
      !this.state.timerState.isRunning &&
      (this.state.timerState.timeRemaining ===
        this.state.timerState.currentMode) ===
        "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60
    ) {
      label =
        this.state.timerState.currentMode === "work"
          ? "Ready to focus?"
          : "Time to break?";
    }
    this.elements.timerLabel.textContent = label;

    // Update timer progress ring
    const totalSeconds =
      this.state.timerState.currentMode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    const progress =
      (totalSeconds - this.state.timerState.timeRemaining) / totalSeconds;
    const circumference = 2 * Math.PI * 95;
    const offset = circumference * (1 - progress);
    this.elements.timerFill.style.strokeDashoffset = offset;

    // Refresh timer stats
    const hours = Math.floor(this.state.timerState.totalFocusTime / 3600);
    const mins = Math.floor((this.state.timerState.totalFocusTime % 3600) / 60);
    this.elements.totalFocusTime.textContent = `${hours}h ${mins}m`;
    this.elements.sessionFocusTime.textContent = `${minutes}m`;
    this.elements.sessionCount.textContent =
      this.state.timerState.sessionsCompleted;
  }

  updateButtons() {
    this.elements.playBtn.disabled = this.state.timerState.isRunning;
    this.elements.pauseBtn.disabled = !this.state.timerState.isRunning;
    this.elements.workDurationInput.disabled =
      this.state.timerState.isRunning || this.state.timerState.isPaused;
    this.elements.breakDurationInput.disabled =
      this.state.timerState.isRunning || this.state.timerState.isPaused;
  }

  createAudioNotification() {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    return audioContext;
  }

  playNotification() {
    try {
      const ctx = this.createAudioNotification();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.log("Audio notification skipped");
    }
  }
}

// ==================== TODO LIST MANAGER ====================
class TodoManager {
  constructor(state) {
    this.state = state;
    this.initElements();
    this.attachEventListeners();
    this.render();
  }

  initElements() {
    this.elements = {
      todoInput: document.getElementById("todoInput"),
      addBtn: document.getElementById("addBtn"),
      todoList: document.getElementById("todoList"),
      filterBtns: document.querySelectorAll(".filter-btn"),
      clearBtn: document.getElementById("clearCompleted"),
      taskCount: document.getElementById("taskCount"),
      completedCount: document.getElementById("completedCount"),
      quickPriority: document.getElementById("quickPriority"),
      quickCategory: document.getElementById("quickCategory"),
      quickDueDate: document.getElementById("quickDueDate"),
      undoBtn: document.getElementById("undoBtn"),
      redoBtn: document.getElementById("redoBtn"),
      helpBtn: document.getElementById("helpBtn"),
      exportBtn: document.getElementById("exportBtn"),
      importBtn: document.getElementById("importBtn"),
      importFile: document.getElementById("importFile"),
      helpModal: document.getElementById("helpModal"),
      closeHelpModal: document.getElementById("closeHelpModal"),
    };
  }

  attachEventListeners() {
    this.elements.addBtn.addEventListener("click", () => this.addTodo());
    this.elements.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTodo();
    });
    this.elements.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.setFilter(btn.dataset.filter));
    });
    this.elements.clearBtn.addEventListener("click", () =>
      this.clearCompleted(),
    );

    // Quick controls
    this.elements.quickPriority.addEventListener("change", (e) => {
      this.state.quickPriority = e.target.value;
    });
    this.elements.quickCategory.addEventListener("change", (e) => {
      this.state.quickCategory = e.target.value;
    });
    this.elements.quickDueDate.addEventListener("change", (e) => {
      this.state.quickDueDate = e.target.value;
    });

    // Undo/Redo
    this.elements.undoBtn.addEventListener("click", () => this.undo());
    this.elements.redoBtn.addEventListener("click", () => this.redo());

    // Help modal
    this.elements.helpBtn.addEventListener("click", () => this.showHelpModal());
    this.elements.closeHelpModal.addEventListener("click", () =>
      this.hideHelpModal(),
    );
    this.elements.helpModal.addEventListener("click", (e) => {
      if (e.target === this.elements.helpModal) this.hideHelpModal();
    });

    // Import/Export
    this.elements.exportBtn.addEventListener("click", () => this.exportTasks());
    this.elements.importBtn.addEventListener("click", () => {
      this.elements.importFile.click();
    });
    this.elements.importFile.addEventListener("change", (e) =>
      this.importTasks(e),
    );
  }

  addTodo() {
    const text = this.elements.todoInput.value.trim();
    if (!text) return;

    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: this.state.quickPriority || "medium",
      category: this.state.quickCategory || "general",
      dueDate: this.state.quickDueDate || null,
    };

    this.state.todos.unshift(todo);
    this.state.saveTodos();
    this.elements.todoInput.value = "";
    this.render();
    showToast("✅ Task added!", "success");

    // Pulse the input field briefly to show feedback
    this.elements.todoInput.classList.add("pulse-animation");
    setTimeout(
      () => this.elements.todoInput.classList.remove("pulse-animation"),
      600,
    );
  }

  toggleTodo(id) {
    const todo = this.state.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) {
        this.state.stats.completedTasks++;
        showToast("🎯 Great work!", "success");
      }
      this.state.saveTodos();
      this.state.saveStats();
      this.render();
    }
  }

  deleteTodo(id) {
    this.state.todos = this.state.todos.filter((t) => t.id !== id);
    this.state.saveTodos();
    this.render();
    showToast("🗑️ Task deleted", "success");
  }

  clearCompleted() {
    this.state.todos = this.state.todos.filter((t) => !t.completed);
    this.state.saveTodos();
    this.render();
    showToast("🧹 Cleared completed tasks", "success");
  }

  setFilter(filter) {
    this.state.currentFilter = filter;
    this.elements.filterBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    this.render();
  }

  getFilteredTodos() {
    let filtered = this.state.todos;

    if (this.state.currentFilter === "completed") {
      filtered = filtered.filter((t) => t.completed);
    } else if (this.state.currentFilter === "active") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.state.currentFilter === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (t) => new Date(t.createdAt).toDateString() === today,
      );
    } else if (this.state.currentFilter === "overdue") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
    }

    return filtered;
  }

  getDueDateClass(dueDate) {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) return "overdue";
    if (due.getTime() === today.getTime()) return "today";
    return "upcoming";
  }

  getDueDateLabel(dueDate) {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) return `📛 ${dueDate}`;
    if (due.getTime() === today.getTime()) return "📌 Today";
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (due.getTime() === tomorrow.getTime()) return "🔔 Tomorrow";
    return `📅 ${dueDate}`;
  }

  undo() {
    const previousState = this.state.undoRedo.undo();
    if (previousState) {
      this.state.todos = previousState;
      this.state.saveTodos();
      this.render();
      showToast("↶ Undo successful", "info");
    }
  }

  redo() {
    const nextState = this.state.undoRedo.redo();
    if (nextState) {
      this.state.todos = nextState;
      this.state.saveTodos();
      this.render();
      showToast("↷ Redo successful", "info");
    }
  }

  showHelpModal() {
    this.elements.helpModal.classList.add("active");
  }

  hideHelpModal() {
    this.elements.helpModal.classList.remove("active");
  }

  exportTasks() {
    const dataStr = JSON.stringify(this.state.todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `momentum-tasks-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("📥 Tasks exported successfully", "success");
  }

  importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTodos = JSON.parse(e.target.result);
        if (Array.isArray(importedTodos)) {
          this.state.todos = [...importedTodos, ...this.state.todos];
          this.state.saveTodos();
          this.render();
          showToast("📤 Tasks imported successfully", "success");
        } else {
          showToast("❌ Invalid file format", "error");
        }
      } catch (error) {
        showToast("❌ Failed to import tasks", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  render() {
    const filteredTodos = this.getFilteredTodos();

    // Update task counters
    const completedTodos = this.state.todos.filter((t) => t.completed).length;
    this.elements.taskCount.textContent = this.state.todos.length;
    this.elements.completedCount.textContent = completedTodos;

    // Disable clear button when there are no completed tasks
    this.elements.clearBtn.disabled = completedTodos === 0;

    // Render the current list of filtered todos
    if (filteredTodos.length === 0) {
      this.elements.todoList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <p>${
                      this.state.currentFilter === "completed"
                        ? "No completed tasks yet!"
                        : this.state.currentFilter === "active"
                          ? "No active tasks!"
                          : "No tasks yet. Create one to get started!"
                    }</p>
                </div>
            `;
      return;
    }

    this.elements.todoList.innerHTML = filteredTodos
      .map(
        (todo) => `
            <div class="todo-item ${todo.completed ? "completed" : ""}" 
                 data-id="${todo.id}"
                 draggable="true">
                <input
                    type="checkbox"
                    class="checkbox"
                    ${todo.completed ? "checked" : ""}
                    aria-label="Toggle todo completion"
                    onchange="todoManager.toggleTodo(${todo.id})"
                >
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="todo-time">📅 ${this.formatDate(todo.createdAt)}</span>
                        ${todo.dueDate ? `<span class="todo-due-date ${this.getDueDateClass(todo.dueDate)}">${this.getDueDateLabel(todo.dueDate)}</span>` : ""}
                        <span class="todo-category-badge">${todo.category || "general"}</span>
                        <span class="todo-priority ${todo.priority}">${todo.priority.toUpperCase()}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn" onclick="todoManager.deleteTodo(${todo.id})" aria-label="Delete todo">🗑️</button>
                </div>
            </div>
        `,
      )
      .join("");

    // Add drag and drop listeners
    this.attachDragDropListeners();
    this.state.updateUndoRedoButtons();
  }

  attachDragDropListeners() {
    const todoItems = document.querySelectorAll(".todo-item");

    todoItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "move";
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        document.querySelectorAll(".todo-item").forEach((el) => {
          el.classList.remove("drag-over");
        });
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (
          e.target.closest(".todo-item") &&
          e.target.closest(".todo-item") !== item
        ) {
          e.target.closest(".todo-item").classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedId = parseInt(
          document.querySelector(".todo-item.dragging").dataset.id,
        );
        const targetId = parseInt(item.dataset.id);

        if (draggedId !== targetId) {
          const draggedIndex = this.state.todos.findIndex(
            (t) => t.id === draggedId,
          );
          const targetIndex = this.state.todos.findIndex(
            (t) => t.id === targetId,
          );
          [this.state.todos[draggedIndex], this.state.todos[targetIndex]] = [
            this.state.todos[targetIndex],
            this.state.todos[draggedIndex],
          ];
          this.state.saveTodos();
          this.render();
          showToast("📍 Task reordered", "info");
        }
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }
}

// ==================== STATISTICS MANAGER ====================
class StatsManager {
  constructor(state) {
    this.state = state;
    this.initElements();
    this.attachEventListeners();
    this.render();
  }

  initElements() {
    this.elements = {
      completionRate: document.getElementById("completionRate"),
      completionRing: document.getElementById("completionRing"),
      totalFocusHours: document.getElementById("totalFocusHours"),
      totalCompleted: document.getElementById("totalCompleted"),
      currentStreak: document.getElementById("currentStreak"),
      periodBtns: document.querySelectorAll(".period-btn"),
    };
  }

  attachEventListeners() {
    this.elements.periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.setPeriod(btn.dataset.period));
    });
  }

  setPeriod(period) {
    this.elements.periodBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.period === period);
    });
    this.render();
  }

  calculateCompletionRate() {
    if (this.state.todos.length === 0) return 0;
    return Math.round(
      (this.state.todos.filter((t) => t.completed).length /
        this.state.todos.length) *
        100,
    );
  }

  render() {
    const completionRate = this.calculateCompletionRate();
    const completedTasks = this.state.stats.completedTasks;
    const totalFocusMinutes = this.state.stats.totalFocusMinutes;
    const hours = Math.floor(totalFocusMinutes / 60);
    const minutes = totalFocusMinutes % 60;

    // Refresh completion progress
    this.elements.completionRate.textContent = `${completionRate}%`;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - completionRate / 100);
    this.elements.completionRing.style.strokeDashoffset = offset;

    // Refresh stat values
    this.elements.totalFocusHours.textContent = `${hours}h ${minutes}m`;
    this.elements.totalCompleted.textContent = completedTasks;
    this.elements.currentStreak.textContent = `${this.state.stats.streakDays} days`;
  }
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==================== INITIALIZATION ====================
let appState;
let pomodoroTimer;
let todoManager;
let statsManager;

document.addEventListener("DOMContentLoaded", () => {
  // Create app state and start the three main managers
  appState = new AppState();

  // Timer, todo list, and stats manager
  pomodoroTimer = new PomodoroTimer(appState);
  todoManager = new TodoManager(appState);
  statsManager = new StatsManager(appState);

  // Initialize undo/redo buttons
  appState.updateUndoRedoButtons();

  // Add SVG gradient for the timer visualization
  const svg = document.querySelector(".timer-progress");
  if (svg && !document.querySelector("defs")) {
    const defs = document.createElement("defs");
    defs.innerHTML = `
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#2d6a4f;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
            </linearGradient>
        `;
    svg.insertAdjacentElement("afterbegin", defs);
  }

  // Initialize hint tag filters
  document.querySelectorAll(".hint-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const filter = tag.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
      });
      todoManager.setFilter(filter);
    });
  });

  // Add smooth scroll behavior
  document.documentElement.style.scrollBehavior = "smooth";

  // Log that the app is ready
  console.log(
    "🎯 Momentum App Initialized Successfully with Enhanced Features",
  );
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to add todo
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    todoManager.addTodo();
  }

  // Ctrl/Cmd + Space to toggle timer
  if ((e.ctrlKey || e.metaKey) && e.key === " ") {
    e.preventDefault();
    if (appState.timerState.isRunning) {
      pomodoroTimer.pause();
    } else {
      pomodoroTimer.start();
    }
  }

  // Ctrl/Cmd + Z to undo
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    todoManager.undo();
  }

  // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z to redo
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === "y" || (e.shiftKey && e.key === "z"))
  ) {
    e.preventDefault();
    todoManager.redo();
  }

  // Ctrl/Cmd + E to export
  if ((e.ctrlKey || e.metaKey) && e.key === "e") {
    e.preventDefault();
    todoManager.exportTasks();
  }

  // ? or Shift+/ to show help
  if (e.key === "?" || (e.shiftKey && e.key === "/")) {
    e.preventDefault();
    todoManager.showHelpModal();
  }
});

// ==================== SERVICE WORKER (Optional) ====================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch((err) => console.log("SW registration failed"));
}

// ==================== ACCESSIBILITY ====================
// Keep keyboard interaction active for a better experience
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Close any open modals/dropdowns here if needed
  }
});

// Focus visible styles
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    document.body.classList.add("keyboard-nav");
  }
});

document.addEventListener("mousedown", () => {
  document.body.classList.remove("keyboard-nav");
});
