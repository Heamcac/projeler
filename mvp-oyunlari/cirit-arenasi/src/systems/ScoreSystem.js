export default class ScoreSystem {
  constructor(scene, scoreBonus = 1) {
    this.scene = scene;
    this.scoreBonus = scoreBonus;
    this.playerScore = 0;
    this.enemyScore = 0;
    this.combo = 0;
    this.lastDodgeTime = 0;
  }

  markDodge() {
    this.lastDodgeTime = this.scene.time.now;
  }

  resetCombo() {
    this.combo = 0;
  }

  scoreHit(distance, isPlayer = true) {
    let base = 10;
    let label = 'İsabet!';
    if (distance > 520) {
      base = 50;
      label = 'Uzak Atış!';
    } else if (distance > 300) {
      base = 25;
      label = 'Temiz İsabet!';
    }

    if (isPlayer) {
      this.combo += 1;
      const counterBonus = this.scene.time.now - this.lastDodgeTime < 1800 ? 20 : 0;
      const comboBonus = Math.max(0, this.combo - 1) * 5;
      const points = Math.round((base + counterBonus + comboBonus) * this.scoreBonus);
      this.playerScore += points;
      return { points, label: counterBonus ? 'Usta Hamle!' : label };
    }

    this.enemyScore += base;
    return { points: base, label: 'Rakip İsabeti' };
  }
}
