import Phaser from 'phaser';
import './styles.css';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import ResultScene from './scenes/ResultScene.js';
import HowToScene from './scenes/HowToScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#2d241b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, HowToScene, UpgradeScene, GameScene, ResultScene]
};

window.ciritGame = new Phaser.Game(config);
