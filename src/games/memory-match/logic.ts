import type { Rng } from '../../engine/rng';

export const CARD_FACES = ['🍎', '🚀', '🌟', '🎲', '🐱', '🌈', '🍕', '⚽', '🎵', '🦊', '🌺', '🍩'];

export const PAIRS = 8; // 16 cards => 4x4

/** Returns an array of face indices (each appearing twice), shuffled. */
export function deal(rng: Rng, pairs = PAIRS): number[] {
  const vals: number[] = [];
  for (let i = 0; i < pairs; i++) vals.push(i, i);
  return rng.shuffle(vals);
}
