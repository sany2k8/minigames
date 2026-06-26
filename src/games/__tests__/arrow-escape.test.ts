import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import {
  EMPTY,
  type Board,
  botMove,
  config,
  escapable,
  generate,
  isCleared,
  rayClear,
  tilesLeft
} from '../arrow-escape/logic';

const DIFFS = ['easy', 'medium', 'hard'] as const;

function clearByGreedy(board: Board): boolean {
  let b: Board = { ...board, cells: board.cells.slice() };
  let guard = b.cells.length * 4 + 5;
  while (!isCleared(b) && guard-- > 0) {
    const idx = botMove(b);
    if (idx < 0) return false; // stuck before clearing
    const cells = b.cells.slice();
    cells[idx] = EMPTY;
    b = { ...b, cells };
  }
  return isCleared(b);
}

describe('arrow-escape rayClear', () => {
  it('is clear when nothing blocks the path to the edge', () => {
    // 3x3 empty grid, tile at center pointing up -> top edge is clear
    const cells = new Array(9).fill(EMPTY);
    expect(rayClear(cells, 3, 3, 4, 0)).toBe(true);
  });
  it('is blocked when a tile sits on the ray', () => {
    const cells = new Array(9).fill(EMPTY);
    cells[1] = 2; // tile directly above center (idx 4)
    expect(rayClear(cells, 3, 3, 4, 0)).toBe(false);
    // but the right/left/down rays are still clear
    expect(rayClear(cells, 3, 3, 4, 1)).toBe(true);
  });
});

describe('arrow-escape generation', () => {
  it('same seed => identical board (deterministic)', () => {
    const cfg = config('medium');
    const a = generate(makeRng(123), cfg).cells;
    const b = generate(makeRng(123), cfg).cells;
    expect(a).toEqual(b);
  });

  it('places a sensible number of tiles', () => {
    const cfg = config('medium');
    const board = generate(makeRng(7), cfg);
    const n = tilesLeft(board);
    expect(n).toBeGreaterThan(cfg.w * cfg.h * 0.5);
    expect(n).toBeLessThanOrEqual(cfg.w * cfg.h);
  });

  it('every generated board is fully clearable by greedy escapes, all difficulties & seeds', () => {
    for (const d of DIFFS) {
      const cfg = config(d);
      for (let seed = 0; seed < 40; seed++) {
        const board = generate(makeRng(seed * 2654435761), cfg);
        expect(clearByGreedy(board)).toBe(true);
      }
    }
  });
});

describe('arrow-escape escapable', () => {
  it('bot only ever returns an escapable tile', () => {
    const board = generate(makeRng(99), config('hard'));
    const idx = botMove(board);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(escapable(board, idx)).toBe(true);
  });

  it('an empty cell is never escapable', () => {
    const board: Board = { w: 2, h: 2, cells: [EMPTY, EMPTY, EMPTY, EMPTY] };
    expect(escapable(board, 0)).toBe(false);
    expect(botMove(board)).toBe(-1);
  });
});
