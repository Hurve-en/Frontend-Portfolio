/* ============================================================================
   STORAGE MANAGER - Handles mood entries and localStorage
   ============================================================================ */

class StorageManager {
  constructor() {
    this.entries = [];
    this.isInitialized = false;
  }

  init() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      this.entries = stored ? JSON.parse(stored) : [];
      this.isInitialized = true;
    } catch (error) {
      console.error("Storage load failed:", error);
      this.entries = [];
    }
  }

  getEntries() {
    return this.entries;
  }

  getByDate(dateStr) {
    return this.entries.find((e) => e.date === dateStr);
  }

  getRecent(count = 7) {
    return this.entries.slice(0, count);
  }

  saveEntry(date, mood, note = "") {
    const existingIndex = this.entries.findIndex((e) => e.date === date);
    const entry = {
      date,
      mood,
      note: note.trim(),
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.entries[existingIndex] = entry;
    } else {
      this.entries.unshift(entry);
    }
    return this.persist();
  }

  deleteEntry(date) {
    const index = this.entries.findIndex((e) => e.date === date);
    if (index >= 0) {
      this.entries.splice(index, 1);
      return this.persist();
    }
    return false;
  }

  clearAll() {
    this.entries = [];
    return this.persist();
  }

  persist() {
    try {
      if (this.entries.length > CONFIG.MAX_STORAGE_ENTRIES) {
        this.entries = this.entries.slice(0, CONFIG.MAX_STORAGE_ENTRIES);
      }
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.entries));
      return true;
    } catch (error) {
      console.error("Storage persist failed:", error);
      return false;
    }
  }

  exportJSON() {
    return JSON.stringify(
      {
        version: "2.0",
        exported: new Date().toISOString(),
        entries: this.entries,
      },
      null,
      2,
    );
  }

  exportCSV() {
    let csv = "Date,Mood,Emoji,Notes\n";
    this.entries.forEach((entry) => {
      const mood = Utilities.getMoodById(entry.mood);
      const notes = `"${(entry.note || "").replace(/"/g, '""')}"`;
      csv += `${entry.date},${mood.label},${mood.emoji},${notes}\n`;
    });
    return csv;
  }

  importJSON(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.entries)) {
        this.entries = [...data.entries, ...this.entries];
        return this.persist();
      }
      return false;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

  getStats() {
    return {
      totalEntries: this.entries.length,
      storageSize: JSON.stringify(this.entries).length,
    };
  }
}
