import Phaser from 'phaser';
import LevelManager from '../classes/LevelManager.js';
import PhysicsManager from '../classes/PhysicsManager.js';
import PlayerStone from '../classes/PlayerStone.js';
import TargetStone from '../classes/TargetStone.js';
import ScoreSystem from '../classes/ScoreSystem.js';
import StorageSystem from '../classes/StorageSystem.js';
import UpgradeSystem from '../classes/UpgradeSystem.js';
import { makeButton } from './MenuScene.js';

const ARENA = { left: 44, right: 496, top: 142, bottom: 738 };
const CLEAN_ZONE = { left: 74, right: 466, top: 172, bottom: 666 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelNumber = data.level || 1;
  }

  create() {
    this.save = StorageSystem.load();
    this.level = LevelManager.getLevel(this.levelNumber);
    this.scoreSystem = new ScoreSystem();
    this.shotsLeft = this.level.shots;
    this.targets = [];
    this.obstacles = [];
    this.readyToAim = true;
    this.shotInProgress = false;
    this.dragging = false;
    this.finishQueued = false;

    this.drawArena();
    this.physicsManager = new PhysicsManager(this, ARENA);
    this.physicsManager.createArena();
    this.level.obstacles.forEach((obstacle) => this.obstacles.push(this.physicsManager.createObstacle(obstacle)));
    this.level.targets.forEach((target) => this.targets.push(new TargetStone(this, target)));

    this.player = new PlayerStone(this, 270, 704);
    this.player.reset();
    this.createHud();
    this.createAimGraphics();
    this.createPauseControls();
    this.registerInput();
    this.registerCollisions();
  }

  drawArena() {
    this.add.tileSprite(270, 480, 540, 960, 'dirt-tile');
    this.add.rectangle(270, 440, ARENA.right - ARENA.left + 34, ARENA.bottom - ARENA.top + 34, 0x4a2f1b, 1)
      .setStrokeStyle(5, 0x21140b);
    this.add.tileSprite(270, 440, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 'dirt-tile').setAlpha(0.93);
    this.add.rectangle(270, 419, CLEAN_ZONE.right - CLEAN_ZONE.left, CLEAN_ZONE.bottom - CLEAN_ZONE.top, 0x000000, 0)
      .setStrokeStyle(2, 0xf6d388, 0.32);
    this.add.text(270, 122, 'TEMİZLEME ALANI', { fontSize: '14px', color: '#d8b878' }).setOrigin(0.5);

    const rails = [
      [270, ARENA.top - 17, 470, 34, 0],
      [270, ARENA.bottom + 17, 470, 34, 0],
      [ARENA.left - 17, 440, 34, 630, 0],
      [ARENA.right + 17, 440, 34, 630, 0]
    ];
    rails.forEach(([x, y, w, h]) => this.add.rectangle(x, y, w, h, 0x6d4323).setStrokeStyle(2, 0x2c190d));
  }

  createHud() {
    this.hud = {
      level: this.add.text(30, 28, `Bölüm ${this.levelNumber}`, { fontSize: '24px', color: '#fff0cf', fontStyle: '700' }),
      shots: this.add.text(30, 64, `Atış: ${this.shotsLeft}`, { fontSize: '21px', color: '#ffe0a3' }),
      score: this.add.text(360, 28, 'Skor: 0', { fontSize: '22px', color: '#fff0cf', fontStyle: '700' }),
      state: this.add.text(270, 794, 'Taşı geri çek', { fontSize: '22px', color: '#fff0cf' }).setOrigin(0.5)
    };
    makeButton(this, 450, 850, 116, 48, 'Menü', () => this.scene.start('MenuScene'));
  }

  createAimGraphics() {
    this.aimLine = this.add.graphics().setDepth(20);
    this.powerText = this.add.text(270, 756, '', { fontSize: '18px', color: '#ffe2a7' }).setOrigin(0.5).setDepth(20);
  }

  createPauseControls() {
    this.isPausedByKey = false;
    this.pauseOverlay = this.add.container(270, 480).setDepth(200).setVisible(false);
    const bg = this.add.rectangle(0, 0, 540, 960, 0x000000, 0.58);
    const title = this.add.text(0, -26, 'Duraklatıldı', {
      fontSize: '38px',
      color: '#fff0cf',
      stroke: '#3d2514',
      strokeThickness: 6,
      fontStyle: '700'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 30, 'Devam etmek için Esc veya P', {
      fontSize: '19px',
      color: '#ffe2a7'
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
    if (this.finishQueued) return;
    this.isPausedByKey = !this.isPausedByKey;
    this.pauseOverlay.setVisible(this.isPausedByKey);
    if (this.isPausedByKey) this.scene.pause();
    else this.scene.resume();
  }

  registerInput() {
    this.input.on('pointerdown', (pointer) => {
      if (!this.readyToAim || this.shotsLeft <= 0) return;
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.player.sprite.x, this.player.sprite.y) > 72) return;
      this.dragging = true;
      this.scoreSystem.beginShot();
      this.hud.state.setText('Bırakınca fırlat');
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragging) return;
      const maxPull = 92;
      const pull = new Phaser.Math.Vector2(pointer.x - this.player.spawn.x, pointer.y - this.player.spawn.y);
      if (pull.length() > maxPull) pull.setLength(maxPull);
      this.player.sprite.setPosition(this.player.spawn.x + pull.x, this.player.spawn.y + pull.y);
      this.drawAim(pull);
    });

    this.input.on('pointerup', () => {
      if (!this.dragging) return;
      this.dragging = false;
      const pull = new Phaser.Math.Vector2(this.player.sprite.x - this.player.spawn.x, this.player.sprite.y - this.player.spawn.y);
      this.aimLine.clear();
      this.powerText.setText('');
      if (pull.length() < 14) {
        this.player.reset();
        this.hud.state.setText('Taşı geri çek');
        return;
      }
      this.readyToAim = false;
      this.shotInProgress = true;
      this.shotsLeft -= 1;
      this.refreshHud();
      const multiplier = 0.00095 * UpgradeSystem.getPowerMultiplier(this.save.gucSeviyesi);
      this.player.release({ x: -pull.x * multiplier, y: -pull.y * multiplier });
      this.hud.state.setText('Taşların durması bekleniyor');
    });
  }

  drawAim(pull) {
    const length = Math.min(UpgradeSystem.getAimLength(this.save.kontrolSeviyesi), pull.length() * 2.6);
    const dir = pull.clone().negate().normalize();
    const startX = this.player.sprite.x;
    const startY = this.player.sprite.y;
    this.aimLine.clear();
    this.aimLine.lineStyle(4, 0xffe0a1, 0.78);
    this.aimLine.beginPath();
    this.aimLine.moveTo(startX, startY);
    this.aimLine.lineTo(startX + dir.x * length, startY + dir.y * length);
    this.aimLine.strokePath();
    this.aimLine.fillStyle(0xffe0a1, 0.9);
    for (let i = 26; i < length; i += 26) {
      this.aimLine.fillCircle(startX + dir.x * i, startY + dir.y * i, 3);
    }
    this.powerText.setText(`Güç ${Math.round((pull.length() / 92) * 100)}%`);
  }

  registerCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach((pair) => {
        const a = pair.bodyA.gameObject;
        const b = pair.bodyB.gameObject;
        const targetObject = [a, b].find((body) => body?.getData?.('kind') === 'target');
        const playerObject = [a, b].find((body) => body?.getData?.('kind') === 'player');
        if (!targetObject || !playerObject) return;
        const target = targetObject.getData('owner');
        if (target?.markHit()) {
          const gained = this.scoreSystem.targetHit();
          this.floatScore(targetObject.x, targetObject.y - 30, `+${gained}`);
          this.refreshHud();
        }
      });
    });
  }

  update() {
    if (this.finishQueued) return;
    this.checkTargetsOut();
    if (!this.shotInProgress) return;
    const movingItems = [this.player, ...this.targets];
    if (!this.physicsManager.allBodiesSleepingOrSlow(movingItems)) return;
    this.shotInProgress = false;
    if (this.targets.length === 0) {
      this.finishLevel(true);
      return;
    }
    if (this.shotsLeft <= 0) {
      this.finishLevel(false);
      return;
    }
    this.time.delayedCall(260, () => {
      this.player.reset();
      this.readyToAim = true;
      this.hud.state.setText('Taşı geri çek');
    });
  }

  checkTargetsOut() {
    for (let i = this.targets.length - 1; i >= 0; i -= 1) {
      const target = this.targets[i];
      if (!target.scoredOut && target.isOutOfArena(CLEAN_ZONE)) {
        target.scoredOut = true;
        const gained = this.scoreSystem.targetOut();
        this.floatScore(target.sprite.x, target.sprite.y, `+${gained}`);
        this.targets.splice(i, 1);
        this.time.delayedCall(120, () => target.destroy());
        this.refreshHud();
      }
    }
  }

  floatScore(x, y, label) {
    const text = this.add.text(x, y, label, {
      fontSize: '24px',
      color: '#fff2ba',
      stroke: '#3d2514',
      strokeThickness: 4,
      fontStyle: '700'
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: text,
      y: y - 48,
      alpha: 0,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  refreshHud() {
    this.hud.shots.setText(`Atış: ${this.shotsLeft}`);
    this.hud.score.setText(`Skor: ${this.scoreSystem.score}`);
  }

  finishLevel(won) {
    this.finishQueued = true;
    this.readyToAim = false;
    const shotBonus = won ? this.scoreSystem.addShotBonus(this.shotsLeft) : 0;
    if (shotBonus > 0) this.floatScore(270, 205, `Kalan atış +${shotBonus}`);
    const stars = won ? this.scoreSystem.calculateStars(this.levelNumber, this.shotsLeft) : 0;
    const baseGold = won ? 40 + stars * 20 + this.levelNumber * 3 : 10;
    const luckGold = won ? UpgradeSystem.getLuckBonus(this.save.sansSeviyesi) : 0;
    const gold = baseGold + luckGold;
    StorageSystem.update((data) => {
      data.altin += gold;
      data.enYuksekSkor = Math.max(data.enYuksekSkor, this.scoreSystem.score);
      if (won) {
        data.tamamlananBolum = Math.max(data.tamamlananBolum, this.levelNumber);
        const old = data.levels[this.levelNumber] || { score: 0, stars: 0 };
        data.levels[this.levelNumber] = {
          score: Math.max(old.score, this.scoreSystem.score),
          stars: Math.max(old.stars, stars)
        };
      }
    });
    this.time.delayedCall(1050, () => {
      this.scene.start('ResultScene', {
        won,
        level: this.levelNumber,
        score: this.scoreSystem.score,
        stars,
        gold
      });
    });
  }
}
