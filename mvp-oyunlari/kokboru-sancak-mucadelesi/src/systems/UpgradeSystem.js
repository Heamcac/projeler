export const UPGRADE_DEFS = [
  {
    key: 'atSeviyesi',
    label: 'At Seviyesi',
    description: 'Hız ve dönüş kabiliyetini artırır.'
  },
  {
    key: 'dayaniklilikSeviyesi',
    label: 'Dayanıklılık',
    description: 'Sancak topu taşırken daha az yavaşlatır.'
  },
  {
    key: 'hamleSeviyesi',
    label: 'Hamle',
    description: 'Yakın temasta top düşürme şansını artırır.'
  },
  {
    key: 'pasSeviyesi',
    label: 'Pas',
    description: 'Pas mesafesini artırır.'
  }
];

export default class UpgradeSystem {
  static maxLevel = 5;

  static cost(level) {
    return 35 + level * 25;
  }

  static buy(save, key) {
    const level = save[key] ?? 1;
    if (level >= UpgradeSystem.maxLevel) return { ok: false, reason: 'Maksimum seviye' };
    const cost = UpgradeSystem.cost(level);
    if (save.altin < cost) return { ok: false, reason: 'Yeterli altın yok' };
    save.altin -= cost;
    save[key] = level + 1;
    return { ok: true };
  }

  static playerStats(save) {
    return {
      speed: 265 + save.atSeviyesi * 18,
      turnSharpness: 8 + save.atSeviyesi * 0.8,
      carrySlowdown: Math.max(0.62, 0.82 - save.dayaniklilikSeviyesi * 0.04),
      tackleChance: 0.28 + save.hamleSeviyesi * 0.08,
      passDistance: 270 + save.pasSeviyesi * 55
    };
  }
}
