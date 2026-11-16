import { ACTION_CARDS, isStrongAgainst } from './cardRules';

const cardIds = ACTION_CARDS.map((card) => card.id);

function randomCard() {
  return cardIds[Math.floor(Math.random() * cardIds.length)];
}

function counterFor(playerCardId) {
  return ACTION_CARDS.find((card) => isStrongAgainst(card.id, playerCardId))?.id || randomCard();
}

export function chooseOpponentMove(difficulty, playerHistory = [], opponentState = {}) {
  if (opponentState.energy < 18 && Math.random() < 0.45) return 'dayan';

  if (difficulty === 'easy') {
    return randomCard();
  }

  const lastMove = playerHistory[playerHistory.length - 1];
  if (difficulty === 'medium') {
    if (lastMove && Math.random() < 0.62) return counterFor(lastMove);
    return randomCard();
  }

  const recent = playerHistory.slice(-3);
  const favorite = recent
    .filter(Boolean)
    .sort((a, b) => recent.filter((x) => x === b).length - recent.filter((x) => x === a).length)[0];

  if (favorite && Math.random() < 0.72) return counterFor(favorite);
  if (Math.random() < 0.18) return 'savunma';
  if (Math.random() < 0.18) return 'denge-bozma';
  return randomCard();
}
