import { MATCH_SECONDS } from '../config.js';

export default class MatchSystem {
  constructor(scene, scoreSystem) {
    this.scene = scene;
    this.scoreSystem = scoreSystem;
    this.remaining = MATCH_SECONDS;
    this.finished = false;
  }

  update(delta) {
    if (this.finished) return;
    this.remaining = Math.max(0, this.remaining - delta / 1000);
    if (this.remaining <= 0) this.finish('time');
  }

  goal(teamId) {
    if (this.finished) return;
    const won = this.scoreSystem.add(teamId);
    this.scene.showFloatingText('Sayı!', teamId === 'blue' ? 0x2f7d46 : 0xb34434);
    if (won) {
      this.finish('score');
      return;
    }
    this.scene.resetRound();
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.scene.endMatch(reason);
  }

  formattedTime() {
    const minutes = Math.floor(this.remaining / 60);
    const seconds = Math.floor(this.remaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
