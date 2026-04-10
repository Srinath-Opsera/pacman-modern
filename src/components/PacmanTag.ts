import type { Component } from "../core/ECSWorld";

export interface PacmanTag extends Component {
  type: "pacmanTag";
}

export function createPacmanTag(): PacmanTag {
  return { type: "pacmanTag" };
}
