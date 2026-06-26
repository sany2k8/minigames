import type { Rng } from '../../engine/rng';

export const SCREW_COLORS = ['#ff5d73', '#41a0ff', '#ffd166', '#51e08a', '#8367ff', '#ff8c42'];
export const BOXES = 3;
export const BOX_CAP = 3;

export function difficultyDistinct(d: 'easy' | 'medium' | 'hard'): number {
  return d === 'easy' ? 4 : d === 'hard' ? 6 : 5;
}

export interface Box {
  color: number | null;
  count: number;
}

export const emptyBoxes = (): Box[] => Array.from({ length: BOXES }, () => ({ color: null, count: 0 }));

/** Each color appears in multiples of 3 so the board is fully clearable. */
export function generate(rng: Rng, distinct: number, perColor = 3): number[] {
  const pool: number[] = [];
  for (let i = 0; i < distinct; i++) for (let k = 0; k < perColor; k++) pool.push(i);
  return rng.shuffle(pool);
}

export function canPlace(boxes: Box[], color: number): boolean {
  return boxes.some((b) => (b.color === color && b.count < BOX_CAP) || b.color === null);
}

/** Place a screw of `color`; locks an empty box if needed; clears a full box. */
export function placeScrew(boxes: Box[], color: number): { boxes: Box[]; cleared: boolean } {
  const next = boxes.map((b) => ({ ...b }));
  let target = next.find((b) => b.color === color && b.count < BOX_CAP);
  if (!target) target = next.find((b) => b.color === null);
  if (!target) return { boxes, cleared: false };
  if (target.color === null) target.color = color;
  target.count++;
  if (target.count >= BOX_CAP) {
    target.color = null;
    target.count = 0;
    return { boxes: next, cleared: true };
  }
  return { boxes: next, cleared: false };
}

export function anyLegal(boxes: Box[], remaining: number[]): boolean {
  return remaining.some((c) => canPlace(boxes, c));
}
