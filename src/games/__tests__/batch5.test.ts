import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
import * as bd from '../blockudoku/logic';
import * as ms from '../minesweeper/logic';
import * as mj from '../mahjong-mini/logic';
import * as gm from '../goods-match/logic';
import * as hx from '../hexa-sort/logic';
import * as sj from '../screw-jam/logic';
import { aligned } from '../helix-jump/logic';
import { canEat } from '../eat-grow/logic';
import * as tw from '../tower-war/logic';

describe('blockudoku', () => {
  it('clears a completed row', () => {
    const g: bd.Grid = Array(81).fill(0);
    for (let c = 1; c < 9; c++) g[bd.idx(0, c)] = 1; // row 0 missing one cell
    const res = bd.place(g, { id: 1, cells: [[0, 0]], color: 2 }, 0, 0);
    expect(res.cleared).toBe(1);
    expect(res.grid.slice(0, 9).every((v) => v === 0)).toBe(true);
  });
});

describe('minesweeper', () => {
  it('places the right number of mines and flood-reveals zeros', () => {
    const cfg = ms.mineConfig('easy');
    const b = ms.generate(makeRng(1), cfg);
    expect(b.mine.filter(Boolean).length).toBe(cfg.mines);
    const safe = b.mine.findIndex((m) => !m);
    expect(ms.reveal(b, new Set(), safe).size).toBeGreaterThan(0);
  });
});

describe('mahjong mini', () => {
  it('generates an even board with matchable faces', () => {
    const tiles = mj.generate(makeRng(2));
    expect(tiles.length % 2).toBe(0);
    expect(mj.freeTiles(tiles, new Set()).length).toBeGreaterThan(0);
  });
});

describe('goods match', () => {
  it('clears when three of a kind land in the tray', () => {
    let tray: number[] = [];
    tray = gm.addToTray(tray, 0).tray;
    tray = gm.addToTray(tray, 0).tray;
    const res = gm.addToTray(tray, 0);
    expect(res.cleared).toBe(true);
    expect(res.tray.filter((x) => x === 0).length).toBe(0);
  });
});

describe('hexa sort', () => {
  it('merges same-color neighbours and pops at capacity', () => {
    const board = hx.emptyBoard();
    const a = hx.neighbors(0)[0];
    board[a] = { color: 1, height: hx.CAP - 2 };
    const res = hx.place(board, 0, { color: 1, height: 5 });
    expect(res.popped).toBe(hx.CAP + 3);
  });
});

describe('screw jam', () => {
  it('locks a box to a color and clears it at capacity', () => {
    let boxes = sj.emptyBoxes();
    boxes = sj.placeScrew(boxes, 2).boxes;
    boxes = sj.placeScrew(boxes, 2).boxes;
    const res = sj.placeScrew(boxes, 2);
    expect(res.cleared).toBe(true);
  });
});

describe('helix jump', () => {
  it('detects gap alignment with rotation', () => {
    expect(aligned(0.5, 0.3, 0)).toBe(true); // gap at center
    expect(aligned(0.0, 0.2, 0)).toBe(false); // gap far from center
  });
});

describe('eat & grow', () => {
  it('only swallows objects no larger than the hole', () => {
    expect(canEat(20, 18)).toBe(true);
    expect(canEat(20, 25)).toBe(false);
  });
});

describe('tower war', () => {
  it('lays out start towers and finds a bot plan', () => {
    const nodes = tw.layout(makeRng(4), 2);
    expect(nodes.some((n) => n.owner === 0)).toBe(true);
    expect(nodes.some((n) => n.owner === 1)).toBe(true);
    expect(tw.winner(nodes)).toBeNull();
  });
});
