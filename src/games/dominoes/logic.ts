import type { Rng } from '../../engine/rng';

export type Tile = [number, number]; // pips, canonical a <= b in hands; oriented when placed
export const MAX_PIP = 6;

export const pips = (t: Tile): number => t[0] + t[1];
export const isDouble = (t: Tile): boolean => t[0] === t[1];
export const tileKey = (t: Tile): string => `${t[0]}-${t[1]}`;

/** Full double-six set (28 tiles), shuffled and dealt 7 each. */
export function deal(rng: Rng): { hands: Tile[][]; boneyard: Tile[] } {
  const set: Tile[] = [];
  for (let a = 0; a <= MAX_PIP; a++) for (let b = a; b <= MAX_PIP; b++) set.push([a, b]);
  const s = rng.shuffle(set);
  return { hands: [s.slice(0, 7), s.slice(7, 14)], boneyard: s.slice(14) };
}

export const ends = (line: Tile[]): [number, number] | null =>
  line.length === 0 ? null : [line[0][0], line[line.length - 1][1]];

export function canPlay(tile: Tile, line: Tile[]): boolean {
  const e = ends(line);
  if (!e) return true;
  return tile.includes(e[0]) || tile.includes(e[1]);
}

export const handCanPlay = (hand: Tile[], line: Tile[]): boolean => hand.some((t) => canPlay(t, line));

/** Place a tile on a side ('L' | 'R'); returns the new oriented line or null. */
export function place(line: Tile[], tile: Tile, side: 'L' | 'R'): Tile[] | null {
  if (line.length === 0) return [[tile[0], tile[1]]];
  const e = ends(line)!;
  if (side === 'R') {
    const end = e[1];
    if (tile[0] === end) return [...line, [tile[0], tile[1]]];
    if (tile[1] === end) return [...line, [tile[1], tile[0]]];
    return null;
  }
  const end = e[0];
  if (tile[1] === end) return [[tile[0], tile[1]], ...line];
  if (tile[0] === end) return [[tile[1], tile[0]], ...line];
  return null;
}

export const playableSides = (tile: Tile, line: Tile[]): ('L' | 'R')[] => {
  if (line.length === 0) return ['R'];
  const e = ends(line)!;
  const sides: ('L' | 'R')[] = [];
  if (tile.includes(e[1])) sides.push('R');
  if (tile.includes(e[0])) sides.push('L');
  return sides;
};

export const handPips = (hand: Tile[]): number => hand.reduce((s, t) => s + pips(t), 0);

/** Greedy bot: play the highest-pip legal tile (preferring doubles), else null (draw/pass). */
export function botMove(hand: Tile[], line: Tile[]): { tile: Tile; side: 'L' | 'R' } | null {
  const legal = hand.filter((t) => canPlay(t, line));
  if (legal.length === 0) return null;
  legal.sort((a, b) => Number(isDouble(b)) - Number(isDouble(a)) || pips(b) - pips(a));
  const tile = legal[0];
  return { tile, side: playableSides(tile, line)[0] };
}
