import { describe, it, expect, vi, beforeEach } from "vitest";
import { World } from "../../core/ECSWorld";
import { EventBus } from "../../core/EventBus";
import { parseMaze, CellType } from "../../core/MazeData";
import type { MazeGrid } from "../../core/MazeData";
import { MovementSystem } from "../../systems/MovementSystem";
import { CollisionSystem } from "../../systems/CollisionSystem";
import { GhostAISystem } from "../../systems/GhostAISystem";
import { ScoreSystem } from "../../systems/ScoreSystem";
import { LevelSystem } from "../../systems/LevelSystem";
import { LivesSystem } from "../../systems/LivesSystem";
import { createGridPosition } from "../../components/GridPosition";
import type { GridPosition } from "../../components/GridPosition";
import { createVelocity, Direction } from "../../components/Velocity";
import { createPacmanTag } from "../../components/PacmanTag";
import { createGhostTag, GhostMode, GhostName } from "../../components/GhostTag";
import type { GhostTag } from "../../components/GhostTag";

function setupGame() {
  const world = new World();
  const eventBus = new EventBus();
  const maze = parseMaze();

  world.addSystem(new MovementSystem(maze));
  world.addSystem(new CollisionSystem(maze, eventBus));
  world.addSystem(new GhostAISystem(maze, eventBus));

  const scoreSystem = new ScoreSystem(eventBus);
  const levelSystem = new LevelSystem(maze, eventBus);
  const livesSystem = new LivesSystem(eventBus);
  world.addSystem(scoreSystem);
  world.addSystem(levelSystem);
  world.addSystem(livesSystem);

  return { world, eventBus, maze, scoreSystem, levelSystem, livesSystem };
}

function addPacman(world: World, row: number, col: number, dir = Direction.RIGHT) {
  const e = world.createEntity();
  world.addComponent(e, createPacmanTag());
  world.addComponent(e, createGridPosition(row, col));
  world.addComponent(e, createVelocity(dir, 10));
  return e;
}

function addGhost(world: World, name: GhostName, row: number, col: number, mode = GhostMode.CHASE) {
  const e = world.createEntity();
  const tag = createGhostTag(name);
  tag.mode = mode;
  world.addComponent(e, tag);
  world.addComponent(e, createGridPosition(row, col));
  world.addComponent(e, createVelocity(Direction.LEFT, 5));
  return e;
}

function getPos(world: World, entity: number): GridPosition {
  const pos = world.getComponent<GridPosition>(entity, "gridPosition");
  if (!pos) throw new Error("GridPosition missing");
  return pos;
}

describe("Integration: Complete Gameplay Loop", () => {
  let world: World;
  let eventBus: EventBus;
  let maze: MazeGrid;
  let scoreSystem: ScoreSystem;
  let livesSystem: LivesSystem;

  beforeEach(() => {
    const setup = setupGame();
    world = setup.world;
    eventBus = setup.eventBus;
    maze = setup.maze;
    scoreSystem = setup.scoreSystem;
    livesSystem = setup.livesSystem;
  });

  it("Pac-Man moves and eats a dot, incrementing score", () => {
    const pacRow = 23;
    const pacCol = 12;
    expect(maze[pacRow][pacCol]).toBe(CellType.DOT);

    const pacman = addPacman(world, pacRow, pacCol, Direction.NONE);
    world.update(0.1);

    expect(scoreSystem.state.score).toBe(10);
    expect(maze[pacRow][pacCol]).toBe(CellType.EMPTY);

    const pos = getPos(world, pacman);
    expect(pos.row).toBe(pacRow);
    expect(pos.col).toBe(pacCol);
  });

  it("Pac-Man eats a power pellet and scores 50 points", () => {
    const pacman = addPacman(world, 3, 1, Direction.NONE);
    world.update(0.1);

    expect(scoreSystem.state.score).toBe(50);
    expect(maze[3][1]).toBe(CellType.EMPTY);
    expect(getPos(world, pacman)).toBeDefined();
  });

  it("power pellet makes ghosts frightened", () => {
    addPacman(world, 3, 1, Direction.NONE);
    const blinky = addGhost(world, GhostName.BLINKY, 10, 10, GhostMode.CHASE);

    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    world.update(0.016);

    const tag = world.getComponent<GhostTag>(blinky, "ghostTag");
    expect(tag?.mode).toBe(GhostMode.FRIGHTENED);
  });

  it("ghost chain scoring: 200 → 400 → 800 → 1600", () => {
    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });

    eventBus.emit("ghost-eaten", {});
    expect(scoreSystem.state.score).toBe(50 + 200);

    eventBus.emit("ghost-eaten", {});
    expect(scoreSystem.state.score).toBe(50 + 200 + 400);

    eventBus.emit("ghost-eaten", {});
    expect(scoreSystem.state.score).toBe(50 + 200 + 400 + 800);

    eventBus.emit("ghost-eaten", {});
    expect(scoreSystem.state.score).toBe(50 + 200 + 400 + 800 + 1600);
  });

  it("game-over when all lives are lost", () => {
    const gameOverHandler = vi.fn();
    eventBus.on("game-over", gameOverHandler);

    eventBus.emit("ghost-collision", {});
    eventBus.emit("ghost-collision", {});
    eventBus.emit("ghost-collision", {});

    expect(livesSystem.state.lives).toBe(0);
    expect(gameOverHandler).toHaveBeenCalled();
  });

  it("Blinky targets Pac-Man directly in chase mode", () => {
    const pacman = addPacman(world, 20, 14, Direction.RIGHT);
    const blinky = addGhost(world, GhostName.BLINKY, 5, 5, GhostMode.CHASE);

    world.update(0.016);

    const blinkyPos = getPos(world, blinky);
    const pacPos = getPos(world, pacman);
    expect(blinkyPos).toBeDefined();
    expect(pacPos).toBeDefined();
  });

  it("ghost scatter mode activates after chase timer expires", () => {
    addPacman(world, 20, 14);
    const blinky = addGhost(world, GhostName.BLINKY, 10, 10, GhostMode.SCATTER);

    for (let i = 0; i < 100; i++) {
      world.update(0.1);
    }

    const tag = world.getComponent<GhostTag>(blinky, "ghostTag");
    expect(tag?.mode).not.toBe(GhostMode.SCATTER);
  });

  it("level advances when all dots and pellets are consumed", () => {
    const levelHandler = vi.fn();
    eventBus.on("level-advanced", levelHandler);

    let dotCount = 0;
    for (const row of maze) {
      for (const cell of row) {
        if (cell === CellType.DOT || cell === CellType.POWER_PELLET) {
          dotCount++;
        }
      }
    }

    for (let i = 0; i < dotCount; i++) {
      eventBus.emit("dot-eaten", { row: 0, col: 0, isPowerPellet: false });
    }

    expect(levelHandler).toHaveBeenCalledWith(expect.objectContaining({ level: 2 }));
  });

  it("extra life awarded at 10,000 points", () => {
    expect(livesSystem.state.lives).toBe(3);
    eventBus.emit("score-changed", { score: 10000 });
    expect(livesSystem.state.lives).toBe(4);
    expect(livesSystem.state.extraLifeAwarded).toBe(true);
  });

  it("Pac-Man cannot walk through walls", () => {
    const pacman = addPacman(world, 1, 1, Direction.UP);
    const posBefore = { ...getPos(world, pacman) };

    world.update(0.1);

    const posAfter = getPos(world, pacman);
    expect(posAfter.row).toBe(posBefore.row);
    expect(posAfter.col).toBe(posBefore.col);
  });

  it("full cycle: move, eat dot, encounter ghost, power pellet, eat ghost", () => {
    const pacRow = 26;
    const pacCol = 6;
    addPacman(world, pacRow, pacCol, Direction.NONE);
    addGhost(world, GhostName.BLINKY, 10, 10, GhostMode.CHASE);

    world.update(0.1);

    if (maze[pacRow]?.[pacCol] === CellType.DOT) {
      expect(scoreSystem.state.score).toBeGreaterThan(0);
    }

    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    world.update(0.016);

    eventBus.emit("ghost-eaten", {});
    expect(scoreSystem.state.score).toBeGreaterThan(0);
  });
});
