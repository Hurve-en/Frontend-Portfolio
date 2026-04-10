// This file handles all app interactions:
// - Saves mood data to browser storage
// - Opens/closes mood entry windows
// - Switches between light and dark themes
// - Draws mood trend graph
// - Keyboard accessible

// Start when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Get important page elements
  const moodPad = document.querySelector(".mood-pad");
  const modalPad = document.getElementById("modalMoodPad");
  const saveTodayBtn = document.getElementById("saveToday");
  const noteInput = document.getElementById("noteInput");
  const todaySummary = document.getElementById("todaySummary");
  const historyPreview = document.getElementById("historyPreview");
  const trendCanvas = document.getElementById("trendCanvas");
  const moodModal = document.getElementById("moodModal");
  const historyModal = document.getElementById("historyModal");
  const openHistory = document.getElementById("openHistory");
  const closeHistory = document.getElementById("closeHistory");
  const openEditModal = document.getElementById("openEditModal");
  const saveModal = document.getElementById("saveModal");
  const cancelModal = document.getElementById("cancelModal");
  const modalNote = document.getElementById("modalNote");
  const toast = document.getElementById("toast");
  const addMoodFab = document.getElementById("addMoodFab");

  const themeToggle = document.getElementById("themeToggle");
  const darkMode = document.getElementById("darkMode");
  const showCharts = document.getElementById("showCharts");
  const themeSelect = document.body;

  // Check if user prefers less animation
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) document.body.classList.add("reduced-motion-check");

  // Available moods with emoji, name, and strength for graph
  const moods = [
    { id: "happy", emoji: "😊", label: "Happy", weight: 5 },
    { id: "neutral", emoji: "😐", label: "Neutral", weight: 3 },
    { id: "sad", emoji: "😢", label: "Sad", weight: 1 },
    { id: "angry", emoji: "😡", label: "Angry", weight: 0 },
    { id: "excited", emoji: "🤩", label: "Excited", weight: 6 },
    { id: "tired", emoji: "😴", label: "Tired", weight: 2 },
  ];

  // Save and load mood entries from browser storage
  const STORAGE_KEY = "moodlogger:entries:v1";
  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("storage failed", e);
    }
  }

  // Convert date to YYYY-MM-DD format for storage key
  function keyForDate(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  // Track which mood is selected in main form and modal
  let selectedMood = null;
  let modalSelected = null;

  // Create mood buttons for dashboard and popup
  function createMoodButtons(container, isModal = false) {
    container.innerHTML = "";
    moods.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = "mood-btn";
      btn.type = "button";
      btn.setAttribute("data-id", m.id);
      btn.setAttribute("aria-label", m.label);
      btn.innerHTML = `<div>${m.emoji}</div>`;
      container.appendChild(btn);

      btn.addEventListener("click", () => {
        if (isModal) {
          modalSelected = m.id;
          highlightSelection(container, m.id);
        } else {
          selectedMood = m.id;
          highlightSelection(container, m.id);
        }
      });
    });
  }

  function highlightSelection(container, id) {
    container
      .querySelectorAll(".mood-btn")
      .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  }

  // Display today's mood from saved data
  function renderToday() {
    const entries = loadEntries();
    const todayKey = keyForDate();
    const today = entries.find((e) => e.date === todayKey);
    if (!today) {
      todaySummary.innerHTML =
        '<div class="empty">No mood recorded today — pick an emoji above.</div>';
      noteInput.value = "";
      selectedMood = null;
      highlightSelection(moodPad, null);
      return;
    }
    const mood = moods.find((m) => m.id === today.mood);
    noteInput.value = today.note || "";
    selectedMood = mood.id;
    highlightSelection(moodPad, mood.id);
    todaySummary.innerHTML = `
      <div class="summary-emoji">${mood.emoji}</div>
      <div>
        <div class="summary-text">${mood.label}</div>
        <div class="muted small">${today.note ? today.note.slice(0, 120) : "No note"}</div>
      </div>
    `;
  }

  // Save today's selected mood and note
  function saveToday() {
    if (!selectedMood) {
      showToast("Select an emoji before saving");
      return;
    }
    const entries = loadEntries();
    const todayKey = keyForDate();
    const existingIndex = entries.findIndex((e) => e.date === todayKey);
    const entry = {
      date: todayKey,
      mood: selectedMood,
      note: noteInput.value.trim(),
    };
    if (existingIndex >= 0) entries[existingIndex] = entry;
    else entries.unshift(entry);
    saveEntries(entries);
    showToast("Saved today’s mood");
    renderHistoryPreview();
    drawTrend();
    renderToday();
  }

  // Show temporary message at bottom of screen
  let toastTimer = null;
  function showToast(msg, ms = 1800) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
  }

  // Show last 14 days of moods in horizontal list
  function renderHistoryPreview() {
    historyPreview.innerHTML = "";
    const entries = loadEntries();
    const days = 14;
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = keyForDate(d);
      const entry = entries.find((e) => e.date === key);
      const dayEl = document.createElement("div");
      dayEl.className = "history-day";
      dayEl.innerHTML = `<div class="day">${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                         <div class="emoji">${entry ? moods.find((m) => m.id === entry.mood).emoji : "—"}</div>`;
      dayEl.tabIndex = 0;
      dayEl.addEventListener("click", () => openEditForDate(key));
      historyPreview.appendChild(dayEl);
    }
  }

  // Open popup window to edit mood for a date
  function openEditForDate(dateKey) {
    const entries = loadEntries();
    const entry = entries.find((e) => e.date === dateKey);
    modalSelected = entry ? entry.mood : selectedMood || null;
    modalNote.value = entry ? entry.note || "" : "";
    createMoodButtons(modalPad, true);
    highlightSelection(modalPad, modalSelected);
    moodModal.showModal();
    moodModal.dataset.date = dateKey; // store date being edited
  }

  // Save mood selected in the popup window
  function saveModalEntry() {
    const dateKey = moodModal.dataset.date || keyForDate();
    if (!modalSelected) {
      showToast("Pick an emoji first");
      return;
    }
    const entries = loadEntries();
    const existing = entries.findIndex((e) => e.date === dateKey);
    const entry = {
      date: dateKey,
      mood: modalSelected,
      note: modalNote.value.trim(),
    };
    if (existing >= 0) entries[existing] = entry;
    else entries.unshift(entry);
    saveEntries(entries);
    moodModal.close();
    showToast("Saved");
    renderHistoryPreview();
    drawTrend();
    renderToday();
  }

  // Draw graph showing mood changes over 7 days
  function drawTrend() {
    if (!trendCanvas) return;
    const ctx = trendCanvas.getContext("2d");
    const entries = loadEntries().slice(0, 7).reverse(); // Get last 7 days in order
    const w = trendCanvas.width;
    const h = trendCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!entries.length) return;
    // Get mood strength for each day
    const weights = entries.map(
      (e) => (moods.find((m) => m.id === e.mood) || { weight: 3 }).weight,
    );
    const maxW = Math.max(...weights, 6);
    // Draw the line connecting mood points
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#7cc5ff";
    ctx.fillStyle = "rgba(124,197,255,0.08)";
    ctx.beginPath();
    weights.forEach((v, i) => {
      const x = (i / (weights.length - 1)) * (w - 40) + 20;
      const y = h - (v / maxW) * (h - 30) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      // Draw circle dot at each mood point
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw line over the dots
    ctx.beginPath();
    weights.forEach((v, i) => {
      const x = (i / (weights.length - 1)) * (w - 40) + 20;
      const y = h - (v / maxW) * (h - 30) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#7cc5ff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Show all moods from last 30 days in calendar view
  function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";
    const entries = loadEntries();
    const days = 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = keyForDate(d);
      const ent = entries.find((e) => e.date === key);
      const dayCard = document.createElement("div");
      dayCard.className = "calendar-day";
      dayCard.innerHTML = `<div class="small muted">${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                           <div class="emoji" style="font-size:20px;">${ent ? moods.find((m) => m.id === ent.mood).emoji : "—"}</div>
                           <div class="muted small">${ent ? (ent.note ? ent.note.slice(0, 40) : "No note") : ""}</div>`;
      dayCard.addEventListener("click", () => openEditForDate(key));
      grid.appendChild(dayCard);
    }
  }

  // Create mood buttons on page load
  createMoodButtons(moodPad, false);

  // Connect buttons to functions
  saveTodayBtn.addEventListener("click", saveToday);
  openEditModal.addEventListener("click", () => openEditForDate(keyForDate()));
  addMoodFab.addEventListener("click", () => openEditForDate(keyForDate()));

  // Handle popup window buttons
  saveModal.addEventListener("click", saveModalEntry);
  cancelModal.addEventListener("click", () => moodModal.close());

  // Handle history window buttons
  openHistory.addEventListener("click", () => {
    renderCalendar();
    historyModal.showModal();
  });
  closeHistory.addEventListener("click", () => historyModal.close());

  // Delete all mood entries when user clicks clear
  document.getElementById("clearAll").addEventListener("click", () => {
    if (confirm("Clear all mood entries?")) {
      saveEntries([]);
      renderHistoryPreview();
      drawTrend();
      renderToday();
      showToast("All cleared");
    }
  });

  // Handle light/dark theme switching
  const storedTheme = localStorage.getItem("moodlogger:theme");
  if (storedTheme) document.body.setAttribute("data-theme", storedTheme);

  themeToggle.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("moodlogger:theme", next);
    showToast(`${next.charAt(0).toUpperCase() + next.slice(1)} mode`);
  });

  darkMode.addEventListener("change", (e) => {
    document.body.setAttribute(
      "data-theme",
      e.target.checked ? "dark" : "light",
    );
    localStorage.setItem(
      "moodlogger:theme",
      e.target.checked ? "dark" : "light",
    );
  });

  // Handle font size changes from settings
  document.getElementById("fontSize").addEventListener("change", (e) => {
    document.documentElement.style.fontSize = e.target.value + "px";
  });

  // Show/hide chart when user toggles setting
  showCharts.addEventListener("change", (e) => {
    trendCanvas.style.display = e.target.checked ? "block" : "none";
  });

  // Close popups when user presses Escape key
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (moodModal.open) moodModal.close();
      if (historyModal.open) historyModal.close();
    }
  });

  // Display initial data on page load
  renderToday();
  renderHistoryPreview();
  drawTrend();

  // Return focus to main note area when popup closes
  moodModal.addEventListener("close", () => {
    document.getElementById("noteInput").focus();
  });

  // Load calendar on startup
  renderCalendar();
});
