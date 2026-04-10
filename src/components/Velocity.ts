import type { Component } from "../core/ECSWorld";

export enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

export interface Velocity extends Component {
  type: "velocity";
  direction: Direction;
  speed: number;
}

export function createVelocity(direction: Direction, speed: number): Velocity {
  return { type: "velocity", direction, speed };
}
