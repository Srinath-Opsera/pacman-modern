import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../core/EventBus";
import { AccessibilityManager, ColorblindMode } from "../AccessibilityManager";
import { GhostName } from "../../components/GhostTag";

describe("AccessibilityManager", () => {
  let eventBus: EventBus;
  let manager: AccessibilityManager;

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    eventBus = new EventBus();
    manager = new AccessibilityManager(eventBus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("defaults to colorblind mode OFF", () => {
    expect(manager.getMode()).toBe(ColorblindMode.OFF);
    expect(manager.isColorblindActive()).toBe(false);
  });

  it("returns normal ghost colors when colorblind mode is off", () => {
    expect(manager.getGhostColor(GhostName.BLINKY)).toBe(0xff0000);
    expect(manager.getGhostColor(GhostName.PINKY)).toBe(0xffb8ff);
  });

  it("returns alternative ghost colors when colorblind mode is on", () => {
    manager.setMode(ColorblindMode.DEUTERANOPIA);
    expect(manager.isColorblindActive()).toBe(true);
    expect(manager.getGhostColor(GhostName.BLINKY)).toBe(0xff6600);
    expect(manager.getGhostColor(GhostName.INKY)).toBe(0xffffff);
  });

  it("returns patterns in colorblind mode", () => {
    manager.setMode(ColorblindMode.PROTANOPIA);
    expect(manager.getGhostPattern(GhostName.BLINKY)).toBe("solid");
    expect(manager.getGhostPattern(GhostName.PINKY)).toBe("striped");
    expect(manager.getGhostPattern(GhostName.INKY)).toBe("dotted");
    expect(manager.getGhostPattern(GhostName.CLYDE)).toBe("checkered");
  });

  it("returns all-solid patterns when colorblind mode is off", () => {
    const patterns = manager.getGhostPatterns();
    expect(Object.values(patterns).every((p) => p === "solid")).toBe(true);
  });

  it("emits colorblind-changed event on mode change", () => {
    const handler = vi.fn();
    eventBus.on("colorblind-changed", handler);

    manager.setMode(ColorblindMode.TRITANOPIA);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ mode: ColorblindMode.TRITANOPIA }),
    );
  });

  it("persists mode to localStorage", () => {
    manager.setMode(ColorblindMode.DEUTERANOPIA);
    expect(localStorage.setItem).toHaveBeenCalledWith("pacman-colorblind", "deuteranopia");
  });

  it("loads saved mode from localStorage", () => {
    vi.mocked(localStorage.getItem).mockReturnValue("protanopia");
    const loaded = new AccessibilityManager(eventBus);
    expect(loaded.getMode()).toBe(ColorblindMode.PROTANOPIA);
  });

  it("sets ARIA labels on buttons and sliders", () => {
    document.body.innerHTML = `
      <button>Play</button>
      <label>Master Volume <input type="range" /></label>
    `;
    AccessibilityManager.setupAriaLabels();

    expect(document.querySelector("button")?.getAttribute("aria-label")).toBe("Play");
    expect(document.querySelector("input")?.getAttribute("aria-label")).toContain("Master Volume");
  });
});
