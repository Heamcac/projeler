const STORAGE_KEY = 'asik-ustasi-save-v1';

const DEFAULT_SAVE = {
  altin: 0,
  tamamlananBolum: 0,
  enYuksekSkor: 0,
  gucSeviyesi: 1,
  kontrolSeviyesi: 1,
  sansSeviyesi: 1,
  levels: {}
};

export default class StorageSystem {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  static save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SAVE, ...data }));
  }

  static update(mutator) {
    const data = StorageSystem.load();
    mutator(data);
    StorageSystem.save(data);
    return data;
  }

  static reset() {
    StorageSystem.save({ ...DEFAULT_SAVE });
  }
}
