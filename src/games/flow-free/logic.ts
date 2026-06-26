import type { Rng } from '../../engine/rng';

export const FLOW_COLORS = [
  '#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff',
  '#ff8c42', '#41d3bd', '#ec4899', '#9aa3c7', '#a0e040'
];

export interface FlowPuzzle {
  w: number;
  h: number;
  endpoints: [number, number][]; // per color: the two dot cells
  solution: number[][]; // per color: ordered path cells
}

export function flowConfig(d: 'easy' | 'medium' | 'hard') {
  if (d === 'easy') return { w: 5, h: 5 };
  if (d === 'hard') return { w: 7, h: 7 };
  return { w: 6, h: 6 };
}

const neighbors = (w: number, h: number, i: number): number[] => {
  const r = Math.floor(i / w);
  const c = i % w;
  const out: number[] = [];
  if (r > 0) out.push(i - w);
  if (r < h - 1) out.push(i + w);
  if (c > 0) out.push(i - 1);
  if (c < w - 1) out.push(i + 1);
  return out;
};

/** Hamiltonian path over the whole grid via randomized DFS (with a node cap). */
function hamiltonian(rng: Rng, w: number, h: number): number[] | null {
  const total = w * h;
  const start = rng.int(total);
  const visited = new Array(total).fill(false);
  const path: number[] = [start];
  visited[start] = true;
  let count = 0;
  const cap = 300000;
  const dfs = (): boolean => {
    if (path.length === total) return true;
    if (++count > cap) return false;
    const cur = path[path.length - 1];
    for (const n of rng.shuffle(neighbors(w, h, cur))) {
      if (visited[n]) continue;
      visited[n] = true;
      path.push(n);
      if (dfs()) return true;
      path.pop();
      visited[n] = false;
    }
    return false;
  };
  return dfs() ? path : null;
}

/** Boustrophedon (snake) fallback — always covers the grid. */
function snake(w: number, h: number): number[] {
  const path: number[] = [];
  for (let r = 0; r < h; r++) {
    if (r % 2 === 0) for (let c = 0; c < w; c++) path.push(r * w + c);
    else for (let c = w - 1; c >= 0; c--) path.push(r * w + c);
  }
  return path;
}

/** Cuts a covering path into color segments (length >= 2). */
export function generate(rng: Rng, w: number, h: number): FlowPuzzle {
  const cover = hamiltonian(rng, w, h) ?? snake(w, h);
  const solution: number[][] = [];
  let i = 0;
  while (i < cover.length) {
    let len = rng.range(2, 5);
    if (cover.length - (i + len) === 1) len++; // avoid leaving a singleton
    len = Math.min(len, cover.length - i);
    solution.push(cover.slice(i, i + len));
    i += len;
  }
  const endpoints: [number, number][] = solution.map((seg) => [seg[0], seg[seg.length - 1]]);
  return { w, h, endpoints, solution };
}

export function dotColorMap(puz: FlowPuzzle): Map<number, number> {
  const m = new Map<number, number>();
  puz.endpoints.forEach(([a, b], color) => {
    m.set(a, color);
    m.set(b, color);
  });
  return m;
}

export const adjacent = (w: number, a: number, b: number) => {
  const ar = Math.floor(a / w);
  const ac = a % w;
  const br = Math.floor(b / w);
  const bc = b % w;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
};

export function isConnected(path: number[], dots: [number, number]): boolean {
  if (path.length < 2) return false;
  const ends = new Set([path[0], path[path.length - 1]]);
  return ends.has(dots[0]) && ends.has(dots[1]);
}

export function coverage(paths: Record<number, number[]>): Set<number> {
  const s = new Set<number>();
  Object.values(paths).forEach((p) => p.forEach((c) => s.add(c)));
  return s;
}
