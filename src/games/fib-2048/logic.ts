import type { Rng } from '../../engine/rng';

export const SIZE = 4;
export type Grid = number[]; // 0 = empty, else a Fibonacci value
export type Dir = 'left' | 'right' | 'up' | 'down';

// Distinct Fibonacci tile values (the two 1s are handled specially).
const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181];

/** Two tiles merge if they are consecutive Fibonacci numbers (or both 1s → 2). */
export function canMerge(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  if (a === 1 && b === 1) return true;
  const ia = FIB.indexOf(a);
  const ib = FIB.indexOf(b);
  return ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1;
}

export const mergeResult = (a: number, b: number): number => (a === 1 && b === 1 ? 2 : a + b);

export const emptyGrid = (): Grid => Array(SIZE * SIZE).fill(0);

export function spawn(grid: Grid, rng: Rng): Grid {
  const empties = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (empties.length === 0) return grid;
  const g = grid.slice();
  g[rng.pick(empties)] = rng.float() < 0.12 ? 2 : 1;
  return g;
}

function slideLine(line: number[]): { line: number[]; gained: number; moved: boolean } {
  const nums = line.filter((v) => v > 0);
  const out: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && canMerge(nums[i], nums[i + 1])) {
      const m = mergeResult(nums[i], nums[i + 1]);
      out.push(m);
      gained += m;
      i += 2;
    } else {
      out.push(nums[i]);
      i += 1;
    }
  }
  while (out.length < line.length) out.push(0);
  const moved = out.some((v, idx) => v !== line[idx]);
  return { line: out, gained, moved };
}

const lineIndices = (dir: Dir): number[][] => {
  const lines: number[][] = [];
  for (let k = 0; k < SIZE; k++) {
    const idx: number[] = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === 'left') idx.push(k * SIZE + j);
      else if (dir === 'right') idx.push(k * SIZE + (SIZE - 1 - j));
      else if (dir === 'up') idx.push(j * SIZE + k);
      else idx.push((SIZE - 1 - j) * SIZE + k);
    }
    lines.push(idx);
  }
  return lines;
};

export function move(grid: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  const next = grid.slice();
  let gained = 0;
  let moved = false;
  for (const idx of lineIndices(dir)) {
    const line = idx.map((i) => grid[i]);
    const res = slideLine(line);
    if (res.moved) moved = true;
    gained += res.gained;
    idx.forEach((i, j) => (next[i] = res.line[j]));
  }
  return { grid: next, gained, moved };
}

export const canMove = (grid: Grid): boolean =>
  (['left', 'right', 'up', 'down'] as Dir[]).some((d) => move(grid, d).moved);

/** Greedy bot: pick the legal move with the best gain, then most empties. */
export function botMove(grid: Grid): Dir | null {
  const order: Dir[] = ['up', 'left', 'right', 'down'];
  let best: { dir: Dir; gained: number; empties: number } | null = null;
  for (const d of order) {
    const r = move(grid, d);
    if (!r.moved) continue;
    const empties = r.grid.filter((v) => v === 0).length;
    if (!best || r.gained > best.gained || (r.gained === best.gained && empties > best.empties)) {
      best = { dir: d, gained: r.gained, empties };
    }
  }
  return best ? best.dir : null;
}

/** Colour ramp keyed by Fibonacci index. */
export function tileColor(v: number): { bg: string; fg: string } {
  const ramp = [
    '#eee4da', '#ede0c8', '#f2b179', '#f59563', '#f67c5f', '#f65e3b',
    '#edcf72', '#edcc61', '#edc850', '#edc53f', '#edc22e', '#3fb6e0',
    '#2f9fd6', '#7c5cff', '#6c4ad6', '#ff5a8a'
  ];
  const i = Math.max(0, FIB.indexOf(v));
  const bg = ramp[Math.min(i, ramp.length - 1)] ?? '#3c3a32';
  const fg = v <= 3 ? '#5a5145' : '#fff';
  return { bg, fg };
}
