import * as THREE from "three";
import { GhostMode, GhostName } from "../components/GhostTag";

const GHOST_COLORS: Record<GhostName, number> = {
  [GhostName.BLINKY]: 0xff0000,
  [GhostName.PINKY]: 0xffb8ff,
  [GhostName.INKY]: 0x00ffff,
  [GhostName.CLYDE]: 0xffb851,
};

const FRIGHTENED_COLOR = 0x2121de;
const EYE_WHITE_COLOR = 0xffffff;
const EYE_PUPIL_COLOR = 0x2121de;
const RADIUS = 0.4;
const HEIGHT = 0.7;
const BOB_SPEED = 3;
const BOB_AMPLITUDE = 0.03;

export class GhostModel {
  readonly group: THREE.Group;
  private bodyMaterial: THREE.MeshStandardMaterial;
  private eyeGroup: THREE.Group;
  private normalColor: number;
  private time = 0;
  private mode: GhostMode = GhostMode.CHASE;

  constructor(name: GhostName) {
    this.normalColor = GHOST_COLORS[name];
    this.group = new THREE.Group();

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.normalColor,
      roughness: 0.3,
      metalness: 0.1,
    });

    const domeGeometry = new THREE.SphereGeometry(RADIUS, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeometry, this.bodyMaterial);
    dome.position.y = HEIGHT - RADIUS;
    this.group.add(dome);

    const skirtGeometry = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT - RADIUS, 16, 1, true);
    const skirt = new THREE.Mesh(skirtGeometry, this.bodyMaterial);
    skirt.position.y = (HEIGHT - RADIUS) / 2;
    this.group.add(skirt);

    this.eyeGroup = new THREE.Group();
    const eyeWhiteGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: EYE_WHITE_COLOR });
    const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: EYE_PUPIL_COLOR });

    for (const xOff of [-0.15, 0.15]) {
      const white = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      white.position.set(xOff, HEIGHT - RADIUS + 0.05, -RADIUS + 0.05);
      this.eyeGroup.add(white);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(xOff, HEIGHT - RADIUS + 0.05, -RADIUS - 0.02);
      this.eyeGroup.add(pupil);
    }
    this.group.add(this.eyeGroup);

    this.group.position.y = 0;
  }

  setMode(mode: GhostMode): void {
    this.mode = mode;

    switch (mode) {
      case GhostMode.FRIGHTENED:
        this.bodyMaterial.color.setHex(FRIGHTENED_COLOR);
        this.bodyMaterial.transparent = true;
        this.bodyMaterial.opacity = 0.7;
        this.eyeGroup.visible = true;
        this.group.children[0].visible = true;
        this.group.children[1].visible = true;
        break;

      case GhostMode.EATEN:
        this.group.children[0].visible = false;
        this.group.children[1].visible = false;
        this.eyeGroup.visible = true;
        break;

      default:
        this.bodyMaterial.color.setHex(this.normalColor);
        this.bodyMaterial.transparent = false;
        this.bodyMaterial.opacity = 1;
        this.group.children[0].visible = true;
        this.group.children[1].visible = true;
        this.eyeGroup.visible = true;
        break;
    }
  }

  setPosition(x: number, z: number): void {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.group.position.y = Math.sin(this.time * BOB_SPEED) * BOB_AMPLITUDE;
  }

  getMode(): GhostMode {
    return this.mode;
  }
}
