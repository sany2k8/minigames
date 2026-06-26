import type { Rng } from '../../engine/rng';
import { DICT } from '../word-finder/words';

export const W = 6;
export const H = 7;
export const DURATION_MS = 75000;

const POOL = [...DICT];
const SEED_WORDS = POOL.filter((w) => w.length >= 3 && w.length <= 5);
// Frequency-weighted letter bag for the filler cells.
const BAG = 'eeeeaaaiiioonnrrttllssudgcmpbhf';

export const idx = (r: number, c: number) => r * W + c;
const inb = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W;

export function neighbors(cell: number): number[] {
  const r = Math.floor(cell / W);
  const c = cell % W;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (inb(r + dr, c + dc)) out.push((r + dr) * W + (c + dc));
    }
  return out;
}

export const adjacent = (a: number, b: number) => neighbors(a).includes(b);
export const isWord = (s: string) => s.length >= 3 && DICT.has(s.toLowerCase());
export const wordScore = (len: number) => len * 12 + Math.max(0, len - 3) * 8;

/** Seeds a few real words along adjacent paths, then fills the rest. */
export function generate(rng: Rng): string[] {
  const grid: (string | null)[] = Array(W * H).fill(null);
  let placed = 0;
  for (let attempt = 0; attempt < 400 && placed < 8; attempt++) {
    const word = rng.pick(SEED_WORDS);
    const start = rng.int(W * H);
    const path: number[] = [start];
    const used = new Set([start]);
    let ok = grid[start] === null || grid[start] === word[0];
    for (let i = 1; i < word.length && ok; i++) {
      const opts = neighbors(path[path.length - 1]).filter(
        (n) => !used.has(n) && (grid[n] === null || grid[n] === word[i])
      );
      if (!opts.length) {
        ok = false;
        break;
      }
      const nx = rng.pick(opts);
      path.push(nx);
      used.add(nx);
    }
    if (ok && path.length === word.length) {
      path.forEach((cell, i) => (grid[cell] = word[i]));
      placed++;
    }
  }
  return grid.map((l) => l ?? BAG[rng.int(BAG.length)]);
}

/** Remove cleared cells; gravity pulls letters down; refill the top. */
export function collapse(grid: string[], cleared: Set<number>, rng: Rng): string[] {
  const next = grid.slice();
  for (let c = 0; c < W; c++) {
    const keep: string[] = [];
    for (let r = H - 1; r >= 0; r--) if (!cleared.has(idx(r, c))) keep.push(next[idx(r, c)]);
    for (let r = H - 1, k = 0; r >= 0; r--, k++) {
      next[idx(r, c)] = k < keep.length ? keep[k] : BAG[rng.int(BAG.length)];
    }
  }
  return next;
}

/** DFS for any dictionary word on the board (bot / hint). */
export function findWord(grid: string[]): number[] | null {
  const dfs = (cell: number, path: number[], str: string): number[] | null => {
    if (str.length >= 3 && DICT.has(str)) return path;
    if (str.length >= 6) return null;
    for (const n of neighbors(cell)) {
      if (path.includes(n)) continue;
      const res = dfs(n, [...path, n], str + grid[n]);
      if (res) return res;
    }
    return null;
  };
  for (let i = 0; i < grid.length; i++) {
    const res = dfs(i, [i], grid[i]);
    if (res) return res;
  }
  return null;
}
