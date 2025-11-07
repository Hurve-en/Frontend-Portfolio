/* app.js - Dark Minimal Flashcard App with Simple Leitner SRS
   - Features:
     * Manual add/edit/delete cards
     * Bulk import (tab-separated & Q:/A: formats) with preview + fix
     * Simple Leitner SRS (boxes 1..5 with intervals)
     * List-based UI + Study session (start/stop, shuffle, session size)
     * Persist cards & settings in localStorage (namespace: flashcards-v1)
     * Export/Import JSON
     * Keyboard shortcuts and accessibility hints
   - Author: generated for you (modular, avoids globals)
*/

(function () {
  'use strict';

  /* ============================
     Constants & Storage Keys
     ============================ */
  const LS_KEY = 'flashcards-v1';
  const SETTINGS_KEY = 'flashcards-settings-v1';
  const BOX_INTERVALS_DAYS = [1, 2, 5, 10, 20]; // box 1..5 -> days until next review
  const MAX_PREVIEW_IMPORT = 200; // cap preview size for very large imports

  /* ============================
     DOM refs (match index.html)
     ============================ */
  const addCardBtn = document.getElementById('addCardBtn');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const studyBtn = document.getElementById('studyBtn');

  const cardFormSection = document.getElementById('cardFormSection');
  const cardForm = document.getElementById('cardForm');
  const questionInput = document.getElementById('questionInput');
  const answerInput = document.getElementById('answerInput');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  const importSection = document.getElementById('importSection');
  const bulkInput = document.getElementById('bulkInput');
  const parseBtn = document.getElementById('parseBtn');
  const importCancelBtn = document.getElementById('importCancelBtn');
  const importPreview = document.getElementById('importPreview');

  const cardsContainer = document.getElementById('cardsContainer');

  const studySection = document.getElementById('studySection');
  const studyQuestion = document.getElementById('studyQuestion');
  const studyAnswer = document.getElementById('studyAnswer');
  const revealBtn = document.getElementById('revealBtn');
  const nextBtn = document.getElementById('nextBtn');
  const endStudyBtn = document.getElementById('endStudyBtn');
  const progressEl = document.getElementById('progress');

  const setAlarmBtn = null; // placeholder not used here

  /* ============================
     App State
     ============================ */
  let cards = []; // array of card objects
  let settings = {
    srsEnabled: true,
    sessionSize: 20,
    themeLight: false
  };

  // study session runtime state
  let session = {
    active: false,
    queue: [], // card ids
    index: 0,
    studied: 0,
    correct: 0,
    incorrect: 0,
    revealed: false
  };

  // editing state
  let editingCardId = null;

  /* ============================
     Utilities
     ============================ */

  function uid() {
    return 'c_' + Math.random().toString(36).slice(2, 9);
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function addDaysISO(isoDate, days) {
    const dt = new Date(isoDate + 'T00:00:00');
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
  }

  function saveAll() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cards));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      alert('Storage unavailable: cannot save data. Your progress will not persist.');
    }
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      cards = raw ? JSON.parse(raw) : [];
    } catch (e) {
      cards = [];
    }
    try {
      const sraw = localStorage.getItem(SETTINGS_KEY);
      if (sraw) Object.assign(settings, JSON.parse(sraw));
    } catch (e) {}
  }

  function scheduleNextForBox(box, fromISO = todayISO()) {
    // clamp box 1..5
    const b = Math.max(1, Math.min(5, box));
    const days = BOX_INTERVALS_DAYS[b - 1] || 1;
    return addDaysISO(fromISO, days);
  }

  /* ============================
     Card Data Model Helpers
     ============================ */

  function makeCard(question, answer) {
    const id = uid();
    const card = {
      id,
      question: question.trim(),
      answer: answer.trim(),
      box: 1,
      lastReviewed: null,
      nextReview: todayISO(), // new card due today
      createdAt: new Date().toISOString()
    };
    return card;
  }

  function addCard(q, a) {
    const card = makeCard(q, a);
    cards.unshift(card);
    saveAll();
    renderCardsList();
    return card;
  }

  function updateCard(id, newQ, newA) {
    const c = cards.find(x => x.id === id);
    if (!c) return null;
    c.question = (newQ || '').trim();
    c.answer = (newA || '').trim();
    c.createdAt = c.createdAt || new Date().toISOString();
    saveAll();
    renderCardsList();
    return c;
  }

  function deleteCard(id) {
    if (!confirm('Delete this card? This cannot be undone.')) return false;
    cards = cards.filter(c => c.id !== id);
    saveAll();
    renderCardsList();
    return true;
  }

  /* ============================
     Rendering: Card List
     ============================ */

  function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderCardsList() {
    clearElement(cardsContainer);
    if (cards.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No cards yet — add one or import.';
      cardsContainer.appendChild(p);
      return;
    }

    // show each card with edit/delete + metadata
    cards.forEach(card => {
      const div = document.createElement('div');
      div.className = 'card';
      div.dataset.id = card.id;

      const content = document.createElement('div');
      content.className = 'card-content';
      const q = document.createElement('div');
      q.className = 'card-q';
      q.textContent = card.question;
      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.style.fontSize = '0.85rem';
      meta.style.opacity = '0.8';
      meta.textContent = `Box ${card.box} · Next: ${card.nextReview || '—'}`;

      content.appendChild(q);
      content.appendChild(meta);

      const btns = document.createElement('div');
      btns.className = 'card-buttons';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.title = 'Edit card (E)';
      editBtn.addEventListener('click', () => openEditCard(card.id));

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.title = 'Delete card (D)';
      delBtn.addEventListener('click', () => {
        if (deleteCard(card.id)) {
          // if editing this card, cancel edit
          if (editingCardId === card.id) cancelEdit();
        }
      });

      btns.appendChild(editBtn);
      btns.appendChild(delBtn);

      div.appendChild(content);
      div.appendChild(btns);
      cardsContainer.appendChild(div);
    });
  }

  /* ============================
     Form: Add / Edit
     ============================ */

  function openAddForm() {
    editingCardId = null;
    questionInput.value = '';
    answerInput.value = '';
    cardFormSection.classList.remove('hidden');
    importSection.classList.add('hidden');
    studySection.classList.add('hidden');
    questionInput.focus();
  }

  function openEditCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    editingCardId = id;
    questionInput.value = card.question;
    answerInput.value = card.answer;
    cardFormSection.classList.remove('hidden');
    importSection.classList.add('hidden');
    studySection.classList.add('hidden');
    questionInput.focus();
  }

  function cancelEdit() {
    editingCardId = null;
    cardFormSection.classList.add('hidden');
    questionInput.value = '';
    answerInput.value = '';
  }

  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = questionInput.value.trim();
    const a = answerInput.value.trim();
    if (!q || !a) {
      alert('Question and Answer cannot be empty.');
      return;
    }
    if (editingCardId) {
      updateCard(editingCardId, q, a);
    } else {
      addCard(q, a);
    }
    cancelEdit();
  });

  cancelEditBtn.addEventListener('click', () => cancelEdit());

  addCardBtn.addEventListener('click', () => {
    openAddForm();
  });

  /* ============================
     Bulk import: parsing & preview
     ============================ */

  importBtn.addEventListener('click', () => {
    importSection.classList.remove('hidden');
    cardFormSection.classList.add('hidden');
    studySection.classList.add('hidden');
    bulkInput.focus();
    importPreview.innerHTML = '';
  });

  importCancelBtn.addEventListener('click', () => {
    importSection.classList.add('hidden');
    importPreview.innerHTML = '';
  });

  // Attempt to parse bulk input into an array of {question, answer, error}
  function parseBulkInput(text) {
    const lines = text.replace(/\r/g, '').split('\n');
    // detect format heuristics: if many lines have a tab -> tab-separated
    const nonEmptyLines = lines.filter(l => l.trim() !== '');
    let tabCount = 0;
    for (const l of nonEmptyLines.slice(0, 40)) {
      if (l.includes('\t')) tabCount++;
    }
    if (tabCount >= Math.max(1, Math.floor(nonEmptyLines.length / 4))) {
      // parse as tab separated (Q \t A)
      const parsed = [];
      for (const l of nonEmptyLines) {
        const idx = l.indexOf('\t');
        if (idx === -1) {
          parsed.push({ question: '', answer: '', error: 'No tab found' , raw: l});
        } else {
          const q = l.slice(0, idx).trim();
          const a = l.slice(idx + 1).trim();
          if (!q || !a) parsed.push({ question: q, answer: a, error: (!q ? 'Empty question' : 'Empty answer'), raw: l});
          else parsed.push({ question: q, answer: a, error: null, raw: l});
        }
      }
      return parsed;
    }

    // else attempt Q:/A: format (groups separated by blank lines)
    const parsed = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === '') { i++; continue; }
      if (/^Q[:\-]\s*/i.test(line)) {
        const q = line.replace(/^Q[:\-]\s*/i, '').trim();
        i++;
        // collect following lines until line that starts with A: or blank
        let answerLines = [];
        // skip until we find A:
        if (i < lines.length && /^A[:\-]\s*/i.test(lines[i].trim())) {
          // if A line immediate
          answerLines.push(lines[i].replace(/^A[:\-]\s*/i, '').trim());
          i++;
          // then collect subsequent non-empty lines until blank or next Q:
          while (i < lines.length && lines[i].trim() !== '' && !/^Q[:\-]\s*/i.test(lines[i].trim())) {
            answerLines.push(lines[i].trim());
            i++;
          }
        } else {
          // malformed - missing A:
          parsed.push({ question: q, answer: '', error: 'Missing A: line', raw: q });
          continue;
        }
        const a = answerLines.join('\n').trim();
        if (!q || !a) parsed.push({ question: q, answer: a, error: (!q ? 'Empty question' : 'Empty answer'), raw: q + ' / ' + a});
        else parsed.push({ question: q, answer: a, error: null, raw: q + ' / ' + a});
        continue;
      } else {
        // line doesn't start with Q: - try to parse pairs: line1 = Q, line2 = A
        const qline = line;
        const anext = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        if (/^A[:\-]\s*/i.test(anext)) {
          // if next line is A:, rely on that branch earlier - skip
          i++;
          continue;
        } else {
          // ambiguous: treat as malformed pair
          parsed.push({ question: qline, answer: '', error: 'Unrecognized format', raw: qline });
          i++;
        }
      }
    }
    return parsed;
  }

  // Render preview with inline edit for malformed or all (allow user to edit before import)
  function renderImportPreview(parsed) {
    importPreview.innerHTML = '';
    const info = document.createElement('div');
    info.style.marginBottom = '8px';
    const total = parsed.length;
    const bad = parsed.filter(p => p.error).length;
    info.textContent = `Parsed ${total} items — ${bad} malformed`;
    importPreview.appendChild(info);

    // show up to cap preview entries
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '6px';
    const cap = Math.min(parsed.length, MAX_PREVIEW_IMPORT);
    for (let i = 0; i < cap; i++) {
      const p = parsed[i];
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '6px';
      row.style.alignItems = 'center';
      row.style.background = 'transparent';
      row.style.padding = '6px';
      row.style.borderRadius = '6px';
      const qinp = document.createElement('textarea');
      qinp.value = p.question || '';
      qinp.rows = 1;
      qinp.style.flex = '1';
      qinp.style.minHeight = '32px';
      qinp.style.resize = 'vertical';
      const ainp = document.createElement('textarea');
      ainp.value = p.answer || '';
      ainp.rows = 1;
      ainp.style.flex = '1';
      ainp.style.minHeight = '32px';
      // show error
      if (p.error) {
        row.style.border = '1px dashed var(--error-color)';
        const err = document.createElement('div');
        err.textContent = p.error;
        err.style.color = 'var(--error-color)';
        err.style.minWidth = '120px';
        err.style.fontSize = '0.9rem';
        err.style.padding = '4px';
        row.appendChild(err);
      } else {
        const ok = document.createElement('div');
        ok.textContent = 'OK';
        ok.style.color = 'var(--success-color)';
        ok.style.minWidth = '60px';
        ok.style.fontSize = '0.9rem';
        row.appendChild(ok);
      }
      row.appendChild(qinp);
      row.appendChild(ainp);
      list.appendChild(row);

      // attach convenience: update parsed object if user edits before import
      qinp.addEventListener('input', () => { parsed[i].question = qinp.value; parsed[i].error = !parsed[i].question || !parsed[i].answer ? 'Empty field' : null; });
      ainp.addEventListener('input', () => { parsed[i].answer = ainp.value; parsed[i].error = !parsed[i].question || !parsed[i].answer ? 'Empty field' : null; });
    }
    importPreview.appendChild(list);

    // add import confirmation controls
    const controls = document.createElement('div');
    controls.style.marginTop = '8px';
    const importConfirm = document.createElement('button');
    importConfirm.textContent = 'Import Parsed';
    importConfirm.addEventListener('click', () => {
      // confirm and add parsed cards, skip malformed unless fixed
      let added = 0;
      for (let i = 0; i < parsed.length; i++) {
        const p = parsed[i];
        if (!p.question || !p.answer) continue; // skip
        // dedupe: skip if exact duplicate exists and user did not want dedupe? we always dedupe silently here
        const exists = cards.some(c => c.question === p.question && c.answer === p.answer);
        if (exists) continue;
        addCard(p.question, p.answer);
        added++;
      }
      importSection.classList.add('hidden');
      importPreview.innerHTML = '';
      alert(`Imported ${added} cards.`);
    });
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.style.marginLeft = '8px';
    cancel.addEventListener('click', () => {
      importPreview.innerHTML = '';
      importSection.classList.add('hidden');
    });
    controls.appendChild(importConfirm);
    controls.appendChild(cancel);
    importPreview.appendChild(controls);
  }

  parseBtn.addEventListener('click', () => {
    const text = bulkInput.value || '';
    if (!text.trim()) {
      alert('Paste some text to parse.');
      return;
    }
    const parsed = parseBulkInput(text);
    renderImportPreview(parsed);
  });

  /* ============================
     Study Session Logic (List-based)
     ============================ */

  function openStudyMode() {
    studySection.classList.remove('hidden');
    cardFormSection.classList.add('hidden');
    importSection.classList.add('hidden');
    // prepare queue: due cards if SRS enabled, else all cards
    let candidates = cards.slice(); // copy
    if (settings.srsEnabled) {
      const today = todayISO();
      candidates = candidates.filter(c => !c.nextReview || c.nextReview <= today);
    }
    if (candidates.length === 0) {
      alert('No cards due for review. Disable SRS or add cards.');
      return;
    }
    // shuffle candidates
    shuffleArray(candidates);
    // limit to session size
    const sessionSize = Math.max(1, settings.sessionSize || 20);
    const limited = candidates.slice(0, sessionSize);
    session.queue = limited.map(c => c.id);
    session.index = 0;
    session.active = true;
    session.studied = 0;
    session.correct = 0;
    session.incorrect = 0;
    session.revealed = false;
    studyBtn.textContent = '⏸ Stop';
    renderStudyCard();
    updateProgress();
  }

  function endStudyMode() {
    session.active = false;
    session.queue = [];
    session.index = 0;
    session.studied = 0;
    session.correct = 0;
    session.incorrect = 0;
    session.revealed = false;
    studySection.classList.add('hidden');
    studyBtn.textContent = '▶ Study';
    saveAll();
  }

  studyBtn.addEventListener('click', () => {
    if (session.active) {
      if (!confirm('Stop current session?')) return;
      endStudyMode();
    } else {
      openStudyMode();
    }
  });

  function currentCard() {
    if (!session.active) return null;
    const id = session.queue[session.index];
    return cards.find(c => c.id === id) || null;
  }

  function renderStudyCard() {
    const c = currentCard();
    if (!c) {
      studyQuestion.textContent = 'No card.';
      studyAnswer.textContent = '';
      return;
    }
    studySection.classList.remove('hidden');
    studyQuestion.textContent = c.question;
    studyAnswer.textContent = c.answer;
    studyAnswer.classList.remove('visible');
    session.revealed = false;
    // focus
    revealBtn.focus();
    updateProgress();
  }

  function revealAnswer() {
    if (!session.active) return;
    studyAnswer.classList.add('visible');
    session.revealed = true;
  }

  function gradeCurrent(correct) {
    const c = currentCard();
    if (!c) return;
    c.lastReviewed = new Date().toISOString();
    if (correct) {
      // move up one box (max 5)
      c.box = Math.min(5, (c.box || 1) + 1);
      c.nextReview = scheduleNextForBox(c.box, c.lastReviewed);
      session.correct++;
    } else {
      // reset to box 1, schedule next day
      c.box = 1;
      c.nextReview = scheduleNextForBox(1, c.lastReviewed);
      session.incorrect++;
    }
    session.studied++;
    saveAll();
  }

  function nextCard() {
    if (!session.active) return;
    // if not revealed and user pressed next, reveal first
    if (!session.revealed) {
      revealAnswer();
      return;
    }
    // move pointer
    session.index++;
    if (session.index >= session.queue.length) {
      alert(`Session complete. Studied ${session.studied} cards. Correct: ${session.correct}, Incorrect: ${session.incorrect}`);
      endStudyMode();
      return;
    }
    renderStudyCard();
  }

  revealBtn.addEventListener('click', () => revealAnswer());
  nextBtn.addEventListener('click', () => nextCard());
  endStudyBtn.addEventListener('click', () => {
    if (confirm('End study session?')) endStudyMode();
  });

  /* ============================
     Export / Import JSON
     ============================ */

  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(cards, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Allow importing JSON via paste into bulk area: detect by user pasting JSON and parse
  bulkInput.addEventListener('paste', (ev) => {
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question !== undefined) {
        // treat as full import JSON
        if (confirm('Detected JSON flashcards. Import and append?')) {
          let added = 0;
          parsed.forEach(p => {
            if (p.question && p.answer && !cards.some(c => c.question === p.question && c.answer === p.answer)) {
              // preserve SRS metadata if present
              const card = makeCard(p.question, p.answer);
              if (p.box) card.box = p.box;
              if (p.lastReviewed) card.lastReviewed = p.lastReviewed;
              if (p.nextReview) card.nextReview = p.nextReview;
              cards.push(card);
              added++;
            }
          });
          saveAll();
          renderCardsList();
          alert(`Imported ${added} cards from JSON.`);
        }
      }
    } catch (e) {
      // not JSON - ignore
    }
  });

  /* ============================
     Keyboard Shortcuts (global)
     ============================ */
  window.addEventListener('keydown', (ev) => {
    const key = ev.key.toLowerCase();
    // study mode shortcuts
    if (session.active) {
      if (key === ' ' || key === 'enter') { ev.preventDefault(); revealAnswer(); return; }
      if (key === 'arrowright') { ev.preventDefault(); nextCard(); return; }
      if (key === 'arrowleft') { ev.preventDefault(); /* we could implement prev */ return; }
      if (key === 'e') { /* edit current */ const c = currentCard(); if (c) openEditCard(c.id); return; }
      if (key === 'd') { const c = currentCard(); if (c && confirm('Delete current card?')) { deleteCard(c.id); nextCard(); } return; }
      if (key === 's') { /* stop session */ if (confirm('Stop session?')) endStudyMode(); return; }
      // number keys for grading: 1 correct, 0 incorrect (optional)
      if (key === '1') { gradeCurrent(true); nextCard(); return; }
      if (key === '0') { gradeCurrent(false); nextCard(); return; }
    } else {
      // global shortcuts when not in study
      if (key === 'n') { openAddForm(); return; } // new
      if (key === 'i') { importBtn.click(); return; } // import
      if (key === 's') { studyBtn.click(); return; } // start study
    }
  });

  /* ============================
     Helpers: Shuffle & progress UI
     ============================ */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function updateProgress() {
    const total = session.queue.length;
    const idx = session.index + 1;
    progressEl.textContent = session.active ? `Card ${idx}/${total} • Studied: ${session.studied} • Correct: ${session.correct} • Incorrect: ${session.incorrect}` : '';
  }

  /* ============================
     Theme Toggle (inject floating button if not present)
     This respects your styles.css .light class; toggles body.light
     ============================ */
  function ensureThemeToggle() {
    if (document.getElementById('themeToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.title = 'Toggle light theme';
    btn.textContent = '☀';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light');
      settings.themeLight = isLight;
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
    });
    // initialize state from settings
    if (settings.themeLight) document.body.classList.add('light');
  }

  /* ============================
     Initialization
     ============================ */

  function init() {
    loadAll();
    renderCardsList();
    ensureThemeToggle();
    // hide panels appropriately
    cardFormSection.classList.add('hidden');
    importSection.classList.add('hidden');
    studySection.classList.add('hidden');

    // wire UI buttons that were not wired above
    exportBtn && (exportBtn.disabled = false);
    renderCardsList();
  }

  init();

  /* ============================
     Expose for debugging (optional)
     ============================ */
  window._flash = {
    cards, settings, saveAll, loadAll
  };

})();
