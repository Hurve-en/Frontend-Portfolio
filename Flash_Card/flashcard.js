// Wrap everything to avoid global scope pollution
(() => {
  // ======= DOM ELEMENTS =======
  const questionInput = document.getElementById("questionInput");
  const answerInput = document.getElementById("answerInput");
  const cardForm = document.getElementById("cardForm");
  const cardList = document.getElementById("cardList");
  const startStudyBtn = document.getElementById("startStudyBtn");
  const studySection = document.getElementById("studySection");
  const mainSection = document.getElementById("mainSection");
  const studyQuestion = document.getElementById("studyQuestion");
  const studyAnswer = document.getElementById("studyAnswer");
  const revealBtn = document.getElementById("revealBtn");
  const nextBtn = document.getElementById("nextBtn");
  const endStudyBtn = document.getElementById("endStudyBtn");
  const progress = document.getElementById("progress");
  const themeToggle = document.getElementById("themeToggle");

  // ======= DATA =======
  let cards = JSON.parse(localStorage.getItem("flashcards-v1")) || [];
  let settings = JSON.parse(localStorage.getItem("flashcard-settings")) || { theme: "dark" };
  let currentIndex = 0;
  let studyQueue = [];

  // ======= THEME HANDLING =======
  document.body.dataset.theme = settings.theme;
  themeToggle.addEventListener("click", () => {
    const newTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = newTheme;
    settings.theme = newTheme;
    saveSettings();
  });

  // ======= CARD MANAGEMENT =======
  function saveCards() {
    localStorage.setItem("flashcards-v1", JSON.stringify(cards));
  }

  function saveSettings() {
    localStorage.setItem("flashcard-settings", JSON.stringify(settings));
  }

  function renderCards() {
    cardList.innerHTML = "";
    if (cards.length === 0) {
      cardList.innerHTML = `<p class="muted">No cards yet.</p>`;
      return;
    }

    cards.forEach((card, index) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <span>${card.question}</span>
        <div class="card-actions">
          <button class="small-btn" data-edit="${index}">✏️</button>
          <button class="small-btn danger-btn" data-del="${index}">🗑</button>
        </div>
      `;
      cardList.appendChild(div);
    });
  }

  cardList.addEventListener("click", (e) => {
    if (e.target.dataset.del) {
      const index = parseInt(e.target.dataset.del);
      if (confirm("Delete this card?")) {
        cards.splice(index, 1);
        saveCards();
        renderCards();
      }
    } else if (e.target.dataset.edit) {
      const index = parseInt(e.target.dataset.edit);
      const card = cards[index];
      const newQ = prompt("Edit question:", card.question);
      const newA = prompt("Edit answer:", card.answer);
      if (newQ && newA) {
        cards[index].question = newQ;
        cards[index].answer = newA;
        saveCards();
        renderCards();
      }
    }
  });

  cardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = questionInput.value.trim();
    const a = answerInput.value.trim();
    if (!q || !a) return;

    cards.push({ question: q, answer: a, box: 1, lastReviewed: null });
    saveCards();
    renderCards();
    questionInput.value = "";
    answerInput.value = "";
  });

  // ======= STUDY MODE =======
  startStudyBtn.addEventListener("click", startStudy);
  revealBtn.addEventListener("click", revealAnswer);
  endStudyBtn.addEventListener("click", endStudy);

  function startStudy() {
    if (cards.length === 0) {
      alert("No cards to study!");
      return;
    }

    // Filter cards due for review
    const now = Date.now();
    studyQueue = cards.filter(card => {
      if (!card.lastReviewed) return true;
      const boxDelay = card.box * 24 * 60 * 60 * 1000; // 1 day * box number
      return now - new Date(card.lastReviewed).getTime() >= boxDelay;
    });

    if (studyQueue.length === 0) {
      alert("No cards are due for review yet!");
      return;
    }

    currentIndex = 0;
    mainSection.classList.add("hidden");
    studySection.classList.remove("hidden");
    showCard();
  }

  function showCard() {
    const card = studyQueue[currentIndex];
    if (!card) {
      endStudy();
      return;
    }
    studyQuestion.textContent = card.question;
    studyAnswer.textContent = card.answer;
    studyAnswer.style.display = "none";

    nextBtn.innerHTML = "";
    progress.textContent = `Card ${currentIndex + 1} of ${studyQueue.length}`;
  }

  function revealAnswer() {
    studyAnswer.style.display = "block";
    nextBtn.innerHTML = `
      <button id="correctBtn" class="primary-btn">✔ Correct</button>
      <button id="wrongBtn" class="danger-btn">✖ Wrong</button>
    `;
    document.getElementById("correctBtn").addEventListener("click", () => gradeCard(true));
    document.getElementById("wrongBtn").addEventListener("click", () => gradeCard(false));
  }

  function gradeCard(correct) {
    const card = studyQueue[currentIndex];
    card.lastReviewed = new Date().toISOString();
    if (correct) {
      card.box = Math.min(card.box + 1, 5);
    } else {
      card.box = 1; // reset to first box
    }

    // Save progress
    const indexInMain = cards.findIndex(c => c.question === card.question);
    if (indexInMain !== -1) cards[indexInMain] = card;
    saveCards();

    currentIndex++;
    if (currentIndex < studyQueue.length) {
      showCard();
    } else {
      alert("Session complete! 🎉");
      endStudy();
    }
  }

  function endStudy() {
    studySection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    studyQueue = [];
    renderCards();
  }

  // ======= INIT =======
  renderCards();
})();
