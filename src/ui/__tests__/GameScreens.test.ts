import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../core/EventBus";
import { GameScreens, ScreenState } from "../GameScreens";

describe("GameScreens", () => {
  let eventBus: EventBus;
  let screens: GameScreens;

  beforeEach(() => {
    document.body.innerHTML = "";
    eventBus = new EventBus();
    screens = new GameScreens(eventBus);
  });

  afterEach(() => {
    screens.destroy();
  });

  it("shows home screen on creation", () => {
    expect(screens.getState()).toBe(ScreenState.HOME);
    expect(document.getElementById("btn-play")).toBeTruthy();
  });

  it("transitions to PLAYING on PLAY button click", () => {
    const handler = vi.fn();
    eventBus.on("game-start", handler);

    document.getElementById("btn-play")?.click();

    expect(screens.getState()).toBe(ScreenState.PLAYING);
    expect(handler).toHaveBeenCalled();
  });

  it("shows game-over screen on game-over event", () => {
    screens.startGame();
    eventBus.emit("score-changed", { score: 1500 });
    eventBus.emit("game-over", {});

    expect(screens.getState()).toBe(ScreenState.GAME_OVER);
    const overlay = document.getElementById("screen-overlay");
    expect(overlay?.textContent).toContain("GAME OVER");
    expect(overlay?.textContent).toContain("1500");
  });

  it("shows PLAY AGAIN button on game-over screen", () => {
    screens.startGame();
    eventBus.emit("game-over", {});

    expect(document.getElementById("btn-replay")).toBeTruthy();
  });

  it("shows level transition screen", () => {
    screens.showLevelTransition(3);
    expect(screens.getState()).toBe(ScreenState.LEVEL_TRANSITION);
    const overlay = document.getElementById("screen-overlay");
    expect(overlay?.textContent).toContain("LEVEL 3");
  });

  it("shows settings screen from home", () => {
    document.getElementById("btn-settings")?.click();
    expect(screens.getState()).toBe(ScreenState.SETTINGS);
    expect(document.getElementById("vol-master")).toBeTruthy();
    expect(document.getElementById("vol-sfx")).toBeTruthy();
    expect(document.getElementById("vol-music")).toBeTruthy();
  });

  it("returns to home from settings", () => {
    document.getElementById("btn-settings")?.click();
    document.getElementById("btn-back")?.click();
    expect(screens.getState()).toBe(ScreenState.HOME);
  });

  it("emits game-restart on play again click", () => {
    const handler = vi.fn();
    eventBus.on("game-restart", handler);

    screens.startGame();
    eventBus.emit("game-over", {});
    document.getElementById("btn-replay")?.click();

    expect(handler).toHaveBeenCalled();
  });
});
