import type { Rng } from '../../engine/rng';

export const N = 9;
export const COLORS = ['#ff8c42', '#41d3bd', '#8367ff', '#ffd166', '#ff5d73', '#41a0ff', '#51e08a'];
export type Grid = number[]; // length 81, 0 empty else colorIndex+1
export const idx = (r: number, c: number) => r * N + c;

export interface Piece {
  id: number;
  cells: [number, number][];
  color: number;
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
  [[0, 0], [0, 1], [0, 2], [1, 0]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 1], [0, 1], [1, 0], [2, 2]] // (rare big)
];

let pid = 1;
export const makePiece = (rng: Rng): Piece => {
  const cells = rng.pick(SHAPES);
  return { id: pid++, cells: cells.map((c) => [c[0], c[1]]), color: rng.int(COLORS.length) };
};
export const makeTray = (rng: Rng): Piece[] => [makePiece(rng), makePiece(rng), makePiece(rng)];

export function canPlace(g: Grid, p: Piece, r: number, c: number): boolean {
  return p.cells.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && cc >= 0 && rr < N && cc < N && g[idx(rr, cc)] === 0;
  });
}

export function place(g: Grid, p: Piece, r: number, c: number): { grid: Grid; cleared: number; filled: number } {
  const ng = g.slice();
  for (const [dr, dc] of p.cells) ng[idx(r + dr, c + dc)] = p.color + 1;
  const filled = p.cells.length;

  const toClear = new Set<number>();
  let groups = 0;
  for (let i = 0; i < N; i++) {
    if (Array.from({ length: N }, (_, j) => ng[idx(i, j)]).every((v) => v !== 0)) {
      groups++;
      for (let j = 0; j < N; j++) toClear.add(idx(i, j));
    }
    if (Array.from({ length: N }, (_, j) => ng[idx(j, i)]).every((v) => v !== 0)) {
      groups++;
      for (let j = 0; j < N; j++) toClear.add(idx(j, i));
    }
  }
  for (let br = 0; br < 9; br += 3)
    for (let bc = 0; bc < 9; bc += 3) {
      let full = true;
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) if (ng[idx(br + dr, bc + dc)] === 0) full = false;
      if (full) {
        groups++;
        for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) toClear.add(idx(br + dr, bc + dc));
      }
    }
  toClear.forEach((cell) => (ng[cell] = 0));
  return { grid: ng, cleared: groups, filled };
}

export const placements = (g: Grid, p: Piece): [number, number][] => {
  const out: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(g, p, r, c)) out.push([r, c]);
  return out;
};
export const anyPlaceable = (g: Grid, tray: Piece[]) => tray.some((p) => placements(g, p).length > 0);

export function botMove(g: Grid, tray: Piece[]): { pieceIndex: number; r: number; c: number } | null {
  let best: { pieceIndex: number; r: number; c: number } | null = null;
  let bestScore = -Infinity;
  tray.forEach((p, pi) => {
    for (const [r, c] of placements(g, p)) {
      const res = place(g, p, r, c);
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
