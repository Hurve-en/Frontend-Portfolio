/* ============================================================================
   UI RENDERER - DOM manipulation and display updates
   ============================================================================ */

class UIRenderer {
  constructor() {
    this.elements = this.cacheElements();
  }

  cacheElements() {
    return {
      moodPad: document.querySelector(".mood-pad"),
      todaySummary: document.getElementById("todaySummary"),
      noteInput: document.getElementById("noteInput"),
      historyPreview: document.getElementById("historyPreview"),
      trendCanvas: document.getElementById("trendCanvas"),
      distributionCanvas: document.getElementById("distributionCanvas"),
      moodModal: document.getElementById("moodModal"),
      historyModal: document.getElementById("historyModal"),
      weeklyModal: document.getElementById("weeklyModal"),
      dataModal: document.getElementById("dataModal"),
      modalMoodPad: document.getElementById("modalMoodPad"),
      modalNote: document.getElementById("modalNote"),
      calendarGrid: document.getElementById("calendarGrid"),
      weeklyReportContent: document.getElementById("weeklyReportContent"),
      saveTodayBtn: document.getElementById("saveToday"),
      openEditModal: document.getElementById("openEditModal"),
      openHistory: document.getElementById("openHistory"),
      viewWeekly: document.getElementById("viewWeekly"),
      saveModal: document.getElementById("saveModal"),
      cancelModal: document.getElementById("cancelModal"),
      addMoodFab: document.getElementById("addMoodFab"),
      exportData: document.getElementById("exportData"),
      downloadBackup: document.getElementById("downloadBackup"),
      uploadBackup: document.getElementById("uploadBackup"),
      resetData: document.getElementById("resetData"),
      themeToggle: document.getElementById("themeToggle"),
      darkMode: document.getElementById("darkMode"),
      showCharts: document.getElementById("showCharts"),
      fontSizeSelect: document.getElementById("fontSize"),
      filterMood: document.getElementById("filterMood"),
      avgMood: document.getElementById("avgMood"),
      streak: document.getElementById("streak"),
      mostCommon: document.getElementById("mostCommon"),
      totalEntries: document.getElementById("totalEntries"),
      toast: document.getElementById("toast"),
      loadingSpinner: document.getElementById("loadingSpinner"),
    };
  }

  renderMoodButtons(container) {
    container.innerHTML = "";
    MOODS.forEach((mood) => {
      const btn = document.createElement("button");
      btn.className = "mood-btn";
      btn.type = "button";
      btn.setAttribute("data-id", mood.id);
      btn.setAttribute("aria-label", mood.label);
      btn.setAttribute("title", mood.label);
      btn.innerHTML = `<div>${mood.emoji}</div>`;
      container.appendChild(btn);
    });
  }

  highlightMood(container, moodId) {
    container.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === moodId);
    });
  }

  renderTodaySummary(entry) {
    if (!entry) {
      this.elements.todaySummary.innerHTML =
        '<div class="empty">No mood recorded today — pick an emoji above.</div>';
      return;
    }

    const mood = Utilities.getMoodById(entry.mood);
    this.elements.todaySummary.innerHTML = `
      <div class="summary-emoji">${mood.emoji}</div>
      <div>
        <div class="summary-text">${mood.label}</div>
        <div class="muted small">${entry.note ? entry.note.slice(0, 120) : "No note"}</div>
      </div>
    `;
  }

  renderHistoryPreview(entries) {
    this.elements.historyPreview.innerHTML = "";
    const days = 14;

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = Utilities.keyForDate(d);
      const entry = entries.find((e) => e.date === key);
      const mood = entry ? Utilities.getMoodById(entry.mood) : null;

      const dayEl = document.createElement("div");
      dayEl.className = "history-day";
      dayEl.innerHTML = `
        <div class="day">${Utilities.formatDate(key)}</div>
        <div class="emoji">${mood ? mood.emoji : "—"}</div>
      `;
      dayEl.style.cursor = "pointer";
      dayEl.addEventListener("click", () => this.openEditModal(key));
      this.elements.historyPreview.appendChild(dayEl);
    }
  }

  renderCalendar(entries) {
    this.elements.calendarGrid.innerHTML = "";
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = Utilities.keyForDate(d);
      const entry = entries.find((e) => e.date === key);
      const mood = entry ? Utilities.getMoodById(entry.mood) : null;

      const dayCard = document.createElement("div");
      dayCard.className = "calendar-day";
      dayCard.innerHTML = `
        <div class="small muted">${Utilities.formatDate(key, { weekday: "short", month: "short", day: "numeric" })}</div>
        <div class="emoji" style="font-size:20px;">${mood ? mood.emoji : "—"}</div>
        <div class="muted small">${entry && entry.note ? entry.note.slice(0, 40) : ""}</div>
      `;
      dayCard.style.cursor = "pointer";
      dayCard.addEventListener("click", () => this.openEditModal(key));
      this.elements.calendarGrid.appendChild(dayCard);
    }
  }

  renderStatistics(stats) {
    this.elements.avgMood.textContent = stats.average || "—";
    this.elements.streak.textContent = `${stats.streak} 🔥`;
    this.elements.mostCommon.textContent = stats.mostCommon
      ? stats.mostCommon.emoji
      : "—";
  }

  renderWeeklyReport(summary) {
    const html = `
      <div class="report-section">
        <h4>📊 Weekly Overview</h4>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Days Tracked</div>
            <div class="stat-value">${summary.recordedDays}/${summary.totalDays}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Average Mood</div>
            <div class="stat-value">${summary.average}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Streak</div>
            <div class="stat-value">${summary.streak} 🔥</div>
          </div>
        </div>
      </div>
      <div class="report-section">
        <h4>😊 Mood Distribution</h4>
        <div class="distribution-list">
          ${Object.entries(summary.distribution)
            .map(
              ([moodId, data]) => `
            <div class="distribution-item">
              <div class="dist-label">${data.emoji} ${data.label}</div>
              <div class="dist-bar">
                <div class="dist-fill" style="width: ${(data.count / 7) * 100}%"></div>
              </div>
              <div class="dist-count">${data.count}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      <div class="report-section">
        <h4>✨ Insights</h4>
        <div class="insights-list">
          ${summary.insights
            .map(
              (insight) => `
            <div class="insight-item insight-${insight.type}">
              ${insight.text}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    this.elements.weeklyReportContent.innerHTML = html;
  }

  showToast(message, duration = CONFIG.TOAST_DURATION) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add("show");
    setTimeout(() => {
      this.elements.toast.classList.remove("show");
    }, duration);
  }

  openEditModal(dateStr) {
    this.elements.moodModal.dataset.date = dateStr;
    const formattedDate = Utilities.formatDate(dateStr, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.getElementById("modalDateInfo").textContent = formattedDate;
    this.elements.moodModal.showModal();
  }

  updateStats(stats) {
    this.elements.totalEntries.textContent = stats.totalEntries;
  }
}
