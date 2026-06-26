import type { Rng } from '../../engine/rng';

export interface Card {
  r: number; // 1=A .. 13=K
  s: number; // 0-3 suit
}

export const COLUMNS = 7;
export const COL_HEIGHT = 5;
export const SUITS = ['♠', '♥', '♦', '♣'];
export const isRed = (s: number) => s === 1 || s === 2;

export const rankLabel = (r: number) => (['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][r]);

export interface GolfState {
  columns: Card[][];
  stock: Card[];
  waste: Card[];
}

export function deal(rng: Rng): GolfState {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
  const shuffled = rng.shuffle(deck);
  const columns: Card[][] = [];
  let k = 0;
  for (let c = 0; c < COLUMNS; c++) columns.push(shuffled.slice(k, (k += COL_HEIGHT)));
  const rest = shuffled.slice(k);
  const waste = [rest.pop()!]; // flip one to start
  return { columns, stock: rest, waste };
}

const wasteTop = (st: GolfState) => st.waste[st.waste.length - 1];

/** No-wrap: a card plays if its rank is exactly 1 above or below the waste top. */
export function canPlay(card: Card, st: GolfState): boolean {
  const top = wasteTop(st);
  if (!top) return false;
  return Math.abs(card.r - top.r) === 1;
}

export function playableColumns(st: GolfState): number[] {
  const out: number[] = [];
  st.columns.forEach((col, i) => {
    const card = col[col.length - 1];
    if (card && canPlay(card, st)) out.push(i);
  });
  return out;
}

export function playColumn(st: GolfState, col: number): GolfState {
  const card = st.columns[col][st.columns[col].length - 1];
  if (!card || !canPlay(card, st)) return st;
  const columns = st.columns.map((c, i) => (i === col ? c.slice(0, -1) : c));
  return { columns, stock: st.stock, waste: [...st.waste, card] };
}

export function draw(st: GolfState): GolfState {
  if (st.stock.length === 0) return st;
  const stock = st.stock.slice();
  const card = stock.pop()!;
  return { columns: st.columns, stock, waste: [...st.waste, card] };
}

export const cardsLeft = (st: GolfState) => st.columns.reduce((n, c) => n + c.length, 0);
export const isWon = (st: GolfState) => cardsLeft(st) === 0;
export const isStuck = (st: GolfState) => st.stock.length === 0 && playableColumns(st).length === 0;

export function scoreOf(st: GolfState): number {
  const cleared = COLUMNS * COL_HEIGHT - cardsLeft(st);
  return cleared * 100 + (isWon(st) ? 2000 + st.stock.length * 20 : 0);
}
