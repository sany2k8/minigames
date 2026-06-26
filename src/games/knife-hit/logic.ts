import type { Rng } from '../../engine/rng';

export const TARGET = 12; // knives to complete the log
export const THROW_ANGLE = 180; // bottom of the circle (degrees, 0 = up, clockwise)

export const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/** Smallest angular distance between two angles (0..180). */
export function angDist(a: number, b: number): number {
  const d = Math.abs(normalize(a) - normalize(b));
  return Math.min(d, 360 - d);
}

export function thresholdFor(difficulty: 'easy' | 'medium' | 'hard'): number {
  return difficulty === 'easy' ? 14 : difficulty === 'hard' ? 20 : 17;
}

/** Will a knife at relative angle `rel` collide with existing knives? */
export function collides(knives: number[], rel: number, threshold: number): boolean {
  return knives.some((k) => angDist(k, rel) < threshold);
}

/** Signed rotation speed (deg/ms). Magnitude + direction shift per stage. */
export function speedFor(rng: Rng, stage: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const base = difficulty === 'easy' ? 0.06 : difficulty === 'hard' ? 0.13 : 0.095;
  const mag = base + stage * 0.012 + rng.float() * 0.03;
  const dir = rng.float() < 0.5 ? -1 : 1;
  return mag * dir;
}
