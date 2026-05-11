/* App Module - Event listeners and initialization */

const App = (() => {
  // Initialize app
  function init() {
    // Load data and render UI
    Storage.loadStore();
    Theme.loadTheme();
    UI.updateGreeting();
    UI.renderMoodFilters();
    Filters.renderEntriesList();
    UI.renderEditorFor(null);
    UI.renderMoodSelector(null);

    // Load draft if any
    Actions.loadDraftIfAny();
    UI.updateWordCount();

    // Wire event listeners
    wireListeners();
  }

  // Wire all event listeners
  function wireListeners() {
    // Header buttons
    document.getElementById("newEntryBtn").addEventListener("click", () => {
      Actions.openEditor();
    });

    document.getElementById("exportAllBtn").addEventListener("click", () => {
      Actions.exportAll();
    });

    document.getElementById("importBtn").addEventListener("click", () => {
      document.getElementById("importInput").click();
    });

    document.getElementById("importInput").addEventListener("change", (ev) => {
      const f = ev.target.files[0];
      if (f) Export.importJSON(f);
      ev.target.value = "";
    });

    document.getElementById("downloadJsonBtn").addEventListener("click", () => {
      Export.downloadJSON();
    });

    document.getElementById("themeBtn").addEventListener("click", () => {
      Theme.toggleTheme();
    });

    // Search and filters
    document
      .getElementById("searchInput")
      .addEventListener("input", () => Filters.renderEntriesList());

    document
      .getElementById("quickFilter")
      .addEventListener("change", () => Filters.renderEntriesList());

    document
      .getElementById("dateFrom")
      .addEventListener("change", () => Filters.renderEntriesList());

    document
      .getElementById("dateTo")
      .addEventListener("change", () => Filters.renderEntriesList());

    // Editor form
    const entryForm = document.getElementById("entryForm");

    document.getElementById("saveBtn").addEventListener("click", (ev) => {
      ev.preventDefault();
      if (Actions.getCurrentId()) {
        Actions.updateEntry();
      } else {
        Actions.createEntry();
      }
    });

    document.getElementById("saveBtnBottom").addEventListener("click", (ev) => {
      ev.preventDefault();
      if (Actions.getCurrentId()) {
        Actions.updateEntry();
      } else {
        Actions.createEntry();
      }
    });

    document.getElementById("cancelBtn").addEventListener("click", (ev) => {
      ev.preventDefault();
      Actions.cancelEdit();
    });

    document
      .getElementById("cancelBtnBottom")
      .addEventListener("click", (ev) => {
        ev.preventDefault();
        Actions.cancelEdit();
      });

    document.getElementById("deleteBtn").addEventListener("click", (ev) => {
      ev.preventDefault();
      Actions.deleteEntry();
    });

    document.getElementById("exportEntryBtn").addEventListener("click", () => {
      Actions.exportEntry();
    });

    // Editor input listeners for auto-save and word count
    document.getElementById("bodyInput").addEventListener("input", () => {
      UI.updateWordCount();
      Actions.scheduleAutoSave();
    });

    document
      .getElementById("titleInput")
      .addEventListener("input", () => Actions.scheduleAutoSave());

    document
      .getElementById("tagsInput")
      .addEventListener("input", () => Actions.scheduleAutoSave());

    // Keyboard shortcuts
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "n" || ev.key === "N") {
        ev.preventDefault();
        Actions.openEditor();
        document.getElementById("titleInput").focus();
      }
      if (ev.key === "/") {
        ev.preventDefault();
        document.getElementById("searchInput").focus();
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
  App.init();
});
