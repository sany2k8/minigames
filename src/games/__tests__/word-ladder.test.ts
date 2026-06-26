import { describe, it, expect } from 'vitest';
import { PAIRS, WORDS, WORD_SET, bfsDist, bfsPath, isStep, neighbors, pickPair } from '../word-ladder/logic';

describe('word-ladder dictionary', () => {
  it('every word is exactly 4 letters and lowercase', () => {
    for (const w of WORDS) expect(w).toMatch(/^[a-z]{4}$/);
  });
});

describe('word-ladder neighbors', () => {
  it('returns only real words one letter away', () => {
    const nb = neighbors('cold');
    for (const w of nb) {
      expect(isStep('cold', w)).toBe(true);
      expect(WORD_SET.has(w)).toBe(true);
    }
    expect(nb).toContain('cord');
  });
});

describe('word-ladder pairs are all solvable', () => {
  it('every PAIR has a valid ladder where each step changes one letter', () => {
    for (const [start, target] of PAIRS) {
      const path = bfsPath(start, target);
      expect(path, `${start} -> ${target}`).not.toBeNull();
      expect(path![0]).toBe(start);
      expect(path![path!.length - 1]).toBe(target);
      for (let i = 1; i < path!.length; i++) {
        expect(isStep(path![i - 1], path![i])).toBe(true);
      }
      // non-trivial puzzles
      expect(bfsDist(start, target)).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('word-ladder pickPair', () => {
  it('is deterministic and in-range for any seed', () => {
    expect(pickPair(0)).toEqual(PAIRS[0]);
    expect(pickPair(5)).toEqual(PAIRS[5]);
    expect(PAIRS).toContainEqual(pickPair(123456));
    expect(pickPair(7)).toEqual(pickPair(7));
  });
});
