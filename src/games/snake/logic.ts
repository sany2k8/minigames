import type { Rng } from '../../engine/rng';

export const N = 15;
export type Dir = 'U' | 'D' | 'L' | 'R';
export interface Pt { x: number; y: number }
export interface SnakeState {
  snake: Pt[]; // head first
  dir: Dir;
  food: Pt;
  dead: boolean;
  score: number;
}

const DELTA: Record<Dir, Pt> = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 } };
export const OPPOSITE: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };

const eq = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;
const onSnake = (snake: Pt[], p: Pt) => snake.some((s) => eq(s, p));

export function spawnFood(snake: Pt[], rng: Rng): Pt {
  const free: Pt[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!onSnake(snake, { x, y })) free.push({ x, y });
  return free.length ? rng.pick(free) : { x: 0, y: 0 };
}

export function initState(rng: Rng): SnakeState {
  const snake = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 }
  ];
  return { snake, dir: 'R', food: spawnFood(snake, rng), dead: false, score: 0 };
}

/** Advance one tick in `dir` (ignored if it reverses). Mutates rng on eat. */
export function step(s: SnakeState, dir: Dir, rng: Rng): SnakeState {
  if (s.dead) return s;
  const d = dir === OPPOSITE[s.dir] ? s.dir : dir;
  const head = s.snake[0];
  const nh: Pt = { x: head.x + DELTA[d].x, y: head.y + DELTA[d].y };
  // wall or self collision (tail will move, so ignore the last cell unless growing)
  const eats = eq(nh, s.food);
  const body = eats ? s.snake : s.snake.slice(0, -1);
  if (nh.x < 0 || nh.y < 0 || nh.x >= N || nh.y >= N || onSnake(body, nh)) {
    return { ...s, dir: d, dead: true };
  }
  const snake = [nh, ...body];
  return {
    snake,
    dir: d,
    food: eats ? spawnFood(snake, rng) : s.food,
    dead: false,
    score: s.score + (eats ? 1 : 0)
  };
}

/** Greedy survival bot: step toward the food, avoiding immediate death. */
export function botDir(s: SnakeState): Dir {
  const head = s.snake[0];
  const dirs: Dir[] = ['U', 'D', 'L', 'R'];
  const safe = (d: Dir): boolean => {
    if (d === OPPOSITE[s.dir]) return false;
    const nh = { x: head.x + DELTA[d].x, y: head.y + DELTA[d].y };
    if (nh.x < 0 || nh.y < 0 || nh.x >= N || nh.y >= N) return false;
    return !onSnake(s.snake.slice(0, -1), nh);
  };
  const dist = (d: Dir): number => {
    const nh = { x: head.x + DELTA[d].x, y: head.y + DELTA[d].y };
    return Math.abs(nh.x - s.food.x) + Math.abs(nh.y - s.food.y);
  };
  const options = dirs.filter(safe).sort((a, b) => dist(a) - dist(b));
  return options[0] ?? s.dir;
}
