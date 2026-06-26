import type { Rng } from '../../engine/rng';

/**
 * Standard Klondike (draw-1) solitaire rules. Pure & deterministic — the deck is
 * shuffled from a seeded Rng. The bot is a *terminating* greedy player: it only
 * ever returns foundation moves, face-down-exposing moves, or (while cycling is
 * still allowed) a waste play / stock draw, so it can never loop forever.
 *
 * Suits: 0 ♠, 1 ♥, 2 ♦, 3 ♣ (red = 1,2). Ranks 1=A … 13=K.
 */
export interface Card {
  r: number;
  s: number;
}

export interface KlondikeState {
  tableau: Card[][]; // 7 columns
  down: number[]; // face-down count at the START of each column
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // indexed by suit
}

export type Move =
  | { t: 'draw' }
  | { t: 'wf' } // waste top -> its foundation
  | { t: 'wt'; to: number } // waste top -> tableau column
  | { t: 'tf'; from: number } // tableau column top -> its foundation
  | { t: 'tt'; from: number; idx: number; to: number }; // tableau run -> tableau column

export const SUITS = ['♠', '♥', '♦', '♣'];
export const isRed = (s: number) => s === 1 || s === 2;
export const rankLabel = (r: number) => ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][r];

export function deal(rng: Rng): KlondikeState {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
  const d = rng.shuffle(deck);
  const tableau: Card[][] = [];
  const down: number[] = [];
  let k = 0;
  for (let c = 0; c < 7; c++) {
    tableau.push(d.slice(k, k + c + 1));
    down.push(c); // top card face up, the rest face down
    k += c + 1;
  }
  return { tableau, down, stock: d.slice(k), waste: [], foundations: [[], [], [], []] };
}

const clone = (s: KlondikeState): KlondikeState => ({
  tableau: s.tableau.map((c) => c.slice()),
  down: s.down.slice(),
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  foundations: s.foundations.map((c) => c.slice())
});

const top = <T>(a: T[]): T | undefined => a[a.length - 1];

export const canStack = (card: Card, onto: Card) => onto.r === card.r + 1 && isRed(onto.s) !== isRed(card.s);

/** Cards form a valid movable run: descending rank, alternating color. */
export function validRun(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) if (!canStack(cards[i + 1], cards[i])) return false;
  return true;
}

/** Can the face-up run starting at (col, idx) be picked up? */
export function selectableRun(s: KlondikeState, col: number, idx: number): boolean {
  if (idx < s.down[col] || idx >= s.tableau[col].length) return false;
  return validRun(s.tableau[col].slice(idx));
}

export function foundationAccepts(s: KlondikeState, card: Card): boolean {
  const pile = s.foundations[card.s];
  return pile.length === 0 ? card.r === 1 : top(pile)!.r === card.r - 1;
}

export function tableauAccepts(s: KlondikeState, run: Card[], to: number): boolean {
  if (run.length === 0) return false;
  const col = s.tableau[to];
  if (col.length === 0) return run[0].r === 13; // only a King to an empty column
  return canStack(run[0], top(col)!);
}

export function canApply(s: KlondikeState, m: Move): boolean {
  switch (m.t) {
    case 'draw':
      return s.stock.length > 0 || s.waste.length > 0;
    case 'wf': {
      const c = top(s.waste);
      return !!c && foundationAccepts(s, c);
    }
    case 'wt': {
      const c = top(s.waste);
      return !!c && tableauAccepts(s, [c], m.to);
    }
    case 'tf': {
      const c = top(s.tableau[m.from]);
      return !!c && s.down[m.from] <= s.tableau[m.from].length - 1 && foundationAccepts(s, c);
    }
    case 'tt': {
      if (m.from === m.to || !selectableRun(s, m.from, m.idx)) return false;
      return tableauAccepts(s, s.tableau[m.from].slice(m.idx), m.to);
    }
  }
}

/** Flip the newly-exposed top card of a column if it is face down. */
function flip(s: KlondikeState, col: number) {
  const len = s.tableau[col].length;
  if (len > 0 && s.down[col] > len - 1) s.down[col] = len - 1;
}

export function applyMove(s: KlondikeState, m: Move): KlondikeState {
  if (!canApply(s, m)) return s;
  const n = clone(s);
  switch (m.t) {
    case 'draw':
      if (n.stock.length === 0) {
        n.stock = n.waste.reverse();
        n.waste = [];
      } else {
        n.waste.push(n.stock.pop()!);
      }
      break;
    case 'wf': {
      const c = n.waste.pop()!;
      n.foundations[c.s].push(c);
      break;
    }
    case 'wt': {
      const c = n.waste.pop()!;
      n.tableau[m.to].push(c);
      break;
    }
    case 'tf': {
      const c = n.tableau[m.from].pop()!;
      n.foundations[c.s].push(c);
      flip(n, m.from);
      break;
    }
    case 'tt': {
      const run = n.tableau[m.from].splice(m.idx);
      n.tableau[m.to].push(...run);
      flip(n, m.from);
      break;
    }
  }
  return n;
}

export const foundationCount = (s: KlondikeState) => s.foundations.reduce((a, p) => a + p.length, 0);
export const isWon = (s: KlondikeState) => foundationCount(s) === 52;

export function scoreOf(s: KlondikeState): number {
  const exposed = s.tableau.reduce((a, col, i) => a + (col.length - s.down[i]), 0);
  return foundationCount(s) * 100 + exposed * 5 + (isWon(s) ? 3000 : 0);
}

/** Does a tableau→tableau move expose a face-down card (real board progress)? */
const exposes = (s: KlondikeState, from: number, idx: number) => idx === s.down[from] && s.down[from] > 0;

/**
 * Greedy bot move. `canCycle` is supplied by the caller and goes false once the
 * bot has churned the stock without progress — at which point it stops drawing
 * and returns null (stuck). This guarantees termination.
 */
export function botMove(s: KlondikeState, canCycle: boolean): Move | null {
  // 1) foundation moves (always progress) — prefer the lowest rank available
  const found: Move[] = [];
  if (canApply(s, { t: 'wf' })) found.push({ t: 'wf' });
  for (let c = 0; c < 7; c++) if (canApply(s, { t: 'tf', from: c })) found.push({ t: 'tf', from: c });
  if (found.length) {
    found.sort((a, b) => rankOfFoundationMove(s, a) - rankOfFoundationMove(s, b));
    // hold back high cards that might still be needed in the tableau, unless they free a card
    const safe = found.find((m) => rankOfFoundationMove(s, m) <= 2) ?? found[0];
    return safe;
  }
  // 2) a tableau move that exposes a face-down card
  for (let from = 0; from < 7; from++) {
    const idx = s.down[from];
    if (!exposes(s, from, idx) || !selectableRun(s, from, idx)) continue;
    for (let to = 0; to < 7; to++) if (to !== from && canApply(s, { t: 'tt', from, idx, to })) return { t: 'tt', from, idx, to };
  }
  if (canCycle) {
    // 3) develop the waste onto the tableau
    for (let to = 0; to < 7; to++) if (canApply(s, { t: 'wt', to })) return { t: 'wt', to };
    // 4) draw / recycle
    if (canApply(s, { t: 'draw' })) return { t: 'draw' };
  }
  return null;
}

const rankOfFoundationMove = (s: KlondikeState, m: Move): number =>
  m.t === 'wf' ? top(s.waste)!.r : m.t === 'tf' ? top(s.tableau[m.from])!.r : 99;
