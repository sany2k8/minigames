import type { Rng } from '../../engine/rng';

export const DURATION_MS = 40000;
export const COLORS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff', '#ff8c42'];

export interface Obj {
  x: number; // normalized 0..1
  y: number;
  r: number; // base radius in px
  color: number;
  eaten: boolean;
}

export function spawnObjects(rng: Rng, n = 60): Obj[] {
  return Array.from({ length: n }, () => ({
    x: rng.float(),
    y: rng.float(),
    r: 6 + rng.int(34),
    color: rng.int(COLORS.length),
    eaten: false
  }));
}

export const canEat = (holeR: number, objR: number) => objR <= holeR;
