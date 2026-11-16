import Arena from '../entities/Arena.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Javelin from '../entities/Javelin.js';
import EnemyAI from '../ai/EnemyAI.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import StorageSystem from '../systems/StorageSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.save = StorageSystem.load();
    this.stats = UpgradeSystem.getStats(this.save);
    this.matchDuration = 60;
    this.remaining = this.matchDuration;
    this.matchOver = false;
    this.power = 0;
    this.charging = false;
    this.aimAngle = 0;
    this.mobileMove = 0;
    this.javelins = this.physics.add.group({ classType: Javelin, runChildUpdate: true });

    new Arena(this).create();
    this.player = new Player(this, 290, 470, this.stats);
    this.enemy = new Enemy(this, 980, 360);
    this.score = new ScoreSystem(this, this.stats.scoreBonus);
    this.ai = new EnemyAI(this, this.enemy, this.player, 1 + this.save.ciritSeviyesi * 0.2);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE');
    this.createHud();
    this.createTouchZones();
    this.createInput();
    this.createCollisions();
    this.createPauseControls();

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.matchOver) return;
        this.remaining -= 1;
        if (this.remaining <= 0) this.finishMatch();
      }
    });
  }

  createHud() {
    this.hudBg = this.add.rectangle(640, 38, 1280, 76, 0x21170f, 0.78);
    this.scoreText = this.add.text(26, 17, '', { fontSize: 24, color: '#ffe7ac' });
    this.timeText = this.add.text(640, 17, '', { fontSize: 28, color: '#ffffff' }).setOrigin(0.5, 0);
    this.comboText = this.add.text(1180, 17, '', { fontSize: 24, color: '#ffe7ac' }).setOrigin(1, 0);
    this.statusText = this.add.text(640, 82, 'Maç başladı', {
      fontSize: 24,
      color: '#fff0c8',
      stroke: '#321d10',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.powerBack = this.add.rectangle(640, 676, 280, 18, 0x28180d).setStrokeStyle(2, 0xd1a054);
    this.powerFill = this.add.rectangle(502, 676, 0, 12, 0xffd36c).setOrigin(0, 0.5);
    this.mobileHint = this.add.text(640, 706, 'Sol: hareket   Sağ: nişan ve atış', {
      fontSize: 16,
      color: '#f5d8a2'
    }).setOrigin(0.5).setAlpha(this.sys.game.device.input.touch ? 1 : 0);
    this.updateHud();
  }

  createTouchZones() {
    this.leftZone = this.add.zone(0, 0, 640, 720).setOrigin(0).setInteractive();
    this.rightZone = this.add.zone(640, 0, 640, 720).setOrigin(0).setInteractive();
    this.leftZone.on('pointerdown', (p) => this.setMobileMove(p));
    this.leftZone.on('pointermove', (p) => this.setMobileMove(p));
    this.leftZone.on('pointerup', () => { this.mobileMove = 0; });
  }

  createInput() {
    this.rightZone.on('pointerdown', (pointer) => {
      this.swipeStart = { x: pointer.x, y: pointer.y };
      this.beginCharge(pointer);
    });
    this.rightZone.on('pointermove', (pointer) => this.updateAim(pointer));
    this.rightZone.on('pointerup', (pointer) => {
      const dy = pointer.y - (this.swipeStart?.y || pointer.y);
      if (dy < -75) this.player.boost();
      if (dy > 75) this.player.brake();
      this.releaseThrow(pointer);
    });

    this.input.on('pointermove', (pointer) => this.updateAim(pointer));
    this.input.on('pointerdown', (pointer) => {
      if (pointer.x > 640 || !this.sys.game.device.input.touch) this.beginCharge(pointer);
    });
    this.input.on('pointerup', (pointer) => {
      if (this.charging) this.releaseThrow(pointer);
    });
  }

  createCollisions() {
    this.physics.add.overlap(this.javelins, this.enemy.target, (javelin) => {
      this.registerJavelinHit(javelin, 'enemy');
    });

    this.physics.add.overlap(this.javelins, this.player.target, (javelin) => {
      this.registerJavelinHit(javelin, 'player');
    });
  }

  createPauseControls() {
    this.isPausedByKey = false;
    this.pauseOverlay = this.add.container(640, 360).setDepth(200).setVisible(false);
    const bg = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.58);
    const title = this.add.text(0, -24, 'Duraklatıldı', {
      fontSize: 42,
      color: '#fff2b4',
      stroke: '#2d1709',
      strokeThickness: 6
    }).setOrigin(0.5);
    const hint = this.add.text(0, 34, 'Devam etmek için Esc veya P', {
      fontSize: 22,
      color: '#ffe7ac'
    }).setOrigin(0.5);
    this.pauseOverlay.add([bg, title, hint]);

    this.pauseKeyHandler = (event) => {
      if (event.key !== 'Escape' && event.key.toLowerCase() !== 'p') return;
      event.preventDefault();
      this.togglePause();
    };
    window.addEventListener('keydown', this.pauseKeyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.pauseKeyHandler));
  }

  togglePause() {
    if (this.matchOver) return;
    this.isPausedByKey = !this.isPausedByKey;
    this.pauseOverlay.setVisible(this.isPausedByKey);
    if (this.isPausedByKey) {
      this.scene.pause();
    } else {
      this.scene.resume();
    }
  }

  update(time, delta) {
    if (this.matchOver) return;
    const moveX = this.getMoveX();
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.player.boost();
    this.player.update(moveX, this.aimAngle);

    if (this.ai.update(true)) this.enemyThrow();
    this.checkJavelinHits();
    this.checkDodges();

    if (this.charging) {
      this.power = Phaser.Math.Clamp(this.power + delta / 850, 0, 1);
      this.powerFill.width = 276 * this.power;
    }

    this.updateHud();
  }

  getMoveX() {
    let move = this.mobileMove;
    if (this.cursors.left.isDown || this.keys.A.isDown) move -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) move += 1;
    return Phaser.Math.Clamp(move, -1, 1);
  }

  setMobileMove(pointer) {
    this.mobileMove = pointer.x < 250 ? -1 : pointer.x > 390 ? 1 : 0;
  }

  updateAim(pointer) {
    this.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 35, pointer.x, pointer.y);
  }

  beginCharge(pointer) {
    if (this.matchOver) return;
    this.updateAim(pointer);
    this.charging = true;
    this.power = 0.12;
  }

  releaseThrow(pointer) {
    if (!this.charging || this.matchOver) return;
    this.updateAim(pointer);
    const speed = this.stats.javelinSpeed * (0.45 + this.power);
    this.throwJavelin(this.player.x, this.player.y - 38, this.aimAngle, speed, 'player', 0xf5d28b);
    this.charging = false;
    this.power = 0;
    this.powerFill.width = 0;
    this.time.delayedCall(950, () => {
      const activePlayerJavelin = this.javelins.getChildren().some((j) => j.active && j.owner === 'player');
      if (!activePlayerJavelin) return;
      this.score.resetCombo();
      this.updateHud();
    });
  }

  enemyThrow() {
    const angle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y - 35, this.player.x, this.player.y - 30);
    this.throwJavelin(this.enemy.x, this.enemy.y - 38, angle, 575, 'enemy', 0xc78a45);
  }

  throwJavelin(x, y, angle, speed, owner, tint) {
    const javelin = new Javelin(this, x, y, owner, tint);
    this.javelins.add(javelin);
    javelin.launch(angle, speed);
  }

  checkJavelinHits() {
    for (const javelin of this.javelins.getChildren()) {
      if (!javelin.active || javelin.hasHit || javelin.travel < 80) continue;

      if (javelin.owner === 'player') {
        const distance = Phaser.Math.Distance.Between(javelin.x, javelin.y, this.enemy.x, this.enemy.y - 18);
        if (distance <= 82) this.registerJavelinHit(javelin, 'enemy');
        continue;
      }

      if (javelin.owner === 'enemy') {
        const distance = Phaser.Math.Distance.Between(javelin.x, javelin.y, this.player.x, this.player.y - 18);
        if (distance <= 82) this.registerJavelinHit(javelin, 'player');
      }
    }
  }

  registerJavelinHit(javelin, target) {
    if (!javelin.active || javelin.hasHit || javelin.travel < 80) return;
    if (target === 'enemy' && javelin.owner !== 'player') return;
    if (target === 'player' && javelin.owner !== 'enemy') return;

    javelin.hasHit = true;

    if (target === 'enemy') {
      const result = this.score.scoreHit(javelin.travel, true);
      this.flashText(`+${result.points} ${result.label}`, this.enemy.x, this.enemy.y - 80);
    } else {
      const result = this.score.scoreHit(javelin.travel, false);
      const loss = Math.round(8 * (1 - this.stats.armorReduction));
      this.score.playerScore = Math.max(0, this.score.playerScore - loss);
      this.score.resetCombo();
      this.flashText(`Rakip +${result.points}  Sen -${loss}`, this.player.x, this.player.y - 85);
    }

    javelin.destroy();
    this.updateHud();
  }

  checkDodges() {
    for (const javelin of this.javelins.getChildren()) {
      if (!javelin.active || javelin.owner !== 'enemy') continue;
      const d = Phaser.Math.Distance.Between(javelin.x, javelin.y, this.player.x, this.player.y - 18);
      if (d < 95 && javelin.travel > 120) {
        this.score.markDodge();
      }
    }
  }

  flashText(label, x, y) {
    const text = this.add.text(x, y, label, {
      fontSize: 28,
      color: '#fff2b4',
      stroke: '#2d1709',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.tweens.add({
      targets: text,
      y: y - 45,
      alpha: 0,
      duration: 900,
      onComplete: () => text.destroy()
    });
    this.statusText.setText(label);
  }

  updateHud() {
    this.scoreText.setText(`Sen: ${this.score.playerScore}  Rakip: ${this.score.enemyScore}`);
    this.timeText.setText(`Süre ${this.remaining}`);
    this.comboText.setText(`Combo x${this.score.combo}`);
  }

  finishMatch() {
    this.matchOver = true;
    const playerScore = this.score.playerScore;
    const enemyScore = this.score.enemyScore;
    const goldEarned = Math.max(20, Math.floor(playerScore / 10) + (playerScore >= enemyScore ? 50 : 15));
    StorageSystem.update((save) => ({
      ...save,
      altin: save.altin + goldEarned,
      toplamSkor: save.toplamSkor + playerScore,
      enYuksekSkor: Math.max(save.enYuksekSkor, playerScore)
    }));
    this.scene.start('ResultScene', { playerScore, enemyScore, goldEarned });
  }
}
