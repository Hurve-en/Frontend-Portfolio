const Actions = (() => {
  let posts = [];
  let editingId = null;
  let deleteTargetId = null;
  let selectedCategory = null;
  let showFavoritesOnly = false;

  function loadState() {
    posts = Storage.loadPosts();
    restoreFavFilter();
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
      Storage.savePosts(posts);
    }
    return posts;
  }

  function getPosts() {
    return posts;
  }

  function toggleCategorySelection(catId) {
    selectedCategory = selectedCategory === catId ? null : catId;
    UI.updateCategoryButtons(selectedCategory);
  }

  function submitPost() {
    const composeTxt = document.getElementById("composeTxt");
    const postBtn = document.getElementById("postBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const raw = composeTxt.value.trim();

    if (!raw) {
      UI.showToast("Write something before posting", "warning");
      return;
    }

    if (raw.length > 300) {
      UI.showToast("Post is too long (max 300 chars)", "error");
      return;
    }

    if (editingId) {
      const idx = posts.findIndex((p) => p.id === editingId);
      if (idx >= 0) {
        posts[idx].text = raw;
        posts[idx].category = selectedCategory;
        posts[idx].updatedAt = Date.now();
        UI.showToast("Post updated", "success");
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
      UI.showToast("Post created", "success");
    }

    Storage.savePosts(posts);
    composeTxt.value = "";
    selectedCategory = null;
    UI.updateCategoryButtons(selectedCategory);
    UI.updateCharCounter(0);
    refreshFeed();
    UI.updateStats(posts);
  }

  function editPost(postId) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    editingId = postId;
    const composeTxt = document.getElementById("composeTxt");
    const postBtn = document.getElementById("postBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const composeCard = document.getElementById("composeCard");

    composeTxt.value = post.text;
    selectedCategory = post.category || null;
    UI.updateCategoryButtons(selectedCategory);
    composeTxt.focus();
    postBtn.textContent = "Save";
    cancelBtn.classList.remove("hidden");
    UI.updateCharCounter(post.text.length);
    composeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function cancelEdit() {
    const composeTxt = document.getElementById("composeTxt");
    const postBtn = document.getElementById("postBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    editingId = null;
    composeTxt.value = "";
    selectedCategory = null;
    UI.updateCategoryButtons(selectedCategory);
    postBtn.textContent = "Post";
    cancelBtn.classList.add("hidden");
    UI.updateCharCounter(0);
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
    Storage.savePosts(posts);
    refreshFeed();
    UI.updateStats(posts);
    showModal(false);
    UI.showToast(`"${title}..." deleted`, "success");
  }

  function toggleFavorite(postId) {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.isFavorite = !post.isFavorite;
      Storage.savePosts(posts);
      UI.updateStats(posts);
      refreshFeed();
    }
  }

  function refreshFeed() {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    UI.renderFeed(
      posts,
      searchInput.value,
      categoryFilter.value,
      showFavoritesOnly,
    );
  }

  function toggleFavoritesFilter() {
    const favoritesToggle = document.getElementById("favoritesToggle");
    showFavoritesOnly = !showFavoritesOnly;
    favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
    localStorage.setItem("microblog-fav-filter", String(showFavoritesOnly));
    refreshFeed();
  }

  function restoreFavFilter() {
    const favoritesToggle = document.getElementById("favoritesToggle");
    showFavoritesOnly = localStorage.getItem("microblog-fav-filter") === "true";
    favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
  }

  function handleFeedClick(e) {
    const likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
      const id = likeBtn.dataset.id;
      const post = posts.find((p) => p.id === id);
      if (!post) return;
      post.likes = (post.likes || 0) + 1;
      likeBtn.classList.add("animate");
      setTimeout(() => likeBtn.classList.remove("animate"), 240);
      Storage.savePosts(posts);
      refreshFeed();
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

  function showModal(show = true) {
    const modalOverlay = document.getElementById("modalOverlay");
    if (show) {
      modalOverlay.classList.remove("hidden");
      modalOverlay.setAttribute("aria-hidden", "false");
    } else {
      modalOverlay.classList.add("hidden");
      modalOverlay.setAttribute("aria-hidden", "true");
      deleteTargetId = null;
    }
  }

  return {
    loadState,
    getPosts,
    toggleCategorySelection,
    submitPost,
    editPost,
    cancelEdit,
    deletePost,
    confirmDeletePost,
    toggleFavorite,
    refreshFeed,
    toggleFavoritesFilter,
    restoreFavFilter,
    handleFeedClick,
    showModal,
  };
})();
