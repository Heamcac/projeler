const SAVE_KEY = 'erMeydaniSave';

export const defaultSave = {
  altin: 0,
  xp: 0,
  toplamGalibiyet: 0,
  toplamMaglubiyet: 0,
  gucSeviyesi: 1,
  dengeSeviyesi: 1,
  dayanıklılıkSeviyesi: 1,
  dayaniklilikSeviyesi: 1,
  teknikSeviyesi: 1
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultSave };
    const parsed = { ...defaultSave, ...JSON.parse(raw) };
    parsed.dayaniklilikSeviyesi = parsed.dayaniklilikSeviyesi ?? parsed.dayanıklılıkSeviyesi;
    parsed.dayanıklılıkSeviyesi = parsed.dayanıklılıkSeviyesi ?? parsed.dayaniklilikSeviyesi;
    return parsed;
  } catch {
    return { ...defaultSave };
  }
}

export function saveGame(data) {
  const normalized = { ...defaultSave, ...data };
  normalized.dayanıklılıkSeviyesi = normalized.dayaniklilikSeviyesi;
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return { ...defaultSave };
}
