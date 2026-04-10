import { describe, it, expect, beforeEach } from "vitest";
import { EventBus } from "../../core/EventBus";
import { HUD } from "../HUD";

describe("HUD", () => {
  let eventBus: EventBus;
  let hud: HUD;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="hud-overlay">
        <div id="hud-score"></div>
        <div id="hud-lives"></div>
        <div id="hud-level"></div>
      </div>
    `;
    eventBus = new EventBus();
    hud = new HUD(eventBus);
  });

  it("renders initial score as 0", () => {
    expect(hud.getScore()).toBe(0);
    expect(document.getElementById("hud-score")?.textContent).toBe("Score: 0");
  });

  it("renders initial lives as 3", () => {
    expect(hud.getLives()).toBe(3);
  });

  it("renders initial level as 1", () => {
    expect(hud.getLevel()).toBe(1);
    expect(document.getElementById("hud-level")?.textContent).toBe("Level: 1");
  });

  it("updates score on score-changed event", () => {
    eventBus.emit("score-changed", { score: 420 });
    expect(hud.getScore()).toBe(420);
    expect(document.getElementById("hud-score")?.textContent).toBe("Score: 420");
  });

  it("updates lives on life-lost event", () => {
    eventBus.emit("life-lost", { livesRemaining: 2 });
    expect(hud.getLives()).toBe(2);
  });

  it("updates lives on extra-life event", () => {
    eventBus.emit("extra-life", { lives: 4 });
    expect(hud.getLives()).toBe(4);
  });

  it("updates level on level-advanced event", () => {
    eventBus.emit("level-advanced", { level: 5 });
    expect(hud.getLevel()).toBe(5);
    expect(document.getElementById("hud-level")?.textContent).toBe("Level: 5");
  });

  it("adds camera and sound control buttons", () => {
    const buttons = document.querySelectorAll(".hud-btn");
    expect(buttons.length).toBe(2);
  });

  it("toggles muted state on sound button click", () => {
    const soundBtn = document.querySelectorAll(".hud-btn")[1] as HTMLButtonElement;
    expect(hud.isMuted()).toBe(false);

    soundBtn.click();
    expect(hud.isMuted()).toBe(true);

    soundBtn.click();
    expect(hud.isMuted()).toBe(false);
  });
});
