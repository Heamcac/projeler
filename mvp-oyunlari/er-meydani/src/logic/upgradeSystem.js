export function getUpgradeCost(level) {
  return 30 + level * 20;
}

export function upgradeStat(save, stat) {
  const keyMap = {
    guc: 'gucSeviyesi',
    denge: 'dengeSeviyesi',
    dayaniklilik: 'dayaniklilikSeviyesi',
    teknik: 'teknikSeviyesi'
  };
  const key = keyMap[stat];
  if (!key) return { save, success: false, message: 'Bilinmeyen gelistirme.' };

  const cost = getUpgradeCost(save[key]);
  if (save.altin < cost) {
    return { save, success: false, message: 'Yeterli altin yok.' };
  }

  return {
    success: true,
    message: 'Gelistirme tamamlandi.',
    save: {
      ...save,
      altin: save.altin - cost,
      [key]: save[key] + 1
    }
  };
}

export function getPlayerStats(save, wrestler) {
  return {
    energy: 100,
    dayanıklılık: 78 + save.dayaniklilikSeviyesi * 5 + wrestler.stamina,
    denge: 70 + save.dengeSeviyesi * 5 + wrestler.balance,
    güç: 70 + save.gucSeviyesi * 5 + wrestler.power,
    teknik: 60 + save.teknikSeviyesi * 4 + wrestler.technique,
    skor: 0
  };
}

export function getTimingWindow(save) {
  return Math.min(30, 15 + save.teknikSeviyesi * 2);
}
