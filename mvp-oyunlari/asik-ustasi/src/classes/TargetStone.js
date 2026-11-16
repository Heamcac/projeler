export default class TargetStone {
  constructor(scene, config) {
    this.scene = scene;
    this.radius = config.mass > 1.8 ? 25 : 22;
    this.scoredHit = false;
    this.scoredOut = false;
    this.sprite = scene.matter.add.image(config.x, config.y, config.mass > 1.5 ? 'target-heavy' : 'target-stone');
    this.sprite.setCircle(this.radius);
    this.sprite.setFriction(0.08);
    this.sprite.setFrictionAir(0.05);
    this.sprite.setBounce(0.45);
    this.sprite.setMass(config.mass);
    this.sprite.setDepth(7);
    this.sprite.setData('kind', 'target');
    this.sprite.setData('owner', this);
  }

  markHit() {
    if (this.scoredHit) return false;
    this.scoredHit = true;
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.12,
      yoyo: true,
      duration: 90
    });
    return true;
  }

  isOutOfArena(bounds) {
    const { x, y } = this.sprite;
    return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
  }

  destroy() {
    this.sprite.destroy();
  }
}
