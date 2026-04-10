import { describe, it, expect, beforeEach } from "vitest";
import { InputManager, InputCommand } from "../InputManager";

describe("InputManager", () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  it("starts with NONE command", () => {
    expect(inputManager.poll()).toBe(InputCommand.NONE);
  });

  it("maps ArrowUp to UP command", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(inputManager.poll()).toBe(InputCommand.UP);
  });

  it("maps ArrowDown to DOWN command", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(inputManager.poll()).toBe(InputCommand.DOWN);
  });

  it("maps ArrowLeft to LEFT command", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(inputManager.poll()).toBe(InputCommand.LEFT);
  });

  it("maps ArrowRight to RIGHT command", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(inputManager.poll()).toBe(InputCommand.RIGHT);
  });

  it("maps WASD keys to directions", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(inputManager.poll()).toBe(InputCommand.UP);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(inputManager.poll()).toBe(InputCommand.LEFT);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(inputManager.poll()).toBe(InputCommand.DOWN);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(inputManager.poll()).toBe(InputCommand.RIGHT);
  });

  it("maps Escape to PAUSE command", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(inputManager.poll()).toBe(InputCommand.PAUSE);
  });

  it("retains last direction after poll returns NONE queued", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    inputManager.poll();

    const secondPoll = inputManager.poll();
    expect(secondPoll).toBe(InputCommand.RIGHT);
  });

  it("resets all commands on reset()", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    inputManager.poll();
    inputManager.reset();
    expect(inputManager.getCurrentDirection()).toBe(InputCommand.NONE);
  });

  it("processes injected commands via injectCommand()", () => {
    inputManager.injectCommand(InputCommand.LEFT);
    expect(inputManager.poll()).toBe(InputCommand.LEFT);
  });
});
