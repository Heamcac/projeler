import Phaser from 'phaser';

export default class PlayerStone {
  constructor(scene, x, y) {
    this.scene = scene;
    this.radius = 24;
    this.spawn = new Phaser.Math.Vector2(x, y);
    this.sprite = scene.matter.add.image(x, y, 'player-stone');
    this.sprite.setCircle(this.radius);
    this.sprite.setFriction(0.06);
    this.sprite.setFrictionAir(0.045);
    this.sprite.setBounce(0.55);
    this.sprite.setMass(1.2);
    this.sprite.setDepth(8);
    this.sprite.setData('kind', 'player');
  }

  reset() {
    this.sprite.setPosition(this.spawn.x, this.spawn.y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngularVelocity(0);
    this.sprite.setRotation(0);
    this.sprite.setStatic(true);
  }

  release(force) {
    this.sprite.setStatic(false);
    this.sprite.applyForce(force);
  }

  isNearlyStopped() {
    const body = this.sprite.body;
    return Math.abs(body.velocity.x) + Math.abs(body.velocity.y) < 0.08 && Math.abs(body.angularVelocity) < 0.02;
  }
}
