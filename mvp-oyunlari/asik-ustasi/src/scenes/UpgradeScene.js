import StorageSystem from '../classes/StorageSystem.js';
import UpgradeSystem from '../classes/UpgradeSystem.js';
import { drawBackdrop, makeButton } from './MenuScene.js';

const upgrades = [
  { key: 'gucSeviyesi', title: 'Güç', desc: 'Daha sert atış' },
  { key: 'kontrolSeviyesi', title: 'Kontrol', desc: 'Daha uzun nişan çizgisi' },
  { key: 'sansSeviyesi', title: 'Şans', desc: 'Bölüm sonu altın bonusu' }
];

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  create() {
    this.render();
  }

  render() {
    this.children.removeAll();
    const save = StorageSystem.load();
    drawBackdrop(this);
    this.add.text(270, 74, 'Geliştirmeler', { fontSize: '38px', color: '#fff0cf', fontStyle: '700' }).setOrigin(0.5);
    this.add.text(270, 126, `Altın: ${save.altin}`, { fontSize: '24px', color: '#ffe6a6' }).setOrigin(0.5);

    upgrades.forEach((upgrade, index) => {
      const y = 245 + index * 160;
      const level = save[upgrade.key];
      this.add.rectangle(270, y, 430, 116, 0x3e2b1d, 0.84).setStrokeStyle(2, 0xd1a05b, 0.65);
      this.add.text(88, y - 30, `${upgrade.title}  ${level}/${UpgradeSystem.maxLevel}`, {
        fontSize: '25px',
        color: '#fff0cf',
        fontStyle: '700'
      });
      this.add.text(88, y + 6, upgrade.desc, { fontSize: '18px', color: '#dac29a' });
      const maxed = level >= UpgradeSystem.maxLevel;
      const cost = maxed ? 0 : UpgradeSystem.getCost(upgrade.key, level);
      makeButton(this, 374, y + 14, 154, 48, maxed ? 'Tam' : `${cost} altın`, () => {
        StorageSystem.update((data) => UpgradeSystem.buy(data, upgrade.key));
        this.render();
      }, !maxed && save.altin >= cost);
    });

    makeButton(this, 270, 825, 260, 58, 'Menü', () => this.scene.start('MenuScene'));
  }
}
