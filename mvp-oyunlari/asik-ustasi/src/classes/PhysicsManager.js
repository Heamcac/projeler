export default class PhysicsManager {
  constructor(scene, bounds) {
    this.scene = scene;
    this.bounds = bounds;
    this.walls = [];
  }

  createArena() {
    const { left, right, top, bottom } = this.bounds;
    const thickness = 34;
    const wallStyle = { isStatic: true, restitution: 0.45, friction: 0.35 };
    this.walls.push(this.scene.matter.add.rectangle((left + right) / 2, top - thickness / 2, right - left, thickness, wallStyle));
    this.walls.push(this.scene.matter.add.rectangle((left + right) / 2, bottom + thickness / 2, right - left, thickness, wallStyle));
    this.walls.push(this.scene.matter.add.rectangle(left - thickness / 2, (top + bottom) / 2, thickness, bottom - top, wallStyle));
    this.walls.push(this.scene.matter.add.rectangle(right + thickness / 2, (top + bottom) / 2, thickness, bottom - top, wallStyle));
  }

  createObstacle(config) {
    const image = this.scene.matter.add.image(config.x, config.y, 'wood-plank', null, {
      isStatic: true,
      restitution: 0.35,
      friction: 0.55
    });
    image.setDisplaySize(config.w, config.h);
    image.setRectangle(config.w, config.h);
    image.setAngle(config.angle);
    image.setDepth(5);
    return image;
  }

  allBodiesSleepingOrSlow(items) {
    return items.every((item) => {
      const body = item.sprite.body;
      return Math.abs(body.velocity.x) + Math.abs(body.velocity.y) < 0.11 && Math.abs(body.angularVelocity) < 0.025;
    });
  }
}
