import Phaser from "phaser";
import { COLORS, GAME_WIDTH } from "../constants.js";
import StorageSystem from "../systems/StorageSystem.js";
import { addButton, addTitle, drawTrainingGround } from "../ui.js";

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  init(data) {
    this.result = data;
  }

  create() {
    drawTrainingGround(this);
    const won = this.result.playerRounds > this.result.opponentRounds;
    const reward = StorageSystem.applyMatchResult({ score: this.result.score, won });
    addTitle(this, won ? "Usta Meydanda!" : "Talim Devam Eder", won ? "Maçı kazandın." : "Rakip bu kez önde.");

    const rows = [
      `Skor: ${this.result.score}`,
      `Rauntlar: ${this.result.playerRounds} - ${this.result.opponentRounds}`,
      `Kazanılan altın: ${reward.earnedGold}`,
      `Toplam altın: ${reward.save.altin}`,
      `En yüksek skor: ${reward.save.enYuksekSkor}`,
    ];

    rows.forEach((row, i) => {
      this.add.text(GAME_WIDTH / 2, 184 + i * 40, row, {
        fontSize: "24px",
        color: i === 0 ? COLORS.gold : COLORS.cream,
      }).setOrigin(0.5);
    });

    addButton(this, GAME_WIDTH / 2 - 145, 438, "Tekrar Oyna", () => this.scene.start("DuelScene", { difficultyKey: this.result.difficultyKey }), 240);
    addButton(this, GAME_WIDTH / 2 + 145, 438, "Geliştirmeler", () => this.scene.start("UpgradeScene"), 240);
    addButton(this, GAME_WIDTH / 2, 498, "Menü", () => this.scene.start("MenuScene"), 180);
  }
}
