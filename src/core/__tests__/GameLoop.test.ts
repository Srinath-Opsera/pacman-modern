import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameLoop } from "../GameLoop";
import { World } from "../ECSWorld";

describe("GameLoop", () => {
  let world: World;
  let loop: GameLoop;
  let rafCallbacks: ((timestamp: number) => void)[];

  beforeEach(() => {
    world = new World();
    loop = new GameLoop(world);
    rafCallbacks = [];

    vi.spyOn(world, "update");

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: (timestamp: number) => void) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function flushFrame(timestamp: number): void {
    const cb = rafCallbacks.shift();
    cb?.(timestamp);
  }

  it("starts the loop and calls requestAnimationFrame", () => {
    loop.start();

    expect(loop.isRunning()).toBe(true);
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it("calculates delta-time and passes it to world.update", () => {
    loop.start();

    flushFrame(1000);
    expect(world.update).not.toHaveBeenCalled();

    flushFrame(1016);
    expect(world.update).toHaveBeenCalledWith(0.016);
  });

  it("clamps delta-time to a maximum of 0.1 seconds", () => {
    loop.start();

    flushFrame(0);
    flushFrame(500);

    expect(world.update).toHaveBeenCalledWith(0.1);
  });

  it("pause() halts the loop and resume() restarts it", () => {
    loop.start();

    loop.pause();
    expect(loop.isPaused()).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalled();

    loop.resume();
    expect(loop.isPaused()).toBe(false);
    expect(loop.isRunning()).toBe(true);
  });

  it("stop() fully stops the loop", () => {
    loop.start();
    loop.stop();

    expect(loop.isRunning()).toBe(false);
    expect(loop.isPaused()).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not start twice if already running", () => {
    loop.start();
    const callCount = (requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length;

    loop.start();
    expect((requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it("resume() resets lastTimestamp to avoid time spikes after pause", () => {
    loop.start();
    flushFrame(0);
    flushFrame(16);

    loop.pause();
    vi.mocked(world.update).mockClear();

    loop.resume();
    flushFrame(5000);
    expect(world.update).not.toHaveBeenCalled();

    flushFrame(5016);
    expect(world.update).toHaveBeenCalledWith(0.016);
  });
});
