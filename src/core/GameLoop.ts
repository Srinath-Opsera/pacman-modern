import type { World } from "./ECSWorld";

export class GameLoop {
  private world: World;
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private running = false;
  private paused = false;

  constructor(world: World) {
    this.world = world;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTimestamp = null;
    this.scheduleFrame();
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTimestamp = null;
    this.scheduleFrame();
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private scheduleFrame(): void {
    this.rafId = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  private tick(timestamp: number): void {
    if (!this.running || this.paused) return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.scheduleFrame();
      return;
    }

    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const maxDelta = 0.1;
    this.world.update(Math.min(deltaTime, maxDelta));

    this.scheduleFrame();
  }
}
