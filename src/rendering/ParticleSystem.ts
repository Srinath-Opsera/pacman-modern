import * as THREE from "three";
import type { EventBus } from "../core/EventBus";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

const MAX_PARTICLES = 500;

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene, eventBus: EventBus) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    eventBus.on<{ row: number; col: number; isPowerPellet: boolean }>("dot-eaten", (event) => {
      if (event.isPowerPellet) {
        this.spawnPowerPelletBurst(event.col, 0.3, event.row);
      } else {
        this.spawnDotBurst(event.col, 0.3, event.row);
      }
    });

    eventBus.on<{ color?: number; x: number; z: number; points: number }>(
      "ghost-eaten-vfx",
      (event) => {
        this.spawnGhostBurst(event.x, 0.5, event.z, event.color ?? 0xff0000);
      },
    );
  }

  spawnDotBurst(x: number, y: number, z: number): void {
    const count = 5 + Math.floor(Math.random() * 6);
    const color = new THREE.Color(0xffffff);
    for (let i = 0; i < count; i++) {
      this.addParticle(x, y, z, color, 0.3, 0.08, 2);
    }
  }

  spawnPowerPelletBurst(x: number, y: number, z: number): void {
    const color = new THREE.Color(0xffff00);
    for (let i = 0; i < 15; i++) {
      this.addParticle(x, y, z, color, 0.5, 0.15, 3);
    }
  }

  spawnGhostBurst(x: number, y: number, z: number, colorHex: number): void {
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < 25; i++) {
      this.addParticle(x, y, z, color, 1.0, 0.12, 4);
    }
  }

  private addParticle(
    x: number,
    y: number,
    z: number,
    color: THREE.Color,
    maxLife: number,
    size: number,
    speed: number,
  ): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.abs(Math.cos(phi)) * speed * 0.5 + 1,
      Math.sin(phi) * Math.sin(theta) * speed,
    );

    this.particles.push({
      position: new THREE.Vector3(x, y, z),
      velocity: vel,
      life: maxLife,
      maxLife,
      color: color.clone(),
      size,
    });
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      p.velocity.y -= 5 * deltaTime;
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const alpha = p.life / p.maxLife;
        this.positions[i * 3] = p.position.x;
        this.positions[i * 3 + 1] = p.position.y;
        this.positions[i * 3 + 2] = p.position.z;
        this.colors[i * 3] = p.color.r * alpha;
        this.colors[i * 3 + 1] = p.color.g * alpha;
        this.colors[i * 3 + 2] = p.color.b * alpha;
        this.sizes[i] = p.size * alpha;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -1000;
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
