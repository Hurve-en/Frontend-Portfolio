/* ============================================
   DATA.JS - Conversation data management
   ============================================ */

const ConversationData = (function () {
  // Sample conversations with Keziah, Rheynel, Aj, Kendall
  const conversations = [
    {
      id: 1,
      name: "Keziah",
      avatar: "",
      status: "Online",
      lastMessage: "That sounds amazing! Let me know when you're free",
      timestamp: "2 min ago",
      messages: [
        {
          sender: "Keziah",
          avatar: "",
          text: "Morning Babi :) How are you doing?",
          timestamp: "10:30 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "MORNING WORNING!!! Just finished a project",
          timestamp: "10:32 AM",
          own: true,
        },
        {
          sender: "Keziah",
          avatar: "",
          text: "Wow Onsa man na Project?",
          timestamp: "10:33 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "Himo ko Robot paras ako Lobot",
          timestamp: "10:34 AM",
          own: true,
        },
        {
          sender: "Keziah",
          avatar: "",
          text: "Bruh",
          timestamp: "10:35 AM",
          own: false,
        },
      ],
    },
    {
      id: 2,
      name: "Rheynel",
      avatar: "",
      status: "Online",
      lastMessage: "Let's grab coffee tomorrow!",
      timestamp: "1 hour ago",
      messages: [
        {
          sender: "Rheynel",
          avatar: "",
          text: "Good morning! ☀️",
          timestamp: "9:00 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "Morning! 🌟",
          timestamp: "9:15 AM",
          own: true,
        },
        {
          sender: "Rheynel",
          avatar: "",
          text: "Wanna catch up soon?",
          timestamp: "9:20 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "Absolutely! When?",
          timestamp: "9:25 AM",
          own: true,
        },
        {
          sender: "Rheynel",
          avatar: "",
          text: "Let's grab coffee tomorrow!",
          timestamp: "9:30 AM",
          own: false,
        },
      ],
    },
    {
      id: 3,
      name: "Aj",
      avatar: "",
      status: "Away",
      lastMessage: "Check out the new design mockups!",
      timestamp: "30 min ago",
      messages: [
        {
          sender: "Aj",
          avatar: "",
          text: "Just finished something cool",
          timestamp: "11:00 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "Show me!",
          timestamp: "11:05 AM",
          own: true,
        },
        {
          sender: "Aj",
          avatar: "",
          text: "Check out the new design mockups!",
          timestamp: "11:10 AM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "Looks incredible! 🔥",
          timestamp: "11:12 AM",
          own: true,
        },
      ],
    },
    {
      id: 4,
      name: "Kendall",
      avatar: "",
      status: "Online",
      lastMessage: "The meeting is at 3 PM",
      timestamp: "Just now",
      messages: [
        {
          sender: "Kendall",
          avatar: "",
          text: "Don't forget about the meeting",
          timestamp: "12:30 PM",
          own: false,
        },
        {
          sender: "You",
          avatar: "👤",
          text: "What time?",
          timestamp: "12:31 PM",
          own: true,
        },
        {
          sender: "Kendall",
          avatar: "",
          text: "The meeting is at 3 PM",
          timestamp: "12:32 PM",
          own: false,
        },
      ],
    },
  ];

  // AI Response templates for each contact
  const responseTemplates = {
    1: [
      "That's awesome! 🚀",
      "I'd love to check it out!",
      "Sounds great to me!",
      "When are you available?",
    ],
    2: [
      "Sounds perfect! ☕",
      "Can't wait!",
      "Let's do it!",
      "I'm free anytime tomorrow",
    ],
    3: [
      "Really impressed with this!",
      "Your talent is incredible 🎨",
      "Let's discuss this in detail",
      "This is exactly what we needed",
    ],
    4: [
      "I'll be there!",
      "Thanks for the reminder",
      "See you then!",
      "Got it on my calendar",
    ],
  };

  /**
   * Get all conversations
   * @returns {array} All conversations
   */
  function getAll() {
    return conversations;
  }

  /**
   * Get conversation by ID
   * @param {number} id - Conversation ID
   * @returns {object} Conversation object or null
   */
  function getById(id) {
    return conversations.find((c) => c.id === id);
  }

  /**
   * Search conversations by name
   * @param {string} query - Search query
   * @returns {array} Filtered conversations
   */
  function search(query) {
    return conversations.filter((conv) =>
      conv.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  /**
   * Add message to conversation
   * @param {number} convId - Conversation ID
   * @param {object} message - Message object
   */
  function addMessage(convId, message) {
    const conv = getById(convId);
    if (conv) {
      conv.messages.push(message);
      conv.lastMessage = message.text;
      conv.timestamp = "Just now";
    }
  }

  /**
   * Get response template for conversation
   * @param {number} convId - Conversation ID
   * @returns {array} Response options
   */
  function getResponseTemplate(convId) {
    return responseTemplates[convId] || responseTemplates[1];
  }

  return {
    getAll,
    getById,
    search,
    addMessage,
    getResponseTemplate,
  };
})();
