import type { World } from "../core/ECSWorld";
import type { GridPosition } from "../components/GridPosition";
import type { Velocity } from "../components/Velocity";
import { Direction } from "../components/Velocity";
import type { GhostTag } from "../components/GhostTag";
import { PacmanModel } from "./PacmanModel";
import { GhostModel } from "./GhostModel";
import type { GhostName } from "../components/GhostTag";
import type * as THREE from "three";

const DIRECTION_ANGLES: Record<Direction, number> = {
  [Direction.NONE]: 0,
  [Direction.RIGHT]: 0,
  [Direction.LEFT]: Math.PI,
  [Direction.UP]: Math.PI / 2,
  [Direction.DOWN]: -Math.PI / 2,
};

export class CharacterBridge {
  private pacmanEntity: number | null = null;
  private pacmanModel: PacmanModel;
  private ghostModels = new Map<number, GhostModel>();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pacmanModel = new PacmanModel();
  }

  bindPacman(entity: number): void {
    this.pacmanEntity = entity;
    this.scene.add(this.pacmanModel.group);
  }

  bindGhost(entity: number, name: GhostName): void {
    const model = new GhostModel(name);
    this.ghostModels.set(entity, model);
    this.scene.add(model.group);
  }

  update(world: World, deltaTime: number): void {
    if (this.pacmanEntity !== null) {
      const pos = world.getComponent<GridPosition>(this.pacmanEntity, "gridPosition");
      const vel = world.getComponent<Velocity>(this.pacmanEntity, "velocity");

      if (pos) {
        this.pacmanModel.setPosition(pos.col, pos.row);
      }
      if (vel) {
        this.pacmanModel.setMoving(vel.direction !== Direction.NONE);
        this.pacmanModel.setDirection(DIRECTION_ANGLES[vel.direction]);
      }
      this.pacmanModel.update(deltaTime);
    }

    for (const [entity, model] of this.ghostModels) {
      const pos = world.getComponent<GridPosition>(entity, "gridPosition");
      const tag = world.getComponent<GhostTag>(entity, "ghostTag");

      if (pos) {
        model.setPosition(pos.col, pos.row);
      }
      if (tag) {
        model.setMode(tag.mode);
      }
      model.update(deltaTime);
    }
  }

  getPacmanModel(): PacmanModel {
    return this.pacmanModel;
  }

  getGhostModel(entity: number): GhostModel | undefined {
    return this.ghostModels.get(entity);
  }
}
