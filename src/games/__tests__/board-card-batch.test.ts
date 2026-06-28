import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as pyr from '../pyramid-solitaire/logic';
import * as dom from '../dominoes/logic';

describe('pyramid-solitaire', () => {
  it('deals a 28-card pyramid + 24 stock from a full 52-card deck', () => {
    const st = pyr.deal(makeRng(1));
    expect(st.pyramid.length).toBe(28);
    expect(st.stock.length).toBe(24);
    const all = [...st.pyramid, ...st.stock].map((c) => c.id);
    expect(new Set(all).size).toBe(52);
  });
  it('only the bottom row starts exposed', () => {
    const st = pyr.deal(makeRng(2));
    for (let i = 21; i < 28; i++) expect(pyr.isExposed(st, i)).toBe(true); // bottom row
    for (let i = 0; i < 21; i++) expect(pyr.isExposed(st, i)).toBe(false);
  });
  it('removes a pair of exposed cards summing to 13', () => {
    const st = pyr.deal(makeRng(3));
    // force two bottom cards to 5 and 8
    st.pyramid[21] = { id: 100, rank: 5, suit: 0 };
    st.pyramid[22] = { id: 101, rank: 8, suit: 1 };
    const next = pyr.removePair(st, { where: 'pyr', idx: 21 }, { where: 'pyr', idx: 22 });
    expect(next).not.toBeNull();
    expect(next!.removed.has(21)).toBe(true);
    expect(next!.removed.has(22)).toBe(true);
  });
  it('rejects a non-13 pair', () => {
    const st = pyr.deal(makeRng(4));
    st.pyramid[21] = { id: 100, rank: 5, suit: 0 };
    st.pyramid[22] = { id: 101, rank: 5, suit: 1 };
    expect(pyr.removePair(st, { where: 'pyr', idx: 21 }, { where: 'pyr', idx: 22 })).toBeNull();
  });
});

describe('dominoes', () => {
  it('deals the full double-six set (28 tiles): 7+7 hands + 14 boneyard', () => {
    const { hands, boneyard } = dom.deal(makeRng(1));
    expect(hands[0].length).toBe(7);
    expect(hands[1].length).toBe(7);
    expect(boneyard.length).toBe(14);
    const keys = [...hands[0], ...hands[1], ...boneyard].map(dom.tileKey);
    expect(new Set(keys).size).toBe(28);
  });
  it('places matching tiles and updates the open ends', () => {
    let line = dom.place([], [3, 5], 'R')!; // ends 3 .. 5
    expect(dom.ends(line)).toEqual([3, 5]);
    line = dom.place(line, [5, 2], 'R')!; // right end now 2
    expect(dom.ends(line)).toEqual([3, 2]);
    line = dom.place(line, [6, 3], 'L')!; // left end now 6
    expect(dom.ends(line)).toEqual([6, 2]);
  });
  it('canPlay respects the open ends', () => {
    const line = dom.place([], [3, 5], 'R')!;
    expect(dom.canPlay([5, 1], line)).toBe(true);
    expect(dom.canPlay([3, 0], line)).toBe(true);
    expect(dom.canPlay([1, 2], line)).toBe(false);
  });
  it('botMove returns a legal play when one exists', () => {
    const line = dom.place([], [3, 5], 'R')!;
    const hand: dom.Tile[] = [[1, 2], [5, 6]];
    const mv = dom.botMove(hand, line);
    expect(mv).not.toBeNull();
    expect(dom.place(line, mv!.tile, mv!.side)).not.toBeNull();
  });
});
