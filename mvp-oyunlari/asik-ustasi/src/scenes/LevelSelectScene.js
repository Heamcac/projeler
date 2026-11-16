import Phaser from 'phaser';
import LevelManager from '../classes/LevelManager.js';
import StorageSystem from '../classes/StorageSystem.js';
import { drawBackdrop, makeButton } from './MenuScene.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const save = StorageSystem.load();
    drawBackdrop(this);
    this.add.text(270, 74, 'Bölüm Seç', { fontSize: '38px', color: '#fff0cf', fontStyle: '700' }).setOrigin(0.5);

    const startX = 105;
    const startY = 165;
    for (let i = 1; i <= LevelManager.totalLevels; i += 1) {
      const col = (i - 1) % 3;
      const row = Math.floor((i - 1) / 3);
      const x = startX + col * 165;
      const y = startY + row * 110;
      const unlocked = i <= save.tamamlananBolum + 1;
      const levelSave = save.levels?.[i];
      const label = unlocked ? `${i}\n${'★'.repeat(levelSave?.stars || 0)}` : `${i}\nKilit`;
      const button = makeButton(this, x, y, 118, 78, label, () => this.scene.start('GameScene', { level: i }), unlocked);
      button.text.setFontSize(unlocked ? 24 : 19);
      button.text.setLineSpacing(4);
    }

    makeButton(this, 270, 830, 260, 58, 'Menü', () => this.scene.start('MenuScene'));
  }
}
