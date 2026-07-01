/**
 * Adaptive difficulty. A per-game "fairness" rating in [0, 2] nudges up when
 * you beat the bot and down when it beats you, so the bot drifts toward an even
 * match. The rating buckets into the three concrete difficulties the games use.
 */
import type { Difficulty } from '../engine/types';

export const START_RATING = 1; // medium
const STEP = 0.34;

export function adaptiveDifficulty(rating: number): Difficulty {
  if (rating < 0.67) return 'easy';
  if (rating < 1.34) return 'medium';
  return 'hard';
}

export function nextRating(rating: number, humanWon: boolean, draw: boolean): number {
  if (draw) return rating;
  return Math.max(0, Math.min(2, rating + (humanWon ? STEP : -STEP)));
}
