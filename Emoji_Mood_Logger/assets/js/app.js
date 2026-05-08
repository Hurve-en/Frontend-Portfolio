/* ============================================================================
   MOOD LOGGER APP - Main application controller
   ============================================================================ */

class MoodLoggerApp {
  constructor() {
    this.storage = new StorageManager();
    this.ui = new UIRenderer();
    this.selectedMood = null;
    this.modalSelectedMood = null;
    this.init();
  }

  init() {
    this.storage.init();
    this.attachEventListeners();
    this.loadTheme();
    this.render();
  }

  attachEventListeners() {
    this.ui.elements.moodPad.addEventListener("click", (e) =>
      this.handleMoodSelect(e, false),
    );
    this.ui.elements.modalMoodPad.addEventListener("click", (e) =>
      this.handleMoodSelect(e, true),
    );

    this.ui.elements.saveTodayBtn.addEventListener("click", () =>
      this.saveToday(),
    );
    this.ui.elements.openEditModal.addEventListener("click", () => {
      this.ui.openEditModal(Utilities.keyForDate());
    });
    this.ui.elements.addMoodFab.addEventListener("click", () => {
      this.ui.openEditModal(Utilities.keyForDate());
    });

    this.ui.elements.openHistory.addEventListener("click", () =>
      this.openHistoryModal(),
    );
    this.ui.elements.viewWeekly.addEventListener("click", () =>
      this.openWeeklyModal(),
    );

    this.ui.elements.saveModal.addEventListener("click", () =>
      this.saveModalEntry(),
    );
    this.ui.elements.cancelModal.addEventListener("click", () =>
      this.ui.elements.moodModal.close(),
    );

    document
      .getElementById("closeHistoryBtn")
      ?.addEventListener("click", () => this.ui.elements.historyModal.close());
    document
      .getElementById("closeWeeklyBtn")
      ?.addEventListener("click", () => this.ui.elements.weeklyModal.close());
    document
      .getElementById("closeMoodModalBtn")
      ?.addEventListener("click", () => this.ui.elements.moodModal.close());
    document
      .getElementById("closeDataModalBtn")
      ?.addEventListener("click", () => this.ui.elements.dataModal.close());

    this.ui.elements.themeToggle.addEventListener("click", () =>
      this.toggleTheme(),
    );
    this.ui.elements.darkMode.addEventListener("change", (e) => {
      this.setTheme(e.target.checked ? "dark" : "light");
    });
    this.ui.elements.showCharts.addEventListener("change", (e) => {
      this.ui.elements.trendCanvas.style.display = e.target.checked
        ? "block"
        : "none";
      this.ui.elements.distributionCanvas.style.display = e.target.checked
        ? "block"
        : "none";
    });
    this.ui.elements.fontSizeSelect.addEventListener("change", (e) => {
      document.documentElement.style.fontSize = e.target.value + "px";
    });

    this.ui.elements.exportData.addEventListener("click", () =>
      this.ui.elements.dataModal.showModal(),
    );
    document
      .getElementById("exportCSV")
      ?.addEventListener("click", () => this.exportData("csv"));
    document
      .getElementById("exportJSON")
      ?.addEventListener("click", () => this.exportData("json"));
    document
      .getElementById("importData")
      ?.addEventListener("click", () => this.importData());
    this.ui.elements.downloadBackup.addEventListener("click", () =>
      this.downloadBackup(),
    );
    this.ui.elements.uploadBackup.addEventListener("click", () =>
      this.uploadBackup(),
    );
    this.ui.elements.resetData.addEventListener("click", () =>
      this.confirmClearAll(),
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.ui.elements.moodModal.close();
        this.ui.elements.historyModal.close();
        this.ui.elements.weeklyModal.close();
        this.ui.elements.dataModal.close();
      }
    });

    this.ui.elements.filterMood.addEventListener("change", () =>
      this.applyFilter(),
    );

    this.ui.renderMoodButtons(this.ui.elements.moodPad);
    this.ui.renderMoodButtons(this.ui.elements.modalMoodPad);
  }

  handleMoodSelect(event, isModal = false) {
    const btn = event.target.closest(".mood-btn");
    if (!btn) return;

    const moodId = btn.dataset.id;
    if (isModal) {
      this.modalSelectedMood = moodId;
      this.ui.highlightMood(this.ui.elements.modalMoodPad, moodId);
    } else {
      this.selectedMood = moodId;
      this.ui.highlightMood(this.ui.elements.moodPad, moodId);
    }
  }

  saveToday() {
    if (!this.selectedMood) {
      this.ui.showToast("Select an emoji to record your mood");
      return;
    }

    const today = Utilities.keyForDate();
    const note = this.ui.elements.noteInput.value;

    if (this.storage.saveEntry(today, this.selectedMood, note)) {
      this.ui.showToast("✓ Mood saved successfully");
      this.render();
    } else {
      this.ui.showToast("Error saving mood. Please try again.");
    }
  }

  saveModalEntry() {
    if (!this.modalSelectedMood) {
      this.ui.showToast("Select an emoji first");
      return;
    }

    const dateStr =
      this.ui.elements.moodModal.dataset.date || Utilities.keyForDate();
    const note = this.ui.elements.modalNote.value;

    if (this.storage.saveEntry(dateStr, this.modalSelectedMood, note)) {
      this.ui.elements.moodModal.close();
      this.ui.showToast("✓ Mood updated");
      this.render();
    } else {
      this.ui.showToast("Error saving mood");
    }
  }

  render() {
    const entries = this.storage.getEntries();
    const todayKey = Utilities.keyForDate();
    const today = entries.find((e) => e.date === todayKey);

    this.ui.renderTodaySummary(today);
    this.ui.renderHistoryPreview(entries);

    const calc = new StatisticsCalculator(entries);
    const stats = calc.getWeeklyStats();
    this.ui.renderStatistics(stats);

    if (this.ui.elements.showCharts.checked) {
      ChartManager.drawTrendChart("trendCanvas", entries);
      ChartManager.drawDistributionChart("distributionCanvas", entries);
    }

    const storageStats = this.storage.getStats();
    this.ui.updateStats(storageStats);

    if (today) {
      this.selectedMood = today.mood;
      this.ui.highlightMood(this.ui.elements.moodPad, today.mood);
      this.ui.elements.noteInput.value = today.note || "";
    } else {
      this.selectedMood = null;
      this.ui.highlightMood(this.ui.elements.moodPad, null);
      this.ui.elements.noteInput.value = "";
    }
  }

  openHistoryModal() {
    this.ui.renderCalendar(this.storage.getEntries());
    this.ui.elements.historyModal.showModal();
  }

  openWeeklyModal() {
    const calc = new StatisticsCalculator(this.storage.getEntries());
    const summary = calc.getWeeklySummary();
    this.ui.renderWeeklyReport(summary);
    this.ui.elements.weeklyModal.showModal();
  }

  exportData(format) {
    let data, filename, mimeType;

    if (format === "csv") {
      data = this.storage.exportCSV();
      filename = `mood-history-${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    } else {
      data = this.storage.exportJSON();
      filename = `mood-history-${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.ui.showToast(`✓ Data exported as ${format.toUpperCase()}`);
  }

  importData() {
    const fileInput = document.getElementById("importFile");
    if (!fileInput.files.length) {
      this.ui.showToast("Select a file to import");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (file.name.endsWith(".json")) {
          if (this.storage.importJSON(e.target.result)) {
            this.ui.showToast("✓ Data imported successfully");
            this.render();
          }
        } else {
          this.ui.showToast("Only JSON files are supported for import");
        }
      } catch (error) {
        this.ui.showToast("Error importing data");
      }
    };

    reader.readAsText(file);
  }

  downloadBackup() {
    this.exportData("json");
  }

  uploadBackup() {
    document.getElementById("importFile").click();
  }

  confirmClearAll() {
    if (
      confirm("⚠️ Are you sure? This will permanently delete all mood entries.")
    ) {
      this.storage.clearAll();
      this.render();
      this.ui.showToast("✓ All data cleared");
    }
  }

  applyFilter() {
    const filterValue = this.ui.elements.filterMood.value;
    const entries = this.storage.getEntries();

    const filtered =
      filterValue === "all"
        ? entries
        : entries.filter((e) => e.mood === filterValue);
    this.ui.renderHistoryPreview(filtered);
  }

  toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    this.setTheme(next);
  }

  setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    this.ui.elements.darkMode.checked = theme === "dark";
    this.ui.showToast(
      `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode activated`,
    );
  }

  loadTheme() {
    const stored = localStorage.getItem(CONFIG.THEME_KEY);
    const systemPrefers = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (stored) {
      this.setTheme(stored);
    } else if (systemPrefers) {
      this.setTheme("dark");
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  window.moodApp = new MoodLoggerApp();
});
