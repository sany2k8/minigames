export const SIZE = 8;
export type Board = Int8Array; // -1 empty, 0 seat0 (black), 1 seat1 (white)

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1]
];

// Positional weights — corners are gold, squares next to corners are traps.
const WEIGHTS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120
];

export function initBoard(): Board {
  const b = new Int8Array(SIZE * SIZE).fill(-1);
  b[3 * SIZE + 3] = 1;
  b[4 * SIZE + 4] = 1;
  b[3 * SIZE + 4] = 0;
  b[4 * SIZE + 3] = 0;
  return b;
}

/** Cells flipped if `seat` plays at (r,c); empty array => illegal. */
export function flips(board: Board, seat: number, r: number, c: number): number[] {
  if (board[r * SIZE + c] !== -1) return [];
  const opp = 1 - seat;
  const out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[rr * SIZE + cc] === opp) {
      line.push(rr * SIZE + cc);
      rr += dr;
      cc += dc;
    }
    if (line.length && rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[rr * SIZE + cc] === seat) {
      out.push(...line);
    }
  }
  return out;
}

export function validMoves(board: Board, seat: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (board[i] !== -1) continue;
    if (flips(board, seat, Math.floor(i / SIZE), i % SIZE).length) out.push(i);
  }
  return out;
}

export function applyMove(board: Board, seat: number, cell: number): Board {
  const nb = board.slice() as Board;
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  const fl = flips(board, seat, r, c);
  nb[cell] = seat;
  for (const f of fl) nb[f] = seat;
  return nb;
}

export function count(board: Board, seat: number): number {
  let n = 0;
  for (let i = 0; i < board.length; i++) if (board[i] === seat) n++;
  return n;
}

export function botMove(board: Board, seat: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const moves = validMoves(board, seat);
  if (moves.length === 0) return -1;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const fl = flips(board, seat, Math.floor(m / SIZE), m % SIZE).length;
    const score = difficulty === 'hard' ? WEIGHTS[m] + fl : fl;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
