export default class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  bind() {
    this.scene.input.keyboard.on("keydown", this.handleKeydown, this);
  }

  destroy() {
    this.scene.input.keyboard.off("keydown", this.handleKeydown, this);
  }

  handleKeydown(event) {
    const map = {
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
    };

    if (event.code === "Space") {
      this.scene.events.emit("counter-input");
      return;
    }

    if (map[event.key]) {
      this.scene.events.emit("defense-input", map[event.key]);
    }
  }
}
