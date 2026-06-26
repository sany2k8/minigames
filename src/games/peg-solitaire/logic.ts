export const SIZE = 7;
export type Board = Int8Array; // -1 invalid, 0 empty, 1 peg

export const valid = (r: number, c: number) => (r >= 2 && r <= 4) || (c >= 2 && c <= 4);

export function initBoard(): Board {
  const b = new Int8Array(SIZE * SIZE).fill(-1);
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (valid(r, c)) b[r * SIZE + c] = 1;
  b[3 * SIZE + 3] = 0; // center empty
  return b;
}

export interface Move {
  from: number;
  over: number;
  to: number;
}

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];

export function legalMoves(b: Board): Move[] {
  const out: Move[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (b[r * SIZE + c] !== 1) continue;
      for (const [dr, dc] of DIRS) {
        const or = r + dr;
        const oc = c + dc;
        const tr = r + 2 * dr;
        const tc = c + 2 * dc;
        if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) continue;
        if (b[or * SIZE + oc] === 1 && b[tr * SIZE + tc] === 0) {
          out.push({ from: r * SIZE + c, over: or * SIZE + oc, to: tr * SIZE + tc });
        }
      }
    }
  return out;
}

export function applyMove(b: Board, m: Move): Board {
  const nb = b.slice() as Board;
  nb[m.from] = 0;
  nb[m.over] = 0;
  nb[m.to] = 1;
  return nb;
}

export function movesFrom(b: Board, from: number): Move[] {
  return legalMoves(b).filter((m) => m.from === from);
}

export function pegsLeft(b: Board): number {
  let n = 0;
  for (let i = 0; i < b.length; i++) if (b[i] === 1) n++;
  return n;
}

export const isSolvedSingle = (b: Board) => pegsLeft(b) === 1;
export const centerCleared = (b: Board) => b[3 * SIZE + 3] === 1;

export function scoreOf(b: Board): number {
  const left = pegsLeft(b);
  let score = (32 - left) * 100; // 32 pegs at the start
  if (left === 1) score += 1500 + (centerCleared(b) ? 1000 : 0);
  return score;
}
