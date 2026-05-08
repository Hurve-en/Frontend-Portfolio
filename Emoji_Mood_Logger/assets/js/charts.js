/* ============================================================================
   CHART MANAGER - Draws canvas charts for mood visualization
   ============================================================================ */

class ChartManager {
  static drawTrendChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !entries.length) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const recentEntries = entries.slice(0, 7).reverse();
    const weights = recentEntries.map((e) => {
      const mood = Utilities.getMoodById(e.mood);
      return mood?.weight || 3;
    });

    const maxW = Math.max(...weights, 6);
    const padding = 20;
    const pointRadius = 5;

    // Draw line
    ctx.strokeStyle = "#7cc5ff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#7cc5ff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  static drawDistributionChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !entries.length) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - 20;

    ctx.clearRect(0, 0, w, h);

    const distribution = {};
    entries.forEach((e) => {
      distribution[e.mood] = (distribution[e.mood] || 0) + 1;
    });

    const total = entries.length;
    const colors = [
      "#FFD6A5",
      "#C7D8FF",
      "#9CA3AF",
      "#FCD34D",
      "#60A5FA",
      "#F87171",
    ];
    let currentAngle = -Math.PI / 2;

    MOODS.forEach((mood, index) => {
      const count = distribution[mood.id] || 0;
      const sliceAngle = (count / total) * 2 * Math.PI;

      if (count > 0) {
        ctx.fillStyle = colors[index];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          currentAngle,
          currentAngle + sliceAngle,
        );
        ctx.closePath();
        ctx.fill();
        currentAngle += sliceAngle;
      }
    });

    ctx.fillStyle =
      getComputedStyle(document.body).getPropertyValue("--panel") || "#fff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
  }
}
