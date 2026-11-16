import { cloneState, PLAYER_LABELS, PLAYERS } from './gameState.js';

export const HUMAN_PITS = [0, 1, 2, 3, 4, 5];
export const AI_PITS = [6, 7, 8, 9, 10, 11];

export function getPlayerPits(player) {
  return player === PLAYERS.HUMAN ? HUMAN_PITS : AI_PITS;
}

export function getOpponent(player) {
  return player === PLAYERS.HUMAN ? PLAYERS.AI : PLAYERS.HUMAN;
}

export function isPlayerPit(index, player) {
  return getPlayerPits(player).includes(index);
}

export function getValidMoves(state, player = state.currentPlayer) {
  return getPlayerPits(player).filter((index) => state.pits[index] > 0);
}

export function isGameOver(state) {
  return HUMAN_PITS.every((index) => state.pits[index] === 0) || AI_PITS.every((index) => state.pits[index] === 0);
}

function collectRemainingStones(next) {
  const humanRemaining = HUMAN_PITS.reduce((sum, index) => sum + next.pits[index], 0);
  const aiRemaining = AI_PITS.reduce((sum, index) => sum + next.pits[index], 0);

  HUMAN_PITS.forEach((index) => {
    next.pits[index] = 0;
  });
  AI_PITS.forEach((index) => {
    next.pits[index] = 0;
  });

  next.stores[PLAYERS.HUMAN] += humanRemaining;
  next.stores[PLAYERS.AI] += aiRemaining;
}

function finishGame(next) {
  collectRemainingStones(next);
  const humanScore = next.stores[PLAYERS.HUMAN];
  const aiScore = next.stores[PLAYERS.AI];

  next.status = 'finished';
  if (humanScore > aiScore) next.winner = PLAYERS.HUMAN;
  else if (aiScore > humanScore) next.winner = PLAYERS.AI;
  else next.winner = 'draw';
}

function getNextSlot(slot, player) {
  const current = slot.type === 'pit' ? slot.index : player === PLAYERS.HUMAN ? 'humanStore' : 'aiStore';
  const order =
    player === PLAYERS.HUMAN
      ? [1, 2, 3, 4, 5, 'humanStore', 6, 7, 8, 9, 10, 11, 0]
      : [7, 8, 9, 10, 11, 'aiStore', 0, 1, 2, 3, 4, 5, 6];

  const position = order.indexOf(current);
  const value = order[(position + 1) % order.length];
  return typeof value === 'number' ? { type: 'pit', index: value } : { type: 'store', owner: player };
}

export function applyMove(state, pitIndex) {
  if (state.status !== 'playing') return state;
  if (!isPlayerPit(pitIndex, state.currentPlayer) || state.pits[pitIndex] === 0) return state;

  const next = cloneState(state);
  const player = state.currentPlayer;
  const opponent = getOpponent(player);
  let stones = next.pits[pitIndex];
  let slot = { type: 'pit', index: pitIndex };
  let gained = 0;

  if (stones > 1) {
    next.pits[pitIndex] = 1;
    stones -= 1;
  } else {
    next.pits[pitIndex] = 0;
  }

  // Basit Türk Mangala dağıtımı:
  // Seçilen kuyuda birden fazla taş varsa biri orada kalır; kalanlar saat yönünde ilerler.
  // MVP'de rakibin hazinesi pas geçilir; bu klasik Mancala ailesine yakın, anlaşılır bir akıştır.
  while (stones > 0) {
    slot = getNextSlot(slot, player);
    if (slot.type === 'store') {
      next.stores[player] += 1;
      gained += 1;
    } else {
      next.pits[slot.index] += 1;
    }
    stones -= 1;
  }

  let extraTurn = slot.type === 'store' && slot.owner === player;
  let capture = 0;

  // Yakalama kuralı: Son taş oyuncunun boş kuyusuna düşerse karşı kuyudaki taşlar hazineye alınır.
  // Karşı kuyu hesabı simetriktir: 0-11, 1-10, 2-9 gibi.
  if (slot.type === 'pit' && isPlayerPit(slot.index, player) && next.pits[slot.index] === 1) {
    const oppositeIndex = 11 - slot.index;
    if (next.pits[oppositeIndex] > 0) {
      capture = next.pits[oppositeIndex] + 1;
      next.pits[oppositeIndex] = 0;
      next.pits[slot.index] = 0;
      next.stores[player] += capture;
      gained += capture;
    }
  }

  // Türk Mangala'daki çift yapma fikrinin sade yorumu:
  // Son taş rakip kuyusunda çift sayı oluşturursa o kuyudaki taşlar hazineye alınır.
  if (slot.type === 'pit' && isPlayerPit(slot.index, opponent) && next.pits[slot.index] > 0 && next.pits[slot.index] % 2 === 0) {
    capture = next.pits[slot.index];
    next.pits[slot.index] = 0;
    next.stores[player] += capture;
    gained += capture;
  }

  const playedLabel = PLAYER_LABELS[player];
  next.history = [
    `${playedLabel}: ${pitIndex + 1}. kuyudan oynadı${gained ? `, ${gained} taş kazandı` : ''}${extraTurn ? ', bir hamle daha' : ''}.`,
    ...next.history,
  ].slice(0, 8);

  next.lastMove = { pitIndex, player, gained, extraTurn };
  next.currentPlayer = extraTurn ? player : opponent;
  if (!extraTurn) next.turnCount += 1;

  if (isGameOver(next)) finishGame(next);
  return next;
}

export function previewMove(state, pitIndex) {
  return applyMove({ ...state, history: [] }, pitIndex);
}
