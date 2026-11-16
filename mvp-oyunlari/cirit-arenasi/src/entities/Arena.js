export default class Arena {
  constructor(scene) {
    this.scene = scene;
    this.bounds = new Phaser.Geom.Rectangle(80, 140, 1120, 500);
  }

  create() {
    const { scene } = this;
    scene.add.rectangle(640, 360, 1280, 720, 0xc89c58);
    scene.add.rectangle(640, 110, 1280, 220, 0x98a3a1);
    scene.add.triangle(250, 140, 0, 100, 220, 22, 460, 100, 0x6a705f).setAlpha(0.8);
    scene.add.triangle(610, 145, 0, 110, 270, 18, 540, 110, 0x737b68).setAlpha(0.85);
    scene.add.triangle(970, 138, 0, 105, 250, 8, 500, 105, 0x646d61).setAlpha(0.78);

    for (let i = 0; i < 18; i += 1) {
      const x = 90 + i * 65;
      const color = i % 2 ? 0x9e2f2d : 0x204f77;
      scene.add.rectangle(x, 151, 5, 68, 0x4a2d1b);
      scene.add.triangle(x + 17, 128, 0, 0, 38, 13, 0, 26, color);
    }

    for (const x of [130, 1060, 1140]) {
      scene.add.triangle(x, 200, 0, 46, 42, 0, 84, 46, 0xd8c0a0);
      scene.add.rectangle(x + 42, 222, 84, 34, 0x94612f);
    }

    scene.add.rectangle(640, 392, 1120, 500, 0xb27c39).setStrokeStyle(8, 0x4a2d1b);
    scene.add.rectangle(640, 392, 1010, 390, 0xc9944e).setAlpha(0.35).setStrokeStyle(2, 0x78522d);

    for (let i = 0; i < 55; i += 1) {
      scene.add.circle(
        Phaser.Math.Between(100, 1180),
        Phaser.Math.Between(175, 630),
        Phaser.Math.Between(1, 3),
        Phaser.Math.RND.pick([0x8c6132, 0xd8b06a, 0x6f4c2d])
      ).setAlpha(0.45);
    }
  }
}
