/* Main app controller */
const ScoreboardApp = {
  init() {
    this.addBtn = document.getElementById("add-group");
    this.resetAllBtn = document.getElementById("reset-all");
    this.togglePresent = document.getElementById("toggle-present");

    // Initialize 5 groups
    for (let i = 0; i < 5; i++) {
      const group = ScoreboardState.createGroup();
      const box = ScoreboardUI.createGroupElement(group);
      this.attachGroupListeners(box, group.id);
    }

    ScoreboardUI.updateLeading();
    this.setupEventListeners();
  },

  attachGroupListeners(box, groupId) {
    const add = box.querySelector(".btn-add");
    const minus = box.querySelector(".btn-minus");
    const reset = box.querySelector(".btn-reset");
    const remove = box.querySelector(".remove");
    const value = box.querySelector(".value");
    const nameInput = box.querySelector(".name-input");

    add.onclick = () => {
      const newScore = ScoreboardState.readScore(groupId) + 10;
      ScoreboardState.writeScore(groupId, newScore);
      ScoreboardUI.updateGroupScore(groupId, newScore);
      ScoreboardUI.updateLeading();
    };

    minus.onclick = () => {
      const newScore = ScoreboardState.readScore(groupId) - 1;
      ScoreboardState.writeScore(groupId, newScore);
      ScoreboardUI.updateGroupScore(groupId, newScore);
      ScoreboardUI.updateLeading();
    };

    reset.onclick = () => {
      ScoreboardState.writeScore(groupId, 0);
      ScoreboardUI.updateGroupScore(groupId, 0);
      ScoreboardUI.updateLeading();
    };

    remove.onclick = () => {
      if (confirm("Remove this group?")) {
        ScoreboardState.removeGroup(groupId);
        ScoreboardUI.removeGroupElement(groupId);
      }
    };

    value.onclick = () => {
      const current = ScoreboardState.readScore(groupId);
      const v = prompt(`Set score for "${nameInput.value}"`, current);
      if (v !== null && !isNaN(v)) {
        const newScore = Math.max(0, +v);
        ScoreboardState.writeScore(groupId, newScore);
        ScoreboardUI.updateGroupScore(groupId, newScore);
        ScoreboardUI.updateLeading();
      }
    };

    nameInput.onkeydown = (e) => {
      if (e.key === "Enter") nameInput.blur();
    };

    nameInput.onchange = (e) => {
      const group = ScoreboardState.groups.find((g) => g.id === groupId);
      if (group) group.name = e.target.value;
    };
  },

  setupEventListeners() {
    this.addBtn.onclick = () => {
      const group = ScoreboardState.createGroup();
      const box = ScoreboardUI.createGroupElement(group);
      this.attachGroupListeners(box, group.id);
      ScoreboardUI.updateLeading();
    };

    this.resetAllBtn.onclick = () => {
      if (confirm("Reset all scores?")) {
        ScoreboardState.resetAllScores();
        ScoreboardUI.board.querySelectorAll(".group-box").forEach((box) => {
          const groupId = parseInt(box.dataset.group);
          ScoreboardUI.updateGroupScore(groupId, 0);
        });
        ScoreboardUI.updateLeading();
      }
    };

    this.togglePresent.onclick = () => {
      const enabled = document.body.classList.toggle("present");
      this.togglePresent.querySelector(".label").textContent = enabled
        ? "Presentation: ON"
        : "Presentation: OFF";
    };

    document.addEventListener("keydown", (e) => {
      if (document.activeElement.tagName === "INPUT") return;
      if (e.key.toLowerCase() === "p") this.togglePresent.click();
    });
  },
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => ScoreboardApp.init());
