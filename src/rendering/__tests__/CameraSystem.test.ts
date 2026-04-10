import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { CameraSystem, CameraPreset } from "../CameraSystem";

vi.mock("three/addons/controls/OrbitControls.js", () => ({
  OrbitControls: class {
    enabled = false;
    enableDamping = false;
    dampingFactor = 0;
    target = new THREE.Vector3();
    update = vi.fn();
  },
}));

describe("CameraSystem", () => {
  let camera: THREE.PerspectiveCamera;
  let cameraSystem: CameraSystem;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    cameraSystem = new CameraSystem(camera);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to isometric preset", () => {
    expect(cameraSystem.getPreset()).toBe(CameraPreset.ISOMETRIC);
  });

  it("cycles through presets in order", () => {
    cameraSystem.cyclePreset();
    expect(cameraSystem.getPreset()).toBe(CameraPreset.TOP_DOWN);

    cameraSystem.cyclePreset();
    expect(cameraSystem.getPreset()).toBe(CameraPreset.FIRST_PERSON);

    cameraSystem.cyclePreset();
    expect(cameraSystem.getPreset()).toBe(CameraPreset.FREE_ORBIT);

    cameraSystem.cyclePreset();
    expect(cameraSystem.getPreset()).toBe(CameraPreset.ISOMETRIC);
  });

  it("starts transitioning when preset changes", () => {
    cameraSystem.cyclePreset();
    expect(cameraSystem.isTransitioning()).toBe(true);
  });

  it("completes transition after sufficient update time", () => {
    cameraSystem.setPreset(CameraPreset.TOP_DOWN);
    expect(cameraSystem.isTransitioning()).toBe(true);

    for (let i = 0; i < 10; i++) {
      cameraSystem.update(0.1);
    }

    expect(cameraSystem.isTransitioning()).toBe(false);
  });

  it("sets camera position for top-down view looking straight down", () => {
    cameraSystem.setPreset(CameraPreset.TOP_DOWN);
    for (let i = 0; i < 20; i++) {
      cameraSystem.update(0.1);
    }

    expect(camera.position.y).toBeGreaterThan(30);
  });

  it("sets camera for first-person view based on Pac-Man position", () => {
    cameraSystem.setPreset(CameraPreset.FIRST_PERSON);
    cameraSystem.update(1, { x: 14, z: 15 }, 0);

    expect(camera.position.y).toBeLessThan(5);
  });

  it("allows direct preset setting", () => {
    cameraSystem.setPreset(CameraPreset.FREE_ORBIT);
    expect(cameraSystem.getPreset()).toBe(CameraPreset.FREE_ORBIT);
  });
});
