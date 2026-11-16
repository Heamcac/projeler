import { ArrowLeft, RotateCcw } from 'lucide-react';
import { PLAYER_LABELS, PLAYERS } from '../logic/gameState.js';

export default function GameInfo({ state, thinking, onRestart, onBack }) {
  const turnText = thinking ? 'Rakip düşünüyor...' : `Sıra: ${PLAYER_LABELS[state.currentPlayer]}`;

  return (
    <aside className="game-info">
      <div className="top-actions">
        <button type="button" title="Ana menü" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <button type="button" title="Yeniden başlat" onClick={onRestart}>
          <RotateCcw size={18} />
        </button>
      </div>
      <div>
        <p className="eyebrow">Mangala Hanlığı</p>
        <h2>{turnText}</h2>
      </div>
      <div className="score-grid">
        <div>
          <span>Sen</span>
          <strong>{state.stores[PLAYERS.HUMAN]}</strong>
        </div>
        <div>
          <span>Rakip</span>
          <strong>{state.stores[PLAYERS.AI]}</strong>
        </div>
      </div>
      <p className="turn-count">{state.turnCount}. tur</p>
    </aside>
  );
}
