/* Utilities */
const Utilities = {
  prefersReduced:
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,

  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  animateNumber(el, from, to, duration = 420) {
    if (this.prefersReduced || from === to) {
      el.textContent = to;
      return;
    }
    const start = performance.now();
    const diff = to - from;

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = this.easeOutExpo(t);
      el.textContent = Math.round(from + diff * eased);
      if (t < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  },

  escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
};
