const SAVE_KEY = 'cirit-arenasi-save-v1';

const DEFAULT_SAVE = {
  altin: 0,
  toplamSkor: 0,
  enYuksekSkor: 0,
  ciritSeviyesi: 1,
  atSeviyesi: 1,
  zirhSeviyesi: 1
};

export default class StorageSystem {
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return { ...DEFAULT_SAVE, ...(raw ? JSON.parse(raw) : {}) };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  static save(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...DEFAULT_SAVE, ...data }));
  }

  static update(mutator) {
    const save = StorageSystem.load();
    const next = mutator({ ...save }) || save;
    StorageSystem.save(next);
    return next;
  }

  static reset() {
    StorageSystem.save({ ...DEFAULT_SAVE });
  }
}
