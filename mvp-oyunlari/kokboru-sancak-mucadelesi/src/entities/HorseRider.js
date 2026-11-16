import Phaser from 'phaser';

export default class HorseRider extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, options = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = options.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    this.teamId = options.teamId ?? 'blue';
    this.isPlayer = Boolean(options.isPlayer);
    this.baseSpeed = options.speed ?? 245;
    this.carrySlowdown = options.carrySlowdown ?? 0.78;
    this.tackleChance = options.tackleChance ?? 0.32;
    this.passDistance = options.passDistance ?? 300;
    this.hasBall = false;
    this.boostEnergy = 100;
    this.boosting = false;
    this.tackleCooldown = 0;

    this.setDepth(4);
    this.setDamping(true);
    this.setDrag(0.88);
    this.setMaxVelocity(this.baseSpeed * 1.8);
    this.body.setCircle(18, 7, 7);

    this.marker = scene.add.triangle(x, y - 36, 0, 12, 10, 0, 20, 12, 0xf5d06f).setDepth(7).setVisible(false);
    this.nameTag = scene.add.text(x, y + 30, options.label ?? '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#fff8dc',
      stroke: '#243522',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(7);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.marker.setPosition(this.x, this.y - 38).setVisible(this.hasBall);
    this.nameTag.setPosition(this.x, this.y + 31);
    this.tackleCooldown = Math.max(0, this.tackleCooldown - delta);
    if (!this.boosting) this.boostEnergy = Math.min(100, this.boostEnergy + delta * 0.018);
  }

  moveVector(vector, delta, boost = false) {
    const len = vector.length();
    if (len <= 0.01) {
      this.setAcceleration(0);
      return;
    }

    vector.normalize();
    const carryFactor = this.hasBall ? this.carrySlowdown : 1;
    const canBoost = boost && this.boostEnergy > 3;
    const boostFactor = canBoost ? 1.55 : 1;
    this.boosting = canBoost;
    if (canBoost) this.boostEnergy = Math.max(0, this.boostEnergy - delta * 0.055);

    const speed = this.baseSpeed * carryFactor * boostFactor;
    this.setVelocity(vector.x * speed, vector.y * speed);
    this.setRotation(Phaser.Math.Angle.RotateTo(this.rotation, vector.angle(), 0.18));
  }

  facePoint(x, y) {
    this.setRotation(Phaser.Math.Angle.Between(this.x, this.y, x, y));
  }

  canTackle() {
    return this.tackleCooldown <= 0;
  }

  markTackle() {
    this.tackleCooldown = 700;
  }

  destroy(fromScene) {
    this.marker?.destroy();
    this.nameTag?.destroy();
    super.destroy(fromScene);
  }
}
