/* Statistics Management */
class StatsManager {
  constructor(state) {
    this.state = state;
    this.currentPeriod = "week";
    this.initElements();
    this.attachEventListeners();
    this.render();
  }

  initElements() {
    this.elements = {
      statCards: document.querySelectorAll(".stat-card"),
      periodBtns: document.querySelectorAll(".period-btn"),
      completionRing: document.getElementById("completionRing"),
      completionValue: document.getElementById("completionRate"),
      streakValue: document.getElementById("currentStreak"),
      focusValue: document.getElementById("totalFocusHours"),
      totalCompletedValue: document.getElementById("totalCompleted"),
    };
  }

  attachEventListeners() {
    this.elements.periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.setPeriod(btn.dataset.period));
    });
  }

  render() {
    const stats = this.state.stats;
    const total = this.state.todos.length;
    const completed = this.state.todos.filter((t) => t.completed).length;
    const completionRate = total === 0 ? 0 : (completed / total) * 100;
    const completionPercentage = Math.round(completionRate);

    if (this.elements.completionValue) {
      this.elements.completionValue.textContent = `${completionPercentage}%`;
    }

    if (this.elements.completionRing) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference * (1 - completionPercentage / 100);
      const progressFill =
        this.elements.completionRing.querySelector(".progress-fill");
      if (progressFill) {
        progressFill.style.strokeDasharray = circumference;
        progressFill.style.strokeDashoffset = offset;
      }
    }

    if (this.elements.focusValue) {
      const hours = Math.floor(stats.totalFocusMinutes / 60);
      const mins = stats.totalFocusMinutes % 60;
      this.elements.focusValue.textContent = `${hours}h ${mins}m`;
    }

    if (this.elements.streakValue) {
      this.elements.streakValue.textContent = `${stats.streakDays || 0} days`;
    }

    if (this.elements.totalCompletedValue) {
      this.elements.totalCompletedValue.textContent = completed;
    }
  }

  setPeriod(period) {
    this.currentPeriod = period;
    this.elements.periodBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.period === period);
    });
    this.render();
  }
}
