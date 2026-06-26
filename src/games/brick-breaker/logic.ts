import type { Rng } from '../../engine/rng';

export const COLS = 7;
export const ROWS = 9;
export const BALLS = 6;

/** A new top row: ~half the columns get a numbered block scaled to the level. */
export function newRow(rng: Rng, level: number): number[] {
  return Array.from({ length: COLS }, () => (rng.float() < 0.55 ? rng.range(1, Math.min(9, 1 + level)) : 0));
}

export const blockColor = (h: number): string => {
  const t = Math.min(1, h / 9);
  const r = Math.round(80 + t * 175);
  const g = Math.round(220 - t * 150);
  return `rgb(${r},${g},120)`;
};
