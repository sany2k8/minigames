import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import {
  type Dungeon,
  botNextReveal,
  config,
  deduce,
  generate,
  neighbors,
  revealFlood
} from '../dungeon-sweeper/logic';

const DIFFS = ['easy', 'medium', 'hard'] as const;

describe('dungeon-sweeper generation', () => {
  it('places the requested counts and a single exit, all difficulties', () => {
    for (const diff of DIFFS) {
      const cfg = config(diff);
      const d = generate(makeRng(7), cfg);
      const count = (t: string) => d.tiles.filter((x) => x === t).length;
      expect(count('monster')).toBe(cfg.monsters);
      expect(count('exit')).toBe(1);
      expect(count('gold')).toBe(cfg.gold);
      expect(d.tiles[d.start]).not.toBe('monster');
    }
  });

  it('keeps the start cell safe (no adjacent monsters) for an opening flood', () => {
    for (let s = 0; s < 20; s++) {
      const d = generate(makeRng(s * 99991), config('medium'));
      expect(d.adj[d.start]).toBe(0);
    }
  });

  it('computes adjacency that matches the actual monster layout', () => {
    const d = generate(makeRng(3), config('easy'));
    for (let i = 0; i < d.tiles.length; i++) {
      const actual = neighbors(d.w, d.h, i).filter((j) => d.tiles[j] === 'monster').length;
      expect(d.adj[i]).toBe(actual);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generate(makeRng(50), config('hard')).tiles;
    const b = generate(makeRng(50), config('hard')).tiles;
    expect(a).toEqual(b);
  });
});

describe('dungeon-sweeper reveal flood', () => {
  it('floods through zero-adjacency cells but never auto-reveals a monster', () => {
    const d = generate(makeRng(11), config('medium'));
    const revealed = new Array(d.w * d.h).fill(false);
    const newly = revealFlood(d, revealed, d.start);
    expect(newly.length).toBeGreaterThan(1); // an open pocket
    expect(newly.some((i) => d.tiles[i] === 'monster')).toBe(false);
  });

  it('a direct tap on a monster reveals only that monster', () => {
    const d = generate(makeRng(11), config('medium'));
    const mIdx = d.tiles.findIndex((t) => t === 'monster');
    const revealed = new Array(d.w * d.h).fill(false);
    expect(revealFlood(d, revealed, mIdx)).toEqual([mIdx]);
  });
});

describe('dungeon-sweeper bot deduction', () => {
  it('only ever deduces true mines/safes (sound)', () => {
    const d = generate(makeRng(21), config('medium'));
    let revealed = new Array(d.w * d.h).fill(false);
    for (const i of revealFlood(d, revealed, d.start)) revealed[i] = true;
    const { mine, safe } = deduce(d, revealed);
    for (const i of mine) expect(d.tiles[i]).toBe('monster');
    for (const i of safe) expect(d.tiles[i]).not.toBe('monster');
  });

  it('bot picks an unrevealed cell each step until resolved', () => {
    const d: Dungeon = generate(makeRng(33), config('easy'));
    const revealed = new Array(d.w * d.h).fill(false);
    for (const i of revealFlood(d, revealed, d.start)) revealed[i] = true;
    const idx = botNextReveal(d, revealed, makeRng(1));
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(revealed[idx]).toBe(false);
  });
});
