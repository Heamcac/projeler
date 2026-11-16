import React from 'react';

export default function WrestlerCard({ wrestler, selected, onSelect }) {
  return (
    <button className={`wrestler-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(wrestler)}>
      <div className="wrestler-portrait" aria-hidden="true">
        <span />
      </div>
      <div>
        <h3>{wrestler.name}</h3>
        <p>{wrestler.title}</p>
      </div>
      <dl className="stat-grid">
        <div><dt>Guc</dt><dd>{wrestler.power}</dd></div>
        <div><dt>Denge</dt><dd>{wrestler.balance}</dd></div>
        <div><dt>Day.</dt><dd>{wrestler.stamina}</dd></div>
        <div><dt>Teknik</dt><dd>{wrestler.technique}</dd></div>
      </dl>
    </button>
  );
}
