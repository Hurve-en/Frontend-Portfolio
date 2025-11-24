(() => {
  const STORE_KEY = 'daily-journal-v1';
  const AUTO_SAVE_KEY = 'daily-journal-draft';
  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'angry', emoji: '😡', label: 'Angry' },
    { id: 'excited', emoji: '🤩', label: 'Excited' },
    { id: 'tired', emoji: '😴', label: 'Tired' }
  ];

  // DOM refs
  const todayDateEl = document.getElementById('todayDate');
  const greetingEl = document.getElementById('greeting');
  const newEntryBtn = document.getElementById('newEntryBtn');
  const exportAllBtn = document.getElementById('exportAllBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const themeBtn = document.getElementById('themeBtn');

  const searchInput = document.getElementById('searchInput');
  const quickFilter = document.getElementById('quickFilter');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const moodFiltersWrap = document.querySelector('.mood-filters');
  const entriesList = document.getElementById('entriesList');

  const entryForm = document.getElementById('entryForm');
  const titleInput = document.getElementById('titleInput');
  const dateInput = document.getElementById('dateInput');
  const moodSelector = document.getElementById('moodSelector');
  const tagsInput = document.getElementById('tagsInput');
  const bodyInput = document.getElementById('bodyInput');
  const wordCountEl = document.getElementById('wordCount');
  const autoSaveStatus = document.getElementById('autoSaveStatus');

  const saveBtn = document.getElementById('saveBtn');
  const saveBtnBottom = document.getElementById('saveBtnBottom');
  const cancelBtn = document.getElementById('cancelBtn');
  const cancelBtnBottom = document.getElementById('cancelBtnBottom');
  const deleteBtn = document.getElementById('deleteBtn');
  const exportEntryBtn = document.getElementById('exportEntryBtn');

  const detailView = document.getElementById('detailView');
  const detailTitle = document.getElementById('detailTitle');
  const detailMeta = document.getElementById('detailMeta');
  const detailBody = document.getElementById('detailBody');
  const detailTags = document.getElementById('detailTags');

  const toast = document.getElementById('toast');

  let entries = [];           // loaded entries
  let currentId = null;       // editing/selected entry id
  let autoSaveEnabled = true; // default auto-save on
  let autoSaveTimer = null;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------
     Utilities
  ------------------------- */
  function uid() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
  function todayKey(d = new Date()) { return d.toISOString().slice(0,10); }
  function nowLocalISO() {
    const dt = new Date();
    // format yyyy-mm-ddThh:mm for datetime-local
    const pad = n => String(n).padStart(2,'0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth()+1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
  function showToast(msg, ms = 1400) {
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), ms);
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      entries = raw ? JSON.parse(raw) : [];
    } catch (e) { entries = []; console.warn('Load failed', e); }
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(entries)); }
    catch (e) { console.warn('Save failed', e); }
  }

  /* -------------------------
     Render helpers
  ------------------------- */
  function updateGreeting() {
    const h = new Date().getHours();
    const name = ''; // optional: integrate user name
    const greet = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
    greetingEl.textContent = `${greet}${name ? ', ' + name : ''}`;
    todayDateEl.textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
  }

  function renderMoodFilters() {
    moodFiltersWrap.innerHTML = '';
    moods.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mood-chip';
      btn.type = 'button';
      btn.dataset.mood = m.id;
      btn.innerHTML = `<span>${m.emoji}</span><span class="muted">${m.label}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        renderEntriesList();
      });
      moodFiltersWrap.appendChild(btn);
    });
  }

  function getActiveMoodFilters() {
    return Array.from(moodFiltersWrap.querySelectorAll('.mood-chip.active')).map(b => b.dataset.mood);
  }

  function renderEntriesList() {
    entriesList.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase();
    const from = dateFrom.value || null;
    const to = dateTo.value || null;
    const quick = quickFilter.value || 'all';
    const activeMoods = getActiveMoodFilters();

    const filtered = entries.filter(e => {
      // quick filters
      if (quick === 'today') {
        if (e.date !== todayKey()) return false;
      } else if (quick === '7days') {
        const then = new Date(); then.setDate(then.getDate() - 7);
        if (new Date(e.date) < then) return false;
      } else if (quick === 'month') {
        const now = new Date();
        if (new Date(e.date).getMonth() !== now.getMonth()) return false;
      }
      // date range
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      // mood filters
      if (activeMoods.length && !activeMoods.includes(e.mood)) return false;
      // search text
      if (q) {
        const hay = ((e.title||'') + ' ' + (e.body||'')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a,b) => b.createdAt - a.createdAt);

    if (!filtered.length) {
      entriesList.innerHTML = `<div class="muted">No entries found.</div>`;
      return;
    }

    filtered.forEach(e => {
      const m = moods.find(x=>x.id===e.mood);
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="entry-meta">
          <div>
            <div class="entry-title">${e.title || '(No title)'}</div>
            <div class="entry-preview">${(e.body||'').split('\n')[0].slice(0,120)}</div>
          </div>
          <div style="text-align:right">
            <div class="muted">${new Date(e.date).toLocaleDateString()}</div>
            <div style="font-size:20px;margin-top:6px">${m ? m.emoji : ''}</div>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openDetail(e.id));
      card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openDetail(e.id); });
      entriesList.appendChild(card);
    });
  }

  function renderEditorFor(id = null) {
    // If id provided, load entry into editor; otherwise new entry
    currentId = id;
    detailView.classList.add('hidden');
    entryForm.classList.remove('hidden');

    if (id) {
      const e = entries.find(x => x.id === id);
      if (!e) return;
      titleInput.value = e.title || '';
      dateInput.value = e.date + 'T' + (e.time || '00:00');
      // set datetime-local: prefer stored datetimeLocal or createdAt
      dateInput.value = new Date(e.date + 'T00:00:00').toISOString().slice(0,16);
      // better: store date + time separately; here, assume e.date is YYYY-MM-DD and createdAt time used
      dateInput.value = new Date(e.createdAt).toISOString().slice(0,16);
      tagsInput.value = (e.tags || []).join(', ');
      bodyInput.value = e.body || '';
      highlightMood(e.mood);
    } else {
      // new entry defaults
      titleInput.value = '';
      dateInput.value = nowLocalISO();
      tagsInput.value = '';
      bodyInput.value = '';
      highlightMood(null);
    }
    updateWordCount();
    showAutoSaveStatus(autoSaveEnabled);
    if (!prefersReduced) titleInput.focus();
  }

  function renderDetail(e) {
    // show read-only detail view
    entryForm.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailTitle.textContent = e.title || '(No title)';
    const m = moods.find(x=>x.id===e.mood);
    detailMeta.innerHTML = `${m ? m.emoji + ' ' + m.label + ' • ' : ''}${new Date(e.createdAt).toLocaleString()}`;
    detailBody.textContent = e.body || '';
    detailTags.textContent = (e.tags || []).map(t=>'#'+t).join(' ');
  }

  /* -------------------------
     CRUD operations
  ------------------------- */
  function createEntry(data) {
    const id = uid();
    const createdAt = Date.now();
    const entry = {
      id, title: data.title||'', body: data.body||'', date: data.date || todayKey(),
      mood: data.mood||null, tags: data.tags||[], createdAt, updatedAt: createdAt
    };
    entries.unshift(entry);
    saveStore();
    renderEntriesList();
    showToast('Entry created');
    return entry;
  }

  function updateEntry(id, updates) {
    const idx = entries.findIndex(x=>x.id===id);
    if (idx < 0) return null;
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    saveStore();
    renderEntriesList();
    showToast('Entry updated');
    return entries[idx];
  }

  function deleteEntry(id) {
    const idx = entries.findIndex(x=>x.id===id);
    if (idx < 0) return;
    entries.splice(idx,1);
    saveStore();
    renderEntriesList();
    showToast('Entry deleted');
    // clear detail if it was the current
    if (currentId === id) {
      entryForm.classList.remove('hidden');
      detailView.classList.add('hidden');
      renderEditorFor();
    }
  }

  /* -------------------------
     Editor interactions & autosave
  ------------------------- */
  function highlightMood(moodId) {
    // Render mood selector and active state
    moodSelector.innerHTML = '';
    moods.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mood-btn';
      b.dataset.mood = m.id;
      b.innerHTML = `<span style="font-size:20px">${m.emoji}</span><div class="muted small">${m.label}</div>`;
      if (m.id === moodId) b.classList.add('active');
      b.addEventListener('click', () => {
        // toggle
        const current = moodSelector.querySelector('.mood-btn.active');
        if (current) current.classList.remove('active');
        b.classList.add('active');
      });
      moodSelector.appendChild(b);
    });
  }

  function getSelectedMood() {
    const active = moodSelector.querySelector('.mood-btn.active');
    return active ? active.dataset.mood : null;
  }

  function gatherForm() {
    const title = titleInput.value.trim();
    const dateTime = dateInput.value;
    const dateISO = dateTime ? dateTime.slice(0,10) : todayKey();
    const body = bodyInput.value;
    const tags = tagsInput.value.split(',').map(t=>t.trim()).filter(Boolean);
    const mood = getSelectedMood();
    return { title, date: dateISO, body, tags, mood };
  }

  function updateWordCount() {
    const text = bodyInput.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} words • ${text.length} chars`;
  }

  // Auto-save draft while typing (debounced)
  function scheduleAutoSave() {
    if (!autoSaveEnabled) return;
    autoSaveStatus.textContent = 'on';
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const draft = gatherForm();
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ timestamp: Date.now(), draft }));
      autoSaveStatus.textContent = 'saved';
      setTimeout(()=> autoSaveStatus.textContent = 'on', 800);
    }, 900);
  }

  function loadDraftIfAny() {
    try {
      const raw = localStorage.getItem(AUTO_SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw).draft;
    } catch (e) { return null; }
  }

  /* -------------------------
     Export PDF (single or array) using jsPDF
  ------------------------- */
  async function exportEntriesToPDF(list, options = {}) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: options.pageSize || 'a4' });
      const left = 40, topStart = 60;
      doc.setFont('Helvetica');
      let y = topStart;
      list.forEach((e, idx) => {
        const mood = moods.find(m => m.id === e.mood);
        doc.setFontSize(14); doc.text(`${e.title || '(No title)'}`, left, y); y += 18;
        doc.setFontSize(10); doc.text(`${mood ? mood.emoji + ' ' + mood.label + ' • ' : ''}${new Date(e.createdAt).toLocaleString()}`, left, y); y += 16;
        doc.setFontSize(11);
        // split long text
        const lines = doc.splitTextToSize(e.body || '', 520);
        doc.text(lines, left, y);
        y += lines.length * 14 + 18;
        if (e.tags && e.tags.length) { doc.setFontSize(10); doc.text('Tags: ' + e.tags.join(', '), left, y); y += 18; }
        if (idx < list.length - 1 && y > 700) { doc.addPage(); y = topStart; }
        else if (idx < list.length - 1) { y += 8; doc.setDrawColor(230); doc.line(left, y, 560, y); y += 12; }
      });
      doc.save(options.filename || 'journal.pdf');
    } catch (err) {
      console.error('PDF Export failed', err);
      alert('Export failed — check console.');
    }
  }

  /* -------------------------
     Detail / open entry
  ------------------------- */
  function openDetail(id) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    currentId = id;
    renderDetail(e);
    // set editor hidden
    entryForm.classList.add('hidden');
    detailView.classList.remove('hidden');
  }

  /* -------------------------
     Backup / Restore (JSON)
  ------------------------- */
  function downloadJSON() {
    const payload = JSON.stringify(entries, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'journal-backup.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error('Invalid format');
        entries = arr;
        saveStore();
        renderEntriesList();
        showToast('Imported entries');
      } catch (e) {
        alert('Import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  /* -------------------------
     Event wiring
  ------------------------- */
  function wire() {
    // initial render
    updateGreeting();
    renderMoodFilters();
    loadStore();
    renderEntriesList();
    renderEditorFor(); // new entry ready

    // mood selector highlight init
    highlightMood(null);

    // search & filters
    searchInput.addEventListener('input', renderEntriesList);
    quickFilter.addEventListener('change', renderEntriesList);
    dateFrom.addEventListener('change', renderEntriesList);
    dateTo.addEventListener('change', renderEntriesList);

    // new entry
    newEntryBtn.addEventListener('click', () => renderEditorFor(null));

    // save
    saveBtn.addEventListener('click', (ev) => { ev.preventDefault(); const data = gatherForm(); if (currentId) updateEntry(currentId, data); else createEntry(data); renderEditorFor(null); });
    saveBtnBottom.addEventListener('click', (ev) => { ev.preventDefault(); const data = gatherForm(); if (currentId) updateEntry(currentId, data); else createEntry(data); renderEditorFor(null); });

    // cancel
    cancelBtn.addEventListener('click', (ev) => { ev.preventDefault(); renderEditorFor(null); });
    cancelBtnBottom.addEventListener('click', (ev) => { ev.preventDefault(); renderEditorFor(null); });

    // delete
    deleteBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!currentId) return showToast('Nothing to delete');
      if (!confirm('Delete this entry?')) return;
      deleteEntry(currentId);
    });

    // export single entry
    exportEntryBtn.addEventListener('click', () => {
      if (!currentId) return showToast('Open an entry to export');
      const e = entries.find(x=>x.id===currentId);
      if (e) exportEntriesToPDF([e], { filename: `${(e.title||'entry')}.pdf` });
    });

    // export all (filtered)
    exportAllBtn.addEventListener('click', () => {
      // gather currently filtered entries
      const items = Array.from(entriesList.children)
        .filter(n => n.classList.contains('entry-card'))
        .map(n => {
          const title = n.querySelector('.entry-title')?.textContent || '';
          const dateText = n.querySelector('.muted')?.textContent || '';
          // find by title/date fuzzy
          return entries.find(e => (e.title||'').startsWith(title) || new Date(e.createdAt).toLocaleDateString() === dateText);
        }).filter(Boolean);
      if (!items.length) return showToast('No entries to export');
      exportEntriesToPDF(items, { filename: 'journal-export.pdf' });
    });

    // import JSON
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      importJSON(f);
      importInput.value = '';
    });

    downloadJsonBtn.addEventListener('click', downloadJSON);

    // theme toggle
    themeBtn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      themeBtn.setAttribute('aria-pressed', String(next === 'dark'));
      localStorage.setItem('journal-theme', next);
    });
    // load saved theme
    const savedTheme = localStorage.getItem('journal-theme');
    if (savedTheme) document.body.setAttribute('data-theme', savedTheme);

    // auto-save settings
    autoSaveStatus.textContent = autoSaveEnabled ? 'on' : 'off';
    [titleInput, bodyInput, tagsInput].forEach(inp => {
      inp.addEventListener('input', () => {
        updateWordCount();
        if (autoSaveEnabled) scheduleAutoSave();
      });
    });

    // keyboard shortcuts
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'N' || ev.key === 'n') { ev.preventDefault(); renderEditorFor(null); titleInput.focus(); }
      if (ev.key === '/') { ev.preventDefault(); searchInput.focus(); }
      if ((ev.key === 'E' || ev.key === 'e') && document.activeElement === entriesList) {
        // edit focused entry: find first entry-card focus
        const focused = document.activeElement;
        if (focused && focused.classList.contains('entry-card')) {
          // open detail
          // simulate click
          focused.click();
        }
      }
    });

    // autosave draft load
    const draft = loadDraftIfAny();
    if (draft) {
      // populate editor with draft if empty
      titleInput.value = draft.title || titleInput.value;
      bodyInput.value = draft.body || bodyInput.value;
      tagsInput.value = (draft.tags || []).join(', ');
      if (draft.mood) highlightMood(draft.mood);
    }
  }

  /* -------------------------
     Init & boot
  ------------------------- */
  function init() {
    loadStore();
    updateGreeting();
    renderMoodFilters();
    renderEntriesList();
    renderEditorFor(null);
    wire();
  }

  init();

  // expose small API for debugging
  window.JournalApp = {
    createEntry,
    updateEntry,
    deleteEntry,
    exportEntriesToPDF,
    loadStore,
    saveStore
  };

})();
