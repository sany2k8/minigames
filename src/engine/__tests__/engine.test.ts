import { describe, it, expect } from 'vitest';
import { makeRng } from '../rng';
import { buildPlayers } from '../match';

describe('makeRng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng(123);
    const b = makeRng(123);
    expect([a.int(100), a.int(100), a.int(100)]).toEqual([b.int(100), b.int(100), b.int(100)]);
  });
  it('shuffle preserves elements', () => {
    const r = makeRng(7);
    const out = r.shuffle([1, 2, 3, 4, 5]);
    expect(out.slice().sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('buildPlayers', () => {
  it('race solo = 1 seat, duo = 2 humans, bot = human + bot', () => {
    expect(buildPlayers('race', 'solo', 'medium', 'A', 'B')).toHaveLength(1);
    const duo = buildPlayers('race', 'duo', 'medium', 'A', 'B');
    expect(duo.map((p) => p.kind)).toEqual(['human', 'human']);
    const bot = buildPlayers('race', 'bot', 'medium', 'A', 'B');
    expect(bot.map((p) => p.kind)).toEqual(['human', 'bot']);
  });
  it('table seats a full table of 4', () => {
    const solo = buildPlayers('table', 'solo', 'easy', 'A', 'B');
    expect(solo).toHaveLength(4);
    expect(solo.filter((p) => p.kind === 'human')).toHaveLength(1);
    const duo = buildPlayers('table', 'duo', 'easy', 'A', 'B');
    expect(duo.filter((p) => p.kind === 'human')).toHaveLength(2);
  });
});
