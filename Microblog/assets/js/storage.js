const Storage = (() => {
  const STORAGE_KEY = "microblog-posts";

  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Load failed", e);
      UI.showToast("Error loading posts", "error");
      return [];
    }
  }

  function savePosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn("Save failed", e);
      UI.showToast("Error saving posts", "error");
    }
  }

  return { loadPosts, savePosts };
})();
