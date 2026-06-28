import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import { generate, isSolved, moveBlank, slideConfig, solvedBoard, tapTile } from '../sliding-puzzle/logic';

describe('sliding-puzzle', () => {
  it('generates a scrambled (unsolved) board and the solution restores it', () => {
    for (let s = 1; s <= 15; s++) {
      const cfg = slideConfig('medium');
      const { board, solution } = generate(makeRng(s), cfg);
      expect(isSolved(board)).toBe(false);
      let b = board;
      for (const d of solution) b = moveBlank(b, cfg.n, d)!;
      expect(isSolved(b)).toBe(true);
    }
  });
  it('tapTile only slides a neighbour of the blank', () => {
    const b = solvedBoard(3); // [1,2,3,4,5,6,7,8,0], blank at idx 8
    expect(tapTile(b, 3, 7)).not.toBeNull(); // left of blank
    expect(tapTile(b, 3, 5)).not.toBeNull(); // above blank
    expect(tapTile(b, 3, 0)).toBeNull(); // not adjacent
  });
  it('a solved board reports solved', () => {
    expect(isSolved(solvedBoard(4))).toBe(true);
  });
});
