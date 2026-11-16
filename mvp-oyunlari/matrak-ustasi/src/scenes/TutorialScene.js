import Phaser from "phaser";
import { COLORS, GAME_WIDTH } from "../constants.js";
import { addButton, addTitle, drawTrainingGround } from "../ui.js";

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");
  }

  create() {
    drawTrainingGround(this);
    addTitle(this, "Talim Defteri", "Rakibin yönünü oku, aynı yöne zamanında savun.");

    const lines = [
      "1. Rakip kısa süreli bir hamle yönü gösterir.",
      "2. Doğru yön savunması skor ve combo kazandırır.",
      "3. Yanlış savunma dengeyi azaltır ve combo sıfırlar.",
      "4. Combo 5 olunca Karşı Hamle Hazır olur.",
      "5. Space veya orta buton doğru zamanda ekstra puan verir.",
      "6. Üç raunt sonunda daha çok raunt alan kazanır.",
      "Usta notu: MVP sonrası fake hamleler zorluk sistemine eklenebilir.",
    ];

    lines.forEach((line, i) => {
      this.add.text(150, 178 + i * 36, line, {
        fontSize: "21px",
        color: i === 6 ? COLORS.gold : COLORS.cream,
      });
    });

    addButton(this, GAME_WIDTH / 2, 462, "Menüye Dön", () => this.scene.start("MenuScene"));
  }
}
