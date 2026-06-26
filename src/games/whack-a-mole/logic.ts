import type { Rng } from '../../engine/rng';

export const HOLES = 9;
export const DURATION_MS = 30000;

export interface Spawn {
  t: number; // appear time (ms from start)
  hole: number;
  type: 'mole' | 'bomb';
  dur: number; // visible duration
}

export function schedule(rng: Rng, difficulty: 'easy' | 'medium' | 'hard'): Spawn[] {
  const gap = difficulty === 'easy' ? 780 : difficulty === 'hard' ? 470 : 600;
  const dur = difficulty === 'easy' ? 1150 : difficulty === 'hard' ? 720 : 920;
  const out: Spawn[] = [];
  let t = 600;
  while (t < DURATION_MS - 400) {
    out.push({
      t,
      hole: rng.int(HOLES),
      type: rng.float() < 0.18 ? 'bomb' : 'mole',
      dur: dur + rng.int(200)
    });
    t += gap + rng.int(220) - 60;
  }
  return out;
}

export function botReaction(difficulty: 'easy' | 'medium' | 'hard'): number {
  return difficulty === 'easy' ? 520 : difficulty === 'hard' ? 230 : 360;
}
