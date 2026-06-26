import type { Difficulty } from '../../engine/types';

/**
 * Magnetic Pull — a metallic ball rolls down a winding corridor. The player
 * holds left/right to fire border electromagnets that pull the ball that way,
 * steering it through the bends. The corridor narrows with distance, so every
 * run eventually ends — score is the distance survived. All geometry is a pure,
 * seeded function of the world position so the two seats race the same track.
 */

export interface Config {
  /** Scroll speed in px/ms at the start. */
  speed: number;
  /** Corridor half-width as a fraction of canvas width at the start. */
  baseHw: number;
  /** Ball radius as a fraction of canvas width. */
  ballR: number;
  /** How fast the corridor narrows, fraction per world px. */
  shrink: number;
  /** Magnet acceleration (fraction of width per ms^2). */
  magnet: number;
}

export function config(difficulty: Difficulty): Config {
  switch (difficulty) {
    case 'easy':
      return { speed: 0.18, baseHw: 0.2, ballR: 0.034, shrink: 0.000035, magnet: 0.0000115 };
    case 'hard':
      return { speed: 0.3, baseHw: 0.155, ballR: 0.03, shrink: 0.00006, magnet: 0.0000135 };
    default:
      return { speed: 0.24, baseHw: 0.175, ballR: 0.032, shrink: 0.000048, magnet: 0.0000125 };
  }
}

/** Corridor centre (fraction 0..1 of width) at a given world depth. */
export function centerAt(seed: number, worldY: number): number {
  const s = seed % 360;
  const v =
    Math.sin(worldY * 0.0055 + s) * 0.2 +
    Math.sin(worldY * 0.0017 + s * 1.7) * 0.13 +
    Math.sin(worldY * 0.0101 + s * 0.4) * 0.06;
  return 0.5 + v;
}

/** Corridor half-width (fraction of width) at a given world depth. */
export function hwAt(cfg: Config, worldY: number): number {
  return Math.max(cfg.ballR * 1.04, cfg.baseHw - Math.max(0, worldY) * cfg.shrink);
}

/** Keep the centre on-screen given the current half-width. */
export function clampCenter(c: number, hw: number): number {
  return Math.min(1 - hw, Math.max(hw, c));
}

/** True when the ball (centre bx) overlaps a wall. */
export function isCrash(bx: number, center: number, hw: number, ballR: number): boolean {
  return Math.abs(bx - center) > hw - ballR;
}

/** Bot steering: -1 pull left, +1 pull right, 0 coast. */
export function botSteer(bx: number, center: number, deadzone: number): -1 | 0 | 1 {
  if (bx < center - deadzone) return 1;
  if (bx > center + deadzone) return -1;
  return 0;
}
