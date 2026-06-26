export type Cell = 0 | 1 | -1; // seat 0, seat 1, or empty (-1)
export type Board = Cell[]; // length 9

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export const emptyBoard = (): Board => Array(9).fill(-1);

/** Returns winning seat (0|1), 'draw', or null if still playing. */
export function winner(b: Board): 0 | 1 | 'draw' | null {
  for (const [a, c, d] of LINES) {
    if (b[a] !== -1 && b[a] === b[c] && b[c] === b[d]) return b[a] as 0 | 1;
  }
  return b.every((v) => v !== -1) ? 'draw' : null;
}

export const emptyCells = (b: Board) => b.map((v, i) => (v === -1 ? i : -1)).filter((i) => i >= 0);

/** Minimax score from the perspective of `botSeat` (perfect play). */
function minimax(b: Board, turn: 0 | 1, botSeat: 0 | 1, depth: number): number {
  const w = winner(b);
  if (w === botSeat) return 10 - depth;
  if (w === (1 - botSeat)) return depth - 10;
  if (w === 'draw') return 0;

  const cells = emptyCells(b);
  const scores = cells.map((i) => {
    const nb = b.slice();
    nb[i] = turn;
    return minimax(nb, (1 - turn) as 0 | 1, botSeat, depth + 1);
  });
  return turn === botSeat ? Math.max(...scores) : Math.min(...scores);
}

/**
 * Bot move. Hard = perfect minimax; medium = mostly optimal; easy = often random.
 */
export function botMove(b: Board, botSeat: 0 | 1, difficulty: 'easy' | 'medium' | 'hard'): number {
  const cells = emptyCells(b);
  if (cells.length === 0) return -1;
  const randomChance = difficulty === 'easy' ? 0.6 : difficulty === 'medium' ? 0.25 : 0;
  if (Math.random() < randomChance) return cells[Math.floor(Math.random() * cells.length)];

  let best = cells[0];
  let bestScore = -Infinity;
  for (const i of cells) {
    const nb = b.slice();
    nb[i] = botSeat;
    const score = minimax(nb, (1 - botSeat) as 0 | 1, botSeat, 1);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
