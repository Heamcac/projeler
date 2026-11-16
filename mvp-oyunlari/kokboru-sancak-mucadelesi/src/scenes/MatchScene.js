import Phaser from 'phaser';
import { TEAMS, WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';
import Ball from '../entities/Ball.js';
import GoalZone from '../entities/GoalZone.js';
import HorseRider from '../entities/HorseRider.js';
import Player from '../entities/Player.js';
import Team from '../entities/Team.js';
import BotAI from '../systems/BotAI.js';
import MatchSystem from '../systems/MatchSystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import StorageSystem from '../systems/StorageSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';

export default class MatchScene extends Phaser.Scene {
  constructor() {
    super('MatchScene');
  }

  init(data) {
    this.selectedTeamId = data?.teamId ?? StorageSystem.load().aktifTakim;
  }

  create() {
    this.worldCenter = new Phaser.Math.Vector2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.save = StorageSystem.load();
    this.stats = UpgradeSystem.playerStats(this.save);
    this.scoreSystem = new ScoreSystem();
    this.matchSystem = new MatchSystem(this, this.scoreSystem);
    this.bots = [];
    this.allRiders = [];
    this.inputState = { x: 0, y: 0, boost: false, pointer: null };
    this.mobileState = { active: false, pointerId: null, x: 0, y: 0, boost: false };

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawArena();
    this.createTeams();
    this.createActors();
    this.createHud();
    this.createControls();
    this.createMobileControls();
    this.createPauseControls();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(this.scale.width < 760 ? 0.72 : 0.86);

    this.physics.add.overlap(this.ball, this.enemyGoal, () => {
      if (this.ball.carrier?.teamId === 'blue') this.matchSystem.goal('blue');
    });
    this.physics.add.overlap(this.ball, this.playerGoal, () => {
      if (this.ball.carrier?.teamId === 'red') this.matchSystem.goal('red');
    });

    this.scale.on('resize', () => {
      this.layoutHud();
      this.layoutMobileControls();
      this.cameras.main.setZoom(this.scale.width < 760 ? 0.72 : 0.86);
    });
  }

  drawArena() {
    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x8fb370).setOrigin(0);
    for (let x = 0; x < WORLD_WIDTH; x += 130) {
      for (let y = 0; y < WORLD_HEIGHT; y += 110) {
        const color = (x + y) % 260 === 0 ? 0x7da463 : 0x98bb77;
        this.add.ellipse(x + 40, y + 30, 120, 32, color, 0.28).setAngle(Phaser.Math.Between(-15, 15));
      }
    }
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH - 170, WORLD_HEIGHT - 150, 0xffffff, 0)
      .setStrokeStyle(5, 0xe6d6a8, 0.82);
    this.add.line(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH / 2, 95, WORLD_WIDTH / 2, WORLD_HEIGHT - 95, 0xe6d6a8, 0.75)
      .setLineWidth(4);
    this.add.circle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 118, 0xffffff, 0).setStrokeStyle(4, 0xe6d6a8, 0.75);

    for (let i = 0; i < 6; i += 1) {
      this.add.rectangle(260 + i * 310, 70, 82, 38, 0x9b6740, 0.72).setAngle(Phaser.Math.Between(-4, 4));
      this.add.triangle(219 + i * 310, 48, 0, 35, 41, 0, 82, 35, i % 2 ? 0x2f7d46 : 0xb34434, 0.84);
    }
  }

  createTeams() {
    const selected = TEAMS.find((team) => team.id === this.selectedTeamId) ?? TEAMS[0];
    this.playerTeam = new Team({ id: 'blue', name: selected.name, color: selected.primary, goalX: WORLD_WIDTH - 92, spawnX: 390 });
    this.rivalTeam = new Team({ id: 'red', name: 'Rakip Toy Ekibi', color: 0xb34434, goalX: 92, spawnX: WORLD_WIDTH - 390 });
    this.playerGoal = new GoalZone(this, 92, WORLD_HEIGHT / 2, 148, 360, 'red', 0xb34434);
    this.enemyGoal = new GoalZone(this, WORLD_WIDTH - 92, WORLD_HEIGHT / 2, 148, 360, 'blue', 0x2f7d46);
  }

  createActors() {
    this.player = new Player(this, 360, WORLD_HEIGHT / 2, 'rider-blue', this.stats);
    this.playerTeam.add(this.player);
    this.allRiders.push(this.player);

    const friendSpawns = [[310, 420], [300, 780], [520, 600]];
    friendSpawns.forEach((spawn, index) => {
      const bot = new HorseRider(this, spawn[0], spawn[1], 'rider-green', {
        id: `ally-${index}`,
        teamId: 'blue',
        label: `Alp ${index + 1}`,
        speed: 235
      });
      this.playerTeam.add(bot);
      this.allRiders.push(bot);
    });

    const enemySpawns = [[1880, 420], [1880, 780], [1700, 600], [1760, 250]];
    enemySpawns.forEach((spawn, index) => {
      const bot = new HorseRider(this, spawn[0], spawn[1], 'rider-red', {
        id: `enemy-${index}`,
        teamId: 'red',
        label: `Rakip ${index + 1}`,
        speed: 232,
        tackleChance: 0.34
      });
      this.rivalTeam.add(bot);
      this.allRiders.push(bot);
    });

    this.ball = new Ball(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.allRiders.forEach((rider) => {
      if (!rider.isPlayer) this.bots.push(new BotAI(this, rider, this.ball, { role: rider.id.includes('1') ? 'wing' : 'support' }));
      this.physics.add.collider(rider, this.ball);
      this.physics.add.collider(rider, this.allRiders.filter((other) => other !== rider));
    });
  }

  createHud() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(50);
    this.scoreText = this.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#fff8dc',
      stroke: '#1e2a1f',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.infoText = this.add.text(0, 0, '', {
      fontSize: '15px',
      color: '#fff4cf',
      stroke: '#1e2a1f',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.hud.add([this.scoreText, this.infoText]);
    this.layoutHud();
  }

  layoutHud() {
    if (!this.scoreText) return;
    const width = this.scale.width;
    this.scoreText.setPosition(width / 2, 24);
    this.infoText.setPosition(width / 2, 52);
  }

  createControls() {
    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      left: 'A',
      down: 'S',
      right: 'D',
      e: 'E',
      space: 'SPACE'
    });
    this.keys.e.on('down', () => this.handleBallAction());
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown() && !this.pointerInsideMobileControl(pointer)) this.tryTackle(this.player);
    });
  }

  createPauseControls() {
    this.isPausedByKey = false;
    this.pauseOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(200).setVisible(false);
    const bg = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.58).setOrigin(0);
    const title = this.add.text(0, 0, 'Duraklatıldı', {
      fontSize: '42px',
      color: '#fff8dc',
      stroke: '#1e2a1f',
      strokeThickness: 6
    }).setOrigin(0.5);
    const hint = this.add.text(0, 0, 'Devam etmek için Esc veya P', {
      fontSize: '22px',
      color: '#f5d06f'
    }).setOrigin(0.5);
    this.pauseOverlay.add([bg, title, hint]);
    this.layoutPauseOverlay = () => {
      bg.setSize(this.scale.width, this.scale.height);
      title.setPosition(this.scale.width / 2, this.scale.height / 2 - 24);
      hint.setPosition(this.scale.width / 2, this.scale.height / 2 + 34);
    };
    this.layoutPauseOverlay();
    this.scale.on('resize', this.layoutPauseOverlay);

    this.pauseKeyHandler = (event) => {
      if (event.key !== 'Escape' && event.key.toLowerCase() !== 'p') return;
      event.preventDefault();
      this.togglePause();
    };
    window.addEventListener('keydown', this.pauseKeyHandler);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.pauseKeyHandler);
      this.scale.off('resize', this.layoutPauseOverlay);
    });
  }

  togglePause() {
    if (this.matchSystem?.finished) return;
    this.isPausedByKey = !this.isPausedByKey;
    this.pauseOverlay.setVisible(this.isPausedByKey);
    if (this.isPausedByKey) this.scene.pause();
    else this.scene.resume();
  }

  createMobileControls() {
    this.mobileUi = this.add.container(0, 0).setScrollFactor(0).setDepth(60);
    this.joyBase = this.add.circle(0, 0, 58, 0x1f2f24, 0.42).setStrokeStyle(2, 0xf5d06f, 0.65);
    this.joyKnob = this.add.circle(0, 0, 25, 0xf5d06f, 0.72);
    this.boostButton = this.mobileButton('Hız', 0x2f7d46);
    this.passButton = this.mobileButton('Pas', 0x476d9c);
    this.tackleButton = this.mobileButton('Hamle', 0xb34434);
    this.mobileUi.add([this.joyBase, this.joyKnob, ...this.boostButton.items, ...this.passButton.items, ...this.tackleButton.items]);
    this.layoutMobileControls();

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < this.scale.width * 0.43 && pointer.y > this.scale.height * 0.48) {
        this.mobileState.active = true;
        this.mobileState.pointerId = pointer.id;
        this.updateJoystick(pointer);
      }
    });
    this.input.on('pointermove', (pointer) => {
      if (this.mobileState.active && pointer.id === this.mobileState.pointerId) this.updateJoystick(pointer);
    });
    this.input.on('pointerup', (pointer) => {
      if (pointer.id === this.mobileState.pointerId) {
        this.mobileState.active = false;
        this.mobileState.pointerId = null;
        this.mobileState.x = 0;
        this.mobileState.y = 0;
        this.joyKnob.setPosition(this.joyBase.x, this.joyBase.y);
      }
    });
  }

  mobileButton(label, color) {
    const bg = this.add.circle(0, 0, 34, color, 0.78).setStrokeStyle(2, 0xfff4cf, 0.78);
    const text = this.add.text(0, 0, label, { fontSize: '12px', color: '#fff8dc' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    return { bg, text, items: [bg, text] };
  }

  layoutMobileControls() {
    if (!this.mobileUi) return;
    const { width, height } = this.scale;
    const show = width < 900 || this.sys.game.device.input.touch;
    this.mobileUi.setVisible(show);
    this.joyBase.setPosition(92, height - 92);
    if (!this.mobileState.active) this.joyKnob.setPosition(this.joyBase.x, this.joyBase.y);
    this.placeButton(this.boostButton, width - 92, height - 122);
    this.placeButton(this.passButton, width - 166, height - 66);
    this.placeButton(this.tackleButton, width - 58, height - 58);
  }

  placeButton(button, x, y) {
    button.bg.setPosition(x, y);
    button.text.setPosition(x, y);
    button.bg.removeAllListeners('pointerdown');
    button.bg.removeAllListeners('pointerup');
    button.bg.on('pointerdown', () => {
      if (button === this.boostButton) this.mobileState.boost = true;
      if (button === this.passButton) this.handleBallAction();
      if (button === this.tackleButton) this.tryTackle(this.player);
    });
    button.bg.on('pointerup', () => {
      if (button === this.boostButton) this.mobileState.boost = false;
    });
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joyBase.x;
    const dy = pointer.y - this.joyBase.y;
    const vec = new Phaser.Math.Vector2(dx, dy);
    if (vec.length() > 48) vec.setLength(48);
    this.mobileState.x = vec.x / 48;
    this.mobileState.y = vec.y / 48;
    this.joyKnob.setPosition(this.joyBase.x + vec.x, this.joyBase.y + vec.y);
  }

  update(time, delta) {
    this.matchSystem.update(delta);
    if (this.matchSystem.finished) return;

    this.updatePlayerInput(delta);
    this.bots.forEach((bot) => bot.update(time, delta));
    this.handleTackleContacts();
    this.updateHud();
  }

  updatePlayerInput(delta) {
    const keyboardX = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const keyboardY = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
    const pointer = this.input.activePointer;
    const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this.inputState.x = keyboardX || this.mobileState.x;
    this.inputState.y = keyboardY || this.mobileState.y;
    this.inputState.boost = this.keys.space.isDown || this.mobileState.boost;
    this.inputState.pointer = pointerWorld;
    this.player.updateFromInput(this.inputState, delta);
  }

  handleBallAction() {
    if (!this.ball) return;
    if (this.ball.carrier === this.player) {
      this.ball.passToward(this.player.rotation, this.player.passDistance);
      return;
    }
    if (this.ball.isFree() && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y) < 70) {
      this.ball.attachTo(this.player);
    }
  }

  handleTackleContacts() {
    const carrier = this.ball.carrier;
    if (!carrier) return;
    this.allRiders.forEach((rider) => {
      if (!this.ball.carrier || this.ball.carrier !== carrier) return;
      if (rider.teamId !== carrier.teamId && Phaser.Math.Distance.Between(rider.x, rider.y, carrier.x, carrier.y) < 38) {
        this.tryTackle(rider, carrier);
      }
    });
  }

  tryTackle(attacker, target = this.ball.carrier) {
    if (!attacker || !target || attacker.teamId === target.teamId || !target.hasBall || !attacker.canTackle()) return;
    attacker.markTackle();
    const chance = attacker.tackleChance;
    const success = Math.random() < chance;
    const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y);
    attacker.setVelocity(Math.cos(angle) * 420, Math.sin(angle) * 420);
    this.flashAt(attacker.x, attacker.y, success ? 0xf5d06f : 0xffffff);
    if (success) {
      this.ball.drop(Math.cos(angle) * 30, Math.sin(angle) * 30);
      this.ball.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
    }
  }

  nearestToBall(teamId) {
    const riders = this.allRiders.filter((rider) => rider.teamId === teamId);
    return riders.sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) - Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y))[0];
  }

  resetRound() {
    this.time.delayedCall(900, () => {
      this.ball.resetTo(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
      const positions = [
        [360, 600], [310, 420], [300, 780], [520, 600],
        [1880, 420], [1880, 780], [1700, 600], [1760, 250]
      ];
      this.allRiders.forEach((rider, index) => {
        rider.setPosition(positions[index][0], positions[index][1]);
        rider.setVelocity(0, 0);
        rider.hasBall = false;
      });
    });
  }

  endMatch(reason) {
    const blue = this.scoreSystem.scores.blue;
    const red = this.scoreSystem.scores.red;
    const won = blue > red;
    const gold = won ? 45 + blue * 15 : 15 + blue * 8;
    StorageSystem.update((save) => {
      save.altin += gold;
      save.enYuksekSkor = Math.max(save.enYuksekSkor, blue);
      if (won) save.toplamGalibiyet += 1;
    });
    this.time.delayedCall(reason === 'score' ? 900 : 250, () => {
      this.scene.start('ResultScene', { won, blue, red, gold });
    });
  }

  updateHud() {
    const carrier = this.ball.carrier
      ? this.ball.carrier.isPlayer
        ? 'Sende'
        : this.ball.carrier.teamId === 'blue'
          ? 'Takımında'
          : 'Rakipte'
      : 'Boşta';
    this.scoreText.setText(`${this.playerTeam.name} ${this.scoreSystem.scores.blue} - ${this.scoreSystem.scores.red} Rakip`);
    this.infoText.setText(`Süre ${this.matchSystem.formattedTime()}   Top: ${carrier}   Hız: ${Math.round(this.player.boostEnergy)}%`);
  }

  showFloatingText(text, color) {
    const label = this.add.text(this.scale.width / 2, this.scale.height * 0.22, text, {
      fontSize: '54px',
      color: '#fff8dc',
      stroke: Phaser.Display.Color.IntegerToColor(color).rgba,
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80);
    this.tweens.add({
      targets: label,
      y: label.y - 40,
      alpha: 0,
      duration: 850,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy()
    });
  }

  flashAt(x, y, color) {
    const flash = this.add.circle(x, y, 12, color, 0.75).setDepth(10);
    this.tweens.add({
      targets: flash,
      scale: 2.8,
      alpha: 0,
      duration: 260,
      onComplete: () => flash.destroy()
    });
  }

  pointerInsideMobileControl(pointer) {
    if (!this.mobileUi?.visible) return false;
    return pointer.y > this.scale.height * 0.48;
  }
}
