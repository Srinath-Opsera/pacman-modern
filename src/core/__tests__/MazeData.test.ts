import { describe, it, expect } from "vitest";
import { CellType, parseMaze, MAZE_ROWS, MAZE_COLS, POWER_PELLET_POSITIONS } from "../MazeData";

describe("MazeData", () => {
  const grid = parseMaze();

  it("produces a grid with 31 rows", () => {
    expect(grid.length).toBe(MAZE_ROWS);
    expect(grid.length).toBe(31);
  });

  it("produces a grid with 28 columns in every row", () => {
    for (const row of grid) {
      expect(row.length).toBe(MAZE_COLS);
      expect(row.length).toBe(28);
    }
  });

  it("places power pellets at the four canonical positions", () => {
    expect(POWER_PELLET_POSITIONS).toHaveLength(4);

    const expectedPositions = [
      { row: 3, col: 1 },
      { row: 3, col: 26 },
      { row: 23, col: 1 },
      { row: 23, col: 26 },
    ];

    for (const pos of expectedPositions) {
      expect(grid[pos.row][pos.col]).toBe(CellType.POWER_PELLET);
    }
  });

  it("has walls forming the outer boundary", () => {
    for (let col = 0; col < MAZE_COLS; col++) {
      expect(grid[0][col]).toBe(CellType.WALL);
      expect(grid[MAZE_ROWS - 1][col]).toBe(CellType.WALL);
    }
  });

  it("has tunnel cells on row 14 at the left and right edges", () => {
    for (let col = 0; col <= 5; col++) {
      expect(grid[14][col]).toBe(CellType.TUNNEL);
    }
    for (let col = 22; col <= 27; col++) {
      expect(grid[14][col]).toBe(CellType.TUNNEL);
    }
  });

  it("has ghost house cells in the center of the maze", () => {
    expect(grid[13][13]).toBe(CellType.GHOST_HOUSE);
    expect(grid[13][14]).toBe(CellType.GHOST_HOUSE);
    expect(grid[14][13]).toBe(CellType.GHOST_HOUSE);
    expect(grid[14][14]).toBe(CellType.GHOST_HOUSE);
  });

  it("returns a defensive copy that does not mutate the original", () => {
    const grid1 = parseMaze();
    const grid2 = parseMaze();

    grid1[1][1] = CellType.WALL;

    expect(grid2[1][1]).toBe(CellType.DOT);
  });

  it("contains all required CellType values somewhere in the grid", () => {
    const allCells = grid.flat();
    expect(allCells).toContain(CellType.WALL);
    expect(allCells).toContain(CellType.EMPTY);
    expect(allCells).toContain(CellType.DOT);
    expect(allCells).toContain(CellType.POWER_PELLET);
    expect(allCells).toContain(CellType.GHOST_HOUSE);
    expect(allCells).toContain(CellType.TUNNEL);
  });
});
