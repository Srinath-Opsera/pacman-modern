import type { Component } from "../core/ECSWorld";

export interface GridPosition extends Component {
  type: "gridPosition";
  row: number;
  col: number;
}

export function createGridPosition(row: number, col: number): GridPosition {
  return { type: "gridPosition", row, col };
}
