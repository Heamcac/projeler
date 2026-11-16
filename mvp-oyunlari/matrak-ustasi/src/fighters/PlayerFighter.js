import { COLORS } from "../constants.js";

export default class PlayerFighter {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.draw();
  }

  draw() {
    const g = this.scene.add.graphics();
    g.fillStyle(0xf6e8c8, 1).fillCircle(0, -76, 23);
    g.fillStyle(0x2f7472, 1).fillRoundedRect(-30, -54, 60, 88, 12);
    g.fillStyle(0x3b2a1d, 1).fillRect(-26, 34, 18, 58).fillRect(8, 34, 18, 58);
    g.lineStyle(12, 0x8f5d33, 1).lineBetween(28, -28, 88, -62);
    g.lineStyle(5, 0xe5b758, 1).strokeCircle(0, -76, 27);
    this.container.add(g);

    this.label = this.scene.add.text(0, 112, "Oyuncu", {
      fontSize: "20px",
      color: COLORS.cream,
    }).setOrigin(0.5);
    this.container.add(this.label);
  }

  defend(direction) {
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x + (direction === "left" ? -18 : direction === "right" ? 18 : 0),
      y: this.container.y + (direction === "up" ? -14 : direction === "down" ? 14 : 0),
      yoyo: true,
      duration: 80,
      ease: "Sine.easeOut",
    });
  }

  celebrate() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.08,
      yoyo: true,
      duration: 120,
    });
  }
}
