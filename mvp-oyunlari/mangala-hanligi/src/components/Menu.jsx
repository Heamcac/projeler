import { BarChart3, BookOpen, Play } from 'lucide-react';

const levels = [
  ['kolay', 'Kolay'],
  ['orta', 'Orta'],
  ['zor', 'Zor'],
];

export default function Menu({ difficulty, onDifficulty, onStart, onRules, onStats }) {
  return (
    <main className="menu-screen">
      <section className="hero-panel">
        <p className="eyebrow">Sıra tabanlı zeka oyunu</p>
        <h1>Mangala Hanlığı</h1>
        <p className="intro">Taşları akıllıca dağıt, hazineni büyüt, rakip otağını stratejiyle geç.</p>
        <div className="difficulty" role="group" aria-label="Zorluk seviyesi">
          {levels.map(([value, label]) => (
            <button
              className={difficulty === value ? 'active' : ''}
              type="button"
              key={value}
              onClick={() => onDifficulty(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="menu-actions">
          <button className="primary-action" type="button" onClick={onStart}>
            <Play size={20} /> Oyuna Başla
          </button>
          <button type="button" onClick={onRules}>
            <BookOpen size={19} /> Nasıl Oynanır
          </button>
          <button type="button" onClick={onStats}>
            <BarChart3 size={19} /> İstatistikler
          </button>
        </div>
      </section>
    </main>
  );
}
