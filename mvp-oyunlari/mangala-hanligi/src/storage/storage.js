const KEY = 'mangala-hanligi-stats';

export const emptyStats = {
  toplamOyun: 0,
  galibiyet: 0,
  maglubiyet: 0,
  beraberlik: 0,
  enYuksekTasFarki: 0,
  sonOyunlar: [],
};

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyStats, ...JSON.parse(raw) } : emptyStats;
  } catch {
    return emptyStats;
  }
}

export function saveStats(stats) {
  localStorage.setItem(KEY, JSON.stringify(stats));
}

export function recordGame(result) {
  const stats = loadStats();
  const diff = Math.abs(result.humanScore - result.aiScore);
  const next = {
    ...stats,
    toplamOyun: stats.toplamOyun + 1,
    galibiyet: stats.galibiyet + (result.outcome === 'win' ? 1 : 0),
    maglubiyet: stats.maglubiyet + (result.outcome === 'loss' ? 1 : 0),
    beraberlik: stats.beraberlik + (result.outcome === 'draw' ? 1 : 0),
    enYuksekTasFarki: Math.max(stats.enYuksekTasFarki, diff),
    sonOyunlar: [
      {
        tarih: new Date().toLocaleString('tr-TR'),
        sonuc: result.outcome,
        oyuncu: result.humanScore,
        rakip: result.aiScore,
        zorluk: result.difficulty,
      },
      ...stats.sonOyunlar,
    ].slice(0, 6),
  };
  saveStats(next);
  return next;
}

export function resetStats() {
  saveStats(emptyStats);
}
