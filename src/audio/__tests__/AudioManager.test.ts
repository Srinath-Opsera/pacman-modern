import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../core/EventBus";
import { AudioManager } from "../AudioManager";

describe("AudioManager", () => {
  let eventBus: EventBus;
  let audioManager: AudioManager;

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        resume = vi.fn();
      },
    );

    eventBus = new EventBus();
    audioManager = new AudioManager(eventBus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts uninitialized before user interaction", () => {
    expect(audioManager.isInitialized()).toBe(false);
  });

  it("initializes AudioContext on first user click", () => {
    document.dispatchEvent(new Event("click"));
    expect(audioManager.isInitialized()).toBe(true);
    expect(audioManager.getAudioContext()).toBeDefined();
  });

  it("starts with default volume settings", () => {
    const volumes = audioManager.getVolumes();
    expect(volumes.master).toBe(1);
    expect(volumes.sfx).toBe(0.8);
    expect(volumes.music).toBe(0.5);
  });

  it("sets and persists master volume", () => {
    audioManager.setMasterVolume(0.6);
    expect(audioManager.getVolumes().master).toBe(0.6);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("sets and persists SFX volume", () => {
    audioManager.setSFXVolume(0.3);
    expect(audioManager.getVolumes().sfx).toBe(0.3);
  });

  it("sets and persists music volume", () => {
    audioManager.setMusicVolume(0.9);
    expect(audioManager.getVolumes().music).toBe(0.9);
  });

  it("clamps volume values to 0-1 range", () => {
    audioManager.setMasterVolume(1.5);
    expect(audioManager.getVolumes().master).toBe(1);

    audioManager.setMasterVolume(-0.5);
    expect(audioManager.getVolumes().master).toBe(0);
  });

  it("loads saved settings from localStorage", () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({ master: 0.7, sfx: 0.4, music: 0.2 }),
    );

    const newManager = new AudioManager(eventBus);
    const volumes = newManager.getVolumes();
    expect(volumes.master).toBe(0.7);
    expect(volumes.sfx).toBe(0.4);
    expect(volumes.music).toBe(0.2);
  });

  it("subscribes to game events for audio playback", () => {
    document.dispatchEvent(new Event("click"));

    const playSpy = vi.spyOn(audioManager, "playSFX");

    eventBus.emit("dot-eaten", { isPowerPellet: false });
    expect(playSpy).toHaveBeenCalledWith("dot-eat");

    eventBus.emit("dot-eaten", { isPowerPellet: true });
    expect(playSpy).toHaveBeenCalledWith("power-pellet");

    eventBus.emit("ghost-eaten", {});
    expect(playSpy).toHaveBeenCalledWith("ghost-eaten");
  });
});
