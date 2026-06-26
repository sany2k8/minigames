/** Deterministic, seedable PRNG (mulberry32). Same seed => same puzzle. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** float in [0, 1) */
    float: next,
    /** int in [0, n) */
    int: (n: number) => Math.floor(next() * n),
    /** int in [min, max] inclusive */
    range: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: T[]): T[] => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
  };
}

export type Rng = ReturnType<typeof makeRng>;

/** A random seed for fresh matches. */
export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * Per-difficulty bot "thinking" delay in ms between moves (lower = faster/harder).
 * Kept deliberately generous so a race bot can't finish a short puzzle before the
 * human has read the rules and made a move. Time pressure rises with difficulty:
 * Easy gives the most breathing room, Hard the least.
 */
export const botTickMs: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 2400,
  medium: 1500,
  hard: 800
};
