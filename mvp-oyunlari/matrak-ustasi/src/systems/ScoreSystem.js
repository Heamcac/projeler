export default class ScoreSystem {
  constructor(focusBonus = 1) {
    this.score = 0;
    this.focusBonus = focusBonus;
  }

  addDefense(combo) {
    const comboBonus = Math.max(0, combo - 1) * 6;
    const gained = Math.round((40 + comboBonus) * this.focusBonus);
    this.score += gained;
    return gained;
  }

  addCounter() {
    this.score += 150;
    return 150;
  }
}
