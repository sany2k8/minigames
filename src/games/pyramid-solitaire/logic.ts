import type { Rng } from '../../engine/rng';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const isRed = (suit: number) => suit === 1 || suit === 2;

export interface Card { id: number; rank: number; suit: number } // rank 1..13

export const PYRAMID_SIZE = 28; // rows 0..6 → 1+2+...+7
export const ROWS = 7;
const tri = (n: number) => (n * (n + 1)) / 2;

/** Row/col of a pyramid index. */
export function rowCol(idx: number): [number, number] {
  let r = 0;
  while (tri(r + 1) <= idx) r++;
  return [r, idx - tri(r)];
}

/** The two pyramid indices directly covering `idx` (empty for the bottom row). */
export function children(idx: number): number[] {
  const [r, c] = rowCol(idx);
  if (r >= ROWS - 1) return [];
  const base = tri(r + 1);
  return [base + c, base + c + 1];
}

export interface PyramidState {
  pyramid: Card[]; // 28 cards, fixed positions
  removed: Set<number>; // removed pyramid indices
  stock: Card[]; // face-down draw pile
  waste: Card[]; // drawn cards, top = last
  stockPass: number; // how many times the stock has been recycled
}

export function deal(rng: Rng): PyramidState {
  const deck: Card[] = [];
  let id = 0;
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: id++, rank: r, suit: s });
  const shuffled = rng.shuffle(deck);
  return {
    pyramid: shuffled.slice(0, PYRAMID_SIZE),
    removed: new Set(),
    stock: shuffled.slice(PYRAMID_SIZE),
    waste: [],
    stockPass: 0
  };
}

/** A pyramid card is free when both of its children have been removed. */
export function isExposed(st: PyramidState, idx: number): boolean {
  if (st.removed.has(idx)) return false;
  return children(idx).every((c) => st.removed.has(c));
}

export const wasteTop = (st: PyramidState): Card | undefined => st.waste[st.waste.length - 1];

export const isCleared = (st: PyramidState): boolean => st.removed.size === PYRAMID_SIZE;

export const removedCount = (st: PyramidState): number => st.removed.size;

/** Draw the next stock card to the waste (recycles once exhausted). */
export function draw(st: PyramidState): PyramidState {
  if (st.stock.length === 0) {
    if (st.waste.length === 0) return st;
    return { ...st, stock: [...st.waste].reverse(), waste: [], stockPass: st.stockPass + 1 };
  }
  const stock = st.stock.slice();
  const card = stock.pop()!;
  return { ...st, stock, waste: [...st.waste, card] };
}

/** Remove a lone King (13) from the pyramid or waste. */
export function removeKing(st: PyramidState, src: { where: 'pyr'; idx: number } | { where: 'waste' }): PyramidState | null {
  if (src.where === 'pyr') {
    if (!isExposed(st, src.idx) || st.pyramid[src.idx].rank !== 13) return null;
    const removed = new Set(st.removed);
    removed.add(src.idx);
    return { ...st, removed };
  }
  const top = wasteTop(st);
  if (!top || top.rank !== 13) return null;
  return { ...st, waste: st.waste.slice(0, -1) };
}

type Pick = { where: 'pyr'; idx: number } | { where: 'waste' };

const cardOf = (st: PyramidState, p: Pick): Card | undefined =>
  p.where === 'pyr' ? st.pyramid[p.idx] : wasteTop(st);

const available = (st: PyramidState, p: Pick): boolean =>
  p.where === 'pyr' ? isExposed(st, p.idx) : !!wasteTop(st);

/** Remove a pair of available cards that sum to 13. Returns null if illegal. */
export function removePair(st: PyramidState, a: Pick, b: Pick): PyramidState | null {
  const ca = cardOf(st, a);
  const cb = cardOf(st, b);
  if (!ca || !cb) return null;
  if (!available(st, a) || !available(st, b)) return null;
  if (a.where === 'pyr' && b.where === 'pyr' && a.idx === b.idx) return null;
  if (ca.rank + cb.rank !== 13) return null;
  let next = { ...st, removed: new Set(st.removed), waste: st.waste.slice() };
  const apply = (p: Pick) => {
    if (p.where === 'pyr') next.removed.add(p.idx);
    else next.waste = next.waste.slice(0, -1);
  };
  // remove waste first so popping order is stable
  if (a.where === 'waste') { apply(a); apply(b); }
  else { apply(b); apply(a); }
  return next;
}

/** Greedy bot move: clear a King, else a 13-pair, else draw, else give up. */
export type BotAction =
  | { t: 'king'; src: Pick }
  | { t: 'pair'; a: Pick; b: Pick }
  | { t: 'draw' }
  | { t: 'stuck' };

export function botAction(st: PyramidState): BotAction {
  const picks: Pick[] = [];
  for (let i = 0; i < PYRAMID_SIZE; i++) if (isExposed(st, i)) picks.push({ where: 'pyr', idx: i });
  if (wasteTop(st)) picks.push({ where: 'waste' });

  for (const p of picks) if (cardOf(st, p)!.rank === 13) return { t: 'king', src: p };
  for (let i = 0; i < picks.length; i++)
    for (let j = i + 1; j < picks.length; j++)
      if (cardOf(st, picks[i])!.rank + cardOf(st, picks[j])!.rank === 13)
        return { t: 'pair', a: picks[i], b: picks[j] };

  if (st.stock.length > 0 || (st.waste.length > 0 && st.stockPass < 2)) return { t: 'draw' };
  return { t: 'stuck' };
}
