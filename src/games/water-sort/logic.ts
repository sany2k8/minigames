import type { Rng } from '../../engine/rng';

export type Tube = number[]; // colors bottom -> top; -1 never used, empty = []
export const EMPTY = -1;

export const TUBE_COLORS = [
  '#e24b4b',
  '#3f7fd6',
  '#3fae5a',
  '#e0a800',
  '#8367ff',
  '#41d3bd',
  '#ff8c42',
  '#ec4899'
];

export interface WSConfig {
  numColors: number;
  height: number;
  empties: number;
}

export function difficultyConfig(d: 'easy' | 'medium' | 'hard'): WSConfig {
  if (d === 'easy') return { numColors: 4, height: 4, empties: 2 };
  if (d === 'hard') return { numColors: 8, height: 4, empties: 2 };
  return { numColors: 6, height: 4, empties: 2 };
}

export function generate(rng: Rng, cfg: WSConfig): Tube[] {
  // Build a flat pool with `height` of each color, shuffle, deal into color tubes.
  for (let attempt = 0; attempt < 50; attempt++) {
    const pool: number[] = [];
    for (let c = 0; c < cfg.numColors; c++) for (let i = 0; i < cfg.height; i++) pool.push(c);
    const shuffled = rng.shuffle(pool);
    const tubes: Tube[] = [];
    for (let t = 0; t < cfg.numColors; t++) {
      tubes.push(shuffled.slice(t * cfg.height, (t + 1) * cfg.height));
    }
    for (let e = 0; e < cfg.empties; e++) tubes.push([]);
    if (!isSolved(tubes, cfg.height)) return tubes;
  }
  // fallback
  const tubes: Tube[] = [];
  for (let c = 0; c < cfg.numColors; c++) tubes.push(Array(cfg.height).fill((c + 1) % cfg.numColors));
  for (let e = 0; e < cfg.empties; e++) tubes.push([]);
  return tubes;
}

const topColor = (t: Tube) => (t.length ? t[t.length - 1] : EMPTY);

export function canPour(tubes: Tube[], from: number, to: number, height: number): boolean {
  if (from === to) return false;
  const src = tubes[from];
  const dst = tubes[to];
  if (src.length === 0) return false;
  if (dst.length >= height) return false;
  if (dst.length === 0) return true;
  return topColor(src) === topColor(dst);
}

/** Returns new tubes after pouring all matching top units from->to. */
export function pour(tubes: Tube[], from: number, to: number, height: number): Tube[] {
  if (!canPour(tubes, from, to, height)) return tubes;
  const next = tubes.map((t) => t.slice());
  const color = topColor(next[from]);
  while (
    next[from].length > 0 &&
    topColor(next[from]) === color &&
    next[to].length < height
  ) {
    next[to].push(next[from].pop()!);
  }
  return next;
}

export function isSolved(tubes: Tube[], height: number): boolean {
  return tubes.every((t) => t.length === 0 || (t.length === height && t.every((c) => c === t[0])));
}

export function progress(tubes: Tube[], height: number): number {
  const complete = tubes.filter(
    (t) => t.length === 0 || (t.length === height && t.every((c) => c === t[0]))
  ).length;
  return Math.round((complete / tubes.length) * 100);
}

export function validMoves(tubes: Tube[], height: number): [number, number][] {
  const moves: [number, number][] = [];
  for (let f = 0; f < tubes.length; f++) {
    for (let t = 0; t < tubes.length; t++) {
      if (canPour(tubes, f, t, height)) {
        // skip pointless empty->empty / full-uniform source moves
        const src = tubes[f];
        if (src.every((c) => c === src[0]) && tubes[t].length === 0) continue;
        moves.push([f, t]);
      }
    }
  }
  return moves;
}

/** Greedy heuristic pick for the bot: prefer moves that complete or consolidate. */
export function bestMove(tubes: Tube[], height: number, rng: Rng): [number, number] | null {
  const moves = validMoves(tubes, height);
  if (moves.length === 0) return null;
  const score = ([f, t]: [number, number]) => {
    const src = tubes[f];
    const dst = tubes[t];
    const color = src[src.length - 1];
    let run = 0;
    for (let i = src.length - 1; i >= 0 && src[i] === color; i--) run++;
    let s = 0;
    if (dst.length > 0 && dst[dst.length - 1] === color) s += 5; // consolidates
    if (dst.length === 0) s += 1;
    if (dst.length + run === height && (dst.length === 0 || dst[0] === color)) s += 8; // completes
    s += run;
    return s;
  };
  return moves.slice().sort((a, b) => score(b) - score(a))[0] ?? rng.pick(moves);
}
