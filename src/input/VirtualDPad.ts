import type { InputManager } from "./InputManager";
import { InputCommand } from "./InputManager";

export class VirtualDPad {
  private container: HTMLElement;
  private inputManager: InputManager;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.container = document.createElement("div");
    this.container.className = "virtual-dpad";
    this.container.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: grid; grid-template-columns: 60px 60px 60px; grid-template-rows: 60px 60px 60px;
      gap: 4px; z-index: 1000; touch-action: none; user-select: none;
    `;

    this.addButton("↑", InputCommand.UP, 1, 0);
    this.addButton("←", InputCommand.LEFT, 0, 1);
    this.addButton("→", InputCommand.RIGHT, 2, 1);
    this.addButton("↓", InputCommand.DOWN, 1, 2);

    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      document.body.appendChild(this.container);
    }
  }

  private addButton(label: string, command: InputCommand, col: number, row: number): void {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = `
      grid-column: ${col + 1}; grid-row: ${row + 1};
      width: 60px; height: 60px; border-radius: 12px;
      background: rgba(255,255,255,0.2); color: white;
      border: 2px solid rgba(255,255,255,0.4); font-size: 24px;
      cursor: pointer; touch-action: manipulation;
    `;

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.inputManager.injectCommand(command);
    });

    this.container.appendChild(btn);
  }

  show(): void {
    this.container.style.display = "grid";
  }

  hide(): void {
    this.container.style.display = "none";
  }

  destroy(): void {
    this.container.remove();
  }
}
