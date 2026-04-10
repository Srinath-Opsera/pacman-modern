import type { EventBus } from "../core/EventBus";

export class HUD {
  private scoreElement: HTMLElement | null;
  private livesElement: HTMLElement | null;
  private levelElement: HTMLElement | null;
  private score = 0;
  private lives = 3;
  private level = 1;
  private muted = false;

  constructor(eventBus: EventBus) {
    this.scoreElement = document.getElementById("hud-score");
    this.livesElement = document.getElementById("hud-lives");
    this.levelElement = document.getElementById("hud-level");

    this.addControlButtons(eventBus);
    this.render();

    eventBus.on<{ score: number }>("score-changed", (event) => {
      this.score = event.score;
      this.renderScore();
    });

    eventBus.on<{ livesRemaining: number }>("life-lost", (event) => {
      this.lives = event.livesRemaining;
      this.renderLives();
    });

    eventBus.on<{ lives: number }>("extra-life", (event) => {
      this.lives = event.lives;
      this.renderLives();
    });

    eventBus.on<{ level: number }>("level-advanced", (event) => {
      this.level = event.level;
      this.renderLevel();
    });
  }

  private render(): void {
    this.renderScore();
    this.renderLives();
    this.renderLevel();
  }

  private renderScore(): void {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${this.score}`;
    }
  }

  private renderLives(): void {
    if (this.livesElement) {
      const icons = "\u{1F7E1}".repeat(this.lives);
      this.livesElement.textContent = `Lives: ${icons}`;
    }
  }

  private renderLevel(): void {
    if (this.levelElement) {
      this.levelElement.textContent = `Level: ${this.level}`;
    }
  }

  private addControlButtons(eventBus: EventBus): void {
    const overlay = document.getElementById("hud-overlay");
    if (!overlay) return;

    const cameraBtn = document.createElement("button");
    cameraBtn.className = "hud-btn";
    cameraBtn.textContent = "\u{1F3A5}";
    cameraBtn.title = "Toggle Camera (C)";
    cameraBtn.style.cssText = this.buttonStyle();
    cameraBtn.addEventListener("click", () => {
      eventBus.emit("camera-cycle", {});
    });
    overlay.appendChild(cameraBtn);

    const soundBtn = document.createElement("button");
    soundBtn.className = "hud-btn";
    soundBtn.textContent = "\u{1F50A}";
    soundBtn.title = "Toggle Sound";
    soundBtn.style.cssText = this.buttonStyle();
    soundBtn.addEventListener("click", () => {
      this.muted = !this.muted;
      soundBtn.textContent = this.muted ? "\u{1F507}" : "\u{1F50A}";
      eventBus.emit("sound-toggle", { muted: this.muted });
    });
    overlay.appendChild(soundBtn);
  }

  private buttonStyle(): string {
    return `
      pointer-events: auto; background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
      color: white; font-size: 20px; width: 40px; height: 40px;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center;
    `;
  }

  getScore(): number {
    return this.score;
  }

  getLives(): number {
    return this.lives;
  }

  getLevel(): number {
    return this.level;
  }

  isMuted(): boolean {
    return this.muted;
  }
}
