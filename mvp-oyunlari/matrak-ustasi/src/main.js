import Phaser from "phaser";
import "./style.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants.js";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import TutorialScene from "./scenes/TutorialScene.js";
import DuelScene from "./scenes/DuelScene.js";
import UpgradeScene from "./scenes/UpgradeScene.js";
import ResultScene from "./scenes/ResultScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#1e1712",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, TutorialScene, DuelScene, UpgradeScene, ResultScene],
};

new Phaser.Game(config);
