import Phaser from 'phaser';
import StorageSystem from '../systems/StorageSystem.js';
import UpgradeSystem, { UPGRADE_DEFS } from '../systems/UpgradeSystem.js';

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  create() {
    this.render();
  }

  render(message = '') {
    this.children.removeAll();
    const { width, height } = this.scale;
    const save = StorageSystem.load();
    this.add.rectangle(0, 0, width, height, 0x263829).setOrigin(0);
    this.add.text(width / 2, 48, 'Geliştirmeler', { fontSize: '32px', color: '#fff4cf' }).setOrigin(0.5);
    this.add.text(width / 2, 86, `Altın: ${save.altin}`, { fontSize: '20px', color: '#f5d06f' }).setOrigin(0.5);

    UPGRADE_DEFS.forEach((def, index) => {
      const y = 145 + index * 92;
      const level = save[def.key];
      const maxed = level >= UpgradeSystem.maxLevel;
      const cost = UpgradeSystem.cost(level);
      this.add.rectangle(width / 2, y, Math.min(620, width - 28), 76, 0x365942, 0.92).setStrokeStyle(2, 0x8fb370);
      this.add.text(width / 2 - Math.min(290, width / 2 - 24), y - 22, `${def.label}  ${level}/${UpgradeSystem.maxLevel}`, {
        fontSize: '18px',
        color: '#fff8dc'
      }).setOrigin(0, 0.5);
      this.add.text(width / 2 - Math.min(290, width / 2 - 24), y + 7, def.description, {
        fontSize: '13px',
        color: '#e8dcc0',
        wordWrap: { width: Math.min(350, width - 190) }
      }).setOrigin(0, 0.5);
      const buy = this.add.rectangle(width / 2 + Math.min(230, width / 2 - 70), y, 96, 38, maxed ? 0x657163 : 0xb34434, 0.95);
      this.add.text(buy.x, y, maxed ? 'Tamam' : `${cost} altın`, { fontSize: '14px', color: '#fff8dc' }).setOrigin(0.5);
      if (!maxed) {
        buy.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          const data = StorageSystem.load();
          const result = UpgradeSystem.buy(data, def.key);
          StorageSystem.save(data);
          this.render(result.ok ? 'Geliştirme alındı.' : result.reason);
        });
      }
    });

    if (message) this.add.text(width / 2, height - 86, message, { fontSize: '16px', color: '#f5d06f' }).setOrigin(0.5);
    this.add.text(width / 2, height - 36, 'Menüye dön', { fontSize: '18px', color: '#fff8dc' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
