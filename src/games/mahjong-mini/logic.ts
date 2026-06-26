import type { Rng } from '../../engine/rng';

export const FACES = ['🀄', '🎋', '🌸', '🐉', '⭐', '🍂', '💧', '🔥', '🌙', '☀️', '🍀', '🎐', '🪷', '🧧', '🏮', '🎴', '⚡', '❄️'];

export interface Tile {
  id: number;
  z: number;
  r: number;
  c: number;
  face: number;
}

/** A small 3-layer pyramid (36 tiles = 18 pairs). */
function layoutPositions(): { z: number; r: number; c: number }[] {
  const pos: { z: number; r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) pos.push({ z: 0, r, c });
  for (let r = 1; r < 3; r++) for (let c = 1; c < 5; c++) pos.push({ z: 1, r, c });
  for (let r = 1; r < 3; r++) for (let c = 2; c < 4; c++) pos.push({ z: 2, r, c });
  return pos;
}

export function generate(rng: Rng): Tile[] {
  const pos = layoutPositions();
  const n = pos.length; // even
  const faces: number[] = [];
  for (let i = 0; i < n / 2; i++) faces.push(i % FACES.length, i % FACES.length);
  const shuffled = rng.shuffle(faces);
  return pos.map((p, i) => ({ id: i, ...p, face: shuffled[i] }));
}

const at = (tiles: Tile[], removed: Set<number>, z: number, r: number, c: number) =>
  tiles.find((t) => !removed.has(t.id) && t.z === z && t.r === r && t.c === c);

export function isFree(tiles: Tile[], removed: Set<number>, t: Tile): boolean {
  if (removed.has(t.id)) return false;
  if (at(tiles, removed, t.z + 1, t.r, t.c)) return false; // covered
  const left = at(tiles, removed, t.z, t.r, t.c - 1);
  const right = at(tiles, removed, t.z, t.r, t.c + 1);
  return !left || !right;
}

export const freeTiles = (tiles: Tile[], removed: Set<number>) => tiles.filter((t) => isFree(tiles, removed, t));

/** First matching free pair (for the bot / hint). */
export function findPair(tiles: Tile[], removed: Set<number>): [Tile, Tile] | null {
  const free = freeTiles(tiles, removed);
  for (let i = 0; i < free.length; i++)
    for (let j = i + 1; j < free.length; j++) if (free[i].face === free[j].face) return [free[i], free[j]];
  return null;
}
