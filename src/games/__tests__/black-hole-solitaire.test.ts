import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import {
  adjacent,
  bestSequence,
  cardsLeft,
  deal,
  isCleared,
  playablePiles
} from '../black-hole-solitaire/logic';

describe('black hole adjacency', () => {
  it('treats consecutive ranks as adjacent', () => {
    expect(adjacent(4, 5)).toBe(true);
    expect(adjacent(5, 4)).toBe(true);
    expect(adjacent(4, 6)).toBe(false);
  });
  it('wraps A(0) to both 2(1) and K(12)', () => {
    expect(adjacent(0, 1)).toBe(true);
    expect(adjacent(0, 12)).toBe(true);
    expect(adjacent(1, 12)).toBe(false);
  });
});

describe('black hole deal', () => {
  it('deals 17 piles of 3 = 51 cards and seeds A♠ in the hole', () => {
    const d = deal(makeRng(5));
    expect(d.piles).toHaveLength(17);
    expect(d.piles.every((p) => p.length === 3)).toBe(true);
    expect(cardsLeft(d.piles)).toBe(51);
    expect(d.hole).toEqual({ rank: 0, suit: 0 });
  });
  it('uses every one of the 52 cards exactly once (51 piles + hole)', () => {
    const d = deal(makeRng(9));
    const keys = new Set<number>();
    for (const p of d.piles) for (const c of p) keys.add(c.rank * 4 + c.suit);
    keys.add(d.hole.rank * 4 + d.hole.suit);
    expect(keys.size).toBe(52);
  });
  it('is deterministic for a given seed', () => {
    const a = deal(makeRng(42)).piles;
    const b = deal(makeRng(42)).piles;
    expect(a).toEqual(b);
  });
});

describe('black hole playablePiles', () => {
  it('only returns piles whose top card is adjacent to the hole', () => {
    const piles = [[{ rank: 1, suit: 0 }], [{ rank: 5, suit: 1 }], [{ rank: 12, suit: 2 }]];
    const hole = { rank: 0, suit: 0 }; // Ace -> adjacent to 2(rank1) and K(rank12)
    expect(playablePiles(piles, hole).sort()).toEqual([0, 2]);
  });
});

describe('black hole bestSequence (bot plan)', () => {
  it('produces only legal consecutive plays', () => {
    const d = deal(makeRng(123));
    const order = bestSequence(d);
    // Replay it and assert every move was legal.
    const piles = d.piles.map((p) => p.slice());
    let hole = d.hole;
    for (const idx of order) {
      const top = piles[idx][piles[idx].length - 1];
      expect(top).toBeTruthy();
      expect(adjacent(top.rank, hole.rank)).toBe(true);
      hole = top;
      piles[idx] = piles[idx].slice(0, -1);
    }
  });
  it('clears a healthy fraction of cards on average', () => {
    const N = 12;
    let total = 0;
    for (let s = 0; s < N; s++) total += bestSequence(deal(makeRng(s * 2654435761))).length;
    // The DFS solver clears well over half of 51 on average.
    expect(total / N).toBeGreaterThan(30);
  });
  it('reports a cleared board correctly', () => {
    expect(isCleared([[], [], []])).toBe(true);
    expect(isCleared([[{ rank: 2, suit: 0 }]])).toBe(false);
  });
});
