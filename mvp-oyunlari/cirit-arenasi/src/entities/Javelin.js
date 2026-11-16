export default class Javelin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, owner, color = 0xd9c285) {
    super(scene, x, y, 'javelin');
    this.owner = owner;
    this.travel = 0;
    this.hasHit = false;
    this.startX = x;
    this.startY = y;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setTint(color);
    this.setDisplaySize(68, 8);
    this.body.setSize(60, 8);
  }

  launch(angle, speed) {
    this.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.travel = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
    if (this.travel > 920) this.destroy();
  }
}
