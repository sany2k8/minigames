import type { Rng } from '../../engine/rng';

export const ITEMS = ['🍎', '🍞', '🥛', '🧀', '🥕', '🍌', '🍫', '🥤', '🍇', '🍩', '🥨', '🍓'];
export const TRAY_SIZE = 7;

export function difficultyDistinct(d: 'easy' | 'medium' | 'hard'): number {
  return d === 'easy' ? 7 : d === 'hard' ? 12 : 9;
}

/** Each item appears exactly 3 times (so the board is always fully clearable). */
export function generate(rng: Rng, distinct: number): number[] {
  const pool: number[] = [];
  for (let i = 0; i < distinct; i++) pool.push(i, i, i);
  return rng.shuffle(pool);
}

/** Add a face to the tray, auto-clearing any triple. Returns new tray + cleared flag. */
export function addToTray(tray: number[], face: number): { tray: number[]; cleared: boolean } {
  const next = [...tray, face];
  for (let f = 0; f < ITEMS.length; f++) {
    if (next.filter((x) => x === f).length >= 3) {
      let removed = 0;
      const out = next.filter((x) => {
        if (x === f && removed < 3) {
          removed++;
          return false;
        }
        return true;
      });
      return { tray: out, cleared: true };
    }
  }
  return { tray: next, cleared: false };
}

export const isOverflow = (tray: number[]) => tray.length > TRAY_SIZE;
