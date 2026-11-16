import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  createTextures() {
    this.makeStoneTexture('player-stone', 52, ['#f0d9ad', '#9d6b3e', '#51331e'], '#fff3d0');
    this.makeStoneTexture('target-stone', 48, ['#8f8b7d', '#5a554a', '#28251f'], '#d1cab4');
    this.makeStoneTexture('target-heavy', 54, ['#72665b', '#423a32', '#1c1815'], '#b6a28e');
    this.makeWoodTexture();
    this.makeDirtTexture();
  }

  makeStoneTexture(key, size, colors, shine) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const r = size / 2;
    g.fillStyle(Phaser.Display.Color.HexStringToColor(colors[2]).color, 1);
    g.fillCircle(r, r + 2, r - 2);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(colors[1]).color, 1);
    g.fillEllipse(r, r, size - 7, size - 12);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(colors[0]).color, 0.78);
    g.fillEllipse(r - 4, r - 5, size * 0.48, size * 0.28);
    g.lineStyle(3, Phaser.Display.Color.HexStringToColor(colors[2]).color, 0.65);
    g.strokeEllipse(r, r, size - 7, size - 12);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(shine).color, 0.75);
    g.fillCircle(r - 8, r - 9, 4);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  makeWoodTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x7a4e27, 1);
    g.fillRoundedRect(0, 0, 260, 36, 6);
    g.fillStyle(0xb06c32, 0.75);
    for (let y = 7; y < 34; y += 8) g.fillRect(10, y, 240, 2);
    g.fillStyle(0x432817, 0.55);
    g.fillCircle(48, 18, 6);
    g.fillCircle(188, 17, 5);
    g.generateTexture('wood-plank', 260, 36);
    g.destroy();
  }

  makeDirtTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8f6a3b, 1);
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 90; i += 1) {
      const color = Phaser.Math.RND.pick([0x6f4f2b, 0xa97d46, 0xc29559, 0x5b4128]);
      g.fillStyle(color, Phaser.Math.FloatBetween(0.15, 0.45));
      g.fillCircle(Phaser.Math.Between(0, 128), Phaser.Math.Between(0, 128), Phaser.Math.Between(1, 3));
    }
    g.generateTexture('dirt-tile', 128, 128);
    g.destroy();
  }
}
