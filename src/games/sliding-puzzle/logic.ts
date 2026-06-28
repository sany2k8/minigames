import type { Rng } from '../../engine/rng';

export type Dir = 'U' | 'D' | 'L' | 'R';
export type Board = number[]; // 0 = blank, 1..n*n-1 tiles

export interface SlideConfig { n: number; scramble: number }
export function slideConfig(d: 'easy' | 'medium' | 'hard'): SlideConfig {
  if (d === 'easy') return { n: 3, scramble: 40 };
  if (d === 'hard') return { n: 4, scramble: 160 };
  return { n: 4, scramble: 90 };
}

export const solvedBoard = (n: number): Board => {
  const b = Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));
  return b; // [1,2,...,n*n-1,0]
};

export const isSolved = (b: Board): boolean => b.every((v, i) => v === (i + 1) % b.length);

export const blankIdx = (b: Board): number => b.indexOf(0);

const OPP: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };

/** Move the blank in `dir` (swaps with the neighbour). Returns new board or null. */
export function moveBlank(b: Board, n: number, dir: Dir): Board | null {
  const bi = blankIdx(b);
  const r = Math.floor(bi / n);
  const c = bi % n;
  let nr = r;
  let nc = c;
  if (dir === 'U') nr--;
  else if (dir === 'D') nr++;
  else if (dir === 'L') nc--;
  else nc++;
  if (nr < 0 || nc < 0 || nr >= n || nc >= n) return null;
  const ni = nr * n + nc;
  const nb = b.slice();
  [nb[bi], nb[ni]] = [nb[ni], nb[bi]];
  return nb;
}

/** Tap a tile adjacent to the blank to slide it in. Returns new board or null. */
export function tapTile(b: Board, n: number, idx: number): Board | null {
  const bi = blankIdx(b);
  const adj =
    (Math.floor(bi / n) === Math.floor(idx / n) && Math.abs(bi - idx) === 1) ||
    Math.abs(bi - idx) === n;
  if (!adj) return null;
  const nb = b.slice();
  [nb[bi], nb[idx]] = [nb[idx], nb[bi]];
  return nb;
}

export const progress = (b: Board): number =>
  Math.round((b.filter((v, i) => v === (i + 1) % b.length).length / b.length) * 100);

/**
 * Scramble from the solved board with random blank moves (guarantees solvability)
 * and return the move list whose reverse-inverse solves it — handy for the bot.
 */
export function generate(rng: Rng, cfg: SlideConfig): { board: Board; solution: Dir[] } {
  let board = solvedBoard(cfg.n);
  const dirs: Dir[] = ['U', 'D', 'L', 'R'];
  const applied: Dir[] = [];
  let last: Dir | null = null;
  let guard = 0;
  while (applied.length < cfg.scramble && guard < cfg.scramble * 8) {
    guard++;
    const d = rng.pick(dirs);
    if (last && d === OPP[last]) continue; // avoid trivially undoing
    const nb = moveBlank(board, cfg.n, d);
    if (!nb) continue;
    board = nb;
    applied.push(d);
    last = d;
  }
  if (isSolved(board)) {
    const d = (['L', 'U', 'R', 'D'] as Dir[]).find((x) => moveBlank(board, cfg.n, x))!;
    board = moveBlank(board, cfg.n, d)!;
    applied.push(d);
  }
  const solution = [...applied].reverse().map((d) => OPP[d]);
  return { board, solution };
}
