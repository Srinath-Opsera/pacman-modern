import type { System } from "../core/ECSWorld";
import type { World } from "../core/ECSWorld";
import type { GridPosition } from "../components/GridPosition";
import type { Velocity } from "../components/Velocity";
import { Direction } from "../components/Velocity";
import type { MazeGrid } from "../core/MazeData";
import { CellType } from "../core/MazeData";

export class MovementSystem implements System {
  readonly name = "MovementSystem";
  private maze: MazeGrid;
  private moveAccumulator = new Map<number, number>();

  constructor(maze: MazeGrid) {
    this.maze = maze;
  }

  update(world: World, deltaTime: number): void {
    const entities = world.getEntitiesWithComponents("gridPosition", "velocity");

    for (const entity of entities) {
      const pos = world.getComponent<GridPosition>(entity, "gridPosition");
      const vel = world.getComponent<Velocity>(entity, "velocity");
      if (!pos || !vel) continue;

      if (vel.direction === Direction.NONE || vel.speed === 0) continue;

      const accumulated = (this.moveAccumulator.get(entity) ?? 0) + deltaTime * vel.speed;
      const steps = Math.floor(accumulated);
      this.moveAccumulator.set(entity, accumulated - steps);

      for (let i = 0; i < steps; i++) {
        const next = this.getNextPosition(pos.row, pos.col, vel.direction);
        if (this.isTraversable(next.row, next.col)) {
          pos.row = next.row;
          pos.col = next.col;
        } else {
          this.moveAccumulator.set(entity, 0);
          break;
        }
      }
    }
  }

  private get cols(): number {
    return this.maze[0]?.length ?? 0;
  }

  private getNextPosition(
    row: number,
    col: number,
    direction: Direction,
  ): { row: number; col: number } {
    switch (direction) {
      case Direction.UP:
        return { row: row - 1, col };
      case Direction.DOWN:
        return { row: row + 1, col };
      case Direction.LEFT: {
        const nextCol = col - 1;
        return { row, col: nextCol < 0 ? this.cols - 1 : nextCol };
      }
      case Direction.RIGHT: {
        const nextCol = col + 1;
        return { row, col: nextCol >= this.cols ? 0 : nextCol };
      }
      default:
        return { row, col };
    }
  }

  private isTraversable(row: number, col: number): boolean {
    if (row < 0 || row >= this.maze.length) return false;
    if (col < 0 || col >= this.cols) return false;
    const cell = this.maze[row][col];
    return cell !== CellType.WALL && cell !== CellType.GHOST_HOUSE;
  }
}
