// Sample flashcard data - Replace with your own
const flashcards = [
  {
    question: "What is the capital of France?",
    answer: "Paris",
  },
  {
    question: "What is 15 × 12?",
    answer: "180",
  },
  {
    question: "Who wrote Romeo and Juliet?",
    answer: "William Shakespeare",
  },
  {
    question: "What is the chemical symbol for Gold?",
    answer: "Au",
  },
  {
    question: "What year did the Titanic sink?",
    answer: "1912",
  },
  {
    question: "What is the largest planet in our solar system?",
    answer: "Jupiter",
  },
  {
    question: "What is the square root of 144?",
    answer: "12",
  },
  {
    question: "Who painted the Mona Lisa?",
    answer: "Leonardo da Vinci",
  },
  {
    question: "What is the formula for calculating velocity?",
    answer: "Distance ÷ Time",
  },
  {
    question: "What is the smallest country in the world?",
    answer: "Vatican City",
  },
];

// Study state
let currentIndex = 0;
let mastered = 0;
let skipped = 0;
let isFlipped = false;

// DOM elements
const mainCard = document.getElementById("mainCard");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const skipBtn = document.getElementById("skipBtn");
const masterBtn = document.getElementById("masterBtn");
const cardCount = document.getElementById("cardCount");
const totalCards = document.getElementById("totalCards");
const masteredCount = document.getElementById("masteredCount");
const remainingCount = document.getElementById("remainingCount");
const accuracy = document.getElementById("accuracy");
const cardContainer = document.querySelector(".card-container");

// Initialize
function init() {
  totalCards.textContent = flashcards.length;
  updateCard();
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  mainCard.addEventListener("click", toggleFlip);
  skipBtn.addEventListener("click", skip);
  masterBtn.addEventListener("click", master);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      toggleFlip();
    }
    if (e.code === "ArrowLeft") skip();
    if (e.code === "ArrowRight") master();
  });
}

// Toggle card flip
function toggleFlip() {
  isFlipped = !isFlipped;
  mainCard.classList.toggle("flipped");
}

// Skip card
function skip() {
  if (currentIndex >= flashcards.length) return;

  skipped++;
  animateExit("skip");

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < flashcards.length) {
      isFlipped = false;
      mainCard.classList.remove("flipped");
      updateCard();
    } else {
      showCompletion();
    }
  }, 600);
}

// Master card
function master() {
  if (currentIndex >= flashcards.length) return;

  mastered++;
  animateExit("next");

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < flashcards.length) {
      isFlipped = false;
      mainCard.classList.remove("flipped");
      updateCard();
    } else {
      showCompletion();
    }
  }, 600);
}

// Animate exit
function animateExit(direction) {
  cardContainer.classList.add(direction);
  setTimeout(() => {
    cardContainer.classList.remove(direction);
    cardContainer.style.opacity = "1";
  }, 600);
}

// Update card display
function updateCard() {
  const card = flashcards[currentIndex];
  questionText.textContent = card.question;
  answerText.textContent = card.answer;
  cardCount.textContent = currentIndex + 1;

  updateStats();

  // Fade in animation
  questionText.style.animation = "none";
  setTimeout(() => {
    questionText.style.animation =
      "fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
  }, 10);
}

// Update statistics
function updateStats() {
  const total = flashcards.length;
  const remaining = total - currentIndex;
  const total_answered = mastered + skipped;
  const acc =
    total_answered > 0 ? Math.round((mastered / total_answered) * 100) : 0;

  masteredCount.textContent = mastered;
  remainingCount.textContent = remaining;
  accuracy.textContent = acc + "%";
}

// Show completion screen
function showCompletion() {
  const total = flashcards.length;
  const acc = mastered > 0 ? Math.round((mastered / total) * 100) : 0;

  const message =
    acc >= 80
      ? "🎉 Excellent! You've mastered this deck!"
      : acc >= 60
        ? "🌟 Great job! Keep practicing!"
        : "💪 Good effort! Study more and try again!";

  const mainContent = document.querySelector(".container");
  mainContent.innerHTML = `
        <div style="text-align: center; animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <h2 style="font-size: 32px; margin-bottom: 20px; letter-spacing: -0.5px;">Study Complete</h2>
            <p style="font-size: 48px; font-weight: 700; margin-bottom: 30px; background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${acc}%</p>
            <p style="font-size: 18px; color: #a0a0a0; margin-bottom: 20px;">${message}</p>
            <div style="margin-top: 40px; font-size: 14px; color: #a0a0a0;">
                <p>Mastered: <strong style="color: #6366f1;">${mastered}</strong> / Skipped: <strong>${skipped}</strong></p>
            </div>
            <button onclick="location.reload()" style="margin-top: 40px; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #ec4899); border: none; color: white; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.1em;">Study Again</button>
        </div>
    `;
}

// Start the app
init();
