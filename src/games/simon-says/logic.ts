import type { Rng } from '../../engine/rng';

export const PADS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a'];

/** Full deterministic sequence; round R reveals the first R entries. */
export function makeSequence(rng: Rng, len = 80): number[] {
  return Array.from({ length: len }, () => rng.int(4));
}

/** Per-round chance the bot makes a mistake (grows slightly with round). */
export function botMistakeChance(round: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const base = difficulty === 'easy' ? 0.25 : difficulty === 'hard' ? 0.04 : 0.12;
  return Math.min(0.6, base + round * 0.015);
}
