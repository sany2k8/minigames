import type { Rng } from '../../engine/rng';

/** A card: rank 0..12 (A=0, J=10, Q=11, K=12), suit 0..3 (♠♥♦♣). */
export interface Card {
  rank: number;
  suit: number;
}

export interface Deal {
  /** 17 piles of 3, dealt face up. Top of pile = last element. */
  piles: Card[][];
  /** The card currently in the black hole; legal plays are adjacent to it. */
  hole: Card;
}

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['♠', '♥', '♦', '♣'];
export const isRed = (suit: number) => suit === 1 || suit === 2;

/** Cyclic rank adjacency: A wraps to both K and 2 (classic Black Hole rule). */
export function adjacent(a: number, b: number): boolean {
  const d = Math.abs(a - b);
  return d === 1 || d === 12;
}

export const cardKey = (c: Card) => c.rank * 4 + c.suit;

/** Deterministically deal 51 cards into 17 piles of 3; A♠ seeds the black hole. */
export function deal(rng: Rng): Deal {
  const deck: Card[] = [];
  for (let rank = 0; rank < 13; rank++) {
    for (let suit = 0; suit < 4; suit++) deck.push({ rank, suit });
  }
  const rest = deck.filter((c) => !(c.rank === 0 && c.suit === 0));
  const shuffled = rng.shuffle(rest);
  const piles: Card[][] = [];
  for (let i = 0; i < 17; i++) piles.push(shuffled.slice(i * 3, i * 3 + 3));
  return { piles, hole: { rank: 0, suit: 0 } };
}

/** Indices of piles whose top card can be played onto `hole`. */
export function playablePiles(piles: Card[][], hole: Card): number[] {
  const out: number[] = [];
  for (let i = 0; i < piles.length; i++) {
    const top = piles[i][piles[i].length - 1];
    if (top && adjacent(top.rank, hole.rank)) out.push(i);
  }
  return out;
}

export const cardsLeft = (piles: Card[][]) => piles.reduce((n, p) => n + p.length, 0);
export const isCleared = (piles: Card[][]) => piles.every((p) => p.length === 0);

/**
 * A best play sequence (pile indices, in order). Depth-first search that tries
 * to FULLY clear the board, ordering moves by a one-ply "keep options open"
 * heuristic so a full solution is found fast, with a node budget and a
 * dead-state memo to stay bounded. Falls back to the best partial it found.
 * Deterministic; used to drive the bot and gauge a strong target score.
 */
export function bestSequence(start: Deal): number[] {
  const BUDGET = 120000;
  // piles of cardKeys for cheap serialization; rank = key >> 2.
  const piles = start.piles.map((p) => p.map(cardKey));
  const n = piles.length;
  const failed = new Set<string>();
  let best: number[] = [];
  let nodes = 0;

  const rankOf = (key: number) => key >> 2;
  const serialize = (holeRank: number) => piles.map((p) => p.join(',')).join('|') + '#' + holeRank;

  const options = (holeRank: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const p = piles[i];
      if (p.length && adjacent(rankOf(p[p.length - 1]), holeRank)) out.push(i);
    }
    return out;
  };

  const dfs = (holeRank: number, acc: number[]): boolean => {
    if (piles.every((p) => p.length === 0)) {
      best = acc.slice();
      return true;
    }
    if (++nodes > BUDGET) return false;
    const key = serialize(holeRank);
    if (failed.has(key)) return false;

    const opts = options(holeRank);
    if (opts.length === 0) {
      if (acc.length > best.length) best = acc.slice();
      failed.add(key);
      return false;
    }
    // Order by follow-up count so promising lines (and full solutions) come first.
    opts.sort((a, b) => {
      const ra = rankOf(piles[a][piles[a].length - 1]);
      const rb = rankOf(piles[b][piles[b].length - 1]);
      const fa = piles.reduce((s, p, j) => s + (p.length && j !== a && adjacent(rankOf(p[p.length - 1]), ra) ? 1 : 0), 0);
      const fb = piles.reduce((s, p, j) => s + (p.length && j !== b && adjacent(rankOf(p[p.length - 1]), rb) ? 1 : 0), 0);
      return fb - fa;
    });

    for (const i of opts) {
      const card = piles[i].pop()!;
      acc.push(i);
      if (dfs(rankOf(card), acc)) return true;
      acc.pop();
      piles[i].push(card);
      if (nodes > BUDGET) break;
    }
    if (acc.length > best.length) best = acc.slice();
    failed.add(key);
    return false;
  };

  dfs(start.hole.rank, []);
  return best;
}

/** Cards the heuristic can clear from a deal (for scoring / bot targets). */
export const bestClearCount = (start: Deal) => bestSequence(start).length;
