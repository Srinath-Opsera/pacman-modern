import type { System, World } from "../core/ECSWorld";
import type { EventBus } from "../core/EventBus";
import type { MazeGrid } from "../core/MazeData";
import { CellType, parseMaze } from "../core/MazeData";

export interface LevelState {
  level: number;
  dotsRemaining: number;
}

export class LevelSystem implements System {
  readonly name = "LevelSystem";
  readonly state: LevelState;
  private eventBus: EventBus;
  private maze: MazeGrid;

  constructor(maze: MazeGrid, eventBus: EventBus) {
    this.maze = maze;
    this.eventBus = eventBus;
    this.state = { level: 1, dotsRemaining: this.countDots(maze) };

    eventBus.on("dot-eaten", () => {
      this.state.dotsRemaining--;
      if (this.state.dotsRemaining <= 0) {
        this.advanceLevel();
      }
    });
  }

  update(_world: World, _deltaTime: number): void {
    // Level updates are event-driven
  }

  private advanceLevel(): void {
    this.state.level++;
    const fresh = parseMaze();
    for (let r = 0; r < fresh.length; r++) {
      for (let c = 0; c < fresh[r].length; c++) {
        this.maze[r][c] = fresh[r][c];
      }
    }
    this.state.dotsRemaining = this.countDots(this.maze);
    this.eventBus.emit("level-advanced", { level: this.state.level });
  }

  private countDots(maze: MazeGrid): number {
    let count = 0;
    for (const row of maze) {
      for (const cell of row) {
        if (cell === CellType.DOT || cell === CellType.POWER_PELLET) {
          count++;
        }
      }
    }
    return count;
  }

  getGhostSpeedMultiplier(): number {
    return 1 + (this.state.level - 1) * 0.05;
  }
}
