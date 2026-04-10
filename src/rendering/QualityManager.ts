export enum QualityPreset {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export interface QualitySettings {
  maxParticles: number;
  antialias: boolean;
  shadows: boolean;
  bloom: boolean;
  pixelRatio: number;
  simplifiedMaterials: boolean;
}

const PRESET_SETTINGS: Record<QualityPreset, QualitySettings> = {
  [QualityPreset.HIGH]: {
    maxParticles: 200,
    antialias: true,
    shadows: true,
    bloom: true,
    pixelRatio: 2,
    simplifiedMaterials: false,
  },
  [QualityPreset.MEDIUM]: {
    maxParticles: 100,
    antialias: true,
    shadows: false,
    bloom: false,
    pixelRatio: 1.5,
    simplifiedMaterials: false,
  },
  [QualityPreset.LOW]: {
    maxParticles: 30,
    antialias: false,
    shadows: false,
    bloom: false,
    pixelRatio: 1,
    simplifiedMaterials: true,
  },
};

const STORAGE_KEY = "pacman-quality";

export class QualityManager {
  private preset: QualityPreset;
  private settings: QualitySettings;

  constructor() {
    const saved = this.loadPreset();
    if (saved) {
      this.preset = saved;
    } else {
      this.preset = this.detectDeviceCapability();
    }
    this.settings = { ...PRESET_SETTINGS[this.preset] };
  }

  private detectDeviceCapability(): QualityPreset {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;

    if (isMobile) {
      if (cores <= 4 || memory <= 3) return QualityPreset.LOW;
      return QualityPreset.MEDIUM;
    }

    if (cores >= 8 && memory >= 8) return QualityPreset.HIGH;
    if (cores >= 4) return QualityPreset.MEDIUM;
    return QualityPreset.LOW;
  }

  setPreset(preset: QualityPreset): void {
    this.preset = preset;
    this.settings = { ...PRESET_SETTINGS[preset] };
    this.savePreset(preset);
  }

  getPreset(): QualityPreset {
    return this.preset;
  }

  getSettings(): Readonly<QualitySettings> {
    return { ...this.settings };
  }

  private savePreset(preset: QualityPreset): void {
    try {
      localStorage.setItem(STORAGE_KEY, preset);
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadPreset(): QualityPreset | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as QualityPreset | null;
      if (stored && Object.values(QualityPreset).includes(stored)) {
        return stored;
      }
    } catch {
      // localStorage may be unavailable
    }
    return null;
  }
}
