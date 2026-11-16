import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { loadStats, resetStats } from '../storage/storage.js';

const labels = {
  win: 'Toy kazandın',
  loss: 'Rakip kazandı',
  draw: 'Berabere',
};

export default function StatsPage({ onBack }) {
  const [stats, setStats] = useState(loadStats);

  const clear = () => {
    resetStats();
    setStats(loadStats());
  };

  return (
    <main className="content-page">
      <div className="page-shell">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> Menü
        </button>
        <h1>İstatistikler</h1>
        <div className="stats-grid">
          <div><span>Toplam Oyun</span><strong>{stats.toplamOyun}</strong></div>
          <div><span>Galibiyet</span><strong>{stats.galibiyet}</strong></div>
          <div><span>Mağlubiyet</span><strong>{stats.maglubiyet}</strong></div>
          <div><span>Beraberlik</span><strong>{stats.beraberlik}</strong></div>
          <div><span>En Yüksek Taş Farkı</span><strong>{stats.enYuksekTasFarki}</strong></div>
        </div>
        <section className="recent-games">
          <h2>Son Oyunlar</h2>
          {stats.sonOyunlar.length === 0 ? (
            <p>Henüz kayıtlı oyun yok.</p>
          ) : (
            <ul>
              {stats.sonOyunlar.map((game, index) => (
                <li key={`${game.tarih}-${index}`}>
                  <strong>{labels[game.sonuc]}</strong>
                  <span>{game.oyuncu} - {game.rakip}</span>
                  <small>{game.zorluk} · {game.tarih}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
        <button className="danger-action" type="button" onClick={clear}>
          <Trash2 size={18} /> İstatistikleri Sıfırla
        </button>
      </div>
    </main>
  );
}
