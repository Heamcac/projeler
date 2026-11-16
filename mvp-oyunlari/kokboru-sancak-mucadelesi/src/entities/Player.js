import Phaser from 'phaser';
import HorseRider from './HorseRider.js';

export default class Player extends HorseRider {
  constructor(scene, x, y, texture, stats) {
    super(scene, x, y, texture, {
      id: 'player',
      teamId: 'blue',
      isPlayer: true,
      label: 'Sen',
      speed: stats.speed,
      carrySlowdown: stats.carrySlowdown,
      tackleChance: stats.tackleChance,
      passDistance: stats.passDistance
    });
    this.pointerWorld = new Phaser.Math.Vector2(x, y);
  }

  updateFromInput(inputState, delta) {
    const vector = new Phaser.Math.Vector2(inputState.x, inputState.y);
    this.moveVector(vector, delta, inputState.boost);
    if (inputState.pointer) {
      this.pointerWorld.copy(inputState.pointer);
      this.facePoint(this.pointerWorld.x, this.pointerWorld.y);
    }
  }
}
