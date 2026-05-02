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
   * Format number: round to 12 decimals and trim trailing zeros
   * @param {number} n - Number to format
   * @returns {string|number} Formatted number
   */
  function formatNumber(n) {
    if (!isFinite(n)) throw new Error("Non-finite result");
    const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-12)
      return Math.round(rounded);
    return String(rounded).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
  }

  /**
   * Check if character is an operator
   * @param {string} ch - Character to check
   * @returns {boolean}
   */
  function isOperator(ch) {
    return ["+", "-", "*", "/"].includes(ch);
  }

  /**
   * Get the last number segment from an expression
   * @param {string} s - Expression string
   * @returns {string} Last number segment
   */
  function getLastNumberSegment(s) {
    let i = s.length - 1;
    let seg = "";
    while (i >= 0) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        seg = ch + seg;
        i--;
      } else {
        break;
      }
    }
    return seg;
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

  /**
   * Safely remove localStorage item
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  function removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove ${key} from storage:`, e);
      return false;
    }
  }

  /**
   * Check if user prefers dark theme
   * @returns {boolean}
   */
  function prefersDarkMode() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  return {
    escapeHtml,
    formatNumber,
    isOperator,
    getLastNumberSegment,
    getFromStorage,
    setToStorage,
    removeFromStorage,
    prefersDarkMode,
  };
})();
