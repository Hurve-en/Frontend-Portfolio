/** ===============================
 *  APP.JS - Application Controller
 *  =============================== */

// Global app state
window.AppState = {
  viewDate: new Date(),
  selectedDate: null,
  events: {},
};

const CalendarApp = (() => {
  // DOM references
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const todayBtn = document.getElementById("today-btn");
  const addEventBtn = document.getElementById("add-event");
  const daysGrid = document.getElementById("days-grid");

  // Initialize app
  function init() {
    const appState = window.AppState;

    // Load persisted state
    StorageManager.loadState(appState);

    // Set initial selected date to today
    if (!appState.selectedDate) {
      appState.selectedDate = Utils.toISODate(new Date());
    }

    // Render initial UI
    CalendarView.render(appState);
    EventsView.renderSelectedDay(appState);

    // Attach event listeners
    attachEventListeners();

    // Save on page unload
    window.addEventListener("beforeunload", () => {
      StorageManager.saveState(appState);
    });
  }

  // Attach all event listeners
  function attachEventListeners() {
    const appState = window.AppState;

    // Month navigation
    prevMonthBtn.addEventListener("click", () => {
      appState.viewDate = new Date(
        appState.viewDate.getFullYear(),
        appState.viewDate.getMonth() - 1,
        1,
      );
      StorageManager.saveState(appState);
      CalendarView.render(appState);
    });

    nextMonthBtn.addEventListener("click", () => {
      appState.viewDate = new Date(
        appState.viewDate.getFullYear(),
        appState.viewDate.getMonth() + 1,
        1,
      );
      StorageManager.saveState(appState);
      CalendarView.render(appState);
    });

    // Today button
    todayBtn.addEventListener("click", () => {
      appState.viewDate = new Date();
      appState.selectedDate = Utils.toISODate(new Date());
      StorageManager.saveState(appState);
      CalendarView.render(appState);
      EventsView.renderSelectedDay(appState);
    });

    // Add event button
    addEventBtn.addEventListener("click", () => {
      const targetDate = appState.selectedDate || Utils.toISODate(new Date());
      EventModal.openForDate(targetDate);
    });

    // Keyboard navigation (arrow keys for months)
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
  }

  // Public API
  return {
    init,
  };
})();

// Start app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  CalendarApp.init();
});
