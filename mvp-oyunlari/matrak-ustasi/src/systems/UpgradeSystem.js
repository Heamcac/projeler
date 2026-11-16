import StorageSystem from "./StorageSystem.js";

export default class UpgradeSystem {
  constructor() {
    this.save = StorageSystem.load();
  }

  getStats() {
    return {
      reflexWindowBonus: (this.save.refleksSeviyesi - 1) * 45,
      maxBalance: 100 + (this.save.dengeSeviyesi - 1) * 14,
      focusBonus: 1 + (this.save.odakSeviyesi - 1) * 0.08,
    };
  }

  getCost(key) {
    return 60 + (this.save[key] - 1) * 45;
  }

  buy(key) {
    const cost = this.getCost(key);
    if (this.save.altin < cost) {
      return false;
    }
    this.save = {
      ...this.save,
      altin: this.save.altin - cost,
      [key]: this.save[key] + 1,
    };
    StorageSystem.save(this.save);
    return true;
  }
}
