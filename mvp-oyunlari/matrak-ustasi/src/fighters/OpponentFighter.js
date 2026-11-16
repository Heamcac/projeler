import { COLORS } from "../constants.js";

export default class OpponentFighter {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.draw();
  }

  draw() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xf6e8c8, 1).fillCircle(0, -76, 23);
    g.fillStyle(0x8d2d24, 1).fillRoundedRect(-30, -54, 60, 88, 12);
    g.fillStyle(0x3b2a1d, 1).fillRect(-26, 34, 18, 58).fillRect(8, 34, 18, 58);
    g.lineStyle(12, 0x8f5d33, 1).lineBetween(-28, -28, -88, -62);
    g.lineStyle(5, 0xe5b758, 1).strokeCircle(0, -76, 27);
    this.container.add(g);

    this.label = this.scene.add.text(0, 112, "Rakip", {
      fontSize: "20px",
      color: COLORS.cream,
    }).setOrigin(0.5);
    this.container.add(this.label);
  }

  attack(direction) {
    const dx = direction === "left" ? -20 : direction === "right" ? 20 : 0;
    const dy = direction === "up" ? -16 : direction === "down" ? 16 : 0;
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x + dx,
      y: this.container.y + dy,
      yoyo: true,
      duration: 110,
      ease: "Sine.easeOut",
    });
  }

  recoil() {
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x + 20,
      yoyo: true,
      duration: 120,
    });
  }
}
