import type { EventBus } from "../core/EventBus";
import { GhostName } from "../components/GhostTag";

export enum ColorblindMode {
  OFF = "off",
  DEUTERANOPIA = "deuteranopia",
  PROTANOPIA = "protanopia",
  TRITANOPIA = "tritanopia",
}

const NORMAL_COLORS: Record<GhostName, number> = {
  [GhostName.BLINKY]: 0xff0000,
  [GhostName.PINKY]: 0xffb8ff,
  [GhostName.INKY]: 0x00ffff,
  [GhostName.CLYDE]: 0xffb851,
};

const CB_COLORS: Record<GhostName, number> = {
  [GhostName.BLINKY]: 0xff6600,
  [GhostName.PINKY]: 0x0066ff,
  [GhostName.INKY]: 0xffffff,
  [GhostName.CLYDE]: 0xffee00,
};

const GHOST_PATTERNS: Record<GhostName, string> = {
  [GhostName.BLINKY]: "solid",
  [GhostName.PINKY]: "striped",
  [GhostName.INKY]: "dotted",
  [GhostName.CLYDE]: "checkered",
};

const STORAGE_KEY = "pacman-colorblind";

export class AccessibilityManager {
  private mode: ColorblindMode;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.mode = this.loadMode();
  }

  setMode(mode: ColorblindMode): void {
    this.mode = mode;
    this.saveMode(mode);
    this.eventBus.emit("colorblind-changed", {
      mode,
      colors: this.getGhostColors(),
      patterns: this.getGhostPatterns(),
    });
  }

  getMode(): ColorblindMode {
    return this.mode;
  }

  isColorblindActive(): boolean {
    return this.mode !== ColorblindMode.OFF;
  }

  getGhostColor(name: GhostName): number {
    return this.isColorblindActive() ? CB_COLORS[name] : NORMAL_COLORS[name];
  }

  getGhostColors(): Record<GhostName, number> {
    if (this.isColorblindActive()) return { ...CB_COLORS };
    return { ...NORMAL_COLORS };
  }

  getGhostPattern(name: GhostName): string {
    return this.isColorblindActive() ? GHOST_PATTERNS[name] : "solid";
  }

  getGhostPatterns(): Record<GhostName, string> {
    if (this.isColorblindActive()) return { ...GHOST_PATTERNS };
    return {
      [GhostName.BLINKY]: "solid",
      [GhostName.PINKY]: "solid",
      [GhostName.INKY]: "solid",
      [GhostName.CLYDE]: "solid",
    };
  }

  private saveMode(mode: ColorblindMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadMode(): ColorblindMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ColorblindMode | null;
      if (stored && Object.values(ColorblindMode).includes(stored)) {
        return stored;
      }
    } catch {
      // localStorage may be unavailable
    }
    return ColorblindMode.OFF;
  }

  static setupAriaLabels(): void {
    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.getAttribute("aria-label") && btn.textContent) {
        btn.setAttribute("aria-label", btn.textContent.trim());
      }
    });

    document.querySelectorAll('input[type="range"]').forEach((slider) => {
      const label = slider.closest("label");
      if (label && !slider.getAttribute("aria-label")) {
        slider.setAttribute("aria-label", label.textContent?.trim() ?? "");
      }
    });
  }
}
