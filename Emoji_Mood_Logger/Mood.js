/**
 * EMOJI MOOD LOGGER v2.0
 * Senior Developer Edition - Modern, Modular Architecture
 * Fully refactored with OOP principles, performance optimization, and modern features
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  STORAGE_KEY: 'moodlogger:entries:v2',
  THEME_KEY: 'moodlogger:theme:v2',
  MAX_STORAGE_ENTRIES: 10000,
  TOAST_DURATION: 1800,
};

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#FFD6A5', weight: 5 },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: '#C7D8FF', weight: 6 },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: '#9CA3AF', weight: 3 },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#FCD34D', weight: 2 },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#60A5FA', weight: 1 },
  { id: 'angry', emoji: '😡', label: 'Angry', color: '#F87171', weight: 0 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utilities = {
  keyForDate(d = new Date()) {
    return d.toISOString().slice(0, 10);
  },

  formatDate(dateStr, options = { month: 'short', day: 'numeric' }) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, options);
  },

  getMoodById(id) {
    return MOODS.find(m => m.id === id);
  },

  averageMoodWeight(entries) {
    if (!entries.length) return 0;
    const total = entries.reduce((sum, e) => {
      const mood = this.getMoodById(e.mood);
      return sum + (mood?.weight || 0);
    }, 0);
    return (total / entries.length).toFixed(1);
  },

  getMostCommonMood(entries) {
    if (!entries.length) return null;
    const counts = {};
    entries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? this.getMoodById(mostCommon[0]) : null;
  },

  calculateStreak(entries) {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const key = this.keyForDate(checkDate);
      if (entries.some(e => e.date === key)) {
        streak++;
      } else break;
    }
    return streak;
  },
};

// ============================================================================
// STORAGE MANAGER
// ============================================================================

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
      console.error('Storage load failed:', error);
      this.entries = [];
    }
  }

  getEntries() {
    return this.entries;
  }

  getByDate(dateStr) {
    return this.entries.find(e => e.date === dateStr);
  }

  getRecent(count = 7) {
    return this.entries.slice(0, count);
  }

  saveEntry(date, mood, note = '') {
    const existingIndex = this.entries.findIndex(e => e.date === date);
    const entry = { date, mood, note: note.trim(), timestamp: new Date().toISOString() };

    if (existingIndex >= 0) {
      this.entries[existingIndex] = entry;
    } else {
      this.entries.unshift(entry);
    }
    return this.persist();
  }

  deleteEntry(date) {
    const index = this.entries.findIndex(e => e.date === date);
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
      console.error('Storage persist failed:', error);
      return false;
    }
  }

  exportJSON() {
    return JSON.stringify({
      version: '2.0',
      exported: new Date().toISOString(),
      entries: this.entries,
    }, null, 2);
  }

  exportCSV() {
    let csv = 'Date,Mood,Emoji,Notes\n';
    this.entries.forEach(entry => {
      const mood = Utilities.getMoodById(entry.mood);
      const notes = `"${(entry.note || '').replace(/"/g, '""')}"`;
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
      console.error('Import failed:', error);
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

// ============================================================================
// STATISTICS CALCULATOR
// ============================================================================

class StatisticsCalculator {
  constructor(entries) {
    this.entries = entries;
  }

  getWeeklyStats() {
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const weekEntries = this.entries.filter(e => new Date(e.date) >= weekAgo);

    return {
      totalDays: 7,
      recordedDays: weekEntries.length,
      average: Utilities.averageMoodWeight(weekEntries),
      mostCommon: Utilities.getMostCommonMood(weekEntries),
      streak: Utilities.calculateStreak(weekEntries),
    };
  }

  getMoodDistribution() {
    const distribution = {};
    MOODS.forEach(mood => {
      distribution[mood.id] = {
        count: this.entries.filter(e => e.mood === mood.id).length,
        label: mood.label,
        emoji: mood.emoji,
        color: mood.color,
      };
    });
    return distribution;
  }

  getWeeklySummary() {
    const stats = this.getWeeklyStats();
    const distribution = this.getMoodDistribution();
    return { ...stats, distribution, insights: this.generateInsights() };
  }

  generateInsights() {
    const stats = this.getWeeklyStats();
    const insights = [];

    if (stats.average >= 4) {
      insights.push({
        type: 'positive',
        text: '✨ You\'re having a great week! Your mood is consistently positive.',
      });
    } else if (stats.average >= 3) {
      insights.push({
        type: 'neutral',
        text: '😊 Your mood is fairly stable this week. Keep up the balance!',
      });
    } else {
      insights.push({
        type: 'attention',
        text: '💙 Consider some self-care this week. You deserve it!',
      });
    }

    if (stats.streak >= 7) {
      insights.push({
        type: 'achievement',
        text: `🔥 ${stats.streak}-day streak! You\'re consistently tracking your mood.`,
      });
    }

    return insights;
  }
}

// ============================================================================
// CHART MANAGER
// ============================================================================

class ChartManager {
  static drawTrendChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !entries.length) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const recentEntries = entries.slice(0, 7).reverse();
    const weights = recentEntries.map(e => {
      const mood = Utilities.getMoodById(e.mood);
      return mood?.weight || 3;
    });

    const maxW = Math.max(...weights, 6);
    const padding = 20;
    const pointRadius = 5;

    // Draw line
    ctx.strokeStyle = '#7cc5ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    weights.forEach((v, i) => {
      const x = (i / (weights.length - 1 || 1)) * (w - 2 * padding) + padding;
      const y = h - (v / maxW) * (h - 2 * padding) - padding;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    weights.forEach((v, i) => {
      const x = (i / (weights.length - 1 || 1)) * (w - 2 * padding) + padding;
      const y = h - (v / maxW) * (h - 2 * padding) - padding;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7cc5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  static drawDistributionChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !entries.length) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - 20;

    ctx.clearRect(0, 0, w, h);

    const distribution = {};
    entries.forEach(e => {
      distribution[e.mood] = (distribution[e.mood] || 0) + 1;
    });

    const total = entries.length;
    const colors = ['#FFD6A5', '#C7D8FF', '#9CA3AF', '#FCD34D', '#60A5FA', '#F87171'];
    let currentAngle = -Math.PI / 2;

    MOODS.forEach((mood, index) => {
      const count = distribution[mood.id] || 0;
      const sliceAngle = (count / total) * 2 * Math.PI;

      if (count > 0) {
        ctx.fillStyle = colors[index];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        currentAngle += sliceAngle;
      }
    });

    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--panel') || '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// ============================================================================
// UI RENDERER
// ============================================================================

class UIRenderer {
  constructor() {
    this.elements = this.cacheElements();
  }

  cacheElements() {
    return {
      moodPad: document.querySelector('.mood-pad'),
      todaySummary: document.getElementById('todaySummary'),
      noteInput: document.getElementById('noteInput'),
      historyPreview: document.getElementById('historyPreview'),
      trendCanvas: document.getElementById('trendCanvas'),
      distributionCanvas: document.getElementById('distributionCanvas'),
      moodModal: document.getElementById('moodModal'),
      historyModal: document.getElementById('historyModal'),
      weeklyModal: document.getElementById('weeklyModal'),
      dataModal: document.getElementById('dataModal'),
      modalMoodPad: document.getElementById('modalMoodPad'),
      modalNote: document.getElementById('modalNote'),
      calendarGrid: document.getElementById('calendarGrid'),
      weeklyReportContent: document.getElementById('weeklyReportContent'),
      saveTodayBtn: document.getElementById('saveToday'),
      openEditModal: document.getElementById('openEditModal'),
      openHistory: document.getElementById('openHistory'),
      viewWeekly: document.getElementById('viewWeekly'),
      saveModal: document.getElementById('saveModal'),
      cancelModal: document.getElementById('cancelModal'),
      addMoodFab: document.getElementById('addMoodFab'),
      exportData: document.getElementById('exportData'),
      downloadBackup: document.getElementById('downloadBackup'),
      uploadBackup: document.getElementById('uploadBackup'),
      resetData: document.getElementById('resetData'),
      themeToggle: document.getElementById('themeToggle'),
      darkMode: document.getElementById('darkMode'),
      showCharts: document.getElementById('showCharts'),
      fontSizeSelect: document.getElementById('fontSize'),
      filterMood: document.getElementById('filterMood'),
      avgMood: document.getElementById('avgMood'),
      streak: document.getElementById('streak'),
      mostCommon: document.getElementById('mostCommon'),
      totalEntries: document.getElementById('totalEntries'),
      toast: document.getElementById('toast'),
      loadingSpinner: document.getElementById('loadingSpinner'),
    };
  }

  renderMoodButtons(container) {
    container.innerHTML = '';
    MOODS.forEach(mood => {
      const btn = document.createElement('button');
      btn.className = 'mood-btn';
      btn.type = 'button';
      btn.setAttribute('data-id', mood.id);
      btn.setAttribute('aria-label', mood.label);
      btn.setAttribute('title', mood.label);
      btn.innerHTML = `<div>${mood.emoji}</div>`;
      container.appendChild(btn);
    });
  }

  highlightMood(container, moodId) {
    container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === moodId);
    });
  }

  renderTodaySummary(entry) {
    if (!entry) {
      this.elements.todaySummary.innerHTML = '<div class="empty">No mood recorded today — pick an emoji above.</div>';
      return;
    }

    const mood = Utilities.getMoodById(entry.mood);
    this.elements.todaySummary.innerHTML = `
      <div class="summary-emoji">${mood.emoji}</div>
      <div>
        <div class="summary-text">${mood.label}</div>
        <div class="muted small">${entry.note ? entry.note.slice(0, 120) : 'No note'}</div>
      </div>
    `;
  }

  renderHistoryPreview(entries) {
    this.elements.historyPreview.innerHTML = '';
    const days = 14;

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = Utilities.keyForDate(d);
      const entry = entries.find(e => e.date === key);
      const mood = entry ? Utilities.getMoodById(entry.mood) : null;

      const dayEl = document.createElement('div');
      dayEl.className = 'history-day';
      dayEl.innerHTML = `
        <div class="day">${Utilities.formatDate(key)}</div>
        <div class="emoji">${mood ? mood.emoji : '—'}</div>
      `;
      dayEl.style.cursor = 'pointer';
      dayEl.addEventListener('click', () => this.openEditModal(key));
      this.elements.historyPreview.appendChild(dayEl);
    }
  }

  renderCalendar(entries) {
    this.elements.calendarGrid.innerHTML = '';
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = Utilities.keyForDate(d);
      const entry = entries.find(e => e.date === key);
      const mood = entry ? Utilities.getMoodById(entry.mood) : null;

      const dayCard = document.createElement('div');
      dayCard.className = 'calendar-day';
      dayCard.innerHTML = `
        <div class="small muted">${Utilities.formatDate(key, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div class="emoji" style="font-size:20px;">${mood ? mood.emoji : '—'}</div>
        <div class="muted small">${entry && entry.note ? entry.note.slice(0, 40) : ''}</div>
      `;
      dayCard.style.cursor = 'pointer';
      dayCard.addEventListener('click', () => this.openEditModal(key));
      this.elements.calendarGrid.appendChild(dayCard);
    }
  }

  renderStatistics(stats) {
    this.elements.avgMood.textContent = stats.average || '—';
    this.elements.streak.textContent = `${stats.streak} 🔥`;
    this.elements.mostCommon.textContent = stats.mostCommon ? stats.mostCommon.emoji : '—';
  }

  renderWeeklyReport(summary) {
    const html = `
      <div class="report-section">
        <h4>📊 Weekly Overview</h4>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Days Tracked</div>
            <div class="stat-value">${summary.recordedDays}/${summary.totalDays}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Average Mood</div>
            <div class="stat-value">${summary.average}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Streak</div>
            <div class="stat-value">${summary.streak} 🔥</div>
          </div>
        </div>
      </div>
      <div class="report-section">
        <h4>😊 Mood Distribution</h4>
        <div class="distribution-list">
          ${Object.entries(summary.distribution).map(([moodId, data]) => `
            <div class="distribution-item">
              <div class="dist-label">${data.emoji} ${data.label}</div>
              <div class="dist-bar">
                <div class="dist-fill" style="width: ${(data.count / 7) * 100}%"></div>
              </div>
              <div class="dist-count">${data.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="report-section">
        <h4>✨ Insights</h4>
        <div class="insights-list">
          ${summary.insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
              ${insight.text}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.elements.weeklyReportContent.innerHTML = html;
  }

  showToast(message, duration = CONFIG.TOAST_DURATION) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add('show');
    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, duration);
  }

  openEditModal(dateStr) {
    this.elements.moodModal.dataset.date = dateStr;
    const formattedDate = Utilities.formatDate(dateStr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('modalDateInfo').textContent = formattedDate;
    this.elements.moodModal.showModal();
  }

  updateStats(stats) {
    this.elements.totalEntries.textContent = stats.totalEntries;
  }
}

// ============================================================================
// MAIN APP CONTROLLER
// ============================================================================

class MoodLoggerApp {
  constructor() {
    this.storage = new StorageManager();
    this.ui = new UIRenderer();
    this.selectedMood = null;
    this.modalSelectedMood = null;
    this.init();
  }

  init() {
    this.storage.init();
    this.attachEventListeners();
    this.loadTheme();
    this.render();
  }

  attachEventListeners() {
    // Mood selection
    this.ui.elements.moodPad.addEventListener('click', (e) => this.handleMoodSelect(e, false));
    this.ui.elements.modalMoodPad.addEventListener('click', (e) => this.handleMoodSelect(e, true));

    // Main buttons
    this.ui.elements.saveTodayBtn.addEventListener('click', () => this.saveToday());
    this.ui.elements.openEditModal.addEventListener('click', () => {
      this.ui.openEditModal(Utilities.keyForDate());
    });
    this.ui.elements.addMoodFab.addEventListener('click', () => {
      this.ui.openEditModal(Utilities.keyForDate());
    });

    // History and reports
    this.ui.elements.openHistory.addEventListener('click', () => this.openHistoryModal());
    this.ui.elements.viewWeekly.addEventListener('click', () => this.openWeeklyModal());

    // Modal actions
    this.ui.elements.saveModal.addEventListener('click', () => this.saveModalEntry());
    this.ui.elements.cancelModal.addEventListener('click', () => this.ui.elements.moodModal.close());

    // Close modal buttons
    document.getElementById('closeHistoryBtn')?.addEventListener('click', () => this.ui.elements.historyModal.close());
    document.getElementById('closeWeeklyBtn')?.addEventListener('click', () => this.ui.elements.weeklyModal.close());
    document.getElementById('closeMoodModalBtn')?.addEventListener('click', () => this.ui.elements.moodModal.close());
    document.getElementById('closeDataModalBtn')?.addEventListener('click', () => this.ui.elements.dataModal.close());

    // Settings
    this.ui.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.ui.elements.darkMode.addEventListener('change', (e) => {
      this.setTheme(e.target.checked ? 'dark' : 'light');
    });
    this.ui.elements.showCharts.addEventListener('change', (e) => {
      this.ui.elements.trendCanvas.style.display = e.target.checked ? 'block' : 'none';
      this.ui.elements.distributionCanvas.style.display = e.target.checked ? 'block' : 'none';
    });
    this.ui.elements.fontSizeSelect.addEventListener('change', (e) => {
      document.documentElement.style.fontSize = e.target.value + 'px';
    });

    // Data management
    this.ui.elements.exportData.addEventListener('click', () => this.ui.elements.dataModal.showModal());
    document.getElementById('exportCSV')?.addEventListener('click', () => this.exportData('csv'));
    document.getElementById('exportJSON')?.addEventListener('click', () => this.exportData('json'));
    document.getElementById('importData')?.addEventListener('click', () => this.importData());
    this.ui.elements.downloadBackup.addEventListener('click', () => this.downloadBackup());
    this.ui.elements.uploadBackup.addEventListener('click', () => this.uploadBackup());
    this.ui.elements.resetData.addEventListener('click', () => this.confirmClearAll());

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.ui.elements.moodModal.close();
        this.ui.elements.historyModal.close();
        this.ui.elements.weeklyModal.close();
        this.ui.elements.dataModal.close();
      }
    });

    // Filter
    this.ui.elements.filterMood.addEventListener('change', () => this.applyFilter());

    // Initialize UI
    this.ui.renderMoodButtons(this.ui.elements.moodPad);
    this.ui.renderMoodButtons(this.ui.elements.modalMoodPad);
  }

  handleMoodSelect(event, isModal = false) {
    const btn = event.target.closest('.mood-btn');
    if (!btn) return;

    const moodId = btn.dataset.id;
    if (isModal) {
      this.modalSelectedMood = moodId;
      this.ui.highlightMood(this.ui.elements.modalMoodPad, moodId);
    } else {
      this.selectedMood = moodId;
      this.ui.highlightMood(this.ui.elements.moodPad, moodId);
    }
  }

  saveToday() {
    if (!this.selectedMood) {
      this.ui.showToast('Select an emoji to record your mood');
      return;
    }

    const today = Utilities.keyForDate();
    const note = this.ui.elements.noteInput.value;

    if (this.storage.saveEntry(today, this.selectedMood, note)) {
      this.ui.showToast('✓ Mood saved successfully');
      this.render();
    } else {
      this.ui.showToast('Error saving mood. Please try again.');
    }
  }

  saveModalEntry() {
    if (!this.modalSelectedMood) {
      this.ui.showToast('Select an emoji first');
      return;
    }

    const dateStr = this.ui.elements.moodModal.dataset.date || Utilities.keyForDate();
    const note = this.ui.elements.modalNote.value;

    if (this.storage.saveEntry(dateStr, this.modalSelectedMood, note)) {
      this.ui.elements.moodModal.close();
      this.ui.showToast('✓ Mood updated');
      this.render();
    } else {
      this.ui.showToast('Error saving mood');
    }
  }

  render() {
    const entries = this.storage.getEntries();
    const todayKey = Utilities.keyForDate();
    const today = entries.find(e => e.date === todayKey);

    this.ui.renderTodaySummary(today);
    this.ui.renderHistoryPreview(entries);

    const calc = new StatisticsCalculator(entries);
    const stats = calc.getWeeklyStats();
    this.ui.renderStatistics(stats);

    if (this.ui.elements.showCharts.checked) {
      ChartManager.drawTrendChart('trendCanvas', entries);
      ChartManager.drawDistributionChart('distributionCanvas', entries);
    }

    const storageStats = this.storage.getStats();
    this.ui.updateStats(storageStats);

    if (today) {
      this.selectedMood = today.mood;
      this.ui.highlightMood(this.ui.elements.moodPad, today.mood);
      this.ui.elements.noteInput.value = today.note || '';
    } else {
      this.selectedMood = null;
      this.ui.highlightMood(this.ui.elements.moodPad, null);
      this.ui.elements.noteInput.value = '';
    }
  }

  openHistoryModal() {
    this.ui.renderCalendar(this.storage.getEntries());
    this.ui.elements.historyModal.showModal();
  }

  openWeeklyModal() {
    const calc = new StatisticsCalculator(this.storage.getEntries());
    const summary = calc.getWeeklySummary();
    this.ui.renderWeeklyReport(summary);
    this.ui.elements.weeklyModal.showModal();
  }

  exportData(format) {
    let data, filename, mimeType;

    if (format === 'csv') {
      data = this.storage.exportCSV();
      filename = `mood-history-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      data = this.storage.exportJSON();
      filename = `mood-history-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.ui.showToast(`✓ Data exported as ${format.toUpperCase()}`);
  }

  importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) {
      this.ui.showToast('Select a file to import');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          if (this.storage.importJSON(e.target.result)) {
            this.ui.showToast('✓ Data imported successfully');
            this.render();
          }
        } else {
          this.ui.showToast('Only JSON files are supported for import');
        }
      } catch (error) {
        this.ui.showToast('Error importing data');
      }
    };

    reader.readAsText(file);
  }

  downloadBackup() {
    this.exportData('json');
  }

  uploadBackup() {
    document.getElementById('importFile').click();
  }

  confirmClearAll() {
    if (confirm('⚠️ Are you sure? This will permanently delete all mood entries.')) {
      this.storage.clearAll();
      this.render();
      this.ui.showToast('✓ All data cleared');
    }
  }

  applyFilter() {
    const filterValue = this.ui.elements.filterMood.value;
    const entries = this.storage.getEntries();

    const filtered = filterValue === 'all' ? entries : entries.filter(e => e.mood === filterValue);
    this.ui.renderHistoryPreview(filtered);
  }

  toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    this.ui.elements.darkMode.checked = theme === 'dark';
    this.ui.showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode activated`);
  }

  loadTheme() {
    const stored = localStorage.getItem(CONFIG.THEME_KEY);
    const systemPrefers = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored) {
      this.setTheme(stored);
    } else if (systemPrefers) {
      this.setTheme('dark');
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  window.moodApp = new MoodLoggerApp();
});
