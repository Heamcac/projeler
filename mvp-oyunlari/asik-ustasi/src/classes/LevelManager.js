const levels = [
  {
    shots: 4,
    targets: [
      { x: 270, y: 360, mass: 1 },
      { x: 230, y: 330, mass: 1 },
      { x: 310, y: 330, mass: 1 }
    ],
    obstacles: []
  },
  {
    shots: 4,
    targets: [
      { x: 210, y: 300, mass: 1 },
      { x: 270, y: 355, mass: 1 },
      { x: 330, y: 300, mass: 1 },
      { x: 270, y: 260, mass: 1.2 }
    ],
    obstacles: []
  },
  {
    shots: 5,
    targets: [
      { x: 180, y: 310, mass: 1 },
      { x: 240, y: 310, mass: 1 },
      { x: 300, y: 310, mass: 1 },
      { x: 360, y: 310, mass: 1 }
    ],
    obstacles: [{ x: 270, y: 430, w: 210, h: 18, angle: 0 }]
  },
  {
    shots: 5,
    targets: [
      { x: 180, y: 250, mass: 1.5 },
      { x: 360, y: 250, mass: 1.5 },
      { x: 270, y: 350, mass: 1.1 }
    ],
    obstacles: [{ x: 270, y: 455, w: 130, h: 22, angle: -18 }]
  },
  {
    shots: 5,
    targets: [
      { x: 200, y: 245, mass: 1 },
      { x: 255, y: 290, mass: 1 },
      { x: 310, y: 335, mass: 1 },
      { x: 365, y: 380, mass: 1 }
    ],
    obstacles: [{ x: 305, y: 430, w: 160, h: 20, angle: 25 }]
  },
  {
    shots: 5,
    targets: [
      { x: 170, y: 300, mass: 1 },
      { x: 220, y: 255, mass: 1.3 },
      { x: 270, y: 300, mass: 1.6 },
      { x: 320, y: 255, mass: 1.3 },
      { x: 370, y: 300, mass: 1 }
    ],
    obstacles: []
  },
  {
    shots: 6,
    targets: [
      { x: 180, y: 235, mass: 1 },
      { x: 360, y: 235, mass: 1 },
      { x: 180, y: 390, mass: 1 },
      { x: 360, y: 390, mass: 1 }
    ],
    obstacles: [
      { x: 270, y: 310, w: 170, h: 18, angle: 0 },
      { x: 270, y: 470, w: 170, h: 18, angle: 0 }
    ]
  },
  {
    shots: 6,
    targets: [
      { x: 270, y: 225, mass: 2 },
      { x: 210, y: 285, mass: 1 },
      { x: 330, y: 285, mass: 1 },
      { x: 240, y: 345, mass: 1 },
      { x: 300, y: 345, mass: 1 }
    ],
    obstacles: [{ x: 270, y: 430, w: 80, h: 80, angle: 45 }]
  },
  {
    shots: 6,
    targets: [
      { x: 150, y: 250, mass: 1.2 },
      { x: 220, y: 310, mass: 1.2 },
      { x: 320, y: 310, mass: 1.2 },
      { x: 390, y: 250, mass: 1.2 },
      { x: 270, y: 220, mass: 1.8 }
    ],
    obstacles: [{ x: 270, y: 390, w: 260, h: 16, angle: -10 }]
  },
  {
    shots: 6,
    targets: [
      { x: 190, y: 230, mass: 1 },
      { x: 235, y: 275, mass: 1 },
      { x: 280, y: 320, mass: 1 },
      { x: 325, y: 365, mass: 1 },
      { x: 370, y: 410, mass: 1 }
    ],
    obstacles: [
      { x: 205, y: 385, w: 120, h: 16, angle: 55 },
      { x: 350, y: 275, w: 120, h: 16, angle: 55 }
    ]
  },
  {
    shots: 7,
    targets: [
      { x: 165, y: 260, mass: 1 },
      { x: 215, y: 260, mass: 1 },
      { x: 265, y: 260, mass: 1 },
      { x: 315, y: 260, mass: 1 },
      { x: 365, y: 260, mass: 1 },
      { x: 265, y: 330, mass: 2.2 }
    ],
    obstacles: [{ x: 270, y: 455, w: 220, h: 20, angle: 0 }]
  },
  {
    shots: 7,
    targets: [
      { x: 190, y: 240, mass: 1.4 },
      { x: 270, y: 240, mass: 1.4 },
      { x: 350, y: 240, mass: 1.4 },
      { x: 230, y: 320, mass: 1 },
      { x: 310, y: 320, mass: 1 }
    ],
    obstacles: [
      { x: 185, y: 405, w: 145, h: 18, angle: -22 },
      { x: 355, y: 405, w: 145, h: 18, angle: 22 }
    ]
  },
  {
    shots: 7,
    targets: [
      { x: 160, y: 230, mass: 1 },
      { x: 220, y: 295, mass: 1.1 },
      { x: 280, y: 360, mass: 1.2 },
      { x: 340, y: 295, mass: 1.1 },
      { x: 400, y: 230, mass: 1 },
      { x: 280, y: 240, mass: 2 }
    ],
    obstacles: [{ x: 270, y: 455, w: 90, h: 145, angle: 0 }]
  },
  {
    shots: 8,
    targets: [
      { x: 180, y: 230, mass: 1 },
      { x: 235, y: 230, mass: 1 },
      { x: 290, y: 230, mass: 1 },
      { x: 345, y: 230, mass: 1 },
      { x: 210, y: 300, mass: 1.7 },
      { x: 330, y: 300, mass: 1.7 },
      { x: 270, y: 370, mass: 2.2 }
    ],
    obstacles: [
      { x: 150, y: 420, w: 150, h: 18, angle: 30 },
      { x: 390, y: 420, w: 150, h: 18, angle: -30 }
    ]
  },
  {
    shots: 8,
    targets: [
      { x: 270, y: 205, mass: 2.4 },
      { x: 210, y: 260, mass: 1.6 },
      { x: 330, y: 260, mass: 1.6 },
      { x: 170, y: 335, mass: 1 },
      { x: 230, y: 365, mass: 1 },
      { x: 310, y: 365, mass: 1 },
      { x: 370, y: 335, mass: 1 }
    ],
    obstacles: [
      { x: 270, y: 455, w: 260, h: 18, angle: 0 },
      { x: 270, y: 520, w: 120, h: 18, angle: 0 }
    ]
  }
];

export default class LevelManager {
  static totalLevels = levels.length;

  static getLevel(index) {
    return levels[Math.max(0, Math.min(levels.length - 1, index - 1))];
  }
}
