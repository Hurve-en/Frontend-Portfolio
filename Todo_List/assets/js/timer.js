/* Pomodoro Timer */
class PomodoroTimer {
  constructor(state) {
    this.state = state;
    this.timerInterval = null;
    this.initElements();
    this.attachEventListeners();
    this.updateDisplay();
  }

  initElements() {
    this.elements = {
      timerDisplay: document.getElementById("timerDisplay"),
      timerLabel: document.getElementById("timerLabel"),
      playBtn: document.getElementById("playBtn"),
      pauseBtn: document.getElementById("pauseBtn"),
      resetBtn: document.getElementById("resetBtn"),
      workDurationInput: document.getElementById("workDuration"),
      breakDurationInput: document.getElementById("breakDuration"),
      modeBtns: document.querySelectorAll(".mode-btn"),
      timerFill: document.querySelector(".timer-fill"),
      totalFocusTime: document.getElementById("totalFocusTime"),
      sessionFocusTime: document.getElementById("sessionFocusTime"),
      sessionCount: document.getElementById("sessionCount"),
    };
  }

  attachEventListeners() {
    this.elements.playBtn.addEventListener("click", () => this.start());
    this.elements.pauseBtn.addEventListener("click", () => this.pause());
    this.elements.resetBtn.addEventListener("click", () => this.reset());
    this.elements.workDurationInput.addEventListener("change", (e) =>
      this.updateDuration("work", e.target.value),
    );
    this.elements.breakDurationInput.addEventListener("change", (e) =>
      this.updateDuration("break", e.target.value),
    );
    this.elements.modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.switchMode(btn.dataset.mode));
    });
  }

  start() {
    if (this.state.timerState.isRunning) return;
    this.state.timerState.isRunning = true;
    this.state.timerState.isPaused = false;
    this.updateButtons();

    this.timerInterval = setInterval(() => {
      this.state.timerState.timeRemaining--;
      this.state.timerState.totalFocusTime++;
      if (this.state.timerState.currentMode === "work") {
        this.state.stats.totalFocusMinutes++;
      }
      this.updateDisplay();
      if (this.state.timerState.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  pause() {
    if (!this.state.timerState.isRunning) return;
    this.state.timerState.isRunning = false;
    this.state.timerState.isPaused = true;
    clearInterval(this.timerInterval);
    this.updateButtons();
  }

  reset() {
    clearInterval(this.timerInterval);
    this.state.timerState.isRunning = false;
    this.state.timerState.isPaused = false;
    this.state.timerState.timeRemaining =
      this.state.timerState.currentMode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    this.updateDisplay();
    this.updateButtons();
  }

  switchMode(mode) {
    if (this.state.timerState.isRunning) return;
    this.state.timerState.currentMode = mode;
    this.state.timerState.timeRemaining =
      mode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    this.elements.modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    this.updateDisplay();
  }

  updateDuration(mode, minutes) {
    minutes = Math.max(1, Math.min(60, parseInt(minutes) || 25));
    this.state.timerState[mode + "Duration"] = minutes;
    if (
      !this.state.timerState.isRunning &&
      this.state.timerState.currentMode === mode
    ) {
      this.state.timerState.timeRemaining = minutes * 60;
      this.updateDisplay();
    }
  }

  completeSession() {
    clearInterval(this.timerInterval);
    this.state.timerState.isRunning = false;
    if (this.state.timerState.currentMode === "work") {
      this.state.timerState.sessionsCompleted++;
      this.state.stats.sessionsCompleted++;
      this.playNotification();
      showToast("🎉 Session completed! Take a break.", "success");
      this.switchMode("break");
    } else {
      showToast("✨ Break finished! Ready for another session?");
      this.switchMode("work");
    }
    this.state.saveStats();
    this.updateButtons();
    this.updateDisplay();
  }

  updateDisplay() {
    const minutes = Math.floor(this.state.timerState.timeRemaining / 60);
    const seconds = this.state.timerState.timeRemaining % 60;
    this.elements.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const label =
      this.state.timerState.currentMode === "work"
        ? "Focus Time"
        : "Break Time";
    this.elements.timerLabel.textContent = this.state.timerState.isPaused
      ? "Paused"
      : label;

    const totalSeconds =
      this.state.timerState.currentMode === "work"
        ? this.state.timerState.workDuration * 60
        : this.state.timerState.breakDuration * 60;
    const progress =
      (totalSeconds - this.state.timerState.timeRemaining) / totalSeconds;
    const circumference = 2 * Math.PI * 95;
    const offset = circumference * (1 - progress);
    this.elements.timerFill.style.strokeDashoffset = offset;

    const hours = Math.floor(this.state.timerState.totalFocusTime / 3600);
    const mins = Math.floor((this.state.timerState.totalFocusTime % 3600) / 60);
    this.elements.totalFocusTime.textContent = `${hours}h ${mins}m`;
    this.elements.sessionFocusTime.textContent = `${minutes}m`;
    this.elements.sessionCount.textContent =
      this.state.timerState.sessionsCompleted;
  }

  updateButtons() {
    this.elements.playBtn.disabled = this.state.timerState.isRunning;
    this.elements.pauseBtn.disabled = !this.state.timerState.isRunning;
    this.elements.workDurationInput.disabled =
      this.state.timerState.isRunning || this.state.timerState.isPaused;
    this.elements.breakDurationInput.disabled =
      this.state.timerState.isRunning || this.state.timerState.isPaused;
  }

  playNotification() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.log("Audio notification skipped");
    }
  }
}
