/* ============================================================================
   STATS MANAGER - Statistics calculation and display
   ============================================================================ */

class StatsManager {
  constructor(storage) {
    this.storage = storage;
  }

  getStats(period = "today") {
    return this.storage.calculateStats(period);
  }

  renderActivityChart(period, canvasSelector) {
    const canvas = document.querySelector(canvasSelector);
    if (!canvas) return;

    canvas.innerHTML = "";

    let dates = [];
    if (period === "today") {
      dates = [Utilities.getTodayDate()];
    } else if (period === "week") {
      dates = Utilities.getWeekDates(7);
    } else {
      dates = Utilities.getWeekDates(30);
    }

    const sessionCounts = dates.map(
      (d) => this.storage.state.sessions.filter((s) => s.date === d).length,
    );
    const maxSessions = Math.max(...sessionCounts, 3);

    dates.forEach((date, i) => {
      const sessionsOnDate = sessionCounts[i];
      const percentage = (sessionsOnDate / maxSessions) * 100 || 5;

      const bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = `${Math.max(percentage, 8)}%`;
      bar.setAttribute(
        "title",
        `${date}: ${sessionsOnDate} session${sessionsOnDate !== 1 ? "s" : ""}`,
      );

      canvas.appendChild(bar);
    });
  }

  exportData() {
    const data = this.storage.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pomodoro-data-${Utilities.getTodayDate()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
