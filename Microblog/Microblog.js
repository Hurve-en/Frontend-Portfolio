/* app.js - Minimal Microblog
   - Uses localStorage keys: microblog-posts, microblog-theme
   - Compose, edit, delete, like, search, mood filter, export/import JSON
   - Simple, dependency-free
*/

(() => {
  // keys
  const STORAGE_KEY = 'microblog-posts';
  const THEME_KEY = 'microblog-theme';

  // DOM
  const searchInput = document.getElementById('searchInput');
  const moodFilter = document.getElementById('moodFilter');
  const themeBtn = document.getElementById('themeBtn');

  const usernameEl = document.getElementById('username');
  const bioEl = document.getElementById('bio');
  const postCountEl = document.getElementById('postCount');

  const composeTxt = document.getElementById('composeTxt');
  const emojiPicker = document.getElementById('emojiPicker');
  const charCounter = document.getElementById('charCounter');
  const postBtn = document.getElementById('postBtn');
  const composeCard = document.getElementById('composeCard');

  const feed = document.getElementById('feed');
  const composeBtn = document.getElementById('composeBtn');

  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

  const modalOverlay = document.getElementById('modalOverlay');
  const confirmDelete = document.getElementById('confirmDelete');
  const cancelDelete = document.getElementById('cancelDelete') || document.getElementById('cancelDelete');

  const fileImport = document.getElementById('fileImport');

  // state
  let posts = [];
  let editingId = null;
  let deleteTargetId = null;

  const MOODS = [
    { id: 'none', emoji: '' },
    { id: 'happy', emoji: '😊' },
    { id: 'neutral', emoji: '😐' },
    { id: 'sad', emoji: '😢' },
    { id: 'angry', emoji: '😡' },
    { id: 'love', emoji: '🤩' }
  ];

  // init
  function init() {
    loadTheme();
    loadPosts();
    renderMoodOptions();
    renderEmojiPicker();
    wireEvents();
    renderFeed();
    updateCount();
    updateCharCounter();
  }

  // storage
  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      posts = raw ? JSON.parse(raw) : [];
    } catch (e) { posts = []; console.warn('Load failed', e); }
  }
  function savePosts() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); } catch(e){ console.warn(e); }
  }

  // theme
  function loadTheme() {
    const t = localStorage.getItem(THEME_KEY) || 'light';
    document.body.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  }
  function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    themeBtn.setAttribute('aria-pressed', String(next === 'dark'));
  }

  // moods UI
  function renderMoodOptions() {
    moodFilter.innerHTML = `<option value="all">All moods</option>`;
    MOODS.forEach(m => {
      if (!m.emoji) return;
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.emoji} ${m.id}`;
      moodFilter.appendChild(opt);
    });
  }

  function renderEmojiPicker() {
    emojiPicker.innerHTML = '';
    MOODS.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji';
      btn.title = m.id;
      btn.textContent = m.emoji || '✚';
      btn.dataset.mood = m.id;
      btn.addEventListener('click', () => {
        // insert emoji into textarea at cursor
        insertAtCursor(composeTxt, m.emoji || '');
        composeTxt.focus();
        updateCharCounter();
      });
      emojiPicker.appendChild(btn);
    });
  }

  // utilities
  function insertAtCursor(field, value) {
    const start = field.selectionStart || 0;
    const end = field.selectionEnd || 0;
    const text = field.value;
    field.value = text.slice(0, start) + value + text.slice(end);
    const pos = start + value.length;
    field.selectionStart = field.selectionEnd = pos;
    field.dispatchEvent(new Event('input'));
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  // render feed
  function renderFeed(filter = {}) {
    feed.innerHTML = '';
    // apply search and filter
    let visible = posts.slice().sort((a,b) => b.createdAt - a.createdAt);

    const q = searchInput.value.trim().toLowerCase();
    if (q) visible = visible.filter(p => (p.text || '').toLowerCase().includes(q) || (p.tags||[]).join(' ').toLowerCase().includes(q));

    const mood = moodFilter.value;
    if (mood && mood !== 'all') visible = visible.filter(p => p.mood === mood);

    visible.forEach(post => feed.appendChild(renderPostCard(post)));
    updateCount();
  }

  function renderPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post';
    card.dataset.id = post.id;
    card.innerHTML = `
      <div class="post-head">
        <div class="post-user">
          <div class="avatar-sm" aria-hidden="true">${(post.authorAvatar||'🙂')}</div>
          <div>
            <div style="font-weight:700">${post.author || 'You'}</div>
            <div class="muted post-meta">${timeAgo(post.createdAt)} • ${post.mood ? post.mood : ''}</div>
          </div>
        </div>

        <div class="post-actions">
          <button class="icon-btn like-btn" title="Like" data-id="${post.id}">❤ <span class="like-count">${post.likes||0}</span></button>
          <button class="icon-btn edit-btn" title="Edit" data-id="${post.id}">✎</button>
          <button class="icon-btn delete-btn" title="Delete" data-id="${post.id}">🗑</button>
        </div>
      </div>
      <div class="post-body">${escapeHtml(post.text || '')}</div>
    `;
    // like animation handled via event delegation
    return card;
  }

  // escape
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[c])); }

  // create/update post
  function submitPost() {
    const raw = composeTxt.value.trim();
    if (!raw) {
      alert('Please write something before posting.');
      return;
    }
    if (raw.length > 300) {
      alert('Post exceeds 300 characters.');
      return;
    }
    if (editingId) {
      const idx = posts.findIndex(p => p.id === editingId);
      if (idx >= 0) {
        posts[idx].text = raw;
        posts[idx].updatedAt = Date.now();
      }
      editingId = null;
      postBtn.textContent = 'Post';
    } else {
      const newPost = {
        id: Date.now().toString(36),
        text: raw,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likes: 0,
        mood: extractMoodFromText(raw)
      };
      posts.unshift(newPost);
      // simple slide/fade-in handled by CSS: we can force reflow to animate if wanted
    }
    savePosts();
    composeTxt.value = '';
    updateCharCounter();
    renderFeed();
  }

  // extract first mood emoji from text
  function extractMoodFromText(text) {
    for (const m of MOODS) {
      if (!m.emoji) continue;
      if (text.includes(m.emoji)) return m.id;
    }
    return '';
  }

  // like / edit / delete handlers
  function handleFeedClick(e) {
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      const id = likeBtn.dataset.id;
      const p = posts.find(x => x.id === id);
      if (!p) return;
      p.likes = (p.likes || 0) + 1;
      // small pop animation
      likeBtn.classList.add('anim');
      setTimeout(()=> likeBtn.classList.remove('anim'), 180);
      savePosts();
      renderFeed();
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const p = posts.find(x => x.id === id);
      if (!p) return;
      editingId = id;
      composeTxt.value = p.text;
      composeTxt.focus();
      postBtn.textContent = 'Save';
      updateCharCounter();
      return;
    }

    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      deleteTargetId = delBtn.dataset.id;
      showModal(true);
      return;
    }
  }

  // modal
  function showModal(show = true) {
    if (show) {
      modalOverlay.classList.remove('hidden');
      modalOverlay.setAttribute('aria-hidden', 'false');
    } else {
      modalOverlay.classList.add('hidden');
      modalOverlay.setAttribute('aria-hidden', 'true');
      deleteTargetId = null;
    }
  }

  function confirmDeletePost() {
    if (!deleteTargetId) return showModal(false);
    posts = posts.filter(p => p.id !== deleteTargetId);
    savePosts();
    renderFeed();
    updateCount();
    showModal(false);
  }

  // import/export
  function exportJSON() {
    const data = JSON.stringify(posts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'microblog-posts.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error('Invalid file');
        posts = arr.concat(posts); // append imported posts (or replace if you prefer)
        savePosts();
        renderFeed();
        updateCount();
        alert('Imported posts');
      } catch (e) {
        alert('Import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  // helpers
  function updateCount() {
    postCountEl.textContent = posts.length;
  }
  function updateCharCounter() {
    const len = composeTxt.value.length;
    charCounter.textContent = `${len} / 300`;
    charCounter.style.color = len > 280 ? 'var(--danger)' : (len > 240 ? 'orange' : 'var(--muted)');
  }

  // search & filter events
  function wireEvents() {
    postBtn.addEventListener('click', submitPost);
    composeBtn.addEventListener('click', () => composeTxt.focus());
    composeTxt.addEventListener('input', () => {
      autoResize(composeTxt);
      updateCharCounter();
    });
    feed.addEventListener('click', handleFeedClick);

    searchInput.addEventListener('input', () => renderFeed());
    moodFilter.addEventListener('change', () => renderFeed());

    themeBtn.addEventListener('click', () => toggleTheme());

    exportBtn.addEventListener('click', exportJSON);
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) importJSON(f);
      importInput.value = '';
    });

    // modal buttons
    const cbtn = document.getElementById('cancelDelete');
    const dbtn = document.getElementById('confirmDelete');
    if (cbtn) cbtn.addEventListener('click', () => showModal(false));
    if (dbtn) dbtn.addEventListener('click', confirmDeletePost);
    // some modals use confirmDelete / cancelDelete ids earlier
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeletePost);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => showModal(false));

    // keyboard: Enter+Ctrl to post
    composeTxt.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitPost();
    });

    // scroll top button
    const scrollTop = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) scrollTop.classList.remove('hidden'); else scrollTop.classList.add('hidden');
    });
    scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function autoResize(field) {
    field.style.height = 'auto';
    field.style.height = (field.scrollHeight) + 'px';
  }

  // initial render helpers
  function renderInitialPostsIfEmpty() {
    if (!posts.length) {
      posts = [
        { id: 'p1', text: 'Welcome to your microblog — write something short and sweet!', createdAt: Date.now() - 1000*60*60, updatedAt: Date.now() - 1000*60*60, likes: 2, mood: 'happy' }
      ];
      savePosts();
    }
  }

  // bootstrap
  renderInitialPostsIfEmpty();
  init();

})();
