import type { Rng } from '../../engine/rng';

export const N = 8;
export const TARGET_LINES = 10;

export const BLOCK_COLORS = ['#ff8c42', '#41d3bd', '#8367ff', '#ffd166', '#ff5d73', '#41a0ff', '#51e08a'];

export type Grid = number[]; // length N*N, 0 = empty, else colorIndex+1
export const idx = (r: number, c: number) => r * N + c;

export interface Piece {
  id: number;
  cells: [number, number][]; // normalized offsets (minRow=minCol=0)
  color: number; // index into BLOCK_COLORS
}

const SHAPES: [number, number][][] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]]
];

let pid = 1;
export function makePiece(rng: Rng): Piece {
  const cells = rng.pick(SHAPES);
  return { id: pid++, cells: cells.map((c) => [c[0], c[1]]), color: rng.int(BLOCK_COLORS.length) };
}

export const makeTray = (rng: Rng): Piece[] => [makePiece(rng), makePiece(rng), makePiece(rng)];

export function canPlace(grid: Grid, p: Piece, r: number, c: number): boolean {
  for (const [dr, dc] of p.cells) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= N || cc >= N) return false;
    if (grid[idx(rr, cc)] !== 0) return false;
  }
  return true;
}

export function place(
  grid: Grid,
  p: Piece,
  r: number,
  c: number
): { grid: Grid; cleared: number; filled: number } {
  const g = grid.slice();
  for (const [dr, dc] of p.cells) g[idx(r + dr, c + dc)] = p.color + 1;
  const filled = p.cells.length;

  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let i = 0; i < N; i++) {
    let rowFull = true;
    let colFull = true;
    for (let j = 0; j < N; j++) {
      if (g[idx(i, j)] === 0) rowFull = false;
      if (g[idx(j, i)] === 0) colFull = false;
    }
    if (rowFull) fullRows.push(i);
    if (colFull) fullCols.push(i);
  }
  for (const rr of fullRows) for (let j = 0; j < N; j++) g[idx(rr, j)] = 0;
  for (const cc of fullCols) for (let j = 0; j < N; j++) g[idx(j, cc)] = 0;

  return { grid: g, cleared: fullRows.length + fullCols.length, filled };
}

export function placements(grid: Grid, p: Piece): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(grid, p, r, c)) out.push([r, c]);
  return out;
}

export const anyPlaceable = (grid: Grid, tray: Piece[]) =>
  tray.some((p) => placements(grid, p).length > 0);

/** Bot: choose (pieceIndex, r, c) maximizing clears then emptiness. */
export interface BotMove {
  pieceIndex: number;
  r: number;
  c: number;
}

export function botMove(grid: Grid, tray: Piece[]): BotMove | null {
  let best: BotMove | null = null;
  let bestScore = -Infinity;
  tray.forEach((p, pi) => {
    for (const [r, c] of placements(grid, p)) {
      const res = place(grid, p, r, c);
      const empties = res.grid.filter((v) => v === 0).length;
      const score = res.cleared * 100 + empties;
      if (score > bestScore) {
        bestScore = score;
        best = { pieceIndex: pi, r, c };
      }
    }
  });
  return best;
}
