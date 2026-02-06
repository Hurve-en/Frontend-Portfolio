// ============================================
// CHATFLOW - AESTHETIC CHAT SIMULATOR
// ============================================

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

// DOM Elements
const conversationsList = document.getElementById("conversationsList");
const messagesArea = document.getElementById("messagesArea");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const noChatSelected = document.getElementById("noChatSelected");
const activeChat = document.getElementById("activeChat");
const chatTitle = document.getElementById("chatTitle");
const chatStatus = document.getElementById("chatStatus");
const headerAvatar = document.getElementById("headerAvatar");
const newChatBtn = document.getElementById("newChatBtn");
const searchInput = document.getElementById("searchInput");

let currentConversation = null;

// ============================================
// INITIALIZE APP
// ============================================

function init() {
  renderConversations();
  attachEventListeners();
}

// ============================================
// RENDER CONVERSATIONS
// ============================================

function renderConversations() {
  conversationsList.innerHTML = conversations
    .map(
      (conv) => `
        <div class="conversation-item ${currentConversation?.id === conv.id ? "active" : ""}" onclick="selectConversation(${conv.id})">
            <div class="conversation-avatar">${conv.avatar}</div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-preview">${conv.lastMessage}</div>
            </div>
            <div class="conversation-time">${conv.timestamp}</div>
        </div>
    `,
    )
    .join("");
}

// ============================================
// SELECT CONVERSATION
// ============================================

function selectConversation(id) {
  currentConversation = conversations.find((c) => c.id === id);

  if (!currentConversation) return;

  // Update header
  chatTitle.textContent = currentConversation.name;
  chatStatus.textContent = currentConversation.status;
  headerAvatar.textContent = currentConversation.avatar;

  // Show/hide sections
  noChatSelected.classList.add("hidden");
  activeChat.classList.remove("hidden");

  // Render messages
  renderMessages();

  // Update conversation list
  renderConversations();

  // Focus input
  messageInput.focus();
}

// ============================================
// RENDER MESSAGES
// ============================================

function renderMessages() {
  messagesArea.innerHTML = currentConversation.messages
    .map(
      (msg) => `
        <div class="message-group ${msg.own ? "own" : ""}">
            <div class="message-avatar">${msg.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${msg.sender}</span>
                    <span class="message-time">${msg.timestamp}</span>
                </div>
                <div class="message-text ${msg.own ? "sent" : "received"}">${msg.text}</div>
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

// ============================================
// SEND MESSAGE
// ============================================

function sendMessage() {
  const text = messageInput.value.trim();

  if (!text || !currentConversation) return;

  // Add message to current conversation
  const newMessage = {
    sender: "You",
    avatar: "👤",
    text: text,
    timestamp: getCurrentTime(),
    own: true,
  };

  currentConversation.messages.push(newMessage);
  currentConversation.lastMessage = text;
  currentConversation.timestamp = "Just now";

  // Clear input
  messageInput.value = "";

  // Render messages
  renderMessages();
  renderConversations();

  // Simulate response after delay
  setTimeout(
    () => {
      simulateResponse();
    },
    800 + Math.random() * 1200,
  );
}

// ============================================
// SIMULATE RESPONSE
// ============================================

function simulateResponse() {
  if (!currentConversation) return;

  const responses = {
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

  const responseList = responses[currentConversation.id] || responses[1];
  const randomResponse =
    responseList[Math.floor(Math.random() * responseList.length)];

  const responseMessage = {
    sender: currentConversation.name,
    avatar: currentConversation.avatar,
    text: randomResponse,
    timestamp: getCurrentTime(),
    own: false,
  };

  currentConversation.messages.push(responseMessage);
  currentConversation.lastMessage = randomResponse;
  currentConversation.timestamp = "Just now";

  renderMessages();
  renderConversations();
}

// ============================================
// GET CURRENT TIME
// ============================================

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================
// NEW CHAT
// ============================================

function openNewChat() {
  // Show first conversation as default
  selectConversation(1);
}

// ============================================
// SEARCH CONVERSATIONS
// ============================================

function searchConversations(query) {
  const filtered = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(query.toLowerCase()),
  );

  conversationsList.innerHTML = filtered
    .map(
      (conv) => `
        <div class="conversation-item ${currentConversation?.id === conv.id ? "active" : ""}" onclick="selectConversation(${conv.id})">
            <div class="conversation-avatar">${conv.avatar}</div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-preview">${conv.lastMessage}</div>
            </div>
            <div class="conversation-time">${conv.timestamp}</div>
        </div>
    `,
    )
    .join("");

  if (filtered.length === 0) {
    conversationsList.innerHTML =
      '<div style="text-align: center; padding: 2rem; color: #9ca3af;">No conversations found</div>';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
  sendBtn.addEventListener("click", sendMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  newChatBtn.addEventListener("click", openNewChat);

  searchInput.addEventListener("input", (e) => {
    if (e.target.value.trim()) {
      searchConversations(e.target.value);
    } else {
      renderConversations();
    }
  });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "n") {
    e.preventDefault();
    openNewChat();
  }
});

// ============================================
// INITIALIZE
// ============================================

init();

console.log("💬 ChatFlow loaded successfully!");
console.log("💬 Conversations available with: Keziah, Rheynel, Aj, Kendall");
