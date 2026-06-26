import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import {
  type Pt,
  applyCut,
  config,
  equalVerticalCuts,
  generate,
  polygonArea,
  sliceScore,
  splitConvex
} from '../perfect-slice/logic';

const SQUARE: Pt[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 }
];

describe('perfect-slice geometry', () => {
  it('computes polygon area via shoelace', () => {
    expect(polygonArea(SQUARE)).toBe(100);
    expect(polygonArea([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }])).toBe(6);
  });

  it('splits a square into two equal halves with a centre vertical line', () => {
    const { left, right } = splitConvex(SQUARE, { x: 5, y: -1 }, { x: 5, y: 11 });
    expect(polygonArea(left)).toBeCloseTo(50, 6);
    expect(polygonArea(right)).toBeCloseTo(50, 6);
  });

  it('a line that misses the polygon yields one empty side', () => {
    const { left, right } = splitConvex(SQUARE, { x: 20, y: -1 }, { x: 20, y: 11 });
    const la = left.length >= 3 ? polygonArea(left) : 0;
    const ra = right.length >= 3 ? polygonArea(right) : 0;
    expect(Math.min(la, ra)).toBeCloseTo(0, 6);
    expect(Math.max(la, ra)).toBeCloseTo(100, 6);
  });

  it('applyCut only divides pieces the line truly crosses', () => {
    const after = applyCut([SQUARE], { x: 5, y: -1 }, { x: 5, y: 11 });
    expect(after).toHaveLength(2);
    const miss = applyCut([SQUARE], { x: 50, y: -1 }, { x: 50, y: 11 });
    expect(miss).toHaveLength(1);
  });
});

describe('perfect-slice scoring', () => {
  it('scores 100 for N exactly-equal pieces', () => {
    const halves = applyCut([SQUARE], { x: 5, y: -1 }, { x: 5, y: 11 });
    expect(sliceScore(halves, 2)).toBe(100);
  });
  it('penalises an uncut shape (wrong count)', () => {
    expect(sliceScore([SQUARE], 2)).toBeLessThanOrEqual(55);
  });
});

describe('perfect-slice bot', () => {
  it('equalVerticalCuts divides any generated shape into ~equal strips', () => {
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const cfg = config(diff);
      for (let s = 0; s < 12; s++) {
        const shape = generate(makeRng(s * 7919), cfg);
        let pieces = [shape];
        for (const x of equalVerticalCuts(shape, cfg.pieces)) {
          pieces = applyCut(pieces, { x, y: -10 }, { x, y: 110 });
        }
        // bot should reach a strong score on every shape
        expect(sliceScore(pieces, cfg.pieces)).toBeGreaterThanOrEqual(90);
      }
    }
  });

  it('generation is deterministic for a seed', () => {
    const a = generate(makeRng(5), config('medium'));
    const b = generate(makeRng(5), config('medium'));
    expect(a).toEqual(b);
  });
});
