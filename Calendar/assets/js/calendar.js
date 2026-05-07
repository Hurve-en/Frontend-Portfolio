/** ===============================
 *  CALENDAR.JS - Calendar Rendering
 *  =============================== */

const CalendarView = (() => {
  // DOM references
  const daysGrid = document.getElementById("days-grid");
  const currentMonthLabel = document.getElementById("current-month");
  const weekdays = document.querySelector(".weekdays");

  // Render the calendar grid for the month
  function render(appState) {
    daysGrid.innerHTML = "";

    const view = new Date(
      appState.viewDate.getFullYear(),
      appState.viewDate.getMonth(),
      1,
    );
    currentMonthLabel.textContent = Utils.niceMonthYear(view);

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

      const iso = Utils.toISODate(cellDate);
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = cellDate.getDate();
      cell.appendChild(num);

      // Event indicator dots with category colors
      const dots = document.createElement("div");
      dots.className = "events-dot";
      const evs = appState.events[iso] || [];
      evs.slice(0, 3).forEach((e) => {
        const dot = document.createElement("div");
        dot.className = "event-dot";
        dot.style.background = Utils.getCategoryColor(e.category);
        dot.title = e.title;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);

      // Style for today
      const todayIso = Utils.toISODate(new Date());
      if (iso === todayIso) {
        cell.classList.add("today");
      }

      // Style for selected
      if (iso === appState.selectedDate) {
        cell.classList.add("selected");
      }

      // Click to select day
      cell.addEventListener("click", () => {
        appState.selectedDate = iso;
        StorageManager.saveState(appState);
        render(appState);
        EventsView.renderSelectedDay(appState);
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

  // Public API
  return {
    render,
  };
})();
