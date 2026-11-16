import { getCard, isStrongAgainst } from './cardRules';

export const MAX_ROUNDS = 3;
export const ROUND_SECONDS = 24;

export const WRESTLERS = [
  { id: 'karaca', name: 'Karaca Ali', title: 'Cevik Pehlivan', power: 4, balance: 7, stamina: 5, technique: 6 },
  { id: 'demir', name: 'Demir Efe', title: 'Guc Ustasi', power: 8, balance: 4, stamina: 6, technique: 4 },
  { id: 'yigit', name: 'Yigit Can', title: 'Teknik Usta', power: 5, balance: 5, stamina: 5, technique: 9 }
];

export function createOpponent(difficulty) {
  const level = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
  return {
    name: difficulty === 'hard' ? 'Baspehlivan Riza' : difficulty === 'medium' ? 'Sari Osman' : 'Genclik Hasan',
    energy: 96 + level * 4,
    dayanıklılık: 70 + level * 6,
    denge: 68 + level * 7,
    güç: 68 + level * 8,
    teknik: 58 + level * 6,
    skor: 0
  };
}

export function applyMove({ player, opponent, playerCardId, opponentCardId, timingSuccess, save }) {
  const playerCard = getCard(playerCardId);
  const opponentCard = getCard(opponentCardId);
  const nextPlayer = { ...player };
  const nextOpponent = { ...opponent };

  const durabilityDiscount = Math.min(10, Math.floor(nextPlayer.dayanıklılık / 18));
  nextPlayer.energy = clamp(nextPlayer.energy - Math.max(4, playerCard.cost - durabilityDiscount), 0, 120);
  nextOpponent.energy = clamp(nextOpponent.energy - Math.max(3, opponentCard.cost - Math.floor(nextOpponent.dayanıklılık / 22)), 0, 120);

  if (playerCard.id === 'dayan') {
    nextPlayer.energy = clamp(nextPlayer.energy + 24, 0, 120);
    nextPlayer.denge = clamp(nextPlayer.denge + 5, 0, 120);
  }

  if (opponentCard.id === 'dayan') {
    nextOpponent.energy = clamp(nextOpponent.energy + 20, 0, 120);
    nextOpponent.denge = clamp(nextOpponent.denge + 4, 0, 120);
  }

  const playerAdvantage = isStrongAgainst(playerCardId, opponentCardId);
  const opponentAdvantage = isStrongAgainst(opponentCardId, playerCardId);
  let message = 'Hamle tartildi.';
  let playerPoints = 0;
  let opponentPoints = 0;

  if (timingSuccess && playerCard.id !== 'dayan') {
    playerPoints += playerCard.basePoints + Math.floor(nextPlayer.güç / 34) + Math.floor(save.gucSeviyesi / 2);
    if (playerAdvantage) playerPoints += 2;
    nextOpponent.denge = clamp(nextOpponent.denge - (playerAdvantage ? 12 : 7), 0, 120);
    message = 'Usta Hamle!';
  } else if (!timingSuccess && playerCard.id !== 'dayan') {
    nextPlayer.denge = clamp(nextPlayer.denge - Math.max(4, 12 - Math.floor(nextPlayer.denge / 22)), 0, 120);
    opponentPoints += opponentAdvantage ? 2 : 1;
    message = 'Denge Kaybettin!';
  } else {
    message = 'Nefes topladin.';
  }

  if (opponentAdvantage && opponentCard.id !== 'dayan') {
    opponentPoints += opponentCard.basePoints + 1;
    nextPlayer.denge = clamp(nextPlayer.denge - Math.max(3, 9 - Math.floor(save.dengeSeviyesi / 2)), 0, 120);
  }

  if (nextOpponent.energy < 18 && playerPoints > 0) playerPoints += 1;
  if (nextPlayer.energy < 16 && opponentPoints > 0) opponentPoints += 1;

  nextPlayer.skor += playerPoints;
  nextOpponent.skor += opponentPoints;

  return {
    player: nextPlayer,
    opponent: nextOpponent,
    playerPoints,
    opponentPoints,
    message,
    playerAdvantage,
    opponentAdvantage
  };
}

export function getRewards(won) {
  return {
    altin: won ? 55 : 25,
    xp: won ? 35 : 16
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
