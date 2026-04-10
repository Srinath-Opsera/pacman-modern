import type { System, World } from "../core/ECSWorld";
import type { EventBus } from "../core/EventBus";

export interface LivesState {
  lives: number;
  extraLifeAwarded: boolean;
}

const EXTRA_LIFE_THRESHOLD = 10000;

export class LivesSystem implements System {
  readonly name = "LivesSystem";
  readonly state: LivesState;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.state = { lives: 3, extraLifeAwarded: false };

    eventBus.on("ghost-collision", () => {
      this.state.lives--;
      if (this.state.lives <= 0) {
        this.state.lives = 0;
        this.eventBus.emit("game-over", {});
      } else {
        this.eventBus.emit("life-lost", { livesRemaining: this.state.lives });
      }
    });

    eventBus.on<{ score: number }>("score-changed", (event) => {
      if (!this.state.extraLifeAwarded && event.score >= EXTRA_LIFE_THRESHOLD) {
        this.state.extraLifeAwarded = true;
        this.state.lives++;
        this.eventBus.emit("extra-life", { lives: this.state.lives });
      }
    });
  }

  update(_world: World, _deltaTime: number): void {
    // Lives updates are event-driven
  }
}
