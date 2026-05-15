/* ============================================================================
   CONFIG - Constants, configuration, and default state
   ============================================================================ */

const CONFIG = {
  STORAGE_KEY: "pomodoro-pro-v2",
  MODES: {
    FOCUS: "focus",
    SHORT_BREAK: "short",
    LONG_BREAK: "long",
  },
  DEFAULT_STATE: {
    settings: {
      focus: 25,
      short: 5,
      long: 15,
      autoReset: true,
      soundEnabled: true,
      theme: "dark",
    },
    tasks: [],
    sessions: [],
    daily: { date: "", sessionsCompleted: 0, focusMinutes: 0 },
  },
};
