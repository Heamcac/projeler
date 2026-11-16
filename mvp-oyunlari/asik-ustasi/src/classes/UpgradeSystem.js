import Phaser from 'phaser';

export default class UpgradeSystem {
  static maxLevel = 5;

  static getCost(type, level) {
    const base = {
      gucSeviyesi: 60,
      kontrolSeviyesi: 50,
      sansSeviyesi: 70
    }[type];
    return base * level;
  }

  static getPowerMultiplier(level) {
    return 1 + (level - 1) * 0.13;
  }

  static getAimLength(level) {
    return 115 + level * 25;
  }

  static getLuckBonus(level) {
    return Phaser.Math.Between(level * 4, level * 11);
  }

  static canUpgrade(save, type) {
    const level = save[type];
    return level < UpgradeSystem.maxLevel && save.altin >= UpgradeSystem.getCost(type, level);
  }

  static buy(save, type) {
    if (!UpgradeSystem.canUpgrade(save, type)) return false;
    save.altin -= UpgradeSystem.getCost(type, save[type]);
    save[type] += 1;
    return true;
  }
}
