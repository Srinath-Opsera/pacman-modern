import { describe, it, expect, vi } from "vitest";
import type { Component, System } from "../ECSWorld";
import { World } from "../ECSWorld";

interface Position extends Component {
  type: "position";
  x: number;
  y: number;
}

interface Velocity extends Component {
  type: "velocity";
  dx: number;
  dy: number;
}

function makePosition(x: number, y: number): Position {
  return { type: "position", x, y };
}

function makeVelocity(dx: number, dy: number): Velocity {
  return { type: "velocity", dx, dy };
}

describe("ECSWorld", () => {
  it("creates entities with unique IDs", () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    const e3 = world.createEntity();

    expect(e1).not.toBe(e2);
    expect(e2).not.toBe(e3);
    expect(e1).not.toBe(e3);
  });

  it("adds and retrieves components on an entity", () => {
    const world = new World();
    const entity = world.createEntity();

    world.addComponent(entity, makePosition(10, 20));
    const pos = world.getComponent<Position>(entity, "position");

    expect(pos).toBeDefined();
    expect(pos?.x).toBe(10);
    expect(pos?.y).toBe(20);
  });

  it("returns undefined for a component that does not exist", () => {
    const world = new World();
    const entity = world.createEntity();

    const result = world.getComponent<Position>(entity, "position");
    expect(result).toBeUndefined();
  });

  it("throws when adding a component to a non-existent entity", () => {
    const world = new World();
    expect(() => world.addComponent(999, makePosition(0, 0))).toThrow("Entity 999 does not exist");
  });

  it("removes an entity and its components", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, makePosition(5, 5));

    world.removeEntity(entity);

    expect(world.getComponent<Position>(entity, "position")).toBeUndefined();
    expect(world.getEntities().has(entity)).toBe(false);
  });

  it("checks component existence with hasComponent", () => {
    const world = new World();
    const entity = world.createEntity();

    expect(world.hasComponent(entity, "position")).toBe(false);
    world.addComponent(entity, makePosition(0, 0));
    expect(world.hasComponent(entity, "position")).toBe(true);
  });

  it("removes a specific component from an entity", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, makePosition(1, 2));
    world.addComponent(entity, makeVelocity(3, 4));

    world.removeComponent(entity, "position");

    expect(world.hasComponent(entity, "position")).toBe(false);
    expect(world.hasComponent(entity, "velocity")).toBe(true);
  });

  it("queries entities with specific component sets", () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    const e3 = world.createEntity();

    world.addComponent(e1, makePosition(0, 0));
    world.addComponent(e1, makeVelocity(1, 1));

    world.addComponent(e2, makePosition(5, 5));

    world.addComponent(e3, makeVelocity(2, 2));

    const movable = world.getEntitiesWithComponents("position", "velocity");
    expect(movable).toEqual([e1]);

    const positioned = world.getEntitiesWithComponents("position");
    expect(positioned).toEqual(expect.arrayContaining([e1, e2]));
    expect(positioned).toHaveLength(2);
  });

  it("executes systems in the order they were added", () => {
    const world = new World();
    const executionOrder: string[] = [];

    const systemA: System = {
      name: "SystemA",
      update: () => executionOrder.push("A"),
    };
    const systemB: System = {
      name: "SystemB",
      update: () => executionOrder.push("B"),
    };
    const systemC: System = {
      name: "SystemC",
      update: () => executionOrder.push("C"),
    };

    world.addSystem(systemA);
    world.addSystem(systemB);
    world.addSystem(systemC);

    world.update(0.016);

    expect(executionOrder).toEqual(["A", "B", "C"]);
  });

  it("passes deltaTime to each system on update", () => {
    const world = new World();
    const updateFn = vi.fn();

    const system: System = {
      name: "TestSystem",
      update: updateFn,
    };

    world.addSystem(system);
    world.update(0.033);

    expect(updateFn).toHaveBeenCalledWith(world, 0.033);
  });
});
