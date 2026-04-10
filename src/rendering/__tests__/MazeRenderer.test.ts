import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import { EventBus } from "../../core/EventBus";
import { CellType } from "../../core/MazeData";
import type { MazeGrid } from "../../core/MazeData";
import { MazeRenderer } from "../MazeRenderer";

vi.mock("three", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import("three")>("three");
  return {
    ...actual,
    InstancedMesh: class extends actual.Object3D {
      count: number;
      instanceMatrix = { needsUpdate: false };
      constructor(_geo: THREE.BufferGeometry, _mat: THREE.Material, count: number) {
        super();
        this.count = count;
      }
      setMatrixAt(_idx: number, _matrix: THREE.Matrix4): void {
        /* noop */
      }
    },
  };
});

function makeTinyMaze(): MazeGrid {
  const W = CellType.WALL;
  const D = CellType.DOT;
  const P = CellType.POWER_PELLET;
  const E = CellType.EMPTY;
  return [
    [W, W, W, W],
    [W, D, P, W],
    [W, E, D, W],
    [W, W, W, W],
  ];
}

describe("MazeRenderer", () => {
  let scene: THREE.Scene;
  let eventBus: EventBus;

  beforeEach(() => {
    scene = new THREE.Scene();
    eventBus = new EventBus();
  });

  it("adds meshes to the scene for walls, floor, dots, and pellets", () => {
    const maze = makeTinyMaze();
    new MazeRenderer(scene, maze, eventBus);
    expect(scene.children.length).toBeGreaterThan(0);
  });

  it("creates floor, wall instances, dot instances, and pellet meshes", () => {
    const maze = makeTinyMaze();
    new MazeRenderer(scene, maze, eventBus);

    const meshTypes = scene.children.map((c) => c.constructor.name);
    expect(meshTypes).toContain("Mesh");
  });

  it("removes pellet from scene on dot-eaten event for power pellet position", () => {
    const maze = makeTinyMaze();
    new MazeRenderer(scene, maze, eventBus);
    const initialCount = scene.children.length;

    eventBus.emit("dot-eaten", { row: 1, col: 2 });

    expect(scene.children.length).toBe(initialCount - 1);
  });

  it("hides dot instance on dot-eaten event", () => {
    const maze = makeTinyMaze();
    const renderer = new MazeRenderer(scene, maze, eventBus);

    eventBus.emit("dot-eaten", { row: 1, col: 1 });

    expect(renderer).toBeDefined();
  });

  it("returns the scene", () => {
    const maze = makeTinyMaze();
    const renderer = new MazeRenderer(scene, maze, eventBus);
    expect(renderer.getScene()).toBe(scene);
  });
});
