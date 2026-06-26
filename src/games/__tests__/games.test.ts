import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as ws from '../water-sort/logic';
import * as cc from '../color-cards/logic';
import * as cb from '../color-blocks/logic';
import * as mz from '../maze-paint/logic';
import { canForm, solutionsFor } from '../word-finder/words';

describe('water-sort', () => {
  it('generates an unsolved, well-formed puzzle', () => {
    const cfg = ws.difficultyConfig('medium');
    const tubes = ws.generate(makeRng(42), cfg);
    expect(tubes).toHaveLength(cfg.numColors + cfg.empties);
    expect(ws.isSolved(tubes, cfg.height)).toBe(false);
  });
  it('pour moves matching top units and respects capacity', () => {
    const tubes = [[0, 0], [0], []];
    const out = ws.pour(tubes, 0, 2, 4); // pour onto empty
    expect(out[2]).toEqual([0, 0]);
    expect(out[0]).toEqual([]);
  });
  it('bot makes only legal progress and same seed is reproducible', () => {
    const cfg = ws.difficultyConfig('easy');
    const t1 = ws.generate(makeRng(99), cfg);
    const t2 = ws.generate(makeRng(99), cfg);
    expect(t1).toEqual(t2);
    const m = ws.bestMove(t1, cfg.height, makeRng(1));
    if (m) expect(ws.canPour(t1, m[0], m[1], cfg.height)).toBe(true);
  });
});

describe('color-cards', () => {
  it('deals 7 cards to each player and has a non-wild start card', () => {
    const s = cc.deal(makeRng(5), 4);
    expect(s.hands.every((h) => h.length === 7)).toBe(true);
    expect(cc.top(s).color).not.toBe('wild');
  });
  it('only allows legal plays and advances the turn', () => {
    const s = cc.deal(makeRng(5), 4);
    const legal = cc.playableCards(s, 0);
    if (legal.length) {
      const before = s.current;
      const ns = cc.playCard(s, legal[0].id, makeRng(5));
      // either a wild is awaiting color, or the turn moved on / someone won
      expect(ns.awaitingColor || ns.current !== before || ns.winner !== null).toBe(true);
    }
  });
});

describe('color-blocks', () => {
  it('clears a completed row', () => {
    const grid = Array(cb.N * cb.N).fill(0);
    for (let c = 1; c < cb.N; c++) grid[cb.idx(0, c)] = 1; // row missing one cell
    const piece = { id: 1, cells: [[0, 0]] as [number, number][], color: 2 };
    const res = cb.place(grid, piece, 0, 0);
    expect(res.cleared).toBe(1);
    expect(res.grid.slice(0, cb.N).every((v) => v === 0)).toBe(true);
  });
});

describe('maze-paint', () => {
  it('produces a one-stroke solution over all open cells', () => {
    const maze = mz.generate(makeRng(11), 6, 8);
    expect(maze.order.length).toBe(maze.open.size);
    for (let i = 1; i < maze.order.length; i++) {
      const a = maze.order[i - 1];
      const b = maze.order[i];
      const [ar, ac] = [Math.floor(a / maze.w), a % maze.w];
      const [br, bc] = [Math.floor(b / maze.w), b % maze.w];
      expect(Math.abs(ar - br) + Math.abs(ac - bc)).toBe(1); // adjacent
    }
  });
});

describe('word-finder', () => {
  it('canForm respects letter multiplicity', () => {
    expect(canForm('star', 'master')).toBe(true);
    expect(canForm('tt', 'master')).toBe(false);
  });
  it('finds multiple words for a base', () => {
    const sols = solutionsFor('master');
    expect(sols).toContain('star');
    expect(sols.length).toBeGreaterThan(5);
  });
});
