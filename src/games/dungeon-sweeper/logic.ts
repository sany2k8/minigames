import type { Rng } from '../../engine/rng';
import type { Difficulty } from '../../engine/types';

/**
 * Dungeon Sweeper — a minesweeper roguelike. Numbers count adjacent MONSTERS
 * (mines). Floor tiles may hold gold (score), a potion (+HP), or the exit
 * stairs (win). You have limited HP; revealing a monster costs 1 HP. Deduce a
 * safe path, loot what you can, and reveal the exit before your HP runs out.
 */

export type Tile = 'floor' | 'monster' | 'gold' | 'potion' | 'exit';

export interface Dungeon {
  w: number;
  h: number;
  tiles: Tile[];
  /** Adjacent monster count for every cell (0..8). */
  adj: number[];
  /** Safe opening cell (no adjacent monsters). */
  start: number;
}

export interface Config {
  w: number;
  h: number;
  monsters: number;
  gold: number;
  potions: number;
  hp: number;
}

export function config(difficulty: Difficulty): Config {
  switch (difficulty) {
    case 'easy':
      return { w: 8, h: 8, monsters: 8, gold: 5, potions: 3, hp: 4 };
    case 'hard':
      return { w: 10, h: 10, monsters: 20, gold: 7, potions: 2, hp: 5 };
    default:
      return { w: 9, h: 9, monsters: 13, gold: 6, potions: 2, hp: 4 };
  }
}

export function neighbors(w: number, h: number, idx: number): number[] {
  const r = Math.floor(idx / w);
  const c = idx % w;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w) out.push(nr * w + nc);
    }
  }
  return out;
}

export const isMonster = (d: Dungeon, i: number) => d.tiles[i] === 'monster';

export function generate(rng: Rng, cfg: Config): Dungeon {
  const { w, h, monsters, gold, potions } = cfg;
  const n = w * h;
  const tiles: Tile[] = new Array(n).fill('floor');

  // Start away from the border so its opening flood has room.
  const start = (1 + rng.int(h - 2)) * w + (1 + rng.int(w - 2));
  const blocked = new Set<number>([start, ...neighbors(w, h, start)]);

  // Scatter monsters anywhere but the safe opening pocket.
  const cells = rng.shuffle(Array.from({ length: n }, (_, i) => i).filter((i) => !blocked.has(i)));
  let p = 0;
  for (let m = 0; m < monsters && p < cells.length; m++) tiles[cells[p++]] = 'monster';

  // Exit: the safe (non-monster, non-start) cell farthest from the start.
  const sr = Math.floor(start / w);
  const sc = start % w;
  let exit = -1;
  let bestDist = -1;
  for (let i = 0; i < n; i++) {
    if (i === start || tiles[i] === 'monster') continue;
    const dist = Math.abs(Math.floor(i / w) - sr) + Math.abs((i % w) - sc);
    if (dist > bestDist) {
      bestDist = dist;
      exit = i;
    }
  }
  tiles[exit] = 'exit';

  // Loot on remaining free floor.
  const free = rng.shuffle(
    Array.from({ length: n }, (_, i) => i).filter((i) => tiles[i] === 'floor' && i !== start)
  );
  let f = 0;
  for (let g = 0; g < gold && f < free.length; g++) tiles[free[f++]] = 'gold';
  for (let q = 0; q < potions && f < free.length; q++) tiles[free[f++]] = 'potion';

  // Adjacent-monster counts.
  const adj = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    adj[i] = neighbors(w, h, i).filter((j) => tiles[j] === 'monster').length;
  }

  return { w, h, tiles, adj, start };
}

/**
 * Reveal `idx`. Returns the indices newly uncovered, in order. Tapping a floor
 * with no adjacent monsters floods outward (classic minesweeper); the flood
 * never auto-reveals monsters — those are only uncovered by a direct tap.
 */
export function revealFlood(d: Dungeon, revealed: boolean[], idx: number): number[] {
  if (revealed[idx]) return [];
  if (d.tiles[idx] === 'monster') return [idx]; // direct fight

  const out: number[] = [];
  const seen = new Set<number>([idx]);
  const stack = [idx];
  while (stack.length) {
    const i = stack.pop()!;
    out.push(i);
    if (d.adj[i] === 0) {
      for (const j of neighbors(d.w, d.h, i)) {
        if (!revealed[j] && !seen.has(j) && d.tiles[j] !== 'monster') {
          seen.add(j);
          stack.push(j);
        }
      }
    }
  }
  return out;
}

export const revealedFloors = (d: Dungeon, revealed: boolean[]) =>
  revealed.reduce((n, r, i) => (r && d.tiles[i] !== 'monster' ? n + 1 : n), 0);

export interface Deduction {
  mine: Set<number>;
  safe: Set<number>;
}

/**
 * Single-cell minesweeper deduction over what's currently revealed — used by the
 * bot. Only consults revealed tiles (never peeks at hidden ones).
 */
export function deduce(d: Dungeon, revealed: boolean[]): Deduction {
  const mine = new Set<number>();
  const safe = new Set<number>();
  for (let i = 0; i < d.tiles.length; i++) {
    if (revealed[i] && d.tiles[i] === 'monster') mine.add(i);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < d.tiles.length; i++) {
      if (!revealed[i] || d.tiles[i] === 'monster') continue;
      const nb = neighbors(d.w, d.h, i);
      const knownMines = nb.filter((j) => mine.has(j)).length;
      const unknown = nb.filter((j) => !revealed[j] && !mine.has(j) && !safe.has(j));
      if (unknown.length === 0) continue;
      if (d.adj[i] - knownMines === unknown.length) {
        for (const j of unknown) mine.add(j);
        changed = true;
      } else if (d.adj[i] === knownMines) {
        for (const j of unknown) safe.add(j);
        changed = true;
      }
    }
  }
  return { mine, safe };
}

/**
 * Bot's next cell to reveal: a deduced-safe unrevealed cell if one exists,
 * otherwise the lowest-risk frontier guess. Returns -1 if nothing is left.
 */
export function botNextReveal(d: Dungeon, revealed: boolean[], rng: Rng): number {
  const { mine, safe } = deduce(d, revealed);
  for (let i = 0; i < d.tiles.length; i++) {
    if (!revealed[i] && safe.has(i)) return i;
  }

  // Guess: estimate monster probability for each unrevealed, non-known-mine cell
  // from its constraining revealed neighbours; pick the least risky (with noise).
  let best = -1;
  let bestRisk = Infinity;
  const order = rng.shuffle(Array.from({ length: d.tiles.length }, (_, i) => i));
  for (const i of order) {
    if (revealed[i] || mine.has(i)) continue;
    let risk = 0.18; // baseline for an interior cell with no info
    let touched = false;
    for (const j of neighbors(d.w, d.h, i)) {
      if (!revealed[j] || d.tiles[j] === 'monster') continue;
      const nb = neighbors(d.w, d.h, j);
      const knownMines = nb.filter((k) => mine.has(k)).length;
      const unknown = nb.filter((k) => !revealed[k] && !mine.has(k)).length;
      if (unknown > 0) {
        risk = Math.max(risk, (d.adj[j] - knownMines) / unknown);
        touched = true;
      }
    }
    // Prefer frontier cells; nudge interior cells slightly riskier.
    if (!touched) risk += 0.05;
    if (risk < bestRisk) {
      bestRisk = risk;
      best = i;
    }
  }
  return best;
}
