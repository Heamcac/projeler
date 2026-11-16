import Phaser from 'phaser';

export default class GoalZone extends Phaser.GameObjects.Zone {
  constructor(scene, x, y, width, height, teamToScore, color) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.teamToScore = teamToScore;

    const ring = scene.add.ellipse(x, y, width, height, color, 0.18)
      .setStrokeStyle(5, color, 0.85)
      .setDepth(1);
    const posts = scene.add.rectangle(x, y, width * 0.62, 16, 0x7a5638, 0.72)
      .setDepth(2);
    this.visuals = [ring, posts];
  }

  destroy(fromScene) {
    this.visuals?.forEach((item) => item.destroy());
    super.destroy(fromScene);
  }
}
