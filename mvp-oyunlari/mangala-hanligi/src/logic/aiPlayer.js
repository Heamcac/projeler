import { applyMove, getOpponent, getValidMoves, previewMove } from './mangalaRules.js';
import { PLAYERS } from './gameState.js';

function scoreState(state, player) {
  const opponent = getOpponent(player);
  const storeScore = state.stores[player] - state.stores[opponent];
  const mobility = getValidMoves(state, player).length - getValidMoves(state, opponent).length;
  const extraTurnBonus = state.currentPlayer === player ? 2 : 0;
  return storeScore * 6 + mobility + extraTurnBonus;
}

function randomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

function bestImmediateMove(state, player) {
  const moves = getValidMoves(state, player);
  let best = moves[0];
  let bestGain = -Infinity;

  moves.forEach((move) => {
    const next = previewMove(state, move);
    const gain = next.stores[player] - state.stores[player] + (next.currentPlayer === player ? 1 : 0);
    if (gain > bestGain) {
      bestGain = gain;
      best = move;
    }
  });

  return best;
}

function bestLookAheadMove(state, player) {
  const moves = getValidMoves(state, player);
  let best = moves[0];
  let bestScore = -Infinity;

  moves.forEach((move) => {
    const afterAi = previewMove(state, move);
    let projected = scoreState(afterAi, player);

    if (afterAi.status === 'playing' && afterAi.currentPlayer !== player) {
      const humanReply = bestImmediateMove(afterAi, PLAYERS.HUMAN);
      if (humanReply !== undefined) {
        projected = scoreState(applyMove(afterAi, humanReply), player);
      }
    }

    if (projected > bestScore) {
      bestScore = projected;
      best = move;
    }
  });

  return best;
}

export function chooseAiMove(state, difficulty = 'orta') {
  const moves = getValidMoves(state, PLAYERS.AI);
  if (moves.length === 0) return null;

  if (difficulty === 'kolay') return randomMove(moves);
  if (difficulty === 'zor') return bestLookAheadMove(state, PLAYERS.AI);
  return bestImmediateMove(state, PLAYERS.AI);
}
