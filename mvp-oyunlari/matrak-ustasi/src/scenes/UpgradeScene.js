import Phaser from "phaser";
import { COLORS, GAME_WIDTH } from "../constants.js";
import UpgradeSystem from "../systems/UpgradeSystem.js";
import { addButton, addTitle, drawTrainingGround } from "../ui.js";

const UPGRADES = [
  { key: "refleksSeviyesi", title: "Refleks", detail: "Savunma süresini uzatır" },
  { key: "dengeSeviyesi", title: "Denge", detail: "Hata toleransını artırır" },
  { key: "odakSeviyesi", title: "Odak", detail: "Combo puan bonusu verir" },
];

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super("UpgradeScene");
  }

  create() {
    this.system = new UpgradeSystem();
    this.render();
  }

  render() {
    this.children.removeAll();
    drawTrainingGround(this);
    addTitle(this, "Ustalık Geliştirmeleri", `Altın: ${this.system.save.altin}`);

    UPGRADES.forEach((upgrade, i) => {
      const y = 190 + i * 84;
      this.add.rectangle(GAME_WIDTH / 2, y, 650, 62, 0x2c2118, 0.78)
        .setStrokeStyle(2, 0x8f5d33);
      this.add.text(190, y - 17, `${upgrade.title} Seviye ${this.system.save[upgrade.key]}`, {
        fontSize: "22px",
        fontStyle: "700",
        color: COLORS.cream,
      });
      this.add.text(190, y + 11, upgrade.detail, {
        fontSize: "16px",
        color: "#e7d2a5",
      });
      addButton(this, 670, y, `${this.system.getCost(upgrade.key)} Altın`, () => {
        this.system.buy(upgrade.key);
        this.render();
      }, 170);
    });

    addButton(this, GAME_WIDTH / 2, 472, "Menüye Dön", () => this.scene.start("MenuScene"));
  }
}
