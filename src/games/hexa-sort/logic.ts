import type { Rng } from '../../engine/rng';

export const COLS = 5;
export const ROWS = 5;
export const CAP = 10; // a single-color pile of this height pops
export const HEX_COLORS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff', '#41d3bd'];

export interface Cell {
  color: number;
  height: number;
}
export type Board = (Cell | null)[]; // length COLS*ROWS

export const emptyBoard = (): Board => Array(COLS * ROWS).fill(null);

/** odd-r offset hex neighbours. */
export function neighbors(i: number): number[] {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const odd = r % 2 === 1;
  const deltas = odd
    ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
    : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
  const out: number[] = [];
  for (const [dr, dc] of deltas) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) out.push(rr * COLS + cc);
  }
  return out;
}

export interface PlaceResult {
  board: Board;
  popped: number; // tiles cleared (0 if none)
}

/** Place a piece on an empty cell, merge the connected same-color region, pop if full. */
export function place(board: Board, idx: number, piece: Cell): PlaceResult {
  if (board[idx]) return { board, popped: 0 };
  const next = board.map((c) => (c ? { ...c } : null));
  next[idx] = { ...piece };

  // BFS the connected same-color region
  const color = piece.color;
  const region = new Set<number>([idx]);
  const stack = [idx];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of neighbors(cur)) {
      if (!region.has(n) && next[n] && next[n]!.color === color) {
        region.add(n);
        stack.push(n);
      }
    }
  }
  const total = [...region].reduce((s, c) => s + (next[c]?.height ?? 0), 0);
  // clear region, then either pop or collapse into the placed cell
  for (const c of region) next[c] = null;
  if (total >= CAP) return { board: next, popped: total };
  next[idx] = { color, height: total };
  return { board: next, popped: 0 };
}

export const makePiece = (rng: Rng): Cell => ({ color: rng.int(HEX_COLORS.length), height: rng.range(2, 4) });
export const hasEmpty = (board: Board) => board.some((c) => c === null);

/** Bot: place to maximise the merged pile (greedy toward pops). */
export function botMove(board: Board, piece: Cell): number {
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < board.length; i++) {
    if (board[i]) continue;
    const res = place(board, i, piece);
    const sameAdj = neighbors(i).filter((n) => board[n] && board[n]!.color === piece.color).length;
    const score = res.popped * 100 + sameAdj * 10;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
