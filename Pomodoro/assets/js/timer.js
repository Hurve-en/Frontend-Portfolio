/* ============================================================================
   TIMER MANAGER - Timer control and state management
   ============================================================================ */

class TimerManager {
  constructor(storage) {
    this.storage = storage;
    this.state = {
      mode: CONFIG.MODES.FOCUS,
      duration: 0,
      remaining: 0,
      running: false,
      interval: null,
      startTime: null,
      pausedTime: 0,
      sessionStartedAt: null,
    };
    this.callbacks = {};
  }

  on(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((cb) => cb(data));
    }
  }

  setMode(mode, shouldReset = true) {
    if (!Object.values(CONFIG.MODES).includes(mode)) {
      console.error("Invalid timer mode:", mode);
      return;
    }

    this.state.mode = mode;

    const durations = {
      [CONFIG.MODES.FOCUS]: this.storage.state.settings.focus,
      [CONFIG.MODES.SHORT_BREAK]: this.storage.state.settings.short,
      [CONFIG.MODES.LONG_BREAK]: this.storage.state.settings.long,
    };

    this.state.duration = (durations[mode] || 25) * 60;
    if (shouldReset) {
      this.state.remaining = this.state.duration;
      this.state.pausedTime = 0;
      this.state.sessionStartedAt = null;
    }

    this.emit("modeChanged", this.state);
  }

  start() {
    if (this.state.running) return;

    this.state.running = true;
    this.state.startTime = Date.now();
    if (!this.state.sessionStartedAt) {
      this.state.sessionStartedAt = Date.now();
    }

    this.state.interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
      this.state.remaining = Math.max(
        0,
        this.state.duration - this.state.pausedTime - elapsed,
      );

      this.emit("tick", this.state);

      if (this.state.remaining <= 0) {
        this.complete();
      }
    }, 100);

    this.emit("started", this.state);
  }

  pause() {
    if (!this.state.running) return;

    this.state.running = false;
    if (this.state.interval) {
      clearInterval(this.state.interval);
      this.state.interval = null;
    }

    this.state.pausedTime += Math.floor(
      (Date.now() - this.state.startTime) / 1000,
    );
    this.emit("paused", this.state);
  }

  reset() {
    this.pause();
    this.state.remaining = this.state.duration;
    this.state.pausedTime = 0;
    this.state.sessionStartedAt = null;
    this.emit("reset", this.state);
  }

  complete() {
    this.pause();
    Utilities.playNotificationSound(this.storage.state.settings.soundEnabled);

    if (this.state.mode === CONFIG.MODES.FOCUS) {
      const duration = Math.round(this.state.duration / 60);
      this.storage.recordSession(duration);
    }

    this.emit("completed", this.state);

    if (this.storage.state.settings.autoReset) {
      const nextMode =
        this.state.mode === CONFIG.MODES.FOCUS
          ? CONFIG.MODES.SHORT_BREAK
          : CONFIG.MODES.FOCUS;
      setTimeout(() => this.setMode(nextMode, true), 500);
    } else {
      this.state.remaining = 0;
      this.emit("tick", this.state);
    }
  }

  getState() {
    return this.state;
  }
}
