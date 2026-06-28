import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import { type Board, drop, emptyBoard, botMove, winner } from '../connect-four/logic';

const place = (b: Board, cols: number[], marks: (1 | 2)[]): Board => {
  let board = b;
  cols.forEach((c, i) => {
    board = drop(board, c, marks[i])!.board;
  });
  return board;
};

describe('connect-four', () => {
  it('detects a horizontal win', () => {
    const b = place(emptyBoard(), [0, 1, 2, 3], [1, 1, 1, 1]);
    expect(winner(b)).toBe(1);
  });
  it('detects a vertical win', () => {
    const b = place(emptyBoard(), [5, 5, 5, 5], [2, 2, 2, 2]);
    expect(winner(b)).toBe(2);
  });
  it('no winner on an empty/partial board', () => {
    expect(winner(emptyBoard())).toBe(0);
    expect(winner(place(emptyBoard(), [0, 1, 2], [1, 1, 1]))).toBe(0);
  });
  it('a smart bot takes an immediate win', () => {
    // mark 1 has three in a row on the bottom: cols 0,1,2 → winning move is col 3
    const b = place(emptyBoard(), [0, 1, 2], [1, 1, 1]);
    expect(botMove(b, 1, makeRng(1), 1)).toBe(3);
  });
  it('a smart bot blocks the opponent’s win', () => {
    // opponent (mark 1) threatens cols 0,1,2 → bot (mark 2) must block at col 3
    const b = place(emptyBoard(), [0, 1, 2], [1, 1, 1]);
    expect(botMove(b, 2, makeRng(1), 1)).toBe(3);
  });
});
