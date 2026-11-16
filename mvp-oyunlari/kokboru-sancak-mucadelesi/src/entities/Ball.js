import Phaser from 'phaser';

export default class Ball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ball');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.carrier = null;
    this.setDepth(5);
    this.setBounce(0.35);
    this.setDrag(0.94);
    this.body.setCircle(14, 4, 4);
  }

  isFree() {
    return !this.carrier;
  }

  attachTo(rider) {
    this.carrier = rider;
    rider.hasBall = true;
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  drop(offsetX = 0, offsetY = 0) {
    if (this.carrier) this.carrier.hasBall = false;
    const oldCarrier = this.carrier;
    this.carrier = null;
    this.body.enable = true;
    if (oldCarrier) this.setPosition(oldCarrier.x + offsetX, oldCarrier.y + offsetY);
  }

  passToward(angle, distance) {
    this.drop(Math.cos(angle) * 28, Math.sin(angle) * 28);
    this.scene.physics.velocityFromRotation(angle, distance * 2.35, this.body.velocity);
  }

  resetTo(x, y) {
    this.drop();
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.carrier) {
      const angle = this.carrier.rotation;
      this.setPosition(this.carrier.x + Math.cos(angle) * 24, this.carrier.y + Math.sin(angle) * 24);
    }
  }
}
