// Board layout (14 ints): 0-5 seat0 pits, 6 seat0 store, 7-12 seat1 pits, 13 seat1 store.
export type Board = number[];

export const STORE = [6, 13];
export const PITS: [number, number][] = [
  [0, 5],
  [7, 12]
];
export const oppStoreOf = (seat: number) => (seat === 0 ? 13 : 6);
export const opposite = (idx: number) => 12 - idx;

export function initBoard(seeds = 4): Board {
  const b = Array(14).fill(seeds);
  b[6] = 0;
  b[13] = 0;
  return b;
}

export function ownPit(seat: number, pit: number): boolean {
  return pit >= PITS[seat][0] && pit <= PITS[seat][1];
}

export function legalMoves(board: Board, seat: number): number[] {
  const [lo, hi] = PITS[seat];
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) if (board[i] > 0) out.push(i);
  return out;
}

export interface SowResult {
  board: Board;
  extraTurn: boolean;
  captured: number;
}

export function sow(board: Board, seat: number, pit: number): SowResult {
  const b = board.slice();
  const store = STORE[seat];
  const skip = oppStoreOf(seat);
  let seeds = b[pit];
  b[pit] = 0;
  let idx = pit;
  while (seeds > 0) {
    idx = (idx + 1) % 14;
    if (idx === skip) continue;
    b[idx]++;
    seeds--;
  }
  const extraTurn = idx === store;
  let captured = 0;
  if (!extraTurn && ownPit(seat, idx) && b[idx] === 1) {
    const opp = opposite(idx);
    if (b[opp] > 0) {
      captured = b[opp] + 1;
      b[store] += captured;
      b[opp] = 0;
      b[idx] = 0;
    }
  }
  return { board: b, extraTurn, captured };
}

export function isOver(board: Board): boolean {
  const side0 = board.slice(0, 6).every((v) => v === 0);
  const side1 = board.slice(7, 13).every((v) => v === 0);
  return side0 || side1;
}

/** Sweeps remaining seeds into each owner's store. */
export function finalize(board: Board): Board {
  const b = board.slice();
  for (let i = 0; i <= 5; i++) {
    b[6] += b[i];
    b[i] = 0;
  }
  for (let i = 7; i <= 12; i++) {
    b[13] += b[i];
    b[i] = 0;
  }
  return b;
}

/** Heuristic bot: prefer extra turns, then captures, then store gain. */
export function botMove(board: Board, seat: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const moves = legalMoves(board, seat);
  if (moves.length === 0) return -1;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const res = sow(board, seat, m);
    let score = res.captured * 3 + (res.extraTurn ? 6 : 0);
    score += res.board[STORE[seat]] - board[STORE[seat]];
    if (difficulty === 'hard' && res.extraTurn) score += 2; // chain potential
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
