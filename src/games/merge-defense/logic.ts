import type { Rng } from '../../engine/rng';

export const LANES = 5;
export const H = 8; // rows from spawn (top) to base (bottom)

export interface Enemy {
  id: number;
  value: number;
  dist: number; // rows to base; 0 = breach
}

/** Fire a tile up a lane: it eats enemies (closest first) until its value runs out. */
export function fire(enemies: Enemy[], tile: number): { enemies: Enemy[]; destroyed: number } {
  const sorted = [...enemies].sort((a, b) => a.dist - b.dist);
  let t = tile;
  let destroyed = 0;
  const survivors: Enemy[] = [];
  for (const e of sorted) {
    if (t <= 0) {
      survivors.push(e);
      continue;
    }
    if (t >= e.value) {
      t -= e.value;
      destroyed += e.value;
    } else {
      survivors.push({ ...e, value: e.value - t });
      t = 0;
    }
  }
  return { enemies: survivors, destroyed };
}

export const tileColor = (v: number): string => {
  const map: Record<number, string> = {
    2: '#41a0ff', 4: '#5a6cff', 8: '#8367ff', 16: '#bc13fe', 32: '#ec4899', 64: '#ff5d73', 128: '#ff8c42', 256: '#ffd166'
  };
  return map[v] ?? '#ffd166';
};

export function spawnValue(rng: Rng, stage: number): number {
  const exp = 1 + rng.int(2) + Math.floor(stage / 4); // grows with stage
  return 2 ** Math.min(exp, 8);
}
export function tileValue(rng: Rng, stage: number): number {
  const exp = 2 + rng.int(2) + Math.floor(stage / 5);
  return 2 ** Math.min(exp, 9);
}
