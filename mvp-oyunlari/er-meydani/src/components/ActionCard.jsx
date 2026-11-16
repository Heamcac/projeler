import React from 'react';

export default function ActionCard({ card, disabled, onSelect }) {
  return (
    <button className={`action-card action-${card.type}`} data-testid={`card-${card.id}`} disabled={disabled} onClick={() => onSelect(card.id)}>
      <span className="card-name">{card.name}</span>
      <span className="card-cost">{card.cost === 0 ? '+ enerji' : `${card.cost} enerji`}</span>
      <span className="card-desc">{card.description}</span>
    </button>
  );
}
