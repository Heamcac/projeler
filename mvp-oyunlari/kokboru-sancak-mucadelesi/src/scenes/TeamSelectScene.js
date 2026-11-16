import Phaser from 'phaser';
import { TEAMS } from '../config.js';
import StorageSystem from '../systems/StorageSystem.js';

export default class TeamSelectScene extends Phaser.Scene {
  constructor() {
    super('TeamSelectScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x314c36).setOrigin(0);
    this.add.text(width / 2, 56, 'Takım Seç', { fontSize: '34px', color: '#fff4cf' }).setOrigin(0.5);

    const cardW = Math.min(330, width - 36);
    TEAMS.forEach((team, index) => {
      const x = width / 2;
      const y = 135 + index * 92;
      const alpha = team.unlocked ? 0.98 : 0.48;
      const bg = this.add.rectangle(x, y, cardW, 72, team.primary, alpha).setStrokeStyle(3, team.secondary);
      this.add.circle(x - cardW / 2 + 38, y, 18, team.secondary, alpha);
      this.add.text(x - cardW / 2 + 74, y - 12, team.name, { fontSize: '20px', color: '#fff8dc' });
      this.add.text(x - cardW / 2 + 74, y + 13, team.unlocked ? 'Aktif' : 'Kilitli', { fontSize: '14px', color: '#f5d06f' });
      if (team.unlocked) {
        bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          StorageSystem.update((save) => { save.aktifTakim = team.id; });
          this.scene.start('MatchScene', { teamId: team.id });
        });
      }
    });

    this.add.text(width / 2, height - 34, 'Menüye dön', { fontSize: '18px', color: '#fff8dc' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
