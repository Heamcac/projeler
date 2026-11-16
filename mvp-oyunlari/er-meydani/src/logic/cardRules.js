export const ACTION_CARDS = [
  {
    id: 'kavrama',
    name: 'Kavrama',
    type: 'control',
    cost: 14,
    basePoints: 2,
    description: 'Denge Bozma hamlesini kilitler.',
    strongAgainst: ['denge-bozma']
  },
  {
    id: 'celme',
    name: 'Celme',
    type: 'aggressive',
    cost: 18,
    basePoints: 3,
    description: 'Kavrama girisimini bozar.',
    strongAgainst: ['kavrama']
  },
  {
    id: 'savunma',
    name: 'Savunma',
    type: 'defense',
    cost: 10,
    basePoints: 1,
    description: 'Celme baskisini sogutur.',
    strongAgainst: ['celme']
  },
  {
    id: 'denge-bozma',
    name: 'Denge Bozma',
    type: 'control',
    cost: 16,
    basePoints: 2,
    description: 'Rakibin durusunu bozar.',
    strongAgainst: []
  },
  {
    id: 'karsi-hamle',
    name: 'Karsi Hamle',
    type: 'counter',
    cost: 15,
    basePoints: 2,
    description: 'Agresif hamlelere cevap verir.',
    strongAgainst: ['celme']
  },
  {
    id: 'dayan',
    name: 'Dayan',
    type: 'recover',
    cost: 0,
    basePoints: 0,
    description: 'Enerji toplar ve dengeyi korur.',
    strongAgainst: []
  }
];

export function getCard(cardId) {
  return ACTION_CARDS.find((card) => card.id === cardId);
}

export function isStrongAgainst(attackerId, defenderId) {
  const attacker = getCard(attackerId);
  const defender = getCard(defenderId);
  if (!attacker || !defender) return false;
  return attacker.strongAgainst.includes(defender.id) || (attacker.id === 'karsi-hamle' && defender.type === 'aggressive');
}

export function getRoundStance(roundNumber) {
  const stances = ['kavrama', 'denge-bozma', 'celme', 'savunma'];
  return stances[(roundNumber - 1) % stances.length];
}
