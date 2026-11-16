export default function Pit({ count, index, owner, disabled, active, lastMove, onSelect }) {
  const stones = Array.from({ length: Math.min(count, 12) });

  return (
    <button
      className={`pit ${owner} ${active ? 'selectable' : ''} ${lastMove ? 'last-move' : ''}`}
      type="button"
      disabled={disabled}
      onClick={() => onSelect(index)}
      aria-label={`${owner === 'human' ? 'Oyuncu' : 'Rakip'} ${index + 1}. kuyu, ${count} taş`}
    >
      <span className="pit-count">{count}</span>
      <span className="stone-field" aria-hidden="true">
        {stones.map((_, stoneIndex) => (
          <span
            className="stone"
            key={stoneIndex}
            style={{
              '--x': `${18 + ((stoneIndex * 23) % 58)}%`,
              '--y': `${22 + ((stoneIndex * 31) % 52)}%`,
              '--delay': `${stoneIndex * 35}ms`,
            }}
          />
        ))}
      </span>
    </button>
  );
}
