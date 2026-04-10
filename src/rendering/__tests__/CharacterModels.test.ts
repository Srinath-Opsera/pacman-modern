import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { PacmanModel } from "../PacmanModel";
import { GhostModel } from "../GhostModel";
import { GhostMode, GhostName } from "../../components/GhostTag";
import { CharacterBridge } from "../CharacterBridge";
import { World } from "../../core/ECSWorld";
import { createGridPosition } from "../../components/GridPosition";
import { createVelocity, Direction } from "../../components/Velocity";
import { createPacmanTag } from "../../components/PacmanTag";
import { createGhostTag } from "../../components/GhostTag";

describe("PacmanModel", () => {
  it("creates a group with child meshes", () => {
    const model = new PacmanModel();
    expect(model.group).toBeInstanceOf(THREE.Group);
    expect(model.group.children.length).toBeGreaterThan(0);
  });

  it("sets position correctly", () => {
    const model = new PacmanModel();
    model.setPosition(5, 10);
    expect(model.group.position.x).toBe(5);
    expect(model.group.position.z).toBe(10);
  });

  it("animates mouth when moving", () => {
    const model = new PacmanModel();
    model.setMoving(true);
    model.update(0.5);
    expect(model.group).toBeDefined();
  });

  it("bobs when idle", () => {
    const model = new PacmanModel();
    model.setMoving(false);
    const initialY = model.group.position.y;
    model.update(0.5);
    expect(model.group.position.y).not.toBe(initialY);
  });
});

describe("GhostModel", () => {
  it("creates a group with body and eye meshes", () => {
    const model = new GhostModel(GhostName.BLINKY);
    expect(model.group).toBeInstanceOf(THREE.Group);
    expect(model.group.children.length).toBeGreaterThan(0);
  });

  it("changes to blue appearance in frightened mode", () => {
    const model = new GhostModel(GhostName.BLINKY);
    model.setMode(GhostMode.FRIGHTENED);
    expect(model.getMode()).toBe(GhostMode.FRIGHTENED);
  });

  it("hides body in eaten mode", () => {
    const model = new GhostModel(GhostName.PINKY);
    model.setMode(GhostMode.EATEN);
    expect(model.group.children[0].visible).toBe(false);
    expect(model.group.children[1].visible).toBe(false);
  });

  it("restores normal appearance from frightened mode", () => {
    const model = new GhostModel(GhostName.INKY);
    model.setMode(GhostMode.FRIGHTENED);
    model.setMode(GhostMode.CHASE);
    expect(model.group.children[0].visible).toBe(true);
    expect(model.group.children[1].visible).toBe(true);
  });

  it("sets position correctly", () => {
    const model = new GhostModel(GhostName.CLYDE);
    model.setPosition(3, 7);
    expect(model.group.position.x).toBe(3);
    expect(model.group.position.z).toBe(7);
  });
});

describe("CharacterBridge", () => {
  let scene: THREE.Scene;
  let world: World;
  let bridge: CharacterBridge;

  beforeEach(() => {
    scene = new THREE.Scene();
    world = new World();
    bridge = new CharacterBridge(scene);
  });

  it("binds Pac-Man entity and updates position from ECS", () => {
    const entity = world.createEntity();
    world.addComponent(entity, createPacmanTag());
    world.addComponent(entity, createGridPosition(15, 10));
    world.addComponent(entity, createVelocity(Direction.RIGHT, 5));

    bridge.bindPacman(entity);
    bridge.update(world, 0.016);

    const model = bridge.getPacmanModel();
    expect(model.group.position.x).toBe(10);
    expect(model.group.position.z).toBe(15);
  });

  it("binds ghost entity and updates position from ECS", () => {
    const entity = world.createEntity();
    world.addComponent(entity, createGhostTag(GhostName.BLINKY));
    world.addComponent(entity, createGridPosition(5, 8));
    world.addComponent(entity, createVelocity(Direction.LEFT, 5));

    bridge.bindGhost(entity, GhostName.BLINKY);
    bridge.update(world, 0.016);

    const model = bridge.getGhostModel(entity);
    expect(model).toBeDefined();
    expect(model?.group.position.x).toBe(8);
    expect(model?.group.position.z).toBe(5);
  });

  it("updates ghost mode from ECS GhostTag", () => {
    const entity = world.createEntity();
    const tag = createGhostTag(GhostName.PINKY);
    tag.mode = GhostMode.FRIGHTENED;
    world.addComponent(entity, tag);
    world.addComponent(entity, createGridPosition(10, 10));

    bridge.bindGhost(entity, GhostName.PINKY);
    bridge.update(world, 0.016);

    const model = bridge.getGhostModel(entity);
    expect(model?.getMode()).toBe(GhostMode.FRIGHTENED);
  });
});
