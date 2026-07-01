/**
 * Daily Challenge: a single, date-seeded puzzle everyone gets the same of, with
 * no backend. Because race/score puzzles are deterministic from a seed, mapping
 * a calendar day → seed makes the day's puzzle reproducible entirely offline.
 */
import { GAMES } from '../games/registry';

/** Local calendar day as `YYYY-MM-DD` (the key everything hangs off). */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Yesterday's key relative to a given key — used for streak continuity. */
export function prevDayKey(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/** Deterministic 32-bit hash of a string (FNV-1a). */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The puzzle seed for a given day (stable, reproducible). */
export function dailySeed(key: string): number {
  return hashStr(`seed:${key}`) % 2 ** 31;
}

/** Which game is featured on a given day — rotates deterministically. */
export function dailyGameId(key: string): string {
  const idx = hashStr(`game:${key}`) % GAMES.length;
  return GAMES[idx].id;
}

export interface DailyInfo {
  key: string;
  gameId: string;
  seed: number;
}

/** Everything needed to render today's challenge. */
export function todayChallenge(now: Date = new Date()): DailyInfo {
  const key = dayKey(now);
  return { key, gameId: dailyGameId(key), seed: dailySeed(key) };
}
