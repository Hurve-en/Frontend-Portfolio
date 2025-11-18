/* todolist.js
   Improved UI/UX while preserving core logic.
   - Keep this file name `todolist.js`
   - Comments explain where to find hooks for customizations
*/

document.addEventListener("DOMContentLoaded", () => {
  // ---------- DOM refs (must match HTML IDs) ----------
  const taskInput = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const addBtn = document.getElementById("addBtn");
  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  const totalCount = document.getElementById("totalCount");
  const doneCount = document.getElementById("doneCount");
  const filterSelect = document.getElementById("filterSelect");
  const sortSelect = document.getElementById("sortSelect");
  const clearAllBtn = document.getElementById("clearAll");
  const clearDoneBtn = document.getElementById("clearDone");
  const presentBtn = document.getElementById("presentBtn");
  const template = document.getElementById("task-template");
  const progressBar = document.getElementById("progressBar");

  // ---------- App state ----------
  const STORAGE_KEY = "todo:tasks:v1";
  let tasks = loadTasksFromStorage(); // load persisted tasks or empty
  let presentMode = false;

  // ---------- Utility helpers ----------
  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // localStorage may be disabled — fail silently to preserve UX
      console.warn("Could not save tasks to localStorage", e);
    }
  }

  function loadTasksFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function makeId() {
    // more robust id than Date.now in case of ultra-fast adds
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  // ---------- Core rendering ----------
  function renderTasks() {
    // Clear list
    list.innerHTML = "";

    // Apply filter
    let filtered = tasks.filter((t) => {
      if (filterSelect.value === "done") return t.done;
      if (filterSelect.value === "active") return !t.done;
      return true;
    });

    // Sort
    if (sortSelect.value === "priority") {
      const priorityOrder = { high: 1, normal: 2, low: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortSelect.value === "oldest") {
      filtered.sort((a, b) => a.created - b.created);
    } else {
      filtered.sort((a, b) => b.created - a.created);
    }

    // Render or empty
    if (filtered.length === 0) {
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      filtered.forEach((task) => {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".item");
        const checkbox = clone.querySelector(".task-checkbox");
        const textDiv = clone.querySelector(".text");
        const priorityTag = clone.querySelector(".priority");
        const editBtn = clone.querySelector(".edit");
        const removeBtn = clone.querySelector(".remove");

        // dataset id for easy lookup & animation hooks
        item.dataset.id = task.id;
        textDiv.textContent = task.text;
        priorityTag.textContent = task.priority;

        item.classList.toggle("done", task.done);
        priorityTag.classList.add(task.priority);

        checkbox.checked = task.done;

        // attach listeners (use event delegation alternative if you prefer)
        checkbox.addEventListener("change", () => toggleDone(task.id));
        editBtn.addEventListener("click", () => editTask(task.id));
        removeBtn.addEventListener("click", () => removeTask(task.id));

        // append and allow CSS entry animation via MutationObserver fallback
        list.appendChild(clone);
      });
    }

    updateCounters();
    updateProgressBar();
    saveTasksToStorage();
  }

  // ---------- Counters & progress ----------
  function updateCounters() {
    totalCount.textContent = `${tasks.length} total`;
    const doneTasks = tasks.filter((t) => t.done).length;
    doneCount.textContent = `${doneTasks} done`;
  }

  function updateProgressBar() {
    if (!progressBar) return;
    const total = tasks.length || 0;
    const done = tasks.filter((t) => t.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    progressBar.style.width = pct + "%";
  }

  // ---------- Core actions ----------
  function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (text === "") {
      // gentle UX feedback instead of alert()
      flashInputError();
      return;
    }

    const newTask = {
      id: makeId(),
      text,
      priority,
      done: false,
      created: Date.now(),
    };

    tasks.push(newTask);
    taskInput.value = "";
    taskInput.focus();

    // render and highlight newly added
    renderTasks();
    flashAddedById(newTask.id);
  }

  function toggleDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      renderTasks();
    }
  }

  function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      // small inline edit: replace text with prompt for simplicity (non-destructive)
      const newText = prompt("Edit task:", task.text);
      if (newText !== null && newText.trim() !== "") {
        task.text = newText.trim();
        renderTasks();
      }
    }
  }

  // ---------- Enhanced remove with undo ----------
  let lastRemoved = null;
  function removeTask(id) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const removed = tasks.splice(idx, 1)[0];

    // animate remove if DOM element exists
    const itemEl = list.querySelector(`.item[data-id="${id}"]`);
    if (itemEl) {
      itemEl.classList.add("item-exit");
      // after animation, re-render to clean DOM
      setTimeout(() => {
        renderTasks();
        showUndoToast(removed);
      }, 260);
    } else {
      renderTasks();
      showUndoToast(removed);
    }
  }

  function clearAll() {
    if (tasks.length > 0 && confirm("Clear all tasks?")) {
      tasks = [];
      renderTasks();
    }
  }

  function clearDone() {
    if (tasks.some((t) => t.done)) {
      if (confirm("Remove all completed tasks?")) {
        tasks = tasks.filter((t) => !t.done);
        renderTasks();
      }
    }
  }

  // ---------- Present mode ----------
  function togglePresentMode() {
    presentMode = !presentMode;
    document.body.classList.toggle("present", presentMode);
    presentBtn.setAttribute("aria-pressed", String(presentMode));
    presentBtn.textContent = presentMode ? "Exit Present Mode" : "Present";
    // focus toggle so user can exit with keyboard easily
    presentBtn.focus({preventScroll:true});
  }

  // ---------- Small UX helpers ----------
  // Flash input border or shake when empty add attempted
  function flashInputError() {
    taskInput.animate
      ? taskInput.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 220, easing: "cubic-bezier(.2,.9,.2,1)" })
      : null;
    taskInput.focus();
  }

  // highlight the newly added element by id (called after render)
  function flashAddedById(id) {
    const el = list.querySelector(`.item[data-id="${id}"]`);
    if (el) {
      el.classList.add("item-enter");
      setTimeout(() => el.classList.remove("item-enter"), 700);
    }
  }

  // Undo toast creation and handling
  function createUndoToast() {
    let toast = document.querySelector(".undo-toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.className = "undo-toast";
    toast.innerHTML = `<span class="msg">Task removed</span><button class="undo-btn" type="button">Undo</button>`;
    document.body.appendChild(toast);
    toast.querySelector(".undo-btn").addEventListener("click", () => {
      if (lastRemoved) {
        tasks.unshift(lastRemoved); // restore to top (simple)
        lastRemoved = null;
        renderTasks();
        hideUndoToast();
      }
    });
    return toast;
  }

  let undoTimer = null;
  function showUndoToast(removedTask) {
    hideUndoToast();
    lastRemoved = removedTask;
    const toast = createUndoToast();
    toast.classList.add("show");
    undoTimer = setTimeout(() => {
      hideUndoToast();
      lastRemoved = null;
    }, 5000);
  }
  function hideUndoToast() {
    const toast = document.querySelector(".undo-toast");
    if (!toast) return;
    toast.classList.remove("show");
    clearTimeout(undoTimer);
  }

  // ---------- Mutation observer to add enter animations for directly appended items ----------
  const listObserver = new MutationObserver((mutList) => {
    mutList.forEach((m) => {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType === 1 && n.classList && n.classList.contains("item")) {
          n.classList.add("item-enter");
          setTimeout(() => n.classList.remove("item-enter"), 700);
        }
      });
    });
  });
  listObserver.observe(list, { childList: true });

  // ---------- Wiring event listeners ----------
  addBtn.addEventListener("click", addTask);
  // replace keypress with keydown for better behavior
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  });

  filterSelect.addEventListener("change", renderTasks);
  sortSelect.addEventListener("change", renderTasks);
  clearAllBtn.addEventListener("click", clearAll);
  clearDoneBtn.addEventListener("click", clearDone);
  presentBtn.addEventListener("click", togglePresentMode);

  // keyboard shortcuts: + / - to change first visible item's score - not applicable here; keep simple:
  document.addEventListener("keydown", (e) => {
    // avoid triggering while typing in input
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
    if (e.key.toLowerCase() === "p") {
      togglePresentMode();
    }
  });

  // ---------- Initial render ----------
  renderTasks();

  // expose simple helpers for debugging
  window._todo = { renderTasks, tasks };
});
