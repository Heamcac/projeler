import Phaser from "phaser";
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from "../constants.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1e1712);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Matrak Ustası", {
      fontSize: "40px",
      color: COLORS.cream,
      fontStyle: "700",
    }).setOrigin(0.5);

    this.time.delayedCall(450, () => this.scene.start("MenuScene"));
  }
}
