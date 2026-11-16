import Horse from './Horse.js';

export default class Player {
  constructor(scene, x, y, stats) {
    this.scene = scene;
    this.stats = stats;
    this.speed = stats.horseSpeed;
    this.boostingUntil = 0;
    this.facing = 1;
    this.horse = new Horse(scene, x, y, 0x8b552f);
    this.rider = scene.add.container(x, y - 25);
    this.sprite = scene.add.circle(0, -12, 14, 0x2b5d84).setStrokeStyle(3, 0xd7c29a);
    this.torso = scene.add.rectangle(0, 10, 24, 32, 0x345f87);
    this.aimLine = scene.add.rectangle(34, 5, 58, 5, 0xd9c285).setOrigin(0, 0.5);
    this.rider.add([this.torso, this.sprite, this.aimLine]);
    this.target = scene.add.zone(x, y - 14, 72, 64);
    scene.physics.add.existing(this.target);
    this.target.body.setAllowGravity(false);
  }

  get x() {
    return this.horse.container.x;
  }

  get y() {
    return this.horse.container.y;
  }

  boost() {
    this.boostingUntil = this.scene.time.now + this.stats.boostDuration;
  }

  brake() {
    this.boostingUntil = 0;
  }

  update(moveX, aimAngle) {
    const boost = this.scene.time.now < this.boostingUntil ? 1.65 : 1;
    const vx = moveX * this.speed * boost;
    const nx = Phaser.Math.Clamp(this.x + vx * this.scene.game.loop.delta / 1000, 110, 1170);
    const wave = Math.sin(this.scene.time.now / 360) * 58;
    const ny = Phaser.Math.Clamp(this.y + wave * 0.008, 250, 610);
    if (Math.abs(moveX) > 0.05) this.facing = Math.sign(moveX);
    this.horse.setFacing(this.facing);
    this.horse.setPosition(nx, ny);
    this.rider.setPosition(nx, ny - 25);
    this.rider.setRotation(Phaser.Math.Angle.Wrap(aimAngle) * 0.16);
    this.target.setPosition(nx, ny - 18);
  }
}
