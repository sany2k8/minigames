import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as fl from '../flood-it/logic';
import * as ng from '../nonogram/logic';
import * as pg from '../peg-solitaire/logic';
import * as bs from '../battleship/logic';
import { makeSequence } from '../simon-says/logic';
import { schedule, DURATION_MS } from '../whack-a-mole/logic';

describe('flood-it', () => {
  it('flood from the corner absorbs the matching region', () => {
    // 3x3: the connected top-left 0-region is {0,1,3}; recolor it to 1
    const grid = [0, 0, 1, 0, 1, 1, 2, 2, 2];
    const out = fl.flood(grid, 3, 1);
    expect(out).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2]);
  });
  it('greedy bot eventually solves a small board', () => {
    const cfg = { n: 6, colors: 4, moves: 999 };
    let grid = fl.generate(makeRng(2), cfg);
    let guard = 0;
    while (!fl.isSolved(grid) && guard++ < 200) grid = fl.flood(grid, cfg.n, fl.botColor(grid, cfg.n, cfg.colors));
    expect(fl.isSolved(grid)).toBe(true);
  });
});

describe('nonogram', () => {
  it('computes run clues from the solution', () => {
    const sol = ng.solutionFor(0);
    // clue runs should be non-empty arrays for each row
    for (let r = 0; r < ng.N; r++) expect(ng.rowClue(sol, r).length).toBeGreaterThan(0);
  });
  it('is solved when filled cells match the solution', () => {
    const sol = ng.solutionFor(1);
    const state = sol.map((v) => (v ? 1 : 0));
    expect(ng.isSolved(state, sol)).toBe(true);
    state[0] = state[0] === 1 ? 0 : 1;
    expect(ng.isSolved(state, sol)).toBe(false);
  });
});

describe('peg solitaire', () => {
  it('starts with 32 pegs and a legal jump removes exactly one', () => {
    const b = pg.initBoard();
    expect(pg.pegsLeft(b)).toBe(32);
    const moves = pg.legalMoves(b);
    expect(moves.length).toBeGreaterThan(0);
    const nb = pg.applyMove(b, moves[0]);
    expect(pg.pegsLeft(nb)).toBe(31);
  });
});

describe('battleship', () => {
  it('places the full fleet without overlap', () => {
    const ships = bs.placeFleet(makeRng(5));
    expect(ships.map((s) => s.length).sort()).toEqual([2, 3, 3, 4, 5]);
    const all = new Set(ships.flat());
    expect(all.size).toBe(17); // no overlaps
  });
  it('detects when the whole fleet is sunk', () => {
    const ships = bs.placeFleet(makeRng(6));
    const shots = new Set(ships.flat());
    expect(bs.allSunk(ships, shots)).toBe(true);
  });
});

describe('simon says', () => {
  it('produces a deterministic sequence for a seed', () => {
    expect(makeSequence(makeRng(7), 10)).toEqual(makeSequence(makeRng(7), 10));
  });
});

describe('whack-a-mole', () => {
  it('schedules spawns within the round duration', () => {
    const plan = schedule(makeRng(3), 'medium');
    expect(plan.length).toBeGreaterThan(10);
    expect(plan.every((s) => s.t > 0 && s.t < DURATION_MS)).toBe(true);
    expect(plan.every((s) => s.hole >= 0 && s.hole < 9)).toBe(true);
  });
});
