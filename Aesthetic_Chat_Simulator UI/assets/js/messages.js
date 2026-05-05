/* ============================================
   MESSAGES.JS - Message handling and responses
   ============================================ */

const MessageHandler = (function () {
  /**
   * Send message from user
   * @param {string} text - Message text
   * @param {function} onSent - Callback after message sent
   */
  function send(text, onSent) {
    const text_trimmed = text.trim();

    if (!text_trimmed) return;

    const conv = UIManager.getCurrentConversation();
    if (!conv) return;

    // Create user message
    const userMessage = {
      sender: "You",
      avatar: "👤",
      text: text_trimmed,
      timestamp: Utils.getCurrentTime(),
      own: true,
    };

    // Add to conversation data
    ConversationData.addMessage(conv.id, userMessage);

    // Update UI
    UIManager.clearInput();
    UIManager.renderMessages(conv.messages);
    UIManager.renderConversations(ConversationData.getAll());

    // Trigger callback
    if (onSent) onSent();

    // Simulate response after delay
    simulateResponse(conv.id);
  }

  /**
   * Simulate AI response
   * @param {number} convId - Conversation ID
   */
  function simulateResponse(convId) {
    const conv = ConversationData.getById(convId);
    if (!conv) return;

    const delay = Utils.getRandomDelay();

    setTimeout(() => {
      const responses = ConversationData.getResponseTemplate(convId);
      const randomResponse = Utils.getRandomItem(responses);

      const responseMessage = {
        sender: conv.name,
        avatar: conv.avatar,
        text: randomResponse,
        timestamp: Utils.getCurrentTime(),
        own: false,
      };

      // Add to conversation data
      ConversationData.addMessage(convId, responseMessage);

      // Update UI only if this conversation is still active
      const currentConv = UIManager.getCurrentConversation();
      if (currentConv && currentConv.id === convId) {
        UIManager.renderMessages(conv.messages);
      }

      UIManager.renderConversations(ConversationData.getAll());
    }, delay);
  }

  return {
    send,
    simulateResponse,
  };
})();
