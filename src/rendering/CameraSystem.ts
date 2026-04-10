import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MAZE_ROWS, MAZE_COLS } from "../core/MazeData";

export enum CameraPreset {
  TOP_DOWN = "top-down",
  ISOMETRIC = "isometric",
  FIRST_PERSON = "first-person",
  FREE_ORBIT = "free-orbit",
}

const PRESET_ORDER: CameraPreset[] = [
  CameraPreset.ISOMETRIC,
  CameraPreset.TOP_DOWN,
  CameraPreset.FIRST_PERSON,
  CameraPreset.FREE_ORBIT,
];

const MAZE_CENTER_X = MAZE_COLS / 2 - 0.5;
const MAZE_CENTER_Z = MAZE_ROWS / 2 - 0.5;
const LERP_SPEED = 4;

interface CameraState {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

function getPresetState(
  preset: CameraPreset,
  pacmanPos?: { x: number; z: number },
  pacmanAngle?: number,
): CameraState {
  switch (preset) {
    case CameraPreset.TOP_DOWN:
      return {
        position: new THREE.Vector3(MAZE_CENTER_X, 35, MAZE_CENTER_Z),
        lookAt: new THREE.Vector3(MAZE_CENTER_X, 0, MAZE_CENTER_Z),
      };

    case CameraPreset.ISOMETRIC:
      return {
        position: new THREE.Vector3(MAZE_CENTER_X + 15, 25, MAZE_CENTER_Z + 20),
        lookAt: new THREE.Vector3(MAZE_CENTER_X, 0, MAZE_CENTER_Z),
      };

    case CameraPreset.FIRST_PERSON: {
      const px = pacmanPos?.x ?? MAZE_CENTER_X;
      const pz = pacmanPos?.z ?? MAZE_CENTER_Z;
      const angle = pacmanAngle ?? 0;
      const behindDist = 2;
      const eyeHeight = 1.5;
      return {
        position: new THREE.Vector3(
          px - Math.cos(angle) * behindDist,
          eyeHeight,
          pz + Math.sin(angle) * behindDist,
        ),
        lookAt: new THREE.Vector3(px + Math.cos(angle) * 5, 0.5, pz - Math.sin(angle) * 5),
      };
    }

    case CameraPreset.FREE_ORBIT:
      return {
        position: new THREE.Vector3(MAZE_CENTER_X, 20, MAZE_CENTER_Z + 25),
        lookAt: new THREE.Vector3(MAZE_CENTER_X, 0, MAZE_CENTER_Z),
      };
  }
}

export class CameraSystem {
  private camera: THREE.PerspectiveCamera;
  private currentPreset: CameraPreset;
  private presetIndex: number;
  private targetState: CameraState;
  private currentLookAt: THREE.Vector3;
  private orbitControls: OrbitControls | null = null;
  private transitioning = false;
  private transitionProgress = 0;

  constructor(camera: THREE.PerspectiveCamera, renderer?: THREE.WebGLRenderer) {
    this.camera = camera;
    this.presetIndex = 0;
    this.currentPreset = PRESET_ORDER[0];
    this.targetState = getPresetState(this.currentPreset);
    this.currentLookAt = this.targetState.lookAt.clone();

    camera.position.copy(this.targetState.position);
    camera.lookAt(this.targetState.lookAt);

    if (renderer) {
      this.orbitControls = new OrbitControls(camera, renderer.domElement);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.1;
      this.orbitControls.target.copy(this.targetState.lookAt);
      this.orbitControls.enabled = false;
    }
  }

  cyclePreset(): void {
    this.presetIndex = (this.presetIndex + 1) % PRESET_ORDER.length;
    this.setPreset(PRESET_ORDER[this.presetIndex]);
  }

  setPreset(preset: CameraPreset): void {
    this.currentPreset = preset;
    this.transitioning = true;
    this.transitionProgress = 0;

    if (this.orbitControls) {
      this.orbitControls.enabled = preset === CameraPreset.FREE_ORBIT;
    }
  }

  getPreset(): CameraPreset {
    return this.currentPreset;
  }

  update(deltaTime: number, pacmanPos?: { x: number; z: number }, pacmanAngle?: number): void {
    this.targetState = getPresetState(this.currentPreset, pacmanPos, pacmanAngle);

    if (this.currentPreset === CameraPreset.FREE_ORBIT) {
      this.orbitControls?.update();
      this.transitioning = false;
      return;
    }

    if (this.transitioning) {
      this.transitionProgress += deltaTime * LERP_SPEED;
      const t = Math.min(this.transitionProgress, 1);
      const smoothT = t * t * (3 - 2 * t);

      this.camera.position.lerp(this.targetState.position, smoothT);
      this.currentLookAt.lerp(this.targetState.lookAt, smoothT);
      this.camera.lookAt(this.currentLookAt);

      if (t >= 1) {
        this.transitioning = false;
      }
    } else {
      if (this.currentPreset === CameraPreset.FIRST_PERSON) {
        this.camera.position.lerp(this.targetState.position, deltaTime * 8);
        this.currentLookAt.lerp(this.targetState.lookAt, deltaTime * 8);
      } else {
        this.camera.position.lerp(this.targetState.position, deltaTime * LERP_SPEED);
        this.currentLookAt.lerp(this.targetState.lookAt, deltaTime * LERP_SPEED);
      }
      this.camera.lookAt(this.currentLookAt);
    }
  }

  setupKeyboardControls(): void {
    document.addEventListener("keydown", (e) => {
      if (e.key === "c" || e.key === "C") {
        this.cyclePreset();
      }
    });
  }

  isTransitioning(): boolean {
    return this.transitioning;
  }
}
