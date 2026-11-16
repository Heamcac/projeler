import Phaser from 'phaser';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data) {
    const { width, height } = this.scale;
    const won = data?.won;
    this.add.rectangle(0, 0, width, height, won ? 0x2f5f46 : 0x573637).setOrigin(0);
    this.add.text(width / 2, height * 0.25, won ? 'Galibiyet!' : 'Mağlubiyet', {
      fontSize: `${Math.min(54, width * 0.1)}px`,
      color: '#fff4cf',
      stroke: '#202820',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.38, `Skor: ${data?.blue ?? 0} - ${data?.red ?? 0}\nKazanılan altın: ${data?.gold ?? 0}`, {
      fontSize: '24px',
      color: '#fff8dc',
      align: 'center'
    }).setOrigin(0.5);
    this.button(width / 2, height * 0.58, 'Tekrar Oyna', () => this.scene.start('MatchScene'));
    this.button(width / 2, height * 0.69, 'Menü', () => this.scene.start('MenuScene'));
  }

  button(x, y, label, onClick) {
    const bg = this.add.rectangle(x, y, 230, 52, 0x243522, 0.95).setStrokeStyle(3, 0xf5d06f);
    this.add.text(x, y, label, { fontSize: '21px', color: '#fff8dc' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  }
}
