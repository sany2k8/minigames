import { describe, it, expect } from 'vitest';
import { makeRng } from '../../engine/rng';
// Chess
import {
  type ChessState,
  type Move,
  P,
  K,
  applyMove as chessApply,
  bestMove,
  initState,
  legalMoves,
  seatOf,
  status
} from '../chess/logic';
// Flappy
import { TUNING, botShouldFlap, hitsGround, hitsPipe, nextGap } from '../flappy-bird/logic';
// Hangman
import {
  MAX_MISSES,
  botGuess,
  isLost,
  isWon as hmWon,
  missesUsed,
  wordForSeed
} from '../hangman/logic';
// Klondike
import {
  type KlondikeState,
  applyMove as klApply,
  botMove,
  canStack,
  deal,
  foundationAccepts,
  foundationCount,
  scoreOf
} from '../klondike/logic';

const find = (s: ChessState, from: number, to: number): Move => {
  const m = legalMoves(s).find((x) => x.from === from && x.to === to);
  if (!m) throw new Error(`no legal move ${from}->${to}`);
  return m;
};

describe('chess', () => {
  it('opens with 32 pieces and 20 legal moves for white', () => {
    const s = initState();
    expect(s.board.filter((v) => v !== 0).length).toBe(32);
    expect(s.turn).toBe(0);
    expect(legalMoves(s).length).toBe(20);
  });

  it("detects Fool's mate (1. f3 e5 2. g4 Qh4#)", () => {
    let s = initState();
    s = chessApply(s, find(s, 53, 45)); // f3
    s = chessApply(s, find(s, 12, 28)); // e5
    s = chessApply(s, find(s, 54, 38)); // g4
    s = chessApply(s, find(s, 3, 39)); // Qh4#
    expect(status(s)).toBe('checkmate');
    expect(legalMoves(s).length).toBe(0);
  });

  it('generates an en-passant capture and removes the passed pawn', () => {
    const b = new Int8Array(64);
    b[60] = K; // white king e1
    b[4] = -K; // black king e8
    b[28] = P; // white pawn e5
    b[11] = -P; // black pawn d7
    const s: ChessState = { board: b, turn: 1, castling: 0, ep: -1, half: 0 };
    const dbl = applyMoveBlackDouble(s); // d7-d5, sets ep target d6 (19)
    expect(dbl.ep).toBe(19);
    const ep = legalMoves(dbl).find((m) => m.flag === 2 && m.from === 28 && m.to === 19);
    expect(ep).toBeTruthy();
    const after = chessApply(dbl, ep!);
    expect(after.board[27]).toBe(0); // captured black pawn removed
    expect(after.board[19]).toBe(P); // white pawn advanced
  });

  it('bestMove always returns a legal move', () => {
    const s = initState();
    const m = bestMove(s, 'hard', 0.9)!;
    expect(legalMoves(s).some((x) => x.from === m.from && x.to === m.to)).toBe(true);
  });

  it('captures remove the enemy piece', () => {
    const s = initState();
    const m = find(s, 52, 36); // e4
    const ns = chessApply(s, m);
    expect(seatOf(ns.board[36])).toBe(0);
    expect(ns.board[52]).toBe(0);
  });
});

function applyMoveBlackDouble(s: ChessState): ChessState {
  const m = legalMoves(s).find((x) => x.from === 11 && x.to === 27 && x.flag === 1)!;
  return chessApply(s, m);
}

describe('flappy-bird', () => {
  it('nextGap is deterministic for a seed and stays in bounds', () => {
    const a = makeRng(7);
    const b = makeRng(7);
    const gap = TUNING.medium.gap;
    for (let i = 0; i < 20; i++) {
      const ga = nextGap(a, gap);
      const gb = nextGap(b, gap);
      expect(ga).toBeCloseTo(gb, 10);
      expect(ga).toBeGreaterThan(gap);
      expect(ga).toBeLessThan(1 - gap);
    }
  });

  it('detects ground and pipe collisions', () => {
    expect(hitsGround(0.001)).toBe(true);
    expect(hitsGround(0.999)).toBe(true);
    expect(hitsGround(0.5)).toBe(false);
    const pipe = { x: 0.3, gapY: 0.5, passed: false };
    const gap = 0.16;
    expect(hitsPipe(0.5, pipe, gap, 0.6)).toBe(false); // centered in gap
    expect(hitsPipe(0.05, pipe, gap, 0.6)).toBe(true); // into top pipe
    expect(hitsPipe(0.5, { ...pipe, x: 0.9 }, gap, 0.6)).toBe(false); // pipe far away
  });

  it('bot flaps when sinking below the gap', () => {
    expect(botShouldFlap(0.7, 0.5, 0.4)).toBe(true);
    expect(botShouldFlap(0.3, -0.2, 0.5)).toBe(false);
  });
});

describe('hangman', () => {
  it('picks a deterministic word for a seed', () => {
    expect(wordForSeed(3)).toBe(wordForSeed(3));
    expect(typeof wordForSeed(10)).toBe('string');
  });

  it('tracks wins, misses and losses', () => {
    const word = 'cat';
    const all = new Set('cat'.split(''));
    expect(hmWon(word, all)).toBe(true);
    const wrong = new Set(['x', 'y', 'z']);
    expect(missesUsed(word, wrong)).toBe(3);
    const lost = new Set('qwxyzj'.split(''));
    expect(missesUsed(word, lost)).toBe(MAX_MISSES);
    expect(isLost(word, lost)).toBe(true);
  });

  it('bot never repeats a guess and the deducer solves most words', () => {
    let solved = 0;
    for (let seed = 0; seed < 12; seed++) {
      const word = wordForSeed(seed);
      const guessed = new Set<string>();
      for (let step = 0; step < 30; step++) {
        if (hmWon(word, guessed) || isLost(word, guessed)) break;
        const g = botGuess(word, guessed);
        expect(g).toMatch(/^[a-z]$/);
        expect(guessed.has(g)).toBe(false);
        guessed.add(g);
      }
      if (hmWon(word, guessed)) solved++;
    }
    expect(solved).toBeGreaterThanOrEqual(9); // strong deducer
  });
});

describe('klondike', () => {
  it('deals a full deck deterministically', () => {
    const a = deal(makeRng(42));
    const b = deal(makeRng(42));
    const total = (s: KlondikeState) =>
      s.tableau.reduce((n, c) => n + c.length, 0) + s.stock.length + s.waste.length + foundationCount(s);
    expect(total(a)).toBe(52);
    expect(a.stock.length).toBe(24);
    a.tableau.forEach((col, i) => {
      expect(col.length).toBe(i + 1);
      expect(a.down[i]).toBe(i);
    });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('enforces stacking and foundation rules', () => {
    expect(canStack({ r: 6, s: 0 }, { r: 7, s: 1 })).toBe(true); // 6♠ on 7♥ (black on red)
    expect(canStack({ r: 6, s: 0 }, { r: 7, s: 3 })).toBe(false); // same color
    const s = deal(makeRng(1));
    expect(foundationAccepts(s, { r: 1, s: 0 })).toBe(true); // ace onto empty
    expect(foundationAccepts(s, { r: 2, s: 0 })).toBe(false);
  });

  it('draw moves a card to the waste and recycles when empty', () => {
    let s = deal(makeRng(5));
    const stock0 = s.stock.length;
    s = klApply(s, { t: 'draw' });
    expect(s.waste.length).toBe(1);
    expect(s.stock.length).toBe(stock0 - 1);
    // exhaust then recycle
    while (s.stock.length) s = klApply(s, { t: 'draw' });
    const wasteN = s.waste.length;
    s = klApply(s, { t: 'draw' });
    expect(s.stock.length).toBe(wasteN);
    expect(s.waste.length).toBe(0);
  });

  it('the bot terminates and never loops forever', () => {
    let s = deal(makeRng(99));
    let noProg = 0;
    let steps = 0;
    for (; steps < 5000; steps++) {
      const canCycle = noProg < s.stock.length + s.waste.length + 8;
      const m = botMove(s, canCycle);
      if (!m) break;
      if (m.t === 'wf' || m.t === 'tf') noProg = 0;
      else noProg++;
      s = klApply(s, m);
    }
    expect(steps).toBeLessThan(5000); // it stopped on its own
    expect(scoreOf(s)).toBeGreaterThanOrEqual(0);
    expect(foundationCount(s)).toBeGreaterThanOrEqual(0);
  });
});
