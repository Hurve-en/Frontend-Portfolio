// ==================== STATE MANAGEMENT ====================
class AppState {
  constructor() {
    this.todos = this.loadTodos();
    this.stats = this.loadStats();
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
  }

  loadTodos() {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  }

  saveTodos() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
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

    // Update mode buttons
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

    // Update label
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

    // Update progress ring
    const totalSeconds =
      this.state.timerState.currentMode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    const progress =
      (totalSeconds - this.state.timerState.timeRemaining) / totalSeconds;
    const circumference = 2 * Math.PI * 95;
    const offset = circumference * (1 - progress);
    this.elements.timerFill.style.strokeDashoffset = offset;

    // Update stats
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
  }

  addTodo() {
    const text = this.elements.todoInput.value.trim();
    if (!text) return;

    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: "medium", // default priority
    };

    this.state.todos.unshift(todo);
    this.state.saveTodos();
    this.elements.todoInput.value = "";
    this.render();
    showToast("✅ Task added!", "success");

    // Animate input
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
    }

    return filtered;
  }

  render() {
    const filteredTodos = this.getFilteredTodos();

    // Update counts
    const completedTodos = this.state.todos.filter((t) => t.completed).length;
    this.elements.taskCount.textContent = this.state.todos.length;
    this.elements.completedCount.textContent = completedTodos;

    // Update clear button
    this.elements.clearBtn.disabled = completedTodos === 0;

    // Render list
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
            <div class="todo-item ${todo.completed ? "completed" : ""}" data-id="${todo.id}">
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

    // Update completion rate
    this.elements.completionRate.textContent = `${completionRate}%`;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - completionRate / 100);
    this.elements.completionRing.style.strokeDashoffset = offset;

    // Update stats
    this.elements.totalFocusHours.textContent = `${hours}h ${minutes}m`;
    this.elements.totalCompleted.textContent = completedTasks;
    this.elements.currentStreak.textContent = `${this.state.stats.streakDays} days`;
  }
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show`;

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
  // Initialize app state
  appState = new AppState();

  // Initialize managers
  pomodoroTimer = new PomodoroTimer(appState);
  todoManager = new TodoManager(appState);
  statsManager = new StatsManager(appState);

  // Add SVG gradient for timer
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

  // Log initialization
  console.log("🎯 Momentum App Initialized Successfully");
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
});

// ==================== SERVICE WORKER (Optional) ====================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch((err) => console.log("SW registration failed"));
}

// ==================== ACCESSIBILITY ====================
// Ensure all interactive elements are keyboard accessible
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
