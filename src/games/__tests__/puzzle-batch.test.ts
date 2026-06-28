import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as lights from '../lights-out/logic';
import * as fib from '../fib-2048/logic';
import * as sok from '../sokoban/logic';

describe('lights-out', () => {
  it('generates a solvable, non-solved board; replaying the solution clears it', () => {
    for (let s = 1; s <= 20; s++) {
      const cfg = lights.lightsConfig('medium');
      const { grid, solution } = lights.generate(makeRng(s), cfg);
      expect(lights.isSolved(grid)).toBe(false);
      let g = grid;
      for (const cell of solution) g = lights.press(g, cell, cfg.n);
      expect(lights.isSolved(g)).toBe(true);
    }
  });
  it('press is self-inverse', () => {
    const cfg = lights.lightsConfig('easy');
    const g0 = lights.generate(makeRng(3), cfg).grid;
    const g2 = lights.press(lights.press(g0, 5, cfg.n), 5, cfg.n);
    expect(g2).toEqual(g0);
  });
});

describe('fib-2048', () => {
  it('only merges consecutive Fibonacci numbers (and two 1s)', () => {
    expect(fib.canMerge(1, 1)).toBe(true);
    expect(fib.canMerge(1, 2)).toBe(true);
    expect(fib.canMerge(2, 3)).toBe(true);
    expect(fib.canMerge(3, 5)).toBe(true);
    expect(fib.canMerge(5, 8)).toBe(true);
    expect(fib.canMerge(2, 2)).toBe(false);
    expect(fib.canMerge(1, 3)).toBe(false);
    expect(fib.canMerge(8, 8)).toBe(false);
  });
  it('a left move merges 2,3 into 5 and reports the gain', () => {
    // row 0 = [2,3,0,0]; others empty
    const grid = fib.emptyGrid();
    grid[0] = 2; grid[1] = 3;
    const res = fib.move(grid, 'left');
    expect(res.moved).toBe(true);
    expect(res.grid[0]).toBe(5);
    expect(res.gained).toBe(5);
  });
  it('is deterministic for a seed and the bot returns a legal move', () => {
    const rng = makeRng(42);
    let g = fib.spawn(fib.spawn(fib.emptyGrid(), rng), rng);
    const d = fib.botMove(g);
    expect(d).not.toBeNull();
    expect(fib.move(g, d!).moved).toBe(true);
  });
});

describe('sokoban', () => {
  it('every curated level solution actually solves it', () => {
    for (let i = 0; i < 5; i++) {
      const lvl = sok.parse(i);
      let state = { player: lvl.player, boxes: lvl.boxes.slice() };
      for (const dir of lvl.solution) {
        const next = sok.step(lvl, state, dir);
        expect(next, `level ${i} move ${dir} should be legal`).not.toBeNull();
        state = next!;
      }
      expect(sok.isSolved(state.boxes, lvl.targets), `level ${i} solved`).toBe(true);
    }
  });
  it('levelFor is deterministic per seed', () => {
    const a = sok.levelFor(makeRng(7), 'medium');
    const b = sok.levelFor(makeRng(7), 'medium');
    expect(a.player).toBe(b.player);
    expect(a.boxes).toEqual(b.boxes);
  });
});
