export default class ScoreSystem {
  constructor() {
    this.score = 0;
    this.comboThisShot = 0;
  }

  beginShot() {
    this.comboThisShot = 0;
  }

  targetHit() {
    this.comboThisShot += 1;
    const comboBonus = Math.max(0, this.comboThisShot - 1) * 5;
    this.score += 10 + comboBonus;
    return 10 + comboBonus;
  }

  targetOut() {
    this.comboThisShot += 1;
    const comboBonus = Math.max(0, this.comboThisShot - 1) * 5;
    this.score += 25 + comboBonus;
    return 25 + comboBonus;
  }

  addShotBonus(shotsLeft) {
    const bonus = shotsLeft * 15;
    this.score += bonus;
    return bonus;
  }

  calculateStars(level, shotsLeft) {
    if (this.score >= 125 + level * 8 || shotsLeft >= 2) return 3;
    if (this.score >= 70 + level * 5 || shotsLeft >= 1) return 2;
    return 1;
  }
}
