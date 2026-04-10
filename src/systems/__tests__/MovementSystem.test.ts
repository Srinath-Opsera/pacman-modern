import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../../core/ECSWorld";
import { CellType } from "../../core/MazeData";
import type { MazeGrid } from "../../core/MazeData";
import { MovementSystem } from "../MovementSystem";
import { createGridPosition } from "../../components/GridPosition";
import type { GridPosition } from "../../components/GridPosition";
import { createVelocity, Direction } from "../../components/Velocity";

function makeMiniMaze(): MazeGrid {
  const W = CellType.WALL;
  const D = CellType.DOT;
  const E = CellType.EMPTY;
  const T = CellType.TUNNEL;
  return [
    [W, W, W, W, W],
    [W, D, D, D, W],
    [T, E, D, E, T],
    [W, D, D, D, W],
    [W, W, W, W, W],
  ];
}

describe("MovementSystem", () => {
  let world: World;
  let maze: MazeGrid;

  beforeEach(() => {
    world = new World();
    maze = makeMiniMaze();
    world.addSystem(new MovementSystem(maze));
  });

  function createMovingEntity(row: number, col: number, direction: Direction, speed = 10) {
    const entity = world.createEntity();
    world.addComponent(entity, createGridPosition(row, col));
    world.addComponent(entity, createVelocity(direction, speed));
    return entity;
  }

  function getPos(entity: number): GridPosition {
    const pos = world.getComponent<GridPosition>(entity, "gridPosition");
    if (!pos) throw new Error("GridPosition missing");
    return pos;
  }

  it("moves an entity right along a free corridor", () => {
    const e = createMovingEntity(1, 1, Direction.RIGHT);
    world.update(0.1);
    expect(getPos(e).col).toBe(2);
  });

  it("moves an entity left along a free corridor", () => {
    const e = createMovingEntity(1, 3, Direction.LEFT);
    world.update(0.1);
    expect(getPos(e).col).toBe(2);
  });

  it("moves an entity down along a free corridor", () => {
    const e = createMovingEntity(1, 1, Direction.DOWN);
    world.update(0.1);
    expect(getPos(e).row).toBe(2);
  });

  it("moves an entity up along a free corridor", () => {
    const e = createMovingEntity(3, 1, Direction.UP);
    world.update(0.1);
    expect(getPos(e).row).toBe(2);
  });

  it("stops at a WALL cell and does not move through it", () => {
    const e = createMovingEntity(1, 1, Direction.LEFT);
    world.update(0.1);
    expect(getPos(e).col).toBe(1);
  });

  it("wraps through the left tunnel (col 0 to col 4)", () => {
    const e = createMovingEntity(2, 0, Direction.LEFT);
    world.update(0.1);
    expect(getPos(e).col).toBe(4);
  });

  it("wraps through the right tunnel (col 4 to col 0)", () => {
    const e = createMovingEntity(2, 4, Direction.RIGHT);
    world.update(0.1);
    expect(getPos(e).col).toBe(0);
  });

  it("does not move when direction is NONE", () => {
    const e = createMovingEntity(2, 2, Direction.NONE);
    world.update(0.1);
    expect(getPos(e).row).toBe(2);
    expect(getPos(e).col).toBe(2);
  });
});
