/* ============================================================================
   TASK MANAGER - Task rendering and management
   ============================================================================ */

class TaskManager {
  constructor(storage) {
    this.storage = storage;
  }

  renderTasks(containerSelector) {
    const container = document.querySelector(containerSelector);
    const emptyStateSelector = containerSelector + " ~ .empty-state";
    const emptyState = document.querySelector(emptyStateSelector);

    if (!container) return;

    container.innerHTML = "";

    const tasks = this.storage.state.tasks;
    if (tasks.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "done" : ""}`;
      li.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task done" />
        <span class="task-text">${Utilities.escapeHtml(task.text)}</span>
        <button class="btn-remove" aria-label="Delete task">✕</button>
      `;

      const checkbox = li.querySelector("input[type=checkbox]");
      const removeBtn = li.querySelector(".btn-remove");

      if (checkbox) {
        checkbox.addEventListener("change", () => {
          this.storage.toggleTask(task.id);
          this.renderTasks(containerSelector);
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          this.storage.deleteTask(task.id);
          this.renderTasks(containerSelector);
        });
      }

      container.appendChild(li);
    });
  }

  addTask(text) {
    if (!text || typeof text !== "string") return;

    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 100) return;

    this.storage.addTask(trimmedText);
  }

  clearCompleted() {
    this.storage.clearCompletedTasks();
  }
}
