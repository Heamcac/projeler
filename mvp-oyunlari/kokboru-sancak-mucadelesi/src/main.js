import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import TeamSelectScene from './scenes/TeamSelectScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import MatchScene from './scenes/MatchScene.js';
import ResultScene from './scenes/ResultScene.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#8fb370',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, MenuScene, TeamSelectScene, UpgradeScene, MatchScene, ResultScene]
};

new Phaser.Game(config);
