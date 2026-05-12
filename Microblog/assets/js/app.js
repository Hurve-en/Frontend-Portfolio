const App = (() => {
  function init() {
    Theme.loadTheme();
    Actions.loadState();
    UI.renderCategoryOptions();
    UI.renderCategoryPicker();
    wireEvents();
    Actions.refreshFeed();
    UI.updateStats(Actions.getPosts());
  }

  function wireEvents() {
    const postBtn = document.getElementById("postBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const composeBtn = document.getElementById("composeBtn");
    const composeTxt = document.getElementById("composeTxt");
    const feed = document.getElementById("feed");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const favoritesToggle = document.getElementById("favoritesToggle");
    const themeBtn = document.getElementById("themeBtn");
    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");
    const importInput = document.getElementById("importInput");
    const confirmDelete = document.getElementById("confirmDelete");
    const cancelDelete = document.getElementById("cancelDelete");
    const scrollTopBtn = document.getElementById("scrollTop");
    const usernameEl = document.getElementById("username");

    postBtn.addEventListener("click", Actions.submitPost);
    cancelBtn.addEventListener("click", Actions.cancelEdit);
    composeBtn.addEventListener("click", () => composeTxt.focus());

    composeTxt.addEventListener("input", () => {
      Utils.autoResize(composeTxt);
      UI.updateCharCounter(composeTxt.value.length);
    });

    composeTxt.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        Actions.submitPost();
      }
    });

    feed.addEventListener("click", Actions.handleFeedClick);

    searchInput.addEventListener("input", () => Actions.refreshFeed());
    categoryFilter.addEventListener("change", () => Actions.refreshFeed());
    favoritesToggle.addEventListener("click", Actions.toggleFavoritesFilter);

    themeBtn.addEventListener("click", Theme.toggleTheme);

    exportBtn.addEventListener("click", Export.exportJSON);
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", (e) => {
      if (e.target.files[0]) Export.importJSON(e.target.files[0]);
      importInput.value = "";
    });

    confirmDelete.addEventListener("click", Actions.confirmDeletePost);
    cancelDelete.addEventListener("click", () => Actions.showModal(false));

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

    usernameEl.addEventListener("blur", () => {
      if (!usernameEl.textContent.trim()) {
        usernameEl.textContent = "You";
      }
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
