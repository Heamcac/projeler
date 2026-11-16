export default class UpgradeSystem {
  static getCost(level) {
    return level * 80;
  }

  static getStats(save) {
    return {
      javelinSpeed: 650 + save.ciritSeviyesi * 55,
      scoreBonus: 1 + (save.ciritSeviyesi - 1) * 0.08,
      horseSpeed: 230 + save.atSeviyesi * 22,
      boostDuration: 360 + save.atSeviyesi * 55,
      armorReduction: Math.min(0.7, (save.zirhSeviyesi - 1) * 0.12)
    };
  }

  static tryUpgrade(save, key) {
    const current = save[key];
    const cost = UpgradeSystem.getCost(current);
    if (save.altin < cost) return { ok: false, save };
    return {
      ok: true,
      save: {
        ...save,
        altin: save.altin - cost,
        [key]: current + 1
      }
    };
  }
}
