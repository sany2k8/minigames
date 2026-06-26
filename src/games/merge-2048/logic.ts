import type { Rng } from '../../engine/rng';

export const SIZE = 4;
export type Grid = number[]; // length 16, 0 = empty, else tile value

export type Dir = 'left' | 'right' | 'up' | 'down';

export const emptyGrid = (): Grid => Array(SIZE * SIZE).fill(0);

/** Slide one row to the left, merging equal neighbours once. */
function slideLine(vals: number[]): { row: number[]; gained: number } {
  const nonZero = vals.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nonZero.length; i++) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // skip the consumed tile
    } else {
      out.push(nonZero[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

const getRow = (g: Grid, r: number) => g.slice(r * SIZE, r * SIZE + SIZE);
const getCol = (g: Grid, c: number) => Array.from({ length: SIZE }, (_, r) => g[r * SIZE + c]);

/** Returns the moved grid, points gained, and whether anything moved. */
export function move(grid: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  const next = grid.slice();
  let gained = 0;
  for (let i = 0; i < SIZE; i++) {
    let vals = dir === 'up' || dir === 'down' ? getCol(grid, i) : getRow(grid, i);
    const reversed = dir === 'right' || dir === 'down';
    if (reversed) vals = vals.slice().reverse();
    const res = slideLine(vals);
    gained += res.gained;
    let row = res.row;
    if (reversed) row = row.slice().reverse();
    for (let j = 0; j < SIZE; j++) {
      if (dir === 'up' || dir === 'down') next[j * SIZE + i] = row[j];
      else next[i * SIZE + j] = row[j];
    }
  }
  const moved = next.some((v, idx) => v !== grid[idx]);
  return { grid: next, gained, moved };
}

/** Adds a 2 (90%) or 4 (10%) to a random empty cell. Returns new grid. */
export function spawn(grid: Grid, rng: Rng): Grid {
  const empties: number[] = [];
  grid.forEach((v, i) => v === 0 && empties.push(i));
  if (empties.length === 0) return grid;
  const cell = rng.pick(empties);
  const next = grid.slice();
  next[cell] = rng.float() < 0.9 ? 2 : 4;
  return next;
}

export function canMove(grid: Grid): boolean {
  if (grid.some((v) => v === 0)) return true;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r * SIZE + c];
      if (c + 1 < SIZE && grid[r * SIZE + c + 1] === v) return true;
      if (r + 1 < SIZE && grid[(r + 1) * SIZE + c] === v) return true;
    }
  return false;
}

export const maxTile = (grid: Grid) => Math.max(...grid);

const DIRS: Dir[] = ['left', 'up', 'right', 'down'];

/** Heuristic bot move: prefer empties + keeping big tiles in a corner. */
export function botMove(grid: Grid): Dir | null {
  let best: Dir | null = null;
  let bestScore = -Infinity;
  for (const d of DIRS) {
    const res = move(grid, d);
    if (!res.moved) continue;
    const g = res.grid;
    const empties = g.filter((v) => v === 0).length;
    // monotonic-ish: reward larger tiles toward top-left corner
    let corner = 0;
    for (let i = 0; i < g.length; i++) {
      const r = Math.floor(i / SIZE);
      const c = i % SIZE;
      const weight = (SIZE - r) + (SIZE - c);
      corner += g[i] * weight;
    }
    const score = empties * 280 + corner + res.gained * 2;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** Tile background colors keyed by value. */
export function tileColor(v: number): { bg: string; fg: string } {
  const map: Record<number, string> = {
    2: '#3a4684',
    4: '#46559e',
    8: '#5a6cff',
    16: '#7b5cff',
    32: '#9b4ddb',
    64: '#c44ad0',
    128: '#e0529e',
    256: '#ff6b6b',
    512: '#ff9442',
    1024: '#ffc23d',
    2048: '#ffd700'
  };
  const bg = map[v] ?? '#ffd700';
  const fg = v <= 4 ? 'var(--text-dim)' : '#fff';
  return { bg, fg };
}
