import type { System, World } from "../core/ECSWorld";
import type { GridPosition } from "../components/GridPosition";
import type { EventBus } from "../core/EventBus";
import type { MazeGrid } from "../core/MazeData";
import { CellType } from "../core/MazeData";

export interface DotEatenEvent {
  row: number;
  col: number;
  isPowerPellet: boolean;
}

export interface EntityOverlapEvent {
  entityA: number;
  entityB: number;
  row: number;
  col: number;
}

export class CollisionSystem implements System {
  readonly name = "CollisionSystem";
  private maze: MazeGrid;
  private eventBus: EventBus;

  constructor(maze: MazeGrid, eventBus: EventBus) {
    this.maze = maze;
    this.eventBus = eventBus;
  }

  update(world: World, _deltaTime: number): void {
    this.checkDotConsumption(world);
    this.checkEntityOverlaps(world);
  }

  private checkDotConsumption(world: World): void {
    const pacmen = world.getEntitiesWithComponents("pacmanTag", "gridPosition");

    for (const entity of pacmen) {
      const pos = world.getComponent<GridPosition>(entity, "gridPosition");
      if (!pos) continue;
      const cell = this.maze[pos.row]?.[pos.col];

      if (cell === CellType.DOT) {
        this.maze[pos.row][pos.col] = CellType.EMPTY;
        this.eventBus.emit<DotEatenEvent>("dot-eaten", {
          row: pos.row,
          col: pos.col,
          isPowerPellet: false,
        });
      } else if (cell === CellType.POWER_PELLET) {
        this.maze[pos.row][pos.col] = CellType.EMPTY;
        this.eventBus.emit<DotEatenEvent>("dot-eaten", {
          row: pos.row,
          col: pos.col,
          isPowerPellet: true,
        });
      }
    }
  }

  private checkEntityOverlaps(world: World): void {
    const entities = world.getEntitiesWithComponents("gridPosition");
    const positioned = entities
      .map((e) => ({
        entity: e,
        pos: world.getComponent<GridPosition>(e, "gridPosition"),
      }))
      .filter((p): p is { entity: number; pos: GridPosition } => p.pos !== undefined);

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        if (a.pos.row === b.pos.row && a.pos.col === b.pos.col) {
          this.eventBus.emit<EntityOverlapEvent>("entity-overlap", {
            entityA: a.entity,
            entityB: b.entity,
            row: a.pos.row,
            col: a.pos.col,
          });
        }
      }
    }
  }
}
