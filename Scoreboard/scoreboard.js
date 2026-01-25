(function () {
  // ------------------ DOM ------------------
  const board = document.getElementById("board");
  const addBtn = document.getElementById("add-group");
  const resetAllBtn = document.getElementById("reset-all");
  const togglePresent = document.getElementById("toggle-present");

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let nextId = 1;

  // ------------------ UTILITIES ------------------
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function animateNumber(el, from, to, duration = 420) {
    if (prefersReduced || from === to) {
      el.textContent = to;
      return;
    }

    const start = performance.now();
    const diff = to - from;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(t);
      el.textContent = Math.round(from + diff * eased);
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>\"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // ------------------ GROUP CREATION ------------------
  function createGroup(name = null, initial = 0) {
    const id = nextId++;
    const box = document.createElement("article");
    box.className = "group-box";
    box.dataset.group = id;

    box.innerHTML = `
      <div class="group-top">
        <input class="name-input" value="${escapeHtml(
          name ?? "Group " + id,
        )}" />
        <div class="group-actions">
          <button class="icon-btn remove" title="Remove">✕</button>
        </div>
      </div>

      <div class="group-score">
        <div class="value" aria-live="polite">${initial}</div>
      </div>

      <div class="group-controls">
        <button class="btn-add">+10</button>
        <button class="btn-minus">-1</button>
        <button class="btn-reset">Reset</button>
      </div>
    `;

    board.appendChild(box);
    attachListeners(box);

    // Entrance animation
    if (!prefersReduced) {
      box.style.opacity = "0";
      box.style.transform = "translateY(12px)";
      requestAnimationFrame(() => {
        box.style.transition =
          "transform 420ms cubic-bezier(.2,.9,.2,1), opacity 360ms ease";
        box.style.opacity = "1";
        box.style.transform = "translateY(0)";
      });
    }

    box.querySelector(".name-input").focus();
    updateLeading();
  }

  // ------------------ SCORE HANDLING ------------------
  function readScore(box) {
    return parseInt(box.querySelector(".value").textContent, 10) || 0;
  }

  function writeScore(box, newValue) {
    const el = box.querySelector(".value");
    const old = readScore(box);

    animateNumber(el, old, newValue);

    if (!prefersReduced) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }

    updateLeading();
  }

  // ------------------ LISTENERS ------------------
  function attachListeners(box) {
    const add = box.querySelector(".btn-add");
    const minus = box.querySelector(".btn-minus");
    const reset = box.querySelector(".btn-reset");
    const remove = box.querySelector(".remove");
    const value = box.querySelector(".value");
    const nameInput = box.querySelector(".name-input");

    add.onclick = () => writeScore(box, readScore(box) + 10);
    minus.onclick = () => writeScore(box, Math.max(0, readScore(box) - 1));
    reset.onclick = () => writeScore(box, 0);

    remove.onclick = () => {
      if (confirm("Remove this group?")) {
        box.style.opacity = "0";
        box.style.transform = "scale(0.96)";
        setTimeout(() => {
          box.remove();
          updateLeading();
        }, 240);
      }
    };

    value.onclick = () => {
      const current = readScore(box);
      const v = prompt(`Set score for "${nameInput.value}"`, current);
      if (v !== null && !isNaN(v)) writeScore(box, Math.max(0, +v));
    };

    nameInput.onkeydown = (e) => {
      if (e.key === "Enter") nameInput.blur();
    };
  }

  // ------------------ LEADING GROUP ------------------
  function updateLeading() {
    const boxes = [...board.querySelectorAll(".group-box")];
    if (!boxes.length) return;

    const scores = boxes.map(readScore);
    const max = Math.max(...scores);

    boxes.forEach((b) => {
      const isLead = readScore(b) === max && max > 0;
      b.classList.toggle("leading", isLead);
    });
  }

  // ------------------ CONTROLS ------------------
  addBtn.onclick = () => createGroup();

  resetAllBtn.onclick = () => {
    if (!confirm("Reset all scores?")) return;
    board.querySelectorAll(".group-box").forEach((b) => writeScore(b, 0));
  };

  togglePresent.onclick = () => {
    const enabled = document.body.classList.toggle("present");
    togglePresent.querySelector(".label").textContent = enabled
      ? "Presentation: ON"
      : "Presentation: OFF";
  };

  // ------------------ SHORTCUTS ------------------
  document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return;

    if (e.key.toLowerCase() === "p") {
      togglePresent.click();
    }
  });

  // ------------------ INIT ------------------
  for (let i = 0; i < 5; i++) createGroup();
})();
