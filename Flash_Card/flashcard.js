// ============================================
// FLASHCARD APP - JAVASCRIPT
// ============================================

// Data Management
let decks = JSON.parse(localStorage.getItem("flashcardDecks")) || [];
let currentCardIndex = 0;
let currentDeckIndex = null;
let currentCards = [];
let correctCount = 0;
let wrongCount = 0;
let isFlipped = false;

// DOM Elements
const deckNameInput = document.getElementById("deckName");
const questionInput = document.getElementById("question");
const answerInput = document.getElementById("answer");
const addCardBtn = document.getElementById("addCardBtn");
const createDeckBtn = document.getElementById("createDeckBtn");
const cardsPreview = document.getElementById("cardsPreview");
const decksList = document.getElementById("decksList");
const studyMode = document.getElementById("studyMode");
const deckTitle = document.getElementById("deckTitle");
const flashcard = document.getElementById("flashcard");
const cardQuestion = document.getElementById("cardQuestion");
const cardAnswer = document.getElementById("cardAnswer");
const cardProgress = document.getElementById("cardProgress");
const progressFill = document.getElementById("progressFill");
const flipBtn = document.getElementById("flipBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const markCorrectBtn = document.getElementById("markCorrectBtn");
const markWrongBtn = document.getElementById("markWrongBtn");
const exitStudyBtn = document.getElementById("exitStudyBtn");
const correctCount_el = document.getElementById("correctCount");
const wrongCount_el = document.getElementById("wrongCount");
const accuracy = document.getElementById("accuracy");
const navbar = document.querySelector(".navbar");

// Temporary card storage during creation
let tempCards = [];

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

window.addEventListener(
  "scroll",
  () => {
    if (window.pageYOffset > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  },
  { passive: true },
);

// ============================================
// ADD CARD FUNCTIONALITY
// ============================================

addCardBtn.addEventListener("click", () => {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (!question || !answer) {
    alert("Please fill in both question and answer");
    return;
  }

  tempCards.push({ question, answer });
  questionInput.value = "";
  answerInput.value = "";
  questionInput.focus();

  renderCardsPreview();
});

// ============================================
// RENDER CARDS PREVIEW
// ============================================

function renderCardsPreview() {
  if (tempCards.length === 0) {
    cardsPreview.innerHTML = '<p class="empty-state">No cards added yet</p>';
    return;
  }

  cardsPreview.innerHTML = tempCards
    .map(
      (card, index) => `
        <div class="card-item">
            <div class="card-q">Q: ${card.question}</div>
            <div class="card-a">A: ${card.answer}</div>
            <button class="btn btn-secondary" style="margin-top: 1rem; width: 100%;" onclick="removeCard(${index})">Remove</button>
        </div>
    `,
    )
    .join("");
}

// ============================================
// REMOVE CARD
// ============================================

function removeCard(index) {
  tempCards.splice(index, 1);
  renderCardsPreview();
}

// ============================================
// CREATE DECK
// ============================================

createDeckBtn.addEventListener("click", () => {
  const deckName = deckNameInput.value.trim();

  if (!deckName) {
    alert("Please enter a deck name");
    return;
  }

  if (tempCards.length === 0) {
    alert("Please add at least one card");
    return;
  }

  const newDeck = {
    id: Date.now(),
    name: deckName,
    cards: [...tempCards],
    createdAt: new Date().toLocaleDateString(),
  };

  decks.push(newDeck);
  localStorage.setItem("flashcardDecks", JSON.stringify(decks));

  // Reset form
  deckNameInput.value = "";
  tempCards = [];
  cardsPreview.innerHTML = '<p class="empty-state">No cards added yet</p>';

  renderDecks();
  alert(`Deck "${deckName}" created successfully!`);
});

// ============================================
// RENDER DECKS
// ============================================

function renderDecks() {
  if (decks.length === 0) {
    decksList.innerHTML =
      '<p class="empty-state">No decks created yet. Create one to get started!</p>';
    return;
  }

  decksList.innerHTML = decks
    .map(
      (deck, index) => `
        <div class="deck-card" onclick="startStudy(${index})">
            <div class="deck-name">${deck.name}</div>
            <div class="deck-count">${deck.cards.length} cards</div>
            <div style="margin-top: 1rem; font-size: 0.85rem; color: #6b7280;">Created: ${deck.createdAt}</div>
            <button class="btn btn-secondary" style="margin-top: 1rem; width: 100%; font-size: 0.8rem;" onclick="deleteDeck(event, ${index})">Delete</button>
        </div>
    `,
    )
    .join("");
}

// ============================================
// DELETE DECK
// ============================================

function deleteDeck(event, index) {
  event.stopPropagation();
  if (confirm("Are you sure you want to delete this deck?")) {
    decks.splice(index, 1);
    localStorage.setItem("flashcardDecks", JSON.stringify(decks));
    renderDecks();
  }
}

// ============================================
// START STUDY MODE
// ============================================

function startStudy(deckIndex) {
  currentDeckIndex = deckIndex;
  currentCards = [...decks[deckIndex].cards];
  currentCardIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  isFlipped = false;

  deckTitle.textContent = decks[deckIndex].name;

  // Hide decks list and show study mode
  document.querySelector(".decks-list").style.display = "none";
  studyMode.style.display = "block";
  studyMode.style.animation = "fadeInUp 0.8s ease-out forwards";
  studyMode.style.opacity = "0";
  setTimeout(() => {
    studyMode.style.opacity = "1";
  }, 10);

  showCard();
  updateStats();
}

// ============================================
// SHOW CARD
// ============================================

function showCard() {
  if (currentCardIndex >= currentCards.length) {
    showStudyComplete();
    return;
  }

  const card = currentCards[currentCardIndex];
  cardQuestion.textContent = card.question;
  cardAnswer.textContent = card.answer;
  isFlipped = false;
  flashcard.classList.remove("flipped");

  updateProgress();
}

// ============================================
// UPDATE PROGRESS
// ============================================

function updateProgress() {
  cardProgress.textContent = `${currentCardIndex + 1} / ${currentCards.length}`;
  const progress = ((currentCardIndex + 1) / currentCards.length) * 100;
  progressFill.style.width = progress + "%";
}

// ============================================
// FLIP CARD
// ============================================

flipBtn.addEventListener("click", () => {
  isFlipped = !isFlipped;
  flashcard.classList.toggle("flipped");
});

// ============================================
// NAVIGATION
// ============================================

prevBtn.addEventListener("click", () => {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    showCard();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentCardIndex < currentCards.length - 1) {
    currentCardIndex++;
    showCard();
  }
});

// ============================================
// MARK CORRECT/WRONG
// ============================================

markCorrectBtn.addEventListener("click", () => {
  correctCount++;
  nextCard();
});

markWrongBtn.addEventListener("click", () => {
  wrongCount++;
  nextCard();
});

function nextCard() {
  currentCardIndex++;
  updateStats();
  showCard();
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats() {
  const total = correctCount + wrongCount;
  const acc = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  correctCount_el.textContent = correctCount;
  wrongCount_el.textContent = wrongCount;
  accuracy.textContent = acc + "%";
}

// ============================================
// SHOW STUDY COMPLETE
// ============================================

function showStudyComplete() {
  const total = correctCount + wrongCount;
  const accuracy_score =
    total === 0 ? 0 : Math.round((correctCount / total) * 100);

  flashcard.innerHTML = `
        <div class="flashcard-inner" style="transform: none;">
            <div class="flashcard-front" style="position: static; backface-visibility: visible; transform: none;">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">🎉 Study Complete!</h2>
                <p style="font-size: 1.2rem; margin: 1rem 0;">You completed all cards</p>
                <div style="margin: 2rem 0; font-size: 3rem; font-weight: 700; color: var(--accent-sage);">
                    ${accuracy_score}% Accuracy
                </div>
                <p style="font-size: 1.1rem; margin: 1rem 0;">
                    <strong>${correctCount}</strong> Correct • <strong>${wrongCount}</strong> Wrong
                </p>
            </div>
        </div>
    `;

  document.querySelector(".study-controls").style.display = "none";
}

// ============================================
// EXIT STUDY MODE
// ============================================

exitStudyBtn.addEventListener("click", () => {
  studyMode.style.display = "none";
  document.querySelector(".decks-list").style.display = "block";
  currentDeckIndex = null;
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});

// ============================================
// INTERSECTION OBSERVER
// ============================================

const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
    }
  });
}, observerOptions);

document.querySelectorAll(".section-header").forEach((item) => {
  observer.observe(item);
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener("keydown", (e) => {
  if (!studyMode || studyMode.style.display === "none") return;

  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    flipBtn.click();
  }
  if (e.key === "ArrowLeft") prevBtn.click();
  if (e.key === "ArrowRight") nextBtn.click();
});

// ============================================
// INITIALIZE APP
// ============================================

renderDecks();

console.log("🎓 FlashLearn app loaded successfully!");
