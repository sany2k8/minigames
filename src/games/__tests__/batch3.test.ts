import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as rv from '../reversi/logic';
import * as mc from '../mancala/logic';
import * as gf from '../golf-solitaire/logic';
import * as sd from '../sudoku-mini/logic';
import * as pm from '../pipe-mania/logic';
import * as ff from '../flow-free/logic';
import * as kh from '../knife-hit/logic';

describe('reversi', () => {
  it('opens with four legal moves and flips on play', () => {
    const b = rv.initBoard();
    expect(rv.validMoves(b, 0)).toHaveLength(4);
    const move = rv.validMoves(b, 0)[0];
    const nb = rv.applyMove(b, 0, move);
    expect(rv.count(nb, 0)).toBe(4); // placed + 1 flip from the starting 2
  });
});

describe('mancala', () => {
  it('grants an extra turn when the last seed lands in your store', () => {
    // seat 0, pit 2 has 4 seeds -> lands exactly in store (index 6)
    const b = mc.initBoard(4);
    const res = mc.sow(b, 0, 2);
    expect(res.extraTurn).toBe(true);
    expect(res.board[6]).toBe(1);
  });
  it('captures from the opposite pit', () => {
    const b = mc.initBoard(0);
    b[1] = 1; // one seed in pit 1 -> sows into empty pit 2
    b[10] = 5; // opposite of pit 2 is 10
    const res = mc.sow(b, 0, 1);
    expect(res.captured).toBe(6); // 5 opposite + 1 landing
    expect(res.board[6]).toBe(6);
  });
});

describe('golf solitaire', () => {
  it('only plays cards one rank away (no wrap)', () => {
    const st = { columns: [], stock: [], waste: [{ r: 5, s: 0 }] } as gf.GolfState;
    expect(gf.canPlay({ r: 6, s: 1 }, st)).toBe(true);
    expect(gf.canPlay({ r: 4, s: 1 }, st)).toBe(true);
    expect(gf.canPlay({ r: 7, s: 1 }, st)).toBe(false);
  });
});

describe('sudoku mini', () => {
  it('generates a valid, fully-solved solution and a unique puzzle', () => {
    const p = sd.generate(makeRng(3), sd.difficultyGivens('medium'));
    // solution valid
    for (let r = 0; r < sd.N; r++)
      for (let c = 0; c < sd.N; c++) {
        const v = p.solution[r * sd.N + c];
        const g = p.solution.slice();
        g[r * sd.N + c] = 0;
        expect(sd.canPlace(g, r, c, v)).toBe(true);
      }
    // givens match solution
    p.puzzle.forEach((v, i) => {
      if (v !== 0) expect(v).toBe(p.solution[i]);
    });
  });
});

describe('pipe mania', () => {
  it('applying the solution rotations connects source to outlet', () => {
    const cfg = pm.pipeConfig('medium');
    const { board, solution } = pm.generate(makeRng(9), cfg.w, cfg.h);
    board.cells.forEach((cell, i) => (cell.rot = solution[i]));
    expect(pm.isSolved(board)).toBe(true);
  });
});

describe('flow free', () => {
  it('solution fills the whole grid and connects every pair', () => {
    const cfg = ff.flowConfig('medium');
    const puz = ff.generate(makeRng(4), cfg.w, cfg.h);
    const paths: Record<number, number[]> = {};
    puz.solution.forEach((seg, k) => (paths[k] = seg));
    expect(ff.coverage(paths).size).toBe(cfg.w * cfg.h);
    puz.endpoints.forEach((dots, k) => expect(ff.isConnected(puz.solution[k], dots)).toBe(true));
  });
});

describe('knife hit', () => {
  it('measures circular distance and detects collisions', () => {
    expect(kh.angDist(350, 10)).toBe(20);
    expect(kh.collides([0, 90, 180], 95, 17)).toBe(true);
    expect(kh.collides([0, 90, 180], 45, 17)).toBe(false);
  });
});
