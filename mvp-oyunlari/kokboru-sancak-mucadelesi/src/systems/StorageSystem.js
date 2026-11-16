const STORAGE_KEY = 'kokboru-sancak-mucadelesi-save';

const defaultSave = {
  altin: 0,
  toplamGalibiyet: 0,
  enYuksekSkor: 0,
  atSeviyesi: 1,
  dayaniklilikSeviyesi: 1,
  hamleSeviyesi: 1,
  pasSeviyesi: 1,
  aktifTakim: 'bozkir'
};

export default class StorageSystem {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultSave, ...JSON.parse(raw) } : { ...defaultSave };
    } catch {
      return { ...defaultSave };
    }
  }

  static save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSave, ...data }));
  }

  static update(mutator) {
    const data = StorageSystem.load();
    mutator(data);
    StorageSystem.save(data);
    return data;
  }

  static reset() {
    StorageSystem.save(defaultSave);
    return StorageSystem.load();
  }
}
