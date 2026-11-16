import { PLAYERS } from '../logic/gameState.js';
import Pit from './Pit.jsx';
import Store from './Store.jsx';

const aiOrder = [11, 10, 9, 8, 7, 6];
const humanOrder = [0, 1, 2, 3, 4, 5];

export default function Board({ state, thinking, paused, onPitSelect }) {
  const isHumanTurn = state.currentPlayer === PLAYERS.HUMAN && !thinking && !paused && state.status === 'playing';

  return (
    <section className="board-wrap" aria-label="Mangala tahtası">
      <div className="board">
        <Store count={state.stores[PLAYERS.AI]} owner={PLAYERS.AI} />
        <div className="pit-grid">
          <div className="pit-row opponent-row">
            {aiOrder.map((index) => (
              <Pit
                key={index}
                count={state.pits[index]}
                index={index}
                owner={PLAYERS.AI}
                disabled
                active={false}
                lastMove={state.lastMove?.pitIndex === index}
                onSelect={onPitSelect}
              />
            ))}
          </div>
          <div className="center-strip">
            <span>Bozkır Yolu</span>
          </div>
          <div className="pit-row human-row">
            {humanOrder.map((index) => (
              <Pit
                key={index}
                count={state.pits[index]}
                index={index}
                owner={PLAYERS.HUMAN}
                disabled={!isHumanTurn || state.pits[index] === 0}
                active={isHumanTurn && state.pits[index] > 0}
                lastMove={state.lastMove?.pitIndex === index}
                onSelect={onPitSelect}
              />
            ))}
          </div>
        </div>
        <Store count={state.stores[PLAYERS.HUMAN]} owner={PLAYERS.HUMAN} />
      </div>
    </section>
  );
}
