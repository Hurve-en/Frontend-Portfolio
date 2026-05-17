/* UI rendering */
const ScoreboardUI = {
  board: document.getElementById("board"),

  createGroupElement(group) {
    const box = document.createElement("article");
    box.className = "group-box";
    box.dataset.group = group.id;

    box.innerHTML = `
      <div class="group-top">
        <input class="name-input" value="${Utilities.escapeHtml(group.name)}" />
        <div class="group-actions">
          <button class="icon-btn remove" title="Remove">✕</button>
        </div>
      </div>

      <div class="group-score">
        <div class="value" aria-live="polite">${group.score}</div>
      </div>

      <div class="group-controls">
        <button class="btn-add">+10</button>
        <button class="btn-minus">-1</button>
        <button class="btn-reset">Reset</button>
      </div>
    `;

    this.board.appendChild(box);

    // Entry animation
    if (!Utilities.prefersReduced) {
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
    return box;
  },

  updateGroupScore(groupId, newScore) {
    const box = this.board.querySelector(`[data-group="${groupId}"]`);
    if (!box) return;

    const el = box.querySelector(".value");
    const oldScore = parseInt(el.textContent, 10) || 0;

    Utilities.animateNumber(el, oldScore, newScore);

    if (!Utilities.prefersReduced) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
  },

  updateLeading() {
    this.board.querySelectorAll(".group-box").forEach((box) => {
      box.classList.remove("leading");
    });

    const leadingGroup = ScoreboardState.getLeadingGroup();
    if (leadingGroup) {
      const box = this.board.querySelector(`[data-group="${leadingGroup.id}"]`);
      if (box) box.classList.add("leading");
    }
  },

  removeGroupElement(groupId) {
    const box = this.board.querySelector(`[data-group="${groupId}"]`);
    if (box) {
      box.style.opacity = "0";
      box.style.transform = "scale(0.96)";
      setTimeout(() => {
        box.remove();
        this.updateLeading();
      }, 240);
    }
  },

  clearBoard() {
    this.board.innerHTML = "";
  },
};
