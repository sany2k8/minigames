import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as ck from '../checkers/logic';
import * as hp from '../hexa-puzzle/logic';
import { fire } from '../merge-defense/logic';
import * as tm from '../tile-match/logic';
import * as ww from '../word-wipe/logic';

describe('checkers', () => {
  it('opens with 12 pieces each and only forward moves', () => {
    const b = ck.initBoard();
    expect(ck.count(b, 0)).toBe(12);
    expect(ck.count(b, 1)).toBe(12);
    const m0 = ck.legalMoves(b, 0);
    expect(m0.length).toBe(7); // standard checkers opening moves
    expect(m0.every((m) => m.captured.length === 0)).toBe(true);
  });
  it('forces and applies a capture', () => {
    const b = ck.initBoard();
    // clear and set up a simple jump: seat0 man at 5,2 ; seat1 man at 4,3 ; empty 3,4
    for (let i = 0; i < 64; i++) b[i] = 0;
    b[5 * 8 + 2] = 1;
    b[4 * 8 + 3] = 3;
    const moves = ck.legalMoves(b, 0);
    expect(moves.length).toBe(1);
    expect(moves[0].captured.length).toBe(1);
    const nb = ck.applyMove(b, moves[0]);
    expect(ck.count(nb, 1)).toBe(0);
  });
});

describe('hexa-puzzle', () => {
  it('clears a full line', () => {
    const board = hp.emptyBoard();
    // fill every cell of the first line except one, then place a single there
    const line = hp.LINES[0];
    for (let k = 1; k < line.length; k++) board[line[k]] = 1;
    const target = hp.CELLS[line[0]];
    const res = hp.place(board, { id: 1, cells: [{ q: 0, r: 0 }], color: 2 }, target);
    expect(res.cleared).toBeGreaterThanOrEqual(1);
    expect(line.every((i) => res.board[i] === 0)).toBe(true);
  });
});

describe('merge-defense', () => {
  it('a tile eats enemies until it runs out', () => {
    const enemies = [
      { id: 1, value: 4, dist: 1 },
      { id: 2, value: 8, dist: 2 }
    ];
    const res = fire(enemies, 10);
    expect(res.destroyed).toBe(4); // 10 eats the 4, then 6 < 8 leaves a 2
    expect(res.enemies).toHaveLength(1);
    expect(res.enemies[0].value).toBe(2);
  });
});

describe('tile-match', () => {
  it('generates a multiple-of-3 layered pile with free top tiles', () => {
    const tiles = tm.generate(makeRng(5), 6);
    expect(tiles.length % 3).toBe(0);
    expect(tm.freeTiles(tiles, new Set()).length).toBeGreaterThan(0);
  });
});

describe('word-wipe', () => {
  it('seeds a board that contains at least one findable word', () => {
    const grid = ww.generate(makeRng(9));
    expect(grid.length).toBe(ww.W * ww.H);
    expect(ww.findWord(grid)).not.toBeNull();
  });
  it('collapse drops letters and refills', () => {
    const grid = ww.generate(makeRng(1));
    const cleared = new Set([0, 1, 2]);
    const next = ww.collapse(grid, cleared, makeRng(2));
    expect(next.length).toBe(grid.length);
    expect(next.every((c) => typeof c === 'string' && c.length === 1)).toBe(true);
  });
});
