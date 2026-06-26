import type { Rng } from '../../engine/rng';

export const N = 6; // 6x6, boxes are 2 rows x 3 cols
export const BOX_R = 2;
export const BOX_C = 3;
export type Grid = number[]; // length 36, 0 = empty

const idx = (r: number, c: number) => r * N + c;

export function canPlace(g: Grid, r: number, c: number, v: number): boolean {
  for (let i = 0; i < N; i++) {
    if (g[idx(r, i)] === v) return false;
    if (g[idx(i, c)] === v) return false;
  }
  const br = Math.floor(r / BOX_R) * BOX_R;
  const bc = Math.floor(c / BOX_C) * BOX_C;
  for (let dr = 0; dr < BOX_R; dr++)
    for (let dc = 0; dc < BOX_C; dc++) if (g[idx(br + dr, bc + dc)] === v) return false;
  return true;
}

function fillSolution(g: Grid, rng: Rng, pos = 0): boolean {
  if (pos === N * N) return true;
  const r = Math.floor(pos / N);
  const c = pos % N;
  if (g[pos] !== 0) return fillSolution(g, rng, pos + 1);
  for (const v of rng.shuffle([1, 2, 3, 4, 5, 6])) {
    if (canPlace(g, r, c, v)) {
      g[pos] = v;
      if (fillSolution(g, rng, pos + 1)) return true;
      g[pos] = 0;
    }
  }
  return false;
}

/** Counts solutions up to `limit` (used to guarantee uniqueness). */
function countSolutions(g: Grid, limit = 2): number {
  const pos = g.indexOf(0);
  if (pos === -1) return 1;
  const r = Math.floor(pos / N);
  const c = pos % N;
  let total = 0;
  for (let v = 1; v <= N; v++) {
    if (canPlace(g, r, c, v)) {
      g[pos] = v;
      total += countSolutions(g, limit);
      g[pos] = 0;
      if (total >= limit) break;
    }
  }
  return total;
}

export interface Puzzle {
  puzzle: Grid; // with blanks (0)
  solution: Grid;
  given: boolean[];
}

export function difficultyGivens(d: 'easy' | 'medium' | 'hard') {
  return d === 'easy' ? 22 : d === 'hard' ? 12 : 17;
}

export function generate(rng: Rng, givens: number): Puzzle {
  const solution: Grid = Array(N * N).fill(0);
  fillSolution(solution, rng);
  const puzzle = solution.slice();
  // remove cells while keeping a unique solution
  const order = rng.shuffle(Array.from({ length: N * N }, (_, i) => i));
  let filled = N * N;
  for (const cell of order) {
    if (filled <= givens) break;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    const copy = puzzle.slice();
    if (countSolutions(copy, 2) !== 1) {
      puzzle[cell] = backup; // removal broke uniqueness — keep it
    } else {
      filled--;
    }
  }
  return { puzzle, solution, given: puzzle.map((v) => v !== 0) };
}

export const isComplete = (g: Grid) => g.every((v) => v !== 0);

export function conflicts(g: Grid): Set<number> {
  const bad = new Set<number>();
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const v = g[idx(r, c)];
      if (v === 0) continue;
      g[idx(r, c)] = 0;
      if (!canPlace(g, r, c, v)) bad.add(idx(r, c));
      g[idx(r, c)] = v;
    }
  return bad;
}
