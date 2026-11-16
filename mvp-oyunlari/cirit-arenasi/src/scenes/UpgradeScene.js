import StorageSystem from '../systems/StorageSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';

const UPGRADES = [
  ['ciritSeviyesi', 'Cirit Seviyesi', 'Atış hızı ve puan bonusu'],
  ['atSeviyesi', 'At Seviyesi', 'Hareket ve hızlanma süresi'],
  ['zirhSeviyesi', 'Zırh Seviyesi', 'Rakip isabetinde puan kaybını azaltır']
];

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  create() {
    this.save = StorageSystem.load();
    this.render();
  }

  render(message = '') {
    this.children.removeAll();
    this.add.rectangle(640, 360, 1280, 720, 0x32241a);
    this.add.text(640, 74, 'Geliştirmeler', {
      fontSize: 56,
      color: '#f5d69a',
      fontFamily: 'Georgia, serif'
    }).setOrigin(0.5);
    this.add.text(640, 132, `Altın: ${this.save.altin}`, { fontSize: 28, color: '#fff1c7' }).setOrigin(0.5);

    UPGRADES.forEach(([key, title, desc], index) => {
      const y = 225 + index * 115;
      this.add.rectangle(640, y, 820, 86, 0x50331f).setStrokeStyle(3, 0xbe8c48);
      this.add.text(270, y - 24, `${title}: ${this.save[key]}`, { fontSize: 25, color: '#ffe2a7' });
      this.add.text(270, y + 12, desc, { fontSize: 19, color: '#f7d9b0' });
      const cost = UpgradeSystem.getCost(this.save[key]);
      this.button(900, y, `${cost} altın`, () => {
        const result = UpgradeSystem.tryUpgrade(this.save, key);
        this.save = result.save;
        StorageSystem.save(this.save);
        this.render(result.ok ? 'Geliştirme tamamlandı.' : 'Yeterli altın yok.');
      }, 180);
    });

    if (message) {
      this.add.text(640, 570, message, { fontSize: 24, color: '#ffe2a7' }).setOrigin(0.5);
    }
    this.button(640, 635, 'Menüye Dön', () => this.scene.start('MenuScene'), 260);
  }

  button(x, y, label, action, width = 220) {
    const bg = this.add.rectangle(x, y, width, 52, 0x6a3c22).setStrokeStyle(3, 0xd1a054);
    this.add.text(x, y, label, { fontSize: 22, color: '#ffe4ad' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', action);
  }
}
