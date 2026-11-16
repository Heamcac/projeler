export default function MoveHistory({ history }) {
  return (
    <section className="move-history">
      <h2>Hamle Geçmişi</h2>
      {history.length === 0 ? (
        <p>İlk hamleni bekliyor.</p>
      ) : (
        <ol>
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
