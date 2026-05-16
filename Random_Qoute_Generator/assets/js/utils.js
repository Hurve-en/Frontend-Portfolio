const Utils = (() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showHint(msg, ms = 1600) {
    const hintEl = document.getElementById("hint");
    if (!hintEl) return;
    hintEl.textContent = msg;
    if (ms > 0) {
      setTimeout(() => {
        hintEl.textContent = "Quotes are saved locally in your browser.";
      }, ms);
    }
  }

  function createHint() {
    const el = document.createElement("div");
    el.id = "hint";
    el.textContent = "Quotes are saved locally in your browser.";
    const card = document.querySelector(".card");
    if (card) card.appendChild(el);
    return el;
  }

  return { prefersReduced, showHint, createHint };
})();
