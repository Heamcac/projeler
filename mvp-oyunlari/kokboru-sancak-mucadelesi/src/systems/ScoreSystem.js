import { WIN_SCORE } from '../config.js';

export default class ScoreSystem {
  constructor() {
    this.scores = { blue: 0, red: 0 };
  }

  add(teamId) {
    this.scores[teamId] += 1;
    return this.scores[teamId] >= WIN_SCORE;
  }

  highest() {
    return Math.max(this.scores.blue, this.scores.red);
  }

  leader() {
    if (this.scores.blue === this.scores.red) return 'draw';
    return this.scores.blue > this.scores.red ? 'blue' : 'red';
  }
}
