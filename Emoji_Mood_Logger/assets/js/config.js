/* ============================================================================
   CONFIG - Constants and configuration
   ============================================================================ */

const CONFIG = {
  STORAGE_KEY: "moodlogger:entries:v2",
  THEME_KEY: "moodlogger:theme:v2",
  MAX_STORAGE_ENTRIES: 10000,
  TOAST_DURATION: 1800,
};

const MOODS = [
  { id: "happy", emoji: "😊", label: "Happy", color: "#FFD6A5", weight: 5 },
  { id: "excited", emoji: "🤩", label: "Excited", color: "#C7D8FF", weight: 6 },
  { id: "neutral", emoji: "😐", label: "Neutral", color: "#9CA3AF", weight: 3 },
  { id: "tired", emoji: "😴", label: "Tired", color: "#FCD34D", weight: 2 },
  { id: "sad", emoji: "😢", label: "Sad", color: "#60A5FA", weight: 1 },
  { id: "angry", emoji: "😡", label: "Angry", color: "#F87171", weight: 0 },
];
