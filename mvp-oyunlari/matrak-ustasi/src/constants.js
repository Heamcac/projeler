export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const DIRECTIONS = ["left", "right", "up", "down"];

export const DIRECTION_LABELS = {
  left: "Sol",
  right: "Sağ",
  up: "Yukarı",
  down: "Aşağı",
};

export const DIRECTION_SYMBOLS = {
  left: "<",
  right: ">",
  up: "^",
  down: "v",
};

export const DIFFICULTIES = {
  kolay: {
    label: "Kolay",
    beatMs: 1750,
    defenseWindowMs: 980,
    showMs: 720,
    movesPerRound: 8,
  },
  orta: {
    label: "Orta",
    beatMs: 1350,
    defenseWindowMs: 780,
    showMs: 560,
    movesPerRound: 9,
  },
  zor: {
    label: "Zor",
    beatMs: 1050,
    defenseWindowMs: 620,
    showMs: 440,
    movesPerRound: 10,
  },
  usta: {
    label: "Usta",
    beatMs: 900,
    defenseWindowMs: 540,
    showMs: 360,
    movesPerRound: 11,
    note: "MVP notu: fake hamleler burada eklenebilir.",
  },
};

export const COLORS = {
  parchment: "#f6e8c8",
  darkInk: "#2c2118",
  wood: "#8f5d33",
  deepRed: "#8d2d24",
  teal: "#2f7472",
  gold: "#e5b758",
  green: "#4f9d69",
  cream: "#fff4d4",
};
