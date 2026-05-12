const Utils = (() => {
  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function autoResize(field) {
    field.style.height = "auto";
    field.style.height = Math.min(field.scrollHeight, 220) + "px";
  }

  return { escapeHtml, timeAgo, autoResize };
})();
