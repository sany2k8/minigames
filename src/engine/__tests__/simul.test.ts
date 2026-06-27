import { describe, it, expect } from 'vitest';
import { resolveSimulOutcome, type SeatLite } from '../simul';
import type { SoloResult } from '../types';

const human: SeatLite = { seat: 0, name: 'Player 1', kind: 'human' };
const bot: SeatLite = { seat: 1, name: 'Max', kind: 'bot' };
const human2: SeatLite = { seat: 1, name: 'Player 2', kind: 'human' };

const done = (solved: boolean, score = 0): SoloResult => ({ solved, score, timeMs: 0 });

describe('resolveSimulOutcome', () => {
  describe('vs bot (score)', () => {
    it('human fails before the bot → match ends immediately, human loses', () => {
      // Only the human has finished (crashed). The bot is still flying.
      const results = { [human.seat]: done(false, 7) };
      const out = resolveSimulOutcome('score', [human, bot], results, human.seat);
      expect(out).not.toBeNull();
      expect(out!.humanWon).toBe(false);
      expect(out!.title).toBe('Max wins!');
      expect(out!.subtitle).toBe('Player 1 is out');
    });

    it('human fails before bot even when human had the higher score so far', () => {
      const results = { [human.seat]: done(false, 99) }; // bot not done yet
      const out = resolveSimulOutcome('score', [human, bot], results, human.seat);
      expect(out!.humanWon).toBe(false); // still standing opponent wins
    });

    it('bot finishes first → keep waiting (human plays on)', () => {
      const results = { [bot.seat]: done(false, 5) };
      const out = resolveSimulOutcome('score', [human, bot], results, bot.seat);
      expect(out).toBeNull();
    });

    it('both done → highest score wins (human ahead)', () => {
      const results = { [human.seat]: done(false, 12), [bot.seat]: done(false, 5) };
      const out = resolveSimulOutcome('score', [human, bot], results, human.seat);
      expect(out!.humanWon).toBe(true);
      expect(out!.title).toBe('Player 1 wins!');
    });

    it('both done → highest score wins (bot ahead)', () => {
      const results = { [human.seat]: done(false, 3), [bot.seat]: done(false, 9) };
      const out = resolveSimulOutcome('score', [human, bot], results, human.seat);
      expect(out!.humanWon).toBe(false);
      expect(out!.title).toBe('Max wins!');
    });

    it('both done with equal score → draw', () => {
      const results = { [human.seat]: done(false, 8), [bot.seat]: done(false, 8) };
      const out = resolveSimulOutcome('score', [human, bot], results, human.seat);
      expect(out!.title).toBe("It's a draw");
      expect(out!.humanWon).toBe(false);
    });
  });

  describe('race', () => {
    it('human solves first → human wins immediately', () => {
      const results = { [human.seat]: done(true, 100) };
      const out = resolveSimulOutcome('race', [human, bot], results, human.seat);
      expect(out!.humanWon).toBe(true);
      expect(out!.subtitle).toBe('First to finish!');
    });

    it('human crashes mid-race while bot still racing → human loses immediately', () => {
      const results = { [human.seat]: done(false, 0) };
      const out = resolveSimulOutcome('race', [human, bot], results, human.seat);
      expect(out!.humanWon).toBe(false);
      expect(out!.title).toBe('Max wins!');
    });
  });

  describe('duo (two humans)', () => {
    it('first human out while the other is still playing → the survivor wins', () => {
      const results = { [human.seat]: done(false, 4) }; // human2 still playing
      const out = resolveSimulOutcome('score', [human, human2], results, human.seat);
      expect(out!.title).toBe('Player 2 wins!');
      expect(out!.humanWon).toBe(true);
    });
  });

  describe('solo', () => {
    it('solved → win', () => {
      const out = resolveSimulOutcome('score', [human], { [human.seat]: done(true, 50) }, human.seat);
      expect(out!.humanWon).toBe(true);
      expect(out!.title).toBe('Round complete');
    });
    it('failed → game over (no win)', () => {
      const out = resolveSimulOutcome('score', [human], { [human.seat]: done(false, 50) }, human.seat);
      expect(out!.humanWon).toBeUndefined();
      expect(out!.title).toBe('Game Over');
    });
  });
});
