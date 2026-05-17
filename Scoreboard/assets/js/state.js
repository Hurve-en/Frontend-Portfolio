/* State management */
const ScoreboardState = {
  nextId: 1,
  groups: [],

  createGroup(name = null, initial = 0) {
    const id = this.nextId++;
    const group = {
      id,
      name: name ?? `Group ${id}`,
      score: initial,
    };
    this.groups.push(group);
    return group;
  },

  readScore(groupId) {
    const group = this.groups.find((g) => g.id === groupId);
    return group ? group.score : 0;
  },

  writeScore(groupId, newValue) {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.score = Math.max(0, newValue);
    }
  },

  removeGroup(groupId) {
    this.groups = this.groups.filter((g) => g.id !== groupId);
  },

  resetAllScores() {
    this.groups.forEach((g) => (g.score = 0));
  },

  getLeadingGroup() {
    if (!this.groups.length) return null;
    const max = Math.max(...this.groups.map((g) => g.score));
    return max > 0 ? this.groups.find((g) => g.score === max) : null;
  },
};
