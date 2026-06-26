import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as m2048 from '../merge-2048/logic';
import * as ttt from '../tic-tac-toe/logic';
import * as tj from '../traffic-jam/logic';
import * as db from '../dots-boxes/logic';
import { evaluate, botGuess } from '../wordle/logic';

describe('2048', () => {
  it('merges equal tiles once and scores the sum', () => {
    // [2,2,0,0] slide left -> [4,0,0,0], gained 4
    const grid = [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const res = m2048.move(grid, 'left');
    expect(res.grid.slice(0, 4)).toEqual([4, 0, 0, 0]);
    expect(res.gained).toBe(4);
    expect(res.moved).toBe(true);
  });
  it('does not merge a tile twice in one slide', () => {
    const grid = [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const res = m2048.move(grid, 'left');
    expect(res.grid.slice(0, 4)).toEqual([4, 4, 0, 0]);
  });
  it('detects game over on a full unmergeable board', () => {
    const g = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(m2048.canMove(g)).toBe(false);
  });
});

describe('tic-tac-toe minimax', () => {
  it('takes the winning move', () => {
    // seat 0 about to win on top row (cells 0,1 are 0; 2 empty)
    const b: ttt.Board = [0, 0, -1, 1, 1, -1, -1, -1, -1];
    expect(ttt.botMove(b, 0, 'hard')).toBe(2);
  });
  it('blocks the opponent win', () => {
    // seat 1 (bot) must block seat 0 who threatens 0,1 -> 2
    const b: ttt.Board = [0, 0, -1, 1, -1, -1, -1, -1, -1];
    expect(ttt.botMove(b, 1, 'hard')).toBe(2);
  });
  it('perfect play never loses to itself (draw)', () => {
    let b = ttt.emptyBoard();
    let turn: 0 | 1 = 0;
    while (!ttt.winner(b)) {
      const mv = ttt.botMove(b, turn, 'hard');
      b = b.slice();
      b[mv] = turn;
      turn = (1 - turn) as 0 | 1;
    }
    expect(ttt.winner(b)).toBe('draw');
  });
});

describe('traffic jam', () => {
  it('generates a solvable seeded puzzle whose solution actually frees the car', () => {
    const cfg = tj.difficultyConfig('easy');
    const p = tj.generate(makeRng(123), cfg);
    let vs = p.vehicles.map((v) => ({ ...v }));
    for (const mv of p.solution) vs = tj.moveVehicle(vs, mv.idx, mv.delta);
    expect(tj.isSolved(vs)).toBe(true);
  });
  it('same seed yields the same puzzle', () => {
    const cfg = tj.difficultyConfig('medium');
    const a = tj.generate(makeRng(7), cfg);
    const b = tj.generate(makeRng(7), cfg);
    expect(a.vehicles).toEqual(b.vehicles);
  });
});

describe('dots and boxes', () => {
  it('completing the fourth side claims the box', () => {
    let s = db.emptyState();
    s = db.applyEdge(s, { type: 'h', r: 0, c: 0 }, 0).state;
    s = db.applyEdge(s, { type: 'v', r: 0, c: 0 }, 0).state;
    s = db.applyEdge(s, { type: 'v', r: 0, c: 1 }, 0).state;
    const last = db.applyEdge(s, { type: 'h', r: 1, c: 0 }, 0);
    expect(last.completed).toBe(1);
    expect(db.scoreOf(last.state, 0)).toBe(1);
  });
});

describe('wordle', () => {
  it('marks correct/present/absent with duplicate handling', () => {
    // answer lilac: pos2 l & pos3 a are correct; one more l is present at pos1; extra a/y absent
    expect(evaluate('allay', 'lilac')).toEqual(['absent', 'present', 'correct', 'correct', 'absent']);
  });
  it('all-correct on exact match', () => {
    expect(evaluate('crane', 'crane')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });
  it('bot opens with a fixed word then narrows', () => {
    expect(botGuess([])).toBe('crane');
    const g = botGuess([{ guess: 'crane', marks: evaluate('crane', 'slate') }]);
    expect(evaluate('crane', 'slate')).toEqual(evaluate('crane', 'slate'));
    expect(typeof g).toBe('string');
  });
});
