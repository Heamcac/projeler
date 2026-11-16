import Phaser from "phaser";
import { COLORS, DIFFICULTIES, DIRECTION_LABELS, DIRECTION_SYMBOLS, GAME_HEIGHT, GAME_WIDTH } from "../constants.js";
import PlayerFighter from "../fighters/PlayerFighter.js";
import OpponentFighter from "../fighters/OpponentFighter.js";
import ComboSystem from "../systems/ComboSystem.js";
import InputSystem from "../systems/InputSystem.js";
import RhythmSystem from "../systems/RhythmSystem.js";
import ScoreSystem from "../systems/ScoreSystem.js";
import UpgradeSystem from "../systems/UpgradeSystem.js";
import { addDirectionButton, drawTrainingGround } from "../ui.js";

export default class DuelScene extends Phaser.Scene {
  constructor() {
    super("DuelScene");
  }

  init(data) {
    this.difficultyKey = data.difficultyKey || "orta";
    this.difficulty = DIFFICULTIES[this.difficultyKey];
  }

  create() {
    this.upgrades = new UpgradeSystem().getStats();
    this.comboSystem = new ComboSystem();
    this.scoreSystem = new ScoreSystem(this.upgrades.focusBonus);
    this.inputSystem = new InputSystem(this);
    this.rhythm = new RhythmSystem(this, this.difficulty, this.upgrades);
    this.round = 1;
    this.playerRounds = 0;
    this.opponentRounds = 0;
    this.balance = this.upgrades.maxBalance;
    this.roundStartScore = 0;
    this.currentMove = null;
    this.waitingForNext = false;
    this.roundFinishing = false;

    drawTrainingGround(this);
    this.player = new PlayerFighter(this, 235, 324);
    this.opponent = new OpponentFighter(this, 725, 324);
    this.createHud();
    this.createMobileControls();
    this.createPauseControls();
    this.bindEvents();
    this.startRound();
  }

  bindEvents() {
    this.inputSystem.bind();
    this.events.on("defense-input", this.handleDefense, this);
    this.events.on("counter-input", this.handleCounter, this);
    this.events.on("rhythm-complete", this.finishRound, this);
    this.events.once("shutdown", () => {
      this.inputSystem.destroy();
      this.rhythm.stop();
    });
  }

  createHud() {
    this.hudBg = this.add.rectangle(GAME_WIDTH / 2, 34, GAME_WIDTH, 68, 0x2c2118, 0.9);
    this.scoreText = this.add.text(20, 16, "", { fontSize: "20px", color: COLORS.cream });
    this.balanceText = this.add.text(252, 16, "", { fontSize: "20px", color: COLORS.cream });
    this.comboText = this.add.text(470, 16, "", { fontSize: "20px", color: COLORS.cream });
    this.roundText = this.add.text(680, 16, "", { fontSize: "20px", color: COLORS.cream });
    this.feedbackText = this.add.text(GAME_WIDTH / 2, 104, "", {
      fontSize: "28px",
      fontStyle: "700",
      color: COLORS.gold,
    }).setOrigin(0.5);
    this.moveText = this.add.text(GAME_WIDTH / 2, 238, "", {
      fontSize: "76px",
      fontStyle: "700",
      color: COLORS.cream,
      stroke: "#2c2118",
      strokeThickness: 8,
    }).setOrigin(0.5);
    this.counterText = this.add.text(GAME_WIDTH / 2, 150, "", {
      fontSize: "27px",
      fontStyle: "700",
      color: COLORS.gold,
    }).setOrigin(0.5);
    this.updateHud();
  }

  createMobileControls() {
    const baseY = GAME_HEIGHT - 110;
    addDirectionButton(this, 92, baseY, "left", (direction) => this.events.emit("defense-input", direction));
    addDirectionButton(this, 176, baseY, "right", (direction) => this.events.emit("defense-input", direction));
    addDirectionButton(this, 134, baseY - 58, "up", (direction) => this.events.emit("defense-input", direction));
    addDirectionButton(this, 134, baseY + 58, "down", (direction) => this.events.emit("defense-input", direction));

    const counter = this.add.circle(GAME_WIDTH - 132, baseY, 48, 0xe5b758, 0.95)
      .setStrokeStyle(4, 0x2c2118)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 132, baseY, "HAMLE", {
      fontSize: "17px",
      fontStyle: "700",
      color: COLORS.darkInk,
    }).setOrigin(0.5);
    counter.on("pointerdown", () => this.events.emit("counter-input"));
  }

  createPauseControls() {
    this.isPausedByKey = false;
    this.pauseOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(200).setVisible(false);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.58);
    const title = this.add.text(0, -24, "Duraklatıldı", {
      fontSize: "42px",
      fontStyle: "700",
      color: COLORS.cream,
      stroke: "#2c2118",
      strokeThickness: 7,
    }).setOrigin(0.5);
    const hint = this.add.text(0, 34, "Devam etmek için Esc veya P", {
      fontSize: "22px",
      color: COLORS.gold,
    }).setOrigin(0.5);
    this.pauseOverlay.add([bg, title, hint]);

    this.pauseKeyHandler = (event) => {
      if (event.key !== "Escape" && event.key.toLowerCase() !== "p") return;
      event.preventDefault();
      this.togglePause();
    };
    window.addEventListener("keydown", this.pauseKeyHandler);
    this.events.once("shutdown", () => window.removeEventListener("keydown", this.pauseKeyHandler));
  }

  togglePause() {
    if (this.roundFinishing) return;
    this.isPausedByKey = !this.isPausedByKey;
    this.pauseOverlay.setVisible(this.isPausedByKey);
    if (this.isPausedByKey) this.scene.pause();
    else this.scene.resume();
  }

  startRound() {
    this.balance = this.upgrades.maxBalance;
    this.roundFinishing = false;
    this.comboSystem.registerFailure();
    this.roundStartScore = this.scoreSystem.score;
    this.feedback("Raunt " + this.round, COLORS.gold);
    this.time.delayedCall(850, () => this.rhythm.start((move) => this.showMove(move)));
    this.updateHud();
  }

  showMove(move) {
    this.currentMove = { ...move, answered: false };
    this.waitingForNext = true;
    this.moveText.setText(DIRECTION_SYMBOLS[move.direction]);
    this.opponent.attack(move.direction);
    this.feedback(DIRECTION_LABELS[move.direction], COLORS.cream);

    this.tweens.add({
      targets: this.moveText,
      scale: 1.18,
      alpha: 1,
      yoyo: true,
      duration: Math.min(220, move.showMs / 2),
    });

    this.time.delayedCall(move.showMs, () => {
      if (this.currentMove?.index === move.index) {
        this.moveText.setAlpha(0.36);
      }
    });

    this.time.delayedCall(move.windowMs, () => {
      if (this.currentMove && !this.currentMove.answered) {
        this.miss("Geç kaldın");
      }
    });
  }

  handleDefense(direction) {
    if (!this.currentMove || this.currentMove.answered) {
      return;
    }

    this.player.defend(direction);
    if (direction === this.currentMove.direction) {
      this.currentMove.answered = true;
      const combo = this.comboSystem.registerSuccess();
      const gained = this.scoreSystem.addDefense(combo);
      this.spark(360, 270, 0xe5b758);
      this.feedback(`Doğru savunma +${gained}`, COLORS.green);
      if (this.comboSystem.counterReady) {
        this.counterText.setText("Karşı Hamle Hazır!");
        this.tweens.add({ targets: this.counterText, scale: 1.12, yoyo: true, duration: 180 });
      }
      this.afterMove();
    } else {
      this.miss("Yanlış yön");
    }
  }

  handleCounter() {
    if (!this.comboSystem.counterReady || !this.currentMove || this.currentMove.answered) {
      this.feedback("Karşı hamle için combo 5 ve açık zaman gerekir", "#f0a28c");
      return;
    }

    this.currentMove.answered = true;
    this.comboSystem.consumeCounter();
    const gained = this.scoreSystem.addCounter();
    this.player.celebrate();
    this.opponent.recoil();
    this.spark(GAME_WIDTH / 2, 270, 0xe5b758);
    this.counterText.setText("");
    this.feedback(`Karşı hamle +${gained}`, COLORS.gold);
    this.afterMove();
  }

  miss(reason) {
    if (!this.currentMove || this.currentMove.answered) {
      return;
    }
    this.currentMove.answered = true;
    this.balance = Math.max(0, this.balance - 22);
    this.comboSystem.registerFailure();
    this.counterText.setText("");
    this.feedback(reason, "#f0a28c");
    this.cameras.main.shake(130, 0.008);

    if (this.balance <= 0) {
      this.time.delayedCall(420, () => this.finishRound(true));
      return;
    }
    this.afterMove();
  }

  afterMove() {
    this.currentMove = null;
    this.moveText.setText("").setAlpha(1).setScale(1);
    this.updateHud();
    this.time.delayedCall(260, () => {
      if (!this.roundFinishing) {
        this.rhythm.acknowledgeMove();
      }
    });
  }

  finishRound(balanceLost = false) {
    if (this.roundFinishing) {
      return;
    }
    this.roundFinishing = true;
    this.rhythm.stop();
    const roundScore = this.scoreSystem.score - this.roundStartScore;
    const playerWonRound = !balanceLost && roundScore >= this.difficulty.movesPerRound * 28;
    if (playerWonRound) {
      this.playerRounds += 1;
      this.feedback("Raunt senin", COLORS.green);
    } else {
      this.opponentRounds += 1;
      this.feedback("Raunt rakibin", "#f0a28c");
    }

    if (this.round >= 3) {
      this.time.delayedCall(900, () => {
        this.scene.start("ResultScene", {
          difficultyKey: this.difficultyKey,
          score: this.scoreSystem.score,
          playerRounds: this.playerRounds,
          opponentRounds: this.opponentRounds,
        });
      });
      return;
    }

    this.round += 1;
    this.time.delayedCall(1000, () => this.startRound());
    this.updateHud();
  }

  spark(x, y, color) {
    const flash = this.add.circle(x, y, 14, color, 0.9);
    this.tweens.add({
      targets: flash,
      scale: 3.2,
      alpha: 0,
      duration: 280,
      onComplete: () => flash.destroy(),
    });
  }

  feedback(message, color) {
    this.feedbackText.setText(message).setColor(color);
  }

  updateHud() {
    this.scoreText.setText(`Skor: ${this.scoreSystem.score}`);
    this.balanceText.setText(`Denge: ${this.balance}/${this.upgrades.maxBalance}`);
    this.comboText.setText(`Combo: ${this.comboSystem.combo}`);
    this.roundText.setText(`Raunt: ${this.round}/3   ${this.playerRounds}-${this.opponentRounds}`);
  }
}
