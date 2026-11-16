import Phaser from 'phaser';

export default class BotAI {
  constructor(scene, rider, ball, options = {}) {
    this.scene = scene;
    this.rider = rider;
    this.ball = ball;
    this.role = options.role ?? 'support';
    this.home = new Phaser.Math.Vector2(rider.x, rider.y);
    this.rethinkAt = 0;
    this.wander = new Phaser.Math.Vector2(rider.x, rider.y);
  }

  update(time, delta) {
    const rider = this.rider;
    const ball = this.ball;
    const target = new Phaser.Math.Vector2();
    const carrier = ball.carrier;

    if (rider.hasBall) {
      const goalX = rider.teamId === 'blue' ? this.scene.enemyGoal.x : this.scene.playerGoal.x;
      target.set(goalX, this.scene.worldCenter.y);
    } else if (carrier) {
      if (carrier.teamId === rider.teamId) {
        const push = rider.teamId === 'blue' ? 180 : -180;
        target.set(carrier.x + push, carrier.y + (this.role === 'wing' ? 180 : -150));
      } else {
        target.set(carrier.x, carrier.y);
      }
    } else if (this.scene.nearestToBall(rider.teamId) === rider) {
      target.set(ball.x, ball.y);
    } else {
      if (time > this.rethinkAt) {
        this.rethinkAt = time + Phaser.Math.Between(900, 1600);
        this.wander.set(
          this.home.x + Phaser.Math.Between(-180, 180),
          this.home.y + Phaser.Math.Between(-180, 180)
        );
      }
      target.copy(this.wander);
    }

    const vec = target.subtract(new Phaser.Math.Vector2(rider.x, rider.y));
    rider.moveVector(vec, delta, false);

    if (ball.isFree() && Phaser.Math.Distance.Between(rider.x, rider.y, ball.x, ball.y) < 48) {
      ball.attachTo(rider);
    }

    if (carrier && carrier.teamId !== rider.teamId && Phaser.Math.Distance.Between(rider.x, rider.y, carrier.x, carrier.y) < 42) {
      this.scene.tryTackle(rider, carrier);
    }
  }
}
