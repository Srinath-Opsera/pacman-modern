export enum CellType {
  WALL = 0,
  EMPTY = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
  TUNNEL = 5,
}

export type MazeGrid = CellType[][];

const W = CellType.WALL;
const E = CellType.EMPTY;
const D = CellType.DOT;
const P = CellType.POWER_PELLET;
const G = CellType.GHOST_HOUSE;
const T = CellType.TUNNEL;

/**
 * The canonical 28x31 Pac-Man maze layout.
 *
 * Each sub-array is one row (left to right), and there are 31 rows (top to bottom).
 * The grid preserves the original arcade geometry:
 *   - Row 0 is the top wall, row 30 is the bottom wall.
 *   - Columns 0 and 27 are the side walls.
 *   - Tunnels are on row 14, columns 0–5 and 22–27.
 *   - The ghost house occupies rows 13–15, columns 10–17.
 *   - Power pellets are at (3,1), (3,26), (23,1), (23,26).
 */
const DEFAULT_MAZE_DEFINITION: CellType[][] = [
  // Row 0
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  // Row 1
  [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W],
  // Row 2
  [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
  // Row 3
  [W, P, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, P, W],
  // Row 4
  [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
  // Row 5
  [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
  // Row 6
  [W, D, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, D, W],
  // Row 7
  [W, D, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, D, W],
  // Row 8
  [W, D, D, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, D, D, W],
  // Row 9
  [W, W, W, W, W, W, D, W, W, W, W, W, E, W, W, E, W, W, W, W, W, D, W, W, W, W, W, W],
  // Row 10
  [W, W, W, W, W, W, D, W, W, W, W, W, E, W, W, E, W, W, W, W, W, D, W, W, W, W, W, W],
  // Row 11
  [W, W, W, W, W, W, D, W, W, E, E, E, E, E, E, E, E, E, E, W, W, D, W, W, W, W, W, W],
  // Row 12
  [W, W, W, W, W, W, D, W, W, E, W, W, W, G, G, W, W, W, E, W, W, D, W, W, W, W, W, W],
  // Row 13
  [W, W, W, W, W, W, D, W, W, E, W, G, G, G, G, G, G, W, E, W, W, D, W, W, W, W, W, W],
  // Row 14
  [T, T, T, T, T, T, D, E, E, E, W, G, G, G, G, G, G, W, E, E, E, D, T, T, T, T, T, T],
  // Row 15
  [W, W, W, W, W, W, D, W, W, E, W, G, G, G, G, G, G, W, E, W, W, D, W, W, W, W, W, W],
  // Row 16
  [W, W, W, W, W, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, W, W, W, W, W],
  // Row 17
  [W, W, W, W, W, W, D, W, W, E, E, E, E, E, E, E, E, E, E, W, W, D, W, W, W, W, W, W],
  // Row 18
  [W, W, W, W, W, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, W, W, W, W, W],
  // Row 19
  [W, W, W, W, W, W, D, W, W, E, W, W, W, W, W, W, W, W, E, W, W, D, W, W, W, W, W, W],
  // Row 20
  [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W],
  // Row 21
  [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
  // Row 22
  [W, D, W, W, W, W, D, W, W, W, W, W, D, W, W, D, W, W, W, W, W, D, W, W, W, W, D, W],
  // Row 23
  [W, P, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, P, W],
  // Row 24
  [W, W, W, D, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, D, W, W, W],
  // Row 25
  [W, W, W, D, W, W, D, W, W, D, W, W, W, W, W, W, W, W, D, W, W, D, W, W, D, W, W, W],
  // Row 26
  [W, D, D, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, W, W, D, D, D, D, D, D, W],
  // Row 27
  [W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W],
  // Row 28
  [W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W],
  // Row 29
  [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
  // Row 30
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
];

export function parseMaze(definition: CellType[][] = DEFAULT_MAZE_DEFINITION): MazeGrid {
  return definition.map((row) => [...row]);
}

export const MAZE_ROWS = 31;
export const MAZE_COLS = 28;

export const POWER_PELLET_POSITIONS: readonly { row: number; col: number }[] = [
  { row: 3, col: 1 },
  { row: 3, col: 26 },
  { row: 23, col: 1 },
  { row: 23, col: 26 },
] as const;
