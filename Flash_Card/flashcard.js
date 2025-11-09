(() => {
  const questionInput = document.getElementById('questionInput');
  const answerInput = document.getElementById('answerInput');
  const saveBtn = document.getElementById('saveBtn');
  const cardList = document.getElementById('cardList');
  const startStudyBtn = document.getElementById('startStudyBtn');
  const studySection = document.getElementById('study-section');
  const studyQuestion = document.getElementById('studyQuestion');
  const studyAnswer = document.getElementById('studyAnswer');
  const showAnswerBtn = document.getElementById('showAnswerBtn');
  const correctBtn = document.getElementById('correctBtn');
  const wrongBtn = document.getElementById('wrongBtn');
  const exitStudyBtn = document.getElementById('exitStudyBtn');
  const themeToggle = document.getElementById('themeToggle');

  let cards = JSON.parse(localStorage.getItem('flashcards')) || [];
  let currentIndex = 0;

  // Theme Toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
  });

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
  }

  // Save Flashcard
  saveBtn.addEventListener('click', () => {
    const q = questionInput.value.trim();
    const a = answerInput.value.trim();
    if (!q || !a) {
      alert('Please enter both question and answer.');
      return;
    }
    cards.push({ q, a, box: 1 });
    localStorage.setItem('flashcards', JSON.stringify(cards));
    questionInput.value = '';
    answerInput.value = '';
    renderList();
  });

  // Render Flashcards
  function renderList() {
    cardList.innerHTML = '';
    if (cards.length === 0) {
      cardList.innerHTML = '<li>No flashcards yet.</li>';
      return;
    }
    cards.forEach((card, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${card.q}</span>
        <div>
          <button class="edit-btn" data-index="${index}">✏️</button>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        </div>
      `;
      cardList.appendChild(li);
    });
  }

  // Delete/Edit handlers
  cardList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const i = e.target.dataset.index;
      if (confirm('Delete this flashcard?')) {
        cards.splice(i, 1);
        localStorage.setItem('flashcards', JSON.stringify(cards));
        renderList();
      }
    }
    if (e.target.classList.contains('edit-btn')) {
      const i = e.target.dataset.index;
      questionInput.value = cards[i].q;
      answerInput.value = cards[i].a;
      cards.splice(i, 1);
      localStorage.setItem('flashcards', JSON.stringify(cards));
      renderList();
    }
  });

  // Study mode
  startStudyBtn.addEventListener('click', () => {
    if (cards.length === 0) {
      alert('No flashcards to study!');
      return;
    }
    currentIndex = 0;
    document.getElementById('create-section').classList.add('hidden');
    document.getElementById('list-section').classList.add('hidden');
    studySection.classList.remove('hidden');
    showStudyCard();
  });

  function showStudyCard() {
    if (currentIndex >= cards.length) {
      alert('You have studied all your cards!');
      exitStudy();
      return;
    }
    const card = cards[currentIndex];
    studyQuestion.textContent = card.q;
    studyAnswer.textContent = card.a;
    studyAnswer.classList.add('hidden');
    showAnswerBtn.classList.remove('hidden');
    correctBtn.classList.add('hidden');
    wrongBtn.classList.add('hidden');
  }

  showAnswerBtn.addEventListener('click', () => {
    studyAnswer.classList.remove('hidden');
    showAnswerBtn.classList.add('hidden');
    correctBtn.classList.remove('hidden');
    wrongBtn.classList.remove('hidden');
  });

  correctBtn.addEventListener('click', () => {
    cards[currentIndex].box = Math.min(cards[currentIndex].box + 1, 5);
    currentIndex++;
    showStudyCard();
    localStorage.setItem('flashcards', JSON.stringify(cards));
  });

  wrongBtn.addEventListener('click', () => {
    cards[currentIndex].box = 1;
    currentIndex++;
    showStudyCard();
    localStorage.setItem('flashcards', JSON.stringify(cards));
  });

  exitStudyBtn.addEventListener('click', exitStudy);

  function exitStudy() {
    studySection.classList.add('hidden');
    document.getElementById('create-section').classList.remove('hidden');
    document.getElementById('list-section').classList.remove('hidden');
  }

  renderList();
})();
