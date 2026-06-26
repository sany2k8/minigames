import type { Rng } from '../../engine/rng';

export const GRID = 10;
export const FLEET = [5, 4, 3, 3, 2];

export type Ship = number[]; // cells occupied

export function placeFleet(rng: Rng): Ship[] {
  const ships: Ship[] = [];
  const occ = new Set<number>();
  for (const len of FLEET) {
    for (let tries = 0; tries < 500; tries++) {
      const horiz = rng.float() < 0.5;
      const r = rng.int(horiz ? GRID : GRID - len + 1);
      const c = rng.int(horiz ? GRID - len + 1 : GRID);
      const cells: number[] = [];
      for (let i = 0; i < len; i++) cells.push(horiz ? r * GRID + c + i : (r + i) * GRID + c);
      if (cells.some((x) => occ.has(x))) continue;
      cells.forEach((x) => occ.add(x));
      ships.push(cells);
      break;
    }
  }
  return ships;
}

export const shipAt = (ships: Ship[], cell: number) => ships.find((s) => s.includes(cell));
export const isSunk = (ship: Ship, shots: Set<number>) => ship.every((c) => shots.has(c));
export const allSunk = (ships: Ship[], shots: Set<number>) => ships.every((s) => isSunk(s, shots));

const neighbors = (cell: number): number[] => {
  const r = Math.floor(cell / GRID);
  const c = cell % GRID;
  const out: number[] = [];
  if (r > 0) out.push(cell - GRID);
  if (r < GRID - 1) out.push(cell + GRID);
  if (c > 0) out.push(cell - 1);
  if (c < GRID - 1) out.push(cell + 1);
  return out;
};

/** Hunt/target AI: chase unsunk hits, else hunt on a parity grid. */
export function nextBotShot(targetShips: Ship[], shots: Set<number>, rng: Rng): number {
  const unsunkHits: number[] = [];
  for (const ship of targetShips) {
    if (isSunk(ship, shots)) continue;
    for (const c of ship) if (shots.has(c)) unsunkHits.push(c);
  }
  const candidates = new Set<number>();
  for (const h of unsunkHits) for (const n of neighbors(h)) if (!shots.has(n)) candidates.add(n);
  if (candidates.size) return rng.pick([...candidates]);

  // hunt — prefer checkerboard cells
  const open: number[] = [];
  const openParity: number[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    if (shots.has(i)) continue;
    open.push(i);
    const r = Math.floor(i / GRID);
    const c = i % GRID;
    if ((r + c) % 2 === 0) openParity.push(i);
  }
  const pool = openParity.length ? openParity : open;
  return rng.pick(pool);
}
