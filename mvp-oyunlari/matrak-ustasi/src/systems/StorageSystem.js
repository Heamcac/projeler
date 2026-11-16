const DEFAULT_SAVE = {
  altin: 0,
  enYuksekSkor: 0,
  toplamGalibiyet: 0,
  refleksSeviyesi: 1,
  dengeSeviyesi: 1,
  odakSeviyesi: 1,
};

export default class StorageSystem {
  static key = "matrak-ustasi-save-v1";

  static load() {
    try {
      const raw = localStorage.getItem(StorageSystem.key);
      return raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  static save(data) {
    localStorage.setItem(StorageSystem.key, JSON.stringify({ ...DEFAULT_SAVE, ...data }));
  }

  static applyMatchResult({ score, won }) {
    const data = StorageSystem.load();
    const altin = Math.max(10, Math.floor(score / 20)) + (won ? 40 : 15);
    const next = {
      ...data,
      altin: data.altin + altin,
      enYuksekSkor: Math.max(data.enYuksekSkor, score),
      toplamGalibiyet: data.toplamGalibiyet + (won ? 1 : 0),
    };
    StorageSystem.save(next);
    return { save: next, earnedGold: altin };
  }
}
