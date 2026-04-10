import { describe, it, expect, vi, beforeEach } from "vitest";
import { World } from "../../core/ECSWorld";
import { CellType } from "../../core/MazeData";
import type { MazeGrid } from "../../core/MazeData";
import { EventBus } from "../../core/EventBus";
import { CollisionSystem } from "../CollisionSystem";
import type { DotEatenEvent, EntityOverlapEvent } from "../CollisionSystem";
import { createGridPosition } from "../../components/GridPosition";
import { createPacmanTag } from "../../components/PacmanTag";

function makeMiniMaze(): MazeGrid {
  const W = CellType.WALL;
  const D = CellType.DOT;
  const P = CellType.POWER_PELLET;
  const E = CellType.EMPTY;
  return [
    [W, W, W, W, W],
    [W, D, D, P, W],
    [W, E, D, E, W],
    [W, D, D, D, W],
    [W, W, W, W, W],
  ];
}

describe("CollisionSystem", () => {
  let world: World;
  let maze: MazeGrid;
  let eventBus: EventBus;
  let system: CollisionSystem;

  beforeEach(() => {
    world = new World();
    maze = makeMiniMaze();
    eventBus = new EventBus();
    system = new CollisionSystem(maze, eventBus);
    world.addSystem(system);
  });

  function createPacman(row: number, col: number) {
    const entity = world.createEntity();
    world.addComponent(entity, createPacmanTag());
    world.addComponent(entity, createGridPosition(row, col));
    return entity;
  }

  it("emits dot-eaten event when Pac-Man is on a DOT cell", () => {
    const handler = vi.fn();
    eventBus.on<DotEatenEvent>("dot-eaten", handler);

    createPacman(1, 1);
    world.update(0.016);

    expect(handler).toHaveBeenCalledWith({
      row: 1,
      col: 1,
      isPowerPellet: false,
    });
  });

  it("changes the DOT cell to EMPTY after consumption", () => {
    createPacman(1, 1);
    world.update(0.016);

    expect(maze[1][1]).toBe(CellType.EMPTY);
  });

  it("emits dot-eaten event with isPowerPellet=true for POWER_PELLET cells", () => {
    const handler = vi.fn();
    eventBus.on<DotEatenEvent>("dot-eaten", handler);

    createPacman(1, 3);
    world.update(0.016);

    expect(handler).toHaveBeenCalledWith({
      row: 1,
      col: 3,
      isPowerPellet: true,
    });
    expect(maze[1][3]).toBe(CellType.EMPTY);
  });

  it("does not emit dot-eaten on an EMPTY cell", () => {
    const handler = vi.fn();
    eventBus.on<DotEatenEvent>("dot-eaten", handler);

    createPacman(2, 1);
    world.update(0.016);

    expect(handler).not.toHaveBeenCalled();
  });

  it("detects entity-entity overlap and emits event", () => {
    const handler = vi.fn();
    eventBus.on<EntityOverlapEvent>("entity-overlap", handler);

    const e1 = world.createEntity();
    world.addComponent(e1, createGridPosition(2, 2));

    const e2 = world.createEntity();
    world.addComponent(e2, createGridPosition(2, 2));

    world.update(0.016);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        row: 2,
        col: 2,
      }),
    );
  });

  it("does not emit entity-overlap when entities are at different positions", () => {
    const handler = vi.fn();
    eventBus.on<EntityOverlapEvent>("entity-overlap", handler);

    const e1 = world.createEntity();
    world.addComponent(e1, createGridPosition(1, 1));

    const e2 = world.createEntity();
    world.addComponent(e2, createGridPosition(3, 3));

    world.update(0.016);

    expect(handler).not.toHaveBeenCalled();
  });
});
