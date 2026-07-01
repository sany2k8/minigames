/**
 * Seasonal events: time-boxed themes that decorate the app during holiday/season
 * windows. Detected purely from the local date — no backend. The active season
 * (if any) drives a Home banner and a festive accent on the daily card.
 */
export interface Season {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  from: [number, number]; // [month(1-12), day]
  to: [number, number];
  accent: string;
  accent2: string;
}

const SEASONS: Season[] = [
  { id: 'new-year', name: 'New Year', emoji: '🎆', tagline: 'New year, new high scores!', from: [12, 26], to: [1, 2], accent: '#6C3FB0', accent2: '#3B82F6' },
  { id: 'valentines', name: "Valentine's", emoji: '💖', tagline: 'Share the love — and a challenge.', from: [2, 10], to: [2, 16], accent: '#FB7185', accent2: '#F43F5E' },
  { id: 'spring', name: 'Spring Fling', emoji: '🌸', tagline: 'Fresh puzzles are blooming.', from: [3, 18], to: [3, 28], accent: '#22C55E', accent2: '#84CC16' },
  { id: 'summer', name: 'Summer Splash', emoji: '☀️', tagline: 'Soak up some sunny streaks!', from: [6, 21], to: [8, 31], accent: '#06B6D4', accent2: '#F59E0B' },
  { id: 'halloween', name: 'Halloween', emoji: '🎃', tagline: 'Spooky scores after dark.', from: [10, 24], to: [10, 31], accent: '#F97316', accent2: '#7C3AED' },
  { id: 'winter', name: 'Winter Holidays', emoji: '🎄', tagline: 'Cozy up with a quick game.', from: [12, 20], to: [12, 25], accent: '#22C55E', accent2: '#EF4444' }
];

const ord = (m: number, d: number) => m * 100 + d;

function inRange(season: Season, m: number, d: number): boolean {
  const cur = ord(m, d);
  const from = ord(season.from[0], season.from[1]);
  const to = ord(season.to[0], season.to[1]);
  return from <= to ? cur >= from && cur <= to : cur >= from || cur <= to; // wraps year-end
}

/** The season active on the given date, or null. */
export function currentSeason(date: Date = new Date()): Season | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return SEASONS.find((s) => inRange(s, m, d)) ?? null;
}
