// ═══════════════════════════════════════════
//  STATE VARIABLES
// ═══════════════════════════════════════════
// Holds all parsed QA cards: {q, a}
let cards = [];
// Order of card indexes used during study (can be shuffled)
let studyOrder = [];
// Current position inside studyOrder
let idx = 0;
// Card difficulty tracking: { cardIndex: 'easy' | 'hard' | null }
let cardDifficulty = {};
// Study statistics
let studyStats = {
  total: 0,
  easy: 0,
  hard: 0,
  mastered: 0,
};

// ═══════════════════════════════════════════
//  INITIALIZATION & EVENT LISTENERS
// ═══════════════════════════════════════════

// Watch the input box and enable/disable parse button
document.getElementById("pasteArea").addEventListener("input", function () {
  document.getElementById("parseBtn").disabled = this.value.trim().length < 3;
});

// Global keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const activeScreen = document.querySelector(".screen.active").id;

  // Space or Enter to flip in study mode
  if (
    (e.code === "Space" || e.code === "Enter") &&
    activeScreen === "s-study"
  ) {
    e.preventDefault();
    flip();
  }

  // Arrow keys for navigation
  if (e.code === "ArrowRight" && activeScreen === "s-study") {
    e.preventDefault();
    navigate(1);
  }
  if (e.code === "ArrowLeft" && activeScreen === "s-study") {
    e.preventDefault();
    navigate(-1);
  }

  // E for Easy, H for Hard
  if (e.code === "KeyE" && activeScreen === "s-study") {
    e.preventDefault();
    markEasy();
  }
  if (e.code === "KeyH" && activeScreen === "s-study") {
    e.preventDefault();
    markHard();
  }

  // Ctrl/Cmd+Shift+S to shuffle
  if (
    (e.ctrlKey || e.metaKey) &&
    e.shiftKey &&
    e.code === "KeyS" &&
    activeScreen === "s-study"
  ) {
    e.preventDefault();
    shuffle();
  }
});

// Reset input box and disable parse button for a clean new entry.
function clearInput() {
  document.getElementById("pasteArea").value = "";
  document.getElementById("parseBtn").disabled = true;
}

// ═══════════════════════════════════════════
//  LOCAL STORAGE FUNCTIONS
// ═══════════════════════════════════════════
function saveStudySession() {
  const session = {
    cards,
    cardDifficulty,
    studyStats,
    timestamp: Date.now(),
  };
  localStorage.setItem("flashcardSession", JSON.stringify(session));
}

function loadStudySession() {
  const saved = localStorage.getItem("flashcardSession");
  if (saved) {
    try {
      const session = JSON.parse(saved);
      cards = session.cards || [];
      cardDifficulty = session.cardDifficulty || {};
      studyStats = session.studyStats || {
        total: 0,
        easy: 0,
        hard: 0,
        mastered: 0,
      };
      return true;
    } catch (e) {
      console.error("Failed to load session:", e);
      return false;
    }
  }
  return false;
}

function clearStudySession() {
  localStorage.removeItem("flashcardSession");
  cards = [];
  cardDifficulty = {};
  studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
}
// Convert raw input text into cards by trying common formats.
function parseInput() {
  const raw = document.getElementById("pasteArea").value.trim();
  if (!raw) {
    showToast("Please paste some content first", true);
    return;
  }

  let parsed = [];

  // ── Strategy 1: Find explicit labels like "Q:" followed by "A:".
  const qaPattern =
    /(?:Q(?:uestion)?[\s:.]+)(.+?)(?:\r?\n)(?:A(?:nswer)?[\s:.]+)(.+?)(?=\r?\n\s*\r?\n|\r?\n\s*Q(?:uestion)?[\s:.]|$)/gis;
  let m;
  while ((m = qaPattern.exec(raw)) !== null) {
    const q = m[1].trim(),
      a = m[2].trim();
    if (q && a) parsed.push({ q, a });
  }

  // ── Strategy 2: If no labels, split on blank lines.
  // Each block becomes one card: first line question, rest answer.
  if (parsed.length === 0) {
    const blocks = raw
      .split(/\r?\n\s*\r?\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    for (const block of blocks) {
      const lines = block
        .split(/\r?\n/)
        .map((l) =>
          l
            .replace(/^\s*[\d]+[\.\)]\s*/, "")
            .replace(/^\s*[-*•]\s*/, "")
            .trim(),
        )
        .filter(Boolean);
      if (lines.length >= 2) {
        parsed.push({ q: lines[0], a: lines.slice(1).join(" ") });
      }
    }
  }

  // ── Strategy 3: As a fallback, take even-odd line pairs.
  if (parsed.length === 0) {
    const lines = raw
      .split(/\r?\n/)
      .map((l) =>
        l
          .replace(/^\s*[\d]+[\.\)]\s*/, "")
          .replace(/^\s*[-*•]\s*/, "")
          .trim(),
      )
      .filter(Boolean);
    for (let i = 0; i + 1 < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        parsed.push({ q: lines[i], a: lines[i + 1] });
      }
    }
  }

  // If still no cards found, notify user and stop.
  if (parsed.length === 0) {
    showToast("Couldn't detect Q&A pairs. Try using Q: / A: labels.", true);
    return;
  }

  // Store parsed cards and reset tracking
  cards = parsed;
  cardDifficulty = {};
  studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
  saveStudySession();
  renderPreview();
  goTo("s-preview");
  showToast(`Parsed ${parsed.length} card${parsed.length !== 1 ? "s" : ""}! ✓`);
}

// ═══════════════════════════════════════════
//  PREVIEW SCREEN FUNCTIONS
// ═══════════════════════════════════════════
// Show parsed cards so user can edit/delete before studying.
function renderPreview() {
  const list = document.getElementById("previewList");
  // Update the count badge with pluralization.
  document.getElementById("previewBadge").textContent =
    `${cards.length} card${cards.length !== 1 ? "s" : ""}`;

  list.innerHTML = "";
  // Build UI items for each card
  cards.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "preview-item";
    el.style.animationDelay = `${i * 0.04}s`;
    el.innerHTML = `
  <div class="preview-num">${i + 1}</div>
  <div class="preview-content">
    <div class="preview-q">${esc(c.q)}</div>
    <div class="preview-a">${esc(c.a)}</div>
  </div>
  <button class="del-card" onclick="delCard(${i})" title="Remove card">✕</button>
`;
    list.appendChild(el);
  });
}

// Remove a card and update preview screen.
function delCard(i) {
  cards.splice(i, 1);
  // Clean up difficulty tracking for deleted card
  Object.keys(cardDifficulty).forEach((key) => {
    if (parseInt(key) === i) delete cardDifficulty[key];
  });

  if (cards.length === 0) {
    goTo("s-input");
    showToast("All cards removed. Paste new content.");
    clearStudySession();
    return;
  }
  renderPreview();
  saveStudySession();
}

// ═══════════════════════════════════════════
//  STUDY SCREEN FUNCTIONS
// ═══════════════════════════════════════════
// Begin studying; set order and show first card.
function startStudy() {
  if (cards.length === 0) return;
  // Default order is same as parsed order.
  studyOrder = [...Array(cards.length).keys()];
  idx = 0;
  cardDifficulty = {};
  studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
  removeDone();
  goTo("s-study");
  showCard();
  saveStudySession();
}

// ═══════════════════════════════════════════
//  DIFFICULTY MARKING FUNCTIONS
// ═══════════════════════════════════════════
function markEasy() {
  const cardIdx = studyOrder[idx];
  cardDifficulty[cardIdx] = "easy";
  studyStats.easy++;
  saveStudySession();
  showToast("Marked as Easy ✓", false);
  // Auto-advance to next card
  navigate(1);
}

function markHard() {
  const cardIdx = studyOrder[idx];
  cardDifficulty[cardIdx] = "hard";
  studyStats.hard++;
  saveStudySession();
  showToast("Marked as Hard ⚡", false);
  // Auto-advance to next card
  navigate(1);
}

// Render question/answer and controls for current study card.
function showCard() {
  const c = cards[studyOrder[idx]];

  // Set question and answer text for current card
  document.getElementById("qText").textContent = c.q;
  document.getElementById("aText").textContent = c.a;
  // Always start with question side up.
  document.getElementById("flipper").classList.remove("flipped");

  // Update progress bar and counter label
  const pct = ((idx + 1) / studyOrder.length) * 100;
  document.getElementById("progFill").style.width = pct + "%";
  document.getElementById("progTxt").textContent =
    `${idx + 1} of ${studyOrder.length}`;

  // Enable/disable navigation buttons
  document.getElementById("prevBtn").disabled = idx === 0;
  document.getElementById("nextBtn").disabled = idx === studyOrder.length - 1;

  // Show done screen on last card after a small delay
  if (idx === studyOrder.length - 1) {
    clearTimeout(window._doneTimer);
    window._doneTimer = setTimeout(showDone, 700);
  } else {
    clearTimeout(window._doneTimer);
    removeDone();
  }
}

// Toggle card face: question ⇄ answer.
function flip() {
  document.getElementById("flipper").classList.toggle("flipped");
  saveStudySession();
}

// Move to previous/next card in study order.
function navigate(dir) {
  const next = idx + dir;
  if (next < 0 || next >= studyOrder.length) return;
  idx = next;
  showCard();
  saveStudySession();
}

// Shuffle the cards with Fisher-Yates and restart display.
function shuffle() {
  // Fisher-Yates shuffle algorithm
  for (let i = studyOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyOrder[i], studyOrder[j]] = [studyOrder[j], studyOrder[i]];
  }
  idx = 0;
  removeDone();
  showCard();
  saveStudySession();
  showToast("Cards shuffled 🔀", false);
}

// Show congrats overlay after last card.
function showDone() {
  if (document.getElementById("doneOverlay")) return;

  // Calculate final stats
  studyStats.total = studyOrder.length;
  studyStats.mastered = studyStats.easy;
  saveStudySession();

  const scene = document.getElementById("scene");
  const done = document.createElement("div");
  done.className = "done-overlay";
  done.id = "doneOverlay";

  const accuracyPercent =
    studyStats.total > 0
      ? Math.round((studyStats.easy / studyStats.total) * 100)
      : 0;

  done.innerHTML = `
<div class="done-icon">🎉</div>
<div class="done-title">Session Complete!</div>
<div class="done-sub">You reviewed all ${cards.length} card${cards.length !== 1 ? "s" : ""}.</div>
<div class="done-stats">
  <div class="done-stat-row">
    <div class="done-stat">
      <div class="done-stat-value">${studyStats.easy}</div>
      <div class="done-stat-label">Mastered</div>
    </div>
    <div class="done-stat">
      <div class="done-stat-value">${studyStats.hard}</div>
      <div class="done-stat-label">Need Practice</div>
    </div>
    <div class="done-stat">
      <div class="done-stat-value">${accuracyPercent}%</div>
      <div class="done-stat-label">Accuracy</div>
    </div>
  </div>
</div>
<div class="done-btns">
  <button class="btn-restart" onclick="restartStudy()">Study Again</button>
  <button class="btn-sm" style="flex:1;padding:12px" onclick="removeDone();goTo('s-preview')">Edit Cards</button>
</div>
`;
  scene.appendChild(done);
}

// Remove the completion overlay if shown.
function removeDone() {
  const d = document.getElementById("doneOverlay");
  if (d) d.remove();
}

// Reset study state and repeat review.
function restartStudy() {
  removeDone();
  studyOrder = [...Array(cards.length).keys()];
  idx = 0;
  cardDifficulty = {};
  studyStats = { total: 0, easy: 0, hard: 0, mastered: 0 };
  showCard();
  saveStudySession();
}

// ═══════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════
// Switch visible view by ID, hide all others.
function goTo(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Trigger focus management for accessibility
  const screen = document.getElementById(id);
  if (screen) {
    setTimeout(() => {
      const firstButton = screen.querySelector("button");
      if (firstButton) firstButton.focus();
    }, 100);
  }
}

// Escape HTML to prevent rendering issues or script injection.
function esc(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Show a small message at the bottom for user feedback.
let toastTimer;
function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const t = document.createElement("div");
  t.className = "toast" + (isError ? " error" : " success");
  t.textContent = msg;
  document.body.appendChild(t);
  toastTimer = setTimeout(() => t && t.remove(), 3000);
}
