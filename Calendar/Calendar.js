// Calendar logic for the modern minimalist planner

/* Minimalist Planner v2
   - switch months with smooth transitions
   - add, edit, delete events with categories
   - highlight today and selected day
   - save data in localStorage
   - dark mode support
*/

const STORAGE_KEY = "mini-planner-v2";

// App state
const appState = {
  viewDate: new Date(),
  selectedDate: null,
  events: {},
};

// DOM refs
const daysGrid = document.getElementById("days-grid");
const currentMonthLabel = document.getElementById("current-month");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const todayBtn = document.getElementById("today-btn");
const selectedDateEl = document.getElementById("selected-date");
const selectedWeekdayEl = document.getElementById("selected-weekday");
const eventsList = document.getElementById("events-list");
const addEventBtn = document.getElementById("add-event");

const modal = document.getElementById("modal");
const evtForm = document.getElementById("event-form");
const evtTitle = document.getElementById("evt-title");
const evtCategory = document.getElementById("evt-category");
const evtTime = document.getElementById("evt-time");
const evtDesc = document.getElementById("evt-desc");
const evtDate = document.getElementById("evt-date");
const saveEventBtn = document.getElementById("save-event");
const cancelEventBtn = document.getElementById("cancel-event");
const deleteEventBtn = document.getElementById("delete-event");

let editingEvent = null;

// Utility helpers
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function fromISODate(iso) {
  const [y, m, dd] = iso.split("-").map(Number);
  return new Date(y, m - 1, dd);
}

function niceMonthYear(d) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function weekdayName(d) {
  return d.toLocaleString(undefined, { weekday: "long" });
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m],
  );
}

// Persistence
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.viewDate) appState.viewDate = new Date(parsed.viewDate);
    if (parsed.selectedDate) appState.selectedDate = parsed.selectedDate;
    if (parsed.events) appState.events = parsed.events;
  } catch (e) {
    console.warn("Load failed", e);
  }
}

function saveState() {
  const toSave = {
    viewDate: appState.viewDate.toISOString(),
    selectedDate: appState.selectedDate,
    events: appState.events,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Calendar rendering with improved visuals
function renderCalendar() {
  daysGrid.innerHTML = "";

  const view = new Date(
    appState.viewDate.getFullYear(),
    appState.viewDate.getMonth(),
    1,
  );
  currentMonthLabel.textContent = niceMonthYear(view);

  const firstWeekday = view.getDay();
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();

  const prevMonthDays = firstWeekday;
  const prevMonthLastDate = new Date(
    view.getFullYear(),
    view.getMonth(),
    0,
  ).getDate();

  const totalCells = 42;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.setAttribute("role", "gridcell");

    let cellDate;
    if (i < prevMonthDays) {
      const d = prevMonthLastDate - prevMonthDays + 1 + i;
      cellDate = new Date(view.getFullYear(), view.getMonth() - 1, d);
      cell.classList.add("out");
    } else if (i >= prevMonthDays + daysInMonth) {
      const d = i - (prevMonthDays + daysInMonth) + 1;
      cellDate = new Date(view.getFullYear(), view.getMonth() + 1, d);
      cell.classList.add("out");
    } else {
      const d = i - prevMonthDays + 1;
      cellDate = new Date(view.getFullYear(), view.getMonth(), d);
    }

    const iso = toISODate(cellDate);
    const num = document.createElement("div");
    num.className = "num";
    num.textContent = cellDate.getDate();
    cell.appendChild(num);

    // Event indicators with category colors
    const dots = document.createElement("div");
    dots.className = "events-dot";
    const evs = appState.events[iso] || [];
    evs.slice(0, 3).forEach((e) => {
      const dot = document.createElement("div");
      dot.className = "event-dot";
      const categoryColor = {
        work: "var(--cat-work)",
        personal: "var(--cat-personal)",
        health: "var(--cat-health)",
        other: "var(--cat-other)",
      };
      dot.style.background = categoryColor[e.category] || categoryColor.other;
      dot.title = e.title;
      dots.appendChild(dot);
    });
    cell.appendChild(dots);

    // Styling for today
    const todayIso = toISODate(new Date());
    if (iso === todayIso) {
      cell.classList.add("today");
    }

    // Styling for selected
    if (iso === appState.selectedDate) {
      cell.classList.add("selected");
    }

    // Click handler
    cell.addEventListener("click", () => {
      appState.selectedDate = iso;
      saveState();
      renderCalendar();
      renderSelectedDay();
    });

    // Keyboard navigation
    cell.setAttribute("tabindex", "0");
    cell.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        cell.click();
      }
    });

    daysGrid.appendChild(cell);
  }
}

// Render selected day panel with events and categories
function renderSelectedDay() {
  if (!appState.selectedDate) {
    selectedDateEl.textContent = "—";
    selectedWeekdayEl.textContent = "Select a day";
    eventsList.innerHTML = `<p class="muted small">No day selected — choose a day on the calendar.</p>`;
    return;
  }

  const d = fromISODate(appState.selectedDate);
  selectedDateEl.textContent = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  selectedWeekdayEl.textContent = weekdayName(d);

  const evs = (appState.events[appState.selectedDate] || [])
    .slice()
    .sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

  if (evs.length === 0) {
    eventsList.innerHTML = `<p class="muted small">No events for this day. Click +Add to create one.</p>`;
    return;
  }

  eventsList.innerHTML = "";
  evs.forEach((ev) => {
    const item = document.createElement("div");
    item.className = `event-item cat-${ev.category || "other"}`;

    const timeStr = ev.time
      ? `<div class="event-time">${ev.time}</div>`
      : `<div class="event-time muted small">All day</div>`;

    const categoryBadge = ev.category
      ? `<span class="event-category ${ev.category}">${ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}</span>`
      : "";

    item.innerHTML = `
      <div class="meta">
        <div style="flex: 1">
          <div class="title">${escapeHtml(ev.title)}</div>
          ${ev.desc ? `<div class="muted small">${escapeHtml(ev.desc)}</div>` : ""}
          ${categoryBadge}
        </div>
        <div>${timeStr}</div>
      </div>
    `;

    item.addEventListener("click", () =>
      openModalForEdit(appState.selectedDate, ev.id),
    );
    eventsList.appendChild(item);
  });
}

// Modal functions with category support
function openModalForDate(dateIso) {
  editingEvent = null;
  evtForm.reset();
  evtDate.value = dateIso;
  evtCategory.value = "other";
  deleteEventBtn.classList.add("hidden");
  modal.classList.remove("hidden");
  evtTitle.focus();
}

function openModalForEdit(dateIso, evId) {
  const evs = appState.events[dateIso] || [];
  const ev = evs.find((e) => e.id === evId);
  if (!ev) return;
  editingEvent = { id: evId, date: dateIso };
  evtTitle.value = ev.title;
  evtCategory.value = ev.category || "other";
  evtTime.value = ev.time || "";
  evtDesc.value = ev.desc || "";
  evtDate.value = dateIso;
  deleteEventBtn.classList.remove("hidden");
  modal.classList.remove("hidden");
  evtTitle.focus();
}

function closeModal() {
  editingEvent = null;
  modal.classList.add("hidden");
  evtForm.reset();
}

// Save event from modal form
evtForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = evtTitle.value.trim();
  if (!title) return alert("Please add a title.");

  const category = evtCategory.value || "other";
  const time = evtTime.value || null;
  const desc = evtDesc.value.trim() || null;
  const dateStr = evtDate.value;

  if (!dateStr) return alert("Invalid date.");

  if (!appState.events[dateStr]) appState.events[dateStr] = [];

  if (editingEvent) {
    // Update existing event
    const arr = appState.events[editingEvent.date];
    const idx = arr.findIndex((x) => x.id === editingEvent.id);
    if (idx !== -1) {
      arr[idx].title = title;
      arr[idx].category = category;
      arr[idx].time = time;
      arr[idx].desc = desc;

      // If date changed, move event
      if (editingEvent.date !== dateStr) {
        const movedEvent = arr.splice(idx, 1)[0];
        if (!appState.events[dateStr]) appState.events[dateStr] = [];
        appState.events[dateStr].push(movedEvent);
        // Cleanup empty arrays
        if (arr.length === 0) delete appState.events[editingEvent.date];
      }
    }
  } else {
    // Create new event
    const newEv = {
      id: "e_" + Date.now().toString(36),
      title,
      category,
      time,
      desc,
    };
    appState.events[dateStr].push(newEv);
  }

  saveState();
  closeModal();
  renderCalendar();
  appState.selectedDate = dateStr;
  renderSelectedDay();
});

// Delete event handler
deleteEventBtn.addEventListener("click", () => {
  if (!editingEvent) return;
  const arr = appState.events[editingEvent.date] || [];
  const idx = arr.findIndex((x) => x.id === editingEvent.id);
  if (idx !== -1) arr.splice(idx, 1);
  // Cleanup empty arrays
  if (arr.length === 0) delete appState.events[editingEvent.date];
  saveState();
  closeModal();
  renderCalendar();
  if (appState.selectedDate === editingEvent.date) renderSelectedDay();
});

// Cancel button
cancelEventBtn.addEventListener("click", () => closeModal());

// Close modal on backdrop click
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Calendar navigation and controls
prevMonthBtn.addEventListener("click", () => {
  appState.viewDate = new Date(
    appState.viewDate.getFullYear(),
    appState.viewDate.getMonth() - 1,
    1,
  );
  saveState();
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  appState.viewDate = new Date(
    appState.viewDate.getFullYear(),
    appState.viewDate.getMonth() + 1,
    1,
  );
  saveState();
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  appState.viewDate = new Date();
  appState.selectedDate = toISODate(new Date());
  saveState();
  renderCalendar();
  renderSelectedDay();
});

addEventBtn.addEventListener("click", () => {
  const targetDate = appState.selectedDate || toISODate(new Date());
  openModalForDate(targetDate);
});

// Keyboard navigation for months
daysGrid.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prevMonthBtn.click();
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    nextMonthBtn.click();
  }
});

// App initialization
(function bootstrap() {
  loadState();
  if (!appState.selectedDate) appState.selectedDate = toISODate(new Date());
  renderCalendar();
  renderSelectedDay();
})();

// Save state before leaving
window.addEventListener("beforeunload", saveState);
