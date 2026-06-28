import type { Rng } from '../../engine/rng';

export type Grid = number[]; // 0 = off, 1 = on

export interface LightsConfig {
  n: number;
  presses: number;
}

export function lightsConfig(d: 'easy' | 'medium' | 'hard'): LightsConfig {
  if (d === 'easy') return { n: 4, presses: 4 };
  if (d === 'hard') return { n: 5, presses: 10 };
  return { n: 5, presses: 6 };
}

/** Toggle cell i and its orthogonal neighbours; returns a new grid. */
export function press(grid: Grid, i: number, n: number): Grid {
  const g = grid.slice();
  const r = Math.floor(i / n);
  const c = i % n;
  const flip = (rr: number, cc: number) => {
    if (rr < 0 || cc < 0 || rr >= n || cc >= n) return;
    const k = rr * n + cc;
    g[k] ^= 1;
  };
  flip(r, c);
  flip(r - 1, c);
  flip(r + 1, c);
  flip(r, c - 1);
  flip(r, c + 1);
  return g;
}

export const isSolved = (grid: Grid): boolean => grid.every((v) => v === 0);

/** Fraction of lights that are off, 0..100. */
export const progress = (grid: Grid): number =>
  Math.round((grid.filter((v) => v === 0).length / grid.length) * 100);

/**
 * Build a guaranteed-solvable board by pressing random cells starting from a
 * solved (all-off) board. Because a press is self-inverse and presses commute,
 * pressing each cell that was toggled an odd number of times solves the board —
 * that set is returned as `solution` for the bot to replay.
 */
export function generate(rng: Rng, cfg: LightsConfig): { grid: Grid; solution: number[] } {
  const total = cfg.n * cfg.n;
  for (let attempt = 0; attempt < 40; attempt++) {
    let grid: Grid = Array(total).fill(0);
    const parity = Array(total).fill(0);
    for (let k = 0; k < cfg.presses; k++) {
      const i = rng.int(total);
      grid = press(grid, i, cfg.n);
      parity[i] ^= 1;
    }
    if (!isSolved(grid)) {
      const solution = parity.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
      return { grid, solution };
    }
  }
  // Fallback: press the centre once.
  const c = Math.floor(total / 2);
  return { grid: press(Array(total).fill(0), c, cfg.n), solution: [c] };
}
