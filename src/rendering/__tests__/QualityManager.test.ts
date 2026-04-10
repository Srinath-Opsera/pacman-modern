import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QualityManager, QualityPreset } from "../QualityManager";

describe("QualityManager", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
      hardwareConcurrency: 8,
      deviceMemory: 16,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("selects HIGH quality for capable desktop", () => {
    const qm = new QualityManager();
    expect(qm.getPreset()).toBe(QualityPreset.HIGH);
  });

  it("selects LOW quality for mobile with limited resources", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone) Safari/17",
      hardwareConcurrency: 4,
      deviceMemory: 3,
    });

    const qm = new QualityManager();
    expect(qm.getPreset()).toBe(QualityPreset.LOW);
  });

  it("selects MEDIUM for mobile with good resources", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Android) Chrome/120",
      hardwareConcurrency: 8,
      deviceMemory: 8,
    });

    const qm = new QualityManager();
    expect(qm.getPreset()).toBe(QualityPreset.MEDIUM);
  });

  it("returns correct settings for HIGH preset", () => {
    const qm = new QualityManager();
    qm.setPreset(QualityPreset.HIGH);
    const s = qm.getSettings();
    expect(s.maxParticles).toBe(200);
    expect(s.antialias).toBe(true);
    expect(s.shadows).toBe(true);
    expect(s.pixelRatio).toBe(2);
  });

  it("returns correct settings for MEDIUM preset", () => {
    const qm = new QualityManager();
    qm.setPreset(QualityPreset.MEDIUM);
    const s = qm.getSettings();
    expect(s.maxParticles).toBe(100);
    expect(s.shadows).toBe(false);
    expect(s.bloom).toBe(false);
  });

  it("returns correct settings for LOW preset", () => {
    const qm = new QualityManager();
    qm.setPreset(QualityPreset.LOW);
    const s = qm.getSettings();
    expect(s.maxParticles).toBe(30);
    expect(s.antialias).toBe(false);
    expect(s.simplifiedMaterials).toBe(true);
    expect(s.pixelRatio).toBe(1);
  });

  it("persists preset to localStorage", () => {
    const qm = new QualityManager();
    qm.setPreset(QualityPreset.LOW);
    expect(localStorage.setItem).toHaveBeenCalledWith("pacman-quality", "low");
  });

  it("loads saved preset from localStorage", () => {
    vi.mocked(localStorage.getItem).mockReturnValue("medium");
    const qm = new QualityManager();
    expect(qm.getPreset()).toBe(QualityPreset.MEDIUM);
  });
});
