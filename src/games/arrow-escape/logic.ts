import type { Rng } from '../../engine/rng';
import type { Difficulty } from '../../engine/types';

/**
 * Arrow Escape — a grid of arrow tiles. A tile can "escape" (be removed) only if
 * the straight line in its arrow's direction to the board edge is clear of other
 * tiles. Removing tiles only ever frees paths, so a board built by reverse
 * construction (place each tile so its ray is clear of the already-placed tiles)
 * is guaranteed fully clearable, and greedy "remove any escapable tile" solves it.
 */

export type Dir = 0 | 1 | 2 | 3; // up, right, down, left
export const DR = [-1, 0, 1, 0];
export const DC = [0, 1, 0, -1];
export const ARROWS = ['↑', '→', '↓', '←'];
export const EMPTY = -1;

export interface Board {
  w: number;
  h: number;
  /** cells[r*w + c] = Dir (0..3) or EMPTY (-1). */
  cells: number[];
}

export interface Config {
  w: number;
  h: number;
  fill: number;
}

export function config(difficulty: Difficulty): Config {
  switch (difficulty) {
    case 'easy':
      return { w: 4, h: 4, fill: 0.78 };
    case 'hard':
      return { w: 6, h: 6, fill: 0.82 };
    default:
      return { w: 5, h: 5, fill: 0.8 };
  }
}

/** True if the ray from `idx` in direction `dir` reaches the edge over empty cells only. */
export function rayClear(cells: number[], w: number, h: number, idx: number, dir: number): boolean {
  let r = Math.floor(idx / w) + DR[dir];
  let c = (idx % w) + DC[dir];
  while (r >= 0 && r < h && c >= 0 && c < w) {
    if (cells[r * w + c] !== EMPTY) return false;
    r += DR[dir];
    c += DC[dir];
  }
  return true;
}

/** A tile is escapable when occupied and its arrow's ray to the edge is clear. */
export function escapable(board: Board, idx: number): boolean {
  const d = board.cells[idx];
  return d !== EMPTY && rayClear(board.cells, board.w, board.h, idx, d);
}

export function escapableIndices(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.cells.length; i++) if (escapable(board, i)) out.push(i);
  return out;
}

export const tilesLeft = (board: Board) => board.cells.reduce((n, c) => (c === EMPTY ? n : n + 1), 0);
export const isCleared = (board: Board) => board.cells.every((c) => c === EMPTY);

/** Deterministically build a fully-clearable board for the given difficulty. */
export function generate(rng: Rng, cfg: Config): Board {
  const { w, h, fill } = cfg;
  const cells = new Array(w * h).fill(EMPTY);
  const target = Math.round(w * h * fill);
  let placed = 0;
  let attempts = 0;
  const cap = w * h * 16;
  while (placed < target && attempts < cap) {
    attempts++;
    const idx = rng.int(w * h);
    if (cells[idx] !== EMPTY) continue;
    // A direction is valid if its ray to the edge avoids tiles placed so far
    // (those represent tiles removed *after* this one in the forward solution).
    const dirs: Dir[] = [];
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      if (rayClear(cells, w, h, idx, d)) dirs.push(d);
    }
    if (dirs.length === 0) continue;
    cells[idx] = rng.pick(dirs);
    placed++;
  }
  return { w, h, cells };
}

/** Bot move: index of an escapable tile (or -1 if none / board cleared). */
export function botMove(board: Board): number {
  const opts = escapableIndices(board);
  return opts.length ? opts[0] : -1;
}
