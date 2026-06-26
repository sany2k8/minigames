import type { Rng } from '../../engine/rng';

export type PipeType = 'straight' | 'elbow' | 'tee' | 'end';
export interface Cell {
  type: PipeType;
  rot: number; // 0-3
  fixed: boolean; // source/outlet can't rotate
  onPath: boolean;
}

// direction: 0=N, 1=E, 2=S, 3=W
const BASE: Record<PipeType, number> = {
  straight: (1 << 0) | (1 << 2),
  elbow: (1 << 0) | (1 << 1),
  tee: (1 << 0) | (1 << 1) | (1 << 3),
  end: 1 << 2
};
const opp = (d: number) => (d + 2) % 4;

export function rotateMask(mask: number, rot: number): number {
  let out = 0;
  for (let d = 0; d < 4; d++) if (mask & (1 << d)) out |= 1 << ((d + rot) % 4);
  return out;
}
export const openings = (cell: Cell) => rotateMask(BASE[cell.type], cell.rot);

function rotForMask(type: PipeType, mask: number): number {
  for (let r = 0; r < 4; r++) if (rotateMask(BASE[type], r) === mask) return r;
  return 0;
}

export interface PipeBoard {
  w: number;
  h: number;
  cells: Cell[];
  source: number;
  outlet: number;
}

export function pipeConfig(d: 'easy' | 'medium' | 'hard') {
  if (d === 'easy') return { w: 4, h: 4 };
  if (d === 'hard') return { w: 6, h: 6 };
  return { w: 5, h: 5 };
}

const dirBetween = (w: number, a: number, b: number): number => {
  if (b === a - w) return 0;
  if (b === a + 1) return 1;
  if (b === a + w) return 2;
  return 3;
};

/** Builds a scrambled, solvable pipe puzzle plus the per-cell solution rotation. */
export function generate(rng: Rng, w: number, h: number): { board: PipeBoard; solution: number[] } {
  const total = w * h;
  const sr = Math.floor(h / 2);
  const source = sr * w + 0;
  const outlet = sr * w + (w - 1);

  // DFS a simple path from source to outlet
  let path: number[] | null = null;
  for (let attempt = 0; attempt < 80 && !path; attempt++) {
    const visited = new Set<number>([source]);
    const stack: number[] = [source];
    const found = (function dfs(): number[] | null {
      const cur = stack[stack.length - 1];
      if (cur === outlet && stack.length > 2) return stack.slice();
      const r = Math.floor(cur / w);
      const c = cur % w;
      const nbrs: number[] = [];
      if (r > 0) nbrs.push(cur - w);
      if (r < h - 1) nbrs.push(cur + w);
      if (c > 0) nbrs.push(cur - 1);
      if (c < w - 1) nbrs.push(cur + 1);
      for (const n of rng.shuffle(nbrs)) {
        if (visited.has(n)) continue;
        if (n === outlet && stack.length < 2) continue;
        visited.add(n);
        stack.push(n);
        const res = dfs();
        if (res) return res;
        stack.pop();
        visited.delete(n);
      }
      return null;
    })();
    path = found;
  }
  if (!path) path = [source, source + 1, outlet]; // fallback (w>=3)

  const cells: Cell[] = Array.from({ length: total }, () => ({
    type: 'elbow' as PipeType,
    rot: 0,
    fixed: false,
    onPath: false
  }));
  const solution = Array(total).fill(0);
  const pathSet = new Set(path);

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    const dirs: number[] = [];
    if (i > 0) dirs.push(dirBetween(w, cell, path[i - 1]));
    if (i < path.length - 1) dirs.push(dirBetween(w, cell, path[i + 1]));
    const mask = dirs.reduce((m, d) => m | (1 << d), 0);
    let type: PipeType;
    if (dirs.length === 1) type = 'end';
    else type = dirs[0] === opp(dirs[1]) ? 'straight' : 'elbow';
    const solRot = rotForMask(type, mask);
    cells[cell] = {
      type,
      rot: solRot,
      fixed: cell === source || cell === outlet,
      onPath: true
    };
    solution[cell] = solRot;
  }

  // decoys on non-path cells
  for (let i = 0; i < total; i++) {
    if (pathSet.has(i)) continue;
    const type = rng.pick(['straight', 'elbow', 'tee'] as PipeType[]);
    cells[i] = { type, rot: rng.int(4), fixed: false, onPath: false };
    solution[i] = cells[i].rot;
  }

  // scramble rotations of all rotatable cells
  const board: PipeBoard = { w, h, cells, source, outlet };
  for (let tries = 0; tries < 30; tries++) {
    for (let i = 0; i < total; i++) if (!cells[i].fixed) cells[i].rot = rng.int(4);
    if (!isSolved(board)) break;
  }
  return { board, solution };
}

/** Flood from the source; solved when the outlet is reached through matched openings. */
export function isSolved(board: PipeBoard): boolean {
  return reachable(board).has(board.outlet);
}

export function reachable(board: PipeBoard): Set<number> {
  const { w, h, cells, source } = board;
  const seen = new Set<number>([source]);
  const stack = [source];
  while (stack.length) {
    const cur = stack.pop()!;
    const r = Math.floor(cur / w);
    const c = cur % w;
    const om = openings(cells[cur]);
    const tryDir = (d: number, n: number) => {
      if (om & (1 << d) && openings(cells[n]) & (1 << opp(d)) && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    };
    if (r > 0) tryDir(0, cur - w);
    if (c < w - 1) tryDir(1, cur + 1);
    if (r < h - 1) tryDir(2, cur + w);
    if (c > 0) tryDir(3, cur - 1);
  }
  return seen;
}

export function progress(board: PipeBoard, solution: number[]): number {
  let correct = 0;
  let pathLen = 0;
  board.cells.forEach((cell, i) => {
    if (cell.onPath) {
      pathLen++;
      if (cell.rot === solution[i]) correct++;
    }
  });
  return pathLen ? Math.round((correct / pathLen) * 100) : 0;
}
