import Horse from './Horse.js';

export default class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 165;
    this.facing = -1;
    this.horse = new Horse(scene, x, y, 0x4f3527);
    this.rider = scene.add.container(x, y - 25);
    this.head = scene.add.circle(0, -12, 14, 0x8f2f2a).setStrokeStyle(3, 0xc6a46a);
    this.torso = scene.add.rectangle(0, 10, 24, 32, 0x8f2f2a);
    this.lance = scene.add.rectangle(-52, 5, 58, 5, 0xd9c285).setOrigin(0, 0.5);
    this.rider.add([this.torso, this.head, this.lance]);
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

  setPosition(x, y) {
    this.horse.setPosition(x, y);
    this.rider.setPosition(x, y - 25);
    this.target.setPosition(x, y - 18);
  }

  updateFacing(playerX) {
    this.facing = playerX < this.x ? -1 : 1;
    this.horse.setFacing(this.facing);
    this.rider.setScale(this.facing, 1);
  }
}
