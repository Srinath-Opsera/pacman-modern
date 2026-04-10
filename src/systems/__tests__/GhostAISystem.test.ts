import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../../core/ECSWorld";
import { EventBus } from "../../core/EventBus";
import { CellType } from "../../core/MazeData";
import type { MazeGrid } from "../../core/MazeData";
import { GhostAISystem, tileDistance } from "../GhostAISystem";
import { createGhostTag, GhostMode, GhostName } from "../../components/GhostTag";
import type { GhostTag } from "../../components/GhostTag";
import { createGridPosition } from "../../components/GridPosition";
import { createVelocity, Direction } from "../../components/Velocity";
import { createPacmanTag } from "../../components/PacmanTag";

function makeOpenMaze(rows = 31, cols = 28): MazeGrid {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) return CellType.WALL;
      return CellType.EMPTY;
    }),
  );
}

describe("GhostAISystem", () => {
  let world: World;
  let maze: MazeGrid;
  let eventBus: EventBus;
  let system: GhostAISystem;

  beforeEach(() => {
    world = new World();
    maze = makeOpenMaze();
    eventBus = new EventBus();
    system = new GhostAISystem(maze, eventBus);
    world.addSystem(system);
  });

  function addPacman(row: number, col: number, direction = Direction.RIGHT) {
    const e = world.createEntity();
    world.addComponent(e, createPacmanTag());
    world.addComponent(e, createGridPosition(row, col));
    world.addComponent(e, createVelocity(direction, 5));
    return e;
  }

  function addGhost(name: GhostName, row: number, col: number, direction = Direction.LEFT) {
    const e = world.createEntity();
    const tag = createGhostTag(name);
    tag.mode = GhostMode.CHASE;
    world.addComponent(e, tag);
    world.addComponent(e, createGridPosition(row, col));
    world.addComponent(e, createVelocity(direction, 5));
    return e;
  }

  function getTag(entity: number): GhostTag {
    const tag = world.getComponent<GhostTag>(entity, "ghostTag");
    if (!tag) throw new Error("GhostTag missing");
    return tag;
  }

  describe("Blinky targeting (direct chase)", () => {
    it("targets Pac-Man at (15, 10) when Pac-Man is at (15, 10)", () => {
      addPacman(15, 10);
      const ghost = addGhost(GhostName.BLINKY, 5, 5);
      const tag = getTag(ghost);
      const target = system.getTargetTile(tag, { row: 5, col: 5 }, { row: 15, col: 10 });
      expect(target).toEqual({ row: 15, col: 10 });
    });

    it("targets Pac-Man at (1, 1)", () => {
      const tag = createGhostTag(GhostName.BLINKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(tag, { row: 10, col: 10 }, { row: 1, col: 1 });
      expect(target).toEqual({ row: 1, col: 1 });
    });

    it("targets Pac-Man at (29, 26)", () => {
      const tag = createGhostTag(GhostName.BLINKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(tag, { row: 5, col: 5 }, { row: 29, col: 26 });
      expect(target).toEqual({ row: 29, col: 26 });
    });
  });

  describe("Pinky targeting (4 tiles ahead)", () => {
    it("targets 4 tiles ahead when Pac-Man faces RIGHT at (15, 10)", () => {
      const tag = createGhostTag(GhostName.PINKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(
        tag,
        { row: 5, col: 5 },
        { row: 15, col: 10 },
        createVelocity(Direction.RIGHT, 5),
      );
      expect(target).toEqual({ row: 15, col: 14 });
    });

    it("targets 4 tiles ahead when Pac-Man faces UP at (20, 14)", () => {
      const tag = createGhostTag(GhostName.PINKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(
        tag,
        { row: 10, col: 10 },
        { row: 20, col: 14 },
        createVelocity(Direction.UP, 5),
      );
      expect(target).toEqual({ row: 16, col: 14 });
    });

    it("targets 4 tiles ahead when Pac-Man faces DOWN at (5, 5)", () => {
      const tag = createGhostTag(GhostName.PINKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(
        tag,
        { row: 1, col: 1 },
        { row: 5, col: 5 },
        createVelocity(Direction.DOWN, 5),
      );
      expect(target).toEqual({ row: 9, col: 5 });
    });
  });

  describe("Inky targeting (vector doubling off Blinky)", () => {
    it("doubles the vector from Blinky through the pivot point", () => {
      const tag = createGhostTag(GhostName.INKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(
        tag,
        { row: 20, col: 20 },
        { row: 15, col: 10 },
        createVelocity(Direction.RIGHT, 5),
        { row: 15, col: 8 },
      );
      // Pac-Man at (15,10) facing RIGHT, pivot = (15, 12), Blinky at (15, 8)
      // target = pivot + (pivot - blinky) = (15, 12) + (0, 4) = (15, 16)
      expect(target).toEqual({ row: 15, col: 16 });
    });

    it("produces different targets when Blinky is at a different position", () => {
      const tag = createGhostTag(GhostName.INKY);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(
        tag,
        { row: 10, col: 10 },
        { row: 10, col: 14 },
        createVelocity(Direction.UP, 5),
        { row: 5, col: 14 },
      );
      // Pac-Man at (10,14) facing UP, pivot = (8, 14), Blinky at (5, 14)
      // target = (8,14) + (3, 0) = (11, 14)
      expect(target).toEqual({ row: 11, col: 14 });
    });

    it("uses ghost position as fallback when Blinky is missing", () => {
      const tag = createGhostTag(GhostName.INKY);
      tag.mode = GhostMode.CHASE;
      const ghostPos = { row: 20, col: 20 };
      const target = system.getTargetTile(
        tag,
        ghostPos,
        { row: 15, col: 10 },
        createVelocity(Direction.RIGHT, 5),
        undefined,
      );
      // pivot = (15, 12), fallback blinky = ghostPos (20, 20)
      // target = (15,12) + (15-20, 12-20) = (10, 4)
      expect(target).toEqual({ row: 10, col: 4 });
    });
  });

  describe("Clyde targeting (chase/scatter threshold)", () => {
    it("targets Pac-Man directly when distance >= 8 tiles", () => {
      const tag = createGhostTag(GhostName.CLYDE);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(tag, { row: 1, col: 1 }, { row: 20, col: 20 });
      expect(target).toEqual({ row: 20, col: 20 });
    });

    it("targets scatter corner when distance < 8 tiles", () => {
      const tag = createGhostTag(GhostName.CLYDE);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(tag, { row: 15, col: 10 }, { row: 15, col: 14 });
      expect(target).toEqual({ row: 30, col: 0 });
    });

    it("returns Pac-Man position at exactly 8 tiles distance", () => {
      const tag = createGhostTag(GhostName.CLYDE);
      tag.mode = GhostMode.CHASE;
      const target = system.getTargetTile(tag, { row: 10, col: 10 }, { row: 18, col: 10 });
      expect(target).toEqual({ row: 18, col: 10 });
    });
  });

  describe("scatter mode", () => {
    it("targets Blinky scatter corner at (0, 25)", () => {
      const tag = createGhostTag(GhostName.BLINKY);
      tag.mode = GhostMode.SCATTER;
      const target = system.getTargetTile(tag, { row: 10, col: 10 });
      expect(target).toEqual({ row: 0, col: 25 });
    });
  });

  describe("frightened mode", () => {
    it("activates on power-pellet-eaten event and reverses direction", () => {
      addPacman(15, 10);
      const ghost = addGhost(GhostName.BLINKY, 10, 10, Direction.LEFT);

      eventBus.emit("dot-eaten", { isPowerPellet: true });
      world.update(0.016);

      const tag = getTag(ghost);
      expect(tag.mode).toBe(GhostMode.FRIGHTENED);
    });
  });

  describe("eaten mode", () => {
    it("targets the ghost house center when eaten", () => {
      const tag = createGhostTag(GhostName.PINKY);
      tag.mode = GhostMode.EATEN;
      const target = system.getTargetTile(tag, { row: 5, col: 5 });
      expect(target).toEqual({ row: 14, col: 13 });
    });
  });

  describe("scatter/chase phase cycling", () => {
    it("switches from scatter to chase after 7 seconds", () => {
      addPacman(15, 10);
      const ghost = addGhost(GhostName.BLINKY, 10, 10);
      const tag = getTag(ghost);
      tag.mode = GhostMode.SCATTER;
      tag.scatterChasePhase = 0;
      tag.scatterChaseTimer = 0;

      world.update(7.1);

      expect(tag.mode).toBe(GhostMode.CHASE);
    });
  });

  describe("tileDistance utility", () => {
    it("calculates Euclidean distance between tiles", () => {
      expect(tileDistance({ row: 0, col: 0 }, { row: 3, col: 4 })).toBe(5);
    });
  });
});
