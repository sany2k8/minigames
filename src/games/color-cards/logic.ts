import type { Rng } from '../../engine/rng';

export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardKind = number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: number;
  color: CardColor;
  kind: CardKind;
}

export interface CCState {
  hands: Card[][];
  drawPile: Card[];
  discard: Card[];
  current: number; // index into players (turn position)
  dir: 1 | -1;
  activeColor: CardColor; // resolved color (wild -> chosen)
  numPlayers: number;
  winner: number | null;
  awaitingColor: boolean; // a wild was just played by current; pick color
  message: string;
}

let uid = 1;
const card = (color: CardColor, kind: CardKind): Card => ({ id: uid++, color, kind });

export function buildDeck(rng: Rng): Card[] {
  const colors: CardColor[] = ['red', 'yellow', 'green', 'blue'];
  const deck: Card[] = [];
  for (const c of colors) {
    deck.push(card(c, 0));
    for (let n = 1; n <= 9; n++) {
      deck.push(card(c, n));
      deck.push(card(c, n));
    }
    deck.push(card(c, 'skip'), card(c, 'skip'));
    deck.push(card(c, 'reverse'), card(c, 'reverse'));
    deck.push(card(c, 'draw2'), card(c, 'draw2'));
  }
  for (let i = 0; i < 4; i++) {
    deck.push(card('wild', 'wild'));
    deck.push(card('wild', 'wild4'));
  }
  return rng.shuffle(deck);
}

export function deal(rng: Rng, numPlayers: number): CCState {
  const deck = buildDeck(rng);
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let r = 0; r < 7; r++) {
    for (let p = 0; p < numPlayers; p++) hands[p].push(deck.pop()!);
  }
  // first non-wild, non-action card starts the discard
  let first = deck.pop()!;
  while (first.color === 'wild') {
    deck.unshift(first);
    first = deck.pop()!;
  }
  return {
    hands,
    drawPile: deck,
    discard: [first],
    current: 0,
    dir: 1,
    activeColor: first.color,
    numPlayers,
    winner: null,
    awaitingColor: false,
    message: ''
  };
}

export const top = (s: CCState) => s.discard[s.discard.length - 1];

export function canPlay(c: Card, s: CCState): boolean {
  if (c.color === 'wild') return true;
  const t = top(s);
  if (c.color === s.activeColor) return true;
  if (typeof c.kind === 'number' && c.kind === t.kind) return true;
  if (typeof c.kind === 'string' && c.kind === t.kind) return true;
  return false;
}

export const playableCards = (s: CCState, seat: number) =>
  s.hands[seat].filter((c) => canPlay(c, s));

const nextIdx = (s: CCState, from = s.current, steps = 1) => {
  let i = from;
  for (let k = 0; k < steps; k++) i = (i + s.dir + s.numPlayers) % s.numPlayers;
  return i;
};

function drawFrom(s: CCState, seat: number, n: number, rng: Rng) {
  for (let i = 0; i < n; i++) {
    if (s.drawPile.length === 0) {
      // reshuffle discard (keep top)
      const t = s.discard.pop()!;
      s.drawPile = rng.shuffle(s.discard);
      s.discard = [t];
    }
    const c = s.drawPile.pop();
    if (c) s.hands[seat].push(c);
  }
}

/** Play a card from the current player's hand. Returns a new state. */
export function playCard(prev: CCState, cardId: number, rng: Rng): CCState {
  const s: CCState = structuredCloneState(prev);
  const seat = s.current;
  const idx = s.hands[seat].findIndex((c) => c.id === cardId);
  if (idx < 0) return prev;
  const c = s.hands[seat][idx];
  if (!canPlay(c, s)) return prev;

  s.hands[seat].splice(idx, 1);
  s.discard.push(c);
  if (c.color !== 'wild') s.activeColor = c.color;

  if (s.hands[seat].length === 0) {
    s.winner = seat;
    s.message = 'Wins!';
    return s;
  }

  // wilds wait for color choice before advancing
  if (c.color === 'wild') {
    s.awaitingColor = true;
    if (c.kind === 'wild4') {
      // mark to draw 4 to next after color chosen — store via message flag
      s.message = '__wild4';
    } else {
      s.message = '__wild';
    }
    return s;
  }

  applyEffectAndAdvance(s, c, rng);
  return s;
}

/** Resolve a wild's chosen color (and apply +4 if needed), then advance. */
export function chooseColor(prev: CCState, color: CardColor, rng: Rng): CCState {
  const s = structuredCloneState(prev);
  s.activeColor = color;
  s.awaitingColor = false;
  const wasWild4 = s.message === '__wild4';
  s.message = '';
  if (wasWild4) {
    const victim = nextIdx(s);
    drawFrom(s, victim, 4, rng);
    s.current = nextIdx(s, s.current, 2); // skip victim
  } else {
    s.current = nextIdx(s);
  }
  return s;
}

/** Current player draws one; if it's playable they may still choose to play. */
export function drawTurn(prev: CCState, rng: Rng): { state: CCState; drawn: Card | null } {
  const s = structuredCloneState(prev);
  const seat = s.current;
  const before = s.hands[seat].length;
  drawFrom(s, seat, 1, rng);
  const drawn = s.hands[seat].length > before ? s.hands[seat][s.hands[seat].length - 1] : null;
  if (drawn && canPlay(drawn, s)) {
    s.message = 'Drew a playable card.';
    return { state: s, drawn };
  }
  // pass
  s.current = nextIdx(s);
  s.message = '';
  return { state: s, drawn: null };
}

function applyEffectAndAdvance(s: CCState, c: Card, rng: Rng) {
  if (c.kind === 'reverse') {
    s.dir = (s.dir * -1) as 1 | -1;
    if (s.numPlayers === 2) {
      // reverse acts like skip in 2p
      s.current = nextIdx(s, s.current, 2);
      return;
    }
  }
  if (c.kind === 'skip') {
    s.current = nextIdx(s, s.current, 2);
    return;
  }
  if (c.kind === 'draw2') {
    const victim = nextIdx(s);
    drawFrom(s, victim, 2, rng);
    s.current = nextIdx(s, s.current, 2);
    return;
  }
  s.current = nextIdx(s);
}

function structuredCloneState(s: CCState): CCState {
  return {
    ...s,
    hands: s.hands.map((h) => h.slice()),
    drawPile: s.drawPile.slice(),
    discard: s.discard.slice()
  };
}

export const cardLabel = (c: Card): string => {
  if (typeof c.kind === 'number') return String(c.kind);
  return { skip: '⊘', reverse: '⇄', draw2: '+2', wild: '★', wild4: '+4' }[c.kind];
};
