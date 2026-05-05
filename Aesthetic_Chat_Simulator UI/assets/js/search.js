/* ============================================
   SEARCH.JS - Search functionality
   ============================================ */

const SearchManager = (function () {
  /**
   * Search conversations and display results
   * @param {string} query - Search query
   */
  function search(query) {
    const trimmed = query.trim();

    if (!trimmed) {
      // Show all conversations if search is cleared
      UIManager.renderConversations(ConversationData.getAll());
      return;
    }

    // Search conversations
    const results = ConversationData.search(trimmed);

    if (results.length === 0) {
      UIManager.showNoResults();
    } else {
      UIManager.renderConversations(results);
    }
  }

  return {
    search,
  };
})();
