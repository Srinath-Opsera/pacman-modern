import type { Component } from "../core/ECSWorld";

export enum GhostName {
  BLINKY = "blinky",
  PINKY = "pinky",
  INKY = "inky",
  CLYDE = "clyde",
}

export enum GhostMode {
  SCATTER = "scatter",
  CHASE = "chase",
  FRIGHTENED = "frightened",
  EATEN = "eaten",
}

export interface GhostTag extends Component {
  type: "ghostTag";
  name: GhostName;
  mode: GhostMode;
  frightenedTimer: number;
  scatterChaseTimer: number;
  scatterChasePhase: number;
}

export function createGhostTag(name: GhostName): GhostTag {
  return {
    type: "ghostTag",
    name,
    mode: GhostMode.SCATTER,
    frightenedTimer: 0,
    scatterChaseTimer: 0,
    scatterChasePhase: 0,
  };
}
