/* ============================================
   UI.JS - Rendering and display management
   ============================================ */

const UIManager = (function () {
  // DOM Elements
  const conversationsList = document.getElementById("conversationsList");
  const messagesArea = document.getElementById("messagesArea");
  const noChatSelected = document.getElementById("noChatSelected");
  const activeChat = document.getElementById("activeChat");
  const chatTitle = document.getElementById("chatTitle");
  const chatStatus = document.getElementById("chatStatus");
  const headerAvatar = document.getElementById("headerAvatar");

  let currentConversation = null;

  /**
   * Set current conversation reference
   * @param {object} conv - Conversation object
   */
  function setCurrentConversation(conv) {
    currentConversation = conv;
  }

  /**
   * Get current conversation
   * @returns {object} Current conversation
   */
  function getCurrentConversation() {
    return currentConversation;
  }

  /**
   * Render conversations list in sidebar
   * @param {array} convs - Array of conversations
   */
  function renderConversations(convs) {
    conversationsList.innerHTML = convs
      .map(
        (conv) => `
        <div class="conversation-item ${currentConversation?.id === conv.id ? "active" : ""}" onclick="ChatApp.selectConversation(${conv.id})">
            <div class="conversation-avatar">${conv.avatar}</div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-preview">${Utils.escapeHtml(conv.lastMessage)}</div>
            </div>
            <div class="conversation-time">${conv.timestamp}</div>
        </div>
    `,
      )
      .join("");
  }

  /**
   * Render messages in chat area
   * @param {array} messages - Array of messages
   */
  function renderMessages(messages) {
    messagesArea.innerHTML = messages
      .map(
        (msg) => `
        <div class="message-group ${msg.own ? "own" : ""}">
            <div class="message-avatar">${msg.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${Utils.escapeHtml(msg.sender)}</span>
                    <span class="message-time">${msg.timestamp}</span>
                </div>
                <div class="message-text ${msg.own ? "sent" : "received"}">${Utils.escapeHtml(msg.text)}</div>
            </div>
        </div>
    `,
      )
      .join("");

    // Scroll to bottom
    setTimeout(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
  }

  /**
   * Show chat area and hide empty state
   * @param {object} conv - Conversation object
   */
  function showChat(conv) {
    chatTitle.textContent = conv.name;
    chatStatus.textContent = conv.status;
    headerAvatar.textContent = conv.avatar;

    noChatSelected.classList.add("hidden");
    activeChat.classList.remove("hidden");
  }

  /**
   * Show empty state and hide chat
   */
  function showEmptyState() {
    noChatSelected.classList.remove("hidden");
    activeChat.classList.add("hidden");
    currentConversation = null;
  }

  /**
   * Clear message input field
   */
  function clearInput() {
    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
      messageInput.value = "";
    }
  }

  /**
   * Focus message input
   */
  function focusInput() {
    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
      messageInput.focus();
    }
  }

  /**
   * Display no results message
   */
  function showNoResults() {
    conversationsList.innerHTML =
      '<div style="text-align: center; padding: 2rem; color: #9ca3af;">No conversations found</div>';
  }

  return {
    setCurrentConversation,
    getCurrentConversation,
    renderConversations,
    renderMessages,
    showChat,
    showEmptyState,
    clearInput,
    focusInput,
    showNoResults,
  };
})();
