/* ============================================================================
   STATISTICS CALCULATOR - Generates mood analytics and insights
   ============================================================================ */

class StatisticsCalculator {
  constructor(entries) {
    this.entries = entries;
  }

  getWeeklyStats() {
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const weekEntries = this.entries.filter((e) => new Date(e.date) >= weekAgo);

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
    MOODS.forEach((mood) => {
      distribution[mood.id] = {
        count: this.entries.filter((e) => e.mood === mood.id).length,
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
        type: "positive",
        text: "✨ You're having a great week! Your mood is consistently positive.",
      });
    } else if (stats.average >= 3) {
      insights.push({
        type: "neutral",
        text: "😊 Your mood is fairly stable this week. Keep up the balance!",
      });
    } else {
      insights.push({
        type: "attention",
        text: "💙 Consider some self-care this week. You deserve it!",
      });
    }

    if (stats.streak >= 7) {
      insights.push({
        type: "achievement",
        text: `🔥 ${stats.streak}-day streak! You\'re consistently tracking your mood.`,
      });
    }

    return insights;
  }
}
