const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const progressBar = document.getElementById("progressBar");
const presentBtn = document.getElementById("presentBtn");
const template = document.getElementById("task-template");

const pomodoro = document.getElementById("pomodoro");
const minutesInput = document.getElementById("minutesInput");
const secondsInput = document.getElementById("secondsInput");
const timerDisplay = document.getElementById("timerDisplay");
const startTimer = document.getElementById("startTimer");
const resetTimer = document.getElementById("resetTimer");

let tasks = [];
let presentMode = false;

/* ---------- TODOS ---------- */
function render() {
  list.innerHTML = "";
  empty.style.display = tasks.length ? "none" : "block";

  tasks.forEach((t) => {
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector(".item");
    const checkbox = clone.querySelector(".task-checkbox");
    const text = clone.querySelector(".text");
    const priority = clone.querySelector(".priority");
    const remove = clone.querySelector(".remove");

    text.textContent = t.text;
    priority.textContent = t.priority;
    checkbox.checked = t.done;

    checkbox.onchange = () => {
      t.done = checkbox.checked;
      render();
    };

    remove.onclick = () => {
      tasks = tasks.filter((x) => x !== t);
      render();
    };

    list.appendChild(clone);
  });

  totalCount.textContent = `${tasks.length} total`;
  const done = tasks.filter((t) => t.done).length;
  doneCount.textContent = `${done} done`;
  progressBar.style.width = tasks.length
    ? (done / tasks.length) * 100 + "%"
    : "0%";
}

addBtn.onclick = () => {
  if (!taskInput.value.trim()) return;
  tasks.push({
    text: taskInput.value,
    priority: prioritySelect.value,
    done: false,
  });
  taskInput.value = "";
  render();
};

taskInput.onkeydown = (e) => {
  if (e.key === "Enter") addBtn.click();
};

/* ---------- PRESENT MODE ---------- */
presentBtn.onclick = () => {
  presentMode = !presentMode;
  document.body.classList.toggle("present", presentMode);
  presentBtn.textContent = presentMode ? "Exit Presentation" : "Presentation";
};

/* ---------- POMODORO ---------- */
let timer = null;
let remaining = 0;

function updateDisplay() {
  const m = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

startTimer.onclick = () => {
  if (timer) return;
  remaining = +minutesInput.value * 60 + +secondsInput.value;
  updateDisplay();

  timer = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(timer);
      timer = null;
      return;
    }
    remaining--;
    updateDisplay();
  }, 1000);
};

resetTimer.onclick = () => {
  clearInterval(timer);
  timer = null;
  remaining = +minutesInput.value * 60 + +secondsInput.value;
  updateDisplay();
};

updateDisplay();
