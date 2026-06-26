export const N = 8;
// 0 empty, 1 seat0 man, 2 seat0 king, 3 seat1 man, 4 seat1 king
export type Board = Int8Array;

export const seatOf = (v: number) => (v === 0 ? -1 : v <= 2 ? 0 : 1);
export const isKing = (v: number) => v === 2 || v === 4;
const dark = (r: number, c: number) => (r + c) % 2 === 1;
const inb = (r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N;

export interface Move {
  from: number;
  path: number[]; // squares landed on (last = final)
  captured: number[];
}

export function initBoard(): Board {
  const b = new Int8Array(N * N);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (!dark(r, c)) continue;
      if (r < 3) b[r * N + c] = 3; // seat1 (top)
      else if (r > 4) b[r * N + c] = 1; // seat0 (bottom)
    }
  return b;
}

const dirsFor = (v: number): number[][] => {
  if (isKing(v)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return seatOf(v) === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
};

function jumps(b: Board, pos: number, v: number, captured: number[], path: number[]): Move[] {
  const r = Math.floor(pos / N);
  const c = pos % N;
  const seat = seatOf(v);
  const out: Move[] = [];
  for (const [dr, dc] of dirsFor(v)) {
    const mr = r + dr;
    const mc = c + dc;
    const tr = r + 2 * dr;
    const tc = c + 2 * dc;
    if (!inb(tr, tc)) continue;
    const mid = mr * N + mc;
    const to = tr * N + tc;
    const midV = b[mid];
    if (midV !== 0 && seatOf(midV) === 1 - seat && !captured.includes(mid) && b[to] === 0) {
      const nb = b.slice() as Board;
      nb[pos] = 0;
      nb[to] = v;
      const cont = jumps(nb, to, v, [...captured, mid], [...path, to]);
      if (cont.length) out.push(...cont);
      else out.push({ from: path[0], path: [...path, to], captured: [...captured, mid] });
    }
  }
  return out;
}

export function legalMoves(b: Board, seat: number): Move[] {
  const caps: Move[] = [];
  const steps: Move[] = [];
  for (let i = 0; i < b.length; i++) {
    const v = b[i];
    if (v === 0 || seatOf(v) !== seat) continue;
    caps.push(...jumps(b, i, v, [], [i]));
    const r = Math.floor(i / N);
    const c = i % N;
    for (const [dr, dc] of dirsFor(v)) {
      const tr = r + dr;
      const tc = c + dc;
      if (inb(tr, tc) && dark(tr, tc) && b[tr * N + tc] === 0)
        steps.push({ from: i, path: [tr * N + tc], captured: [] });
    }
  }
  return caps.length ? caps : steps;
}

export function applyMove(b: Board, m: Move): Board {
  const nb = b.slice() as Board;
  let v = nb[m.from];
  nb[m.from] = 0;
  for (const cap of m.captured) nb[cap] = 0;
  const last = m.path[m.path.length - 1];
  const lr = Math.floor(last / N);
  if (v === 1 && lr === 0) v = 2; // promote seat0
  if (v === 3 && lr === N - 1) v = 4; // promote seat1
  nb[last] = v;
  return nb;
}

export function count(b: Board, seat: number): number {
  let n = 0;
  for (let i = 0; i < b.length; i++) if (b[i] !== 0 && seatOf(b[i]) === seat) n++;
  return n;
}

export const hasMoves = (b: Board, seat: number) => legalMoves(b, seat).length > 0;

const material = (b: Board, seat: number) => {
  let s = 0;
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 0) continue;
    const val = isKing(b[i]) ? 3 : 1;
    s += seatOf(b[i]) === seat ? val : -val;
  }
  return s;
};

export function botMove(b: Board, seat: number, difficulty: 'easy' | 'medium' | 'hard'): Move | null {
  const moves = legalMoves(b, seat);
  if (!moves.length) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const nb = applyMove(b, m);
    let score = m.captured.length * 2 + material(nb, seat);
    if (difficulty === 'hard') {
      // opponent's best reply (1-ply look-ahead)
      const reply = legalMoves(nb, 1 - seat);
      const oppCap = reply.reduce((mx, r) => Math.max(mx, r.captured.length), 0);
      score -= oppCap * 1.5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
