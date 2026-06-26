import type { Rng } from '../../engine/rng';

export interface Ring {
  gap: number; // gap center 0..1 around the ring
  width: number; // gap width fraction
  danger: boolean;
}

/** Is the ball (at ring position x, default 0.5) lined up with the gap? */
export function aligned(gapCenter: number, width: number, rotation: number, x = 0.5): boolean {
  const eff = (gapCenter + rotation) % 1;
  const d = Math.abs((((eff - x) % 1) + 1.5) % 1 - 0.5);
  return d <= width / 2;
}

export function rings(rng: Rng, n = 60): Ring[] {
  return Array.from({ length: n }, (_, i) => ({
    gap: rng.float(),
    width: Math.max(0.16, 0.3 - i * 0.0015),
    danger: i > 3 && rng.float() < 0.25
  }));
}

export function speedFor(d: 'easy' | 'medium' | 'hard'): number {
  return d === 'easy' ? 0.9 : d === 'hard' ? 1.7 : 1.25;
}
