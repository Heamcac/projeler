import { useEffect, useMemo, useRef, useState } from 'react';
import Board from '../components/Board.jsx';
import GameInfo from '../components/GameInfo.jsx';
import MoveHistory from '../components/MoveHistory.jsx';
import { chooseAiMove } from '../logic/aiPlayer.js';
import { createInitialState, PLAYERS } from '../logic/gameState.js';
import { applyMove } from '../logic/mangalaRules.js';
import { recordGame } from '../storage/storage.js';

function buildResult(state) {
  const humanScore = state.stores[PLAYERS.HUMAN];
  const aiScore = state.stores[PLAYERS.AI];
  return {
    outcome: humanScore > aiScore ? 'win' : aiScore > humanScore ? 'loss' : 'draw',
    humanScore,
    aiScore,
    difficulty: state.difficulty,
  };
}

export default function GamePage({ difficulty, onResult, onBack }) {
  const [state, setState] = useState(() => createInitialState(difficulty));
  const [thinking, setThinking] = useState(false);
  const [paused, setPaused] = useState(false);
  const recordedRef = useRef(false);

  const resetGame = () => {
    recordedRef.current = false;
    setThinking(false);
    setPaused(false);
    setState(createInitialState(difficulty));
  };

  const handlePitSelect = (pitIndex) => {
    if (paused) return;
    setState((current) => applyMove(current, pitIndex));
  };

  useEffect(() => {
    if (paused) return undefined;
    if (state.status === 'finished' && !recordedRef.current) {
      recordedRef.current = true;
      const result = buildResult(state);
      recordGame(result);
      const timer = setTimeout(() => onResult(result), 700);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onResult, paused, state]);

  useEffect(() => {
    if (paused || state.status !== 'playing' || state.currentPlayer !== PLAYERS.AI) return undefined;

    setThinking(true);
    const timer = setTimeout(() => {
      setState((current) => {
        const move = chooseAiMove(current, difficulty);
        return move === null ? current : applyMove(current, move);
      });
      setThinking(false);
    }, 760);

    return () => clearTimeout(timer);
  }, [difficulty, paused, state]);

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key !== 'Escape' && event.key.toLowerCase() !== 'p') return;
      event.preventDefault();
      setPaused((value) => !value);
      setThinking(false);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const layoutClass = useMemo(
    () => `game-page${thinking ? ' is-thinking' : ''}${paused ? ' is-paused' : ''}`,
    [paused, thinking]
  );

  return (
    <main className={layoutClass}>
      <GameInfo state={state} thinking={thinking} onRestart={resetGame} onBack={onBack} />
      <Board state={state} thinking={thinking} paused={paused} onPitSelect={handlePitSelect} />
      <MoveHistory history={state.history} />
      {paused && (
        <div className="pause-overlay" role="status" aria-live="polite">
          <strong>Duraklatıldı</strong>
          <span>Devam etmek için Esc veya P</span>
        </div>
      )}
    </main>
  );
}
