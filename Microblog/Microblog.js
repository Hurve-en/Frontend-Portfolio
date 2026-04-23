/* Modern Minimal Microblog App
   - Favorites & Categories
   - Toast notifications
   - Polished UX with smooth animations
   - Local storage persistence
*/

(() => {
  // Storage keys
  const STORAGE_KEY = "microblog-posts";
  const THEME_KEY = "microblog-theme";
  const FAV_FILTER_KEY = "microblog-fav-filter";

  // Categories
  const CATEGORIES = [
    { id: "personal", label: "Personal", color: "accent" },
    { id: "work", label: "Work", color: "accent" },
    { id: "ideas", label: "Ideas", color: "accent" },
    { id: "reflection", label: "Reflection", color: "accent" },
  ];

  // DOM elements
  const toastContainer = document.getElementById("toastContainer");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const favoritesToggle = document.getElementById("favoritesToggle");
  const themeBtn = document.getElementById("themeBtn");

  const usernameEl = document.getElementById("username");
  const bioEl = document.getElementById("bio");
  const postCountEl = document.getElementById("postCount");
  const favCountEl = document.getElementById("favCount");

  const composeTxt = document.getElementById("composeTxt");
  const categoryPicker = document.getElementById("categoryPicker");
  const charCounter = document.getElementById("charCounter");
  const postBtn = document.getElementById("postBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const composeCard = document.getElementById("composeCard");
  const emptyState = document.getElementById("emptyState");

  const feed = document.getElementById("feed");
  const composeBtn = document.getElementById("composeBtn");

  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");

  const modalOverlay = document.getElementById("modalOverlay");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");

  const scrollTopBtn = document.getElementById("scrollTop");

  // App state
  let posts = [];
  let editingId = null;
  let deleteTargetId = null;
  let selectedCategory = null;
  let showFavoritesOnly = false;

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    loadTheme();
    loadPosts();
    renderCategoryOptions();
    renderCategoryPicker();
    wireEvents();
    renderFeed();
    updateStats();
    restoreFavFilter();
  }

  // ============================================
  // THEME MANAGEMENT
  // ============================================
  function loadTheme() {
    const t = localStorage.getItem(THEME_KEY) || "light";
    applyTheme(t);
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function toggleTheme() {
    const current = document.body.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    showToast("Theme updated", "success");
  }

  // ============================================
  // STORAGE MANAGEMENT
  // ============================================
  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      posts = raw ? JSON.parse(raw) : [];
    } catch (e) {
      posts = [];
      console.warn("Load failed", e);
      showToast("Error loading posts", "error");
    }
  }

  function savePosts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn("Save failed", e);
      showToast("Error saving posts", "error");
    }
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  function showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute("role", "status");

    toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 140);
      }, duration);
    }
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================
  function renderCategoryOptions() {
    categoryFilter.innerHTML = '<option value="">All categories</option>';
    CATEGORIES.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      categoryFilter.appendChild(opt);
    });
  }

  function renderCategoryPicker() {
    categoryPicker.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-btn";
      btn.textContent = cat.label;
      btn.dataset.category = cat.id;
      btn.addEventListener("click", () => toggleCategorySelection(cat.id));
      categoryPicker.appendChild(btn);
    });
  }

  function toggleCategorySelection(catId) {
    selectedCategory = selectedCategory === catId ? null : catId;
    updateCategoryButtons();
  }

  function updateCategoryButtons() {
    document.querySelectorAll(".category-btn").forEach((btn) => {
      const isActive = btn.dataset.category === selectedCategory;
      btn.classList.toggle("active", isActive);
    });
  }

  function getCategoryLabel(catId) {
    return CATEGORIES.find((c) => c.id === catId)?.label || "";
  }

  // ============================================
  // FAVORITES MANAGEMENT
  // ============================================
  function toggleFavoritesFilter() {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
    localStorage.setItem(FAV_FILTER_KEY, String(showFavoritesOnly));
    renderFeed();
  }

  function restoreFavFilter() {
    showFavoritesOnly = localStorage.getItem(FAV_FILTER_KEY) === "true";
    favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
  }

  function toggleFavorite(postId) {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.isFavorite = !post.isFavorite;
      savePosts();
      updateStats();
      renderFeed();
    }
  }

  // ============================================
  // POST MANAGEMENT
  // ============================================
  function submitPost() {
    const raw = composeTxt.value.trim();

    if (!raw) {
      showToast("Write something before posting", "warning");
      return;
    }

    if (raw.length > 300) {
      showToast("Post is too long (max 300 chars)", "error");
      return;
    }

    if (editingId) {
      const idx = posts.findIndex((p) => p.id === editingId);
      if (idx >= 0) {
        posts[idx].text = raw;
        posts[idx].category = selectedCategory;
        posts[idx].updatedAt = Date.now();
        showToast("Post updated", "success");
      }
      editingId = null;
      postBtn.textContent = "Post";
      cancelBtn.classList.add("hidden");
    } else {
      const newPost = {
        id: Date.now().toString(36),
        text: raw,
        category: selectedCategory,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likes: 0,
        isFavorite: false,
      };
      posts.unshift(newPost);
      showToast("Post created", "success");
    }

    savePosts();
    composeTxt.value = "";
    selectedCategory = null;
    updateCategoryButtons();
    updateCharCounter();
    renderFeed();
    updateStats();
  }

  function editPost(postId) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    editingId = postId;
    composeTxt.value = post.text;
    selectedCategory = post.category || null;
    updateCategoryButtons();
    composeTxt.focus();
    postBtn.textContent = "Save";
    cancelBtn.classList.remove("hidden");
    updateCharCounter();

    // Scroll to compose box
    composeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function cancelEdit() {
    editingId = null;
    composeTxt.value = "";
    selectedCategory = null;
    updateCategoryButtons();
    postBtn.textContent = "Post";
    cancelBtn.classList.add("hidden");
    updateCharCounter();
  }

  function deletePost(postId) {
    deleteTargetId = postId;
    showModal(true);
  }

  function confirmDeletePost() {
    if (!deleteTargetId) return showModal(false);
    const post = posts.find((p) => p.id === deleteTargetId);
    const title = post?.text?.substring(0, 30) || "post";
    posts = posts.filter((p) => p.id !== deleteTargetId);
    savePosts();
    renderFeed();
    updateStats();
    showModal(false);
    showToast(`"${title}..." deleted`, "success");
  }

  // ============================================
  // RENDERING
  // ============================================
  function renderFeed(filter = {}) {
    feed.innerHTML = "";

    let visible = posts.slice().sort((a, b) => b.createdAt - a.createdAt);

    // Search filter
    const q = searchInput.value.trim().toLowerCase();
    if (q) {
      visible = visible.filter((p) => p.text.toLowerCase().includes(q));
    }

    // Category filter
    const cat = categoryFilter.value;
    if (cat) {
      visible = visible.filter((p) => p.category === cat);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      visible = visible.filter((p) => p.isFavorite);
    }

    // Render posts or empty state
    if (visible.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      visible.forEach((post) => feed.appendChild(renderPostCard(post)));
    }

    updateStats();
  }

  function renderPostCard(post) {
    const card = document.createElement("article");
    card.className = "post";
    card.dataset.id = post.id;

    const timeStr = timeAgo(post.createdAt);
    const categoryBadge = post.category
      ? `<span class="post-category">${getCategoryLabel(post.category)}</span>`
      : "";

    const heartIcon = post.isFavorite ? "♥" : "♡";
    const heartClass = post.isFavorite ? "favorited" : "";

    card.innerHTML = `
      <div class="post-header">
        <div class="post-user">
          <div class="avatar-sm" aria-hidden="true">✍</div>
          <div>
            <div class="post-username">${escapeHtml(usernameEl.textContent)}</div>
            <div class="post-meta">
              <span>${timeStr}</span>
              ${categoryBadge}
            </div>
          </div>
        </div>
      </div>

      <div class="post-body">${escapeHtml(post.text)}</div>

      <div class="post-footer">
        <div class="post-stats">
          <span>${post.likes} like${post.likes !== 1 ? "s" : ""}</span>
        </div>
        <div class="post-actions">
          <button class="icon-btn like-btn" title="Like" data-id="${post.id}">
            ❤ <span class="like-count">${post.likes}</span>
          </button>
          <button class="icon-btn favorite-btn ${heartClass}" title="Favorite" data-id="${post.id}">
            ${heartIcon}
          </button>
          <button class="icon-btn edit-btn" title="Edit" data-id="${post.id}">✎</button>
          <button class="icon-btn delete-btn" title="Delete" data-id="${post.id}">🗑</button>
        </div>
      </div>
    `;

    return card;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // ============================================
  // UTILITIES
  // ============================================
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function updateCharCounter() {
    const len = composeTxt.value.length;
    charCounter.textContent = `${len} / 300`;

    if (len > 280) {
      charCounter.classList.add("danger");
      charCounter.classList.remove("warning");
    } else if (len > 240) {
      charCounter.classList.add("warning");
      charCounter.classList.remove("danger");
    } else {
      charCounter.classList.remove("warning", "danger");
    }
  }

  function updateStats() {
    postCountEl.textContent = posts.length;
    favCountEl.textContent = posts.filter((p) => p.isFavorite).length;
  }

  // ============================================
  // FEED INTERACTIONS
  // ============================================
  function handleFeedClick(e) {
    const likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
      const id = likeBtn.dataset.id;
      const post = posts.find((p) => p.id === id);
      if (!post) return;
      post.likes = (post.likes || 0) + 1;
      likeBtn.classList.add("animate");
      setTimeout(() => likeBtn.classList.remove("animate"), 240);
      savePosts();
      renderFeed();
      return;
    }

    const favBtn = e.target.closest(".favorite-btn");
    if (favBtn) {
      const id = favBtn.dataset.id;
      toggleFavorite(id);
      return;
    }

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      editPost(id);
      return;
    }

    const delBtn = e.target.closest(".delete-btn");
    if (delBtn) {
      const id = delBtn.dataset.id;
      deletePost(id);
      return;
    }
  }

  // ============================================
  // MODAL
  // ============================================
  function showModal(show = true) {
    if (show) {
      modalOverlay.classList.remove("hidden");
      modalOverlay.setAttribute("aria-hidden", "false");
    } else {
      modalOverlay.classList.add("hidden");
      modalOverlay.setAttribute("aria-hidden", "true");
      deleteTargetId = null;
    }
  }

  // ============================================
  // IMPORT / EXPORT
  // ============================================
  function exportJSON() {
    const data = JSON.stringify(posts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `microblog-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Posts exported", "success");
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("Invalid file");
        posts = arr.concat(posts);
        savePosts();
        renderFeed();
        updateStats();
        showToast(`${arr.length} posts imported`, "success");
      } catch (e) {
        showToast(`Import failed: ${e.message}`, "error");
      }
    };
    reader.readAsText(file);
  }

  // ============================================
  // EVENT WIRING
  // ============================================
  function wireEvents() {
    postBtn.addEventListener("click", submitPost);
    cancelBtn.addEventListener("click", cancelEdit);
    composeBtn.addEventListener("click", () => composeTxt.focus());

    composeTxt.addEventListener("input", () => {
      autoResize(composeTxt);
      updateCharCounter();
    });

    composeTxt.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        submitPost();
      }
    });

    feed.addEventListener("click", handleFeedClick);

    searchInput.addEventListener("input", () => renderFeed());
    categoryFilter.addEventListener("change", () => renderFeed());
    favoritesToggle.addEventListener("click", toggleFavoritesFilter);

    themeBtn.addEventListener("click", toggleTheme);

    exportBtn.addEventListener("click", exportJSON);
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", (e) => {
      if (e.target.files[0]) importJSON(e.target.files[0]);
      importInput.value = "";
    });

    confirmDelete.addEventListener("click", confirmDeletePost);
    cancelDelete.addEventListener("click", () => showModal(false));

    // Scroll to top button
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.remove("hidden");
      } else {
        scrollTopBtn.classList.add("hidden");
      }
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Make username editable
    usernameEl.addEventListener("blur", () => {
      if (!usernameEl.textContent.trim()) {
        usernameEl.textContent = "You";
      }
    });
  }

  function autoResize(field) {
    field.style.height = "auto";
    field.style.height = Math.min(field.scrollHeight, 220) + "px";
  }

  // ============================================
  // INITIAL SETUP
  // ============================================
  function renderInitialPostsIfEmpty() {
    if (!posts.length) {
      posts = [
        {
          id: "p1",
          text: "Welcome to your minimal microblog! Click the compose button to share your thoughts.",
          category: "personal",
          createdAt: Date.now() - 1000 * 60 * 60,
          updatedAt: Date.now() - 1000 * 60 * 60,
          likes: 0,
          isFavorite: false,
        },
      ];
      savePosts();
    }
  }

  // Boot app
  renderInitialPostsIfEmpty();
  init();
})();
