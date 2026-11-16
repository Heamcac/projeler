export default class Horse {
  constructor(scene, x, y, color = 0x7a4a2b) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.body = scene.add.ellipse(0, 8, 76, 30, color);
    this.neck = scene.add.ellipse(34, -4, 20, 38, color);
    this.head = scene.add.ellipse(48, -22, 28, 18, color);
    this.legs = [
      scene.add.rectangle(-24, 28, 8, 30, 0x2a1b12),
      scene.add.rectangle(-4, 29, 8, 31, 0x2a1b12),
      scene.add.rectangle(18, 28, 8, 30, 0x2a1b12),
      scene.add.rectangle(34, 27, 8, 28, 0x2a1b12)
    ];
    this.container.add([this.body, this.neck, this.head, ...this.legs]);
  }

  setFacing(direction) {
    this.container.setScale(direction < 0 ? -1 : 1, 1);
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
  }

  destroy() {
    this.container.destroy();
  }
}
