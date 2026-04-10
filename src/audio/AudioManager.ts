import type { EventBus } from "../core/EventBus";

export interface VolumeSettings {
  master: number;
  sfx: number;
  music: number;
}

const STORAGE_KEY = "pacman-audio-settings";

const DEFAULT_VOLUMES: VolumeSettings = {
  master: 1,
  sfx: 0.8,
  music: 0.5,
};

export class AudioManager {
  private volumes: VolumeSettings;
  private audioContextInitialized = false;
  private audioContext: AudioContext | null = null;

  constructor(eventBus: EventBus) {
    this.volumes = this.loadSettings();

    eventBus.on("dot-eaten", (payload: unknown) => {
      const event = payload as { isPowerPellet: boolean };
      if (event.isPowerPellet) {
        this.playSFX("power-pellet");
      } else {
        this.playSFX("dot-eat");
      }
    });

    eventBus.on("ghost-eaten", () => this.playSFX("ghost-eaten"));
    eventBus.on("life-lost", () => this.playSFX("death"));
    eventBus.on("level-advanced", () => this.playSFX("level-complete"));
    eventBus.on("game-over", () => this.playSFX("game-over"));

    this.setupAutoplayUnlock();
  }

  private setupAutoplayUnlock(): void {
    const unlock = () => {
      if (!this.audioContextInitialized) {
        this.audioContext = new AudioContext();
        this.audioContextInitialized = true;
      }
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  playSFX(name: string): void {
    if (!this.audioContextInitialized) return;
    void this.playSound(name, this.volumes.sfx * this.volumes.master);
  }

  playMusic(_name: string): void {
    if (!this.audioContextInitialized) return;
    // Music playback would use Howler.js in production
  }

  private async playSound(_name: string, _volume: number): Promise<void> {
    // In production, this would load and play audio files via Howler.js
    // Stubbed for the ECS architecture — sound files are loaded lazily
  }

  setMasterVolume(value: number): void {
    this.volumes.master = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  setSFXVolume(value: number): void {
    this.volumes.sfx = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  setMusicVolume(value: number): void {
    this.volumes.music = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  getVolumes(): Readonly<VolumeSettings> {
    return { ...this.volumes };
  }

  isInitialized(): boolean {
    return this.audioContextInitialized;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.volumes));
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadSettings(): VolumeSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_VOLUMES, ...(JSON.parse(stored) as Partial<VolumeSettings>) };
      }
    } catch {
      // localStorage may be unavailable
    }
    return { ...DEFAULT_VOLUMES };
  }
}
