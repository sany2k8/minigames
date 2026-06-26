export const DOTS = 5; // 5x5 dots => 4x4 boxes
export const BOXES = DOTS - 1;

export interface DBState {
  h: boolean[]; // horizontal edges: DOTS rows x (DOTS-1) cols
  v: boolean[]; // vertical edges: (DOTS-1) rows x DOTS cols
  owner: Int8Array; // BOXES x BOXES, seat or -1
}

export type Edge = { type: 'h' | 'v'; r: number; c: number };

export const hIdx = (r: number, c: number) => r * (DOTS - 1) + c;
export const vIdx = (r: number, c: number) => r * DOTS + c;
export const boxIdx = (r: number, c: number) => r * BOXES + c;

export function emptyState(): DBState {
  return {
    h: Array(DOTS * (DOTS - 1)).fill(false),
    v: Array((DOTS - 1) * DOTS).fill(false),
    owner: new Int8Array(BOXES * BOXES).fill(-1)
  };
}

export function allEdges(): Edge[] {
  const out: Edge[] = [];
  for (let r = 0; r < DOTS; r++) for (let c = 0; c < DOTS - 1; c++) out.push({ type: 'h', r, c });
  for (let r = 0; r < DOTS - 1; r++) for (let c = 0; c < DOTS; c++) out.push({ type: 'v', r, c });
  return out;
}

export const hasEdge = (s: DBState, e: Edge) => (e.type === 'h' ? s.h[hIdx(e.r, e.c)] : s.v[vIdx(e.r, e.c)]);

export const openEdges = (s: DBState) => allEdges().filter((e) => !hasEdge(s, e));

/** Number of drawn sides of box (r,c). */
export function boxSides(s: DBState, r: number, c: number): number {
  let n = 0;
  if (s.h[hIdx(r, c)]) n++;
  if (s.h[hIdx(r + 1, c)]) n++;
  if (s.v[vIdx(r, c)]) n++;
  if (s.v[vIdx(r, c + 1)]) n++;
  return n;
}

const clone = (s: DBState): DBState => ({ h: s.h.slice(), v: s.v.slice(), owner: s.owner.slice() });

/** Draw an edge for seat. Returns new state + boxes completed by this move. */
export function applyEdge(s: DBState, e: Edge, seat: number): { state: DBState; completed: number } {
  const ns = clone(s);
  if (e.type === 'h') ns.h[hIdx(e.r, e.c)] = true;
  else ns.v[vIdx(e.r, e.c)] = true;

  const boxes: [number, number][] = [];
  if (e.type === 'h') {
    if (e.r > 0) boxes.push([e.r - 1, e.c]);
    if (e.r < BOXES) boxes.push([e.r, e.c]);
  } else {
    if (e.c > 0) boxes.push([e.r, e.c - 1]);
    if (e.c < BOXES) boxes.push([e.r, e.c]);
  }
  let completed = 0;
  for (const [r, c] of boxes) {
    if (boxSides(ns, r, c) === 4 && ns.owner[boxIdx(r, c)] === -1) {
      ns.owner[boxIdx(r, c)] = seat;
      completed++;
    }
  }
  return { state: ns, completed };
}

export const isOver = (s: DBState) => s.owner.every((o) => o !== -1);

/** Does drawing this edge complete at least one box? */
function completes(s: DBState, e: Edge, seat: number): number {
  return applyEdge(s, e, seat).completed;
}

/** How many boxes would become 3-sided (giveaways) if we draw this edge. */
function giveaways(s: DBState, e: Edge): number {
  const ns = applyEdge(s, e, 0).state; // seat irrelevant for counting sides
  let n = 0;
  for (let r = 0; r < BOXES; r++)
    for (let c = 0; c < BOXES; c++) if (boxSides(ns, r, c) === 3 && ns.owner[boxIdx(r, c)] === -1) n++;
  return n;
}

/** Heuristic bot move. */
export function botMove(s: DBState, seat: number, difficulty: 'easy' | 'medium' | 'hard'): Edge {
  const open = openEdges(s);
  // 1) take any box you can
  const taking = open.filter((e) => completes(s, e, seat) > 0);
  if (taking.length) {
    taking.sort((a, b) => completes(s, b, seat) - completes(s, a, seat));
    return taking[0];
  }
  if (difficulty === 'easy') return open[Math.floor(Math.random() * open.length)];

  // 2) safe moves that don't create a 3-sided box
  const safe = open.filter((e) => giveaways(s, e) === 0);
  if (safe.length) return safe[Math.floor(Math.random() * safe.length)];

  // 3) least damaging move
  return open.slice().sort((a, b) => giveaways(s, a) - giveaways(s, b))[0];
}

export function scoreOf(s: DBState, seat: number): number {
  let n = 0;
  for (let i = 0; i < s.owner.length; i++) if (s.owner[i] === seat) n++;
  return n;
}
