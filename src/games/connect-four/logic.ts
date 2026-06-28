import type { Rng } from '../../engine/rng';

export const COLS = 7;
export const ROWS = 6;
export type Cell = 0 | 1 | 2; // 0 empty, 1 = mark A, 2 = mark B
export type Board = Cell[];

export const emptyBoard = (): Board => Array(COLS * ROWS).fill(0) as Board;
const at = (b: Board, r: number, c: number): Cell => b[r * COLS + c];

export const legalCols = (b: Board): number[] => {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) if (b[c] === 0) cols.push(c);
  return cols;
};

export const isFull = (b: Board): boolean => b.every((v) => v !== 0);

/** Drop a mark into a column; returns the new board + landing row, or null if full. */
export function drop(b: Board, col: number, mark: 1 | 2): { board: Board; row: number } | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (at(b, r, col) === 0) {
      const board = b.slice() as Board;
      board[r * COLS + col] = mark;
      return { board, row: r };
    }
  }
  return null;
}

const DIRS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diag down-right
  [1, -1] // diag down-left
];

/** Returns the winning mark (1|2) if four are connected, else 0. */
export function winner(b: Board): Cell {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const m = at(b, r, c);
      if (m === 0) continue;
      for (const [dr, dc] of DIRS) {
        let k = 1;
        while (k < 4) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || at(b, rr, cc) !== m) break;
          k++;
        }
        if (k === 4) return m;
      }
    }
  }
  return 0;
}

const wins = (b: Board, col: number, mark: 1 | 2): boolean => {
  const res = drop(b, col, mark);
  return !!res && winner(res.board) === mark;
};

/**
 * Heuristic bot: win if possible, else block an immediate threat, else prefer the
 * centre, else a seeded legal column. Difficulty controls how often it plays the
 * "smart" move vs a random legal one.
 */
export function botMove(b: Board, mark: 1 | 2, rng: Rng, smartChance: number): number {
  const legal = legalCols(b);
  const opp: 1 | 2 = mark === 1 ? 2 : 1;
  if (legal.length === 0) return -1;

  for (const c of legal) if (wins(b, c, mark)) return c; // take the win
  if (rng.float() < smartChance) {
    for (const c of legal) if (wins(b, c, opp)) return c; // block the loss
    const order = [3, 2, 4, 1, 5, 0, 6].filter((c) => legal.includes(c));
    if (order.length) return order[0];
  }
  return rng.pick(legal);
}

export const smartChance = (d: 'easy' | 'medium' | 'hard'): number =>
  d === 'hard' ? 1 : d === 'medium' ? 0.75 : 0.4;
