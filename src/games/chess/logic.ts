/**
 * Self-contained chess engine: full legal move generation (castling, en passant,
 * auto-queen promotion), check / checkmate / stalemate detection, draw rules, and
 * a negamax + alpha-beta bot. Pure — no React, no DOM. This is what tests target.
 *
 * Board: Int8Array(64), index = row*8 + col, row 0 = top (black back rank).
 * Seat 0 = White (positive piece codes, starts at the bottom, moves first).
 * Seat 1 = Black (negative piece codes, starts at the top).
 * Piece codes: 1 P, 2 N, 3 B, 4 R, 5 Q, 6 K (negated for black).
 */
export type Board = Int8Array;

export const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
// castling-rights bitmask
const WK = 1, WQ = 2, BK = 4, BQ = 8;

export const typeOf = (v: number) => Math.abs(v);
export const seatOf = (v: number) => (v === 0 ? -1 : v > 0 ? 0 : 1);
const inb = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

export interface ChessState {
  board: Board;
  turn: number; // 0 = white, 1 = black
  castling: number; // WK|WQ|BK|BQ bits
  ep: number; // en-passant target square, or -1
  half: number; // halfmove clock for the 50-move rule
}

export interface Move {
  from: number;
  to: number;
  /** 0 normal, 1 double pawn push, 2 en-passant capture, 3 castle, 4 promotion */
  flag: number;
}

export function initState(): ChessState {
  const b = new Int8Array(64);
  const back = [R, N, B, Q, K, B, N, R];
  for (let c = 0; c < 8; c++) {
    b[c] = -back[c]; // black back rank (row 0)
    b[8 + c] = -P; // black pawns (row 1)
    b[48 + c] = P; // white pawns (row 6)
    b[56 + c] = back[c]; // white back rank (row 7)
  }
  return { board: b, turn: 0, castling: WK | WQ | BK | BQ, ep: -1, half: 0 };
}

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const AROUND = [...DIAG, ...ORTH];

/** Is square `sq` attacked by any piece of seat `by`? */
export function attacked(b: Board, sq: number, by: number): boolean {
  const r = sq >> 3, c = sq & 7;
  const sign = by === 0 ? 1 : -1;
  // pawns: a `by` pawn attacks one rank toward its opponent
  const pr = by === 0 ? r + 1 : r - 1; // square the attacking pawn sits on
  for (const dc of [-1, 1]) if (inb(pr, c + dc) && b[pr * 8 + c + dc] === sign * P) return true;
  for (const [dr, dc] of KN) if (inb(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === sign * N) return true;
  for (const [dr, dc] of AROUND) if (inb(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === sign * K) return true;
  for (const [dr, dc] of DIAG) {
    let rr = r + dr, cc = c + dc;
    while (inb(rr, cc)) {
      const v = b[rr * 8 + cc];
      if (v !== 0) {
        if (v === sign * B || v === sign * Q) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  for (const [dr, dc] of ORTH) {
    let rr = r + dr, cc = c + dc;
    while (inb(rr, cc)) {
      const v = b[rr * 8 + cc];
      if (v !== 0) {
        if (v === sign * R || v === sign * Q) return true;
        break;
      }
      rr += dr; cc += dc;
    }
  }
  return false;
}

export function kingSquare(b: Board, seat: number): number {
  const code = seat === 0 ? K : -K;
  for (let i = 0; i < 64; i++) if (b[i] === code) return i;
  return -1;
}

export const inCheck = (s: ChessState, seat: number) => attacked(s.board, kingSquare(s.board, seat), 1 - seat);

/** Pseudo-legal moves (may leave own king in check) for the side to move. */
function pseudoMoves(s: ChessState): Move[] {
  const b = s.board;
  const seat = s.turn;
  const sign = seat === 0 ? 1 : -1;
  const out: Move[] = [];
  const slide = (i: number, dirs: number[][]) => {
    const r = i >> 3, c = i & 7;
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inb(rr, cc)) {
        const t = rr * 8 + cc;
        if (b[t] === 0) out.push({ from: i, to: t, flag: 0 });
        else {
          if (seatOf(b[t]) !== seat) out.push({ from: i, to: t, flag: 0 });
          break;
        }
        rr += dr; cc += dc;
      }
    }
  };
  for (let i = 0; i < 64; i++) {
    const v = b[i];
    if (v === 0 || seatOf(v) !== seat) continue;
    const r = i >> 3, c = i & 7;
    const t = typeOf(v);
    if (t === P) {
      const dir = seat === 0 ? -1 : 1; // white moves up (toward row 0)
      const startRow = seat === 0 ? 6 : 1;
      const promoRow = seat === 0 ? 0 : 7;
      const one = (r + dir) * 8 + c;
      if (inb(r + dir, c) && b[one] === 0) {
        out.push({ from: i, to: one, flag: r + dir === promoRow ? 4 : 0 });
        if (r === startRow && b[(r + 2 * dir) * 8 + c] === 0)
          out.push({ from: i, to: (r + 2 * dir) * 8 + c, flag: 1 });
      }
      for (const dc of [-1, 1]) {
        const cr = r + dir, cc = c + dc;
        if (!inb(cr, cc)) continue;
        const t2 = cr * 8 + cc;
        if (b[t2] !== 0 && seatOf(b[t2]) === 1 - seat)
          out.push({ from: i, to: t2, flag: cr === promoRow ? 4 : 0 });
        else if (t2 === s.ep) out.push({ from: i, to: t2, flag: 2 });
      }
    } else if (t === N) {
      for (const [dr, dc] of KN) {
        if (!inb(r + dr, c + dc)) continue;
        const to = (r + dr) * 8 + c + dc;
        if (b[to] === 0 || seatOf(b[to]) !== seat) out.push({ from: i, to, flag: 0 });
      }
    } else if (t === B) slide(i, DIAG);
    else if (t === R) slide(i, ORTH);
    else if (t === Q) slide(i, AROUND);
    else if (t === K) {
      for (const [dr, dc] of AROUND) {
        if (!inb(r + dr, c + dc)) continue;
        const to = (r + dr) * 8 + c + dc;
        if (b[to] === 0 || seatOf(b[to]) !== seat) out.push({ from: i, to, flag: 0 });
      }
      // castling
      const homeRow = seat === 0 ? 7 : 0;
      if (r === homeRow && c === 4 && !attacked(b, i, 1 - seat)) {
        const kRight = seat === 0 ? WK : BK;
        const qRight = seat === 0 ? WQ : BQ;
        const rook = sign * R;
        if (s.castling & kRight && b[i + 1] === 0 && b[i + 2] === 0 && b[i + 3] === rook &&
          !attacked(b, i + 1, 1 - seat) && !attacked(b, i + 2, 1 - seat))
          out.push({ from: i, to: i + 2, flag: 3 });
        if (s.castling & qRight && b[i - 1] === 0 && b[i - 2] === 0 && b[i - 3] === 0 && b[i - 4] === rook &&
          !attacked(b, i - 1, 1 - seat) && !attacked(b, i - 2, 1 - seat))
          out.push({ from: i, to: i - 2, flag: 3 });
      }
    }
  }
  return out;
}

export function applyMove(s: ChessState, m: Move): ChessState {
  const b = s.board.slice() as Board;
  const seat = s.turn;
  const sign = seat === 0 ? 1 : -1;
  const piece = b[m.from];
  const captured = b[m.to] !== 0 || m.flag === 2;
  b[m.from] = 0;
  if (m.flag === 2) b[m.to + (seat === 0 ? 8 : -8)] = 0; // en-passant: remove the passed pawn
  if (m.flag === 4) b[m.to] = sign * Q; // auto-queen
  else b[m.to] = piece;
  if (m.flag === 3) {
    // move the rook to the other side of the king
    if (m.to > m.from) { b[m.to + 1] = 0; b[m.to - 1] = sign * R; } // kingside
    else { b[m.to - 2] = 0; b[m.to + 1] = sign * R; } // queenside
  }
  let cr = s.castling;
  for (const [sq, mask] of [[60, WK | WQ], [63, WK], [56, WQ], [4, BK | BQ], [7, BK], [0, BQ]] as const)
    if (m.from === sq || m.to === sq) cr &= ~mask;
  const ep = m.flag === 1 ? (m.from + m.to) / 2 : -1;
  const half = typeOf(piece) === P || captured ? 0 : s.half + 1;
  return { board: b, turn: 1 - seat, castling: cr, ep, half };
}

export function legalMoves(s: ChessState): Move[] {
  const seat = s.turn;
  return pseudoMoves(s).filter((m) => {
    const ns = applyMove(s, m);
    return !attacked(ns.board, kingSquare(ns.board, seat), 1 - seat);
  });
}

/** Not enough material for either side to checkmate. */
export function insufficientMaterial(b: Board): boolean {
  const minors: number[] = [];
  for (let i = 0; i < 64; i++) {
    const t = typeOf(b[i]);
    if (t === 0 || t === K) continue;
    if (t === P || t === R || t === Q) return false;
    minors.push(i);
  }
  return minors.length <= 1; // K vs K, or K(+1 minor) vs K
}

export type Status = 'playing' | 'checkmate' | 'stalemate' | 'draw';

export function status(s: ChessState): Status {
  if (legalMoves(s).length === 0) return inCheck(s, s.turn) ? 'checkmate' : 'stalemate';
  if (s.half >= 100 || insufficientMaterial(s.board)) return 'draw';
  return 'playing';
}

// ---- Bot: negamax + alpha-beta --------------------------------------------
const VAL = [0, 100, 320, 330, 500, 900, 0];
// piece-square tables from white's view (index 0 = a8 / top-left), midgame-ish
const PST_P = [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0];
const PST_N = [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50];
const PST_B = [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20];
const PST_R = [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0];
const PST_Q = [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20];
const PST_K = [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20];
const PST = [null, PST_P, PST_N, PST_B, PST_R, PST_Q, PST_K];

/** Static eval from the perspective of the side to move (positive = good). */
function evaluate(s: ChessState): number {
  const b = s.board;
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const v = b[i];
    if (v === 0) continue;
    const t = typeOf(v);
    const seat = seatOf(v);
    const pst = PST[t]![seat === 0 ? i : i ^ 56];
    score += seat === 0 ? VAL[t] + pst : -(VAL[t] + pst);
  }
  return s.turn === 0 ? score : -score;
}

function orderMoves(s: ChessState, moves: Move[]): Move[] {
  const b = s.board;
  return moves
    .map((m) => {
      const cap = typeOf(b[m.to]);
      const score = (cap ? VAL[cap] * 8 - VAL[typeOf(b[m.from])] : 0) + (m.flag === 4 ? 800 : 0);
      return { m, score };
    })
    .sort((a, z) => z.score - a.score)
    .map((x) => x.m);
}

function negamax(s: ChessState, depth: number, alpha: number, beta: number): number {
  const moves = legalMoves(s);
  if (moves.length === 0) return inCheck(s, s.turn) ? -100000 - depth : 0; // mate (prefer quicker) / stalemate
  if (depth === 0) return evaluate(s);
  let best = -Infinity;
  for (const m of orderMoves(s, moves)) {
    const score = -negamax(applyMove(s, m), depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Pick a move for the side to move. `rnd` (0..1) breaks ties / adds easy-mode
 * blunders deterministically when supplied by the caller.
 */
export function bestMove(s: ChessState, difficulty: 'easy' | 'medium' | 'hard', rnd = Math.random()): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  if (difficulty === 'easy' && rnd < 0.5) {
    // half the time, just grab the best immediate-capture-or-random move (1-ply)
    const ordered = orderMoves(s, moves);
    return ordered[Math.min(ordered.length - 1, Math.floor(rnd * 3))];
  }
  const depth = difficulty === 'hard' ? 3 : 2;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of orderMoves(s, moves)) {
    const score = -negamax(applyMove(s, m), depth - 1, -Infinity, Infinity);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}
