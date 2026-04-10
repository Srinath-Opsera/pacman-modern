import type { System, World } from "../core/ECSWorld";
import type { EventBus } from "../core/EventBus";

export enum FruitType {
  CHERRY = "cherry",
  STRAWBERRY = "strawberry",
  ORANGE = "orange",
  APPLE = "apple",
  MELON = "melon",
  GALAXIAN = "galaxian",
  BELL = "bell",
  KEY = "key",
}

const FRUIT_BY_LEVEL: FruitType[] = [
  FruitType.CHERRY,
  FruitType.STRAWBERRY,
  FruitType.ORANGE,
  FruitType.ORANGE,
  FruitType.APPLE,
  FruitType.APPLE,
  FruitType.MELON,
  FruitType.MELON,
  FruitType.GALAXIAN,
  FruitType.GALAXIAN,
  FruitType.BELL,
  FruitType.BELL,
  FruitType.KEY,
];

const FRUIT_POINTS: Record<FruitType, number> = {
  [FruitType.CHERRY]: 100,
  [FruitType.STRAWBERRY]: 300,
  [FruitType.ORANGE]: 500,
  [FruitType.APPLE]: 700,
  [FruitType.MELON]: 1000,
  [FruitType.GALAXIAN]: 2000,
  [FruitType.BELL]: 3000,
  [FruitType.KEY]: 5000,
};

const FRUIT_SPAWN_DOT_COUNTS = [70, 170];
const FRUIT_SPAWN_ROW = 17;
const FRUIT_SPAWN_COL = 13;

export interface FruitState {
  dotsEaten: number;
  spawned: boolean;
  spawnCount: number;
  currentFruit: FruitType | null;
}

export class FruitSystem implements System {
  readonly name = "FruitSystem";
  readonly state: FruitState;
  private eventBus: EventBus;
  private level: number;

  constructor(eventBus: EventBus, level = 1) {
    this.eventBus = eventBus;
    this.level = level;
    this.state = { dotsEaten: 0, spawned: false, spawnCount: 0, currentFruit: null };

    eventBus.on("dot-eaten", () => {
      this.state.dotsEaten++;
      this.checkSpawn();
    });

    eventBus.on("level-advanced", (payload: unknown) => {
      const event = payload as { level: number };
      this.level = event.level;
      this.state.dotsEaten = 0;
      this.state.spawnCount = 0;
      this.state.spawned = false;
      this.state.currentFruit = null;
    });
  }

  update(_world: World, _deltaTime: number): void {
    // Fruit spawning is event-driven
  }

  private checkSpawn(): void {
    if (this.state.spawnCount >= FRUIT_SPAWN_DOT_COUNTS.length) return;

    const threshold = FRUIT_SPAWN_DOT_COUNTS[this.state.spawnCount];
    if (this.state.dotsEaten >= threshold) {
      this.state.spawnCount++;
      this.state.spawned = true;
      const fruitIdx = Math.min(this.level - 1, FRUIT_BY_LEVEL.length - 1);
      this.state.currentFruit = FRUIT_BY_LEVEL[fruitIdx];
      this.eventBus.emit("fruit-spawned", {
        type: this.state.currentFruit,
        points: FRUIT_POINTS[this.state.currentFruit],
        row: FRUIT_SPAWN_ROW,
        col: FRUIT_SPAWN_COL,
      });
    }
  }

  static getFruitForLevel(level: number): FruitType {
    const idx = Math.min(level - 1, FRUIT_BY_LEVEL.length - 1);
    return FRUIT_BY_LEVEL[idx];
  }

  static getFruitPoints(fruit: FruitType): number {
    return FRUIT_POINTS[fruit];
  }
}
