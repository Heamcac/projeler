export default class ComboSystem {
  constructor() {
    this.combo = 0;
    this.counterReady = false;
  }

  registerSuccess() {
    this.combo += 1;
    if (this.combo >= 5) {
      this.counterReady = true;
    }
    return this.combo;
  }

  registerFailure() {
    this.combo = 0;
    this.counterReady = false;
  }

  consumeCounter() {
    if (!this.counterReady) {
      return false;
    }
    this.counterReady = false;
    this.combo = 0;
    return true;
  }
}
