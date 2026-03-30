// ============================================
// STUDYFLOW - UPGRADED FLASHCARD APP
// ============================================

// DATA
let decks = JSON.parse(localStorage.getItem("studyflowDecks")) || [];
let currentDeck = null;
let currentCardIndex = 0;
let isFlipped = false;
let studyCards = []; // cards currently in study session
let hardCardIds = new Set();
let editingCardIndex = -1;
let stats = { good: 0, help: 0, hard: 0 };
let aiGeneratedCards = [];

// DOM — VIEWS
const decksList = document.getElementById("decksList");
const emptyState = document.getElementById("emptyState");
const deckView = document.getElementById("deckView");
const studyMode = document.getElementById("studyMode");
const newDeckModal = document.getElementById("newDeckModal");
const editCardModal = document.getElementById("editCardModal");
const exportModal = document.getElementById("exportModal");
const sessionComplete = document.getElementById("sessionComplete");

// DOM — BUTTONS
const newDeckBtn = document.getElementById("newDeckBtn");
const createFirstDeckBtn = document.getElementById("createFirstDeckBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const confirmDeckBtn = document.getElementById("confirmDeckBtn");
const cancelDeckBtn = document.getElementById("cancelDeckBtn");
const backBtn = document.getElementById("backBtn");
const deleteDeckBtn = document.getElementById("deleteDeckBtn");
const addCardBtn = document.getElementById("addCardBtn");
const startStudyBtn = document.getElementById("startStudyBtn");
const exitStudyBtn = document.getElementById("exitStudyBtn");
const flipCardBtn = document.getElementById("flipCardBtn");
const prevCardBtn = document.getElementById("prevCardBtn");
const nextCardBtn = document.getElementById("nextCardBtn");
const markGoodBtn = document.getElementById("markGoodBtn");
const markNeedHelpBtn = document.getElementById("markNeedHelpBtn");
const markHardBtn = document.getElementById("markHardBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const exportBtn = document.getElementById("exportBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// DOM — INPUTS
const newDeckNameInput = document.getElementById("newDeckName");
const newDeckDescInput = document.getElementById("newDeckDesc");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const deckSearch = document.getElementById("deckSearch");
const cardSearch = document.getElementById("cardSearch");
const bulkInput = document.getElementById("bulkInput");
const bulkCounter = document.getElementById("bulkCounter");

// DOM — BULK
const previewBulkBtn = document.getElementById("previewBulkBtn");
const importBulkBtn = document.getElementById("importBulkBtn");
const bulkPreviewWrap = document.getElementById("bulkPreviewWrap");
const bulkPreview = document.getElementById("bulkPreview");
const togglePreviewBtn = document.getElementById("togglePreviewBtn");
const previewCount = document.getElementById("previewCount");

// DOM — AI
const generateAiBtn = document.getElementById("generateAiBtn");
const aiTopic = document.getElementById("aiTopic");
const aiCount = document.getElementById("aiCount");
const aiDifficulty = document.getElementById("aiDifficulty");
const aiResult = document.getElementById("aiResult");
const aiLoading = document.getElementById("aiLoading");
const aiResultCount = document.getElementById("aiResultCount");
const aiPreviewList = document.getElementById("aiPreviewList");
const importAiBtn = document.getElementById("importAiBtn");

// DOM — STUDY
const flashcard = document.getElementById("flashcard");
const studyQuestion = document.getElementById("studyQuestion");
const studyAnswer = document.getElementById("studyAnswer");
const studyDeckName = document.getElementById("studyDeckName");

// DOM — SESSION
const restartStudyBtn = document.getElementById("restartStudyBtn");
const studyHardBtn = document.getElementById("studyHardBtn");
const exitSessionBtn = document.getElementById("exitSessionBtn");

// DOM — EDIT MODAL
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const confirmEditBtn = document.getElementById("confirmEditBtn");
const editQuestion = document.getElementById("editQuestion");
const editAnswer = document.getElementById("editAnswer");

// DOM — EXPORT MODAL
const closeExportModalBtn = document.getElementById("closeExportModalBtn");

// ============================================
// INIT
// ============================================

function init() {
  renderDecks();
  updateMainView();
  attachEventListeners();

  if (window.innerWidth <= 1024) {
    closeSidebar();
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
  // Sidebar toggle
  sidebarToggle.addEventListener("click", toggleSidebar);

  // Deck
  newDeckBtn.addEventListener("click", openNewDeckModal);
  createFirstDeckBtn.addEventListener("click", openNewDeckModal);
  closeModalBtn.addEventListener("click", closeNewDeckModal);
  confirmDeckBtn.addEventListener("click", createNewDeck);
  cancelDeckBtn.addEventListener("click", closeNewDeckModal);
  backBtn.addEventListener("click", goBackToMain);
  deleteDeckBtn.addEventListener("click", deleteDeck);

  // Deck search
  deckSearch.addEventListener("input", () => renderDecks(deckSearch.value));

  // Card search
  cardSearch.addEventListener("input", () => renderCards(cardSearch.value));

  // Single card (optional but can still add manually)
  addCardBtn.addEventListener("click", addCard);
  questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) addCard();
  });
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) addCard();
  });

  // Bulk import: immediate preview from paste
  bulkInput.addEventListener("input", () => {
    updateBulkCounter();
    previewBulk();
  });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Bulk import
  bulkInput.addEventListener("input", updateBulkCounter);
  previewBulkBtn.addEventListener("click", previewBulk);
  importBulkBtn.addEventListener("click", importBulk);
  togglePreviewBtn.addEventListener("click", toggleBulkPreview);
  document.querySelectorAll("input[name='separator']").forEach((r) =>
    r.addEventListener("change", () => {
      updateBulkCounter();
      if (!bulkPreviewWrap.classList.contains("hidden")) previewBulk();
    }),
  );
  document.getElementById("customSeparator").addEventListener("input", () => {
    updateBulkCounter();
    if (!bulkPreviewWrap.classList.contains("hidden")) previewBulk();
  });

  // AI
  generateAiBtn.addEventListener("click", generateAiCards);
  importAiBtn.addEventListener("click", importAiCards);

  // Study
  startStudyBtn.addEventListener("click", startStudyMode);
  exitStudyBtn.addEventListener("click", goBackToDeckView);
  flipCardBtn.addEventListener("click", flipCard);
  prevCardBtn.addEventListener("click", previousCard);
  nextCardBtn.addEventListener("click", nextCard);
  markGoodBtn.addEventListener("click", () => markCard("good"));
  markNeedHelpBtn.addEventListener("click", () => markCard("help"));
  markHardBtn.addEventListener("click", () => markCard("hard"));

  // Session complete
  restartStudyBtn.addEventListener("click", () => startStudyMode());
  studyHardBtn.addEventListener("click", studyHardCards);
  exitSessionBtn.addEventListener("click", goBackToDeckView);

  // Edit modal
  closeEditModalBtn.addEventListener("click", closeEditModal);
  cancelEditBtn.addEventListener("click", closeEditModal);
  confirmEditBtn.addEventListener("click", saveEditCard);

  // Export
  exportBtn.addEventListener("click", () =>
    exportModal.classList.remove("hidden"),
  );
  closeExportModalBtn.addEventListener("click", () =>
    exportModal.classList.add("hidden"),
  );
  document
    .getElementById("exportTxt")
    .addEventListener("click", () => exportDeck("txt"));
  document
    .getElementById("exportCsv")
    .addEventListener("click", () => exportDeck("csv"));
  document
    .getElementById("exportJson")
    .addEventListener("click", () => exportDeck("json"));

  // Shuffle
  shuffleBtn.addEventListener("click", shuffleCards);

  // Sidebar toggle
  sidebarToggle.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // Keyboard
  document.addEventListener("keydown", handleKeyboard);

  // New deck on Enter
  newDeckNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createNewDeck();
  });

  // Close modals on backdrop click
  [newDeckModal, editCardModal, exportModal].forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.add("hidden");
    });
  });
}

// ============================================
// SIDEBAR TOGGLE
// ============================================

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("collapsed");
  const isOpen = !sidebar.classList.contains("collapsed");
  sidebarOverlay.classList.toggle("visible", isOpen);
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.add("collapsed");
  sidebarOverlay.classList.remove("visible");
}

function openSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("collapsed");
  sidebarOverlay.classList.add("visible");
}

// ============================================
// TABS
// ============================================

function switchTab(tabName) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => {
    c.classList.remove("active");
    c.classList.add("hidden");
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  const content = document.getElementById(`tab-${tabName}`);
  content.classList.remove("hidden");
  content.classList.add("active");
}

// ============================================
// DECK MANAGEMENT
// ============================================

function renderDecks(filter = "") {
  const filtered = decks.filter((d) =>
    d.name.toLowerCase().includes(filter.toLowerCase()),
  );

  if (filtered.length === 0) {
    decksList.innerHTML = `<p class="empty-decks">${filter ? "No matching decks" : "No decks yet"}</p>`;
    return;
  }

  decksList.innerHTML = filtered
    .map((deck, i) => {
      const realIndex = decks.indexOf(deck);
      const isActive = currentDeck && currentDeck.id === deck.id;
      return `
      <div class="deck-item ${isActive ? "active" : ""}" onclick="selectDeck(${realIndex})">
        <div class="deck-name">${escapeHtml(deck.name)}</div>
        <div class="deck-meta">${deck.cards.length} card${deck.cards.length !== 1 ? "s" : ""}${deck.description ? " · " + escapeHtml(deck.description) : ""}</div>
      </div>`;
    })
    .join("");
}

function selectDeck(index) {
  currentDeck = decks[index];
  renderDecks(deckSearch.value);
  updateMainView();

  // On small screens, close sidebar after deck selection.
  if (window.innerWidth <= 1024) closeSidebar();
}

function openNewDeckModal() {
  newDeckModal.classList.remove("hidden");
  setTimeout(() => newDeckNameInput.focus(), 50);
}

function closeNewDeckModal() {
  newDeckModal.classList.add("hidden");
  newDeckNameInput.value = "";
  newDeckDescInput.value = "";
}

function createNewDeck() {
  const name = newDeckNameInput.value.trim();
  if (!name) {
    showToast("Please enter a deck name", "error");
    return;
  }

  const newDeck = {
    id: Date.now(),
    name,
    description: newDeckDescInput.value.trim(),
    cards: [],
    createdAt: new Date().toLocaleDateString(),
  };

  decks.push(newDeck);
  saveToLocalStorage();
  currentDeck = newDeck;
  closeNewDeckModal();
  renderDecks();
  updateMainView();
  showToast(`✅ Deck "${name}" created!`);
}

function deleteDeck() {
  if (!confirm(`Delete "${currentDeck.name}"? This cannot be undone.`)) return;
  decks = decks.filter((d) => d.id !== currentDeck.id);
  saveToLocalStorage();
  currentDeck = null;
  renderDecks();
  updateMainView();
  showToast("Deck deleted", "warning");
}

// ============================================
// CARD MANAGEMENT
// ============================================

function addCard() {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  if (!question || !answer) {
    showToast("Please fill in both question and answer", "error");
    return;
  }
  if (!currentDeck) {
    showToast("Please select or create a deck first", "error");
    return;
  }

  currentDeck.cards.push({ id: Date.now(), question, answer });
  saveToLocalStorage();
  questionInput.value = "";
  answerInput.value = "";
  questionInput.focus();
  renderCards();
  updateCardCount();
  showToast("Card added! ✓", "success");
}

function renderCards(filter = "") {
  const cardsList = document.getElementById("cardsList");
  if (!currentDeck || currentDeck.cards.length === 0) {
    cardsList.innerHTML =
      '<p class="empty-cards">No cards yet. Add your first card above!</p>';
    return;
  }

  const filtered = filter
    ? currentDeck.cards.filter(
        (c) =>
          c.question.toLowerCase().includes(filter.toLowerCase()) ||
          c.answer.toLowerCase().includes(filter.toLowerCase()),
      )
    : currentDeck.cards;

  if (filtered.length === 0) {
    cardsList.innerHTML =
      '<p class="empty-cards">No cards match your search.</p>';
    return;
  }

  cardsList.innerHTML = filtered
    .map((card) => {
      const realIndex = currentDeck.cards.indexOf(card);
      return `
      <div class="card-item">
        <div class="card-num">#${realIndex + 1}</div>
        <div class="card-q">${escapeHtml(card.question)}</div>
        <div class="card-a">${escapeHtml(card.answer)}</div>
        <div class="card-actions">
          <button class="btn-card-edit" onclick="openEditModal(${realIndex})">✏️ Edit</button>
          <button class="btn-card-delete" onclick="deleteCard(${realIndex})">🗑️ Delete</button>
        </div>
      </div>`;
    })
    .join("");
}

function deleteCard(index) {
  if (!confirm("Delete this card?")) return;
  currentDeck.cards.splice(index, 1);
  saveToLocalStorage();
  renderCards(cardSearch.value);
  updateCardCount();
  showToast("Card deleted", "warning");
}

function openEditModal(index) {
  editingCardIndex = index;
  const card = currentDeck.cards[index];
  editQuestion.value = card.question;
  editAnswer.value = card.answer;
  editCardModal.classList.remove("hidden");
  setTimeout(() => editQuestion.focus(), 50);
}

function closeEditModal() {
  editCardModal.classList.add("hidden");
  editingCardIndex = -1;
}

function saveEditCard() {
  const q = editQuestion.value.trim();
  const a = editAnswer.value.trim();
  if (!q || !a) {
    showToast("Both fields are required", "error");
    return;
  }
  currentDeck.cards[editingCardIndex] = {
    ...currentDeck.cards[editingCardIndex],
    question: q,
    answer: a,
  };
  saveToLocalStorage();
  renderCards(cardSearch.value);
  closeEditModal();
  showToast("Card updated ✓", "success");
}

function updateCardCount() {
  document.getElementById("cardCountDisplay").textContent =
    `${currentDeck.cards.length} card${currentDeck.cards.length !== 1 ? "s" : ""}`;
}

function shuffleCards() {
  if (!currentDeck || currentDeck.cards.length === 0) return;
  currentDeck.cards = shuffleArray([...currentDeck.cards]);
  saveToLocalStorage();
  renderCards(cardSearch.value);
  showToast("🔀 Cards shuffled!", "success");
}

// ============================================
// BULK IMPORT
// ============================================

function getSeparator() {
  const sel = document.querySelector("input[name='separator']:checked");
  if (!sel) return "|";
  if (sel.value === "custom")
    return document.getElementById("customSeparator").value || "|";
  return sel.value;
}

function parseBulkText(text) {
  const sep = getSeparator();
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const valid = [],
    errors = [];

  lines.forEach((line, i) => {
    const idx = line.indexOf(sep);
    if (idx === -1) {
      errors.push({
        line: i + 1,
        text: line,
        reason: `Missing separator "${sep}"`,
      });
      return;
    }
    const q = line.slice(0, idx).trim();
    const a = line.slice(idx + sep.length).trim();
    if (!q || !a) {
      errors.push({
        line: i + 1,
        text: line,
        reason: "Empty question or answer",
      });
      return;
    }
    valid.push({ id: Date.now() + Math.random(), question: q, answer: a });
  });

  return { valid, errors };
}

function updateBulkCounter() {
  const text = bulkInput.value.trim();
  if (!text) {
    bulkCounter.textContent = "0 cards detected";
    return;
  }
  const { valid } = parseBulkText(text);
  bulkCounter.textContent = `${valid.length} card${valid.length !== 1 ? "s" : ""} detected`;
}

function previewBulk() {
  const text = bulkInput.value.trim();
  if (!text) {
    showToast("Please paste some cards first", "error");
    return;
  }

  const { valid, errors } = parseBulkText(text);
  previewCount.textContent = valid.length;
  bulkPreviewWrap.classList.remove("hidden");
  bulkPreview.classList.remove("hidden");
  togglePreviewBtn.textContent = "Hide Preview ▴";

  let html = "";
  errors.forEach((e) => {
    html += `<div class="bulk-preview-error">⚠️ Line ${e.line}: ${escapeHtml(e.reason)} — <em>${escapeHtml(e.text.slice(0, 60))}</em></div>`;
  });
  valid.forEach((card, i) => {
    html += `
      <div class="bulk-preview-item">
        <div class="q"><span class="num">#${i + 1}</span>${escapeHtml(card.question)}</div>
        <div class="a">${escapeHtml(card.answer)}</div>
      </div>`;
  });

  bulkPreview.innerHTML =
    html ||
    '<p style="padding:1rem; color: var(--text-secondary)">No valid cards found.</p>';
}

function toggleBulkPreview() {
  bulkPreview.classList.toggle("hidden");
  togglePreviewBtn.textContent = bulkPreview.classList.contains("hidden")
    ? "Show Preview ▾"
    : "Hide Preview ▴";
}

function importBulk() {
  const text = bulkInput.value.trim();
  if (!text) {
    showToast("Please paste some cards first", "error");
    return;
  }
  if (!currentDeck) {
    showToast("Please select a deck first", "error");
    return;
  }

  const { valid, errors } = parseBulkText(text);
  if (valid.length === 0) {
    showToast("No valid cards found. Check your format.", "error");
    return;
  }

  // Deduplicate against existing cards
  const existingQs = new Set(
    currentDeck.cards.map((c) => c.question.toLowerCase()),
  );
  const toAdd = valid.filter((c) => !existingQs.has(c.question.toLowerCase()));
  const dupes = valid.length - toAdd.length;

  currentDeck.cards.push(...toAdd);
  saveToLocalStorage();
  renderCards();
  updateCardCount();

  bulkInput.value = "";
  bulkPreviewWrap.classList.add("hidden");
  updateBulkCounter();

  let msg = `✅ Imported ${toAdd.length} card${toAdd.length !== 1 ? "s" : ""}!`;
  if (dupes > 0) msg += ` (${dupes} duplicate${dupes > 1 ? "s" : ""} skipped)`;
  if (errors.length > 0)
    msg += ` (${errors.length} line${errors.length > 1 ? "s" : ""} skipped)`;
  showToast(msg, "success");

  // Switch to cards view
  document.querySelector(".tab-btn").click();
}

// ============================================
// AI CARD GENERATION
// ============================================

async function generateAiCards() {
  const topic = aiTopic.value.trim();
  if (!topic) {
    showToast("Please enter a topic or text", "error");
    return;
  }

  const count = parseInt(aiCount.value);
  const difficulty = aiDifficulty.value;

  aiLoading.classList.remove("hidden");
  aiResult.classList.add("hidden");
  generateAiBtn.disabled = true;
  generateAiBtn.textContent = "Generating...";

  // Mock AI response for demo
  setTimeout(() => {
    const mockCards = [
      { question: "What is the capital of France?", answer: "Paris" },
      { question: "What is 2 + 2?", answer: "4" },
      { question: "What color is the sky?", answer: "Blue" },
      { question: "What is the largest planet?", answer: "Jupiter" },
      { question: "What is H2O?", answer: "Water" },
    ].slice(0, count);

    aiGeneratedCards = mockCards.map((c, i) => ({
      id: Date.now() + i,
      question: c.question,
      answer: c.answer,
    }));

    aiResultCount.textContent = aiGeneratedCards.length;
    aiPreviewList.innerHTML = aiGeneratedCards
      .map(
        (c, i) => `
      <div class="ai-preview-item">
        <div class="q"><strong>#${i + 1}</strong> ${escapeHtml(c.question)}</div>
        <div class="a">${escapeHtml(c.answer)}</div>
      </div>`,
      )
      .join("");

    aiResult.classList.remove("hidden");
    showToast(`✨ Generated ${aiGeneratedCards.length} cards!`, "success");

    aiLoading.classList.add("hidden");
    generateAiBtn.disabled = false;
    generateAiBtn.textContent = "✨ Generate Cards";
  }, 2000); // Simulate delay
}

function importAiCards() {
  if (!aiGeneratedCards.length) return;
  if (!currentDeck) {
    showToast("Please select a deck first", "error");
    return;
  }

  const existingQs = new Set(
    currentDeck.cards.map((c) => c.question.toLowerCase()),
  );
  const toAdd = aiGeneratedCards.filter(
    (c) => !existingQs.has(c.question.toLowerCase()),
  );
  const dupes = aiGeneratedCards.length - toAdd.length;

  currentDeck.cards.push(...toAdd);
  saveToLocalStorage();
  renderCards();
  updateCardCount();

  aiGeneratedCards = [];
  aiResult.classList.add("hidden");
  aiTopic.value = "";

  let msg = `✅ Imported ${toAdd.length} AI card${toAdd.length !== 1 ? "s" : ""}!`;
  if (dupes > 0) msg += ` (${dupes} duplicate${dupes > 1 ? "s" : ""} skipped)`;
  showToast(msg, "success");
  document.querySelector(".tab-btn").click();
}

// ============================================
// STUDY MODE
// ============================================

function startStudyMode(cardsOverride) {
  if (!currentDeck || currentDeck.cards.length === 0) {
    showToast("Add some cards to this deck first!", "error");
    return;
  }

  studyCards = cardsOverride ? [...cardsOverride] : [...currentDeck.cards];
  hardCardIds.clear();
  currentCardIndex = 0;
  isFlipped = false;
  stats = { good: 0, help: 0, hard: 0 };

  sessionComplete.classList.add("hidden");
  deckView.classList.add("hidden");
  studyMode.classList.remove("hidden");
  studyDeckName.textContent = currentDeck.name;

  showCard();
  updateStudyStats();
}

function showCard() {
  if (!studyCards.length) return;

  const card = studyCards[currentCardIndex];
  studyQuestion.textContent = card.question;
  studyAnswer.textContent = card.answer;
  isFlipped = false;
  flashcard.classList.remove("flipped");

  updateProgress();
  updateButtonStates();
}

function flipCard() {
  isFlipped = !isFlipped;
  flashcard.classList.toggle("flipped");
}

function previousCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    showCard();
  }
}

function nextCard() {
  if (currentCardIndex < studyCards.length - 1) {
    currentCardIndex++;
    showCard();
  }
}

function markCard(type) {
  stats[type]++;
  if (type === "hard") hardCardIds.add(studyCards[currentCardIndex].id);
  updateStudyStats();

  if (currentCardIndex < studyCards.length - 1) {
    currentCardIndex++;
    showCard();
  } else {
    showSessionComplete();
  }
}

function updateProgress() {
  const pct = ((currentCardIndex + 1) / studyCards.length) * 100;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("studyProgress").textContent =
    `${currentCardIndex + 1} / ${studyCards.length}`;
}

function updateButtonStates() {
  prevCardBtn.disabled = currentCardIndex === 0;
  nextCardBtn.disabled = currentCardIndex === studyCards.length - 1;
}

function updateStudyStats() {
  document.getElementById("goodCount").textContent = stats.good;
  document.getElementById("helpCount").textContent = stats.help;
  document.getElementById("hardCount").textContent = stats.hard;
}

function showSessionComplete() {
  const total = stats.good + stats.help + stats.hard;
  const pct = total > 0 ? Math.round((stats.good / total) * 100) : 0;
  document.getElementById("sessionSummary").textContent =
    `You reviewed ${studyCards.length} card${studyCards.length !== 1 ? "s" : ""}. You got ${pct}% correct!`;
  document.getElementById("scGood").textContent = stats.good;
  document.getElementById("scHelp").textContent = stats.help;
  document.getElementById("scHard").textContent = stats.hard;

  studyHardBtn.disabled = hardCardIds.size === 0;
  if (hardCardIds.size === 0) studyHardBtn.style.opacity = "0.5";
  else studyHardBtn.style.opacity = "1";

  sessionComplete.classList.remove("hidden");
}

function studyHardCards() {
  const hard = currentDeck.cards.filter((c) => hardCardIds.has(c.id));
  if (hard.length === 0) return;
  sessionComplete.classList.add("hidden");
  startStudyMode(hard);
}

function goBackToDeckView() {
  studyMode.classList.add("hidden");
  deckView.classList.remove("hidden");
  sessionComplete.classList.add("hidden");
}

// ============================================
// EXPORT
// ============================================

function exportDeck(format) {
  if (!currentDeck) return;
  const sep = "|";
  let content, filename, type;

  if (format === "txt") {
    content = currentDeck.cards
      .map((c) => `${c.question} | ${c.answer}`)
      .join("\n");
    filename = `${currentDeck.name}.txt`;
    type = "text/plain";
  } else if (format === "csv") {
    content =
      "Question,Answer\n" +
      currentDeck.cards
        .map(
          (c) =>
            `"${c.question.replace(/"/g, '""')}","${c.answer.replace(/"/g, '""')}"`,
        )
        .join("\n");
    filename = `${currentDeck.name}.csv`;
    type = "text/csv";
  } else {
    content = JSON.stringify(
      { name: currentDeck.name, cards: currentDeck.cards },
      null,
      2,
    );
    filename = `${currentDeck.name}.json`;
    type = "application/json";
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  exportModal.classList.add("hidden");
  showToast(`Exported as ${format.toUpperCase()} ✓`, "success");
}

// ============================================
// UI UPDATES
// ============================================

function updateMainView() {
  if (!currentDeck) {
    emptyState.classList.remove("hidden");
    deckView.classList.add("hidden");
    studyMode.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  studyMode.classList.add("hidden");
  deckView.classList.remove("hidden");

  document.getElementById("deckNameDisplay").textContent = currentDeck.name;
  updateCardCount();
  renderCards();

  // Default to bulk import experience
  switchTab("bulk");
}

function goBackToMain() {
  currentDeck = null;
  renderDecks(deckSearch.value);
  updateMainView();
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboard(e) {
  // Don't trigger shortcuts if typing in an input
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName))
    return;
  if (studyMode.classList.contains("hidden")) return;
  if (!sessionComplete.classList.contains("hidden")) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      flipCard();
      break;
    case "ArrowLeft":
      previousCard();
      break;
    case "ArrowRight":
      nextCard();
      break;
    case "1":
      markCard("good");
      break;
    case "2":
      markCard("help");
      break;
    case "3":
      markCard("hard");
      break;
    case "Escape":
      goBackToDeckView();
      break;
  }
}

// ============================================
// HELPERS
// ============================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let toastTimer;
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast${type ? " " + type : ""}`;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveToLocalStorage() {
  localStorage.setItem("studyflowDecks", JSON.stringify(decks));
}

// ============================================
// START
// ============================================

init();
console.log("🎓 StudyFlow loaded!");
