import type { EventBus } from "../core/EventBus";
import type { AudioManager } from "../audio/AudioManager";

export class VolumeController {
  private audioManager: AudioManager;
  private previousMasterVolume = 1;

  constructor(audioManager: AudioManager, eventBus: EventBus) {
    this.audioManager = audioManager;

    eventBus.on<{ muted: boolean }>("sound-toggle", (event) => {
      if (event.muted) {
        this.previousMasterVolume = this.audioManager.getVolumes().master;
        this.audioManager.setMasterVolume(0);
      } else {
        this.audioManager.setMasterVolume(this.previousMasterVolume);
      }
    });

    eventBus.on<{ type: string; value: number }>("volume-change", (event) => {
      switch (event.type) {
        case "master":
          this.audioManager.setMasterVolume(event.value);
          this.previousMasterVolume = event.value;
          break;
        case "sfx":
          this.audioManager.setSFXVolume(event.value);
          break;
        case "music":
          this.audioManager.setMusicVolume(event.value);
          break;
      }
    });
  }

  getPreviousMasterVolume(): number {
    return this.previousMasterVolume;
  }
}
