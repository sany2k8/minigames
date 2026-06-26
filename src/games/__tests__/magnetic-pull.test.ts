import { describe, it, expect } from 'vitest';
import { botSteer, centerAt, clampCenter, config, hwAt, isCrash } from '../magnetic-pull/logic';

describe('magnetic-pull track', () => {
  it('centerAt is deterministic and identical for the same seed (race fairness)', () => {
    for (let y = 0; y < 5000; y += 137) {
      expect(centerAt(42, y)).toBe(centerAt(42, y));
    }
    expect(centerAt(42, 1000)).not.toBe(centerAt(43, 1000));
  });

  it('clampCenter always keeps the corridor fully on-screen', () => {
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const cfg = config(diff);
      for (let y = 0; y < 6000; y += 91) {
        const hw = hwAt(cfg, y);
        const c = clampCenter(centerAt(7, y), hw);
        expect(c - hw).toBeGreaterThanOrEqual(-1e-9);
        expect(c + hw).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('corridor narrows toward the ball radius with distance (run is finite)', () => {
    const cfg = config('medium');
    expect(hwAt(cfg, 0)).toBeGreaterThan(hwAt(cfg, 4000));
    // eventually clamps just above the ball radius
    expect(hwAt(cfg, 1e9)).toBeCloseTo(cfg.ballR * 1.04, 5);
  });
});

describe('magnetic-pull collision + bot', () => {
  it('flags a crash only when the ball overlaps a wall', () => {
    expect(isCrash(0.5, 0.5, 0.15, 0.03)).toBe(false);
    expect(isCrash(0.5, 0.5 + 0.13, 0.15, 0.03)).toBe(true); // offset 0.13 > 0.12
  });

  it('bot steers toward the corridor centre', () => {
    expect(botSteer(0.3, 0.5, 0.01)).toBe(1); // ball left of centre -> pull right
    expect(botSteer(0.7, 0.5, 0.01)).toBe(-1);
    expect(botSteer(0.5, 0.5, 0.01)).toBe(0);
  });
});
