import { ArrowLeft, Play } from 'lucide-react';

export default function RulesPage({ onBack, onPlay }) {
  return (
    <main className="content-page">
      <div className="page-shell">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> Menü
        </button>
        <h1>Nasıl Oynanır</h1>
        <div className="rules-grid">
          <article>
            <span className="mini-board">● ● ● → ◉</span>
            <h2>1. Kuyu Seç</h2>
            <p>Alttaki altı kuyudan taş olan birini seç. Taşlar sırayla ilerleyen kuyulara dağıtılır.</p>
          </article>
          <article>
            <span className="mini-board">◉ + ●</span>
            <h2>2. Hazineyi Büyüt</h2>
            <p>Dağıtım sırasında kendi hazinene gelen taşlar puan olur. Son taş hazinene düşerse tekrar oynarsın.</p>
          </article>
          <article>
            <span className="mini-board">□ + karşı = ◉</span>
            <h2>3. Taş Yakala</h2>
            <p>Son taş boş kuyuna düşerse karşı kuyudaki taşları alırsın. Rakip kuyusunda çift sayı oluşursa o taşları da kazanırsın.</p>
          </article>
          <article>
            <span className="mini-board">48 taş</span>
            <h2>4. Oyun Biter</h2>
            <p>Bir tarafın kuyuları boşalınca kalan taşlar toplanır. Hazinesinde daha çok taş olan oyunu kazanır.</p>
          </article>
        </div>
        <button className="primary-action" type="button" onClick={onPlay}>
          <Play size={20} /> Oyuna Başla
        </button>
      </div>
    </main>
  );
}
