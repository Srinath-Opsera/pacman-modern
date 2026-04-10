import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../core/EventBus";
import { AudioManager } from "../../audio/AudioManager";
import { VolumeController } from "../VolumeController";

describe("VolumeController", () => {
  let eventBus: EventBus;
  let audioManager: AudioManager;
  let controller: VolumeController;

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
    controller = new VolumeController(audioManager, eventBus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("mutes by setting master volume to 0 and remembers previous volume", () => {
    audioManager.setMasterVolume(0.8);
    eventBus.emit("sound-toggle", { muted: true });

    expect(audioManager.getVolumes().master).toBe(0);
    expect(controller.getPreviousMasterVolume()).toBe(0.8);
  });

  it("unmutes by restoring previous master volume", () => {
    audioManager.setMasterVolume(0.7);
    eventBus.emit("sound-toggle", { muted: true });
    eventBus.emit("sound-toggle", { muted: false });

    expect(audioManager.getVolumes().master).toBe(0.7);
  });

  it("updates master volume on volume-change event", () => {
    eventBus.emit("volume-change", { type: "master", value: 0.5 });
    expect(audioManager.getVolumes().master).toBe(0.5);
  });

  it("updates SFX volume on volume-change event", () => {
    eventBus.emit("volume-change", { type: "sfx", value: 0.3 });
    expect(audioManager.getVolumes().sfx).toBe(0.3);
  });

  it("updates music volume on volume-change event", () => {
    eventBus.emit("volume-change", { type: "music", value: 0.9 });
    expect(audioManager.getVolumes().music).toBe(0.9);
  });
});
