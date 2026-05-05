/* ============================================
   UTILS.JS - Shared utility functions
   ============================================ */

const Utils = (function () {
  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get current time in HH:MM AM/PM format
   * @returns {string} Formatted time
   */
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Get random item from array
   * @param {array} arr - Array to pick from
   * @returns {any} Random item
   */
  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate random delay (800-2000ms)
   * @returns {number} Delay in milliseconds
   */
  function getRandomDelay() {
    return 800 + Math.random() * 1200;
  }

  /**
   * Safely get localStorage item
   * @param {string} key - Storage key
   * @returns {any} Parsed value or null
   */
  function getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn(`Failed to retrieve ${key} from storage:`, e);
      return null;
    }
  }

  /**
   * Safely set localStorage item
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be stringified)
   * @returns {boolean} Success status
   */
  function setToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Failed to save ${key} to storage:`, e);
      return false;
    }
  }

  return {
    escapeHtml,
    getCurrentTime,
    getRandomItem,
    getRandomDelay,
    getFromStorage,
    setToStorage,
  };
})();
