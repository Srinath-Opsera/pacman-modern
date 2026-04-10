import { describe, it, expect, vi, beforeEach } from "vitest";
import { World } from "../../core/ECSWorld";
import { EventBus } from "../../core/EventBus";
import { ScoreSystem } from "../ScoreSystem";
import { LivesSystem } from "../LivesSystem";
import { LevelSystem } from "../LevelSystem";
import { FruitSystem, FruitType } from "../FruitSystem";
import { parseMaze } from "../../core/MazeData";

describe("ScoreSystem", () => {
  let eventBus: EventBus;
  let system: ScoreSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    system = new ScoreSystem(eventBus);
    const world = new World();
    world.addSystem(system);
  });

  it("awards 10 points per dot", () => {
    eventBus.emit("dot-eaten", { row: 1, col: 1, isPowerPellet: false });
    expect(system.state.score).toBe(10);
  });

  it("awards 50 points per power pellet", () => {
    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    expect(system.state.score).toBe(50);
  });

  it("awards 200/400/800/1600 for consecutive ghost eats", () => {
    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    expect(system.state.score).toBe(50);

    eventBus.emit("ghost-eaten", {});
    expect(system.state.score).toBe(250);

    eventBus.emit("ghost-eaten", {});
    expect(system.state.score).toBe(650);

    eventBus.emit("ghost-eaten", {});
    expect(system.state.score).toBe(1450);

    eventBus.emit("ghost-eaten", {});
    expect(system.state.score).toBe(3050);
  });

  it("resets ghost chain multiplier on new power pellet", () => {
    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    eventBus.emit("ghost-eaten", {});
    eventBus.emit("ghost-eaten", {});
    expect(system.state.ghostChainMultiplier).toBe(4);

    eventBus.emit("dot-eaten", { row: 3, col: 26, isPowerPellet: true });
    expect(system.state.ghostChainMultiplier).toBe(1);
  });
});

describe("LivesSystem", () => {
  let eventBus: EventBus;
  let system: LivesSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    system = new LivesSystem(eventBus);
  });

  it("starts with 3 lives", () => {
    expect(system.state.lives).toBe(3);
  });

  it("decrements lives on ghost collision", () => {
    eventBus.emit("ghost-collision", {});
    expect(system.state.lives).toBe(2);
  });

  it("emits game-over when lives reach 0", () => {
    const handler = vi.fn();
    eventBus.on("game-over", handler);

    eventBus.emit("ghost-collision", {});
    eventBus.emit("ghost-collision", {});
    eventBus.emit("ghost-collision", {});

    expect(system.state.lives).toBe(0);
    expect(handler).toHaveBeenCalled();
  });

  it("awards extra life at 10,000 points", () => {
    eventBus.emit("score-changed", { score: 10000 });
    expect(system.state.lives).toBe(4);
    expect(system.state.extraLifeAwarded).toBe(true);
  });

  it("only awards extra life once", () => {
    eventBus.emit("score-changed", { score: 10000 });
    eventBus.emit("score-changed", { score: 20000 });
    expect(system.state.lives).toBe(4);
  });
});

describe("LevelSystem", () => {
  let eventBus: EventBus;
  let system: LevelSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    const maze = parseMaze();
    system = new LevelSystem(maze, eventBus);
  });

  it("starts at level 1", () => {
    expect(system.state.level).toBe(1);
  });

  it("advances level when all dots are consumed", () => {
    const handler = vi.fn();
    eventBus.on("level-advanced", handler);

    const totalDots = system.state.dotsRemaining;
    for (let i = 0; i < totalDots; i++) {
      eventBus.emit("dot-eaten", {});
    }

    expect(system.state.level).toBe(2);
    expect(handler).toHaveBeenCalledWith({ level: 2 });
  });

  it("increases ghost speed multiplier with each level", () => {
    expect(system.getGhostSpeedMultiplier()).toBe(1);

    const totalDots = system.state.dotsRemaining;
    for (let i = 0; i < totalDots; i++) {
      eventBus.emit("dot-eaten", {});
    }

    expect(system.getGhostSpeedMultiplier()).toBeCloseTo(1.05);
  });
});

describe("FruitSystem", () => {
  let eventBus: EventBus;
  beforeEach(() => {
    eventBus = new EventBus();
    new FruitSystem(eventBus, 1);
  });

  it("spawns cherry at 70 dots eaten for level 1", () => {
    const handler = vi.fn();
    eventBus.on("fruit-spawned", handler);

    for (let i = 0; i < 70; i++) {
      eventBus.emit("dot-eaten", {});
    }

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: FruitType.CHERRY,
        points: 100,
      }),
    );
  });

  it("spawns second fruit at 170 dots eaten", () => {
    const handler = vi.fn();
    eventBus.on("fruit-spawned", handler);

    for (let i = 0; i < 170; i++) {
      eventBus.emit("dot-eaten", {});
    }

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("returns correct fruit type for each level", () => {
    expect(FruitSystem.getFruitForLevel(1)).toBe(FruitType.CHERRY);
    expect(FruitSystem.getFruitForLevel(2)).toBe(FruitType.STRAWBERRY);
    expect(FruitSystem.getFruitForLevel(3)).toBe(FruitType.ORANGE);
    expect(FruitSystem.getFruitForLevel(5)).toBe(FruitType.APPLE);
    expect(FruitSystem.getFruitForLevel(13)).toBe(FruitType.KEY);
    expect(FruitSystem.getFruitForLevel(100)).toBe(FruitType.KEY);
  });

  it("returns correct points for each fruit type", () => {
    expect(FruitSystem.getFruitPoints(FruitType.CHERRY)).toBe(100);
    expect(FruitSystem.getFruitPoints(FruitType.KEY)).toBe(5000);
  });
});
