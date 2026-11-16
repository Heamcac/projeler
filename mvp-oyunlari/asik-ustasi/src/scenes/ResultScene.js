import StorageSystem from '../classes/StorageSystem.js';
import { drawBackdrop, makeButton } from './MenuScene.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = data;
  }

  create() {
    drawBackdrop(this);
    const won = this.result?.won;
    this.add.text(270, 128, won ? 'Bölüm Tamam!' : 'Atışlar Bitti', {
      fontSize: '42px',
      color: '#fff0cf',
      fontStyle: '700'
    }).setOrigin(0.5);

    const stars = won ? '★'.repeat(this.result.stars) + '☆'.repeat(3 - this.result.stars) : '☆☆☆';
    this.add.text(270, 220, stars, { fontSize: '62px', color: '#ffd66b' }).setOrigin(0.5);
    this.add.text(270, 315, `Skor: ${this.result.score}`, { fontSize: '30px', color: '#fff4d5' }).setOrigin(0.5);
    this.add.text(270, 365, `Kazanılan altın: ${this.result.gold}`, { fontSize: '24px', color: '#ffe3a0' }).setOrigin(0.5);

    const save = StorageSystem.load();
    const nextLevel = Math.min((this.result.level || 1) + 1, 15);
    makeButton(this, 270, 500, 300, 62, won && this.result.level < 15 ? 'Sonraki Bölüm' : 'Tekrar Oyna', () => {
      this.scene.start('GameScene', { level: won && this.result.level < 15 ? nextLevel : this.result.level });
    });
    makeButton(this, 270, 580, 300, 62, 'Bölüm Seç', () => this.scene.start('LevelSelectScene'));
    makeButton(this, 270, 660, 300, 62, 'Geliştirmeler', () => this.scene.start('UpgradeScene'));
    this.add.text(270, 770, `Toplam altın: ${save.altin}`, { fontSize: '20px', color: '#d7bf95' }).setOrigin(0.5);
  }
}
