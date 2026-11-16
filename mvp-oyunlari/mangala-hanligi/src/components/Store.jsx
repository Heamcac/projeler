export default function Store({ count, owner }) {
  return (
    <div className={`store ${owner}`} aria-label={`${owner === 'human' ? 'Oyuncu' : 'Rakip'} hazinesi ${count} taş`}>
      <span className="store-title">{owner === 'human' ? 'Senin Hazinen' : 'Rakip Hazinesi'}</span>
      <strong>{count}</strong>
      <span className="store-stones" aria-hidden="true">
        {Array.from({ length: Math.min(count, 18) }).map((_, index) => (
          <i key={index} style={{ '--i': index }} />
        ))}
      </span>
    </div>
  );
}
