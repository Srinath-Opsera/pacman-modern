import type { EventBus } from "../core/EventBus";

export enum ScreenState {
  HOME = "home",
  PLAYING = "playing",
  PAUSED = "paused",
  GAME_OVER = "game-over",
  LEVEL_TRANSITION = "level-transition",
  SETTINGS = "settings",
}

export class GameScreens {
  private overlay: HTMLDivElement;
  private state: ScreenState = ScreenState.HOME;
  private eventBus: EventBus;
  private finalScore = 0;
  private finalLevel = 1;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.overlay = document.createElement("div");
    this.overlay.id = "screen-overlay";
    this.overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 200;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.75); font-family: 'Courier New', monospace;
      color: white; text-align: center;
    `;
    document.body.appendChild(this.overlay);

    eventBus.on("game-over", () => this.showGameOver());
    eventBus.on<{ level: number }>("level-advanced", (event) => {
      this.showLevelTransition(event.level);
    });
    eventBus.on<{ score: number }>("score-changed", (event) => {
      this.finalScore = event.score;
    });

    this.showHome();
  }

  showHome(): void {
    this.state = ScreenState.HOME;
    this.overlay.style.display = "flex";
    this.overlay.innerHTML = `
      <div>
        <h1 style="font-size: 48px; color: #ffcc00; margin-bottom: 20px;">PAC-MAN 3D</h1>
        <p style="margin-bottom: 30px; color: #aaa;">A modern 3D remake</p>
        <button id="btn-play" style="${this.btnStyle("#ffcc00", "#000")}">PLAY</button>
        <br><br>
        <button id="btn-settings" style="${this.btnStyle("#444", "#fff")}">SETTINGS</button>
      </div>
    `;
    document.getElementById("btn-play")?.addEventListener("click", () => {
      this.startGame();
    });
    document.getElementById("btn-settings")?.addEventListener("click", () => {
      this.showSettings();
    });
  }

  startGame(): void {
    this.state = ScreenState.PLAYING;
    this.overlay.style.display = "none";
    this.eventBus.emit("game-start", {});
  }

  showGameOver(): void {
    this.state = ScreenState.GAME_OVER;
    this.overlay.style.display = "flex";
    this.overlay.innerHTML = `
      <div>
        <h1 style="font-size: 48px; color: #ff0000; margin-bottom: 20px;">GAME OVER</h1>
        <p style="font-size: 24px; margin-bottom: 10px;">Score: ${this.finalScore}</p>
        <p style="font-size: 18px; margin-bottom: 30px; color: #aaa;">Level: ${this.finalLevel}</p>
        <button id="btn-replay" style="${this.btnStyle("#ffcc00", "#000")}">PLAY AGAIN</button>
      </div>
    `;
    document.getElementById("btn-replay")?.addEventListener("click", () => {
      this.eventBus.emit("game-restart", {});
      this.startGame();
    });
  }

  showLevelTransition(level: number): void {
    this.finalLevel = level;
    this.state = ScreenState.LEVEL_TRANSITION;
    this.overlay.style.display = "flex";
    this.overlay.innerHTML = `
      <div style="animation: fadeInOut 2s ease-in-out;">
        <h1 style="font-size: 64px; color: #ffcc00;">LEVEL ${level}</h1>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: scale(0.5); }
        30% { opacity: 1; transform: scale(1.1); }
        70% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.9); }
      }
    `;
    this.overlay.appendChild(style);

    setTimeout(() => {
      if (this.state === ScreenState.LEVEL_TRANSITION) {
        this.state = ScreenState.PLAYING;
        this.overlay.style.display = "none";
      }
    }, 2000);
  }

  showSettings(): void {
    this.state = ScreenState.SETTINGS;
    this.overlay.style.display = "flex";
    this.overlay.innerHTML = `
      <div>
        <h2 style="font-size: 32px; margin-bottom: 20px;">SETTINGS</h2>
        <label style="display: block; margin: 10px 0;">Master Volume
          <input type="range" id="vol-master" min="0" max="100" value="100" style="width: 200px;">
        </label>
        <label style="display: block; margin: 10px 0;">SFX Volume
          <input type="range" id="vol-sfx" min="0" max="100" value="80" style="width: 200px;">
        </label>
        <label style="display: block; margin: 10px 0;">Music Volume
          <input type="range" id="vol-music" min="0" max="100" value="50" style="width: 200px;">
        </label>
        <br>
        <button id="btn-back" style="${this.btnStyle("#444", "#fff")}">BACK</button>
      </div>
    `;

    document.getElementById("vol-master")?.addEventListener("input", (e) => {
      const val = Number((e.target as HTMLInputElement).value) / 100;
      this.eventBus.emit("volume-change", { type: "master", value: val });
    });
    document.getElementById("vol-sfx")?.addEventListener("input", (e) => {
      const val = Number((e.target as HTMLInputElement).value) / 100;
      this.eventBus.emit("volume-change", { type: "sfx", value: val });
    });
    document.getElementById("vol-music")?.addEventListener("input", (e) => {
      const val = Number((e.target as HTMLInputElement).value) / 100;
      this.eventBus.emit("volume-change", { type: "music", value: val });
    });
    document.getElementById("btn-back")?.addEventListener("click", () => {
      this.showHome();
    });
  }

  private btnStyle(bg: string, color: string): string {
    return `
      padding: 12px 32px; font-size: 20px; font-family: 'Courier New', monospace;
      font-weight: bold; border: none; border-radius: 8px; cursor: pointer;
      background: ${bg}; color: ${color};
    `;
  }

  getState(): ScreenState {
    return this.state;
  }

  destroy(): void {
    this.overlay.remove();
  }
}
