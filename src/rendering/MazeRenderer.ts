import * as THREE from "three";
import type { MazeGrid } from "../core/MazeData";
import { CellType, MAZE_ROWS, MAZE_COLS } from "../core/MazeData";
import type { EventBus } from "../core/EventBus";

const WALL_COLOR = 0x0000cc;
const WALL_HEIGHT = 1;
const FLOOR_COLOR = 0x111111;
const DOT_COLOR = 0xffffff;
const DOT_RADIUS = 0.08;
const PELLET_COLOR = 0xffff00;
const PELLET_RADIUS = 0.2;
const PELLET_EMISSIVE_INTENSITY = 0.8;

export class MazeRenderer {
  private scene: THREE.Scene;
  private dotMeshes = new Map<string, THREE.InstancedMesh>();
  private dotIndex = new Map<string, number>();
  private pelletMeshes = new Map<string, THREE.Mesh>();

  constructor(scene: THREE.Scene, maze: MazeGrid, eventBus: EventBus) {
    this.scene = scene;
    this.buildFloor();
    this.buildWalls(maze);
    this.buildDots(maze);
    this.buildPowerPellets(maze);

    eventBus.on<{ row: number; col: number }>("dot-eaten", (event) => {
      this.removeDot(event.row, event.col);
    });
  }

  private buildFloor(): void {
    const geometry = new THREE.PlaneGeometry(MAZE_COLS, MAZE_ROWS);
    const material = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAZE_COLS / 2 - 0.5, -0.01, MAZE_ROWS / 2 - 0.5);
    this.scene.add(floor);
  }

  private buildWalls(maze: MazeGrid): void {
    const wallGeometry = new THREE.BoxGeometry(1, WALL_HEIGHT, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: WALL_COLOR });

    const wallPositions: THREE.Vector3[] = [];
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === CellType.WALL) {
          wallPositions.push(new THREE.Vector3(col, WALL_HEIGHT / 2, row));
        }
      }
    }

    if (wallPositions.length === 0) return;

    const instancedWalls = new THREE.InstancedMesh(
      wallGeometry,
      wallMaterial,
      wallPositions.length,
    );
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < wallPositions.length; i++) {
      matrix.setPosition(wallPositions[i]);
      instancedWalls.setMatrixAt(i, matrix);
    }
    instancedWalls.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedWalls);
  }

  private buildDots(maze: MazeGrid): void {
    const dotGeometry = new THREE.SphereGeometry(DOT_RADIUS, 6, 6);
    const dotMaterial = new THREE.MeshStandardMaterial({ color: DOT_COLOR });

    const dotPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === CellType.DOT) {
          dotPositions.push({ row, col });
        }
      }
    }

    if (dotPositions.length === 0) return;

    const instancedDots = new THREE.InstancedMesh(dotGeometry, dotMaterial, dotPositions.length);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < dotPositions.length; i++) {
      const { row, col } = dotPositions[i];
      matrix.setPosition(col, 0.3, row);
      instancedDots.setMatrixAt(i, matrix);
      const key = `${row},${col}`;
      this.dotIndex.set(key, i);
    }
    instancedDots.instanceMatrix.needsUpdate = true;
    this.dotMeshes.set("dots", instancedDots);
    this.scene.add(instancedDots);
  }

  private buildPowerPellets(maze: MazeGrid): void {
    const pelletGeometry = new THREE.SphereGeometry(PELLET_RADIUS, 12, 12);
    const pelletMaterial = new THREE.MeshStandardMaterial({
      color: PELLET_COLOR,
      emissive: PELLET_COLOR,
      emissiveIntensity: PELLET_EMISSIVE_INTENSITY,
    });

    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === CellType.POWER_PELLET) {
          const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
          pellet.position.set(col, 0.3, row);
          const key = `${row},${col}`;
          this.pelletMeshes.set(key, pellet);
          this.scene.add(pellet);
        }
      }
    }
  }

  private removeDot(row: number, col: number): void {
    const key = `${row},${col}`;

    const pellet = this.pelletMeshes.get(key);
    if (pellet) {
      this.scene.remove(pellet);
      this.pelletMeshes.delete(key);
      return;
    }

    const idx = this.dotIndex.get(key);
    if (idx !== undefined) {
      const instancedDots = this.dotMeshes.get("dots");
      if (instancedDots) {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(0, -100, 0);
        instancedDots.setMatrixAt(idx, matrix);
        instancedDots.instanceMatrix.needsUpdate = true;
      }
      this.dotIndex.delete(key);
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }
}
