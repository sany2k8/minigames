import type { Rng } from '../../engine/rng';

export const FLOOD_COLORS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff', '#ff8c42'];

export interface FloodConfig {
  n: number;
  colors: number;
  moves: number;
}

export function floodConfig(d: 'easy' | 'medium' | 'hard'): FloodConfig {
  if (d === 'easy') return { n: 9, colors: 5, moves: 22 };
  if (d === 'hard') return { n: 14, colors: 6, moves: 30 };
  return { n: 12, colors: 6, moves: 26 };
}

export function generate(rng: Rng, cfg: FloodConfig): number[] {
  return Array.from({ length: cfg.n * cfg.n }, () => rng.int(cfg.colors));
}

/** Cells connected to the top-left through the current top-left color. */
export function region(grid: number[], n: number): number[] {
  const target = grid[0];
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack.pop()!;
    const r = Math.floor(cur / n);
    const c = cur % n;
    const nbrs = [r > 0 ? cur - n : -1, r < n - 1 ? cur + n : -1, c > 0 ? cur - 1 : -1, c < n - 1 ? cur + 1 : -1];
    for (const nb of nbrs) {
      if (nb >= 0 && !seen.has(nb) && grid[nb] === target) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  return [...seen];
}

export function flood(grid: number[], n: number, color: number): number[] {
  if (color === grid[0]) return grid;
  const next = grid.slice();
  for (const cell of region(grid, n)) next[cell] = color;
  return next;
}

export const isSolved = (grid: number[]) => grid.every((v) => v === grid[0]);

export function progress(grid: number[], n: number): number {
  return Math.round((region(grid, n).length / grid.length) * 100);
}

/** Greedy bot: choose the color that absorbs the most new tiles. */
export function botColor(grid: number[], n: number, colors: number): number {
  let best = 0;
  let bestGain = -1;
  for (let c = 0; c < colors; c++) {
    if (c === grid[0]) continue;
    const gain = region(flood(grid, n, c), n).length;
    if (gain > bestGain) {
      bestGain = gain;
      best = c;
    }
  }
  return best;
}
