import React from 'react';

export default function ResultModal({ result, onMenu, onAgain }) {
  return (
    <div className="modal-backdrop">
      <section className="result-modal">
        <p className="eyebrow">Mac Sonucu</p>
        <h2>{result.won ? 'Meydan Senin!' : 'Rakip Puanla Onde'}</h2>
        <p>{result.playerScore} - {result.opponentScore}</p>
        <div className="reward-row">
          <span>Altin +{result.rewards.altin}</span>
          <span>XP +{result.rewards.xp}</span>
        </div>
        <div className="modal-actions">
          <button className="primary-button" onClick={onAgain}>Tekrar Mac</button>
          <button className="ghost-button" onClick={onMenu}>Ana Menu</button>
        </div>
      </section>
    </div>
  );
}
