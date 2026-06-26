import type { Rng } from '../../engine/rng';

export const R = 2; // hexagon radius -> 19 cells
export const HEX_COLORS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff', '#41d3bd'];

export interface Axial {
  q: number;
  r: number;
}

// Build the hexagon's cells + a coord->index map.
export const CELLS: Axial[] = (() => {
  const out: Axial[] = [];
  for (let q = -R; q <= R; q++)
    for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) out.push({ q, r });
  return out;
})();
const key = (q: number, r: number) => `${q},${r}`;
const INDEX = new Map(CELLS.map((c, i) => [key(c.q, c.r), i]));
export const cellIndex = (q: number, r: number) => INDEX.get(key(q, r)) ?? -1;

// Lines along the three hex axes (constant q, constant r, constant s=-q-r).
export const LINES: number[][] = (() => {
  const groups: Record<string, number[]> = {};
  const add = (g: string, i: number) => ((groups[g] ??= []).push(i));
  CELLS.forEach((c, i) => {
    add('q' + c.q, i);
    add('r' + c.r, i);
    add('s' + (-c.q - c.r), i);
  });
  return Object.values(groups).filter((g) => g.length >= 2);
})();

export type Board = number[]; // length CELLS.length, 0 empty else color+1
export const emptyBoard = (): Board => Array(CELLS.length).fill(0);

const SHAPES: Axial[][] = [
  [{ q: 0, r: 0 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }],
  [{ q: 0, r: 0 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: -1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }],
  [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }],
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: -1 }]
];

export interface Piece {
  id: number;
  cells: Axial[];
  color: number;
}
let pid = 1;
export const makePiece = (rng: Rng): Piece => ({
  id: pid++,
  cells: rng.pick(SHAPES),
  color: rng.int(HEX_COLORS.length)
});
export const makeTray = (rng: Rng): Piece[] => [makePiece(rng), makePiece(rng), makePiece(rng)];

export function canPlace(board: Board, p: Piece, anchor: Axial): boolean {
  return p.cells.every((d) => {
    const i = cellIndex(anchor.q + d.q, anchor.r + d.r);
    return i >= 0 && board[i] === 0;
  });
}

export function place(board: Board, p: Piece, anchor: Axial): { board: Board; cleared: number } {
  const nb = board.slice();
  for (const d of p.cells) nb[cellIndex(anchor.q + d.q, anchor.r + d.r)] = p.color + 1;
  const toClear = new Set<number>();
  let lines = 0;
  for (const line of LINES) {
    if (line.every((i) => nb[i] !== 0)) {
      lines++;
      line.forEach((i) => toClear.add(i));
    }
  }
  toClear.forEach((i) => (nb[i] = 0));
  return { board: nb, cleared: lines };
}

export const placements = (board: Board, p: Piece): Axial[] =>
  CELLS.filter((c) => canPlace(board, p, c));
export const anyPlaceable = (board: Board, tray: Piece[]) =>
  tray.some((p) => placements(board, p).length > 0);

export function botMove(board: Board, tray: Piece[]): { pieceIndex: number; anchor: Axial } | null {
  let best: { pieceIndex: number; anchor: Axial } | null = null;
  let bestScore = -Infinity;
  tray.forEach((p, pi) => {
    for (const a of placements(board, p)) {
      const res = place(board, p, a);
      const empties = res.board.filter((v) => v === 0).length;
      const score = res.cleared * 100 + empties;
      if (score > bestScore) {
        bestScore = score;
        best = { pieceIndex: pi, anchor: a };
      }
    }
  });
  return best;
}
