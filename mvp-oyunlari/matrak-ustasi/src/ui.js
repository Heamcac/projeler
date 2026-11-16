import { COLORS, DIRECTION_SYMBOLS, GAME_HEIGHT, GAME_WIDTH } from "./constants.js";

export function addTitle(scene, title, subtitle) {
  scene.add.text(GAME_WIDTH / 2, 78, title, {
    fontSize: "54px",
    fontStyle: "700",
    color: COLORS.cream,
  }).setOrigin(0.5);

  if (subtitle) {
    scene.add.text(GAME_WIDTH / 2, 124, subtitle, {
      fontSize: "20px",
      color: "#e7d2a5",
      align: "center",
    }).setOrigin(0.5);
  }
}

export function addButton(scene, x, y, label, callback, width = 220) {
  const box = scene.add.rectangle(x, y, width, 48, 0xf6e8c8, 1)
    .setStrokeStyle(3, 0x8f5d33)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontSize: "20px",
    fontStyle: "700",
    color: COLORS.darkInk,
  }).setOrigin(0.5);
  box.on("pointerdown", callback);
  box.on("pointerover", () => box.setFillStyle(0xe5b758));
  box.on("pointerout", () => box.setFillStyle(0xf6e8c8));
  return scene.add.container(0, 0, [box, text]);
}

export function drawTrainingGround(scene) {
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x28362b);
  scene.add.rectangle(GAME_WIDTH / 2, 438, GAME_WIDTH, 204, 0x7a5132);
  scene.add.ellipse(GAME_WIDTH / 2, 355, 550, 148, 0xc99152, 0.95)
    .setStrokeStyle(5, 0xe5b758);
  scene.add.rectangle(GAME_WIDTH / 2, 180, GAME_WIDTH, 16, 0x8f5d33);
  scene.add.triangle(128, 96, 0, 70, 0, 152, 76, 112, 0x8d2d24);
  scene.add.triangle(832, 96, 0, 70, 0, 152, -76, 112, 0x2f7472);

  for (let i = 0; i < 8; i += 1) {
    scene.add.rectangle(70 + i * 118, 160, 9, 70, 0x6b4026);
  }
}

export function addDirectionButton(scene, x, y, direction, onPress) {
  const button = scene.add.circle(x, y, 34, 0xf6e8c8, 0.95)
    .setStrokeStyle(3, 0x8f5d33)
    .setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y - 1, DIRECTION_SYMBOLS[direction], {
    fontSize: "30px",
    fontStyle: "700",
    color: COLORS.darkInk,
  }).setOrigin(0.5);
  button.on("pointerdown", () => onPress(direction));
  return scene.add.container(0, 0, [button, label]);
}
