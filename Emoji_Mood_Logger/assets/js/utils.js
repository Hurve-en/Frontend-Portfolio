/* ============================================================================
   UTILITIES - Shared helper functions
   ============================================================================ */

const Utilities = {
  keyForDate(d = new Date()) {
    return d.toISOString().slice(0, 10);
  },

  formatDate(dateStr, options = { month: "short", day: "numeric" }) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(
      undefined,
      options,
    );
  },

  getMoodById(id) {
    return MOODS.find((m) => m.id === id);
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
    entries.forEach((e) => {
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
      if (entries.some((e) => e.date === key)) {
        streak++;
      } else break;
    }
    return streak;
  },
};
