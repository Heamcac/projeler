export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const g = this.add.graphics();
    g.fillStyle(0xf1d89a, 1);
    g.fillRoundedRect(0, 2, 64, 6, 3);
    g.fillStyle(0x5c321d, 1);
    g.fillTriangle(64, 0, 76, 5, 64, 10);
    g.generateTexture('javelin', 76, 10);
    g.destroy();
    this.scene.start('MenuScene');
  }
}
