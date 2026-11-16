export default class Team {
  constructor({ id, name, color, goalX, spawnX }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.goalX = goalX;
    this.spawnX = spawnX;
    this.members = [];
  }

  add(rider) {
    this.members.push(rider);
    rider.team = this;
  }
}
