import type { Rng } from '../../engine/rng';

export const DURATION_MS = 75000;

export interface Tile {
  id: number;
  z: number;
  r: number;
  c: number;
  face: number;
}

/** A layered pyramid of tile slots (total is a multiple of 3 so it's clearable). */
function slots(): { z: number; r: number; c: number }[] {
  const out: { z: number; r: number; c: number }[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) out.push({ z: 0, r, c }); // 30
  for (let r = 1; r < 4; r++) for (let c = 1; c < 5; c++) out.push({ z: 1, r, c }); // 12
  for (let c = 2; c < 5; c++) out.push({ z: 2, r: 2, c }); // 3  -> total 45
  return out;
}

export function generate(rng: Rng, faceCount: number): Tile[] {
  const pos = slots();
  const groups = pos.length / 3;
  const faces: number[] = [];
  for (let i = 0; i < groups; i++) {
    const f = i % faceCount;
    faces.push(f, f, f);
  }
  const shuffled = rng.shuffle(faces);
  return pos.map((p, i) => ({ id: i, ...p, face: shuffled[i] }));
}

/** A tile is free (tappable) when nothing sits directly on top of it. */
export function isFree(tiles: Tile[], removed: Set<number>, t: Tile): boolean {
  if (removed.has(t.id)) return false;
  return !tiles.some((o) => !removed.has(o.id) && o.z === t.z + 1 && o.r === t.r && o.c === t.c);
}

export const freeTiles = (tiles: Tile[], removed: Set<number>) =>
  tiles.filter((t) => isFree(tiles, removed, t));
