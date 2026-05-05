/* ============================================
   APP.JS - Main application controller
   ============================================ */

const ChatApp = (function () {
  // DOM Elements
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const searchInput = document.getElementById("searchInput");

  /**
   * Select and display conversation
   * @param {number} id - Conversation ID
   */
  function selectConversation(id) {
    const conv = ConversationData.getById(id);
    if (!conv) return;

    // Update UI manager
    UIManager.setCurrentConversation(conv);

    // Show chat
    UIManager.showChat(conv);

    // Render messages and conversations
    UIManager.renderMessages(conv.messages);
    UIManager.renderConversations(ConversationData.getAll());

    // Focus input
    UIManager.focusInput();
  }

  /**
   * Open new chat (select first conversation)
   */
  function openNewChat() {
    selectConversation(1);
  }

  /**
   * Handle message sending
   */
  function handleSendMessage() {
    const text = messageInput.value;
    MessageHandler.send(text, () => {
      // Success callback
    });
  }

  /**
   * Handle search input
   * @param {Event} e - Input event
   */
  function handleSearch(e) {
    const query = e.target.value;
    SearchManager.search(query);
  }

  /**
   * Handle keyboard enter key in message input
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleMessageKeypress(e) {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === "n") {
      e.preventDefault();
      openNewChat();
    }
  }

  /**
   * Attach all event listeners
   */
  function attachEventListeners() {
    // Message sending
    if (sendBtn) {
      sendBtn.addEventListener("click", handleSendMessage);
    }

    if (messageInput) {
      messageInput.addEventListener("keypress", handleMessageKeypress);
    }

    // New chat
    if (newChatBtn) {
      newChatBtn.addEventListener("click", openNewChat);
    }

    // Search
    if (searchInput) {
      searchInput.addEventListener("input", handleSearch);
    }

    // Global keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  /**
   * Initialize app
   */
  function init() {
    attachEventListeners();
    console.log("💬 ChatFlow loaded successfully!");
    console.log("💬 Conversations available with: Keziah, Rheynel, Aj, Kendall");
  }

  return {
    selectConversation,
    openNewChat,
    init,
  };
})();

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ChatApp.init());
} else {
  ChatApp.init();
}
