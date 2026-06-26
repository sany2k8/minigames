import type { Rng } from '../../engine/rng';

export interface Maze {
  w: number;
  h: number;
  start: number;
  open: Set<number>; // walkable cells (must all be painted)
  order: number[]; // a known full solution path (also drives the bot)
}

export const cellIdx = (w: number, r: number, c: number) => r * w + c;
const rc = (w: number, i: number) => [Math.floor(i / w), i % w] as const;

export function neighbors(w: number, h: number, i: number): number[] {
  const [r, c] = rc(w, i);
  const out: number[] = [];
  if (r > 0) out.push(cellIdx(w, r - 1, c));
  if (r < h - 1) out.push(cellIdx(w, r + 1, c));
  if (c > 0) out.push(cellIdx(w, r, c - 1));
  if (c < w - 1) out.push(cellIdx(w, r, c + 1));
  return out;
}

export function mazeConfig(d: 'easy' | 'medium' | 'hard') {
  if (d === 'easy') return { w: 5, h: 6 };
  if (d === 'hard') return { w: 7, h: 9 };
  return { w: 6, h: 8 };
}

/**
 * Builds a maze by carving a random self-avoiding walk. The visited cells become
 * the walkable set, guaranteeing the walk itself is a valid one-stroke solution.
 */
export function generate(rng: Rng, w: number, h: number): Maze {
  const total = w * h;
  let best: number[] = [];
  for (let attempt = 0; attempt < 40 && best.length < total * 0.62; attempt++) {
    const start = rng.int(total);
    const visited = new Set<number>([start]);
    const order = [start];
    let cur = start;
    for (;;) {
      const nbrs = neighbors(w, h, cur).filter((n) => !visited.has(n));
      if (nbrs.length === 0) break;
      const nxt = rng.pick(nbrs);
      visited.add(nxt);
      order.push(nxt);
      cur = nxt;
    }
    if (order.length > best.length) best = order;
  }
  return { w, h, start: best[0], open: new Set(best), order: best };
}

export const isSolved = (maze: Maze, painted: Set<number>) => painted.size === maze.open.size;
