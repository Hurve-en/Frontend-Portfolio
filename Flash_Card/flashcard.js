// ============================================
// STUDYFLOW - DYNAMIC FLASHCARD APP
// ============================================

// DATA MANAGEMENT
let decks = JSON.parse(localStorage.getItem("studyflowDecks")) || [];
let currentDeck = null;
let currentCardIndex = 0;
let isFlipped = false;
let stats = {
  good: 0,
  help: 0,
  hard: 0,
};

// DOM ELEMENTS
const sidebar = document.querySelector(".sidebar");
const decksList = document.getElementById("decksList");
const mainContent = document.querySelector(".main-content");
const emptyState = document.getElementById("emptyState");
const deckView = document.getElementById("deckView");
const studyMode = document.getElementById("studyMode");
const newDeckModal = document.getElementById("newDeckModal");

// BUTTONS
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

// FORM INPUTS
const newDeckNameInput = document.getElementById("newDeckName");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");

// STUDY MODE ELEMENTS
const flashcard = document.getElementById("flashcard");
const studyQuestion = document.getElementById("studyQuestion");
const studyAnswer = document.getElementById("studyAnswer");
const flipCardBtn = document.getElementById("flipCardBtn");
const prevCardBtn = document.getElementById("prevCardBtn");
const nextCardBtn = document.getElementById("nextCardBtn");
const markGoodBtn = document.getElementById("markGoodBtn");
const markNeedHelpBtn = document.getElementById("markNeedHelpBtn");
const markHardBtn = document.getElementById("markHardBtn");

// ============================================
// INITIALIZE APP
// ============================================

function init() {
  renderDecks();
  updateMainView();
  attachEventListeners();
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
  // Deck management
  newDeckBtn.addEventListener("click", openNewDeckModal);
  createFirstDeckBtn.addEventListener("click", openNewDeckModal);
  closeModalBtn.addEventListener("click", closeNewDeckModal);
  confirmDeckBtn.addEventListener("click", createNewDeck);
  cancelDeckBtn.addEventListener("click", closeNewDeckModal);
  backBtn.addEventListener("click", goBackToDeckView);
  deleteDeckBtn.addEventListener("click", deleteDeck);
  exitStudyBtn.addEventListener("click", goBackToDeckView);

  // Card management
  addCardBtn.addEventListener("click", addCard);
  questionInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) addCard();
  });

  // Study mode
  startStudyBtn.addEventListener("click", startStudyMode);
  flipCardBtn.addEventListener("click", flipCard);
  prevCardBtn.addEventListener("click", previousCard);
  nextCardBtn.addEventListener("click", nextCard);
  markGoodBtn.addEventListener("click", () => markCard("good"));
  markNeedHelpBtn.addEventListener("click", () => markCard("help"));
  markHardBtn.addEventListener("click", () => markCard("hard"));

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboard);
}

// ============================================
// DECK MANAGEMENT
// ============================================

function renderDecks() {
  if (decks.length === 0) {
    decksList.innerHTML = '<p class="empty-decks">No decks yet</p>';
    return;
  }

  decksList.innerHTML = decks
    .map(
      (deck, index) => `
        <div class="deck-item ${currentDeck && currentDeck.id === deck.id ? "active" : ""}" onclick="selectDeck(${index})">
            <div class="deck-name">${deck.name}</div>
            <div class="deck-meta">${deck.cards.length} cards</div>
        </div>
    `,
    )
    .join("");
}

function selectDeck(index) {
  currentDeck = decks[index];
  renderDecks();
  updateMainView();
}

function openNewDeckModal() {
  newDeckModal.classList.remove("hidden");
  newDeckNameInput.focus();
}

function closeNewDeckModal() {
  newDeckModal.classList.add("hidden");
  newDeckNameInput.value = "";
}

function createNewDeck() {
  const deckName = newDeckNameInput.value.trim();

  if (!deckName) {
    alert("Please enter a deck name");
    return;
  }

  const newDeck = {
    id: Date.now(),
    name: deckName,
    cards: [],
    createdAt: new Date().toLocaleDateString(),
  };

  decks.push(newDeck);
  saveToLocalStorage();
  currentDeck = newDeck;

  closeNewDeckModal();
  renderDecks();
  updateMainView();
}

function deleteDeck() {
  if (confirm(`Are you sure you want to delete "${currentDeck.name}"?`)) {
    decks = decks.filter((d) => d.id !== currentDeck.id);
    saveToLocalStorage();
    currentDeck = null;
    renderDecks();
    updateMainView();
  }
}

// ============================================
// CARD MANAGEMENT
// ============================================

function addCard() {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (!question || !answer) {
    alert("Please fill in both question and answer");
    return;
  }

  if (!currentDeck) {
    alert("Please select or create a deck first");
    return;
  }

  const newCard = {
    id: Date.now(),
    question,
    answer,
  };

  currentDeck.cards.push(newCard);
  saveToLocalStorage();

  // Clear inputs
  questionInput.value = "";
  answerInput.value = "";
  questionInput.focus();

  renderCards();
  updateCardCount();
}

function renderCards() {
  const cardsList = document.getElementById("cardsList");

  if (!currentDeck || currentDeck.cards.length === 0) {
    cardsList.innerHTML =
      '<p class="empty-cards">No cards yet. Add your first card above!</p>';
    return;
  }

  cardsList.innerHTML = currentDeck.cards
    .map(
      (card, index) => `
        <div class="card-item">
            <div class="card-q">Q: ${card.question}</div>
            <div class="card-a">A: ${card.answer}</div>
            <div class="card-actions">
                <button class="btn-card-delete" onclick="deleteCard(${index})">Delete</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function deleteCard(index) {
  if (confirm("Delete this card?")) {
    currentDeck.cards.splice(index, 1);
    saveToLocalStorage();
    renderCards();
    updateCardCount();
  }
}

function updateCardCount() {
  document.getElementById("cardCountDisplay").textContent =
    `${currentDeck.cards.length} cards`;
}

// ============================================
// STUDY MODE
// ============================================

function startStudyMode() {
  if (currentDeck.cards.length === 0) {
    alert("Add some cards first!");
    return;
  }

  currentCardIndex = 0;
  isFlipped = false;
  stats = { good: 0, help: 0, hard: 0 };

  deckView.classList.add("hidden");
  studyMode.classList.remove("hidden");

  showCard();
  updateStudyStats();
}

function showCard() {
  if (!currentDeck || currentDeck.cards.length === 0) return;

  const card = currentDeck.cards[currentCardIndex];
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
  if (currentCardIndex < currentDeck.cards.length - 1) {
    currentCardIndex++;
    showCard();
  }
}

function markCard(type) {
  stats[type]++;
  updateStudyStats();
  nextCard();
}

function updateProgress() {
  const progress = ((currentCardIndex + 1) / currentDeck.cards.length) * 100;
  document.getElementById("progressFill").style.width = progress + "%";
  document.getElementById("studyProgress").textContent =
    `${currentCardIndex + 1} / ${currentDeck.cards.length}`;
}

function updateButtonStates() {
  prevCardBtn.disabled = currentCardIndex === 0;
  nextCardBtn.disabled = currentCardIndex === currentDeck.cards.length - 1;
}

function updateStudyStats() {
  document.getElementById("goodCount").textContent = stats.good;
  document.getElementById("helpCount").textContent = stats.help;
  document.getElementById("hardCount").textContent = stats.hard;
}

// ============================================
// UI UPDATES
// ============================================

function updateMainView() {
  if (decks.length === 0) {
    emptyState.classList.remove("hidden");
    deckView.classList.add("hidden");
    studyMode.classList.add("hidden");
  } else if (currentDeck) {
    emptyState.classList.add("hidden");
    deckView.classList.remove("hidden");
    studyMode.classList.add("hidden");

    document.getElementById("deckNameDisplay").textContent = currentDeck.name;
    updateCardCount();
    renderCards();
  } else {
    emptyState.classList.remove("hidden");
    deckView.classList.add("hidden");
    studyMode.classList.add("hidden");
  }
}

function goBackToDeckView() {
  studyMode.classList.add("hidden");
  deckView.classList.remove("hidden");
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboard(e) {
  if (studyMode.classList.contains("hidden")) return;

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
  }
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveToLocalStorage() {
  localStorage.setItem("studyflowDecks", JSON.stringify(decks));
}

// ============================================
// INITIALIZE
// ============================================

init();

console.log("🎓 StudyFlow loaded successfully!");
