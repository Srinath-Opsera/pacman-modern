import type { System, World } from "../core/ECSWorld";
import type { EventBus } from "../core/EventBus";
import type { DotEatenEvent } from "./CollisionSystem";

export interface GameState {
  score: number;
  ghostChainMultiplier: number;
}

export class ScoreSystem implements System {
  readonly name = "ScoreSystem";
  readonly state: GameState;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.state = { score: 0, ghostChainMultiplier: 1 };

    eventBus.on<DotEatenEvent>("dot-eaten", (event) => {
      if (event.isPowerPellet) {
        this.state.score += 50;
        this.state.ghostChainMultiplier = 1;
      } else {
        this.state.score += 10;
      }
      this.eventBus.emit("score-changed", { score: this.state.score });
    });

    eventBus.on("ghost-eaten", () => {
      const points = 200 * this.state.ghostChainMultiplier;
      this.state.score += points;
      this.state.ghostChainMultiplier = Math.min(this.state.ghostChainMultiplier * 2, 8);
      this.eventBus.emit("score-changed", { score: this.state.score });
    });
  }

  update(_world: World, _deltaTime: number): void {
    // Score updates are event-driven
  }

  resetChainMultiplier(): void {
    this.state.ghostChainMultiplier = 1;
  }
}
