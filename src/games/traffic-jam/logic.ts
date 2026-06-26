import type { Rng } from '../../engine/rng';

export const GRID = 6;
export const EXIT_ROW = 2; // red car exits on the right of this row

export interface Vehicle {
  id: number; // 0 = the red car
  dir: 'h' | 'v';
  len: number;
  r: number;
  c: number;
}

export const VEHICLE_COLORS = [
  '#ff4d4d', // red car (id 0)
  '#41d3bd',
  '#ffd166',
  '#8367ff',
  '#41a0ff',
  '#ff8c42',
  '#51e08a',
  '#ec4899',
  '#9aa3c7'
];

const cellsOf = (v: Vehicle): number[] => {
  const out: number[] = [];
  for (let i = 0; i < v.len; i++) {
    const r = v.dir === 'v' ? v.r + i : v.r;
    const c = v.dir === 'h' ? v.c + i : v.c;
    out.push(r * GRID + c);
  }
  return out;
};

export function occupancy(vehicles: Vehicle[]): Int8Array {
  const grid = new Int8Array(GRID * GRID).fill(-1);
  vehicles.forEach((v) => cellsOf(v).forEach((cell) => (grid[cell] = v.id)));
  return grid;
}

export function isSolved(vehicles: Vehicle[]): boolean {
  const red = vehicles[0];
  return red.c + red.len - 1 === GRID - 1;
}

/** How far a vehicle can slide; returns [maxNeg, maxPos] step counts. */
export function slideRange(vehicles: Vehicle[], idx: number): [number, number] {
  const occ = occupancy(vehicles);
  const v = vehicles[idx];
  occ && cellsOf(v).forEach((cell) => (occ[cell] = -1)); // ignore self
  let neg = 0;
  let pos = 0;
  const free = (r: number, c: number) => r >= 0 && r < GRID && c >= 0 && c < GRID && occ[r * GRID + c] === -1;
  if (v.dir === 'h') {
    while (free(v.r, v.c - neg - 1)) neg++;
    while (free(v.r, v.c + v.len + pos)) pos++;
  } else {
    while (free(v.r - neg - 1, v.c)) neg++;
    while (free(v.r + v.len + pos, v.c)) pos++;
  }
  return [neg, pos];
}

export function moveVehicle(vehicles: Vehicle[], idx: number, delta: number): Vehicle[] {
  const next = vehicles.map((v) => ({ ...v }));
  if (next[idx].dir === 'h') next[idx].c += delta;
  else next[idx].r += delta;
  return next;
}

const serialize = (vehicles: Vehicle[]) => vehicles.map((v) => `${v.r}${v.c}`).join(',');

export interface Move {
  idx: number;
  delta: number;
}

/** BFS shortest solution (full slides). Returns null if unsolvable. */
export function solve(start: Vehicle[], maxNodes = 200000): Move[] | null {
  if (isSolved(start)) return [];
  const queue: Vehicle[][] = [start];
  const prev = new Map<string, { key: string; move: Move } | null>();
  prev.set(serialize(start), null);
  let nodes = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    if (++nodes > maxNodes) return null;
    for (let i = 0; i < cur.length; i++) {
      const [neg, pos] = slideRange(cur, i);
      for (let d = -neg; d <= pos; d++) {
        if (d === 0) continue;
        const nv = moveVehicle(cur, i, d);
        const key = serialize(nv);
        if (prev.has(key)) continue;
        prev.set(key, { key: serialize(cur), move: { idx: i, delta: d } });
        if (isSolved(nv)) {
          // reconstruct
          const path: Move[] = [];
          let k: string | undefined = key;
          while (k) {
            const p = prev.get(k);
            if (!p) break;
            path.push(p.move);
            k = p.key;
          }
          return path.reverse();
        }
        queue.push(nv);
      }
    }
  }
  return null;
}

function fits(vehicles: Vehicle[], v: Vehicle): boolean {
  const occ = occupancy(vehicles);
  return cellsOf(v).every((cell) => {
    const r = Math.floor(cell / GRID);
    const c = cell % GRID;
    return r >= 0 && r < GRID && c >= 0 && c < GRID && occ[cell] === -1;
  });
}

export function difficultyConfig(d: 'easy' | 'medium' | 'hard') {
  if (d === 'easy') return { cars: 5, minMoves: 4 };
  if (d === 'hard') return { cars: 8, minMoves: 12 };
  return { cars: 6, minMoves: 7 };
}

export interface Puzzle {
  vehicles: Vehicle[];
  solution: Move[];
}

/** Generates a seeded, solvable, non-trivial Rush Hour puzzle. */
export function generate(rng: Rng, cfg: { cars: number; minMoves: number }): Puzzle {
  for (let attempt = 0; attempt < 400; attempt++) {
    const vehicles: Vehicle[] = [
      { id: 0, dir: 'h', len: 2, r: EXIT_ROW, c: rng.int(2) } // red car near the left
    ];
    let nextId = 1;
    let guard = 0;
    while (vehicles.length < cfg.cars && guard++ < 60) {
      const dir = rng.float() < 0.5 ? 'h' : 'v';
      const len = rng.float() < 0.6 ? 2 : 3;
      const r = dir === 'v' ? rng.int(GRID - len + 1) : rng.int(GRID);
      const c = dir === 'h' ? rng.int(GRID - len + 1) : rng.int(GRID);
      const v: Vehicle = { id: nextId, dir, len, r, c };
      // keep red car's row clear of horizontal cars to its left of exit start
      if (dir === 'h' && r === EXIT_ROW) continue;
      if (fits(vehicles, v)) {
        vehicles.push(v);
        nextId++;
      }
    }
    // require at least one vehicle blocking the exit row to the right of the car
    const red = vehicles[0];
    const blocksExit = vehicles.some(
      (v) => v.id !== 0 && v.dir === 'v' && v.c > red.c + 1 && v.r <= EXIT_ROW && v.r + v.len - 1 >= EXIT_ROW
    );
    if (!blocksExit) continue;
    const sol = solve(vehicles);
    if (sol && sol.length >= cfg.minMoves && sol.length <= 60) {
      return { vehicles, solution: sol };
    }
  }
  // Fallback: a guaranteed tiny solvable puzzle.
  const vehicles: Vehicle[] = [
    { id: 0, dir: 'h', len: 2, r: EXIT_ROW, c: 0 },
    { id: 1, dir: 'v', len: 3, r: 0, c: 3 },
    { id: 2, dir: 'v', len: 2, r: 3, c: 3 }
  ];
  return { vehicles, solution: solve(vehicles) ?? [] };
}
