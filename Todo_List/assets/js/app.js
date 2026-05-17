/* App initialization */
class TodoApp {
  constructor() {
    this.state = new AppState();
    this.timer = new PomodoroTimer(this.state);
    this.todoManager = new TodoManager(this.state);
    this.statsManager = new StatsManager(this.state);
    this.setupSVG();
    this.setupKeyboardShortcuts();
    this.registerServiceWorker();
  }

  setupSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.display = "none";
    svg.innerHTML = `
      <defs>
        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2d6a4f;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#40916c;stop-opacity:1" />
        </linearGradient>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        this.timer.elements.playBtn.click();
      }
      if (e.code === "KeyR") this.timer.elements.resetBtn.click();
      if (e.code === "KeyF")
        document.getElementById("focusMode")?.classList.toggle("active");
      if (e.ctrlKey && e.code === "Comma") {
        const modal = document.getElementById("helpModal");
        modal?.classList.toggle("active");
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        this.todoManager.elements.undoBtn.click();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        this.todoManager.elements.redoBtn.click();
      }
    });
  }

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new TodoApp();
});
