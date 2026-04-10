export enum InputCommand {
  NONE = "none",
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  PAUSE = "pause",
}

const SWIPE_THRESHOLD = 30;

export class InputManager {
  private currentCommand: InputCommand = InputCommand.NONE;
  private queuedCommand: InputCommand = InputCommand.NONE;
  private pointerStart: { x: number; y: number } | null = null;

  constructor() {
    this.setupKeyboard();
    this.setupPointer();
  }

  poll(): InputCommand {
    const cmd = this.queuedCommand;
    this.queuedCommand = InputCommand.NONE;
    this.currentCommand = cmd !== InputCommand.NONE ? cmd : this.currentCommand;
    return this.currentCommand;
  }

  getCurrentDirection(): InputCommand {
    return this.currentCommand;
  }

  reset(): void {
    this.currentCommand = InputCommand.NONE;
    this.queuedCommand = InputCommand.NONE;
  }

  private setupKeyboard(): void {
    document.addEventListener("keydown", (e) => {
      const cmd = this.keyToCommand(e.key);
      if (cmd !== InputCommand.NONE) {
        this.queuedCommand = cmd;
        e.preventDefault();
      }
    });
  }

  private keyToCommand(key: string): InputCommand {
    switch (key) {
      case "ArrowUp":
      case "w":
      case "W":
        return InputCommand.UP;
      case "ArrowDown":
      case "s":
      case "S":
        return InputCommand.DOWN;
      case "ArrowLeft":
      case "a":
      case "A":
        return InputCommand.LEFT;
      case "ArrowRight":
      case "d":
      case "D":
        return InputCommand.RIGHT;
      case "Escape":
      case "p":
      case "P":
        return InputCommand.PAUSE;
      default:
        return InputCommand.NONE;
    }
  }

  private setupPointer(): void {
    document.addEventListener("pointerdown", (e) => {
      this.pointerStart = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener("pointerup", (e) => {
      if (!this.pointerStart) return;

      const dx = e.clientX - this.pointerStart.x;
      const dy = e.clientY - this.pointerStart.y;
      this.pointerStart = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.queuedCommand = dx > 0 ? InputCommand.RIGHT : InputCommand.LEFT;
      } else {
        this.queuedCommand = dy > 0 ? InputCommand.DOWN : InputCommand.UP;
      }
    });
  }

  injectCommand(command: InputCommand): void {
    this.queuedCommand = command;
  }
}
