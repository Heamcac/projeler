export default class EnemyAI {
  constructor(scene, enemy, player, difficulty = 1) {
    this.scene = scene;
    this.enemy = enemy;
    this.player = player;
    this.difficulty = difficulty;
    this.nextThrowAt = 2500;
    this.laneTarget = enemy.y;
  }

  update(canThrow) {
    const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    const retreating = distance < 310;
    const desiredX = retreating
      ? Phaser.Math.Clamp(this.enemy.x + Math.sign(this.enemy.x - this.player.x) * 160, 120, 1160)
      : this.player.x + Math.sin(this.scene.time.now / 850) * 260;

    if (this.scene.time.now % 1100 < 18) {
      this.laneTarget = Phaser.Math.Between(260, 585);
    }

    const nx = Phaser.Math.Linear(this.enemy.x, desiredX, 0.012 + this.difficulty * 0.003);
    const ny = Phaser.Math.Linear(this.enemy.y, this.laneTarget, 0.018);
    this.enemy.setPosition(Phaser.Math.Clamp(nx, 120, 1160), Phaser.Math.Clamp(ny, 250, 610));
    this.enemy.updateFacing(this.player.x);

    if (canThrow && this.scene.time.now > this.nextThrowAt && distance < 760) {
      this.nextThrowAt = this.scene.time.now + Math.max(1200, 2600 - this.difficulty * 350);
      return true;
    }
    return false;
  }
}
