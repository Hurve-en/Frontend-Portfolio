/* app.js — corrected & improved
   - Ensures all controls attach reliably
   - Theme toggle persists to localStorage
   - Fixed layout overflow & responsive behavior
   - Clear modular functions and inline comments
*/

(() => {
  // --------------------
  // Constants & state
  // --------------------
  const STORE_KEY = 'daily-journal-v1';
  const DRAFT_KEY = 'daily-journal-draft';
  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'angry', emoji: '😡', label: 'Angry' },
    { id: 'excited', emoji: '🤩', label: 'Excited' },
    { id: 'tired', emoji: '😴', label: 'Tired' }
  ];

  let entries = [];
  let currentId = null;
  let autoSaveEnabled = true;
  let autoSaveTimer = null;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------
  // DOM refs (cached)
  // --------------------
  const el = id => document.getElementById(id);
  const todayDateEl = el('todayDate');
  const greetingEl = el('greeting');

  const newEntryBtn = el('newEntryBtn');
  const exportAllBtn = el('exportAllBtn');
  const importBtn = el('importBtn');
  const importInput = el('importInput');
  const downloadJsonBtn = el('downloadJsonBtn');
  const themeBtn = el('themeBtn');

  const searchInput = el('searchInput');
  const quickFilter = el('quickFilter');
  const dateFrom = el('dateFrom');
  const dateTo = el('dateTo');
  const moodFiltersWrap = document.querySelector('.mood-filters');
  const entriesList = el('entriesList');

  const entryForm = el('entryForm');
  const titleInput = el('titleInput');
  const dateInput = el('dateInput');
  const moodSelector = el('moodSelector');
  const tagsInput = el('tagsInput');
  const bodyInput = el('bodyInput');
  const wordCountEl = el('wordCount');
  const autoSaveStatus = el('autoSaveStatus');

  const saveBtn = el('saveBtn');
  const saveBtnBottom = el('saveBtnBottom');
  const cancelBtn = el('cancelBtn');
  const cancelBtnBottom = el('cancelBtnBottom');
  const deleteBtn = el('deleteBtn');
  const exportEntryBtn = el('exportEntryBtn');

  const detailView = el('detailView');
  const detailTitle = el('detailTitle');
  const detailMeta = el('detailMeta');
  const detailBody = el('detailBody');
  const detailTags = el('detailTags');

  const toast = el('toast');

  // --------------------
  // Utilities
  // --------------------
  const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  const todayKey = (d = new Date()) => d.toISOString().slice(0,10);
  const nowLocalISO = () => new Date().toISOString().slice(0,16); // yyyy-mm-ddThh:mm
  const showToast = (msg, ms = 1400) => {
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), ms);
  };

  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(entries)); }
    catch (e) { console.warn('Save failed', e); }
  }
  function loadStore() {
    try { entries = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch (e) { entries = []; }
  }

  // --------------------
  // Rendering
  // --------------------
  function updateGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
    greetingEl.textContent = greet;
    todayDateEl.textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
  }

  function renderMoodFilters() {
    moodFiltersWrap.innerHTML = '';
    moods.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mood-chip';
      btn.dataset.mood = m.id;
      btn.innerHTML = `<span style="font-size:16px">${m.emoji}</span><span class="muted" style="margin-left:6px">${m.label}</span>`;
      btn.addEventListener('click', () => { btn.classList.toggle('active'); renderEntriesList(); });
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
      if (quick === 'today') {
        if (e.date !== todayKey()) return false;
      } else if (quick === '7days') {
        const then = new Date(); then.setDate(then.getDate() - 7);
        if (new Date(e.date) < then) return false;
      } else if (quick === 'month') {
        const now = new Date();
        if (new Date(e.date).getMonth() !== now.getMonth()) return false;
      }
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (activeMoods.length && !activeMoods.includes(e.mood)) return false;
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

  function renderMoodSelector(activeMood = null) {
    moodSelector.innerHTML = '';
    moods.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mood-btn';
      b.dataset.mood = m.id;
      b.innerHTML = `<div style="font-size:18px">${m.emoji}</div><div class="muted small">${m.label}</div>`;
      if (m.id === activeMood) b.classList.add('active');
      b.addEventListener('click', () => {
        // toggle active
        Array.from(moodSelector.children).forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
      });
      moodSelector.appendChild(b);
    });
  }

  function getSelectedMoodFromSelector() {
    const active = moodSelector.querySelector('.mood-btn.active');
    return active ? active.dataset.mood : null;
  }

  function updateWordCount() {
    const text = bodyInput.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} words • ${text.length} chars`;
  }

  // --------------------
  // CRUD operations
  // --------------------
  function createEntry(data) {
    const id = uid();
    const createdAt = Date.now();
    const entry = {
      id,
      title: data.title || '',
      body: data.body || '',
      date: data.date || todayKey(),
      mood: data.mood || null,
      tags: data.tags || [],
      createdAt,
      updatedAt: createdAt
    };
    entries.unshift(entry);
    saveStore();
    renderEntriesList();
    showToast('Entry created');
    return entry;
  }

  function updateEntry(id, updates) {
    const idx = entries.findIndex(x => x.id === id);
    if (idx < 0) return null;
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    saveStore();
    renderEntriesList();
    showToast('Entry updated');
    return entries[idx];
  }

  function deleteEntry(id) {
    const idx = entries.findIndex(x => x.id === id);
    if (idx < 0) return;
    entries.splice(idx, 1);
    saveStore();
    renderEntriesList();
    showToast('Entry deleted');
    if (currentId === id) {
      entryForm.classList.remove('hidden');
      detailView.classList.add('hidden');
      renderEditorFor(null);
    }
  }

  // --------------------
  // Editor flows
  // --------------------
  function gatherForm() {
    const title = titleInput.value.trim();
    const dateTime = dateInput.value;
    const dateISO = dateTime ? dateTime.slice(0,10) : todayKey();
    const body = bodyInput.value;
    const tags = tagsInput.value.split(',').map(t=>t.trim()).filter(Boolean);
    const mood = getSelectedMoodFromSelector();
    return { title, date: dateISO, body, tags, mood };
  }

  function renderEditorFor(id = null) {
    currentId = id;
    detailView.classList.add('hidden');
    entryForm.classList.remove('hidden');

    if (id) {
      const e = entries.find(x => x.id === id);
      if (!e) return;
      titleInput.value = e.title || '';
      // set datetime-local to createdAt as default
      dateInput.value = new Date(e.createdAt).toISOString().slice(0,16);
      tagsInput.value = (e.tags || []).join(', ');
      bodyInput.value = e.body || '';
      renderMoodSelector(e.mood);
    } else {
      titleInput.value = '';
      dateInput.value = new Date().toISOString().slice(0,16);
      tagsInput.value = '';
      bodyInput.value = '';
      renderMoodSelector(null);
    }
    updateWordCount();
    autoSaveStatus.textContent = autoSaveEnabled ? 'on' : 'off';
    if (!prefersReduced) titleInput.focus();
  }

  function renderDetail(e) {
    entryForm.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailTitle.textContent = e.title || '(No title)';
    const m = moods.find(x => x.id === e.mood);
    detailMeta.textContent = `${m ? m.emoji + ' ' + m.label + ' • ' : ''}${new Date(e.createdAt).toLocaleString()}`;
    detailBody.textContent = e.body || '';
    detailTags.textContent = (e.tags || []).map(t => '#' + t).join(' ');
  }

  function openDetail(id) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    currentId = id;
    renderDetail(e);
  }

  // --------------------
  // Auto-save draft
  // --------------------
  function scheduleAutoSave() {
    if (!autoSaveEnabled) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const draft = gatherForm();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ts: Date.now(), draft }));
      autoSaveStatus.textContent = 'saved';
      setTimeout(()=> autoSaveStatus.textContent = 'on', 800);
    }, 800);
  }
  function loadDraftIfAny() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw).draft;
    } catch (e) { return null; }
  }

  // --------------------
  // Export (jsPDF)
  // --------------------
  function exportEntriesToPDF(list, filename = 'journal-export.pdf') {
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast('PDF library not loaded');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const left = 40, topStart = 60;
      let y = topStart;
      doc.setFont('Helvetica');
      list.forEach((e, idx) => {
        const mood = moods.find(m => m.id === e.mood);
        doc.setFontSize(14); doc.text(`${e.title || '(No title)'}`, left, y); y += 18;
        doc.setFontSize(10); doc.text(`${mood ? mood.emoji + ' ' + mood.label + ' • ' : ''}${new Date(e.createdAt).toLocaleString()}`, left, y); y += 16;
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(e.body || '', 520);
        doc.text(lines, left, y);
        y += lines.length * 14 + 18;
        if (e.tags && e.tags.length) { doc.setFontSize(10); doc.text('Tags: ' + e.tags.join(', '), left, y); y += 18; }
        if (idx < list.length - 1 && y > 700) { doc.addPage(); y = topStart; }
        else if (idx < list.length - 1) { y += 8; doc.setDrawColor(230); doc.line(left, y, 560, y); y += 12; }
      });
      doc.save(filename);
    } catch (err) {
      console.error('PDF Export failed', err);
      showToast('Export failed (console)');
    }
  }

  // --------------------
  // Backup / Import
  // --------------------
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

  // --------------------
  // Wiring & events
  // --------------------
  function wireListeners() {
    // buttons
    newEntryBtn.addEventListener('click', () => renderEditorFor(null));
    saveBtn.addEventListener('click', ev => {
      ev.preventDefault();
      const data = gatherForm();
      if (currentId) updateEntry(currentId, data); else createEntry(data);
      renderEditorFor(null);
    });
    saveBtnBottom.addEventListener('click', ev => { ev.preventDefault(); const data = gatherForm(); if (currentId) updateEntry(currentId, data); else createEntry(data); renderEditorFor(null); });

    cancelBtn.addEventListener('click', ev => { ev.preventDefault(); renderEditorFor(null); });
    cancelBtnBottom.addEventListener('click', ev => { ev.preventDefault(); renderEditorFor(null); });

    deleteBtn.addEventListener('click', ev => {
      ev.preventDefault();
      if (!currentId) return showToast('Nothing to delete');
      if (!confirm('Delete this entry?')) return;
      deleteEntry(currentId);
    });

    exportEntryBtn.addEventListener('click', () => {
      if (!currentId) return showToast('Open an entry to export');
      const e = entries.find(x => x.id === currentId);
      if (e) exportEntriesToPDF([e], `${(e.title||'entry')}.pdf`);
    });

    exportAllBtn.addEventListener('click', () => {
      // export currently filtered list
      const list = Array.from(entriesList.querySelectorAll('.entry-card')).map(n => {
        const title = n.querySelector('.entry-title')?.textContent || '';
        // match entry by title and first line (approx)
        return entries.find(e => (e.title||'').startsWith(title) || (e.body||'').startsWith(n.querySelector('.entry-preview')?.textContent || ''));
      }).filter(Boolean);
      if (!list.length) return showToast('No entries to export');
      exportEntriesToPDF(list, 'journal-export.pdf');
    });

    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', ev => { const f = ev.target.files[0]; if (f) importJSON(f); importInput.value = ''; });
    downloadJsonBtn.addEventListener('click', downloadJSON);

    // search & filters
    searchInput.addEventListener('input', renderEntriesList);
    quickFilter.addEventListener('change', renderEntriesList);
    dateFrom.addEventListener('change', renderEntriesList);
    dateTo.addEventListener('change', renderEntriesList);

    // theme toggle (persist & apply)
    themeBtn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      themeBtn.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem('journal-theme', next); } catch (e) {}
    });
    // apply saved theme if exists
    try {
      const saved = localStorage.getItem('journal-theme');
      if (saved) document.body.setAttribute('data-theme', saved);
    } catch (e) {}

    // mood selector events (editor)
    bodyInput.addEventListener('input', () => { updateWordCount(); scheduleAutoSave(); });
    titleInput.addEventListener('input', scheduleAutoSave);
    tagsInput.addEventListener('input', scheduleAutoSave);

    // keyboard shortcuts
    document.addEventListener('keydown', ev => {
      if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); renderEditorFor(null); titleInput.focus(); }
      if (ev.key === '/') { ev.preventDefault(); searchInput.focus(); }
    });
  }

  // --------------------
  // Init
  // --------------------
  function init() {
    loadStore();
    updateGreeting();
    renderMoodFilters();
    renderEntriesList();
    renderEditorFor(null);

    // render mood selector for editor (empty by default)
    renderMoodSelector(null);

    // load draft if any
    const draft = (() => {
      try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw).draft : null; } catch (e) { return null; }
    })();
    if (draft) {
      titleInput.value = draft.title || titleInput.value;
      bodyInput.value = draft.body || bodyInput.value;
      tagsInput.value = (draft.tags || []).join(', ');
      if (draft.mood) renderMoodSelector(draft.mood);
    }

    updateWordCount();
    wireListeners();
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
