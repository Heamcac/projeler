export const PLAYERS = {
  HUMAN: 'human',
  AI: 'ai',
};

export const PLAYER_LABELS = {
  [PLAYERS.HUMAN]: 'Oyuncu',
  [PLAYERS.AI]: 'Rakip',
};

export function createInitialState(difficulty = 'orta') {
  return {
    pits: Array(12).fill(4),
    stores: {
      [PLAYERS.HUMAN]: 0,
      [PLAYERS.AI]: 0,
    },
    currentPlayer: PLAYERS.HUMAN,
    difficulty,
    history: [],
    status: 'playing',
    winner: null,
    lastMove: null,
    turnCount: 1,
  };
}

export function cloneState(state) {
  return {
    ...state,
    pits: [...state.pits],
    stores: { ...state.stores },
    history: [...state.history],
    lastMove: state.lastMove ? { ...state.lastMove } : null,
  };
}
