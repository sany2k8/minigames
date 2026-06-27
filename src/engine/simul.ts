import type { SoloResult } from './types';

/** The minimum a seat needs for outcome resolution (a subset of PlayerInfo). */
export interface SeatLite {
  seat: number;
  name: string;
  kind: 'human' | 'bot';
}

/** A resolved match result, ready to feed the ResultModal / reward system. */
export interface Outcome {
  title: string;
  subtitle?: string;
  emoji: string;
  score?: number; // solo high-score recording
  humanWon?: boolean; // a human (not a bot) won — triggers rewards + confetti
}

/**
 * Decide the outcome of a race/score match each time a seat finishes.
 *
 * Returns the match `Outcome` once it is decided, or `null` while the match
 * should keep running. Pure + synchronous so it is unit-testable.
 *
 * Rules, in order:
 *  1. Solo (1 seat) — finishing ends the run; solved = win.
 *  2. Race — the first seat to fully solve wins immediately.
 *  3. A **human** who is OUT (game over / crash, i.e. `!solved`) while an
 *     opponent is still playing loses immediately — the last seat still
 *     standing wins. (Without this the human waits for the bot to finish.)
 *  4. Once every seat has finished, the highest score wins (ties = draw).
 *  5. Otherwise keep waiting.
 */
export function resolveSimulOutcome(
  mode: 'race' | 'score',
  players: SeatLite[],
  results: Record<number, SoloResult>,
  justFinished: number
): Outcome | null {
  const me = players.find((p) => p.seat === justFinished);
  const r = results[justFinished];
  if (!me || !r) return null;

  // 1. Solo
  if (players.length === 1) {
    return r.solved
      ? { title: mode === 'race' ? 'Solved!' : 'Round complete', subtitle: `Score ${r.score}`, emoji: '🎉', score: r.score, humanWon: true }
      : { title: 'Game Over', subtitle: `Score ${r.score}`, emoji: '💥', score: r.score };
  }

  // 2. Race: first to fully solve wins
  if (mode === 'race' && r.solved) {
    return { title: `${me.name} wins!`, subtitle: 'First to finish!', emoji: '🏆', humanWon: me.kind === 'human' };
  }

  // 3. Human out before the opponent finished → still-standing opponent wins now
  if (me.kind === 'human' && !r.solved) {
    const standing = players.filter((p) => p.seat !== justFinished && !results[p.seat]);
    if (standing.length > 0) {
      const w = standing[0];
      return { title: `${w.name} wins!`, subtitle: `${me.name} is out`, emoji: '🏆', humanWon: w.kind === 'human' };
    }
  }

  // 4. Everyone done → rank by score
  if (players.every((p) => results[p.seat])) {
    const ranked = players
      .map((p) => ({ p, s: results[p.seat]?.score ?? 0 }))
      .sort((a, b) => b.s - a.s);
    const draw = ranked[0].s === ranked[1].s;
    return {
      title: draw ? "It's a draw" : `${ranked[0].p.name} wins!`,
      subtitle: players.map((p) => `${p.name}: ${results[p.seat]?.score ?? 0}`).join('   ·   '),
      emoji: '🏆',
      humanWon: !draw && ranked[0].p.kind === 'human'
    };
  }

  // 5. Keep waiting
  return null;
}
