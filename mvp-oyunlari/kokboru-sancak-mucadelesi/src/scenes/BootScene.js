import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.createRiderTexture('rider-blue', 0x2f7d46, 0xf5d06f);
    this.createRiderTexture('rider-red', 0xb34434, 0xf0e1b0);
    this.createRiderTexture('rider-green', 0x4f8d5f, 0xe8d8a0);
    this.createBallTexture();
    this.scene.start('MenuScene');
  }

  createRiderTexture(key, primary, accent) {
    const g = this.add.graphics();
    g.fillStyle(0x7b5738, 1);
    g.fillEllipse(28, 32, 48, 24);
    g.fillStyle(0x3b2a1e, 1);
    g.fillCircle(12, 35, 5);
    g.fillCircle(44, 35, 5);
    g.fillStyle(primary, 1);
    g.fillCircle(30, 22, 13);
    g.fillStyle(accent, 1);
    g.fillTriangle(35, 14, 58, 8, 42, 24);
    g.lineStyle(3, 0x1e211b, 1);
    g.strokeEllipse(28, 32, 48, 24);
    g.generateTexture(key, 64, 56);
    g.destroy();
  }

  createBallTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xd8c07a, 1);
    g.fillCircle(18, 18, 15);
    g.lineStyle(3, 0x8a5b2e, 1);
    g.strokeCircle(18, 18, 15);
    g.fillStyle(0xb34434, 1);
    g.fillTriangle(18, 4, 31, 18, 18, 14);
    g.lineStyle(2, 0xf4e1aa, 1);
    g.beginPath();
    g.arc(18, 18, 9, 0.3, 2.8);
    g.strokePath();
    g.generateTexture('ball', 36, 36);
    g.destroy();
  }
}
