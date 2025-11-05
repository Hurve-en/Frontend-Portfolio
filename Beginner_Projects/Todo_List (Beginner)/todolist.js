document.addEventListener("DOMContentLoaded", () => {
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

  let tasks = [];
  let presentMode = false;

  function renderTasks() {
    list.innerHTML = "";

    let filtered = tasks.filter((t) => {
      if (filterSelect.value === "done") return t.done;
      if (filterSelect.value === "active") return !t.done;
      return true;
    });

    if (sortSelect.value === "priority") {
      const priorityOrder = { high: 1, normal: 2, low: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortSelect.value === "oldest") {
      filtered.sort((a, b) => a.created - b.created);
    } else {
      filtered.sort((a, b) => b.created - a.created);
    }

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

        item.dataset.id = task.id;
        textDiv.textContent = task.text;
        priorityTag.textContent = task.priority;

        item.classList.toggle("done", task.done);
        priorityTag.classList.add(task.priority);

        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => toggleDone(task.id));
        editBtn.addEventListener("click", () => editTask(task.id));
        removeBtn.addEventListener("click", () => removeTask(task.id));

        list.appendChild(clone);
      });
    }

    updateCounters();
  }

  function updateCounters() {
    totalCount.textContent = `${tasks.length} total`;
    const doneTasks = tasks.filter((t) => t.done).length;
    doneCount.textContent = `${doneTasks} done`;
  }

  function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (text === "") {
      alert("Please enter a task.");
      return;
    }

    const newTask = {
      id: Date.now(),
      text,
      priority,
      done: false,
      created: Date.now(),
    };

    tasks.push(newTask);
    taskInput.value = "";
    renderTasks();
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
      const newText = prompt("Edit task:", task.text);
      if (newText !== null && newText.trim() !== "") {
        task.text = newText.trim();
        renderTasks();
      }
    }
  }

  function removeTask(id) {
    if (confirm("Remove this task?")) {
      tasks = tasks.filter((t) => t.id !== id);
      renderTasks();
    }
  }

  function clearAll() {
    if (tasks.length > 0 && confirm("Clear all tasks?")) {
      tasks = [];
      renderTasks();
    }
  }

  function clearDone() {
    if (tasks.some((t) => t.done) && confirm("Remove all completed tasks?")) {
      tasks = tasks.filter((t) => !t.done);
      renderTasks();
    }
  }

  // ✅ Present mode toggle — now functional!
  function togglePresentMode() {
    presentMode = !presentMode;
    document.body.classList.toggle("present-mode", presentMode);
    presentBtn.textContent = presentMode ? "Exit Present Mode" : "Present Mode";
  }

  // Event Listeners
  addBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => e.key === "Enter" && addTask());
  filterSelect.addEventListener("change", renderTasks);
  sortSelect.addEventListener("change", renderTasks);
  clearAllBtn.addEventListener("click", clearAll);
  clearDoneBtn.addEventListener("click", clearDone);
  presentBtn.addEventListener("click", togglePresentMode);

  renderTasks();
});
