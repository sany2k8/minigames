import type { Rng } from '../../engine/rng';

/**
 * Pure, deterministic helpers for the side-scrolling flappy game. The bird lives
 * in a normalized world: y in [0,1] (0 = top), x fixed. Pipes scroll right→left
 * with their x as a fraction of the canvas width. All randomness comes from a
 * seeded Rng so both seats / replays get an identical pipe sequence.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Tuning {
  gravity: number; // y per second^2
  flap: number; // upward velocity applied on a flap (negative)
  speed: number; // pipe scroll speed (x-fraction per second)
  gap: number; // vertical gap half-height (0..1)
  spacing: number; // x-distance between pipes (fraction of width)
}

export const TUNING: Record<Difficulty, Tuning> = {
  // Tuned to be forgiving — a casual player should comfortably last well past 30s.
  easy: { gravity: 1.5, flap: -0.5, speed: 0.2, gap: 0.27, spacing: 0.78 },
  medium: { gravity: 1.8, flap: -0.54, speed: 0.26, gap: 0.23, spacing: 0.7 },
  hard: { gravity: 2.2, flap: -0.6, speed: 0.34, gap: 0.19, spacing: 0.6 }
};

export interface Pipe {
  x: number; // center x as fraction of width
  gapY: number; // gap center, 0..1
  passed: boolean;
}

export const BIRD_X = 0.3; // fixed horizontal position of the bird
export const BIRD_R = 0.035; // bird radius (fraction of height)
export const PIPE_HALF_W = 0.07; // pipe half-width (fraction of width)

/** Deterministic gap center, kept away from the very top/bottom. */
export function nextGap(rng: Rng, gap: number): number {
  const margin = gap + 0.08;
  return margin + rng.float() * (1 - 2 * margin);
}

/**
 * Does the bird collide with a pipe? `aspect` = canvasWidth / canvasHeight so the
 * horizontal pipe width (a width-fraction) can be compared against the vertically
 * normalized bird radius.
 */
export function hitsPipe(birdY: number, pipe: Pipe, gap: number, aspect: number): boolean {
  const dx = Math.abs(pipe.x - BIRD_X);
  const overlapX = dx < PIPE_HALF_W + BIRD_R / aspect;
  if (!overlapX) return false;
  return birdY - BIRD_R < pipe.gapY - gap || birdY + BIRD_R > pipe.gapY + gap;
}

export const hitsGround = (birdY: number) => birdY + BIRD_R >= 1 || birdY - BIRD_R <= 0;

/** Bot policy: flap when sinking below the next gap center (with a small lead). */
export function botShouldFlap(birdY: number, vel: number, targetY: number): boolean {
  const lead = vel * 0.12; // anticipate where the bird is heading
  return birdY + lead > targetY + 0.01;
}

export const scoreFor = (passed: number) => passed * 10;
