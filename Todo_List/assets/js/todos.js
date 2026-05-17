/* Todo Management */
class TodoManager {
  constructor(state) {
    this.state = state;
    this.draggedFrom = null;
    this.initElements();
    this.attachEventListeners();
    this.render();
  }

  initElements() {
    this.elements = {
      todoInput: document.getElementById("todoInput"),
      addBtn: document.getElementById("addBtn"),
      filterBtns: document.querySelectorAll(".filter-btn"),
      todoList: document.getElementById("todoList"),
      clearBtn: document.getElementById("clearCompleted"),
      helpBtn: document.getElementById("helpBtn"),
      undoBtn: document.getElementById("undoBtn"),
      redoBtn: document.getElementById("redoBtn"),
      importBtn: document.getElementById("importBtn"),
      exportBtn: document.getElementById("exportBtn"),
      prioritySelect: document.getElementById("quickPriority"),
      categorySelect: document.getElementById("quickCategory"),
      dueDateInput: document.getElementById("quickDueDate"),
      helpModal: document.getElementById("helpModal"),
      helpClose: document.querySelector(".modal-close"),
      hiddenFileInput: document.createElement("input"),
    };
    this.elements.hiddenFileInput.type = "file";
    this.elements.hiddenFileInput.accept = ".json";
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
    this.elements.helpBtn.addEventListener("click", () => this.showHelpModal());
    this.elements.helpClose.addEventListener("click", () =>
      this.hideHelpModal(),
    );
    document.getElementById("helpModal").addEventListener("click", (e) => {
      if (e.target === this.elements.helpModal) this.hideHelpModal();
    });
    this.elements.undoBtn.addEventListener("click", () => this.undo());
    this.elements.redoBtn.addEventListener("click", () => this.redo());
    this.elements.importBtn.addEventListener("click", () =>
      this.elements.hiddenFileInput.click(),
    );
    this.elements.hiddenFileInput.addEventListener("change", (e) =>
      this.importTasks(e),
    );
    this.elements.exportBtn.addEventListener("click", () => this.exportTasks());
    this.elements.prioritySelect.addEventListener("change", (e) => {
      this.state.quickPriority = e.target.value;
    });
    this.elements.categorySelect.addEventListener("change", (e) => {
      this.state.quickCategory = e.target.value;
    });
    this.elements.dueDateInput.addEventListener("change", (e) => {
      this.state.quickDueDate = e.target.value;
    });
  }

  addTodo() {
    const text = this.elements.todoInput.value.trim();
    if (!text) {
      showToast("Please enter a task", "warning");
      return;
    }
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      priority: this.state.quickPriority,
      category: this.state.quickCategory,
      dueDate: this.state.quickDueDate,
      createdAt: new Date().toISOString(),
    };
    this.state.todos.unshift(todo);
    this.state.saveTodos();
    this.elements.todoInput.value = "";
    this.render();
    showToast("✅ Task added", "success");
  }

  toggleTodo(id) {
    const todo = this.state.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) this.state.stats.completedTasks++;
      this.state.saveTodos();
      this.state.saveStats();
      this.render();
    }
  }

  deleteTodo(id) {
    const index = this.state.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.state.todos.splice(index, 1);
      this.state.saveTodos();
      this.render();
      showToast("🗑️ Task deleted", "info");
    }
  }

  clearCompleted() {
    const before = this.state.todos.length;
    this.state.todos = this.state.todos.filter((t) => !t.completed);
    if (this.state.todos.length < before) {
      this.state.saveTodos();
      this.render();
      showToast(
        `🧹 Cleared ${before - this.state.todos.length} completed tasks`,
        "success",
      );
    }
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = (d) => new Date(d) < today;
    const isToday = (d) => new Date(d).toDateString() === today.toDateString();

    switch (this.state.currentFilter) {
      case "active":
        filtered = filtered.filter((t) => !t.completed);
        break;
      case "completed":
        filtered = filtered.filter((t) => t.completed);
        break;
      case "today":
        filtered = filtered.filter(
          (t) => t.dueDate && isToday(t.dueDate) && !t.completed,
        );
        break;
      case "overdue":
        filtered = filtered.filter(
          (t) => t.dueDate && overdue(t.dueDate) && !t.completed,
        );
        break;
    }
    return filtered;
  }

  getDueDateClass(dueDate) {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today ? "overdue" : "";
  }

  getDueDateLabel(dueDate) {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `in ${diff} days`;
  }

  undo() {
    const state = this.state.undoRedo.undo();
    if (state) {
      this.state.todos = state;
      this.state.saveTodos();
      this.render();
      showToast("↶ Undo complete", "info");
    }
  }

  redo() {
    const state = this.state.undoRedo.redo();
    if (state) {
      this.state.todos = state;
      this.state.saveTodos();
      this.render();
      showToast("↷ Redo complete", "info");
    }
  }

  showHelpModal() {
    this.elements.helpModal.classList.add("active");
  }

  hideHelpModal() {
    this.elements.helpModal.classList.remove("active");
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  render() {
    this.elements.todoList.innerHTML = "";
    const filtered = this.getFilteredTodos();

    if (filtered.length === 0) {
      this.elements.todoList.innerHTML =
        '<div class="empty-state">No tasks found. Keep focus! 🌟</div>';
      return;
    }

    filtered.forEach((todo, index) => {
      const dueDateClass = this.getDueDateClass(todo.dueDate);
      const dueDateLabel = this.getDueDateLabel(todo.dueDate);
      const todoEl = document.createElement("div");
      todoEl.className = `todo-item ${todo.completed ? "completed" : ""}`;
      todoEl.draggable = true;
      todoEl.dataset.id = todo.id;

      todoEl.innerHTML = `
        <input type="checkbox" class="checkbox" ${todo.completed ? "checked" : ""}>
        <div class="todo-content">
          <div class="todo-text">${this.escapeHtml(todo.text)}</div>
          <div class="todo-meta">
            ${
              todo.createdAt
                ? `<span class="todo-time">${new Date(todo.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>`
                : ""
            }
            <span class="todo-priority ${todo.priority}">${todo.priority.toUpperCase()}</span>
            ${
              todo.category
                ? `<span class="todo-category-badge">${todo.category}</span>`
                : ""
            }
            ${
              todo.dueDate
                ? `<span class="todo-due-date ${dueDateClass}">${this.formatDate(todo.dueDate)} (${dueDateLabel})</span>`
                : ""
            }
          </div>
        </div>
        <div class="todo-actions">
          <button class="action-btn delete-btn" data-id="${todo.id}">🗑️</button>
        </div>
      `;

      todoEl
        .querySelector(".checkbox")
        .addEventListener("change", () => this.toggleTodo(todo.id));
      todoEl
        .querySelector(".delete-btn")
        .addEventListener("click", () => this.deleteTodo(todo.id));

      todoEl.addEventListener("dragstart", () => {
        this.draggedFrom = index;
        todoEl.classList.add("dragging");
      });
      todoEl.addEventListener("dragend", () => {
        todoEl.classList.remove("dragging");
      });
      todoEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this.draggedFrom !== null && this.draggedFrom !== index) {
          todoEl.classList.add("drag-over");
        }
      });
      todoEl.addEventListener("dragleave", () => {
        todoEl.classList.remove("drag-over");
      });
      todoEl.addEventListener("drop", () => {
        if (this.draggedFrom !== null && this.draggedFrom !== index) {
          const draggedTodo = this.getFilteredTodos()[this.draggedFrom];
          filtered.splice(this.draggedFrom, 1);
          filtered.splice(index, 0, draggedTodo);
          this.state.todos = filtered;
          this.state.saveTodos();
          this.render();
        }
        todoEl.classList.remove("drag-over");
      });

      this.elements.todoList.appendChild(todoEl);
    });

    this.state.updateUndoRedoButtons();
  }

  exportTasks() {
    const data = JSON.stringify(
      {
        todos: this.state.todos,
        stats: this.state.stats,
        exportDate: new Date().toISOString(),
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Tasks exported", "success");
  }

  importTasks(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.state.todos = data.todos || [];
        this.state.stats = data.stats || this.state.stats;
        this.state.saveTodos();
        this.state.saveStats();
        this.render();
        showToast("📤 Tasks imported successfully", "success");
      } catch (error) {
        showToast("Error importing tasks", "error");
      }
    };
    reader.readAsText(file);
    this.elements.hiddenFileInput.value = "";
  }
}
