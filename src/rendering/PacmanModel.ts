import * as THREE from "three";

const PACMAN_COLOR = 0xffcc00;
const EYE_COLOR = 0x111111;
const RADIUS = 0.4;
const MOUTH_SPEED = 8;
const BOB_SPEED = 2;
const BOB_AMPLITUDE = 0.05;

export class PacmanModel {
  readonly group: THREE.Group;
  private mouthAngle = 0;
  private time = 0;
  private topMesh: THREE.Mesh;
  private bottomMesh: THREE.Mesh;
  private isMoving = false;

  constructor() {
    this.group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color: PACMAN_COLOR,
      roughness: 0.3,
      metalness: 0.1,
    });

    this.topMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      material,
    );
    this.bottomMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      material,
    );
    this.group.add(this.topMesh);
    this.group.add(this.bottomMesh);

    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: EYE_COLOR });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0.1, 0.2, -0.3);
    this.group.add(eye);

    this.group.position.y = RADIUS;
  }

  setMoving(moving: boolean): void {
    this.isMoving = moving;
  }

  setPosition(x: number, z: number): void {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  setDirection(angle: number): void {
    this.group.rotation.y = angle;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.isMoving) {
      this.mouthAngle = Math.abs(Math.sin(this.time * MOUTH_SPEED)) * 0.4;
    } else {
      this.mouthAngle *= 0.9;
      this.group.position.y = RADIUS + Math.sin(this.time * BOB_SPEED) * BOB_AMPLITUDE;
    }

    this.topMesh.rotation.x = -this.mouthAngle;
    this.bottomMesh.rotation.x = this.mouthAngle;
  }
}
