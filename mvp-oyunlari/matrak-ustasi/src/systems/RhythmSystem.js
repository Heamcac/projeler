import { DIRECTIONS } from "../constants.js";

export default class RhythmSystem {
  constructor(scene, difficulty, upgrades) {
    this.scene = scene;
    this.config = difficulty;
    this.upgrades = upgrades;
    this.moveIndex = 0;
    this.movesPerRound = difficulty.movesPerRound;
    this.activeTimer = null;
  }

  start(onMove) {
    this.stop();
    this.moveIndex = 0;
    this.onMove = onMove;
    this.scheduleNext(650);
  }

  scheduleNext(delay = this.config.beatMs) {
    this.activeTimer = this.scene.time.delayedCall(delay, () => {
      if (this.moveIndex >= this.movesPerRound) {
        this.scene.events.emit("rhythm-complete");
        return;
      }
      const direction = Phaser.Utils.Array.GetRandom(DIRECTIONS);
      const move = {
        direction,
        showMs: this.config.showMs,
        windowMs: this.config.defenseWindowMs + this.upgrades.reflexWindowBonus,
        index: this.moveIndex + 1,
      };
      this.moveIndex += 1;
      this.onMove(move);
    });
  }

  acknowledgeMove() {
    this.scheduleNext();
  }

  stop() {
    if (this.activeTimer) {
      this.activeTimer.remove(false);
      this.activeTimer = null;
    }
  }
}
