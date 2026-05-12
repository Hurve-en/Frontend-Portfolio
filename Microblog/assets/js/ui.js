const UI = (() => {
  const CATEGORIES = [
    { id: "personal", label: "Personal" },
    { id: "work", label: "Work" },
    { id: "ideas", label: "Ideas" },
    { id: "reflection", label: "Reflection" },
  ];

  function showToast(message, type = "success", duration = 3000) {
    const toastContainer = document.getElementById("toastContainer");
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

  function renderCategoryOptions() {
    const categoryFilter = document.getElementById("categoryFilter");
    categoryFilter.innerHTML = '<option value="">All categories</option>';
    CATEGORIES.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      categoryFilter.appendChild(opt);
    });
  }

  function renderCategoryPicker() {
    const categoryPicker = document.getElementById("categoryPicker");
    categoryPicker.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-btn";
      btn.textContent = cat.label;
      btn.dataset.category = cat.id;
      btn.addEventListener("click", () =>
        Actions.toggleCategorySelection(cat.id),
      );
      categoryPicker.appendChild(btn);
    });
  }

  function updateCategoryButtons(selectedCategory) {
    document.querySelectorAll(".category-btn").forEach((btn) => {
      const isActive = btn.dataset.category === selectedCategory;
      btn.classList.toggle("active", isActive);
    });
  }

  function getCategoryLabel(catId) {
    return CATEGORIES.find((c) => c.id === catId)?.label || "";
  }

  function renderFeed(posts, searchQuery, categoryFilter, showFavoritesOnly) {
    const feed = document.getElementById("feed");
    const emptyState = document.getElementById("emptyState");
    feed.innerHTML = "";

    let visible = posts.slice().sort((a, b) => b.createdAt - a.createdAt);

    if (searchQuery) {
      visible = visible.filter((p) =>
        p.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (categoryFilter) {
      visible = visible.filter((p) => p.category === categoryFilter);
    }

    if (showFavoritesOnly) {
      visible = visible.filter((p) => p.isFavorite);
    }

    if (visible.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      visible.forEach((post) => feed.appendChild(renderPostCard(post)));
    }
  }

  function renderPostCard(post) {
    const usernameEl = document.getElementById("username");
    const card = document.createElement("article");
    card.className = "post";
    card.dataset.id = post.id;

    const timeStr = Utils.timeAgo(post.createdAt);
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
            <div class="post-username">${Utils.escapeHtml(usernameEl.textContent)}</div>
            <div class="post-meta">
              <span>${timeStr}</span>
              ${categoryBadge}
            </div>
          </div>
        </div>
      </div>

      <div class="post-body">${Utils.escapeHtml(post.text)}</div>

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

  function updateCharCounter(len) {
    const charCounter = document.getElementById("charCounter");
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

  function updateStats(posts) {
    const postCountEl = document.getElementById("postCount");
    const favCountEl = document.getElementById("favCount");
    postCountEl.textContent = posts.length;
    favCountEl.textContent = posts.filter((p) => p.isFavorite).length;
  }

  return {
    showToast,
    renderCategoryOptions,
    renderCategoryPicker,
    updateCategoryButtons,
    getCategoryLabel,
    renderFeed,
    updateCharCounter,
    updateStats,
  };
})();
