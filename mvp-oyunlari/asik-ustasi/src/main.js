import Phaser from 'phaser';
import './styles.css';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#2f2116',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 540,
    height: 960
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 },
      debug: false,
      enableSleeping: true
    }
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, ResultScene, UpgradeScene]
};

new Phaser.Game(config);
