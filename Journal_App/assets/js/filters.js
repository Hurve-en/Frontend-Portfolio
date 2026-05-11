/* Filters Module - Filtering and searching entries */

const Filters = (() => {
  // Get list of selected mood filters
  function getActiveMoodFilters() {
    return Array.from(document.querySelectorAll(".mood-chip.active")).map(
      (b) => b.dataset.mood,
    );
  }

  // Filter and render entries list
  function renderEntriesList() {
    const searchInput = document.getElementById("searchInput");
    const quickFilter = document.getElementById("quickFilter");
    const dateFrom = document.getElementById("dateFrom");
    const dateTo = document.getElementById("dateTo");
    const entries = Storage.getAllEntries();

    const q = (searchInput.value || "").toLowerCase();
    const from = dateFrom.value || null;
    const to = dateTo.value || null;
    const quick = quickFilter.value || "all";
    const activeMoods = getActiveMoodFilters();

    const filtered = entries
      .filter((e) => {
        if (quick === "today") {
          if (e.date !== Utils.todayKey()) return false;
        } else if (quick === "7days") {
          const then = new Date();
          then.setDate(then.getDate() - 7);
          if (new Date(e.date) < then) return false;
        } else if (quick === "month") {
          const now = new Date();
          if (new Date(e.date).getMonth() !== now.getMonth()) return false;
        }
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        if (activeMoods.length && !activeMoods.includes(e.mood)) return false;
        if (q) {
          const hay = ((e.title || "") + " " + (e.body || "")).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    UI.renderEntriesList(filtered);
  }

  // Public API
  return {
    renderEntriesList,
    getActiveMoodFilters,
  };
})();
