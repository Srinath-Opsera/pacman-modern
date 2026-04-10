import type { System, World, Entity } from "../core/ECSWorld";
import type { GridPosition } from "../components/GridPosition";
import type { Velocity } from "../components/Velocity";
import { Direction } from "../components/Velocity";
import type { GhostTag } from "../components/GhostTag";
import { GhostMode, GhostName } from "../components/GhostTag";
import type { MazeGrid } from "../core/MazeData";
import { CellType } from "../core/MazeData";
import type { EventBus } from "../core/EventBus";

interface Tile {
  row: number;
  col: number;
}

const SCATTER_TARGETS: Record<GhostName, Tile> = {
  [GhostName.BLINKY]: { row: 0, col: 25 },
  [GhostName.PINKY]: { row: 0, col: 2 },
  [GhostName.INKY]: { row: 30, col: 27 },
  [GhostName.CLYDE]: { row: 30, col: 0 },
};

const GHOST_HOUSE_CENTER: Tile = { row: 14, col: 13 };

const PHASE_DURATIONS = [7, 20, 7, 20, 5, 20, 5, Infinity];
const FRIGHTENED_DURATION = 6;

export class GhostAISystem implements System {
  readonly name = "GhostAISystem";
  private maze: MazeGrid;

  constructor(maze: MazeGrid, eventBus: EventBus) {
    this.maze = maze;
    eventBus.on("dot-eaten", (payload: unknown) => {
      const event = payload as { isPowerPellet: boolean };
      if (event.isPowerPellet) {
        this.activateFrightenedMode = true;
      }
    });
  }

  private activateFrightenedMode = false;

  update(world: World, deltaTime: number): void {
    const ghosts = world.getEntitiesWithComponents("ghostTag", "gridPosition", "velocity");
    const pacmanEntities = world.getEntitiesWithComponents("pacmanTag", "gridPosition");
    const pacmanPos =
      pacmanEntities.length > 0
        ? world.getComponent<GridPosition>(pacmanEntities[0], "gridPosition")
        : undefined;
    const pacmanVel =
      pacmanEntities.length > 0
        ? world.getComponent<Velocity>(pacmanEntities[0], "velocity")
        : undefined;

    let blinkyPos: GridPosition | undefined;
    for (const entity of ghosts) {
      const tag = world.getComponent<GhostTag>(entity, "ghostTag");
      if (tag?.name === GhostName.BLINKY) {
        blinkyPos = world.getComponent<GridPosition>(entity, "gridPosition");
        break;
      }
    }

    if (this.activateFrightenedMode) {
      this.activateFrightenedMode = false;
      for (const entity of ghosts) {
        const tag = world.getComponent<GhostTag>(entity, "ghostTag");
        const vel = world.getComponent<Velocity>(entity, "velocity");
        if (!tag || !vel) continue;
        if (tag.mode !== GhostMode.EATEN) {
          tag.mode = GhostMode.FRIGHTENED;
          tag.frightenedTimer = FRIGHTENED_DURATION;
          vel.direction = reverseDirection(vel.direction);
        }
      }
    }

    for (const entity of ghosts) {
      const tag = world.getComponent<GhostTag>(entity, "ghostTag");
      const pos = world.getComponent<GridPosition>(entity, "gridPosition");
      const vel = world.getComponent<Velocity>(entity, "velocity");
      if (!tag || !pos || !vel) continue;

      this.updateMode(tag, deltaTime);

      const target = this.getTargetTile(tag, pos, pacmanPos, pacmanVel, blinkyPos);
      vel.direction = this.chooseBestDirection(pos, vel.direction, target);
    }
  }

  private updateMode(tag: GhostTag, deltaTime: number): void {
    if (tag.mode === GhostMode.FRIGHTENED) {
      tag.frightenedTimer -= deltaTime;
      if (tag.frightenedTimer <= 0) {
        tag.frightenedTimer = 0;
        this.restoreScatterChase(tag);
      }
      return;
    }

    if (tag.mode === GhostMode.EATEN) {
      return;
    }

    tag.scatterChaseTimer += deltaTime;
    const phaseDuration = PHASE_DURATIONS[tag.scatterChasePhase] ?? Infinity;
    if (tag.scatterChaseTimer >= phaseDuration) {
      tag.scatterChaseTimer -= phaseDuration;
      tag.scatterChasePhase = Math.min(tag.scatterChasePhase + 1, PHASE_DURATIONS.length - 1);
      this.restoreScatterChase(tag);
    }
  }

  private restoreScatterChase(tag: GhostTag): void {
    tag.mode = tag.scatterChasePhase % 2 === 0 ? GhostMode.SCATTER : GhostMode.CHASE;
  }

  getTargetTile(
    tag: GhostTag,
    ghostPos: Tile,
    pacmanPos?: Tile,
    pacmanVel?: Velocity,
    blinkyPos?: Tile,
  ): Tile {
    if (tag.mode === GhostMode.SCATTER) {
      return SCATTER_TARGETS[tag.name];
    }

    if (tag.mode === GhostMode.EATEN) {
      return GHOST_HOUSE_CENTER;
    }

    if (tag.mode === GhostMode.FRIGHTENED || !pacmanPos) {
      return {
        row: Math.floor(Math.random() * this.maze.length),
        col: Math.floor(Math.random() * (this.maze[0]?.length ?? 28)),
      };
    }

    switch (tag.name) {
      case GhostName.BLINKY:
        return { row: pacmanPos.row, col: pacmanPos.col };

      case GhostName.PINKY: {
        const offset = directionToOffset(pacmanVel?.direction ?? Direction.NONE);
        return {
          row: pacmanPos.row + offset.row * 4,
          col: pacmanPos.col + offset.col * 4,
        };
      }

      case GhostName.INKY: {
        const offset2 = directionToOffset(pacmanVel?.direction ?? Direction.NONE);
        const pivot = {
          row: pacmanPos.row + offset2.row * 2,
          col: pacmanPos.col + offset2.col * 2,
        };
        const bp = blinkyPos ?? ghostPos;
        return {
          row: pivot.row + (pivot.row - bp.row),
          col: pivot.col + (pivot.col - bp.col),
        };
      }

      case GhostName.CLYDE: {
        const dist = tileDistance(ghostPos, pacmanPos);
        if (dist >= 8) {
          return { row: pacmanPos.row, col: pacmanPos.col };
        }
        return SCATTER_TARGETS[GhostName.CLYDE];
      }
    }
  }

  private chooseBestDirection(pos: Tile, currentDir: Direction, target: Tile): Direction {
    const reverse = reverseDirection(currentDir);
    const candidates = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];

    let bestDir = currentDir;
    let bestDist = Infinity;

    for (const dir of candidates) {
      if (dir === reverse) continue;

      const next = applyDirection(pos, dir);
      if (!this.isTileWalkable(next.row, next.col)) continue;

      const dist = tileDistance(next, target);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    }

    return bestDir;
  }

  private isTileWalkable(row: number, col: number): boolean {
    if (row < 0 || row >= this.maze.length) return false;
    const cols = this.maze[0]?.length ?? 0;
    if (col < 0 || col >= cols) return false;
    const cell = this.maze[row][col];
    return cell !== CellType.WALL;
  }

  markEaten(world: World, entity: Entity): void {
    const tag = world.getComponent<GhostTag>(entity, "ghostTag");
    if (tag) {
      tag.mode = GhostMode.EATEN;
    }
  }

  checkRespawn(world: World, entity: Entity): void {
    const tag = world.getComponent<GhostTag>(entity, "ghostTag");
    const pos = world.getComponent<GridPosition>(entity, "gridPosition");
    if (!tag || !pos) return;

    if (
      tag.mode === GhostMode.EATEN &&
      pos.row === GHOST_HOUSE_CENTER.row &&
      pos.col === GHOST_HOUSE_CENTER.col
    ) {
      this.restoreScatterChase(tag);
    }
  }
}

function reverseDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.UP:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.LEFT;
    default:
      return Direction.NONE;
  }
}

function directionToOffset(dir: Direction): Tile {
  switch (dir) {
    case Direction.UP:
      return { row: -1, col: 0 };
    case Direction.DOWN:
      return { row: 1, col: 0 };
    case Direction.LEFT:
      return { row: 0, col: -1 };
    case Direction.RIGHT:
      return { row: 0, col: 1 };
    default:
      return { row: 0, col: 0 };
  }
}

function applyDirection(pos: Tile, dir: Direction): Tile {
  const offset = directionToOffset(dir);
  return { row: pos.row + offset.row, col: pos.col + offset.col };
}

export function tileDistance(a: Tile, b: Tile): number {
  return Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2);
}
