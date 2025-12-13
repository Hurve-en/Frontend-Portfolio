/* ================================
   MOOD DATA
   Each mood controls:
   - Background gradient
   - Color palette
   - Quotes
   - Playlist preview
   - Weather text
================================ */
const moods = {
  lonely: {
    gradient: ["#141E30", "#243B55"],
    colors: ["#1f2a44", "#3a4f7a", "#6b7bbd"],
    quotes: [
      "Loneliness is quiet, but it speaks volumes.",
      "Even the moon gets lonely sometimes.",
      "Some nights are meant for reflection."
    ],
    weather: "Cloudy with a chance of nostalgia",
    playlist: [
      "Midnight Echo — Lune",
      "Empty Streets — Nova",
      "Slow Fade — Orion",
      "Quiet Room — Halo",
      "After Hours — Drift"
    ]
  },

  focused: {
    gradient: ["#1D4350", "#A43931"],
    colors: ["#2e3f3f", "#5f6f52", "#a9b388"],
    quotes: [
      "Focus turns noise into clarity.",
      "One task. One moment.",
      "Deep work, quiet mind."
    ],
    weather: "Clear skies, sharp thoughts",
    playlist: [
      "Deep Flow — Axis",
      "Tunnel Vision — Mono",
      "Still Motion — Echo",
      "Laser Calm — Field",
      "Signal Path — Grey"
    ]
  },

  happy: {
    gradient: ["#f7971e", "#ffd200"],
    colors: ["#ffb703", "#ffd166", "#ffe8a3"],
    quotes: [
      "Happiness looks good on you.",
      "Sunshine in every step.",
      "Joy doesn’t rush."
    ],
    weather: "Bright and warm energy",
    playlist: [
      "Golden Hour — Bloom",
      "Smile Lines — Pop",
      "Easy Days — Coast",
      "Light Steps — Sunny",
      "Warm Air — Feel"
    ]
  },

  tired: {
    gradient: ["#232526", "#414345"],
    colors: ["#3a3a3a", "#6b7280", "#9ca3af"],
    quotes: [
      "Rest is productive.",
      "It’s okay to slow down.",
      "Even stars need darkness."
    ],
    weather: "Low energy, gentle fog",
    playlist: [
      "Soft Static — Drift",
      "Dim Lights — Hush",
      "Sleepwalker — Grey",
      "Night Rain — Calm",
      "Slow Pulse — Fade"
    ]
  }
};

/* ================================
   DOM ELEMENTS
================================ */
const output = document.getElementById("output");
const palette = document.getElementById("palette");
const quoteEl = document.getElementById("quote");
const playlistEl = document.getElementById("playlist");
const weatherEl = document.getElementById("weather");
const timeline = document.getElementById("timeline");
const newQuoteBtn = document.getElementById("newQuote");

/* Stores currently selected mood */
let currentMood = null;

/* ================================
   MOOD BUTTON EVENTS
================================ */
document.querySelectorAll(".mood").forEach(button => {
  button.addEventListener("click", () => {
    setMood(button.dataset.mood);
  });
});

/* ================================
   MAIN MOOD HANDLER
================================ */
function setMood(moodKey) {
  const mood = moods[moodKey];
  if (!mood) return;

  currentMood = moodKey;
  output.classList.remove("hidden");

  /* Change background gradient */
  document.body.style.background =
    `linear-gradient(120deg, ${mood.gradient.join(",")})`;

  /* ---------- Render color palette ---------- */
  palette.innerHTML = "";
  mood.colors.forEach(color => {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = color;

    /* Copy color to clipboard when clicked */
    swatch.onclick = () => navigator.clipboard.writeText(color);

    palette.appendChild(swatch);
  });

  /* ---------- Quote ---------- */
  setRandomQuote();

  /* ---------- Playlist ---------- */
  playlistEl.innerHTML = "";
  mood.playlist.forEach(track => {
    const div = document.createElement("div");
    div.className = "track";
    div.textContent = track;
    playlistEl.appendChild(div);
  });

  /* ---------- Emotional weather ---------- */
  weatherEl.textContent = `🌦️ ${mood.weather}`;

  /* Save mood to history */
  saveHistory(moodKey);
  renderHistory();
}

/* ================================
   RANDOM QUOTE
================================ */
function setRandomQuote() {
  const mood = moods[currentMood];
  quoteEl.textContent =
    mood.quotes[Math.floor(Math.random() * mood.quotes.length)];
}

/* Button to generate a new quote */
newQuoteBtn.addEventListener("click", setRandomQuote);

/* ================================
   MOOD HISTORY (LOCAL STORAGE)
================================ */
function saveHistory(mood) {
  const history =
    JSON.parse(localStorage.getItem("moodHistory")) || [];

  history.push({
    mood,
    time: Date.now()
  });

  localStorage.setItem("moodHistory", JSON.stringify(history));
}

/* Render last 10 moods */
function renderHistory() {
  const history =
    JSON.parse(localStorage.getItem("moodHistory")) || [];

  timeline.innerHTML = "";

  history.slice(-10).forEach(entry => {
    const span = document.createElement("span");
    span.className = "history-item";

    /* Extract emoji from mood button */
    span.textContent =
      document
        .querySelector(`[data-mood="${entry.mood}"]`)
        .textContent.split(" ")[0];

    /* Replay mood when clicked */
    span.onclick = () => setMood(entry.mood);

    timeline.appendChild(span);
  });
}

/* Load existing history on page load */
renderHistory();
