import Phaser from "phaser";
import { DIFFICULTIES, GAME_HEIGHT, GAME_WIDTH } from "../constants.js";
import StorageSystem from "../systems/StorageSystem.js";
import { addButton, addTitle, drawTrainingGround } from "../ui.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    drawTrainingGround(this);
    addTitle(this, "Matrak Ustası", "Ritim, savunma ve disiplin talimi");

    const save = StorageSystem.load();
    this.add.text(GAME_WIDTH / 2, 156, `Altın: ${save.altin}   En yüksek skor: ${save.enYuksekSkor}   Galibiyet: ${save.toplamGalibiyet}`, {
      fontSize: "18px",
      color: "#fff4d4",
    }).setOrigin(0.5);

    const keys = Object.keys(DIFFICULTIES);
    keys.forEach((key, index) => {
      const x = 240 + (index % 2) * 480;
      const y = 232 + Math.floor(index / 2) * 74;
      addButton(this, x, y, DIFFICULTIES[key].label, () => {
        this.scene.start("DuelScene", { difficultyKey: key });
      }, 250);
    });

    addButton(this, GAME_WIDTH / 2 - 150, 430, "Nasıl Oynanır", () => this.scene.start("TutorialScene"), 250);
    addButton(this, GAME_WIDTH / 2 + 150, 430, "Geliştirmeler", () => this.scene.start("UpgradeScene"), 250);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "Yön tuşları / WASD savunma, Space karşı hamle. Mobilde alttaki butonlar.", {
      fontSize: "16px",
      color: "#e7d2a5",
    }).setOrigin(0.5);
  }
}
