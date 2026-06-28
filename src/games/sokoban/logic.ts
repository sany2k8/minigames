import type { Rng } from '../../engine/rng';

export type Dir = 'U' | 'D' | 'L' | 'R';
export const DELTA: Record<Dir, [number, number]> = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

export interface Level {
  w: number;
  h: number;
  walls: Set<number>;
  targets: Set<number>;
  boxes: number[];
  player: number;
  solution: Dir[];
}
export interface State {
  player: number;
  boxes: number[];
}

/**
 * Curated micro-levels. Chars: # wall, . target, $ box, @ player, ' ' floor.
 * Each ships a hand-verified solution the bot replays (a general Sokoban solver
 * is PSPACE-hard, so we don't compute one at runtime).
 */
const RAW: { rows: string[]; solution: string }[] = [
  { rows: ['#####', '#@$.#', '#####'], solution: 'R' },
  { rows: ['####', '#.##', '#$ #', '#@ #', '####'], solution: 'U' },
  { rows: ['#######', '#@$  .#', '#######'], solution: 'RRR' },
  { rows: ['######', '#@   #', '# $. #', '#    #', '######'], solution: 'DR' },
  { rows: ['######', '#   @#', '# $  #', '# .  #', '######'], solution: 'LLD' }
];

const POOLS: Record<'easy' | 'medium' | 'hard', number[]> = {
  easy: [0, 1],
  medium: [3, 2],
  hard: [4, 2, 3]
};

export function parse(idx: number): Level {
  const { rows, solution } = RAW[idx];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const walls = new Set<number>();
  const targets = new Set<number>();
  const boxes: number[] = [];
  let player = 0;
  rows.forEach((row, r) => {
    for (let c = 0; c < w; c++) {
      const ch = row[c] ?? '#';
      const cell = r * w + c;
      if (ch === '#') walls.add(cell);
      else if (ch === '.') targets.add(cell);
      else if (ch === '$') boxes.push(cell);
      else if (ch === '@') player = cell;
    }
  });
  return { w, h, walls, targets, boxes, player, solution: solution.split('') as Dir[] };
}

export function levelFor(rng: Rng, difficulty: 'easy' | 'medium' | 'hard'): Level {
  const pool = POOLS[difficulty];
  return parse(rng.pick(pool));
}

const at = (level: Level, cell: number, dr: number, dc: number): number => {
  const r = Math.floor(cell / level.w) + dr;
  const c = (cell % level.w) + dc;
  if (r < 0 || c < 0 || r >= level.h || c >= level.w) return -1;
  return r * level.w + c;
};

/** Attempt to move the player one step; returns the new state or null if blocked. */
export function step(level: Level, state: State, dir: Dir): State | null {
  const [dr, dc] = DELTA[dir];
  const np = at(level, state.player, dr, dc);
  if (np < 0 || level.walls.has(np)) return null;
  if (state.boxes.includes(np)) {
    const nb = at(level, np, dr, dc);
    if (nb < 0 || level.walls.has(nb) || state.boxes.includes(nb)) return null;
    return { player: np, boxes: state.boxes.map((b) => (b === np ? nb : b)) };
  }
  return { player: np, boxes: state.boxes };
}

export const isSolved = (boxes: number[], targets: Set<number>): boolean =>
  boxes.length === targets.size && boxes.every((b) => targets.has(b));

export const onTarget = (boxes: number[], targets: Set<number>): number =>
  boxes.filter((b) => targets.has(b)).length;
