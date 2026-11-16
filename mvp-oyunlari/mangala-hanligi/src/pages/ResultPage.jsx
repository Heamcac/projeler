import { BarChart3, Home, RotateCcw } from 'lucide-react';

const copy = {
  win: ['Toy Kazandın!', 'Hazinen rakipten daha dolu. Hanlık bugün sende.'],
  loss: ['Rakip Üstün Geldi', 'Bu kez taş hesabı rakibin lehine döndü.'],
  draw: ['Denge Bozulmadı', 'İki hazine de aynı güçte kaldı.'],
};

export default function ResultPage({ result, onMenu, onStats, onPlayAgain }) {
  const [title, text] = copy[result?.outcome || 'draw'];

  return (
    <main className="content-page result-page">
      <div className="page-shell">
        <p className="eyebrow">Sonuç</p>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="final-score">
          <div><span>Sen</span><strong>{result?.humanScore ?? 0}</strong></div>
          <div><span>Rakip</span><strong>{result?.aiScore ?? 0}</strong></div>
        </div>
        <div className="menu-actions compact">
          <button className="primary-action" type="button" onClick={onPlayAgain}>
            <RotateCcw size={19} /> Tekrar Oyna
          </button>
          <button type="button" onClick={onMenu}>
            <Home size={19} /> Ana Menü
          </button>
          <button type="button" onClick={onStats}>
            <BarChart3 size={19} /> İstatistikler
          </button>
        </div>
      </div>
    </main>
  );
}
