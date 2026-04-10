import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { EventBus } from "../../core/EventBus";
import { ParticleSystem } from "../ParticleSystem";

describe("ParticleSystem", () => {
  let scene: THREE.Scene;
  let eventBus: EventBus;
  let particleSystem: ParticleSystem;

  beforeEach(() => {
    scene = new THREE.Scene();
    eventBus = new EventBus();
    particleSystem = new ParticleSystem(scene, eventBus);
  });

  it("adds a Points mesh to the scene", () => {
    const pointsMeshes = scene.children.filter((c) => c instanceof THREE.Points);
    expect(pointsMeshes.length).toBe(1);
  });

  it("spawns 5-10 particles on dot-eaten event", () => {
    eventBus.emit("dot-eaten", { row: 5, col: 10, isPowerPellet: false });
    expect(particleSystem.getParticleCount()).toBeGreaterThanOrEqual(5);
    expect(particleSystem.getParticleCount()).toBeLessThanOrEqual(10);
  });

  it("spawns 15 particles on power-pellet-eaten event", () => {
    eventBus.emit("dot-eaten", { row: 3, col: 1, isPowerPellet: true });
    expect(particleSystem.getParticleCount()).toBe(15);
  });

  it("spawns 25 particles on ghost-eaten-vfx event", () => {
    eventBus.emit("ghost-eaten-vfx", { color: 0xff0000, x: 10, z: 15, points: 200 });
    expect(particleSystem.getParticleCount()).toBe(25);
  });

  it("reduces particle count over time as particles expire", () => {
    particleSystem.spawnDotBurst(5, 0.3, 10);
    const initial = particleSystem.getParticleCount();
    expect(initial).toBeGreaterThan(0);

    for (let i = 0; i < 30; i++) {
      particleSystem.update(0.05);
    }

    expect(particleSystem.getParticleCount()).toBe(0);
  });

  it("has zero particles after all particles fully expire", () => {
    particleSystem.spawnGhostBurst(5, 0.3, 10, 0xff0000);
    expect(particleSystem.getParticleCount()).toBe(25);

    for (let i = 0; i < 100; i++) {
      particleSystem.update(0.05);
    }
    expect(particleSystem.getParticleCount()).toBe(0);
  });
});
